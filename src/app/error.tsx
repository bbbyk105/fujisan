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
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-7 py-24 text-center text-[#0B1A2E]">
      <p className="font-serif text-[11px] font-semibold tracking-[0.34em] text-[#8B1A1A]">
        SOMETHING WENT WRONG
      </p>
      <span aria-hidden className="mt-6 h-px w-10 bg-[#C9A84C]/55" />

      <h1 className="mt-7 max-w-[560px] font-serif text-[clamp(24px,2.8vw,32px)] font-semibold leading-[1.22] tracking-[0.05em]">
        <L
          en="We couldn't pour this page."
          ja="ページを表示できませんでした。"
        />
      </h1>

      <p className="mx-auto mt-5 max-w-[440px] text-[13.5px] leading-[1.85] text-[#1D2432]/78">
        <L
          en="An unexpected error occurred on our side. Please try again — if it keeps happening, let us know and we'll look into it."
          ja="予期しないエラーが発生しました。もう一度お試しください。繰り返し発生する場合は、お手数ですがご連絡ください。"
        />
      </p>

      {error.digest && (
        <p className="mt-4 text-[11px] tracking-[0.1em] text-[#0B1A2E]/45">
          <L en="Reference" ja="エラー識別子" />: {error.digest}
        </p>
      )}

      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="group/btn inline-flex cursor-pointer items-center justify-center gap-3 border border-[#0B1A2E] bg-[#0B1A2E] px-8 py-4 text-[10.5px] font-semibold tracking-[0.32em] text-paper-card transition-colors hover:bg-[#1D2432]"
        >
          <L en="TRY AGAIN" ja="もう一度試す" />
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center border border-[#0B1A2E]/25 px-8 py-4 text-[10.5px] font-semibold tracking-[0.28em] text-[#0B1A2E] no-underline transition-colors hover:border-[#0B1A2E]"
        >
          <L en="BACK TO HOME" ja="トップへ戻る" />
        </Link>
      </div>

      <p className="mt-9 text-[11.5px] leading-[1.7] text-[#0B1A2E]/55">
        <L
          en={
            <>
              Need help?{" "}
              <Link
                href="/contact"
                className="font-semibold text-[#0B1A2E] underline underline-offset-2"
              >
                Contact us
              </Link>
              .
            </>
          }
          ja={
            <>
              お困りの場合は
              <Link
                href="/contact"
                className="font-semibold text-[#0B1A2E] underline underline-offset-2"
              >
                お問い合わせ
              </Link>
              ください。
            </>
          }
        />
      </p>
    </main>
  );
}
