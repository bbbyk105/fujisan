import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

/**
 * ご注文の進行ステータス。蔵側で順次更新する想定。
 * 既定は `pending`（受付直後）。
 */
export const ORDER_STATUSES = [
  "pending", // 受付済（注文受領）
  "confirmed", // 注文確定（決済・在庫確認）
  "preparing", // 蔵で準備中
  "shipped", // 発送済み（追跡番号あり）
  "delivered", // お届け済
  "cancelled", // キャンセル（未決済のまま取消）
  "refunded", // 返金済み（Stripe 返金完了。adminRefundOrderAction からのみ到達）
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * 品物が蔵を出たか。
 *
 * 返金・取消のときに在庫を戻してよいかの判断に使う。発送後は品物が手元に
 * 戻っていないので、返金しても在庫は増やさない（返品を受け取ったら手で足す）。
 */
export function hasLeftTheKura(status: OrderStatus): boolean {
  return status === "shipped" || status === "delivered";
}

/** 返金の状態。金額とステータスの組み合わせを 1 か所で判定する。 */
export type RefundState = "none" | "partial" | "full";

/**
 * 注文の返金状態。
 *
 * `status === "refunded"` は全額返金。それ以外でも `refundedAmount` が
 * 入っていれば一部返金であり、**金額だけを見て「返金済み」と表示しない**こと
 * （一部返金の注文はまだ届く予定のものなので、全額返金と同じ顔をさせない）。
 */
export function refundStateOf(order: {
  status: OrderStatus | string;
  refundedAmount: number | null;
  total: number;
}): RefundState {
  if (order.status === "refunded") return "full";
  const refunded = order.refundedAmount ?? 0;
  if (refunded <= 0) return "none";
  return refunded >= order.total ? "full" : "partial";
}

/**
 * 領収書を発行してよいステータスか。
 *
 * 領収書は「代金を受け取って保持している」ことの証明なので、
 * 未入金のまま終わったもの（pending / cancelled）と、代金を返したもの
 * （refunded）には発行しない。返金済みに全額の「上記正に領収いたしました」を
 * 出すと事実と食い違う。
 */
export function isReceiptIssuable(status: OrderStatus): boolean {
  return (
    status === "confirmed" ||
    status === "preparing" ||
    status === "shipped" ||
    status === "delivered"
  );
}

/**
 * 1注文 = 1行。`items_json` にカートの行を JSON で保存する（スナップショット）。
 * 価格列はすべて円・税込の整数。
 */
export const order = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** 顧客向けの注文番号（"FJ-XXXX"）。重複しないように unique。 */
    orderRef: text("order_ref").notNull().unique(),
    /** 進行ステータス。ORDER_STATUSES のいずれか。 */
    status: text("status").notNull().default("pending"),

    /** カート行のスナップショット（JSON 文字列）。型: OrderLine[] を JSON 化したもの。 */
    itemsJson: text("items_json").notNull(),
    /** 本数の合計（表示用に冗長化） */
    itemsCount: integer("items_count").notNull(),

    /** 金額（円、税込整数） */
    subtotal: integer("subtotal").notNull(),
    shipping: integer("shipping").notNull(),
    total: integer("total").notNull(),

    /** お届け先情報（注文時点） */
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    postalCode: text("postal_code").notNull(),
    address: text("address").notNull(),
    phone: text("phone").notNull(),

    /** 決済情報（Stripe Checkout） */
    /** 支払いを確定した Checkout Session の id。Webhook の冪等化キーにも使う。 */
    stripeSessionId: text("stripe_session_id"),
    /** 支払いの PaymentIntent id。返金（refunds.create）の対象に使う。Webhook で保存。 */
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    /** 支払い確定日時（Webhook で payment_status==='paid' を受けた瞬間）。 */
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),

    /** 返金情報（管理者が返金操作したとき） */
    /** Stripe の Refund id（冪等キー兼、二重返金防止の記録）。 */
    stripeRefundId: text("stripe_refund_id"),
    /** 返金完了日時（部分返金なら直近の返金日時）。 */
    refundedAt: integer("refunded_at", { mode: "timestamp_ms" }),
    /**
     * これまでに返金した累計額（円）。null は返金なし。
     *
     * **`status === "refunded"` は「全額返金済み」だけを意味する。**
     * 一部だけ返した注文は進行中のまま（発送は続く）なので、ステータスは
     * 動かさずこの金額だけが増える。金額を持たずにステータスだけで
     * 表そうとすると、「一部返金して発送準備中」が表現できない。
     */
    refundedAmount: integer("refunded_amount"),

    /**
     * 領収書の宛名。null なら `customerName`（注文時の登録名）を使う。
     *
     * 「上様」や正式社名を入れたい要望に応えるためのもので、**金額には
     * 一切関係しない**。お客様がご自身の注文に対してのみ設定できる。
     */
    receiptAddressee: text("receipt_addressee"),

    /** お客様からのキャンセル依頼（発送前のみ受け付ける）。返金の実行は owner が行う。 */
    cancelRequestedAt: integer("cancel_requested_at", { mode: "timestamp_ms" }),
    cancelReason: text("cancel_reason"),

    /** 追跡情報（発送後に蔵側で記入） */
    trackingCarrier: text("tracking_carrier"),
    trackingNumber: text("tracking_number"),
    shippedAt: integer("shipped_at", { mode: "timestamp_ms" }),
    deliveredAt: integer("delivered_at", { mode: "timestamp_ms" }),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.createdAt),
  ],
);

/** 注文行 1 アイテム（itemsJson に格納） */
export type OrderLine = {
  slug: string;
  name: string;
  variant: string;
  ml: number;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};
