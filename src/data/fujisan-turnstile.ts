/**
 * Cloudflare Turnstile のサイトキー。公開してよい値（秘密鍵は `TURNSTILE_SECRET_KEY`）。
 * 判定はこの値と秘密鍵の両方がそろってから動く。
 *
 * 本番のキーは sakefujisan.com でしか動かないので、手元では環境変数でテスト用のキーに
 * 差し替える（SETUP のタスク8）。ビルド時に埋め込まれるので `.dev.vars` では効かない。
 * 差し替えないと、手元ではゲストの決済へ進めない。
 */
export const TURNSTILE_SITE_KEY: string | null =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAF0WdMzjdn-S8WIN";
