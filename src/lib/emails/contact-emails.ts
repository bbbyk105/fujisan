import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendEmail } from "@/lib/email";
import { getOwnerEmailsFromEnv } from "@/lib/admin";
import { FUJISAN_LEGAL } from "@/data/fujisan-legal";
import { SITE_URL } from "@/lib/seo";
import {
  CONTACT_SUBJECT_LABELS,
  type ContactSubject,
} from "@/data/fujisan-contact";

/**
 * お問い合わせの通知メール。
 *
 * - 管理者宛（引き合いが来たことの通知。Reply-To に送信者を入れてそのまま返信できる）
 * - 送信者宛（自動受領確認）
 *
 * どちらも **ベストエフォート**。受領の正は D1 の contact_message 表なので、
 * 送信に失敗しても呼び出し元の成功判定は変えない。
 */

type ResendEnv = {
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  BETTER_AUTH_URL?: string;
};

export type ContactNotification = {
  id: string;
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
  locale: "ja" | "en";
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

/** 管理者へ「新しいお問い合わせが届いた」ことを通知する。 */
export async function sendContactAdminNotification(
  data: ContactNotification,
): Promise<void> {
  const { opts, baseUrl } = await resendOpts();
  const admins = await getOwnerEmailsFromEnv();
  if (admins.length === 0) return;

  const label = CONTACT_SUBJECT_LABELS[data.subject];
  const subject = `[FUJISAN お問い合わせ] ${label.ja} — ${data.name} 様`;
  const text = [
    "サイトのお問い合わせフォームから新しいご連絡が届きました。",
    "",
    `用件　： ${label.ja} (${label.en})`,
    `お名前： ${data.name}`,
    `メール： ${data.email}`,
    `言語　： ${data.locale === "en" ? "English" : "日本語"}`,
    "",
    "── 本文 ──",
    data.message,
    "──────────",
    "",
    `管理画面: ${baseUrl}/admin/contacts`,
    "",
    "※ このメールにそのまま返信すると、お客様宛に届きます。",
  ].join("\n");

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0B1A2E;">
    <p style="font-size:12px;letter-spacing:.2em;color:#C9A84C;margin:0 0 16px;">NEW ENQUIRY · 新しいお問い合わせ</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:8px 0;color:#0B1A2E99;width:6em;">用件</td><td style="padding:8px 0;">${escapeHtml(label.ja)}</td></tr>
      <tr><td style="padding:8px 0;color:#0B1A2E99;">お名前</td><td style="padding:8px 0;">${escapeHtml(data.name)}</td></tr>
      <tr><td style="padding:8px 0;color:#0B1A2E99;">メール</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color:#0B1A2E;">${escapeHtml(data.email)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#0B1A2E99;">言語</td><td style="padding:8px 0;">${data.locale === "en" ? "English" : "日本語"}</td></tr>
    </table>
    <div style="margin:20px 0;padding:14px 0;border-top:1px solid #d9cfb8;border-bottom:1px solid #d9cfb8;font-size:14px;line-height:1.8;white-space:pre-wrap;">${escapeHtml(data.message)}</div>
    <p style="font-size:13px;"><a href="${baseUrl}/admin/contacts" style="color:#0B1A2E;">管理画面で開く →</a></p>
    <p style="font-size:12px;color:#0B1A2E99;">このメールにそのまま返信すると、お客様宛に届きます。</p>
  </div>`;

  for (const to of admins) {
    await sendEmail(
      { to, subject, text, html, replyTo: data.email },
      opts,
    );
  }
}

/** 送信者へ自動受領確認を送る。 */
export async function sendContactAcknowledgement(
  data: ContactNotification,
): Promise<void> {
  const { opts } = await resendOpts();

  const subject = "FUJISAN — お問い合わせを承りました / We've received your message";
  const text = [
    `${data.name} 様`,
    "",
    "お問い合わせをいただきありがとうございます。",
    "内容を確認のうえ、通常 2 営業日以内に担当よりご返信いたします。",
    "",
    "── いただいた内容 ──",
    data.message,
    "──────────────",
    "",
    "※ このメールは自動送信です。ご返信は不要です。",
    "",
    "----",
    "",
    `Dear ${data.name},`,
    "",
    "Thank you for contacting us. We will reply within two business days,",
    "in Japanese or English.",
    "",
    "This is an automated acknowledgement. No reply is needed.",
    "",
    `${FUJISAN_LEGAL.sellerName}`,
    `${FUJISAN_LEGAL.address}`,
    `${FUJISAN_LEGAL.phone}（${FUJISAN_LEGAL.phoneHours}）`,
  ].join("\n");

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0B1A2E;">
    <p style="font-size:15px;line-height:1.9;">${escapeHtml(data.name)} 様</p>
    <p style="font-size:14px;line-height:1.9;">
      お問い合わせをいただきありがとうございます。<br />
      内容を確認のうえ、通常 2 営業日以内に担当よりご返信いたします。
    </p>
    <div style="margin:20px 0;padding:14px 0;border-top:1px solid #d9cfb8;border-bottom:1px solid #d9cfb8;font-size:14px;line-height:1.8;white-space:pre-wrap;">${escapeHtml(data.message)}</div>
    <p style="font-size:13px;line-height:1.9;color:#0B1A2E99;">
      Thank you for contacting us. We will reply within two business days,
      in Japanese or English.<br />
      This is an automated acknowledgement. No reply is needed.
    </p>
    <hr style="border:none;border-top:1px solid #eee2c8;margin:24px 0;" />
    <p style="font-size:12px;line-height:1.8;color:#0B1A2E99;">
      ${escapeHtml(FUJISAN_LEGAL.sellerName)}<br />
      ${escapeHtml(FUJISAN_LEGAL.address)}<br />
      ${escapeHtml(FUJISAN_LEGAL.phone)}（${escapeHtml(FUJISAN_LEGAL.phoneHours)}）
    </p>
  </div>`;

  await sendEmail({ to: data.email, subject, text, html }, opts);
}
