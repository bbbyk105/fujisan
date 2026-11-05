"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { useLocale } from "@/i18n/useLocale";

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      language: string;
      theme: "light";
      size: "normal" | "compact";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptLoading: Promise<void> | null = null;

/** スクリプトは 1 回だけ読む。失敗したら次の表示で読み直せるようにする。 */
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptLoading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoading = null;
      reject(new Error("Turnstile を読み込めませんでした"));
    };
    document.head.appendChild(script);
  });
  return scriptLoading;
}

/**
 * ゲストの決済開始のボット判定。トークンは 1 回しか使えないので、取り直すときは親が
 * `key` を変えて作り直す。読み込みに失敗していても、作り直せば読み直せる。
 */
export function TurnstileWidget({
  siteKey,
  onToken,
  onFailure,
}: {
  siteKey: string;
  onToken: (token: string | null) => void;
  /** 読み込みや判定に失敗した。親が `key` を変えると、読み直してやり直せる。 */
  onFailure?: () => void;
}) {
  const locale = useLocale();
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const handleToken = useEffectEvent((token: string | null) => onToken(token));
  const handleFailure = useEffectEvent(() => onFailure?.());

  useEffect(() => {
    let cancelled = false;

    loadTurnstile()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(container.current, {
          sitekey: siteKey,
          action: "guest_checkout",
          language: locale,
          // 和紙色の画面に合わせる。既定だと端末の設定で黒くなる。
          theme: "light",
          // 通常の幅は 300px。カートの右列は画面の幅で決まらないので、枠の実際の幅で見る。
          size: container.current.clientWidth < 300 ? "compact" : "normal",
          callback: (token) => handleToken(token),
          "expired-callback": () => handleToken(null),
          "error-callback": () => {
            handleToken(null);
            handleFailure();
          },
        });
      })
      .catch((err) => {
        // 広告ブロックなどで読めないとき。決済の開始でトークンが無いと案内する。
        console.error("[turnstile]", err);
        handleFailure();
      });

    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
      // 片付けたあとは期限切れの通知が来ないので、古いトークンを親に残さない。
      handleToken(null);
    };
    // 言語が変わっても描画し直さない（判定をやり直させない）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  return <div ref={container} />;
}
