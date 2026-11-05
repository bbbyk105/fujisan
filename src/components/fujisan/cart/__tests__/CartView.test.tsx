import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// カートから決済までの動線。ログインが要るときは戻ってそのまま決済へ進み、
// ゲストはメールアドレスだけで進める。どちらも 20 歳以上の確認は省けない。

const useSession = jest.fn();
jest.mock("@/lib/auth-client", () => ({
  useSession: () => useSession(),
}));

const startCheckoutAction = jest.fn();
const releaseAbandonedCheckoutAction = jest.fn();
jest.mock("@/lib/actions/checkout", () => ({
  startCheckoutAction: (...a: unknown[]) => startCheckoutAction(...a),
  releaseAbandonedCheckoutAction: (...a: unknown[]) =>
    releaseAbandonedCheckoutAction(...a),
}));

const refreshLiveCatalog = jest.fn();
jest.mock("@/lib/cart/useLiveCatalog", () => ({
  useLiveCatalog: () => ({ catalog: {} }),
  liveKey: (slug: string, ml: number) => `${slug}-${ml}`,
  refreshLiveCatalog: (...a: unknown[]) => refreshLiveCatalog(...a),
}));

jest.mock("@/lib/cart/useCart", () => {
  const { fujisanProducts } = jest.requireActual("@/data/fujisan-products");
  return {
    useCart: () => ({
      ready: true,
      lines: [
        {
          slug: "shogun",
          ml: 300,
          qty: 2,
          product: fujisanProducts[0],
          lineTotal: 5500,
        },
      ],
      count: 2,
      subtotal: 5500,
      add: jest.fn(),
      setQty: jest.fn(),
      remove: jest.fn(),
    }),
  };
});

import { CartView } from "@/components/fujisan/cart/CartView";

const RESUME_REDIRECT = encodeURIComponent("/cart?resume=checkout");

const refetch = jest.fn();
const signedOut = () =>
  useSession.mockReturnValue({ data: null, isPending: false, refetch });
const signedIn = () =>
  useSession.mockReturnValue({
    data: { user: { id: "user_1" } },
    isPending: false,
    refetch,
  });

const ageCheckbox = () => screen.getByRole<HTMLInputElement>("checkbox");
const payButton = () =>
  screen.getByRole("button", { name: /お支払いへ進む/ });
const guestEmailInput = () => screen.getByLabelText(/メールアドレス/);

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  window.history.replaceState(null, "", "/cart");
  // 決済ページへの移動そのものは jsdom では動かないので、呼び出しまでを見る。
  startCheckoutAction.mockResolvedValue({ ok: false, error: "stripe" });
  releaseAbandonedCheckoutAction.mockResolvedValue({ ok: true });
});

describe("CartView — ログインして購入", () => {
  it("ログインと新規登録のリンクは、終わったらカートへ戻るようにしてある", () => {
    signedOut();
    render(<CartView />);

    expect(
      screen.getByRole("link", { name: /ログインして購入/ }).getAttribute("href"),
    ).toBe(`/login/personal?redirect=${RESUME_REDIRECT}`);
    expect(
      screen.getByRole("link", { name: /新規登録して購入/ }).getAttribute("href"),
    ).toBe(`/register/personal?redirect=${RESUME_REDIRECT}`);
  });

  it("20 歳以上の確認が無ければ、ログインへ進ませない", () => {
    signedOut();
    render(<CartView />);

    const allowed = fireEvent.click(
      screen.getByRole("link", { name: /ログインして購入/ }),
    );

    expect(allowed).toBe(false);
    expect(screen.getByRole("alert").textContent).toContain("20歳以上");
  });

  it("確認してからログインへ進むと、そのことを覚えておく", () => {
    signedOut();
    render(<CartView />);

    fireEvent.click(ageCheckbox());
    const allowed = fireEvent.click(
      screen.getByRole("link", { name: /ログインして購入/ }),
    );

    expect(allowed).toBe(true);
    expect(sessionStorage.length).toBe(1);
  });

  it("ログインして戻ると、そのまま決済へ進む", async () => {
    signedOut();
    const first = render(<CartView />);
    fireEvent.click(ageCheckbox());
    fireEvent.click(screen.getByRole("link", { name: /ログインして購入/ }));
    first.unmount();

    signedIn();
    window.history.replaceState(null, "", "/cart?resume=checkout");
    render(<CartView />);

    await waitFor(() => expect(startCheckoutAction).toHaveBeenCalledTimes(1));
    expect(startCheckoutAction.mock.calls[0][0]).toMatchObject({
      items: [{ slug: "shogun", ml: 300, qty: 2 }],
      ageConfirmed: true,
    });
    // 再読み込みでもう一度走らないよう、URL から目印を外す
    expect(window.location.search).toBe("");
  });

  it("20 歳以上の確認が残っていなければ、自動では進まない", async () => {
    signedIn();
    window.history.replaceState(null, "", "/cart?resume=checkout");
    render(<CartView />);

    await waitFor(() => expect(window.location.search).toBe(""));
    expect(startCheckoutAction).not.toHaveBeenCalled();
    expect(ageCheckbox().checked).toBe(false);
  });

  it("目印が無いカートでは、ログインしていても自動では進まない", async () => {
    signedOut();
    const first = render(<CartView />);
    fireEvent.click(ageCheckbox());
    fireEvent.click(screen.getByRole("link", { name: /ログインして購入/ }));
    first.unmount();

    signedIn();
    render(<CartView />);

    await Promise.resolve();
    expect(startCheckoutAction).not.toHaveBeenCalled();
  });

  it("ログインできていなければ、戻っても決済を始めない", async () => {
    signedOut();
    const first = render(<CartView />);
    fireEvent.click(ageCheckbox());
    fireEvent.click(screen.getByRole("link", { name: /ログインして購入/ }));
    first.unmount();

    window.history.replaceState(null, "", "/cart?resume=checkout");
    render(<CartView />);

    await waitFor(() => expect(ageCheckbox().checked).toBe(true));
    expect(startCheckoutAction).not.toHaveBeenCalled();
  });

  it("ログイン済みならゲストの入力欄は出さず、そのまま決済へ進める", async () => {
    signedIn();
    render(<CartView />);

    expect(screen.queryByLabelText(/メールアドレス/)).toBeNull();
    fireEvent.click(ageCheckbox());
    fireEvent.click(payButton());

    await waitFor(() => expect(startCheckoutAction).toHaveBeenCalledTimes(1));
    expect(startCheckoutAction.mock.calls[0][0].guestEmail).toBeUndefined();
  });
});

describe("CartView — 決済を始められなかったとき", () => {
  it("通信が失敗しても固まらず、もう一度押せるようにする", async () => {
    startCheckoutAction.mockRejectedValue(new Error("network"));
    signedIn();
    render(<CartView />);

    fireEvent.click(ageCheckbox());
    fireEvent.click(payButton());

    expect((await screen.findByRole("alert")).textContent).toContain(
      "決済を開始できませんでした",
    );
    expect(payButton().closest("button")?.disabled).toBe(false);
  });
});

describe("CartView — ログインの状態が変わったとき", () => {
  it("セッションが切れていたら、取り直してログインかゲストかを選べるようにする", async () => {
    startCheckoutAction.mockResolvedValue({ ok: false, error: "unauth" });
    signedIn();
    render(<CartView />);

    fireEvent.click(ageCheckbox());
    fireEvent.click(payButton());

    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "ログインの有効期限",
    );
  });

  // Better Auth はタブへ戻るたびにセッションを取り直し、そのあいだ isPending が
  // true に戻る。入力欄が作り直されるとフォーカスが外れ、貼り付けが空振りする。
  it("セッションの再取得中も、ゲストの入力欄を作り直さない", () => {
    signedOut();
    const view = render(<CartView />);
    const input = guestEmailInput();

    useSession.mockReturnValue({ data: null, isPending: true, refetch });
    view.rerender(<CartView />);

    expect(guestEmailInput()).toBe(input);
  });
});

describe("CartView — 決済ページから戻ったとき", () => {
  // ブラウザの「戻る」はページを保存した状態のまま復元するので、移動中の表示が残る。
  it("ブラウザの「戻る」で復元されたら、もう一度押せるようにする", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    startCheckoutAction.mockResolvedValue({
      ok: true,
      url: "https://checkout.stripe.com/c/pay/cs_test_1",
    });
    signedIn();
    render(<CartView />);

    fireEvent.click(ageCheckbox());
    fireEvent.click(payButton());
    await waitFor(() => expect(startCheckoutAction).toHaveBeenCalledTimes(1));
    await screen.findByRole("button", { name: /移動中/ });

    const restored = new Event("pageshow");
    Object.defineProperty(restored, "persisted", { value: true });
    fireEvent(window, restored);
    errSpy.mockRestore();

    expect((await screen.findByRole("button", { name: /お支払いへ進む/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("ブラウザの「戻る」では、始めた注文の在庫を解放する", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    startCheckoutAction.mockResolvedValue({
      ok: true,
      url: "https://checkout.stripe.com/c/pay/cs_test_1",
      orderRef: "FJ-0001",
      guestKey: "order-id",
    });
    signedOut();
    render(<CartView />);

    fireEvent.click(ageCheckbox());
    fireEvent.change(guestEmailInput(), {
      target: { value: "guest@example.com" },
    });
    fireEvent.click(payButton());
    await screen.findByRole("button", { name: /移動中/ });

    const restored = new Event("pageshow");
    Object.defineProperty(restored, "persisted", { value: true });
    fireEvent(window, restored);
    errSpy.mockRestore();

    await waitFor(() =>
      expect(releaseAbandonedCheckoutAction).toHaveBeenCalledWith({
        orderRef: "FJ-0001",
        guestKey: "order-id",
      }),
    );
  });

  it("解放が終わったら在庫を取り直す（自分の引き当てを在庫切れと見せない）", async () => {
    signedIn();
    window.history.replaceState(null, "", "/cart?canceled=1&order=FJ-0001");
    render(<CartView />);

    await waitFor(() => expect(refreshLiveCatalog).toHaveBeenCalledTimes(1));
  });

  it("ゲストの注文は、決済を始めたブラウザの鍵を添えて解放する", async () => {
    signedOut();
    window.history.replaceState(
      null,
      "",
      "/cart?canceled=1&order=FJ-0001&key=order-id",
    );
    render(<CartView />);

    await waitFor(() =>
      expect(releaseAbandonedCheckoutAction).toHaveBeenCalledWith({
        orderRef: "FJ-0001",
        guestKey: "order-id",
      }),
    );
  });
});

describe("CartView — ゲストとして購入", () => {
  it("メールアドレスを入れれば、ログインせずに決済へ進める", async () => {
    signedOut();
    render(<CartView />);

    fireEvent.click(ageCheckbox());
    fireEvent.change(guestEmailInput(), {
      target: { value: "guest@example.com" },
    });
    fireEvent.click(payButton());

    await waitFor(() => expect(startCheckoutAction).toHaveBeenCalledTimes(1));
    expect(startCheckoutAction.mock.calls[0][0]).toMatchObject({
      ageConfirmed: true,
      guestEmail: "guest@example.com",
    });
  });

  it("お届け先は決済ページで入力することを伝える", () => {
    signedOut();
    render(<CartView />);

    expect(screen.getByText(/お届け先/)).toBeTruthy();
  });

  it("メールアドレスが無ければ進ませない", () => {
    signedOut();
    render(<CartView />);

    fireEvent.click(ageCheckbox());
    fireEvent.click(payButton());

    expect(startCheckoutAction).not.toHaveBeenCalled();
    expect(guestEmailInput().getAttribute("aria-invalid")).toBe("true");
  });

  it("形式が違うメールアドレスでは進ませない", () => {
    signedOut();
    render(<CartView />);

    fireEvent.click(ageCheckbox());
    fireEvent.change(guestEmailInput(), { target: { value: "not-an-email" } });
    fireEvent.click(payButton());

    expect(startCheckoutAction).not.toHaveBeenCalled();
  });

  it("20 歳以上の確認が無ければ進ませない", () => {
    signedOut();
    render(<CartView />);

    fireEvent.change(guestEmailInput(), {
      target: { value: "guest@example.com" },
    });
    fireEvent.click(payButton());

    expect(startCheckoutAction).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("20歳以上");
  });

  it("回数制限に当たったら、時間をおくよう伝える", async () => {
    startCheckoutAction.mockResolvedValue({ ok: false, error: "rate" });
    signedOut();
    render(<CartView />);

    fireEvent.click(ageCheckbox());
    fireEvent.change(guestEmailInput(), {
      target: { value: "guest@example.com" },
    });
    fireEvent.click(payButton());

    expect((await screen.findByRole("alert")).textContent).toContain(
      "時間をおいて",
    );
  });
});
