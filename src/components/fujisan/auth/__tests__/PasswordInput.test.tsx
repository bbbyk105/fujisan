/**
 * @jest-environment jsdom
 */

// パスワード欄の「見せる／隠す」の切り替え。
// 守りたいのは次の 3 点:
//   1. 最初は隠れている（type="password"）。サーバーの HTML と食い違わない
//   2. 目のボタンで見せる・もう一度で隠す。状態は aria-pressed で読み上げに伝わる
//   3. 目のボタンを押してもフォームは送信されない

import { fireEvent, render, screen } from "@testing-library/react";
import { PasswordInput } from "../PasswordInput";

function field() {
  return screen.getByLabelText("パスワード") as HTMLInputElement;
}

function toggle() {
  return screen.getByRole("button", { name: "パスワードを表示" });
}

describe("PasswordInput", () => {
  it("最初は隠れていて、目のボタンで見せる・隠すを切り替える", () => {
    render(
      <>
        <label htmlFor="pw">パスワード</label>
        <PasswordInput id="pw" defaultValue="secret-123" />
      </>,
    );

    expect(field().type).toBe("password");
    expect(toggle().getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(toggle());
    expect(field().type).toBe("text");
    expect(field().value).toBe("secret-123");
    expect(toggle().getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(toggle());
    expect(field().type).toBe("password");
    expect(toggle().getAttribute("aria-pressed")).toBe("false");
  });

  it("目のボタンを押してもフォームを送信しない", () => {
    const onSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <label htmlFor="pw">パスワード</label>
        <PasswordInput id="pw" />
      </form>,
    );

    fireEvent.click(toggle());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("入力欄に渡した属性（autocomplete など）はそのまま付く", () => {
    render(
      <>
        <label htmlFor="pw">パスワード</label>
        <PasswordInput id="pw" autoComplete="current-password" required />
      </>,
    );

    expect(field().getAttribute("autocomplete")).toBe("current-password");
    expect(field().required).toBe(true);
    expect(toggle().getAttribute("aria-controls")).toBe("pw");
  });
});
