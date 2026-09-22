import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// 用件・対応状況のコードは src/data/fujisan-contact.ts が唯一の出どころ。
// （クライアントからも読めるよう、サーバー依存のないデータモジュールに置いてある）

/**
 * お問い合わせ 1 件 = 1 行。
 *
 * メール通知（Resend）はベストエフォートなので、**受領の正はこの表**とする。
 * メールが落ちても問い合わせ自体は失われず、管理画面（/admin/contacts）から拾える。
 *
 * ログイン不要のフォームのため user への外部キーは持たない（匿名の引き合いも受ける）。
 */
export const contactMessage = sqliteTable(
  "contact_message",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    /** CONTACT_SUBJECTS（src/data/fujisan-contact.ts）のいずれか */
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    /** 送信時のサイト表示言語。返信を書く言語の手がかりにする。 */
    locale: text("locale").notNull().default("ja"),
    /** CONTACT_STATUSES（src/data/fujisan-contact.ts）のいずれか */
    status: text("status").notNull().default("new"),

    /**
     * 送信元 IP の SHA-256（先頭16文字）。生 IP は保存しない。
     * 連投判定にだけ使い、個人を特定する目的では用いない。
     */
    ipHash: text("ip_hash"),

    /** 対応済みにした管理者のメール（監査用） */
    handledByEmail: text("handled_by_email"),
    handledAt: integer("handled_at", { mode: "timestamp_ms" }),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("contact_message_status_idx").on(table.status),
    index("contact_message_created_at_idx").on(table.createdAt),
    // 連投チェックは (ip_hash, created_at) の絞り込みで引く
    index("contact_message_ip_hash_idx").on(table.ipHash, table.createdAt),
  ],
);
