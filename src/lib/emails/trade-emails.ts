import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendEmail } from "@/lib/email";
import { getOwnerEmailsFromEnv } from "@/lib/admin";
import { FUJISAN_LEGAL } from "@/data/fujisan-legal";
import { SITE_URL } from "@/lib/seo";
import {
  TRADE_BUSINESS_TYPE_LABELS,
  type TradeBusinessType,
} from "@/data/fujisan-trade";

/**
 * 取扱店アカウントの審査に関する通知メール。
 *
 * どれも **ベストエフォート**。審査の正は D1 の `trade_account` 表なので、
 * 送信に失敗しても申請・承認そのものは取り消さない（ログに残すだけ）。
 */

type ResendEnv = {
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  BETTER_AUTH_URL?: string;
};

export type TradeApplicant = {
  companyName: string;
  contactName: string;
  email: string;
  businessType: TradeBusinessType;
  licenceNumber?: string | null;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function resendOpts(): Promise<{
  opts: { apiKey?: string; from?: string };
  baseUrl: string;
}> {
  const { env } = await getCloudflareContext({ async: true });
  const e = env as ResendEnv;
  return {
    opts: { apiKey: e.RESEND_API_KEY, from: e.RESEND_FROM },
    baseUrl: (e.BETTER_AUTH_URL || SITE_URL).replace(
      /\/$/,
      "",
    ),
  };
}

/** 蔵のスタッフへ「新しい取扱店の申請が届いた」ことを知らせる。 */
export async function sendTradeApplicationNotification(
  data: TradeApplicant,
): Promise<void> {
  const { opts, baseUrl } = await resendOpts();
  const admins = await getOwnerEmailsFromEnv();
  if (admins.length === 0) return;

  const label = TRADE_BUSINESS_TYPE_LABELS[data.businessType];
  const subject = `[FUJISAN 取扱店申請] ${data.companyName}`;
  const text = [
    "新しい取扱店アカウントの申請が届きました。承認するまで卸価格は表示されません。",
    "",
    `会社・店舗： ${data.companyName}`,
    `ご担当者　： ${data.contactName}`,
    `メール　　： ${data.email}`,
    `業態　　　： ${label.ja}`,
    `免許番号　： ${data.licenceNumber || "（申告なし）"}`,
    "",
    `審査はこちら: ${baseUrl}/admin/customers`,
  ].join("\n");

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0B1A2E;">
    <p style="font-size:12px;letter-spacing:.2em;color:#C9A84C;margin:0 0 16px;">NEW TRADE APPLICATION · 取扱店の申請</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:8px 0;color:#0B1A2E99;width:8em;">会社・店舗</td><td style="padding:8px 0;">${escapeHtml(data.companyName)}</td></tr>
      <tr><td style="padding:8px 0;color:#0B1A2E99;">ご担当者</td><td style="padding:8px 0;">${escapeHtml(data.contactName)}</td></tr>
      <tr><td style="padding:8px 0;color:#0B1A2E99;">メール</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color:#0B1A2E;">${escapeHtml(data.email)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#0B1A2E99;">業態</td><td style="padding:8px 0;">${escapeHtml(label.ja)}</td></tr>
      <tr><td style="padding:8px 0;color:#0B1A2E99;">免許番号</td><td style="padding:8px 0;">${escapeHtml(data.licenceNumber || "（申告なし）")}</td></tr>
    </table>
    <p style="font-size:13px;">承認するまで卸価格は表示されません。<a href="${baseUrl}/admin/customers" style="color:#0B1A2E;">管理画面で審査する →</a></p>
  </div>`;

  for (const to of admins) {
    await sendEmail({ to, subject, text, html, replyTo: data.email }, opts);
  }
}

/** 申請者へ「受け付けた（審査中）」ことを知らせる。 */
export async function sendTradeApplicationAcknowledgement(
  data: TradeApplicant,
): Promise<void> {
  const { opts } = await resendOpts();

  const subject =
    "FUJISAN — 取扱店のお申し込みを承りました / Trade application received";
  const text = [
    `${data.companyName}`,
    `${data.contactName} 様`,
    "",
    "取扱店アカウントのお申し込みをありがとうございます。",
    "内容を確認のうえ、2 営業日以内に審査の結果をご連絡いたします。",
    "卸価格は、審査の完了後にログインいただくと表示されます。",
    "",
    "※ このメールは自動送信です。ご返信は不要です。",
    "",
    "----",
    "",
    `Dear ${data.contactName},`,
    "",
    "Thank you for applying for a trade account. We review each application by",
    "hand and will reply within two business days. Wholesale pricing appears",
    "once your account has been approved.",
    "",
    `${FUJISAN_LEGAL.sellerName}`,
    `${FUJISAN_LEGAL.phone}（${FUJISAN_LEGAL.phoneHours}）`,
  ].join("\n");

  await sendEmail({ to: data.email, subject, text }, opts);
}

/** 申請者へ承認を知らせる。 */
export async function sendTradeApprovedEmail(data: {
  companyName: string;
  contactName: string;
  email: string;
}): Promise<void> {
  const { opts, baseUrl } = await resendOpts();

  const subject = "FUJISAN — 取扱店アカウントを承認しました / Trade account approved";
  const text = [
    `${data.companyName}`,
    `${data.contactName} 様`,
    "",
    "取扱店アカウントの審査が完了しました。ログインいただくと卸価格をご覧いただけます。",
    "",
    `卸価格表: ${baseUrl}/shop/business`,
    "",
    "ご注文・お見積りは担当窓口までお気軽にご相談ください。",
    "",
    "----",
    "",
    `Dear ${data.contactName},`,
    "",
    "Your trade account has been approved. Sign in to see wholesale pricing:",
    `${baseUrl}/shop/business`,
    "",
    `${FUJISAN_LEGAL.sellerName}`,
    `${FUJISAN_LEGAL.email}`,
  ].join("\n");

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0B1A2E;">
    <p style="font-size:12px;letter-spacing:.2em;color:#C9A84C;margin:0 0 16px;">― 取扱口座を開設しました ―</p>
    <p style="font-size:15px;line-height:1.9;">${escapeHtml(data.companyName)}<br />${escapeHtml(data.contactName)} 様</p>
    <p style="font-size:14px;line-height:1.9;">
      取扱店アカウントの審査が完了しました。ログインいただくと卸価格をご覧いただけます。
    </p>
    <p style="font-size:13px;"><a href="${baseUrl}/shop/business" style="color:#0B1A2E;">卸価格表を開く →</a></p>
    <hr style="border:none;border-top:1px solid #eee2c8;margin:24px 0;" />
    <p style="font-size:12px;line-height:1.8;color:#0B1A2E99;">
      Your trade account has been approved. Sign in to see wholesale pricing.<br />
      ${escapeHtml(FUJISAN_LEGAL.sellerName)}<br />
      ${escapeHtml(FUJISAN_LEGAL.email)}
    </p>
  </div>`;

  await sendEmail({ to: data.email, subject, text, html }, opts);
}

/**
 * 申請者へ見送りを知らせる。
 * 理由（reviewNote）はそのままお客様に届くので、管理画面側でもその前提で書いてもらう。
 */
export async function sendTradeRejectedEmail(data: {
  companyName: string;
  contactName: string;
  email: string;
  note?: string | null;
}): Promise<void> {
  const { opts } = await resendOpts();

  const reason = (data.note ?? "").trim();
  const subject = "FUJISAN — 取扱店のお申し込みについて / About your trade application";
  const text = [
    `${data.companyName}`,
    `${data.contactName} 様`,
    "",
    "取扱店アカウントのお申し込みを拝見しました。",
    "誠に恐れ入りますが、今回はお取引を見送らせていただくこととなりました。",
    ...(reason ? ["", "── 理由 ──", reason, "──────────"] : []),
    "",
    "状況が変わりましたら、いつでも改めてご相談ください。",
    `お問い合わせ: ${FUJISAN_LEGAL.email}`,
    "",
    "----",
    "",
    `Dear ${data.contactName},`,
    "",
    "Thank you for your interest. We are not able to open a trade account at",
    "this time. Please feel free to contact us again if your situation changes.",
    "",
    `${FUJISAN_LEGAL.sellerName}`,
  ].join("\n");

  await sendEmail({ to: data.email, subject, text }, opts);
}
