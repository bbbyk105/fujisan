"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, desc, eq, isNull, ne } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAuth } from "@/lib/auth";
import { getEffectiveAdminRole, isOwner, isStaffOrAbove } from "@/lib/admin";
import { getStripe } from "@/lib/stripe";
import { getDb } from "@/db";
import { commitStock, releaseStock, restockCommitted } from "@/lib/inventory";
import {
  order as orderTable,
  ORDER_STATUSES,
  type OrderLine,
  type OrderStatus,
  hasLeftTheKura,
} from "@/db/orders-schema";
import {
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderRefundedEmail,
  type OrderEmailData,
} from "@/lib/emails/order-emails";

type AdminOrderListItem = {
  id: string;
  userId: string;
  orderRef: string;
  status: OrderStatus;
  items: OrderLine[];
  itemsCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  customerName: string;
  customerEmail: string;
  postalCode: string;
  address: string;
  phone: string;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  refundedAt: Date | null;
  /** これまでに返金した累計額（円）。null は返金なし。 */
  refundedAmount: number | null;
  /** お客様からのキャンセル依頼（発送前のみ）。未依頼なら null。 */
  cancelRequestedAt: Date | null;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

async function requireStaff(): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; reason: "unauth" | "forbidden" }
> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const u = session?.user as { id?: string; email?: string } | undefined;
  if (!u?.email || !u.id) return { ok: false, reason: "unauth" };
  const role = await getEffectiveAdminRole({ userId: u.id, email: u.email });
  if (!isStaffOrAbove(role)) return { ok: false, reason: "forbidden" };
  return { ok: true, userId: u.id, email: u.email };
}

/** 返金など「お金を動かす」操作は owner のみに限定する。 */
async function requireOwner(): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; reason: "unauth" | "forbidden" }
> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const u = session?.user as { id?: string; email?: string } | undefined;
  if (!u?.email || !u.id) return { ok: false, reason: "unauth" };
  const role = await getEffectiveAdminRole({ userId: u.id, email: u.email });
  if (!isOwner(role)) return { ok: false, reason: "forbidden" };
  return { ok: true, userId: u.id, email: u.email };
}

/** 返金可能なステータス（支払い済み・未返金）。 */
const REFUNDABLE_STATUSES: OrderStatus[] = [
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
];

/**
 * 管理者向け: 全注文を新しい順で取得する。非 admin にはエラー（空配列ではなく明示）。
 */
export async function adminListOrdersAction(): Promise<
  | { ok: true; orders: AdminOrderListItem[] }
  | { ok: false; error: "unauth" | "forbidden" | "db" }
> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  try {
    const db = await getDb();
    // 未払いで放棄された pending（住所未取得・空）は一覧に出さない。
    const rows = await db
      .select()
      .from(orderTable)
      .where(ne(orderTable.status, "pending"))
      .orderBy(desc(orderTable.createdAt))
      .limit(200);

    const orders = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      orderRef: row.orderRef,
      status: row.status as OrderStatus,
      items: safeParseItems(row.itemsJson),
      itemsCount: row.itemsCount,
      subtotal: row.subtotal,
      shipping: row.shipping,
      total: row.total,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      postalCode: row.postalCode,
      address: row.address,
      phone: row.phone,
      trackingCarrier: row.trackingCarrier,
      trackingNumber: row.trackingNumber,
      shippedAt: row.shippedAt ?? null,
      deliveredAt: row.deliveredAt ?? null,
      refundedAt: row.refundedAt ?? null,
      refundedAmount: row.refundedAmount ?? null,
      cancelRequestedAt: row.cancelRequestedAt ?? null,
      cancelReason: row.cancelReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
    return { ok: true, orders };
  } catch {
    return { ok: false, error: "db" };
  }
}

/**
 * 管理者向け: 1件の注文を更新する。
 * - status 変更時の補正:
 *   - shipped に進めた瞬間に shippedAt が未設定なら自動で「今」に
 *   - delivered に進めた瞬間に deliveredAt が未設定なら自動で「今」に
 * - 追跡情報は空文字を「クリア」として扱う
 *
 * 成功時は /admin/orders と /account をリバリデートして UI を最新化。
 */
export async function adminUpdateOrderAction(input: {
  orderId: string;
  status: OrderStatus;
  trackingCarrier?: string;
  trackingNumber?: string;
}): Promise<
  { ok: true } | { ok: false; error: "unauth" | "forbidden" | "invalid" | "db" }
> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  if (!input.orderId) return { ok: false, error: "invalid" };
  if (!ORDER_STATUSES.includes(input.status))
    return { ok: false, error: "invalid" };

  try {
    const db = await getDb();
    // 既存行を読み込む（自動補完の判断＋発送/お届けメールの内容に使う）
    const [current] = await db
      .select()
      .from(orderTable)
      .where(eq(orderTable.id, input.orderId))
      .limit(1);

    if (!current) return { ok: false, error: "invalid" };

    const prevStatus = current.status as OrderStatus;
    const now = new Date();
    const carrier = (input.trackingCarrier ?? "").trim();
    const number = (input.trackingNumber ?? "").trim();

    await db
      .update(orderTable)
      .set({
        status: input.status,
        trackingCarrier: carrier ? carrier : null,
        trackingNumber: number ? number : null,
        shippedAt:
          input.status === "shipped" && !current.shippedAt
            ? now
            : current.shippedAt,
        deliveredAt:
          input.status === "delivered" && !current.deliveredAt
            ? now
            : current.deliveredAt,
      })
      .where(eq(orderTable.id, input.orderId));

    revalidatePath("/admin/orders");
    revalidatePath("/account");

    // 手でステータスを動かしたときの在庫の辻褄合わせ。
    // Webhook の自動経路だけを見ていると、管理画面から直接動かした分がずれる。
    if (prevStatus !== input.status) {
      const items = safeParseItems(current.itemsJson);
      try {
        if (prevStatus === "pending" && input.status === "confirmed") {
          // 入金を手で確定した。押さえていた分を実在庫から落とす。
          await commitStock(items);
        } else if (input.status === "cancelled") {
          if (prevStatus === "pending") {
            // 未入金のまま取消。引き当てを戻すだけ（実在庫は減っていない）。
            await releaseStock(items);
          } else if (!hasLeftTheKura(prevStatus)) {
            // 入金済みだが未発送のまま取消。品物は蔵にあるので実在庫へ戻す。
            await restockCommitted(items);
          }
          // 発送後の取消は戻さない（品物が手元に無い）。返品を受け取ったら
          // /admin/products で足す。
        }
      } catch (err) {
        console.error("[admin:orders] 在庫の調整に失敗:", err);
      }
    }

    // ステータスが新たに shipped / delivered へ「変わった瞬間」だけ顧客へ通知する。
    // メール送信に失敗しても管理操作自体は成功させる（在庫・状態の更新は済んでいる）。
    if (prevStatus !== input.status) {
      const emailData: OrderEmailData = {
        orderRef: current.orderRef,
        customerName: current.customerName,
        customerEmail: current.customerEmail,
        items: safeParseItems(current.itemsJson),
        itemsCount: current.itemsCount,
        subtotal: current.subtotal,
        shipping: current.shipping,
        total: current.total,
        postalCode: current.postalCode,
        address: current.address,
        trackingCarrier: carrier || null,
        trackingNumber: number || null,
      };
      try {
        if (input.status === "shipped") {
          await sendOrderShippedEmail(emailData);
        } else if (input.status === "delivered") {
          await sendOrderDeliveredEmail(emailData);
        }
      } catch (err) {
        console.error("[admin:orders] 配送通知メールの送信に失敗:", err);
      }
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "db" };
  }
}

type RefundEnv = { STRIPE_SECRET_KEY?: string };

/**
 * 管理者（owner）向け: 注文を返金する。全額・一部のどちらも扱う。
 *
 * - `amountJpy` を省くと**残額を全額**返金する。指定するとその額だけ返す。
 * - 全額まで返し切ったときだけ status を `refunded` にする。一部返金では
 *   ステータスを動かさない — 一部返金した注文はまだ発送する予定のもので、
 *   「返金済み」の顔をさせると蔵側の作業一覧から消えてしまう。
 * - 冪等: Stripe には「注文 + 返金前の累計 + 今回の額」から作った
 *   idempotencyKey を渡す。ボタン連打では同じ鍵になるので二重に返らず、
 *   意図した 2 回目の返金（累計が進んでいる）では別の鍵になる。
 * - DB 更新は「返金前の累計」を WHERE に入れた原子的な UPDATE で行う。
 * - 返金対象は「支払い済み・未返金」の注文のみ（pending / cancelled は不可）。
 *
 * **在庫を戻すのは全額返金のときだけ。** 一部返金では、どの品を何本
 * 引き取ったのかが金額からは分からない。数えた分を `/admin/products` で足す。
 */
export async function adminRefundOrderAction(input: {
  orderId: string;
  /** 返金する金額（円）。省略すると残額を全額返金する。 */
  amountJpy?: number;
}): Promise<
  | { ok: true; refunded: number; remaining: number }
  | {
      ok: false;
      error:
        | "unauth"
        | "forbidden"
        | "invalid"
        | "not_refundable"
        | "amount"
        | "config"
        | "stripe"
        | "db";
    }
> {
  const gate = await requireOwner();
  if (!gate.ok) return { ok: false, error: gate.reason };
  if (!input.orderId) return { ok: false, error: "invalid" };

  let current;
  try {
    const db = await getDb();
    [current] = await db
      .select()
      .from(orderTable)
      .where(eq(orderTable.id, input.orderId))
      .limit(1);
  } catch {
    return { ok: false, error: "db" };
  }
  if (!current) return { ok: false, error: "invalid" };

  // 支払い済みのみ返金可能（pending / cancelled / refunded は不可）。
  if (
    !REFUNDABLE_STATUSES.includes(current.status as OrderStatus) ||
    !current.stripeSessionId
  ) {
    return { ok: false, error: "not_refundable" };
  }

  // 返金できるのは残額まで。既に一部返している注文では、その分を差し引く。
  const alreadyRefunded = current.refundedAmount ?? 0;
  const remainingBefore = current.total - alreadyRefunded;
  if (remainingBefore <= 0) return { ok: false, error: "not_refundable" };

  const amount = input.amountJpy ?? remainingBefore;
  if (
    !Number.isInteger(amount) ||
    amount < 1 ||
    amount > remainingBefore
  ) {
    return { ok: false, error: "amount" };
  }
  const isFullRefund = amount === remainingBefore;

  const { env } = await getCloudflareContext({ async: true });
  const e = env as RefundEnv;
  if (!e.STRIPE_SECRET_KEY) return { ok: false, error: "config" };
  const stripe = getStripe(e.STRIPE_SECRET_KEY);

  // 返金対象の PaymentIntent を特定（保存済み → 無ければ Session から取得）。
  let paymentIntentId = current.stripePaymentIntentId ?? null;
  if (!paymentIntentId) {
    try {
      const sess = await stripe.checkout.sessions.retrieve(
        current.stripeSessionId,
      );
      paymentIntentId =
        typeof sess.payment_intent === "string"
          ? sess.payment_intent
          : (sess.payment_intent?.id ?? null);
    } catch {
      return { ok: false, error: "stripe" };
    }
  }
  if (!paymentIntentId) return { ok: false, error: "not_refundable" };

  // Stripe 側で返金を実行。JPY は最小単位＝円なので、金額はそのまま渡す。
  // idempotencyKey に「返金前の累計」を混ぜているので、連打は同じ鍵＝1 回、
  // 意図した 2 回目は累計が進んで別の鍵になる。
  let refundId: string;
  try {
    const refund = await stripe.refunds.create(
      { payment_intent: paymentIntentId, amount },
      {
        idempotencyKey: `refund_${current.id}_${alreadyRefunded}_${amount}`,
      },
    );
    refundId = refund.id;
  } catch {
    return { ok: false, error: "stripe" };
  }

  // DB へ原子的に反映する。WHERE に「返金前の累計」を入れているので、
  // 同時に別経路（Webhook など）が先に反映していたら更新行ゼロになり、
  // 累計を二重に足すこともメールを重複送信することも無い。
  const totalRefunded = alreadyRefunded + amount;
  let updated;
  try {
    const db = await getDb();
    updated = await db
      .update(orderTable)
      .set({
        // 全額返し切ったときだけ終端ステータスへ移す。
        ...(isFullRefund ? { status: "refunded" as const } : {}),
        stripeRefundId: refundId,
        stripePaymentIntentId: paymentIntentId,
        refundedAt: new Date(),
        refundedAmount: totalRefunded,
      })
      .where(
        and(
          eq(orderTable.id, current.id),
          ne(orderTable.status, "refunded"),
          alreadyRefunded === 0
            ? isNull(orderTable.refundedAmount)
            : eq(orderTable.refundedAmount, alreadyRefunded),
        ),
      )
      .returning({ id: orderTable.id });
  } catch {
    // Stripe 返金は成立済み。DB 反映のみ失敗 → 手動で直せるようログを残す。
    console.error(
      `[admin:refund] Stripe 返金は成立したが DB 更新に失敗: order=${current.id} refund=${refundId} amount=${amount}`,
    );
    return { ok: false, error: "db" };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/account");

  // 既に反映済み（Webhook が先着した等）。メールは重複送信しない。
  if (updated.length === 0) {
    return { ok: true, refunded: totalRefunded, remaining: 0 };
  }

  // 未発送のまま**全額**返金したなら品物は蔵にあるので在庫に戻す。
  // 発送後は手元に無いので戻さない（返品を受け取ったら /admin/products で足す）。
  // 一部返金では戻さない — 金額からは、どの品を何本引き取ったか分からない。
  if (isFullRefund && !hasLeftTheKura(current.status as OrderStatus)) {
    try {
      await restockCommitted(safeParseItems(current.itemsJson));
    } catch (err) {
      console.error("[admin:refund] 返金に伴う在庫の戻しに失敗:", err);
    }
  }

  // 返金メール（ベストエフォート。失敗しても返金自体は成立している）。
  try {
    await sendOrderRefundedEmail({
      orderRef: current.orderRef,
      customerName: current.customerName,
      customerEmail: current.customerEmail,
      items: safeParseItems(current.itemsJson),
      itemsCount: current.itemsCount,
      subtotal: current.subtotal,
      shipping: current.shipping,
      total: current.total,
      postalCode: current.postalCode,
      address: current.address,
      refundAmount: amount,
      partial: !isFullRefund,
    });
  } catch (err) {
    console.error("[admin:refund] 返金メール送信に失敗:", err);
  }

  return {
    ok: true,
    refunded: totalRefunded,
    remaining: current.total - totalRefunded,
  };
}

function safeParseItems(json: string): OrderLine[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed as OrderLine[];
  } catch {
    return [];
  }
}
