/**
 * お客様が入力したアドレスから mailto リンクを作る。
 *
 * 入力の検証は `?` や `&` を通すので、`mailto:${email}` と書くと
 * `x@example.com?bcc=...` のようなアドレスで、スタッフの返信の下書きに
 * BCC や本文を差し込める。`@` の前後を別々に符号化して、宛先の外へ出さない。
 */
export function mailtoHref(email: string, subject?: string): string {
  const at = email.lastIndexOf("@");
  const to =
    at < 0
      ? encodePart(email)
      : `${encodePart(email.slice(0, at))}@${encodePart(email.slice(at + 1))}`;
  return `mailto:${to}${subject ? `?subject=${encodePart(subject)}` : ""}`;
}

/**
 * Gmail の新規作成画面を開く URL。
 *
 * `mailto:` の開き先は端末の設定で決まり、ブラウザが受け取ると何も起きないことがある。
 * `account` を指定しないと、ブラウザの既定の Google アカウントで開く。
 */
export function gmailComposeHref(
  email: string,
  subject: string,
  account: string,
): string {
  return `https://mail.google.com/mail/?authuser=${encodePart(account)}&view=cm&fs=1&to=${encodePart(email)}&su=${encodePart(subject)}`;
}

/** 壊れた文字（孤立サロゲート）は encodeURIComponent が例外にするので、置き換えて続ける。 */
function encodePart(value: string): string {
  try {
    return encodeURIComponent(value);
  } catch {
    return encodeURIComponent(value.replace(/[\ud800-\udfff]/g, "\ufffd"));
  }
}
