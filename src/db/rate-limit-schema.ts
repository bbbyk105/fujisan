import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

/**
 * レート制限のカウンタは **2 つある**。守る面が別だから。
 *
 * 1. `action_rate_limit` — Server Action 用（`src/lib/rate-limit.ts`）。
 *    このサイトのログイン・登録・再設定は Server Action から `auth.api.*` を
 *    直接呼ぶので、Better Auth の `rateLimit` は通らない。
 * 2. `rate_limit` — Better Auth 用。`/api/auth/*` は UI が使っていなくても
 *    **HTTP で直接叩ける**ので、こちらも塞がないと Server Action の制限を
 *    迂回されてしまう。
 *
 * どちらも Workers では D1 に置くしかない。アイソレートが短命なので、
 * Better Auth の既定 `storage: "memory"` は回数を共有できず実質機能しない。
 */

/**
 * Better Auth（`/api/auth/*`）のカウンタ。
 *
 * **列の構成は Better Auth が決めている**ので変えないこと
 * （`@better-auth/core` の `getAuthTables` が `key` / `count` / `lastRequest`
 * を要求する）。判定も Better Auth 側のロジック
 * （`now - lastRequest < window && count >= max`）で、下の固定ウィンドウとは
 * 意味が違う。
 */
export const rateLimit = sqliteTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: integer("last_request").notNull(),
});

/**
 * Server Action 用の固定ウィンドウのカウンタ。
 *
 * **生 IP は保存しない**。key には SHA-256 の先頭16文字だけを入れる
 * （お問い合わせの連投制限と同じ方針）。
 */
export const actionRateLimit = sqliteTable(
  "action_rate_limit",
  {
    /** `<用途>:<IP のハッシュ>`。用途ごとに別カウンタにする。 */
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(0),
    /** このウィンドウが切れる時刻。過ぎていれば次のアクセスで 1 に戻る。 */
    expiresAt: integer("expires_at", { mode: "number" }).notNull(),
  },
  // 期限切れ行のまとめ削除用（key で引くだけなら不要だがフルスキャンになる）。
  (table) => [index("action_rate_limit_expires_at_idx").on(table.expiresAt)],
);
