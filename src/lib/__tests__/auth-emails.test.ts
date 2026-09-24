/**
 * @jest-environment node
 */

// 認証メールは「怪しく見えない」ことが要件。以前は長いトークン付き URL を
// プレーンテキストに貼っただけで、誰から・なぜ届いたのかが書いておらず、
// 受け取った側にフィッシングと見分けてもらえなかった。
// 名乗り・宛名・ボタン・期限・心当たりが無い場合・販売者表記の 6 点を固定する。

import {
  buildChangeEmailConfirmation,
  buildResetPasswordEmail,
  buildVerifyEmail,
  verificationPurpose,
} from "@/lib/emails/auth-emails";
import { FUJISAN_LEGAL } from "@/data/fujisan-legal";

function b64url(obj: object): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

/** Better Auth が作るのと同じ形の確認 URL（署名は検証しないのでダミー）。 */
function verifyUrl(payload: object): string {
  const token = `${b64url({ alg: "HS256" })}.${b64url(payload)}.sig`;
  return `https://sakefujisan.com/api/auth/verify-email?token=${token}&callbackURL=%2Femail-verified`;
}

const SIGNUP_URL = verifyUrl({ email: "yuko@example.test" });
const CHANGE_URL = verifyUrl({
  email: "old@example.test",
  updateTo: "new@example.test",
  requestType: "change-email-verification",
});

describe("verificationPurpose", () => {
  it("トークンの requestType でメールアドレス変更の確認を見分ける", () => {
    expect(verificationPurpose(CHANGE_URL)).toBe("change-email");
    expect(verificationPurpose(SIGNUP_URL)).toBe("signup");
  });

  it("読めないトークンは会員登録として扱う（送信を止めない）", () => {
    expect(verificationPurpose("https://sakefujisan.com/api/auth/verify-email?token=broken")).toBe("signup");
    expect(verificationPurpose("not a url")).toBe("signup");
  });
});

describe("会員登録の確認メール", () => {
  const mail = buildVerifyEmail({ user: { name: "佐藤 優子" }, url: SIGNUP_URL });

  it("リンクはボタンにし、生の URL は予備として添える", () => {
    const href = SIGNUP_URL.replace(/&/g, "&amp;");
    expect(mail.html).toContain(`<a href="${href}"`);
    expect(mail.html).toContain("メールアドレスを確認する</a>");
    expect(mail.html).toContain("ボタンが押せない場合");
  });

  it("サイト名と手続きの内容を名乗り、宛名を入れる", () => {
    for (const body of [mail.text, mail.html]) {
      expect(body).toContain("FUJISAN SAKE（sakefujisan.com）の会員登録");
      expect(body).toContain("佐藤 優子 様");
    }
  });

  it("有効期限と、心当たりが無い場合の案内を書く", () => {
    for (const body of [mail.text, mail.html]) {
      expect(body).toContain("リンクの有効期限は 1 時間です");
      expect(body).toContain("お心当たりが無い場合は");
    }
  });

  it("末尾に販売者と問い合わせ先を載せる", () => {
    for (const body of [mail.text, mail.html]) {
      expect(body).toContain(FUJISAN_LEGAL.sellerName);
      expect(body).toContain(FUJISAN_LEGAL.email);
    }
  });

  it("テキスト版には URL をそのまま載せ、「ボタン」とは書かない", () => {
    expect(mail.text).toContain(SIGNUP_URL);
    expect(mail.text).not.toContain("下のボタン");
    expect(mail.text).toContain("下のリンクを開いて");
  });

  it("名前が無いときは宛名の行ごと出さない（「様」だけ残さない）", () => {
    const noName = buildVerifyEmail({ user: { name: "" }, url: SIGNUP_URL });
    expect(noName.text).not.toMatch(/^\s*様$/m);
    expect(noName.html).not.toContain(">様<");
  });

  it("名前は HTML に埋める前にエスケープする", () => {
    const evil = buildVerifyEmail({
      user: { name: '<img src=x onerror="alert(1)">' },
      url: SIGNUP_URL,
    });
    expect(evil.html).not.toContain("<img src=x");
    expect(evil.html).toContain("&lt;img src=x");
  });
});

describe("メールアドレス変更の確認メール（新しいアドレス宛）", () => {
  it("会員登録ではなく、アドレス変更として案内する", () => {
    const mail = buildVerifyEmail({ user: { name: "佐藤 優子" }, url: CHANGE_URL });
    // ここで「会員登録」と書くと、登録した覚えのない人には詐欺に見える。
    expect(mail.text).not.toContain("会員登録");
    expect(mail.text).toContain("メールアドレスをこのアドレスへ変更する");
    expect(mail.html).toContain("変更を完了する</a>");
  });
});

describe("パスワード再設定メール", () => {
  it("手続きの内容・期限・心当たりが無い場合を書く", () => {
    const url = "https://sakefujisan.com/api/auth/reset-password/tok?callbackURL=%2Freset-password";
    const mail = buildResetPasswordEmail({ user: { name: "佐藤 優子" }, url });
    expect(mail.subject).toContain("パスワードの再設定");
    for (const body of [mail.text, mail.html]) {
      expect(body).toContain("パスワードの再設定のお申し込みがありました");
      expect(body).toContain("リンクの有効期限は 1 時間です");
      expect(body).toContain("パスワードは変わりません");
    }
  });
});

describe("メールアドレス変更の承認メール（変更前のアドレス宛）", () => {
  it("新旧のアドレスを両方の版に載せる", () => {
    const mail = buildChangeEmailConfirmation({
      user: { email: "old@example.test", name: "佐藤 優子" },
      newEmail: "new@example.test",
      url: "https://sakefujisan.com/api/auth/verify-email?token=t",
    });
    expect(mail.text).toContain("変更前: old@example.test");
    expect(mail.text).toContain("変更後: new@example.test");
    expect(mail.html).toContain("変更前: old@example.test<br />変更後: new@example.test");
  });
});
