/**
 * @jest-environment jsdom
 */

// 退会しても注文の記録は残る（プライバシーポリシーでも保存すると書いている）。
// 確定の直前に「データは完全に削除される」へ同意させると、事実と違う同意になる。

import { fireEvent, render } from "@testing-library/react";

jest.mock("@/lib/actions/auth", () => ({
  deleteAccountAction: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn(), replace: jest.fn() }),
}));

import { DeleteAccountButton } from "@/components/fujisan/auth/DeleteAccountButton";
import { ORDER_PII_RETENTION_YEARS } from "@/data/fujisan-orders";

describe("退会の案内", () => {
  it("最初の説明で、注文の記録が残ることと領収書はメールで確認できることを伝える", () => {
    const text = render(<DeleteAccountButton />).container.textContent ?? "";
    expect(text).toContain(
      `ご注文の記録は注文日から${ORDER_PII_RETENTION_YEARS}年間保存し、その後は個人情報を削除します`,
    );
    expect(text).toContain("領収書は、決済時にお送りしたメールからご確認いただけます");
  });

  it("最終確認で、データがすべて消えるとは言わない", () => {
    const { container, getAllByRole } = render(<DeleteAccountButton />);
    fireEvent.click(getAllByRole("button")[0]);

    const text = container.textContent ?? "";
    expect(text).toContain("退会の最終確認");
    expect(text).not.toContain("データは完全に削除");
    expect(text).not.toContain("permanent and cannot be undone");
    expect(text).toContain("ご注文の記録は保存されること");
  });
});
