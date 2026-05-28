import Link from "next/link";
import { getSessionSafe } from "@/lib/session";
import { L } from "@/i18n/Localized";

/** /shop/business 上部の取扱店アクセス帯。ログイン状態で表示を出し分ける。 */
export async function TradeAccessBand() {
  const session = await getSessionSafe();
  const user = session?.user as
    | { role?: string; companyName?: string | null; name?: string }
    | undefined;
  const isBusiness = user?.role === "business";

  if (isBusiness) {
    return (
      <section className="border-b border-[#D7B46A]/25 bg-[#0F1D30] text-[#F2E4C7]">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-4 px-7 py-6 md:flex-row md:items-center md:px-12">
          <p className="text-[13px] leading-[1.6] tracking-[0.02em]">
            <span className="font-jp text-[11px] tracking-[0.26em] text-[#D7B46A]">
              取扱店ログイン中
            </span>
            <span className="mx-3 text-[#F2E4C7]/30">／</span>
            <L
              en={`Signed in as ${user?.companyName || user?.name || "your account"} — wholesale pricing is shown below.`}
              ja={`${user?.companyName || user?.name || "アカウント"}さま — 下記に卸価格を表示しています。`}
            />
          </p>
          <Link
            href="/account"
            className="shrink-0 text-[10.5px] font-semibold tracking-[0.28em] text-[#E2C97E] no-underline transition-colors hover:text-[#F2E4C7]"
          >
            <L en="ACCOUNT →" ja="アカウント →" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-[#D7B46A]/25 bg-[#0F1D30] text-[#F2E4C7]">
      <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-5 px-7 py-7 md:flex-row md:items-center md:px-12">
        <div>
          <p className="font-jp text-[11px] tracking-[0.28em] text-[#D7B46A]">
            ― 取扱店の方へ ―
          </p>
          <p className="mt-1.5 font-serif text-[15px] leading-[1.5] tracking-[0.03em] text-[#F2E4C7]">
            <L
              en="Sign in to view wholesale pricing and order by the case."
              ja="ログインで卸価格の確認とケース単位のご注文ができます。"
            />
          </p>
        </div>
        <div className="flex w-full gap-3 sm:w-auto">
          <Link
            href="/login/business?redirect=/shop/business"
            className="inline-flex flex-1 items-center justify-center border border-[#E2C97E] bg-[#E2C97E] px-6 py-3 text-[11px] font-semibold tracking-[0.24em] text-[#0B1A2E] no-underline transition-colors hover:bg-[#efd89b] sm:flex-none"
          >
            <L en="TRADE SIGN IN" ja="取扱店ログイン" />
          </Link>
          <Link
            href="/register/business"
            className="inline-flex flex-1 items-center justify-center border border-[#F2E4C7]/35 bg-transparent px-6 py-3 text-[11px] font-semibold tracking-[0.24em] text-[#F2E4C7] no-underline transition-colors hover:border-[#F2E4C7]/70 sm:flex-none"
          >
            <L en="REGISTER" ja="新規登録" />
          </Link>
        </div>
      </div>
    </section>
  );
}
