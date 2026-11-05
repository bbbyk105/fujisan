/**
 * @jest-environment jsdom
 */

// 既定の一覧は対応済みを出さないので、保存した行はその場で消える。
// 行の中の「保存しました」は見えないので、一覧の側に結果を残す。

import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { AdminContactList } from "../AdminContactList";

const setStatusAction = jest.fn();
jest.mock("@/lib/actions/admin-contacts", () => ({
  adminSetContactStatusAction: (...a: unknown[]) => setStatusAction(...a),
}));

const MESSAGE = {
  id: "c_1",
  name: "佐藤 優子",
  email: "sato@example.com",
  subject: "general" as const,
  message: "本文",
  locale: "ja",
  status: "new" as const,
  handledByEmail: null,
  handledAt: null,
  createdAt: new Date("2026-09-25T04:00:00Z"),
};

async function markDone() {
  fireEvent.click(screen.getByRole("radio", { name: "対応済み" }));
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  setStatusAction.mockResolvedValue({ ok: true });
});

describe("AdminContactList", () => {
  it("対応済みにして行が消えても、結果を残す", async () => {
    const { rerender } = render(
      <AdminContactList messages={[MESSAGE]} openOnly />,
    );

    await markDone();
    rerender(<AdminContactList messages={[]} openOnly />);

    expect(screen.queryByRole("listitem")).toBeNull();
    expect(screen.getByTestId("contact-result").textContent).toContain(
      "佐藤 優子 様のお問い合わせを対応済みにしました",
    );
  });

  it("「すべて」では行が残るので、一覧には結果を出さない", async () => {
    render(<AdminContactList messages={[MESSAGE]} openOnly={false} />);

    await markDone();

    expect(screen.getByTestId("contact-result").textContent).toBe("");
    expect(
      within(screen.getByRole("listitem")).getByText("保存しました"),
    ).toBeTruthy();
  });

  it("保存に失敗したら、対応済みにしたとは出さない", async () => {
    setStatusAction.mockResolvedValue({ ok: false, error: "db" });
    render(<AdminContactList messages={[MESSAGE]} openOnly />);

    await markDone();

    expect(screen.getByTestId("contact-result").textContent).toBe("");
  });

  // 別の管理者が対応済みにしていると、再読み込みで行ごと消える。行の中のエラーは見えない。
  it("先に更新されて行が消えても、そのことを残す", async () => {
    setStatusAction.mockResolvedValue({ ok: false, error: "conflict" });
    const { rerender } = render(
      <AdminContactList messages={[MESSAGE]} openOnly />,
    );

    await markDone();
    rerender(<AdminContactList messages={[]} openOnly />);

    expect(screen.getByTestId("contact-result").textContent).toContain(
      "佐藤 優子 様のお問い合わせは、ほかの管理者が先に更新しました",
    );
  });

  it("対応が残っている分が無ければ、対応済みの見方を案内する", () => {
    render(<AdminContactList messages={[]} openOnly />);
    expect(screen.getByText(/対応済みのお問い合わせは/)).toBeTruthy();
  });
});
