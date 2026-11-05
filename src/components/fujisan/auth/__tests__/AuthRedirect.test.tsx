import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// カートから来たお客様の戻り先を、ログイン・新規登録の画面で途切れさせない。

let search = "";
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search),
}));

const googleStartAction = jest.fn();
const registerPersonalAction = jest.fn();
jest.mock("@/lib/actions/auth", () => ({
  signInAction: jest.fn(),
  googleStartAction: (...a: unknown[]) => googleStartAction(...a),
  registerPersonalAction: (...a: unknown[]) => registerPersonalAction(...a),
  resendVerificationAction: jest.fn(),
}));

import { LoginForm } from "@/components/fujisan/auth/LoginForm";
import { RegisterPersonalForm } from "@/components/fujisan/auth/RegisterPersonalForm";

const RESUME = encodeURIComponent("/cart?resume=checkout");

beforeEach(() => {
  jest.clearAllMocks();
  googleStartAction.mockResolvedValue({ url: null });
  registerPersonalAction.mockResolvedValue({ ok: true });
});

describe("LoginForm", () => {
  it("カートから来たら、カートへ戻ることを伝える", () => {
    search = `redirect=${RESUME}`;
    render(<LoginForm role="personal" />);

    expect(screen.getByText(/カートへ戻り/)).toBeTruthy();
  });

  it("通常のログインでは案内を出さない", () => {
    search = "";
    render(<LoginForm role="personal" />);

    expect(screen.queryByText(/カートへ戻り/)).toBeNull();
  });

  it("新規登録のリンクにも戻り先を引き継ぐ", () => {
    search = `redirect=${RESUME}`;
    render(<LoginForm role="personal" />);

    expect(
      screen.getByRole("link", { name: /新規登録/ }).getAttribute("href"),
    ).toBe(`/register/personal?redirect=${RESUME}`);
  });

  it("外へ出る戻り先は引き継がない", () => {
    search = `redirect=${encodeURIComponent("https://evil.example/")}`;
    render(<LoginForm role="personal" />);

    expect(
      screen.getByRole("link", { name: /新規登録/ }).getAttribute("href"),
    ).toBe("/register/personal");
  });

  it("Google に失敗しても戻り先を失わない", async () => {
    search = `redirect=${RESUME}`;
    render(<LoginForm role="personal" googleEnabled />);

    fireEvent.click(screen.getByRole("button", { name: /Google/ }));

    await waitFor(() => expect(googleStartAction).toHaveBeenCalledTimes(1));
    expect(googleStartAction).toHaveBeenCalledWith(
      "/cart?resume=checkout",
      `/login/personal?error=google&redirect=${RESUME}`,
    );
  });
});

describe("RegisterPersonalForm", () => {
  it("ログインのリンクに戻り先を引き継ぐ", () => {
    search = `redirect=${RESUME}`;
    render(<RegisterPersonalForm />);

    expect(
      screen.getByRole("link", { name: /ログイン/ }).getAttribute("href"),
    ).toBe(`/login/personal?redirect=${RESUME}`);
  });

  it("登録のときに戻り先を渡す", async () => {
    search = `redirect=${RESUME}`;
    render(<RegisterPersonalForm />);

    fireEvent.change(screen.getByLabelText(/お名前/), {
      target: { value: "山田 太郎" },
    });
    fireEvent.change(screen.getByLabelText(/メールアドレス/), {
      target: { value: "taro@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/8文字以上/), {
      target: { value: "correct-horse-battery" },
    });
    fireEvent.click(screen.getByRole("button", { name: /アカウントを作成/ }));

    await waitFor(() =>
      expect(registerPersonalAction).toHaveBeenCalledWith(
        expect.objectContaining({ redirect: "/cart?resume=checkout" }),
      ),
    );
  });

  it("Google に失敗しても戻り先を失わない", async () => {
    search = `redirect=${RESUME}`;
    render(<RegisterPersonalForm googleEnabled />);

    fireEvent.click(screen.getByRole("button", { name: /Google/ }));

    await waitFor(() => expect(googleStartAction).toHaveBeenCalledTimes(1));
    expect(googleStartAction).toHaveBeenCalledWith(
      "/cart?resume=checkout",
      `/login/personal?error=google&redirect=${RESUME}`,
    );
  });
});
