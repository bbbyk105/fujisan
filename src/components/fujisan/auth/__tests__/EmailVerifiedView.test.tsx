import { render } from "@testing-library/react";

// AuthHeading と同じファイルにある AuthShell がナビを読み、ナビは ESM 専用の
// better-auth クライアントを読む。ここで見たいのは結果の文言とリンクだけなので外す。
jest.mock("@/components/fujisan/FujisanNav", () => () => null);
jest.mock("@/components/fujisan/FujisanFooter", () => () => null);

import {
  EmailVerifiedView,
  emailVerifiedStateOf,
} from "@/components/fujisan/auth/EmailVerifiedView";
import { emailVerifiedCallbackURL } from "@/lib/auth-shared";

describe("emailVerifiedStateOf", () => {
  it("Better Auth の error を、成功・期限切れ・それ以外に分ける", () => {
    expect(emailVerifiedStateOf(undefined)).toBe("ok");
    expect(emailVerifiedStateOf("TOKEN_EXPIRED")).toBe("expired");
    expect(emailVerifiedStateOf("INVALID_TOKEN")).toBe("invalid");
    expect(emailVerifiedStateOf("USER_NOT_FOUND")).toBe("invalid");
  });
});

describe("emailVerifiedCallbackURL", () => {
  it("法人だけ role を付けて、確認後の案内とログイン先を分ける", () => {
    expect(emailVerifiedCallbackURL("personal")).toBe("/email-verified");
    expect(emailVerifiedCallbackURL("business")).toBe(
      "/email-verified?role=business",
    );
  });
});

describe("emailVerifiedCallbackURL — 登録後の戻り先", () => {
  it("カートから来た登録は、戻り先を引き継ぐ", () => {
    expect(emailVerifiedCallbackURL("personal", "/cart?resume=checkout")).toBe(
      "/email-verified?redirect=%2Fcart%3Fresume%3Dcheckout",
    );
  });

  it("外へ出る戻り先は引き継がない", () => {
    expect(
      emailVerifiedCallbackURL("personal", "https://evil.example/"),
    ).toBe("/email-verified");
  });
});

describe("EmailVerifiedView — 登録後の戻り先", () => {
  it("確認できたら、ログインのあと元の画面へ戻るリンクを出す", () => {
    const { getByRole } = render(
      <EmailVerifiedView
        role="personal"
        state="ok"
        redirectTo="/cart?resume=checkout"
      />,
    );

    expect(getByRole("link", { name: /ログインする/ }).getAttribute("href")).toBe(
      "/login/personal?redirect=%2Fcart%3Fresume%3Dcheckout",
    );
  });
});

describe("EmailVerifiedView", () => {
  it("確認できたら、その旨とログインへの入口を出す", () => {
    const { container, getByRole } = render(
      <EmailVerifiedView role="personal" state="ok" />,
    );
    expect(getByRole("heading", { level: 1 }).textContent).toContain(
      "メールアドレスを確認しました",
    );
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/login/personal");
    expect(link?.textContent).toContain("ログインする");
  });

  it("法人は取扱店のログインへ案内し、卸価格が審査後であることを書く", () => {
    const { container } = render(
      <EmailVerifiedView role="business" state="ok" />,
    );
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "/login/business",
    );
    expect(container.textContent).toContain("卸価格は承認後に表示されます");
  });

  it("期限切れなら、送り直し方を案内する", () => {
    const { container, getByRole } = render(
      <EmailVerifiedView role="personal" state="expired" />,
    );
    expect(getByRole("heading", { level: 1 }).textContent).toContain(
      "有効期限が切れています",
    );
    expect(container.textContent).toContain("確認メールを送り直せます");
    expect(container.textContent).not.toContain("確認しました");
  });

  it("壊れたリンクなら、確認できなかったことを伝える", () => {
    const { getByRole } = render(
      <EmailVerifiedView role="personal" state="invalid" />,
    );
    expect(getByRole("heading", { level: 1 }).textContent).toContain(
      "確認できませんでした",
    );
  });
});
