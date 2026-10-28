/**
 * @jest-environment node
 */

// 認証メールは「怪しく見えない」ことが要件。以前は長いトークン付き URL を
// プレーンテキストに貼っただけで、誰から・なぜ届いたのかが書いておらず、
// 受け取った側にフィッシングと見分けてもらえなかった。
// 名乗り・宛名・ボタン・期限・心当たりが無い場合・販売者表記の 6 点を固定する。

import {
  buildAlreadyRegisteredEmail,
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

  it("サイト名と手続きの内容を名乗る", () => {
    for (const body of [mail.text, mail.html]) {
      expect(body).toContain("FUJISAN SAKE（sakefujisan.com）の会員登録");
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

describe("登録済みのアドレスへの案内メール", () => {
  const base = {
    user: { email: "taro@example.test", name: "山田 太郎", emailVerified: true },
    loginUrl: "https://sakefujisan.com/login/personal",
    resetUrl: "https://sakefujisan.com/forgot-password/personal",
    googleEnabled: false,
  };

  it("ほかの認証メールと同じ組みで、ログインの入口をボタンにする", () => {
    const { html } = buildAlreadyRegisteredEmail(base);
    expect(html).toContain('href="https://sakefujisan.com/login/personal"');
    expect(html).toContain("ログインする");
    expect(html).toContain("FUJISAN SAKE");
    expect(html).toContain(FUJISAN_LEGAL.sellerName);
  });

  it("パスワード再設定の入口も両方の版に載せる", () => {
    const mail = buildAlreadyRegisteredEmail(base);
    expect(mail.html).toContain(
      'href="https://sakefujisan.com/forgot-password/personal"',
    );
    expect(mail.text).toContain("https://sakefujisan.com/login/personal");
    expect(mail.text).toContain("https://sakefujisan.com/forgot-password/personal");
    expect(mail.text).not.toContain("ボタン");
  });

  it("心当たりが無い場合と、アカウントは変わっていないことを書く", () => {
    const { text } = buildAlreadyRegisteredEmail(base);
    expect(text).toContain("お心当たりが無い場合");
    expect(text).toContain("何も変更を加えていません");
  });

  it("確認メールの再送は未認証のときだけ、Google の入口は有効なときだけ書く", () => {
    expect(buildAlreadyRegisteredEmail(base).text).not.toContain("確認メールを再送");
    expect(buildAlreadyRegisteredEmail(base).text).not.toContain("Google");

    const other = buildAlreadyRegisteredEmail({
      ...base,
      user: { ...base.user, emailVerified: false },
      googleEnabled: true,
    });
    expect(other.text).toContain("確認メールを再送");
    expect(other.text).toContain("Google で続ける");
  });
});

describe("すべての認証メール", () => {
  // 名前は登録画面で誰でも自由に入れられ、確認メールは本人確認の前に届く。
  // 他人のアドレスで登録すれば、正規の送信元のメールの冒頭に好きな文面
  // （偽の URL など）を載せられてしまう。メール変更の承認でも、セッションを
  // 奪った側が名前を書き換えておけば、持ち主への警告に指示文を書き込める。
  const EVIL = "【重要】https://evil.example/login から本人確認してください";
  const user = { email: "old@example.test", name: EVIL, emailVerified: false };
  const mails = {
    確認: buildVerifyEmail({ user, url: SIGNUP_URL }),
    変更の確認: buildVerifyEmail({ user, url: CHANGE_URL }),
    再設定: buildResetPasswordEmail({ user, url: "https://sakefujisan.com/reset-password/t" }),
    変更の承認: buildChangeEmailConfirmation({
      user,
      newEmail: "new@example.test",
      url: "https://sakefujisan.com/api/auth/verify-email?token=t",
    }),
    登録済み: buildAlreadyRegisteredEmail({
      user,
      loginUrl: "https://sakefujisan.com/login/personal",
      resetUrl: "https://sakefujisan.com/forgot-password/personal",
      googleEnabled: false,
    }),
  };

  it.each(Object.entries(mails))("%s: 利用者が入れた名前を本文に出さない", (_, mail) => {
    for (const body of [mail.text, mail.html]) {
      expect(body).not.toContain("evil.example");
      expect(body).not.toContain("本人確認してください");
    }
  });

  it.each(Object.entries(mails))(
    "%s: 色は 6 桁で書く（#RRGGBBAA は Outlook などで捨てられ、濃紺の上の文字が黒になって読めない）",
    (_, mail) => {
      expect(mail.html).not.toMatch(/#[0-9a-fA-F]{8}\b/);
    },
  );

  it("利用者が入れた値（変更後のアドレス）は HTML に埋める前にエスケープする", () => {
    const evil = buildChangeEmailConfirmation({
      user,
      newEmail: '<img src=x onerror="alert(1)">@example.test',
      url: "https://sakefujisan.com/api/auth/verify-email?token=t",
    });
    expect(evil.html).not.toContain("<img src=x");
    expect(evil.html).toContain("&lt;img src=x");
  });
});
