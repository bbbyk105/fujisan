/**
 * @jest-environment jsdom
 */

// 管理画面の中の絞り込みタブ。現在地が読み上げでも分かり、件数を出せること。

import { render, screen } from "@testing-library/react";
import { AdminSubNav } from "../AdminChrome";

jest.mock("@/components/fujisan/FujisanNav", () => () => null);
jest.mock("@/components/fujisan/FujisanFooter", () => () => null);
jest.mock("@/components/fujisan/auth/LogoutButton", () => ({
  LogoutButton: () => null,
}));

const ITEMS = [
  { href: "/admin/orders", label: "すべて", active: true, count: 12 },
  { href: "/admin/orders?filter=action", label: "要対応", active: false, count: 0 },
];

describe("AdminSubNav", () => {
  it("名前の付いたナビとして出し、現在地だけに印を付ける", () => {
    render(<AdminSubNav label="注文の絞り込み" items={ITEMS} />);

    expect(screen.getByRole("navigation", { name: "注文の絞り込み" })).toBeTruthy();
    const [all, action] = screen.getAllByRole("link");
    expect(all.getAttribute("aria-current")).toBe("page");
    expect(action.getAttribute("aria-current")).toBeNull();
  });

  it("件数は 0 でも出す", () => {
    render(<AdminSubNav label="注文の絞り込み" items={ITEMS} />);

    const [all, action] = screen.getAllByRole("link");
    expect(all.textContent).toBe("すべて12");
    expect(action.textContent).toBe("要対応0");
  });

  it("件数を渡さなければ出さない", () => {
    render(
      <AdminSubNav
        label="表示の切り替え"
        items={[{ href: "/admin/contacts", label: "すべて", active: true }]}
      />,
    );

    expect(screen.getByRole("link").textContent).toBe("すべて");
  });
});
