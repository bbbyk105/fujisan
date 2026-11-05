/**
 * @jest-environment jsdom
 */

// お問い合わせへの返信。お客様に届くメールは取り消せないので、守りたいのは次の 4 点:
//   1. 確認で同意するまで送らない
//   2. 送れなかったら本文を残して、理由を伝える
//   3. 届いたのに記録できなかったら、再送しないよう伝える
//   4. 書きかけを黙って捨てない

import { act, fireEvent, render, screen } from "@testing-library/react";
import { AdminContactReply } from "../AdminContactReply";
import { hasUnsavedChanges } from "@/lib/unsaved-changes";

const replyAction = jest.fn();
jest.mock("@/lib/actions/admin-contacts", () => ({
  adminReplyContactAction: (...a: unknown[]) => replyAction(...a),
}));

function message(overrides: Record<string, unknown> = {}) {
  return {
    id: "c_1",
    name: "佐藤 優子",
    email: "sato@example.com",
    subject: "trade" as const,
    message: "取扱いについて教えてください。",
    locale: "ja",
    status: "new" as const,
    handledByEmail: null,
    handledAt: null,
    createdAt: new Date("2026-09-25T04:00:00Z"),
    replies: [],
    ...overrides,
  };
}

function openForm(text?: string) {
  fireEvent.click(screen.getByRole("button", { name: "返信を書く" }));
  if (text !== undefined) {
    fireEvent.change(screen.getByRole("textbox", { name: "返信の本文" }), {
      target: { value: text },
    });
  }
}

async function pressSend() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "送信" }));
  });
}

describe("AdminContactReply", () => {
  let confirmSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    replyAction.mockResolvedValue({ ok: true, recorded: true });
    confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    confirmSpy.mockRestore();
    jest.useRealTimers();
    delete (navigator as { clipboard?: unknown }).clipboard;
  });

  it("返信を書くを押すまで入力欄を出さない", () => {
    render(<AdminContactReply message={message()} />);

    expect(screen.queryByRole("textbox")).toBeNull();
    openForm();
    expect(screen.getByRole("textbox", { name: "返信の本文" })).toBeTruthy();
  });

  it("本文が無ければ送信できない", () => {
    render(<AdminContactReply message={message()} />);
    openForm("   ");

    expect(
      (screen.getByRole("button", { name: "送信" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("宛先を見せて確認し、同意したら送って入力欄を閉じる", async () => {
    const { unmount } = render(<AdminContactReply message={message()} />);
    openForm("ご連絡ありがとうございます。");

    await pressSend();

    expect(confirmSpy.mock.calls[0][0]).toContain("sato@example.com");
    expect(replyAction).toHaveBeenCalledWith({
      id: "c_1",
      body: "ご連絡ありがとうございます。",
      expectedReplies: 0,
    });
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("送信しました");
    unmount();
    expect(hasUnsavedChanges()).toBe(false);
  });

  it("確認で取り消したら送らず、本文は残す", async () => {
    confirmSpy.mockReturnValue(false);
    render(<AdminContactReply message={message()} />);
    openForm("書きかけ");

    await pressSend();

    expect(replyAction).not.toHaveBeenCalled();
    expect(
      (screen.getByRole("textbox", { name: "返信の本文" }) as HTMLTextAreaElement)
        .value,
    ).toBe("書きかけ");
  });

  it("送れなかったら本文を残し、理由を出す", async () => {
    replyAction.mockResolvedValue({ ok: false, error: "send" });
    render(<AdminContactReply message={message()} />);
    openForm("本文");

    await pressSend();

    expect(screen.getByRole("alert").textContent).toContain("送信できませんでした");
    expect(
      (screen.getByRole("textbox", { name: "返信の本文" }) as HTMLTextAreaElement)
        .value,
    ).toBe("本文");
  });

  it("先に返信されていたら本文を残し、そのことを伝える", async () => {
    replyAction.mockResolvedValue({ ok: false, error: "conflict" });
    render(<AdminContactReply message={message()} />);
    openForm("本文");

    await pressSend();

    expect(screen.getByRole("alert").textContent).toContain("先に返信");
    expect(
      (screen.getByRole("textbox", { name: "返信の本文" }) as HTMLTextAreaElement)
        .value,
    ).toBe("本文");
  });

  // 応答が失われただけで届いていることがあるので、再送を勧めない。
  it("応答が返らなかったら本文を残し、確認できないと伝える", async () => {
    replyAction.mockRejectedValue(new Error("network"));
    render(<AdminContactReply message={message()} />);
    openForm("本文");

    await pressSend();

    expect(screen.getByRole("alert").textContent).toContain("確認できませんでした");
    expect(
      (screen.getByRole("textbox", { name: "返信の本文" }) as HTMLTextAreaElement)
        .value,
    ).toBe("本文");
  });

  it("届いたのに記録できなかったら、再送しないよう伝える", async () => {
    replyAction.mockResolvedValue({ ok: true, recorded: false });
    render(<AdminContactReply message={message()} />);
    openForm("本文");

    await pressSend();

    expect(screen.getByRole("status").textContent).toContain("再送しないで");
  });

  it("書きかけがあるあいだは、画面の移動に確認を挟む", () => {
    const { unmount } = render(<AdminContactReply message={message()} />);
    openForm("書きかけ");

    expect(hasUnsavedChanges()).toBe(true);
    unmount();
  });

  it("書きかけをキャンセルするときは確認し、取り消したら残す", () => {
    confirmSpy.mockReturnValue(false);
    render(<AdminContactReply message={message()} />);
    openForm("書きかけ");

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox", { name: "返信の本文" })).toBeTruthy();
  });

  it("何も書いていなければ、確認せずに閉じる", () => {
    render(<AdminContactReply message={message()} />);
    openForm();

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("送った返信を、送信者と一緒に出す", () => {
    render(
      <AdminContactReply
        message={message({
          replies: [
            {
              id: "r_1",
              body: "ご案内いたします。",
              sentByEmail: "staff@example.com",
              createdAt: new Date("2026-09-26T04:00:00Z"),
            },
          ],
        })}
      />,
    );

    const text = screen.getByRole("list").textContent;
    expect(text).toContain("ご案内いたします。");
    expect(text).toContain("staff@example.com");
  });

  describe("アドレスのコピー", () => {
    function press(name: string) {
      return act(async () => {
        fireEvent.click(screen.getByRole("button", { name }));
      });
    }

    it("お客様のアドレスをコピーできる", async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });
      render(<AdminContactReply message={message()} />);

      await press("アドレスをコピー");

      expect(writeText).toHaveBeenCalledWith("sato@example.com");
      expect(screen.getByRole("button", { name: "コピーしました" })).toBeTruthy();
    });

    it("クリップボードが使えない環境でも、できなかったことを伝える", async () => {
      render(<AdminContactReply message={message()} />);

      await press("アドレスをコピー");

      expect(
        screen.getByRole("button", { name: "コピーできませんでした" }),
      ).toBeTruthy();
    });

    it("押し直しても、前のタイマーで新しい結果を消さない", async () => {
      jest.useFakeTimers();
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: jest
            .fn()
            .mockRejectedValueOnce(new Error("denied"))
            .mockResolvedValue(undefined),
        },
      });
      render(<AdminContactReply message={message()} />);

      await press("アドレスをコピー");
      act(() => {
        jest.advanceTimersByTime(2400);
      });
      await press("コピーできませんでした");
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(screen.getByRole("button", { name: "コピーしました" })).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(2500);
      });
      expect(
        screen.getByRole("button", { name: "アドレスをコピー" }),
      ).toBeTruthy();
    });
  });
});
