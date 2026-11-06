import { render } from "@testing-library/react";

// AuthShell がナビを読み、ナビは ESM 専用の better-auth クライアントを読む。
// ここで見たいのは左の面の有無だけなので外す。
jest.mock("@/components/fujisan/FujisanNav", () => () => null);
jest.mock("@/components/fujisan/FujisanFooter", () => () => null);

import { AuthHeading, AuthShell } from "@/components/fujisan/auth/AuthShell";

const crumb = {
  crumbHref: "/shop",
  crumbEn: "Back",
  crumbJp: "戻る",
};

describe("AuthShell", () => {
  it("案内があるときだけ左の面を出す", () => {
    const { container } = render(
      <AuthShell
        role="business"
        mode="login"
        brand={{
          ...crumb,
          panel: {
            titleEn: "For trade accounts",
            titleJp: "取扱店の方へ",
            textEn: "Text",
            textJp: "本文",
          },
        }}
      >
        <p>フォーム</p>
      </AuthShell>,
    );

    expect(container.querySelector("aside")?.textContent).toContain(
      "取扱店の方へ",
    );
  });

  it("案内が無ければ左の面を出さず、戻るリンクとフォームは残す", () => {
    const { container } = render(
      <AuthShell
        role="personal"
        mode="login"
        showRoleSwitch={false}
        brand={crumb}
      >
        <p>フォーム</p>
      </AuthShell>,
    );

    expect(container.querySelector("aside")).toBeNull();
    expect(container.textContent).toContain("戻る");
    expect(container.textContent).toContain("フォーム");
  });
});

describe("AuthHeading", () => {
  it("補足が無ければ見出しだけを出す", () => {
    const { container } = render(
      <AuthHeading titleEn="Sign in" titleJp="ログイン" />,
    );

    expect(container.querySelector("h1")?.textContent).toContain("ログイン");
    expect(container.querySelector("p")).toBeNull();
  });
});
