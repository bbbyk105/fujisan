import { act, render } from "@testing-library/react";

jest.mock("@/i18n/useLocale", () => ({ useLocale: () => "ja" }));

import { TurnstileWidget } from "@/components/fujisan/cart/TurnstileWidget";

type RenderOptions = {
  sitekey: string;
  action: string;
  language: string;
  theme: string;
  size: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

const turnstile = {
  render: jest.fn<string, [HTMLElement, RenderOptions]>(() => "widget_1"),
  remove: jest.fn(),
};

const options = () => turnstile.render.mock.calls[0][1];
const flush = () => act(async () => {});
const scripts = () =>
  [...document.head.querySelectorAll("script")].filter((s) =>
    s.src.includes("challenges.cloudflare.com"),
  );

/** ウィジェットを置く枠の幅。カートの右列の幅で決まり、画面の幅とは一致しない。 */
const setWidth = (width: number) =>
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    value: width,
    configurable: true,
  });

beforeEach(() => {
  jest.clearAllMocks();
  setWidth(360);
  scripts().forEach((s) => s.remove());
  window.turnstile = turnstile as never;
});

describe("TurnstileWidget", () => {
  it("サイトキーと表示言語を渡して、明るい表示で描画する", async () => {
    render(<TurnstileWidget siteKey="site" onToken={jest.fn()} />);
    await flush();

    expect(options()).toMatchObject({
      sitekey: "site",
      action: "guest_checkout",
      language: "ja",
      theme: "light",
      size: "normal",
    });
  });

  it("枠が狭いときは、はみ出さない大きさにする", async () => {
    setWidth(264);
    render(<TurnstileWidget siteKey="site" onToken={jest.fn()} />);
    await flush();

    expect(options().size).toBe("compact");
  });

  it("トークンを親へ渡す", async () => {
    const onToken = jest.fn();
    render(<TurnstileWidget siteKey="site" onToken={onToken} />);
    await flush();

    options().callback("token");

    expect(onToken).toHaveBeenCalledWith("token");
  });

  it("期限切れやエラーではトークンを消す", async () => {
    const onToken = jest.fn();
    render(<TurnstileWidget siteKey="site" onToken={onToken} />);
    await flush();

    options()["expired-callback"]();
    options()["error-callback"]();

    expect(onToken).toHaveBeenCalledTimes(2);
    expect(onToken).toHaveBeenCalledWith(null);
  });

  it("エラーを親へ知らせる", async () => {
    const onFailure = jest.fn();
    render(
      <TurnstileWidget
        siteKey="site"
        onToken={jest.fn()}
        onFailure={onFailure}
      />,
    );
    await flush();

    options()["error-callback"]();

    expect(onFailure).toHaveBeenCalledTimes(1);
  });

  it("画面から外れたら片付ける", async () => {
    const view = render(<TurnstileWidget siteKey="site" onToken={jest.fn()} />);
    await flush();

    view.unmount();

    expect(turnstile.remove).toHaveBeenCalledWith("widget_1");
  });

  // 片付けたあとは期限切れの通知が来ないので、古いトークンを親に残さない。
  it("画面から外れたらトークンを消す", async () => {
    const onToken = jest.fn();
    const view = render(<TurnstileWidget siteKey="site" onToken={onToken} />);
    await flush();

    view.unmount();

    expect(onToken).toHaveBeenCalledWith(null);
  });

  describe("スクリプトの読み込み", () => {
    beforeEach(() => {
      window.turnstile = undefined;
    });

    it("読み込みに失敗しても、作り直せば読み直す", async () => {
      const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const onFailure = jest.fn();
      const view = render(
        <TurnstileWidget
          siteKey="site"
          onToken={jest.fn()}
          onFailure={onFailure}
        />,
      );
      expect(scripts()).toHaveLength(1);

      await act(async () => {
        scripts()[0].dispatchEvent(new Event("error"));
      });
      errSpy.mockRestore();
      expect(onFailure).toHaveBeenCalledTimes(1);
      view.unmount();
      scripts().forEach((s) => s.remove());

      const errSpy2 = jest.spyOn(console, "error").mockImplementation(() => {});
      render(<TurnstileWidget siteKey="site" onToken={jest.fn()} />);

      expect(scripts()).toHaveLength(1);

      // 読み込み中のまま次のテストへ残さない。
      await act(async () => {
        scripts()[0].dispatchEvent(new Event("error"));
      });
      errSpy2.mockRestore();
    });

    it("読み込む前に画面から外れたら、描画しない", async () => {
      const view = render(<TurnstileWidget siteKey="site" onToken={jest.fn()} />);
      view.unmount();

      window.turnstile = turnstile as never;
      await act(async () => {
        scripts()[0].dispatchEvent(new Event("load"));
      });

      expect(turnstile.render).not.toHaveBeenCalled();
    });
  });
});
