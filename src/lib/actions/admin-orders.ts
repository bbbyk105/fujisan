"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, desc, eq, gte, isNull, lt, ne, or } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAuth } from "@/lib/auth";
import { getEffectiveAdminRole, isOwner, isStaffOrAbove } from "@/lib/admin";
import { getStripe } from "@/lib/stripe";
import { toCsv } from "@/lib/csv";
import { orderStatusJp } from "@/data/fujisan-orders";
import { formatDateTimeJp } from "@/lib/format-date";
import { getDb } from "@/db";
import { reserveStock } from "@/lib/inventory";
import { alertOps } from "@/lib/ops-alert";
import { applyStockMove } from "@/lib/order-stock";
import {
  order as orderTable,
  ORDER_STATUSES,
  type OrderLine,
  type OrderStatus,
  isRefundable,
  parseOrderItems,
  stockStateFor,
  willStillShip,
} from "@/db/orders-schema";
import {
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderRefundedEmail,
  type OrderEmailData,
} from "@/lib/emails/order-emails";

type AdminOrderListItem = {
  id: string;
  /** ゲスト購入と、退会したお客様の注文は null（注文の記録だけが残る）。 */
  userId: string | null;
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
  /** 入金を確認した日時。手で確定した注文は null のことがある。 */
  paidAt: Date | null;
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

/** 注文一覧・CSV で共通に使う絞り込み。 */
export type AdminOrderFilter = {
  /** 期間の開始（この日の 0:00 JST から）。YYYY-MM-DD。 */
  from?: string;
  /** 期間の終了（この日の 23:59:59 JST まで）。YYYY-MM-DD。 */
  to?: string;
};

/** 品物が蔵にあるはずのステータス。 */
const BEFORE_SHIPMENT: OrderStatus[] = ["pending", "confirmed", "preparing"];

/**
 * 絞り込みを SQL の条件にする。
 *
 * 期間は**日本時間で解釈する**。Worker は UTC で動くので、`new Date("2026-09-01")`
 * をそのまま使うと JST の 9:00 起点になり、午前の注文が前日に落ちる。
 */
function orderFilterWhere(filter: AdminOrderFilter | undefined) {
  // 未払いで放棄された注文は出さない。手で pending へ戻した注文は引き当て中ではないので
  // 残す（在庫を引き落としてあり、消えると確定へ戻すことも返金もできなくなる）。
  const conditions = [
    or(
      ne(orderTable.status, "pending"),
      ne(orderTable.stockState, "reserved"),
    ),
  ];

  const from = parseJstDate(filter?.from);
  if (from) conditions.push(gte(orderTable.createdAt, from));

  const to = parseJstDate(filter?.to);
  if (to) {
    // 終了日は「その日いっぱい」を含める。日付だけ指定して当日の注文が
    // 入らないと、指定が効いていないように見える。
    conditions.push(lt(orderTable.createdAt, new Date(to.getTime() + DAY_MS)));
  }

  return and(...conditions);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" を日本時間のその日 0:00 として解釈する。不正なら undefined。 */
function parseJstDate(value: string | undefined): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  // 末尾の +09:00 で日本時間として読ませる。
  const parsed = new Date(`${value}T00:00:00+09:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * 管理者向け: 注文を新しい順で取得する。非 admin にはエラー（空配列ではなく明示）。
 */
export async function adminListOrdersAction(
  filter?: AdminOrderFilter,
): Promise<
  | { ok: true; orders: AdminOrderListItem[] }
  | { ok: false; error: "unauth" | "forbidden" | "db" }
> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(orderTable)
      .where(orderFilterWhere(filter))
      .orderBy(desc(orderTable.createdAt))
      .limit(200);

    const orders = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      orderRef: row.orderRef,
      status: row.status as OrderStatus,
      items: parseOrderItems(row.itemsJson),
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
      paidAt: row.paidAt ?? null,
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
  /** 画面を開いたときのステータス。今の値と違えば、古い画面の内容で上書きしない。 */
  expectedStatus?: OrderStatus;
  trackingCarrier?: string;
  trackingNumber?: string;
}): Promise<
  | { ok: true }
  | {
      ok: false;
      error:
        | "unauth"
        | "forbidden"
        | "invalid"
        | "refunded"
        | "conflict"
        | "stock"
        | "db";
    }
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
    // 全額返金は終端で、返金の操作からしか到達しない。動かすと発送の一覧へ戻ったり、
    // お金を返していないのに返金済みになったりする。
    if ((prevStatus === "refunded") !== (input.status === "refunded")) {
      return { ok: false, error: "refunded" };
    }
    if (input.expectedStatus && input.expectedStatus !== prevStatus) {
      return { ok: false, error: "conflict" };
    }

    const stockFrom = current.stockState;
    const stockTo =
      input.status === prevStatus
        ? stockFrom
        : stockStateFor(input.status, stockFrom);

    // 取り消した注文を戻すと引き落とし直しになる。売れて足りなければ何も変えずに止める。
    const reopening = stockFrom === "none" && stockTo !== "none";
    if (reopening) {
      const reservation = await reserveStock(parseOrderItems(current.itemsJson));
      if (!reservation.ok) {
        return {
          ok: false,
          error: reservation.reason === "shortage" ? "stock" : "db",
        };
      }
    }

    const now = new Date();
    const carrier = (input.trackingCarrier ?? "").trim();
    const number = (input.trackingNumber ?? "").trim();

    // 読んだときの状態のままなら更新する。あいだに Webhook や別の操作が入っていたら、
    // 古い値で上書きしない（返金済みを確定へ戻してしまう）。ステータスと在庫の状態を
    // 1 文で動かすので、本数を動かすのは更新できた処理だけになる。
    let updated: Array<{ id: string }> = [];
    try {
      updated = await db
        .update(orderTable)
        .set({
          status: input.status,
          stockState: stockTo,
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
        .where(
          and(
            eq(orderTable.id, input.orderId),
            eq(orderTable.status, prevStatus),
            eq(orderTable.stockState, stockFrom),
          ),
        )
        .returning({ id: orderTable.id });
    } finally {
      // 押さえたまま終わると、売れる本数が減ったままになる。
      if (reopening && updated.length === 0) {
        await applyStockMove(current, "reserved", "none");
      }
    }

    if (updated.length === 0) return { ok: false, error: "conflict" };

    revalidatePath("/admin/orders");
    revalidatePath("/account");

    // 手でステータスを動かしたときの在庫の辻褄合わせ。
    // Webhook の自動経路だけを見ていると、管理画面から直接動かした分がずれる。
    await applyStockMove(current, reopening ? "reserved" : stockFrom, stockTo);

    // 発送済みから戻しても、蔵を出た扱いは解かない（`stockStateFor`）。品物が蔵にあるなら
    // 人が足す必要があるので、気づけるように知らせる。
    if (
      stockTo === "shipped" &&
      BEFORE_SHIPMENT.includes(input.status) &&
      !BEFORE_SHIPMENT.includes(prevStatus)
    ) {
      await alertOps(
        "発送済みから戻した注文があります",
        [
          `注文番号: ${current.orderRef}`,
          "",
          "在庫は引き落としたままです。このあと取り消しや全額返金をしても自動では戻りません。",
          "品物が蔵にある場合は /admin/products で在庫を足してください。",
        ].join("\n"),
      );
    }

    // ステータスが新たに shipped / delivered へ「変わった瞬間」だけ顧客へ通知する。
    // メール送信に失敗しても管理操作自体は成功させる（在庫・状態の更新は済んでいる）。
    if (prevStatus !== input.status) {
      const emailData: OrderEmailData = {
        noAccount: current.userId === null,
        orderRef: current.orderRef,
        customerName: current.customerName,
        customerEmail: current.customerEmail,
        items: parseOrderItems(current.itemsJson),
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
        // ゲストには注文を見るページが無く、追跡番号を知る手段がメールしか無い。
        if (emailData.noAccount) {
          await alertOps(
            "アカウントの無いお客様へ配送の通知を送れませんでした",
            [
              `注文番号: ${current.orderRef}`,
              `宛先: ${current.customerEmail}`,
              "",
              "ステータスは更新済みです。追跡番号を個別にご連絡ください。",
            ].join("\n"),
          );
        }
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
 *   ステータスを動かさない — 一部返金は発送の前にも後にも起き、取引は続くので、
 *   「返金済み」の顔をさせると蔵側の作業一覧から消えてしまう。
 * - 冪等: Stripe には「注文 + 返金前の累計 + 今回の額」から作った
 *   idempotencyKey を渡す。ボタン連打では同じ鍵になるので二重に返らず、
 *   意図した 2 回目の返金（累計が進んでいる）では別の鍵になる。
 * - DB 更新は「返金前の累計」を WHERE に入れた原子的な UPDATE で行う。
 * - 返金できるのは入金済みの注文だけ（`isRefundable`）。入金後に取り消した注文も含む。
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

  if (!isRefundable(current) || !current.stripeSessionId) {
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
  // 累計を二重に足すこともメールを重複送信することも無い。返金は成立しているので、
  // 在庫の状態が動いて更新できなかったときも Webhook が読み直して記録する。
  const totalRefunded = alreadyRefunded + amount;
  const remaining = current.total - totalRefunded;
  const stockTo = isFullRefund
    ? stockStateFor("refunded", current.stockState)
    : current.stockState;
  let updated;
  try {
    const db = await getDb();
    updated = await db
      .update(orderTable)
      .set({
        // 全額返し切ったときだけ終端ステータスへ移す。
        ...(isFullRefund ? { status: "refunded" as const } : {}),
        stockState: stockTo,
        stripeRefundId: refundId,
        stripePaymentIntentId: paymentIntentId,
        refundedAt: new Date(),
        refundedAmount: totalRefunded,
      })
      .where(
        and(
          eq(orderTable.id, current.id),
          ne(orderTable.status, "refunded"),
          eq(orderTable.stockState, current.stockState),
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
    return { ok: true, refunded: totalRefunded, remaining };
  }

  // 未発送のまま**全額**返金したなら品物は蔵にあるので在庫に戻す。
  // 発送後は手元に無いので戻さない（返品を受け取ったら /admin/products で足す）。
  // 一部返金では戻さない — 金額からは、どの品を何本引き取ったか分からない。
  await applyStockMove(current, current.stockState, stockTo);

  // 返金メール（ベストエフォート。失敗しても返金自体は成立している）。
  try {
    await sendOrderRefundedEmail({
      noAccount: current.userId === null,
      stillShipping: willStillShip(current),
      orderRef: current.orderRef,
      customerName: current.customerName,
      customerEmail: current.customerEmail,
      items: parseOrderItems(current.itemsJson),
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

/**
 * 注文を CSV で書き出す（staff 以上）。
 *
 * ファイルはクライアントで Blob にして保存させる。Server Action は
 * ストリームを返せないが、注文 CSV の規模なら文字列で十分足りる。
 * API Route を足さずに済むので、認可を `requireStaff` に一本化できる。
 *
 * **1 注文 = 1 行**。明細は「銘柄 容量×本数」を 1 セルにまとめる。
 * 明細を行に展開すると会計ソフトで合計が二重になるため。
 */
export async function adminExportOrdersCsvAction(
  filter?: AdminOrderFilter,
): Promise<
  | { ok: true; filename: string; csv: string; count: number }
  | { ok: false; error: "unauth" | "forbidden" | "db" }
> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(orderTable)
      .where(orderFilterWhere(filter))
      .orderBy(desc(orderTable.createdAt))
      // 一覧（200 件）より多く出す。書き出しは目視ではなく会計処理に使うため。
      .limit(5000);

    const headers = [
      "注文番号",
      "注文日時",
      "ステータス",
      "お名前",
      "メールアドレス",
      "郵便番号",
      "住所",
      "電話番号",
      "商品",
      "本数",
      "小計",
      "送料",
      "合計",
      "返金額",
      "入金日時",
      "発送日時",
      "お届け日時",
      "配送業者",
      "追跡番号",
    ];

    const body = rows.map((row) => [
      row.orderRef,
      formatDateTimeJp(row.createdAt),
      orderStatusJp(row.status),
      row.customerName,
      row.customerEmail,
      row.postalCode,
      row.address,
      row.phone,
      parseOrderItems(row.itemsJson)
        .map((it) => `${it.name} ${it.variant} ${it.ml}ml×${it.qty}`)
        .join(" / "),
      row.itemsCount,
      row.subtotal,
      row.shipping,
      row.total,
      row.refundedAmount ?? 0,
      row.paidAt ? formatDateTimeJp(row.paidAt) : "",
      row.shippedAt ? formatDateTimeJp(row.shippedAt) : "",
      row.deliveredAt ? formatDateTimeJp(row.deliveredAt) : "",
      row.trackingCarrier ?? "",
      row.trackingNumber ?? "",
    ]);

    const range =
      filter?.from || filter?.to
        ? `_${filter?.from ?? "start"}_${filter?.to ?? "end"}`
        : "";

    return {
      ok: true,
      filename: `fujisan-orders${range}.csv`,
      csv: toCsv(headers, body),
      count: body.length,
    };
  } catch {
    return { ok: false, error: "db" };
  }
}

/**
 * 納品書のために 1 注文を引く（staff 以上）。
 *
 * 顧客向けの `getMyOrderByRefAction` と違い **userId では絞らない** —
 * 蔵の人は他人の注文を扱うのが仕事だから。そのぶん、ここに来る前に
 * `requireStaff` で確実に止める。
 */
export async function adminGetOrderByRefAction(
  orderRef: string,
): Promise<
  | { ok: true; order: AdminOrderListItem }
  | { ok: false; error: "unauth" | "forbidden" | "not_found" | "db" }
> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  const ref = orderRef.trim();
  if (!ref) return { ok: false, error: "not_found" };

  try {
    const db = await getDb();
    const [row] = await db
      .select()
      .from(orderTable)
      .where(eq(orderTable.orderRef, ref))
      .limit(1);
    if (!row) return { ok: false, error: "not_found" };

    return {
      ok: true,
      order: {
        id: row.id,
        userId: row.userId,
        orderRef: row.orderRef,
        status: row.status as OrderStatus,
        items: parseOrderItems(row.itemsJson),
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
        paidAt: row.paidAt ?? null,
        shippedAt: row.shippedAt ?? null,
        deliveredAt: row.deliveredAt ?? null,
        refundedAt: row.refundedAt ?? null,
        refundedAmount: row.refundedAmount ?? null,
        cancelRequestedAt: row.cancelRequestedAt ?? null,
        cancelReason: row.cancelReason,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    };
  } catch {
    return { ok: false, error: "db" };
  }
}
