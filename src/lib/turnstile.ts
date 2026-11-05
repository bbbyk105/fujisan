import "server-only";
import { alertOps } from "@/lib/ops-alert";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Cloudflare が発行するトークンの長さの上限。 */
const MAX_TOKEN_LENGTH = 2048;

/** 決済の開始で待たせる上限。応答が無ければ不調として扱う。 */
const VERIFY_TIMEOUT_MS = 3000;

/** こちらの設定の誤り。ボットではないので、ゲスト全員を止めないよう不調と同じに扱う。 */
const SECRET_ERRORS = ["missing-input-secret", "invalid-input-secret"];

/** 不調の通知の間隔。決済のたびに送ると、メールの枠を使い切って注文確定まで止まる。 */
const ALERT_INTERVAL_MS = 10 * 60 * 1000;

let lastAlertAt = 0;

/** 判定できなかったので通す。判定が効いていない状態なので、人へ知らせる。 */
async function passUnverified(reason: string): Promise<boolean> {
  console.error(`[turnstile] ${reason}`);
  const now = Date.now();
  if (now - lastAlertAt >= ALERT_INTERVAL_MS) {
    lastAlertAt = now;
    await alertOps(
      "ゲストのボット判定が動いていません",
      [
        reason,
        "",
        "判定せずに決済を通しています。Cloudflare の障害か、TURNSTILE_SECRET_KEY を確認してください。",
      ].join("\n"),
    );
  }
  return true;
}

/**
 * Cloudflare Turnstile のトークンを検証する。通してよければ true。
 *
 * ゲストの決済開始の入口。カードなしで在庫を 30 分押さえられるので、IP の回数制限だけ
 * では 1 時間に 2 回で売り切れの状態を保てる。
 *
 * **Cloudflare の不調では通す。** 判定が落ちているあいだ販売まで止めるほうが害が大きい
 * （回数制限は別に効いている）。ただし通す判断は Cloudflare からの応答か接続の失敗だけで
 * 行うこと。利用者が送る値で例外が起きて通ると、判定を素通りできてしまう（Server Action
 * は直接呼べるので、文字列が来るとは限らない）。トークンは 1 回しか使えず、有効なのは
 * 300 秒。
 *
 * ウィジェット自体が読めないときはトークンが無いので、ここまで来ない。トークン無しを
 * 通すと判定の意味が無いので、その場合のゲストは止まり、画面はログインへ案内する。
 */
export async function verifyTurnstile(input: {
  secret: string;
  token: string | undefined;
  ip: string;
}): Promise<boolean> {
  const { secret, token, ip } = input;
  if (typeof token !== "string" || !token || token.length > MAX_TOKEN_LENGTH) {
    return false;
  }

  // "unknown" は `clientIpFrom` の置き換え値で、IP ではない。
  const body = JSON.stringify({
    secret,
    response: token,
    ...(ip && ip !== "unknown" ? { remoteip: ip } : {}),
  });

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
    // 429 は通さない。偽のトークンの連投で起こせるなら、判定を素通りできてしまう。
    if (res.status >= 500) {
      return passUnverified(`Cloudflare の応答: ${res.status}`);
    }

    // 4xx でも理由は本文にある。
    const result = (await res.json().catch(() => null)) as {
      success?: boolean;
      "error-codes"?: string[];
    } | null;
    if (!result) {
      return res.ok ? passUnverified("Cloudflare の応答を読めません") : false;
    }
    if (res.ok && result.success === true) return true;

    const codes = result["error-codes"] ?? [];
    if (codes.includes("internal-error")) {
      return passUnverified("Cloudflare 内部のエラー");
    }
    if (codes.some((code) => SECRET_ERRORS.includes(code))) {
      return passUnverified(`秘密鍵の誤り: ${codes.join(", ")}`);
    }
    return false;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return passUnverified(`Cloudflare へ接続できません: ${message}`);
  }
}
