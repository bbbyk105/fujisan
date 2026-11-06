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

let mockSiteKey: string | null = null;
jest.mock("@/data/fujisan-turnstile", () => ({
  get TURNSTILE_SITE_KEY() {
    return mockSiteKey;
  },
}));

// ウィジェットの中身は TurnstileWidget.test.tsx で見る。
const mockWidget: {
  onToken: (token: string | null) => void;
  onFailure: () => void;
  mounts: number;
} = {
  onToken: () => {},
  onFailure: () => {},
  mounts: 0,
};
jest.mock("@/components/fujisan/cart/TurnstileWidget", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    TurnstileWidget: ({
      onToken,
      onFailure,
    }: {
      onToken: (token: string | null) => void;
      onFailure: () => void;
    }) => {
      mockWidget.onToken = onToken;
      mockWidget.onFailure = onFailure;
      useEffect(() => {
        mockWidget.mounts += 1;
      }, []);
      return <div data-testid="turnstile" />;
    },
  };
});

import { act } from "@testing-library/react";
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
const guestEmailInput = () =>
  document.getElementById("guest-email") as HTMLInputElement;
const guestEmailConfirmInput = () =>
  document.getElementById("guest-email-confirm") as HTMLInputElement;
/** ゲストのメールアドレスを、確認欄まで入れる。 */
const fillGuestEmail = (email: string, confirmation = email) => {
  fireEvent.change(guestEmailInput(), { target: { value: email } });
  fireEvent.change(guestEmailConfirmInput(), {
    target: { value: confirmation },
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSiteKey = null;
  mockWidget.mounts = 0;
  sessionStorage.clear();
  // 地域の選択はここの多くのテストの関心事ではないので、選んである状態から始める。
  sessionStorage.setItem("fujisan-checkout-shipping-region", "mainland");
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
    expect(sessionStorage.getItem("fujisan-checkout-age-confirmed")).not.toBeNull();
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
    fillGuestEmail("guest@example.com");
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

describe("CartView — ゲストのボット判定", () => {
  beforeEach(() => {
    mockSiteKey = "site";
  });

  const pay = () => fireEvent.click(payButton());

  const fillGuest = () => {
    fireEvent.click(ageCheckbox());
    fillGuestEmail("guest@example.com");
  };

  it("キーが未設定の間はウィジェットを出さない", () => {
    mockSiteKey = null;
    signedOut();
    render(<CartView />);

    fillGuest();

    expect(screen.queryByTestId("turnstile")).toBeNull();
  });

  it("ログイン中はウィジェットを出さない", () => {
    signedIn();
    render(<CartView />);

    expect(screen.queryByTestId("turnstile")).toBeNull();
  });

  // ログインするお客様や、見ているだけの人の情報を Cloudflare へ送らない。
  it("ゲストのメールアドレスを入れるまで読み込まない", () => {
    signedOut();
    render(<CartView />);

    expect(screen.queryByTestId("turnstile")).toBeNull();

    fillGuest();

    expect(screen.queryByTestId("turnstile")).toBeTruthy();
  });

  it("形式の整ったメールアドレスが入るまで読み込まない", () => {
    signedOut();
    render(<CartView />);

    fireEvent.change(guestEmailInput(), { target: { value: "gue" } });

    expect(screen.queryByTestId("turnstile")).toBeNull();
  });

  it("判定が終わっていなければ進ませない", () => {
    signedOut();
    render(<CartView />);

    fillGuest();
    pay();

    expect(startCheckoutAction).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("確認");
  });

  // 判定の途中で作り直すと、押すたびに最初からやり直しになる。
  it("判定の途中で押しても、ウィジェットは作り直さない", () => {
    signedOut();
    render(<CartView />);

    fillGuest();
    pay();

    expect(mockWidget.mounts).toBe(1);
  });

  it("ウィジェットが失敗していたら、押したときに作り直す", () => {
    signedOut();
    render(<CartView />);

    fillGuest();
    act(() => mockWidget.onFailure());
    pay();

    expect(mockWidget.mounts).toBe(2);
  });

  it("判定が済んだら、確認が終わっていないという表示を消す", () => {
    signedOut();
    render(<CartView />);

    fillGuest();
    pay();
    act(() => mockWidget.onToken("token"));

    expect(screen.queryByRole("alert")).toBeNull();
  });

  // 訂正の途中で形式が崩れても、済ませた判定を捨てない。
  it("メールアドレスを直している途中でも、ウィジェットを消さない", () => {
    signedOut();
    render(<CartView />);

    fillGuest();
    fireEvent.change(guestEmailInput(), { target: { value: "guest@" } });

    expect(screen.queryByTestId("turnstile")).toBeTruthy();
    expect(mockWidget.mounts).toBe(1);
  });

  // 使ったトークンは再送できない。
  it("ブラウザの「戻る」で復元されたら、判定を取り直す", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    startCheckoutAction.mockResolvedValue({
      ok: true,
      url: "https://checkout.stripe.com/c/pay/cs_test_1",
    });
    signedOut();
    render(<CartView />);

    fillGuest();
    act(() => mockWidget.onToken("token"));
    pay();
    await screen.findByRole("button", { name: /移動中/ });

    const restored = new Event("pageshow");
    Object.defineProperty(restored, "persisted", { value: true });
    fireEvent(window, restored);
    errSpy.mockRestore();

    await waitFor(() => expect(mockWidget.mounts).toBe(2));
  });

  it("判定が済んだらトークンを添えて決済を始める", async () => {
    signedOut();
    render(<CartView />);

    fillGuest();
    act(() => mockWidget.onToken("token"));
    pay();

    await waitFor(() => expect(startCheckoutAction).toHaveBeenCalledTimes(1));
    expect(startCheckoutAction.mock.calls[0][0]).toMatchObject({
      guestEmail: "guest@example.com",
      turnstileToken: "token",
    });
  });

  // トークンは 1 回しか使えない。読み込みに失敗していても、作り直せば読み直せる。
  it("決済を始められなかったら、ウィジェットを作り直す", async () => {
    startCheckoutAction.mockResolvedValue({ ok: false, error: "bot" });
    signedOut();
    render(<CartView />);

    fillGuest();
    act(() => mockWidget.onToken("token"));
    pay();

    await screen.findByRole("alert");
    expect(mockWidget.mounts).toBe(2);
  });

  it("通信に失敗したときも、ウィジェットを作り直す", async () => {
    startCheckoutAction.mockRejectedValue(new Error("network"));
    signedOut();
    render(<CartView />);

    fillGuest();
    act(() => mockWidget.onToken("token"));
    pay();

    await screen.findByRole("alert");
    expect(mockWidget.mounts).toBe(2);
  });

  it("使い終わったトークンを次の決済に使わない", async () => {
    startCheckoutAction.mockResolvedValue({ ok: false, error: "stripe" });
    signedOut();
    render(<CartView />);

    fillGuest();
    act(() => mockWidget.onToken("token"));
    pay();
    await screen.findByRole("alert");
    pay();

    expect(startCheckoutAction).toHaveBeenCalledTimes(1);
  });
});

describe("CartView — ゲストとして購入", () => {
  it("メールアドレスを入れれば、ログインせずに決済へ進める", async () => {
    signedOut();
    render(<CartView />);

    fireEvent.click(ageCheckbox());
    fillGuestEmail("guest@example.com");
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

  // 打ち間違えると、宛名と住所の入った確定メールが他人へ届く。
  it("確認欄と一致しなければ進ませない", () => {
    signedOut();
    render(<CartView />);

    fireEvent.click(ageCheckbox());
    fillGuestEmail("taro@gmail.com", "taro@gmial.com");
    fireEvent.click(payButton());

    expect(startCheckoutAction).not.toHaveBeenCalled();
    expect(guestEmailConfirmInput().getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toContain("一致しません");
  });

  it("上の欄を直したら、一致しないというエラーを消す", () => {
    signedOut();
    render(<CartView />);

    fireEvent.click(ageCheckbox());
    fillGuestEmail("taro@gmial.com", "taro@gmail.com");
    fireEvent.click(payButton());
    fireEvent.change(guestEmailInput(), {
      target: { value: "taro@gmail.com" },
    });

    expect(guestEmailConfirmInput().getAttribute("aria-invalid")).toBeNull();
  });

  it("確認欄が空なら進ませない", () => {
    signedOut();
    render(<CartView />);

    fireEvent.click(ageCheckbox());
    fireEvent.change(guestEmailInput(), {
      target: { value: "guest@example.com" },
    });
    fireEvent.click(payButton());

    expect(startCheckoutAction).not.toHaveBeenCalled();
    expect(guestEmailConfirmInput().getAttribute("aria-invalid")).toBe("true");
  });

  it("大文字と小文字の違いでは止めない", async () => {
    signedOut();
    render(<CartView />);

    fireEvent.click(ageCheckbox());
    fillGuestEmail("Guest@Example.com", "guest@example.com");
    fireEvent.click(payButton());

    await waitFor(() => expect(startCheckoutAction).toHaveBeenCalledTimes(1));
    expect(startCheckoutAction.mock.calls[0][0].guestEmail).toBe(
      "Guest@Example.com",
    );
  });

  it("形式が違うメールアドレスでは進ませない", () => {
    signedOut();
    render(<CartView />);

    fireEvent.click(ageCheckbox());
    fillGuestEmail("not-an-email");
    fireEvent.click(payButton());

    expect(startCheckoutAction).not.toHaveBeenCalled();
  });

  it("20 歳以上の確認が無ければ進ませない", () => {
    signedOut();
    render(<CartView />);

    fillGuestEmail("guest@example.com");
    fireEvent.click(payButton());

    expect(startCheckoutAction).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("20歳以上");
  });

  it("回数制限に当たったら、時間をおくよう伝える", async () => {
    startCheckoutAction.mockResolvedValue({ ok: false, error: "rate" });
    signedOut();
    render(<CartView />);

    fireEvent.click(ageCheckbox());
    fillGuestEmail("guest@example.com");
    fireEvent.click(payButton());

    expect((await screen.findByRole("alert")).textContent).toContain(
      "時間をおいて",
    );
  });
});

describe("CartView — ご注文内容", () => {
  it("ボタンの金額は括弧で示し、中黒でつながない", () => {
    signedIn();
    render(<CartView />);

    const label = payButton().textContent ?? "";
    expect(label).toContain("お支払いへ進む（¥6,600）");
    expect(label).not.toContain("·");
  });

  it("送料無料までの残りは文だけで伝え、進捗バーは出さない", () => {
    signedIn();
    const { container } = render(<CartView />);

    expect(container.textContent).toContain("で送料無料です。");
    expect(container.querySelector(".bg-gold")).toBeNull();
  });
});

describe("CartView — お届け地域", () => {
  const regionSelect = () =>
    document.getElementById("shipping-region") as HTMLInputElement;

  it("地域を選ぶまで合計を出さず、決済へ進ませない", () => {
    sessionStorage.clear();
    signedIn();
    render(<CartView />);

    expect(regionSelect().value).toBe("");
    expect(payButton().textContent).not.toContain("¥");

    fireEvent.click(ageCheckbox());
    fireEvent.click(payButton());

    expect(startCheckoutAction).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain(
      "お届け地域を選んでください",
    );
  });

  it("地域を選ばずにログインから戻ったら、自動では決済へ進まない", async () => {
    sessionStorage.clear();
    signedOut();
    const { unmount } = render(<CartView />);
    fireEvent.click(ageCheckbox());
    fireEvent.click(screen.getByRole("link", { name: /ログインして購入/ }));
    unmount();

    signedIn();
    window.history.replaceState(null, "", "/cart?resume=checkout");
    render(<CartView />);

    await waitFor(() => expect(ageCheckbox().checked).toBe(true));
    expect(startCheckoutAction).not.toHaveBeenCalled();
  });

  it("地域を選ぶと、送料と合計とボタンの金額が変わる", () => {
    signedIn();
    render(<CartView />);

    fireEvent.change(regionSelect(), { target: { value: "hokkaido" } });

    expect(payButton().textContent).toContain("（¥7,100）");
  });

  it("選んだ地域で決済を始める", async () => {
    signedIn();
    render(<CartView />);

    fireEvent.change(regionSelect(), { target: { value: "remote" } });
    fireEvent.click(ageCheckbox());
    fireEvent.click(payButton());

    await waitFor(() => expect(startCheckoutAction).toHaveBeenCalled());
    expect(startCheckoutAction.mock.calls[0][0].shippingRegion).toBe("remote");
  });

  it("登録住所と合わなければ、地域を合わせて確かめてもらう", async () => {
    startCheckoutAction.mockResolvedValue({
      ok: false,
      error: "region",
      shippingRegion: "hokkaido",
    });
    signedIn();
    render(<CartView />);

    fireEvent.click(ageCheckbox());
    fireEvent.click(payButton());

    expect((await screen.findByRole("alert")).textContent).toContain(
      "お届け地域を変更しました",
    );
    expect(regionSelect().value).toBe("hokkaido");
    expect(payButton().textContent).toContain("（¥7,100）");
  });

  it("ログインして戻っても、選んだ地域は変わらない", async () => {
    signedOut();
    const { unmount } = render(<CartView />);
    fireEvent.change(regionSelect(), { target: { value: "hokkaido" } });
    fireEvent.click(ageCheckbox());
    fireEvent.click(screen.getByRole("link", { name: /ログインして購入/ }));
    unmount();

    signedIn();
    window.history.replaceState(null, "", "/cart?resume=checkout");
    render(<CartView />);

    await waitFor(() => expect(startCheckoutAction).toHaveBeenCalled());
    expect(startCheckoutAction.mock.calls[0][0].shippingRegion).toBe("hokkaido");
  });
});

describe("CartView — 確定の前に見せる事項", () => {
  it("年齢確認の近くに 20 歳未満の飲酒防止の表示を置く", () => {
    signedIn();
    render(<CartView />);

    const label = ageCheckbox().closest("label");
    expect(label?.nextElementSibling?.textContent).toContain(
      "20歳未満の者の飲酒は法律で禁止されています。",
    );
  });

  it("引渡時期・支払時期・返品の条件を出す", () => {
    signedIn();
    const { container } = render(<CartView />);

    expect(container.textContent).toContain("原則2営業日以内に発送");
    expect(container.textContent).toContain("ご注文時に確定します");
    expect(container.textContent).toContain("お客様都合での返品交換");
  });
});
