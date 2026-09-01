import Link from "next/link";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { FujisanInnerHero } from "@/components/fujisan/FujisanInnerHero";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "Page Not Found — FUJISAN SAKE",
  robots: { index: false, follow: true },
};

/** 行き先。左から順に、迷った人が最も必要とするものを並べる。 */
const DESTINATIONS = [
  { href: "/products", en: "OUR SAKE", ja: "商品一覧" },
  { href: "/stories", en: "STORIES", ja: "蔵の物語" },
  { href: "/faq", en: "FAQ", ja: "よくあるご質問" },
  { href: "/contact", en: "CONTACT", ja: "お問い合わせ" },
];

/**
 * 404。存在しない URL と、`notFound()` を呼んだページ（未知の商品 slug など）の
 * 両方がここに来る。ルートレイアウト配下なので AgeGate とフォントは共通で効く。
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />

      <FujisanInnerHero
        eyebrow="NOT FOUND"
        title="404"
        jp="― お探しの頁は見つかりませんでした ―"
        lead={
          <L
            en="The page may have been moved or removed, or the address may be mistyped."
            ja="ページが移動・削除されたか、URL が間違っている可能性がございます。"
          />
        }
        bgPosition="object-[50%_38%]"
      />

      <section className="mx-auto w-full max-w-[1360px] flex-1 px-7 pb-28 pt-16 sm:px-8 md:px-12 md:pb-32 md:pt-20">
        <Reveal className="flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-[#0B1A2E] bg-[#0B1A2E] px-8 py-4 text-[11px] font-semibold tracking-[0.28em] text-paper-card no-underline transition-colors hover:bg-[#1D2432]"
          >
            <L en="BACK TO HOME" ja="トップへ戻る" />
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center border border-[#0B1A2E]/30 bg-transparent px-8 py-4 text-[11px] font-semibold tracking-[0.28em] text-[#0B1A2E]/80 no-underline transition-colors hover:border-[#0B1A2E]/60 hover:text-[#0B1A2E]"
          >
            <L en="PURCHASE" ja="ご購入について" />
          </Link>
        </Reveal>

        <Reveal
          className="mt-16 border-t border-[#0B1A2E]/14 pt-10"
          delay={revealDelays.d1}
        >
          <p className="font-serif text-[10px] font-semibold tracking-[0.34em] text-[#C9A84C]">
            <L en="ELSEWHERE" ja="ほかの頁" />
          </p>

          <ul className="mt-7 grid grid-cols-1 gap-x-10 gap-y-0 sm:grid-cols-2 lg:grid-cols-4">
            {DESTINATIONS.map((d) => (
              <li key={d.href} className="border-t border-[#0B1A2E]/10">
                <Link
                  href={d.href}
                  className="group/dest flex items-baseline justify-between gap-4 py-5 no-underline"
                >
                  <span className="flex flex-col gap-1.5">
                    <span className="text-[10.5px] font-semibold tracking-[0.26em] text-[#0B1A2E]/55 transition-colors group-hover/dest:text-[#C9A84C]">
                      {d.en}
                    </span>
                    <span className="font-jp text-[14px] tracking-[0.14em] text-[#0B1A2E] transition-colors group-hover/dest:text-[#C9A84C]">
                      {d.ja}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="text-[13px] text-[#0B1A2E]/30 transition-all duration-500 group-hover/dest:translate-x-1 group-hover/dest:text-[#C9A84C]"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <FujisanFooter />
    </main>
  );
}
