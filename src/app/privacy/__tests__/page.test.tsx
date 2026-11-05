/**
 * @jest-environment jsdom
 */

// プライバシーポリシーの保有期間は、実際の掃除の動きと一致させる。

import { render } from "@testing-library/react";

jest.mock("@/components/fujisan/editorial/DocumentPage", () => ({
  __esModule: true,
  default: ({
    sections,
    updated,
  }: {
    sections: Array<{ body: React.ReactNode[] }>;
    updated: string;
  }) => (
    <main>
      <p>{updated}</p>
      {sections.map((s, i) => (
        <section key={i}>{s.body}</section>
      ))}
    </main>
  ),
}));

import PrivacyPage from "@/app/privacy/page";
import { CONTACT_RETENTION_YEARS } from "@/data/fujisan-contact";
import { ORDER_PII_RETENTION_YEARS } from "@/data/fujisan-orders";

describe("プライバシーポリシーの保有期間", () => {
  const text = () => render(<PrivacyPage />).container.textContent ?? "";

  it("退会後の注文の保存期間を年数で示す", () => {
    expect(text()).toContain(
      `退会されたお客様とゲストとしてご購入のお客様のご注文は、注文日から${ORDER_PII_RETENTION_YEARS}年`,
    );
    expect(text()).toContain(`${ORDER_PII_RETENTION_YEARS} years`);
  });

  it("期間を過ぎると個人情報を消し、金額などの記録は残すことを書く", () => {
    const t = text();
    expect(t).toContain("お名前・ご住所・メールアドレス・電話番号");
    expect(t).toContain("金額と品目の記録");
  });

  it("お問い合わせの保存期間は、実際の掃除と同じ年数を出す", () => {
    expect(text()).toContain(`最長${CONTACT_RETENTION_YEARS}年間`);
  });

  it("内容を変えた月を最終更新に出す", () => {
    expect(text()).toContain("2026.11");
  });
});
