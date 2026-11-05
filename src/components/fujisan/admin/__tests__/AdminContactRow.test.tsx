/**
 * @jest-environment jsdom
 */

// お問い合わせ 1 件の行。守りたいのは次の 2 点:
//   1. 対応状況は選んだだけでは保存せず、「保存」を押して初めて保存する
//   2. 本文は開かなくても読める
// 返信は AdminContactReply.test.tsx。

import { act, fireEvent, render, screen } from "@testing-library/react";
import { AdminContactRow } from "../AdminContactRow";
import { hasUnsavedChanges } from "@/lib/unsaved-changes";

const setStatusAction = jest.fn();
jest.mock("@/lib/actions/admin-contacts", () => ({
  adminSetContactStatusAction: (...a: unknown[]) => setStatusAction(...a),
}));

function message(overrides: Record<string, unknown> = {}) {
  return {
    id: "c_1",
    name: "佐藤 優子",
    email: "sato@example.com",
    subject: "trade" as const,
    message: "取扱いについて\n教えてください。",
    locale: "ja",
    status: "new" as const,
    handledByEmail: null,
    handledAt: null,
    createdAt: new Date("2026-09-25T04:00:00Z"),
    replies: [],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  setStatusAction.mockResolvedValue({ ok: true });
});

describe("AdminContactRow", () => {
  it("本文を開かなくても読める", () => {
    render(<AdminContactRow message={message()} />);
    expect(screen.getByRole("listitem").textContent).toContain(
      "取扱いについて\n教えてください。",
    );
  });

  it("選んだだけでは保存せず、保存を押すと保存する", async () => {
    const { unmount } = render(<AdminContactRow message={message()} />);
    expect(screen.queryByRole("button", { name: "保存" })).toBeNull();

    fireEvent.click(screen.getByRole("radio", { name: "対応済み" }));

    expect(setStatusAction).not.toHaveBeenCalled();
    expect(hasUnsavedChanges()).toBe(true);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "保存" }));
    });

    expect(setStatusAction).toHaveBeenCalledWith({
      id: "c_1",
      status: "done",
      expectedStatus: "new",
    });
    unmount();
    expect(hasUnsavedChanges()).toBe(false);
  });

  it("元の状況に戻したら、未保存として扱わない", () => {
    render(<AdminContactRow message={message()} />);

    fireEvent.click(screen.getByRole("radio", { name: "対応中" }));
    fireEvent.click(screen.getByRole("radio", { name: "未対応" }));

    expect(screen.queryByRole("button", { name: "保存" })).toBeNull();
    expect(hasUnsavedChanges()).toBe(false);
  });

  it("保存に失敗したら理由を出し、選んだ状況は残す", async () => {
    setStatusAction.mockResolvedValue({ ok: false, error: "db" });
    render(<AdminContactRow message={message()} />);

    fireEvent.click(screen.getByRole("radio", { name: "対応中" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "保存" }));
    });

    expect(screen.getByRole("alert").textContent).toContain("保存に失敗");
    expect(
      (screen.getByRole("radio", { name: "対応中" }) as HTMLInputElement).checked,
    ).toBe(true);
  });

  describe("書きかけの返信があるとき", () => {
    let confirmSpy: jest.SpyInstance;

    beforeEach(() => {
      confirmSpy = jest.spyOn(window, "confirm");
    });
    afterEach(() => confirmSpy.mockRestore());

    function writeDraftAndPickDone() {
      render(<AdminContactRow message={message()} />);
      fireEvent.click(screen.getByRole("button", { name: "返信を書く" }));
      fireEvent.change(screen.getByRole("textbox", { name: "返信の本文" }), {
        target: { value: "書きかけ" },
      });
      fireEvent.click(screen.getByRole("radio", { name: "対応済み" }));
    }

    it("対応済みにする前に確認し、取り消したら保存しない", async () => {
      confirmSpy.mockReturnValue(false);
      writeDraftAndPickDone();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "保存" }));
      });

      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(setStatusAction).not.toHaveBeenCalled();
    });

    it("同意したら保存する", async () => {
      confirmSpy.mockReturnValue(true);
      writeDraftAndPickDone();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "保存" }));
      });

      expect(setStatusAction).toHaveBeenCalledTimes(1);
    });
  });

  it("英語のページから届いたことが分かる", () => {
    render(<AdminContactRow message={message({ locale: "en" })} />);
    expect(screen.getByText("英語のページから")).toBeTruthy();
  });

  it("ほかの管理者の更新が届いたら、触っていない行を未保存にしない", () => {
    const { rerender } = render(<AdminContactRow message={message()} />);

    rerender(
      <AdminContactRow
        message={message({
          status: "done",
          handledByEmail: "staff@example.com",
          handledAt: new Date("2026-09-26T04:00:00Z"),
        })}
      />,
    );

    expect(screen.queryByRole("button", { name: "保存" })).toBeNull();
    expect(
      (screen.getByRole("radio", { name: "対応済み" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(hasUnsavedChanges()).toBe(false);
  });

  it("保存に失敗したあと選び直したら、エラーを消す", async () => {
    setStatusAction.mockResolvedValue({ ok: false, error: "db" });
    render(<AdminContactRow message={message()} />);

    fireEvent.click(screen.getByRole("radio", { name: "対応中" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "保存" }));
    });
    fireEvent.click(screen.getByRole("radio", { name: "未対応" }));

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("保存中は選び直せない", () => {
    setStatusAction.mockReturnValue(new Promise(() => {}));
    render(<AdminContactRow message={message()} />);

    fireEvent.click(screen.getByRole("radio", { name: "対応中" }));
    fireEvent.click(screen.getByRole("button", { name: /保存/ }));

    // disabled プロパティは親の fieldset の無効化を反映しないので、:disabled で見る。
    expect(screen.getByRole("radio", { name: "対応済み" }).matches(":disabled")).toBe(
      true,
    );
  });

  it("選んでいる最中にほかの管理者の更新が届いても、選択は消さない", () => {
    const { rerender } = render(<AdminContactRow message={message()} />);

    fireEvent.click(screen.getByRole("radio", { name: "対応中" }));
    rerender(<AdminContactRow message={message({ status: "done" })} />);

    expect(
      (screen.getByRole("radio", { name: "対応中" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(screen.getByRole("button", { name: "保存" })).toBeTruthy();
  });

  it("保存したあとにほかの管理者が変えても、未保存にならない", async () => {
    const { rerender } = render(<AdminContactRow message={message()} />);

    fireEvent.click(screen.getByRole("radio", { name: "対応中" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "保存" }));
    });
    rerender(<AdminContactRow message={message({ status: "in_progress" })} />);
    rerender(<AdminContactRow message={message({ status: "done" })} />);

    expect(screen.queryByRole("button", { name: "保存" })).toBeNull();
    expect(hasUnsavedChanges()).toBe(false);
  });

  // 古い選択のまま残すと、もう一度の保存で相手の更新と対応者の記録を消してしまう。
  it("先に更新されていたら伝えて、最新の状況と対応者を見せる", async () => {
    setStatusAction.mockResolvedValue({ ok: false, error: "conflict" });
    const { rerender } = render(<AdminContactRow message={message()} />);

    fireEvent.click(screen.getByRole("radio", { name: "対応中" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "保存" }));
    });
    rerender(
      <AdminContactRow
        message={message({
          status: "done",
          handledByEmail: "staff@example.com",
          handledAt: new Date("2026-09-26T04:00:00Z"),
        })}
      />,
    );

    expect(screen.getByRole("alert").textContent).toContain("先に更新");
    expect(
      (screen.getByRole("radio", { name: "対応済み" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(screen.queryByRole("button", { name: "保存" })).toBeNull();
    expect(screen.getByRole("listitem").textContent).toContain(
      "staff@example.com",
    );
  });

  it("保存の結果を知らせる領域は、結果が出る前からある", () => {
    render(<AdminContactRow message={message()} />);
    // 対応状況の保存と返信で、領域は 2 つある。
    const regions = screen.getAllByRole("status");
    expect(regions.map((r) => r.textContent)).toEqual(["", ""]);
  });

  it("対応済みの行で別の状況を選んでいるあいだは、対応者を出さない", () => {
    render(
      <AdminContactRow
        message={message({
          status: "done",
          handledByEmail: "staff@example.com",
          handledAt: new Date("2026-09-26T04:00:00Z"),
        })}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "未対応" }));

    expect(screen.getByRole("listitem").textContent).not.toContain(
      "staff@example.com",
    );
  });

  it("対応済みには対応した人を出す", () => {
    render(
      <AdminContactRow
        message={message({
          status: "done",
          handledByEmail: "staff@example.com",
          handledAt: new Date("2026-09-26T04:00:00Z"),
        })}
      />,
    );
    expect(screen.getByRole("listitem").textContent).toContain(
      "staff@example.com",
    );
  });
});
