import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * メールアドレスによるチーム招待。
 * まだ登録していない相手を owner / staff として招待するための「予約」。
 * 招待されたメールで新規登録すると、databaseHooks(user.create.after) が
 * この行を見て admin_role を付与し、行を削除する。
 * 既に登録済みのメールは招待ではなく即時付与するため、この表は使わない。
 */
export const teamInvite = sqliteTable("team_invite", {
  /** 招待先メール（小文字に正規化して保存） */
  email: text("email").primaryKey(),
  /** 付与する管理ロール: "owner" | "staff" */
  adminRole: text("admin_role").notNull(),
  /** 招待した owner のメール（監査用） */
  invitedByEmail: text("invited_by_email").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

/**
 * 招待の有効期限（14日）。これを過ぎた招待では管理ロールを付与しない。
 * 期限が無いと、退職者向けなどの古い招待メールのアドレスが後から登録された
 * 際に、意図せず管理権限が付いてしまう。
 */
export const TEAM_INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
