import Image from "next/image";
import Link from "next/link";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { FujisanInnerHero } from "@/components/fujisan/FujisanInnerHero";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { SHIPPING_FEE } from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "Purchase — FUJISAN SAKE",
  description:
    "Two paths to the bottle. Order a single bottle for your table, or open a wholesale account for your restaurant, bar, or retail programme.",
};

const paths = [
  {
    num: "Ⅰ",
    eyebrow: "FOR YOUR TABLE",
    jp: "個人のお客様",
    href: "/shop/personal",
    cta: { en: "BROWSE THE COLLECTION", ja: "コレクションを見る" },
    image: "/images/fujisan/art-of-sake/ochoko.png",
    imagePos: "object-[55%_50%]",
    lead: {
      en: "A single bottle, gift-ready, delivered to your home. Six expressions of Fujisan from ¥3,300, with age verification at every step.",
      ja: "一本から、ご家庭へ、贈り物へ。富士山の六つの表情を、ひとつずつ丁寧にお届けします。3,300円より。",
    },
    bullets: [
      { en: "Single 720 ml bottles from ¥3,300", ja: "720ml ／ 3,300円より" },
      { en: "Nationwide shipping ¥1,100 (tax incl.)", ja: SHIPPING_FEE.flat },
      { en: "Ships within 2 business days", ja: "ご注文確認後 原則 2 営業日以内に発送" },
      { en: "Age 20+ verified at order & delivery", ja: "20歳未満には販売いたしません" },
    ],
  },
  {
    num: "Ⅱ",
    eyebrow: "FOR YOUR PROGRAMME",
    jp: "法人・卸 / 取扱店",
    href: "/shop/business",
    cta: { en: "OPEN A TRADE ACCOUNT", ja: "卸・取扱のご相談へ" },
    image: "/images/fujisan/stories/izakaya.png",
    imagePos: "object-[50%_46%]",
    lead: {
      en: "For restaurants, bars, retailers, and hospitality programmes. Account pricing, dedicated brewer support, and case quantities, by appointment.",
      ja: "レストラン・バー・小売店・ホテルのみなさまへ。卸価格、ケース単位でのお届け、蔵元によるサポートを、ご相談のうえでご用意します。",
    },
    bullets: [
      { en: "Case pricing (6 / 12 bottles)", ja: "ケース単位（6本／12本）" },
      { en: "Listing & training support", ja: "メニューづくり・スタッフ研修のお手伝い" },
      { en: "Quote within 2 business days", ja: "2 営業日以内にお見積りをお送りします" },
      { en: "Open across Japan, JPY pricing", ja: "全国対応・円建てでのお取引" },
    ],
  },
];

export default function ShopHubPage() {
  return (
    <main className="bg-[#FAF5E8] text-[#0B1A2E] min-h-screen">
      <FujisanNav />

      <FujisanInnerHero
        eyebrow="PURCHASE · ご購入"
        chapter="Ⅸ"
        title="TWO PATHS, ONE BOTTLE."
        jp="― 一本のための、二つの道 ―"
        lead={
          <L
            en="Whether the bottle ends on your dinner table or on the back bar of a quiet izakaya, we tend to each order by hand. Choose the path that matches your need."
            ja="ご家庭の食卓へも、静かな居酒屋のカウンターへも。どのご注文も、ひとつずつ手で確かめてお届けします。ご用途に合う方をお選びください。"
          />
        }
        crumbs={[
          { label: "HOME", href: "/#top" },
          { label: "PURCHASE", href: "/shop" },
        ]}
        bgPosition="object-[50%_42%]"
      />

      {/* ===== Two paths ===== */}
      <section className="relative bg-[#FAF5E8]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0B1A2E]/15 to-transparent"
        />
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-7 py-20 md:px-12 md:py-24 lg:grid-cols-2 lg:gap-12">
          {paths.map((p, i) => (
            <Reveal
              key={p.href}
              as="article"
              delay={revealDelays.d1 + i * 0.1}
              className="group relative flex flex-col overflow-hidden border border-[#0B1A2E]/12 bg-[#F8F3E7]"
            >
              <div className="relative h-[260px] w-full overflow-hidden md:h-[300px]">
                <Image
                  src={p.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${p.imagePos}`}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-linear-to-t from-[#0B1A2E]/55 via-transparent to-transparent"
                />
                <div className="absolute left-6 top-6 flex items-center gap-3 md:left-9 md:top-9">
                  <span className="font-serif text-[12px] font-medium tracking-[0.36em] text-[#F2E4C7]">
                    {p.num}
                  </span>
                  <span className="h-px w-10 bg-[#D7B46A]/70" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#D7B46A]">
                    {p.eyebrow}
                  </span>
                </div>
                <p className="absolute bottom-5 left-6 font-jp text-[12px] tracking-[0.26em] text-[#F2E4C7]/90 md:bottom-7 md:left-9">
                  {p.jp}
                </p>
              </div>

              <div className="flex flex-1 flex-col px-7 py-10 md:px-10 md:py-12">
                <p className="font-serif text-[clamp(18px,1.6vw,22px)] font-light leading-[1.7] text-[#1D2432]/88">
                  <L en={p.lead.en} ja={p.lead.ja} />
                </p>

                <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-6">
                  {p.bullets.map((b) => (
                    <li
                      key={b.en}
                      className="flex items-baseline gap-3 border-t border-[#0B1A2E]/10 pt-3 text-[12px] leading-[1.55] text-[#0B1A2E]/80"
                    >
                      <span
                        aria-hidden
                        className="mt-1 h-px w-3 shrink-0 bg-[#C9A84C]"
                      />
                      <L en={b.en} ja={b.ja} />
                    </li>
                  ))}
                </ul>

                <Link
                  href={p.href}
                  className="group/cta mt-10 inline-flex items-center gap-3 self-start border-0 bg-transparent p-0 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E] no-underline"
                >
                  <span className="relative pb-1">
                    <L en={p.cta.en} ja={p.cta.ja} />
                    <span className="absolute inset-x-0 -bottom-0 h-px bg-[#0B1A2E]/50 transition-all duration-500 group-hover/cta:bg-[#C9A84C]" />
                  </span>
                  <span
                    aria-hidden
                    className="transition-transform duration-500 group-hover/cta:translate-x-1 group-hover/cta:text-[#C9A84C]"
                  >
                    →
                  </span>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== Reassurance band ===== */}
      <section className="border-t border-[#0B1A2E]/10 bg-[#F4ECD9]">
        <div className="mx-auto max-w-[1180px] px-7 py-14 md:px-12 md:py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
            {[
              {
                num: "01",
                en: "Order with care",
                ja: "ひとつずつ、手で確かめる",
                desc: {
                  en: "Every order is hand-checked at the kura before it ships. Cool-chain delivery available on request.",
                  ja: "すべてのご注文を、出荷前に蔵でひとつずつ検品します。クール便も承ります。",
                },
              },
              {
                num: "02",
                en: "Transparent legalese",
                ja: "価格も販売条件も、包み隠さず",
                desc: {
                  en: "Prices include tax. Sale conditions are documented in the Tokutei Shōtorihiki notice.",
                  ja: "価格はすべて税込で表示しています。販売条件は、特定商取引法に基づく表示に明記しています。",
                },
              },
              {
                num: "03",
                en: "Age 20+ only",
                ja: "20歳未満には販売いたしません",
                desc: {
                  en: "Age verification at order, and once again at the door. We never sell to minors.",
                  ja: "ご注文時と配送時に、年齢を確認します。20歳未満の方へは販売いたしません。",
                },
              },
            ].map((item) => (
              <div key={item.num} className="flex flex-col gap-3">
                <p className="font-serif text-[10.5px] font-medium tracking-[0.32em] text-[#C9A84C]">
                  {item.num}
                </p>
                <p className="font-serif text-[clamp(15px,1.4vw,17px)] font-semibold tracking-[0.04em] text-[#0B1A2E]">
                  <L en={item.en} ja={item.ja} />
                </p>
                <p className="text-[12.5px] leading-[1.7] text-[#1D2432]/76">
                  <L en={item.desc.en} ja={item.desc.ja} />
                </p>
              </div>
            ))}
          </div>

          <p className="mt-12 text-[11.5px] leading-[1.7] text-[#0B1A2E]/65">
            <L
              en={
                <>
                  Sale conditions are listed in our{" "}
                  <Link
                    href="/tokushoho"
                    className="underline decoration-[#C9A84C]/60 underline-offset-2 hover:text-[#C9A84C]"
                  >
                    Tokutei Shōtorihiki Hō notice
                  </Link>
                  . For shipping see our{" "}
                  <Link
                    href="/shipping"
                    className="underline decoration-[#C9A84C]/60 underline-offset-2 hover:text-[#C9A84C]"
                  >
                    shipping & delivery page
                  </Link>
                  .
                </>
              }
              ja={
                <>
                  販売条件は
                  <Link
                    href="/tokushoho"
                    className="ml-1 underline decoration-[#C9A84C]/60 underline-offset-2 hover:text-[#C9A84C]"
                  >
                    特定商取引法に基づく表示
                  </Link>
                  、配送条件は
                  <Link
                    href="/shipping"
                    className="ml-1 underline decoration-[#C9A84C]/60 underline-offset-2 hover:text-[#C9A84C]"
                  >
                    送料・お届けについて
                  </Link>
                  をご確認ください。
                </>
              }
            />
          </p>
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}
