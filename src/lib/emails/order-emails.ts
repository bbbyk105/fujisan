import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendEmail } from "@/lib/email";
import { FUJISAN_LEGAL } from "@/data/fujisan-legal";
import type { OrderLine } from "@/db/orders-schema";

/**
 * 取引メール（注文確定・発送・お届け完了）の送信モジュール。
 *
 * - 既存の認証メールと同じく日本語→英語を1通に併記する（メールクライアントは
 *   data-locale の CSS 切替が効かないため、サイトの L コンポーネントは使えない）。
 * - 送信基盤は `sendEmail`（Resend）。鍵は実行時に Cloudflare env から取得する。
 *   Webhook ルートからも管理サーバーアクションからも呼ばれる。
 */

export type OrderEmailData = {
  orderRef: string;
  customerName: string;
  customerEmail: string;
  items: OrderLine[];
  itemsCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  postalCode: string;
  address: string;
  trackingCarrier?: string | null;
  trackingNumber?: string | null;
};

type ResendEnv = {
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  BETTER_AUTH_URL?: string;
};

const yen = new Intl.NumberFormat("ja-JP");

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function resendOpts(): Promise<{ opts: { apiKey?: string; from?: string }; baseUrl: string }> {
  const { env } = await getCloudflareContext({ async: true });
  const e = env as ResendEnv;
  return {
    opts: { apiKey: e.RESEND_API_KEY, from: e.RESEND_FROM },
    baseUrl: (e.BETTER_AUTH_URL || "https://fujisan-sake.com").replace(/\/$/, ""),
  };
}

// ── 明細・合計（テキスト / HTML 共通の素材） ─────────────────────────

function itemsText(items: OrderLine[]): string {
  return items
    .map(
      (it) =>
        `  ・${it.name}（${it.variant} / ${it.ml}ml） × ${it.qty}　¥${yen.format(it.lineTotal)}`,
    )
    .join("\n");
}

function itemsRowsHtml(items: OrderLine[]): string {
  return items
    .map(
      (it) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee2c8;font-size:14px;color:#0B1A2E;">
            <strong style="font-weight:600;">${escapeHtml(it.name)}</strong>
            <span style="color:#0B1A2E99;font-size:12px;">　${escapeHtml(it.variant)} / ${it.ml}ml × ${it.qty}</span>
          </td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #eee2c8;font-size:14px;color:#0B1A2E;white-space:nowrap;">¥${yen.format(it.lineTotal)}</td>
        </tr>`,
    )
    .join("");
}

function totalsHtml(d: OrderEmailData): string {
  return `
    <tr><td style="padding:6px 0;font-size:13px;color:#0B1A2E99;">小計 / Subtotal</td><td align="right" style="padding:6px 0;font-size:13px;color:#0B1A2E;">¥${yen.format(d.subtotal)}</td></tr>
    <tr><td style="padding:6px 0;font-size:13px;color:#0B1A2E99;">送料 / Shipping</td><td align="right" style="padding:6px 0;font-size:13px;color:#0B1A2E;">${d.shipping === 0 ? "無料 / Free" : "¥" + yen.format(d.shipping)}</td></tr>
    <tr><td style="padding:12px 0 0;font-size:14px;font-weight:600;color:#0B1A2E;border-top:1px solid #0B1A2E22;">合計 / Total</td><td align="right" style="padding:12px 0 0;font-size:18px;font-weight:700;color:#0B1A2E;border-top:1px solid #0B1A2E22;">¥${yen.format(d.total)}</td></tr>`;
}

/** メール全体の HTML シェル。heading / badge / 本文段落 / CTA を受け取る。 */
function htmlShell(args: {
  badge: string;
  heading: string;
  lead: string;
  d: OrderEmailData;
  extraBlock?: string;
  ctaLabel: string;
  ctaUrl: string;
}): string {
  const { badge, heading, lead, d, extraBlock = "", ctaLabel, ctaUrl } = args;
  return `<!doctype html>
<html lang="ja">
<body style="margin:0;padding:0;background:#f3efe4;font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans','Noto Sans JP',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe4;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fbf9f3;border:1px solid #e6dcc4;">
        <tr><td style="background:#0B1A2E;padding:26px 32px;">
          <div style="font-family:Georgia,'Times New Roman',serif;color:#fbf9f3;font-size:20px;letter-spacing:0.18em;font-weight:600;">FUJISAN</div>
          <div style="color:#C9A84C;font-size:10px;letter-spacing:0.34em;margin-top:4px;">SAKE FROM THE FOOT OF MT. FUJI</div>
        </td></tr>
        <tr><td style="padding:34px 32px 8px;">
          <div style="color:#C9A84C;font-size:11px;letter-spacing:0.28em;font-weight:600;">${badge}</div>
          <h1 style="margin:10px 0 0;font-family:Georgia,serif;font-size:23px;line-height:1.4;font-weight:600;color:#0B1A2E;">${heading}</h1>
          <p style="margin:14px 0 0;font-size:14px;line-height:1.85;color:#1D2432cc;">${lead}</p>
        </td></tr>
        <tr><td style="padding:22px 32px 0;">
          <div style="border:1px solid #e6dcc4;background:#fff;padding:18px 20px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;">
              <span style="color:#0B1A2E99;letter-spacing:0.12em;">注文番号 / ORDER No.</span>
              <span style="font-family:Georgia,serif;font-weight:700;color:#0B1A2E;letter-spacing:0.04em;">${escapeHtml(d.orderRef)}</span>
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
              ${itemsRowsHtml(d.items)}
              ${totalsHtml(d)}
            </table>
          </div>
          ${extraBlock}
          <div style="margin:16px 0 0;font-size:12px;line-height:1.8;color:#1D2432aa;">
            <div style="color:#0B1A2E99;letter-spacing:0.1em;font-size:11px;">お届け先 / SHIP TO</div>
            ${escapeHtml(d.customerName)} 様<br/>
            〒${escapeHtml(d.postalCode)}　${escapeHtml(d.address)}
          </div>
        </td></tr>
        <tr><td style="padding:26px 32px 34px;">
          <a href="${ctaUrl}" style="display:inline-block;background:#0B1A2E;color:#fbf9f3;text-decoration:none;font-size:11px;letter-spacing:0.26em;font-weight:600;padding:14px 28px;">${ctaLabel} →</a>
        </td></tr>
        <tr><td style="background:#0B1A2E;padding:22px 32px;color:#fbf9f399;font-size:11px;line-height:1.9;">
          ${escapeHtml(FUJISAN_LEGAL.sellerName)}<br/>
          ${escapeHtml(FUJISAN_LEGAL.address)}<br/>
          TEL ${escapeHtml(FUJISAN_LEGAL.phone)}　${escapeHtml(FUJISAN_LEGAL.email)}<br/>
          <span style="color:#C9A84C99;">20歳未満の飲酒は法律で禁止されています。</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── ① 注文確定（決済完了） ─────────────────────────────────────────

export async function sendOrderConfirmedEmail(d: OrderEmailData): Promise<void> {
  const { opts, baseUrl } = await resendOpts();
  const ctaUrl = `${baseUrl}/account`;

  const text = `FUJISAN SAKE — ご注文を承りました / Order confirmed

${d.customerName} 様

このたびはご注文いただきありがとうございます。お支払いを確認し、ご注文を確定しました。
蔵でひとつずつ検品し、原則 2 営業日以内に発送いたします。発送時に追跡番号をメールでお知らせします。

Thank you for your order. We've confirmed your payment.
Your bottles are hand-checked at the kura and dispatched within two business days.

────────────────────────────────
注文番号 / Order No.: ${d.orderRef}

${itemsText(d.items)}

小計 / Subtotal: ¥${yen.format(d.subtotal)}
送料 / Shipping: ${d.shipping === 0 ? "無料 / Free" : "¥" + yen.format(d.shipping)}
合計 / Total: ¥${yen.format(d.total)}
────────────────────────────────

お届け先 / Ship to:
${d.customerName} 様
〒${d.postalCode} ${d.address}

ご注文状況の確認 / View your order:
${ctaUrl}

${FUJISAN_LEGAL.sellerName}
${FUJISAN_LEGAL.address}
TEL ${FUJISAN_LEGAL.phone} / ${FUJISAN_LEGAL.email}
※20歳未満の飲酒は法律で禁止されています。
`;

  const html = htmlShell({
    badge: "ORDER CONFIRMED ／ ご注文確定",
    heading: "ご注文を承りました。",
    lead: `${escapeHtml(d.customerName)} 様、お支払いを確認しご注文を確定しました。蔵でひとつずつ検品し、原則2営業日以内に発送いたします。<br/><span style="color:#1D243299;">We've confirmed your payment. Your order is being prepared and ships within two business days.</span>`,
    d,
    ctaLabel: "ご注文状況を見る",
    ctaUrl,
  });

  await sendEmail(
    {
      to: d.customerEmail,
      subject: `FUJISAN — ご注文を承りました（${d.orderRef}）/ Order confirmed`,
      text,
      html,
    },
    opts,
  );
}

// ── ② 発送通知（追跡番号入り） ─────────────────────────────────────

export async function sendOrderShippedEmail(d: OrderEmailData): Promise<void> {
  const { opts, baseUrl } = await resendOpts();
  const ctaUrl = `${baseUrl}/account`;

  const hasTracking = Boolean(d.trackingCarrier || d.trackingNumber);
  const trackingText = hasTracking
    ? `\n配送会社 / Carrier: ${d.trackingCarrier ?? "-"}\n追跡番号 / Tracking No.: ${d.trackingNumber ?? "-"}\n`
    : "";
  const trackingHtml = hasTracking
    ? `<div style="margin:16px 0 0;border:1px solid #C9A84C55;background:#fbf6e8;padding:14px 18px;font-size:13px;line-height:1.8;color:#0B1A2E;">
         <div style="color:#0B1A2E99;letter-spacing:0.1em;font-size:11px;margin-bottom:4px;">追跡情報 / TRACKING</div>
         ${escapeHtml(d.trackingCarrier ?? "-")}　<strong style="font-weight:600;">${escapeHtml(d.trackingNumber ?? "-")}</strong>
       </div>`
    : "";

  const text = `FUJISAN SAKE — 商品を発送しました / Your order has shipped

${d.customerName} 様

ご注文（${d.orderRef}）の商品を発送いたしました。お届けまで今しばらくお待ちください。
Your order has been shipped. It will arrive shortly.
${trackingText}
お届け先 / Ship to:
${d.customerName} 様
〒${d.postalCode} ${d.address}

ご注文状況の確認 / Track your order:
${ctaUrl}

${FUJISAN_LEGAL.sellerName} / ${FUJISAN_LEGAL.email}
※20歳未満の飲酒は法律で禁止されています。
`;

  const html = htmlShell({
    badge: "SHIPPED ／ 発送のお知らせ",
    heading: "商品を発送しました。",
    lead: `${escapeHtml(d.customerName)} 様、ご注文の商品を発送いたしました。お届けまで今しばらくお待ちください。<br/><span style="color:#1D243299;">Your order is on its way.</span>`,
    d,
    extraBlock: trackingHtml,
    ctaLabel: "お届け状況を見る",
    ctaUrl,
  });

  await sendEmail(
    {
      to: d.customerEmail,
      subject: `FUJISAN — 商品を発送しました（${d.orderRef}）/ Your order has shipped`,
      text,
      html,
    },
    opts,
  );
}

// ── ③ お届け完了 ───────────────────────────────────────────────────

export async function sendOrderDeliveredEmail(d: OrderEmailData): Promise<void> {
  const { opts, baseUrl } = await resendOpts();
  const ctaUrl = `${baseUrl}/shop/personal`;

  const text = `FUJISAN SAKE — お届けが完了しました / Delivered

${d.customerName} 様

ご注文（${d.orderRef}）のお届けが完了しました。富士の恵みをどうぞお楽しみください。
Your order has been delivered. We hope you enjoy it.

商品は直射日光を避け、できるだけ涼しい場所で保管してください。開封後はお早めにお召し上がりください。
Please store away from direct sunlight in a cool place, and enjoy soon after opening.

またのご来訪をお待ちしております / Visit the shop again:
${ctaUrl}

${FUJISAN_LEGAL.sellerName} / ${FUJISAN_LEGAL.email}
※20歳未満の飲酒は法律で禁止されています。
`;

  const html = htmlShell({
    badge: "DELIVERED ／ お届け完了",
    heading: "お届けが完了しました。",
    lead: `${escapeHtml(d.customerName)} 様、ご注文のお届けが完了しました。富士の恵みをどうぞお楽しみください。直射日光を避け、涼しい場所での保管をおすすめします。<br/><span style="color:#1D243299;">Delivered — we hope you enjoy it. Store cool and away from sunlight.</span>`,
    d,
    ctaLabel: "ショップへ戻る",
    ctaUrl,
  });

  await sendEmail(
    {
      to: d.customerEmail,
      subject: `FUJISAN — お届けが完了しました（${d.orderRef}）/ Delivered`,
      text,
      html,
    },
    opts,
  );
}
