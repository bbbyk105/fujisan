/**
 * @jest-environment jsdom
 */

// お問い合わせ管理の一覧。既定は対応が残っている分だけを出し、
// 読み込めなかったときに「0 件」と見せないこと。

import { render, screen } from "@testing-library/react";
import AdminContactsPage from "../page";

const listContacts = jest.fn();
jest.mock("@/lib/actions/admin-contacts", () => ({
  adminListContactsAction: (...a: unknown[]) => listContacts(...a),
  adminSetContactStatusAction: jest.fn(),
  adminReplyContactAction: jest.fn(),
}));
const getSession = jest.fn();
jest.mock("@/lib/session", () => ({
  getSession: (...a: unknown[]) => getSession(...a),
}));
jest.mock("@/lib/admin", () => ({
  getEffectiveAdminRole: async () => "owner",
  isStaffOrAbove: () => true,
  isOwner: () => true,
}));
const redirect = jest.fn((to: string) => {
  throw new Error(`redirect:${to}`);
});
jest.mock("next/navigation", () => ({
  redirect: (to: string) => redirect(to),
}));
jest.mock("@/lib/seo", () => ({ buildMetadata: () => ({}) }));
jest.mock("@/components/fujisan/FujisanNav", () => () => null);
jest.mock("@/components/fujisan/FujisanFooter", () => () => null);
jest.mock("@/components/fujisan/auth/LogoutButton", () => ({
  LogoutButton: () => null,
}));

async function renderPage(searchParams: { view?: string } = {}) {
  render(
    await AdminContactsPage({ searchParams: Promise.resolve(searchParams) }),
  );
}

const MESSAGE = {
  id: "c_1",
  name: "佐藤 優子",
  email: "sato@example.com",
  subject: "general",
  message: "本文",
  locale: "ja",
  status: "new",
  handledByEmail: null,
  handledAt: null,
  createdAt: new Date("2026-09-25T04:00:00Z"),
  replies: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  getSession.mockResolvedValue({
    user: { id: "admin_1", email: "owner@example.com" },
  });
  listContacts.mockResolvedValue({
    ok: true,
    messages: [],
    counts: { new: 0, inProgress: 0 },
  });
});

describe("AdminContactsPage", () => {
  it("既定では対応が残っている分だけを読み、その表示を現在地にする", async () => {
    await renderPage();

    expect(listContacts).toHaveBeenCalledWith({ openOnly: true });
    expect(
      screen
        .getByRole("link", { name: "未対応・対応中" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(screen.getByText(/対応済みのお問い合わせは/)).toBeTruthy();
  });

  it("「すべて」では対応済みも読む", async () => {
    await renderPage({ view: "all" });

    expect(listContacts).toHaveBeenCalledWith({ openOnly: false });
    expect(
      screen.getByRole("link", { name: "すべて" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(screen.getByText("お問い合わせはまだありません。")).toBeTruthy();
  });

  it("未対応と対応中の件数は、表示している行ではなく全件の集計を出す", async () => {
    listContacts.mockResolvedValue({
      ok: true,
      messages: [MESSAGE],
      counts: { new: 43, inProgress: 5 },
    });
    await renderPage();

    const labels = screen.getAllByRole("term").map((t) => t.textContent);
    const values = screen.getAllByRole("definition").map((d) => d.textContent);
    expect(labels).toEqual(["未対応", "対応中"]);
    expect(values).toEqual(["43件", "5件"]);
  });

  it("表示の上限に達したら、古い分が出ていないことを伝える", async () => {
    listContacts.mockResolvedValue({
      ok: true,
      messages: Array.from({ length: 200 }, (_, i) => ({
        ...MESSAGE,
        id: `c_${i}`,
      })),
      counts: { new: 200, inProgress: 0 },
    });
    await renderPage();

    expect(screen.getByText(/新しい順に 200 件まで/)).toBeTruthy();
  });

  // 通知メールの「管理画面で開く」から、ログインが切れた状態で来たとき。
  it("ログインが切れていたら、ログイン後に同じ表示へ戻す", async () => {
    getSession.mockResolvedValue(null);

    await expect(renderPage({ view: "all" })).rejects.toThrow("redirect:");

    const to = new URL(redirect.mock.calls[0][0], "https://example.com");
    expect(to.pathname).toBe("/login/personal");
    expect(to.searchParams.get("redirect")).toBe("/admin/contacts?view=all");
  });

  it("読み込めなかったときは 0 件と出さず、失敗を伝える", async () => {
    listContacts.mockResolvedValue({ ok: false, error: "db" });
    await renderPage();

    expect(screen.getByRole("alert").textContent).toContain("読み込みに失敗");
    expect(screen.queryByText("未対応")).toBeNull();
  });
});
