"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * ルートレイアウト自体が落ちたときの最後の受け皿。
 *
 * このファイルはルートレイアウトを**置き換える**ので、`<html>` / `<body>` と
 * グローバル CSS を自前で用意する必要がある。フォント（next/font）や
 * LocaleBoot もここには無いため、文言は日英を併記して CSS 切替に頼らない。
 *
 * Next.js 16 の再試行引数は `reset` ではなく `unstable_retry`。
 * また、エラーバウンダリはクライアントコンポーネントなので `metadata` は
 * 使えない。タイトルは React の `<title>` で出す。
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[app:global-error]", error.digest ?? "(no digest)", error);
  }, [error]);

  return (
    <html lang="ja">
      <body>
        <title>Something went wrong — FUJISAN SAKE</title>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.25rem",
            padding: "6rem 1.75rem",
            textAlign: "center",
            background: "#F7F1E3",
            color: "#0B1A2E",
            fontFamily:
              "Georgia, 'Hiragino Mincho ProN', 'Yu Mincho', serif",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.34em",
              color: "#8B1A1A",
              margin: 0,
            }}
          >
            SOMETHING WENT WRONG
          </p>
          <span
            aria-hidden
            style={{ display: "block", width: 40, height: 1, background: "#C9A84C" }}
          />
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(22px, 2.8vw, 30px)",
              fontWeight: 600,
              lineHeight: 1.25,
              letterSpacing: "0.05em",
            }}
          >
            ページを表示できませんでした。
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: "26rem",
              fontSize: "13.5px",
              lineHeight: 1.85,
              color: "rgba(29,36,50,0.78)",
            }}
          >
            予期しないエラーが発生しました。もう一度お試しください。
            <br />
            An unexpected error occurred. Please try again.
          </p>
          {error.digest && (
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                letterSpacing: "0.1em",
                color: "rgba(11,26,46,0.45)",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              justifyContent: "center",
              marginTop: "1rem",
            }}
          >
            <button
              type="button"
              onClick={() => unstable_retry()}
              style={{
                cursor: "pointer",
                border: "1px solid #0B1A2E",
                background: "#0B1A2E",
                color: "#F7F1E3",
                padding: "1rem 2rem",
                fontSize: "10.5px",
                fontWeight: 600,
                letterSpacing: "0.32em",
              }}
            >
              もう一度試す / TRY AGAIN
            </button>
            {/*
              ここではルートレイアウトが差し替わっており、アプリのシェルが
              壊れた状態にある。next/link のクライアント遷移では復旧しないため、
              素の <a> でフルリロードさせるのが正しい。
            */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                border: "1px solid rgba(11,26,46,0.25)",
                color: "#0B1A2E",
                padding: "1rem 2rem",
                fontSize: "10.5px",
                fontWeight: 600,
                letterSpacing: "0.28em",
                textDecoration: "none",
              }}
            >
              トップへ戻る / HOME
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
