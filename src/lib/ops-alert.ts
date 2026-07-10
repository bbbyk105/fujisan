import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendEmail } from "@/lib/email";
import { getOwnerEmailsFromEnv } from "@/lib/admin";

/**
 * 運用アラート（管理者向けの障害通知）。
 *
 * Webhook 失敗など「人が気づいて対応すべき事象」を、確実に届く経路で管理者へ知らせる。
 * 送信は 2 系統・どちらも **ベストエフォート**（例外を投げない・呼び出し元をブロックしない）:
 *
 *   1. OPS_WEBHOOK_URL（任意）: JSON `{ text }` を POST する汎用 Webhook。
 *      Slack / Discord の Incoming Webhook や、`{text}` を受ける自前の Telegram 中継に使える。
 *   2. ADMIN_EMAILS 宛のメール（Resend）: 常に送る確実な経路。RESEND_API_KEY 未設定なら
 *      dev ではコンソール出力に落ちる（sendEmail の仕様）。
 *
 * ※ 決済 Webhook のような「絶対に落とせない」経路から呼ぶため、内部の失敗は
 *    すべて握りつぶしてログのみ残す。
 */

type OpsAlertEnv = {
  OPS_WEBHOOK_URL?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
};

export async function alertOps(
  subject: string,
  body: string,
): Promise<void> {
  let env: OpsAlertEnv = {};
  try {
    const ctx = await getCloudflareContext({ async: true });
    env = ctx.env as OpsAlertEnv;
  } catch {
    // env が引けない環境（ごく初期の失敗など）はログのみ。
    console.error(`[ops-alert] ${subject}\n${body}`);
    return;
  }

  const text = `🚨 FUJISAN — ${subject}\n\n${body}`;

  // 1) 汎用 Webhook（設定時のみ）
  if (env.OPS_WEBHOOK_URL) {
    try {
      await fetch(env.OPS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    } catch (err) {
      console.error("[ops-alert] webhook 送信に失敗:", err);
    }
  }

  // 2) 管理者メール（確実な経路）
  try {
    const admins = await getOwnerEmailsFromEnv();
    for (const to of admins) {
      await sendEmail(
        {
          to,
          subject: `[FUJISAN 障害通知] ${subject}`,
          text,
        },
        { apiKey: env.RESEND_API_KEY, from: env.RESEND_FROM },
      );
    }
  } catch (err) {
    console.error("[ops-alert] 管理者メール送信に失敗:", err);
  }
}
