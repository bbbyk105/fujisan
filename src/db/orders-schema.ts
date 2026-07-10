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
    /** 返金完了日時。 */
    refundedAt: integer("refunded_at", { mode: "timestamp_ms" }),

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
