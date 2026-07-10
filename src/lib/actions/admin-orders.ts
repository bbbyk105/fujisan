"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, desc, eq, ne } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAuth } from "@/lib/auth";
import { getEffectiveAdminRole, isOwner, isStaffOrAbove } from "@/lib/admin";
import { getStripe } from "@/lib/stripe";
import { getDb } from "@/db";
import {
  order as orderTable,
  ORDER_STATUSES,
  type OrderLine,
  type OrderStatus,
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
 * 管理者（owner）向け: 注文を全額返金する。
 *
 * - Stripe の PaymentIntent に対して `refunds.create` を実行し、成功したら
 *   注文ステータスを `refunded` にして返金メールを送る。
 * - 冪等: Stripe には orderId ベースの idempotencyKey を渡し、DB 更新は
 *   `status != 'refunded'` の WHERE 付きで原子的に行う（二重返金を防ぐ）。
 * - 返金対象は「支払い済み・未返金」の注文のみ（pending / cancelled / refunded は不可）。
 * - 破損・誤配送などの実務対応を想定した全額返金。部分返金は将来対応。
 */
export async function adminRefundOrderAction(input: {
  orderId: string;
}): Promise<
  | { ok: true }
  | {
      ok: false;
      error:
        | "unauth"
        | "forbidden"
        | "invalid"
        | "not_refundable"
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

  // 支払い済み・未返金のみ返金可能。
  if (
    !REFUNDABLE_STATUSES.includes(current.status as OrderStatus) ||
    !current.stripeSessionId
  ) {
    return { ok: false, error: "not_refundable" };
  }

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

  // Stripe 側で返金を実行（全額）。idempotencyKey で再実行時の二重返金を防ぐ。
  let refundId: string;
  try {
    const refund = await stripe.refunds.create(
      { payment_intent: paymentIntentId },
      { idempotencyKey: `refund_${current.id}` },
    );
    refundId = refund.id;
  } catch {
    return { ok: false, error: "stripe" };
  }

  // DB を原子的に refunded へ。既に他操作で返金済みなら更新行ゼロ（メールも送らない）。
  let updated;
  try {
    const db = await getDb();
    updated = await db
      .update(orderTable)
      .set({
        status: "refunded",
        stripeRefundId: refundId,
        stripePaymentIntentId: paymentIntentId,
        refundedAt: new Date(),
      })
      .where(
        and(
          eq(orderTable.id, current.id),
          ne(orderTable.status, "refunded"),
        ),
      )
      .returning({ id: orderTable.id });
  } catch {
    // Stripe 返金は成立済み。DB 反映のみ失敗 → 手動で status を直せるようログを残す。
    console.error(
      `[admin:refund] Stripe 返金は成立したが DB 更新に失敗: order=${current.id} refund=${refundId}`,
    );
    return { ok: false, error: "db" };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/account");

  if (updated.length === 0) return { ok: true }; // 既に返金済み。メールは重複送信しない。

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
      refundAmount: current.total,
    });
  } catch (err) {
    console.error("[admin:refund] 返金メール送信に失敗:", err);
  }

  return { ok: true };
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
