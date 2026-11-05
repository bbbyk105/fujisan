import { fireEvent, render, screen } from "@testing-library/react";
import AgeGate from "@/components/fujisan/AgeGate";
import { UNDERAGE_NOTICE_JP } from "@/data/fujisan-legal";

// 20 歳以上の確認と法定の表示だけを出す。装飾の見出しは置かない。

beforeEach(() => {
  window.localStorage.clear();
});

describe("AgeGate", () => {
  it("問いと 20 歳未満の飲酒防止の表示を出す", () => {
    render(<AgeGate />);
    const dialog = screen.getByRole("dialog");

    expect(dialog.textContent).toContain("あなたは20歳以上ですか？");
    for (const line of UNDERAGE_NOTICE_JP) {
      expect(dialog.textContent).toContain(line);
    }
  });

  it("英語の飾りの見出しを置かない", () => {
    render(<AgeGate />);

    expect(screen.getByRole("dialog").textContent).not.toContain(
      "AGE VERIFICATION",
    );
  });

  it("「はい」で閉じて、確認したことを覚える", () => {
    render(<AgeGate />);

    fireEvent.click(screen.getByRole("button", { name: /はい/ }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.localStorage.getItem("fujisan-age-confirmed")).toBe("yes");
  });

  it("確認済みなら出さない", () => {
    window.localStorage.setItem("fujisan-age-confirmed", "yes");
    render(<AgeGate />);

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
