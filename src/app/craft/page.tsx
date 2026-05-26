import Image from "next/image";
import Link from "next/link";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { FujisanInnerHero } from "@/components/fujisan/FujisanInnerHero";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { fujisanCraftPillars, type CraftSlug } from "@/data/fujisan-craft";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "The Craft — FUJISAN SAKE",
  description:
    "Three elements, one mountain — pure water, premium rice, and a hundred days in the hand of the toji. The craft behind every bottle of Fujisan sake.",
};

// 各柱の英語 lead に対応する日本語リード（データには短い和文リードが無いため、ここで対訳を持つ）
const LEAD_JP: Record<CraftSlug, string> = {
  water:
    "半世紀のあいだ富士山の内に眠った雪解け水が、やわらかく、澄んで、舌の上で重さを感じさせないほど軽やかに、蔵へと辿り着きます。",
  rice: "山田錦と誉富士。私たちと同じ歳月をかけて技を磨いてきた契約農家が育てる、由緒ある酒米です。",
  brewing:
    "百日に及ぶ冬のあいだ、杜氏と蔵人が水と米と麹に寄り添い、富士山の静けさを宿す酒へと導きます。",
};

export default function CraftIndexPage() {
  return (
    <main className="bg-[#FAF5E8] text-[#0B1A2E] min-h-screen">
      <FujisanNav />

      <FujisanInnerHero
        eyebrow="THE CRAFT · 造りの哲学"
        chapter="序"
        title="THE CRAFT"
        jp="― 水・米・人の手 ―"
        lead="Three elements, one mountain. Pure water, premium rice, and a hundred days in the hand of the toji — this is how Fujisan becomes Fujisan."
        crumbs={[
          { label: "HOME", href: "/#top" },
          { label: "THE CRAFT", href: "/craft" },
        ]}
        bgPosition="object-[50%_44%]"
      />

      {/* ===== Intro ===== */}
      <section className="relative bg-[#FAF5E8]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0B1A2E]/15 to-transparent"
        />
        <div className="mx-auto max-w-[1280px] px-7 py-20 md:px-12 md:py-24">
          <Reveal className="flex items-center gap-3">
            <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#C9A84C]">
              序
            </span>
            <span className="h-px w-10 bg-[#C9A84C]/55" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#0B1A2E]/65">
              THE PHILOSOPHY
            </span>
          </Reveal>

          <Reveal
            as="h2"
            delay={revealDelays.d1}
            className="mt-6 max-w-[760px] font-serif text-[clamp(24px,2.8vw,36px)] font-semibold leading-[1.18] tracking-[0.06em] text-[#0B1A2E]"
          >
            <L
              en="Water, rice, and a hundred quiet days."
              ja="水と米と、百日の静けさ。"
            />
          </Reveal>

          <Reveal
            as="p"
            delay={revealDelays.d2}
            className="mt-6 max-w-[640px] text-[14.5px] font-light leading-[1.85] text-[#1D2432]/82 md:text-[15.5px]"
          >
            <L
              en="Fujisan sake is made of three things and the patience to let them speak. Each begins at the foot of the mountain; each is handled as little as possible, so the mountain's voice survives all the way into the glass."
              ja="富士山の酒は、三つの要素と、それらに語らせるための忍耐でできています。いずれも山の麓から始まり、できるかぎり手を加えません——山の声が、そのまま一杯に残るように。"
            />
          </Reveal>
        </div>
      </section>

      {/* ===== Three pillars ===== */}
      <section className="border-t border-[#0B1A2E]/10 bg-[#F4ECD9]">
        <div className="mx-auto max-w-[1280px] px-7 py-20 md:px-12 md:py-24">
          <div className="flex flex-col gap-20 md:gap-24">
            {fujisanCraftPillars.map((pillar, i) => {
              const flip = i % 2 === 1;
              return (
                <Reveal
                  key={pillar.slug}
                  delay={0.05}
                  className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center md:gap-14"
                >
                  <Link
                    href={`/craft/${pillar.slug}`}
                    aria-label={pillar.title}
                    className={`group relative block aspect-[5/4] overflow-hidden no-underline ${
                      flip ? "md:order-2" : ""
                    }`}
                  >
                    <Image
                      src={pillar.heroImage}
                      alt={pillar.title}
                      fill
                      sizes="(min-width: 768px) 50vw, 92vw"
                      className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${pillar.heroPosition}`}
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0B1A2E]/35 via-transparent to-transparent"
                    />
                    <span className="absolute left-5 top-5 flex items-center gap-3">
                      <span className="font-serif text-[13px] font-medium tracking-[0.32em] text-[#FAF5E8]">
                        {pillar.chapter}
                      </span>
                      <span className="h-px w-8 bg-[#FAF5E8]/60" />
                      <span className="text-[10px] font-semibold tracking-[0.3em] text-[#FAF5E8]/90">
                        {pillar.num}
                      </span>
                    </span>
                  </Link>

                  <div>
                    <p className="text-[10.5px] font-semibold tracking-[0.34em] text-[#C9A84C]">
                      <L en={pillar.eyebrow} ja={pillar.jp} />
                    </p>
                    <h2 className="mt-4 font-serif text-[clamp(26px,3.2vw,40px)] font-semibold leading-[1.06] tracking-[0.04em] text-[#0B1A2E]">
                      {pillar.title}
                    </h2>
                    <p className="mt-3 font-jp text-[13px] tracking-[0.22em] text-[#C9A84C]/85">
                      ー {pillar.catchJp} ー
                    </p>

                    <p className="mt-7 max-w-[520px] text-[14px] font-light leading-[1.85] text-[#1D2432]/82 md:text-[15px]">
                      <L en={pillar.lead} ja={LEAD_JP[pillar.slug]} />
                    </p>

                    <Link
                      href={`/craft/${pillar.slug}`}
                      className="group/link mt-9 inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E] no-underline"
                    >
                      <span className="relative pb-1">
                        <L en="READ THE FULL STORY" ja="この章を読む" />
                        <span className="absolute inset-x-0 -bottom-0 h-px bg-[#0B1A2E]/50 transition-all duration-500 group-hover/link:bg-[#C9A84C]" />
                      </span>
                      <span
                        aria-hidden
                        className="transition-transform duration-500 group-hover/link:translate-x-1 group-hover/link:text-[#C9A84C]"
                      >
                        →
                      </span>
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA strip ===== */}
      <section className="relative bg-[#0F1D30] text-[#F2E4C7]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#D7B46A]/40 to-transparent"
        />
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 px-7 py-16 md:flex-row md:items-center md:px-12 md:py-20">
          <div className="max-w-[560px]">
            <p className="font-jp text-[12px] tracking-[0.3em] text-[#D7B46A]/85">
              ― 一献の前に ―
            </p>
            <h2 className="mt-4 font-serif text-[clamp(22px,2.4vw,30px)] font-semibold leading-[1.18] tracking-[0.06em] text-[#F2E4C7]">
              <L
                en="Meet the bottles this craft becomes."
                ja="この造りが辿り着く、一本へ。"
              />
            </h2>
            <p className="mt-4 text-[13.5px] font-light leading-[1.78] text-[#F2E4C7]/78">
              <L
                en="Six expressions, each carrying water, rice, and the hand of the toji."
                ja="六つの表情。そのどれもが、水と米と杜氏の手を宿しています。"
              />
            </p>
          </div>

          <Link
            href="/#showcase"
            className="group/link inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.34em] text-[#F2E4C7] no-underline"
          >
            <span className="relative pb-1">
              <L en="VIEW THE COLLECTION" ja="コレクションを見る" />
              <span className="absolute inset-x-0 -bottom-0 h-px bg-[#F2E4C7]/50 transition-all duration-500 group-hover/link:bg-[#D7B46A]" />
            </span>
            <span
              aria-hidden
              className="transition-transform duration-500 group-hover/link:translate-x-1 group-hover/link:text-[#D7B46A]"
            >
              →
            </span>
          </Link>
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}
