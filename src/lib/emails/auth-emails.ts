import { FUJISAN_LEGAL } from "@/data/fujisan-legal";
import { AUTH_LINK_TTL_SEC } from "@/lib/auth-shared";

/**
 * 認証まわりのメール（アドレスの確認・パスワードの再設定・アドレス変更の承認）の本文。
 *
 * Better Auth から届く確認リンクは JWT をそのまま含む長い URL で、以前はそれを
 * プレーンテキストに直に貼っていた。誰から・なぜ届いたのかも書いておらず、
 * 受け取った側からはフィッシングと見分けがつかなかった。そのため、
 *
 *   - 冒頭で「どのサイトの、どの手続きか」を名乗り、宛名を入れる
 *   - リンクはボタンにし、生の URL は「押せない場合」の予備として小さく添える
 *   - 有効期限と「心当たりが無い場合」を必ず書く
 *   - 末尾に販売者（特商法の表記と同じ）と問い合わせ先を置く
 *
 * の 4 点をすべてのメールでそろえる。
 *
 * `src/lib/auth.ts` の `buildAuthOptions` から呼ばれ、CLI（`generate`）用の静的
 * インスタンスでも読み込まれる。Cloudflare のコンテキストや server-only に依存させないこと。
 */

export type AuthEmail = { subject: string; text: string; html: string };

type Recipient = { name?: string | null };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ttlJa(): string {
  const min = Math.round(AUTH_LINK_TTL_SEC / 60);
  return min % 60 === 0 ? `${min / 60} 時間` : `${min} 分`;
}

function ttlEn(): string {
  const min = Math.round(AUTH_LINK_TTL_SEC / 60);
  if (min % 60 !== 0) return `${min} minutes`;
  const h = min / 60;
  return h === 1 ? "1 hour" : `${h} hours`;
}

/** リンクの向き先のホスト名。本文で名乗るサイト名とリンク先を必ず一致させる。 */
function siteHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "sakefujisan.com";
  }
}

/**
 * 確認メールが「会員登録」と「メールアドレスの変更（新しいアドレス宛）」の
 * どちらで送られたかを見分ける。
 *
 * Better Auth は両方で同じ `sendVerificationEmail` を呼ぶため、呼び出し側からは
 * 区別できない。トークン（JWT）の `requestType` にだけ違いが出るので、それを読む。
 * 署名の検証はしない（文面を選ぶためだけに使い、認可には使わない）。
 */
export function verificationPurpose(url: string): "signup" | "change-email" {
  try {
    const token = new URL(url).searchParams.get("token") ?? "";
    const part = token.split(".")[1] ?? "";
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "="));
    const payload = JSON.parse(json) as { requestType?: unknown };
    return payload.requestType === "change-email-verification"
      ? "change-email"
      : "signup";
  } catch {
    return "signup";
  }
}

// ── 共通の組み ─────────────────────────────────────────────

type Layout = {
  /** 受信一覧で件名の横に出る 1 行（本文の先頭が出るのを防ぐ）。 */
  preheader: string;
  heading: string;
  greeting: string | null;
  /** 本文の段落。素の文字列で渡す（改行は HTML では <br /> になる）。 */
  paragraphs: string[];
  ctaLabel: string;
  url: string;
  /** 有効期限と「心当たりが無い場合」の注意。 */
  notes: string[];
  /** 英語の要約（同じ内容を短く）。 */
  english: string[];
};

function footerText(): string {
  return [
    `${FUJISAN_LEGAL.sellerName}`,
    `${FUJISAN_LEGAL.address}`,
    // phoneHours は括弧を含むので、さらに括弧で囲まない。
    `TEL ${FUJISAN_LEGAL.phone}　${FUJISAN_LEGAL.phoneHours}`,
    `お問い合わせ: ${FUJISAN_LEGAL.email}`,
  ].join("\n");
}

function renderHtml(l: Layout): string {
  const host = escapeHtml(siteHost(l.url));
  const href = escapeHtml(l.url);
  const html = (s: string) => escapeHtml(s).replace(/\n/g, "<br />");
  const p = (s: string) =>
    `<p style="margin:0 0 16px;font-size:14px;line-height:1.9;color:#0B1A2E;">${html(s)}</p>`;
  const note = (s: string) =>
    `<p style="margin:0 0 8px;font-size:12.5px;line-height:1.8;color:#0B1A2Ebb;">${html(s)}</p>`;

  return `<!doctype html>
<html lang="ja">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f3efe4;font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans','Noto Sans JP',sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(l.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe4;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fbf9f3;border:1px solid #e6dcc4;">
        <tr><td style="background:#0B1A2E;padding:22px 32px;">
          <div style="font-family:Georgia,'Times New Roman',serif;color:#fbf9f3;font-size:19px;letter-spacing:0.16em;font-weight:600;">FUJISAN SAKE</div>
          <div style="color:#fbf9f3aa;font-size:12px;margin-top:4px;">${host}</div>
        </td></tr>
        <tr><td style="padding:32px 32px 8px;">
          <h1 style="margin:0 0 20px;font-size:20px;line-height:1.5;font-weight:600;color:#0B1A2E;">${escapeHtml(l.heading)}</h1>
          ${l.greeting ? p(l.greeting) : ""}
          ${l.paragraphs.map(p).join("\n          ")}
        </td></tr>
        <tr><td style="padding:8px 32px 24px;">
          <a href="${href}" style="display:inline-block;background:#0B1A2E;color:#fbf9f3;text-decoration:none;font-size:14px;font-weight:600;padding:14px 32px;">${escapeHtml(l.ctaLabel)}</a>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          ${l.notes.map(note).join("\n          ")}
        </td></tr>
        <tr><td style="padding:0 32px 28px;">
          <div style="border-top:1px solid #e6dcc4;padding-top:16px;font-size:11.5px;line-height:1.7;color:#0B1A2E99;">
            ボタンが押せない場合は、次の URL をブラウザで開いてください。<br />
            <a href="${href}" style="color:#0B1A2E99;word-break:break-all;">${href}</a>
          </div>
        </td></tr>
        <tr><td style="padding:0 32px 28px;">
          <div style="border-top:1px solid #e6dcc4;padding-top:16px;font-size:12px;line-height:1.8;color:#0B1A2E99;">
            ${l.english.map(escapeHtml).join("<br />")}
          </div>
        </td></tr>
        <tr><td style="background:#0B1A2E;padding:22px 32px;color:#fbf9f3aa;font-size:11px;line-height:1.9;">
          このメールは ${host} でのお手続きにともない、自動で送信しています。<br />
          ${escapeHtml(FUJISAN_LEGAL.sellerName)}<br />
          ${escapeHtml(FUJISAN_LEGAL.address)}<br />
          TEL ${escapeHtml(FUJISAN_LEGAL.phone)}　${escapeHtml(FUJISAN_LEGAL.phoneHours)}<br />
          お問い合わせ: <a href="mailto:${escapeHtml(FUJISAN_LEGAL.email)}" style="color:#fbf9f3cc;">${escapeHtml(FUJISAN_LEGAL.email)}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * プレーンテキスト版の言い回し。テキスト版にはボタンが無く、URL がそのまま並ぶ。
 */
function forText(s: string): string {
  return s
    .replace(/ボタンを押して/g, "リンクを開いて")
    .replace(/ボタンを押すと/g, "リンクを開くと")
    .replace(/下のボタン/g, "下のリンク")
    .replace(/button above/g, "link above");
}

/** プレーンテキスト版。HTML を表示しないメールソフト向けで、内容は HTML と同じにする。 */
function renderText(l: Layout): string {
  return [
    "FUJISAN SAKE",
    siteHost(l.url),
    "",
    l.heading,
    "",
    ...(l.greeting ? [l.greeting, ""] : []),
    ...l.paragraphs.flatMap((s) => [forText(s), ""]),
    `${l.ctaLabel}:`,
    l.url,
    "",
    ...l.notes,
    "",
    "----",
    ...l.english.map(forText),
    "----",
    "",
    `このメールは ${siteHost(l.url)} でのお手続きにともない、自動で送信しています。`,
    footerText(),
    "",
  ].join("\n");
}

function greetingOf(user: Recipient): string | null {
  const name = user.name?.trim();
  // 名前が無いときに「様」だけ残すと崩れるので、行ごと出さない。
  return name ? `${name} 様` : null;
}

// ── 各メール ────────────────────────────────────────────────

/** 会員登録の確認、またはメールアドレス変更の最後の確認（新しいアドレス宛）。 */
export function buildVerifyEmail(args: {
  user: Recipient;
  url: string;
}): AuthEmail {
  const { user, url } = args;
  const host = siteHost(url);

  if (verificationPurpose(url) === "change-email") {
    const paragraphs = [
      `FUJISAN SAKE（${host}）で、ご登録のメールアドレスをこのアドレスへ変更するお手続きがありました。`,
      "下のボタンを押すと、変更が完了します。",
    ];
    const layout: Layout = {
      preheader: `メールアドレスの変更を完了するための確認です。リンクの有効期限は ${ttlJa()}です。`,
      heading: "メールアドレス変更の確認",
      greeting: greetingOf(user),
      paragraphs,
      ctaLabel: "変更を完了する",
      url,
      notes: [
        `リンクの有効期限は ${ttlJa()}です。`,
        "お心当たりが無い場合は、このメールを破棄してください。メールアドレスは変更されません。",
      ],
      english: [
        `Someone asked to change the email address of a FUJISAN SAKE (${host}) account to this address.`,
        `Use the button above to finish the change. The link expires in ${ttlEn()}.`,
        "If this wasn't you, ignore this email and nothing will change.",
      ],
    };
    return {
      subject: "FUJISAN — メールアドレス変更の確認 / Confirm your new email",
      text: renderText(layout),
      html: renderHtml(layout),
    };
  }

  const paragraphs = [
    `FUJISAN SAKE（${host}）の会員登録をお申し込みいただき、ありがとうございます。`,
    "下のボタンを押して、メールアドレスの確認を済ませてください。確認が済むと、ログインできるようになります。",
  ];
  const layout: Layout = {
    preheader: `会員登録を完了するための確認です。リンクの有効期限は ${ttlJa()}です。`,
    heading: "メールアドレスの確認",
    greeting: greetingOf(user),
    paragraphs,
    ctaLabel: "メールアドレスを確認する",
    url,
    notes: [
      `リンクの有効期限は ${ttlJa()}です。期限が切れた場合は、ログイン画面から確認メールを送り直せます。`,
      "お心当たりが無い場合は、このメールを破棄してください。確認が済まない限り、登録は完了しません。",
    ],
    english: [
      `Thank you for signing up at FUJISAN SAKE (${host}).`,
      `Please confirm your email address with the button above. The link expires in ${ttlEn()}.`,
      "If you didn't sign up, you can ignore this email.",
    ],
  };
  return {
    subject: "FUJISAN — メールアドレスの確認 / Verify your email",
    text: renderText(layout),
    html: renderHtml(layout),
  };
}

/** パスワードの再設定。 */
export function buildResetPasswordEmail(args: {
  user: Recipient;
  url: string;
}): AuthEmail {
  const { user, url } = args;
  const host = siteHost(url);
  const paragraphs = [
    `FUJISAN SAKE（${host}）で、パスワードの再設定のお申し込みがありました。`,
    "下のボタンから、新しいパスワードを設定してください。",
  ];
  const layout: Layout = {
    preheader: `パスワードを再設定するためのリンクです。有効期限は ${ttlJa()}です。`,
    heading: "パスワードの再設定",
    greeting: greetingOf(user),
    paragraphs,
    ctaLabel: "パスワードを再設定する",
    url,
    notes: [
      `リンクの有効期限は ${ttlJa()}です。期限が切れた場合は、もう一度お申し込みください。`,
      "お心当たりが無い場合は、このメールを破棄してください。パスワードは変わりません。",
    ],
    english: [
      `We received a request to reset the password for your FUJISAN SAKE (${host}) account.`,
      `Use the button above to choose a new one. The link expires in ${ttlEn()}.`,
      "If you didn't ask for this, ignore this email and your password will stay the same.",
    ],
  };
  return {
    subject: "FUJISAN — パスワードの再設定 / Reset your password",
    text: renderText(layout),
    html: renderHtml(layout),
  };
}

/**
 * メールアドレス変更の承認（**変更前**のアドレス宛）。
 * 宛先を変更前にする理由は `src/lib/auth.ts` の `changeEmail` を参照。
 */
export function buildChangeEmailConfirmation(args: {
  user: Recipient & { email: string };
  newEmail: string;
  url: string;
}): AuthEmail {
  const { user, newEmail, url } = args;
  const host = siteHost(url);
  const layout: Layout = {
    preheader: `ご登録のメールアドレスを ${newEmail} へ変更するお申し込みがありました。`,
    heading: "メールアドレス変更の承認",
    greeting: greetingOf(user),
    paragraphs: [
      `FUJISAN SAKE（${host}）で、ご登録のメールアドレスを次のアドレスへ変更するお申し込みがありました。`,
      `変更前: ${user.email}\n変更後: ${newEmail}`,
      "お心当たりがある場合は、下のボタンから承認してください。承認後、新しいアドレス宛に確認メールをお送りします。そちらのリンクを開くと変更が完了します。",
    ],
    ctaLabel: "変更を承認する",
    url,
    notes: [
      `リンクの有効期限は ${ttlJa()}です。`,
      "お心当たりが無い場合は、このリンクを開かないでください。このメールを破棄すれば、メールアドレスは変更されません。念のため、パスワードの変更もご検討ください。",
    ],
    english: [
      `We received a request to change the email address of your FUJISAN SAKE (${host}) account to ${newEmail}.`,
      "If this was you, approve it with the button above. We'll then email the new address to finish the change.",
      "If this wasn't you, do not open the link. Your address will stay as it is.",
    ],
  };
  return {
    subject: "FUJISAN — メールアドレス変更の確認 / Confirm your email change",
    text: renderText(layout),
    html: renderHtml(layout),
  };
}
