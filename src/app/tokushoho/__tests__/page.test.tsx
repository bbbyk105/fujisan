/**
 * @jest-environment jsdom
 */

// 免許番号は掲示しないことになった（2026-11-04 本人）。番号を出さないのに
// 「確認でき次第、本ページに掲示いたします」が残ると、守らない約束を公開し続ける。

import { render } from "@testing-library/react";

jest.mock("@/components/fujisan/editorial/EditorialPage", () => ({
  EditorialPage: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));

// 表示のアニメーションは jsdom では動かない。ここでは文言だけを見る。
jest.mock("@/components/reveal/Reveal", () => ({
  Reveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import TokushohoPage from "@/app/tokushoho/page";

describe("特定商取引法に基づく表示", () => {
  const text = () => render(<TokushohoPage />).container.textContent ?? "";

  it("免許番号の掲示を約束する文言を出さない", () => {
    expect(text()).not.toContain("確認中");
    expect(text()).not.toContain("通信販売酒類小売業免許");
    expect(text()).not.toContain("licence number is being confirmed");
  });

  it("内容を変えた月を最終更新に出す", () => {
    expect(text()).toContain("最終更新 2026.11");
  });

  it("酒類販売管理者標識の根拠法を正しく書く（酒税法ではない）", () => {
    const t = text();
    expect(t).toContain("酒税の保全及び酒類業組合等に関する法律第86条の9");
    expect(t).toContain("Act on Securing of Liquor Tax");
    expect(t).not.toContain("酒税法第86条の9");
    expect(t).not.toContain("Article 86-9 of the Liquor Tax Act");
  });

  it("販売業者と酒類販売管理者標識は出し続ける", () => {
    const t = text();
    expect(t).toContain("株式会社 近藤薬局");
    expect(t).toContain("酒類販売管理者");
    expect(t).toContain("近藤 弘人");
  });
});
