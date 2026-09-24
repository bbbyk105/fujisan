"use client";

import { useEffect } from "react";
import Link from "next/link";
import { L } from "@/i18n/Localized";

/**
 * ルートセグメントのエラーバウンダリ。
 *
 * Next.js 16 では再試行の引数が `reset` ではなく **`unstable_retry`**。
 * （旧 API 名のままだと再試行ボタンが動かない）
 *
 * エラーバウンダリはクライアントコンポーネントでなければならないため、
 * サーバー専用の Nav / Footer は使わず、この画面だけで完結させる。
 */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Workers のログに残す。digest があれば Cloudflare のログと突き合わせられる。
    console.error("[app:error]", error.digest ?? "(no digest)", error);
  }, [error]);

  return (
    <main className="fjs-ed flex min-h-screen flex-col justify-center py-24">
      <div className="ed-wrap ed-wrap-narrow">
        <p className="ed-label text-crimson">
          <L en="Something went wrong" ja="エラーが発生しました" />
        </p>

        <h1 className="ed-title mt-4">
          <L
            en="We couldn't load this page."
            ja="ページを表示できませんでした。"
          />
        </h1>

        <p className="ed-lead mt-7">
          <L
            en="An unexpected error occurred on our side. Please try again — if it keeps happening, let us know and we'll look into it."
            ja="予期しないエラーが発生しました。もう一度お試しください。繰り返し発生する場合は、お手数ですがご連絡ください。"
          />
        </p>

        {error.digest && (
          <p className="ed-small mt-5 tabular-nums">
            <L en="Reference" ja="エラー識別子" />: {error.digest}
          </p>
        )}

        <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="ed-btn"
          >
            <L en="Try again" ja="もう一度試す" />
          </button>
          <Link href="/" className="ed-link text-[13px]">
            <L en="Back to home" ja="トップへ戻る" />
          </Link>
        </div>

        <p className="ed-small mt-10">
          <L
            en={
              <>
                Need help?{" "}
                <Link href="/contact" className="ed-link">
                  Contact us
                </Link>
                .
              </>
            }
            ja={
              <>
                お困りの場合は
                <Link href="/contact" className="ed-link">
                  お問い合わせ
                </Link>
                ください。
              </>
            }
          />
        </p>
      </div>
    </main>
  );
}
