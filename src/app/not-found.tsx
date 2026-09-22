import Link from "next/link";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "Page not found — FUJISAN SAKE",
  robots: { index: false, follow: false },
};

/** 存在しない URL、および notFound() を呼んだセグメントの表示。 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />

      <section className="mx-auto flex w-full max-w-[720px] flex-1 flex-col items-center justify-center px-7 pb-24 pt-[150px] text-center md:pt-[190px]">
        <p className="font-serif text-[11px] font-semibold tracking-[0.34em] text-[#C9A84C]">
          404 · NOT FOUND
        </p>
        <span aria-hidden className="mt-6 h-px w-10 bg-[#C9A84C]/55" />

        <h1 className="mt-7 font-serif text-[clamp(26px,3vw,36px)] font-semibold leading-[1.2] tracking-[0.05em] text-[#0B1A2E]">
          <L
            en="This page has gone quiet."
            ja="お探しのページは見つかりませんでした。"
          />
        </h1>

        <p className="mx-auto mt-5 max-w-[460px] text-[13.5px] leading-[1.85] text-[#1D2432]/78">
          <L
            en="The page you were looking for may have moved, or the link may be out of date. The collection is still here."
            ja="ページが移動したか、リンクが古くなっている可能性があります。コレクションは、こちらからご覧いただけます。"
          />
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/products"
            className="group/btn inline-flex items-center justify-center gap-3 border border-[#0B1A2E] bg-[#0B1A2E] px-8 py-4 text-[10.5px] font-semibold tracking-[0.32em] text-paper-card no-underline transition-colors hover:bg-[#1D2432]"
          >
            <L en="BROWSE THE COLLECTION" ja="コレクションを見る" />
            <span
              aria-hidden
              className="transition-transform duration-500 group-hover/btn:translate-x-1"
            >
              →
            </span>
          </Link>
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
                Still can&apos;t find it?{" "}
                <Link
                  href="/contact"
                  className="font-semibold text-[#0B1A2E] underline decoration-gold/60 underline-offset-2 transition-colors hover:decoration-gold"
                >
                  Contact us
                </Link>
                .
              </>
            }
            ja={
              <>
                お探しのものが見つからない場合は
                <Link
                  href="/contact"
                  className="font-semibold text-[#0B1A2E] underline decoration-gold/60 underline-offset-2 transition-colors hover:decoration-gold"
                >
                  お問い合わせ
                </Link>
                ください。
              </>
            }
          />
        </p>
      </section>

      <FujisanFooter />
    </main>
  );
}
