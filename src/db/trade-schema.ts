import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

/**
 * 取扱店（法人）アカウントの審査。
 *
 * `user.role === "business"` は「法人として登録した」だけを表す。
 * **卸価格を見せてよいかは、この表の `status === "approved"` で決める。**
 * 以前は登録した瞬間に卸価格が見えており、酒類販売免許の確認も
 * 「免許確認のうえ口座開設」という自社の説明も実装されていなかった。
 *
 * Better Auth の user テーブルには手を入れず別表にしている（additionalFields を
 * 増やすと CLI generate と静的 auth インスタンスにも影響するため）。
 */
export const tradeAccount = sqliteTable(
  "trade_account",
  {
    /** user.id と 1:1。退会したら一緒に消える。 */
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),

    /** TRADE_STATUSES のいずれか（src/data/fujisan-trade.ts） */
    status: text("status").notNull().default("pending"),
    /** TRADE_BUSINESS_TYPES のいずれか */
    businessType: text("business_type").notNull(),

    /**
     * 自己申告の酒類販売業免許番号。転売しない業態（飲食店・宿泊施設）では
     * 空でよい。番号の真正性は蔵側が目視で確認する（自動照会の手段は無い）。
     */
    licenceNumber: text("licence_number"),

    /** 審査の記録 */
    appliedAt: integer("applied_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
    reviewedByEmail: text("reviewed_by_email"),
    /** 見送りの理由（お客様にもそのまま伝える） */
    reviewNote: text("review_note"),
  },
  (table) => [index("trade_account_status_idx").on(table.status)],
);
