import "server-only";
import { lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { actionRateLimit, rateLimit } from "@/db/rate-limit-schema";

/**
 * D1 に載せた固定ウィンドウのレートリミッタ。
 *
 * **なぜ自前で持つか。** Better Auth にも `rateLimit` はあるが、効くのは
 * `auth.handler()`（= `/api/auth/[...all]` への HTTP リクエスト）だけで、
 * このサイトのログイン・登録・再設定はすべて Server Action から
 * `auth.api.*` を直接呼ぶ経路なので**素通りする**。
 * 逆に `/api/auth/*` は UI を経由せず直接叩けるので、あちらはあちらで
 * 塞ぐ必要がある（`src/lib/auth.ts` の `rateLimit`）。**両方いる。**
 *
 * **数え違えないための作り。** D1 に対話的トランザクションは無いので、
 * 読んでから書くと同時アクセスで取りこぼす。UPSERT 1 文で
 * 「期限切れなら 1 に戻し、生きていれば +1 する」を原子的に行い、
 * `RETURNING` で確定後の値を受け取る（在庫の引き当てと同じ考え方）。
 *
 * **生 IP は保存しない。** key には SHA-256 の先頭16文字だけを入れる。
 */

/** レート制限の用途。用途ごとにカウンタを分ける。 */
export const RATE_LIMITS = {
  /** ログイン試行（パスワードの総当たり対策） */
  signIn: { max: 10, windowMs: 10 * 60 * 1000 },
  /** 新規登録（認証メールの大量送信・捨てアカウント量産の対策） */
  signUp: { max: 5, windowMs: 60 * 60 * 1000 },
  /** メール送信を伴う操作（再設定リンク・認証メールの再送） */
  sendEmail: { max: 5, windowMs: 60 * 60 * 1000 },
  /** トークンやパスワードを検証する操作（再設定・パスワード変更） */
  verify: { max: 10, windowMs: 10 * 60 * 1000 },
} as const;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

/** IP が取れなかったときに使う置き換え（全員で 1 つのカウンタを共有する）。 */
const UNKNOWN_IP = "unknown";

/** 期限切れ行を掃除する確率。毎回消すと書き込みが倍になるので間引く。 */
const SWEEP_PROBABILITY = 0.02;

/**
 * Better Auth 側のカウンタ（`rate_limit`）を保持する時間。
 *
 * **Better Auth は自分では消さない。** しかも key に**生の IP がそのまま入る**
 * （ハッシュに置き換える口は無い。`getIp` が IP 形式を検証するため、
 * ハッシュを渡すとレート制限ごと無効になる）。放っておくと IP が無期限に
 * 残り、プライバシーポリシーの「IP アドレスそのものは保存しません」とも
 * 食い違う。`src/lib/auth.ts` の customRules の最長ウィンドウ（1時間）を
 * 過ぎた行は、Better Auth 自身もリセット扱いにするので消してよい。
 */
const AUTH_COUNTER_RETENTION_MS = 60 * 60 * 1000;

/** 送信元 IP を SHA-256 で伏せる（生 IP は保存しない）。 */
async function hashIp(ip: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(ip),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

/**
 * リクエストヘッダから送信元 IP を取り出す。
 * Cloudflare は `CF-Connecting-IP` に**必ず本物のクライアント IP**を入れる。
 * `X-Forwarded-For` はクライアントが詐称できるので、先に CF のヘッダを見る。
 */
export function clientIpFrom(headers: Headers): string {
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || UNKNOWN_IP;
}

/**
 * 1 回ぶん消費する。上限を超えていれば `ok: false` と待ち時間を返す。
 *
 * **DB が落ちているときは通す**（`ok: true`）。ここで閉じると、D1 の一時的な
 * 不調でログインそのものが不可能になる。レート制限はあくまで濫用を遅くする
 * 仕組みで、認証の可否を決めるものではない。
 */
export async function consumeRateLimit(input: {
  bucket: RateLimitBucket;
  ip: string;
  /** 既定（RATE_LIMITS）を上書きしたいときだけ渡す。 */
  max?: number;
  windowMs?: number;
}): Promise<RateLimitResult> {
  const preset = RATE_LIMITS[input.bucket];
  const max = input.max ?? preset.max;
  const windowMs = input.windowMs ?? preset.windowMs;

  try {
    const db = await getDb();
    const key = `${input.bucket}:${await hashIp(input.ip || UNKNOWN_IP)}`;
    const now = Date.now();
    const nextExpiry = now + windowMs;

    // 1 文で「期限切れならリセット、生きていれば加算」。読んでから書くと
    // 同時アクセスで取りこぼすため、条件式ごと UPDATE に埋める。
    // DO UPDATE の中の `action_rate_limit.xxx` は衝突した既存行を指す。
    const rows = await db
      .insert(actionRateLimit)
      .values({ key, count: 1, expiresAt: nextExpiry })
      .onConflictDoUpdate({
        target: actionRateLimit.key,
        set: {
          count: sql`CASE WHEN ${actionRateLimit.expiresAt} <= ${now} THEN 1 ELSE ${actionRateLimit.count} + 1 END`,
          expiresAt: sql`CASE WHEN ${actionRateLimit.expiresAt} <= ${now} THEN ${nextExpiry} ELSE ${actionRateLimit.expiresAt} END`,
        },
      })
      .returning({ count: actionRateLimit.count, expiresAt: actionRateLimit.expiresAt });

    const row = rows[0];
    if (!row) return { ok: true };

    void sweepExpired(db, now);

    if (row.count > max) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil((row.expiresAt - now) / 1000)),
      };
    }
    return { ok: true };
  } catch (error) {
    console.error("[rate-limit] カウンタを更新できませんでした", error);
    return { ok: true };
  }
}

/**
 * 古い行の掃除。**両方のカウンタを消す**（Better Auth は自分では消さないので、
 * ここで消さないと生 IP が無期限に残る）。失敗しても呼び出し元には影響させない。
 *
 * `/api/auth/*` を直接叩かれるだけだと Server Action は通らず掃除が走らないので、
 * あちらのルートからも呼ぶ（`src/app/api/auth/[...all]/route.ts`）。
 */
export async function sweepRateLimitCounters(): Promise<void> {
  if (Math.random() >= SWEEP_PROBABILITY) return;
  try {
    await sweepExpired(await getDb(), Date.now(), true);
  } catch {
    /* 掃除は best-effort */
  }
}

async function sweepExpired(
  db: Awaited<ReturnType<typeof getDb>>,
  now: number,
  force = false,
): Promise<void> {
  if (!force && Math.random() >= SWEEP_PROBABILITY) return;
  try {
    await db.delete(actionRateLimit).where(lte(actionRateLimit.expiresAt, now));
    await db
      .delete(rateLimit)
      .where(lte(rateLimit.lastRequest, now - AUTH_COUNTER_RETENTION_MS));
  } catch {
    /* 掃除は best-effort。溜まっても判定は正しく動く */
  }
}
