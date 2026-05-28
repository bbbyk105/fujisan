import Image from "next/image";
import Link from "next/link";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { FujisanInnerHero } from "@/components/fujisan/FujisanInnerHero";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "Stories of Fujisan — FUJISAN SAKE",
  description:
    "A few honest notes on what's in the glass — the water and rice behind Fujisan, the cold months it is brewed in, and some easy ways to pour it.",
};

const KANJI = ["一", "二", "三", "四", "五", "六"];

const stories = [
  {
    eyebrow: "WINTER WORK",
    eyebrowJp: "杜氏",
    title: "Brewed in the cold",
    jp: "寒造り",
    excerpt:
      "Fujisan is a winter sake. Cold air keeps fermentation slow and clean, so brewing runs from late autumn into the coldest weeks of the year. The mornings start early, and a lot of the work is judged by smell and touch.",
    excerptJp:
      "富士山は冬の酒です。冷たい空気が発酵をゆっくり、澄んだものに保つので、仕込みは晩秋から一年で最も寒い時期にかけて行います。朝は早く、多くは香りと手ざわりで見極めます。",
    image: "/images/fujisan/toji.png",
    position: "object-[50%_28%]",
  },
  {
    eyebrow: "THE RICE",
    eyebrowJp: "米",
    title: "How far the rice is polished",
    jp: "米を磨く",
    excerpt:
      "The daiginjo leans on Yamadanishiki, blended with Homarefuji, a sake rice bred here in Shizuoka. Polish away the outer grain and mostly the starchy heart is left. That is where the clean, quiet sweetness comes from.",
    excerptJp:
      "大吟醸の軸は山田錦。静岡で生まれた酒米、誉富士を合わせます。米の外側を削ると、でんぷん質の中心が残る。澄んだ静かな甘みは、そこから生まれます。",
    image: "/images/fujisan/features/ricebox.png",
    position: "object-[50%_46%]",
  },
  {
    eyebrow: "THE WATER",
    eyebrowJp: "水",
    title: "Soft water off the mountain",
    jp: "富士の水",
    excerpt:
      "The brewing water is Mt. Fuji snowmelt that has spent decades working down through volcanic rock. It comes out soft and low in iron — the kind of water that keeps a sake delicate rather than heavy.",
    excerptJp:
      "仕込み水は、何十年もかけて溶岩の層を下ってきた富士山の雪解け水。やわらかく鉄分が少ないので、酒は重くならず、繊細に仕上がります。",
    image: "/images/fujisan/features/water.png",
    position: "object-[50%_42%]",
  },
  {
    eyebrow: "AT THE TABLE",
    eyebrowJp: "食卓",
    title: "Warm it at the counter",
    jp: "燗の一杯",
    excerpt:
      "Not every sake likes heat, but the junmai styles do. Warmed gently in a tin chirori to around body temperature, they turn rounder and softer — good company for a slow meal and a longer conversation.",
    excerptJp:
      "どんな酒でも燗が合うわけではありませんが、純米系はよく映えます。ちろりで人肌ほどにそっと温めると、丸くやわらかに。ゆっくりした食事と、長い話の相手にどうぞ。",
    image: "/images/kappou.png",
    position: "object-[55%_50%]",
  },
  {
    eyebrow: "TEMPERATURE",
    eyebrowJp: "温度",
    title: "Cold or warm, your call",
    jp: "温度で遊ぶ",
    excerpt:
      "One bottle, two drinks. Well chilled it is sharp and refreshing; with a little warmth the body and sweetness come forward. Pour a glass each way and taste the difference yourself.",
    excerptJp:
      "一本で、二通り。よく冷やせばシャープで爽やか、少し温めればふくらみと甘みが前に出ます。両方注いで、その違いを確かめてみてください。",
    image: "/images/fujisan/art-of-sake/sake.png",
    position: "object-[42%_50%]",
  },
  {
    eyebrow: "THE CUP",
    eyebrowJp: "うつわ",
    title: "The cup counts too",
    jp: "器のはなし",
    excerpt:
      "The cup shapes the aroma as much as the sake does. A small ochoko keeps it tight and focused; a wine glass lifts the fruit and flowers. It is worth keeping a few shapes within reach.",
    excerptJp:
      "香りは、酒と同じくらい器で決まります。小さなおちょこは香りをまとめ、ワイングラスは果実や花の香りをひらく。形違いをいくつか手元に置いておくと楽しめます。",
    image: "/images/fujisan/shuki.png",
    position: "object-[50%_50%]",
  },
];

const opening = stories[0];

export default function StoriesPage() {
  const rest = stories.slice(1);

  return (
    <main className="bg-[#FAF5E8] text-[#0B1A2E] min-h-screen">
      <FujisanNav />

      <FujisanInnerHero
        eyebrow="HERITAGE · STORIES"
        chapter="Ⅱ"
        title="STORIES OF FUJISAN"
        jp="― 富士山酒物語 ―"
        lead={
          <L
            en="A few honest notes on what is actually in the glass — the water and rice behind Fujisan, the cold months it is brewed in, and some easy ways to pour it."
            ja="グラスの中身についての、正直な覚え書きを少しだけ。富士山の水と米のこと、仕込みの冬のこと、そして気軽な注ぎ方を。"
          />
        }
        crumbs={[
          { label: "HOME", href: "/#top" },
          { label: "STORIES", href: "/stories" },
        ]}
        bgPosition="object-[50%_50%]"
      />

      {/* ===== Opening note ===== */}
      <section className="relative bg-[#FAF5E8]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0B1A2E]/15 to-transparent"
        />
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-stretch lg:grid-cols-[1.08fr_1fr]">
          <div className="relative min-h-[340px] overflow-hidden md:min-h-[540px]">
            <Image
              src={opening.image}
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 52vw, 100vw"
              className={`object-cover ${opening.position}`}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0B1A2E]/35 via-transparent to-transparent"
            />
            <span className="absolute left-7 top-7 font-serif text-[34px] leading-none text-[#FAF5E8]/85">
              {KANJI[0]}
            </span>
          </div>

          <div className="flex flex-col justify-center bg-[#F1E6CB] px-7 py-16 sm:px-10 md:px-14 md:py-20">
            <Reveal className="flex items-center gap-3">
              <span className="font-serif text-[14px] leading-none text-[#C9A84C]">
                {KANJI[0]}
              </span>
              <span className="h-px w-9 bg-[#C9A84C]/55" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#0B1A2E]/65">
                <L en={opening.eyebrow} ja={opening.eyebrowJp} />
              </span>
            </Reveal>

            <Reveal
              as="h2"
              className="mt-6 font-serif text-[clamp(28px,3.4vw,44px)] font-semibold leading-[1.14] tracking-[0.03em] text-[#0B1A2E]"
              delay={revealDelays.d1}
            >
              <L en={opening.title} ja={opening.jp} />
            </Reveal>

            <Reveal
              as="p"
              className="i18n-en mt-3 font-jp text-[12.5px] tracking-[0.26em] text-[#C9A84C]/85"
              delay={revealDelays.d2}
            >
              {opening.jp}
            </Reveal>

            <Reveal
              as="p"
              className="mt-7 max-w-[520px] text-[14px] leading-[1.9] text-[#2B2419]/82 md:text-[15px]"
              delay={revealDelays.d3}
            >
              <L en={opening.excerpt} ja={opening.excerptJp} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== Alternating notes ===== */}
      <section className="relative bg-[#FAF5E8]">
        <div className="mx-auto max-w-[1180px] px-7 pb-24 pt-20 md:px-12 md:pb-28 md:pt-24">
          <Reveal className="flex items-center gap-3">
            <span className="font-serif text-[11px] tracking-[0.3em] text-[#C9A84C]">
              覚え書き
            </span>
            <span className="h-px w-10 bg-[#C9A84C]/55" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#0B1A2E]/60">
              MORE NOTES
            </span>
          </Reveal>

          <Reveal
            as="h2"
            className="mt-5 max-w-[640px] font-serif text-[clamp(23px,2.5vw,32px)] font-semibold leading-[1.18] tracking-[0.05em] text-[#0B1A2E]"
            delay={revealDelays.d1}
          >
            <L en="A few more, from around the kura" ja="蔵のまわりから、もう少し" />
          </Reveal>

          <div className="mt-16 flex flex-col gap-16 md:mt-20 md:gap-24">
            {rest.map((story, i) => {
              const imageRight = i % 2 === 1;
              const kanji = KANJI[i + 1];
              return (
                <Reveal
                  as="article"
                  key={story.title}
                  delay={0.05}
                  className="group grid grid-cols-1 items-center gap-7 lg:grid-cols-2 lg:gap-14"
                >
                  <div
                    className={`relative aspect-[5/4] overflow-hidden ${
                      imageRight ? "lg:order-2" : ""
                    }`}
                  >
                    <Image
                      src={story.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 46vw, 92vw"
                      className={`object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] ${story.position}`}
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0B1A2E]/28 via-transparent to-transparent"
                    />
                    <span className="absolute left-5 top-4 font-serif text-[26px] leading-none text-[#FAF5E8]/85">
                      {kanji}
                    </span>
                  </div>

                  <div className={imageRight ? "lg:order-1 lg:pr-8" : "lg:pl-8"}>
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-[13px] leading-none text-[#C9A84C]">
                        {kanji}
                      </span>
                      <span className="h-px w-7 bg-[#C9A84C]/50" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#0B1A2E]/55">
                        <L en={story.eyebrow} ja={story.eyebrowJp} />
                      </span>
                    </div>

                    <h3 className="mt-5 font-serif text-[clamp(21px,2vw,28px)] font-semibold leading-[1.22] tracking-[0.03em] text-[#0B1A2E]">
                      <L en={story.title} ja={story.jp} />
                    </h3>
                    <p className="i18n-en mt-2 font-jp text-[11.5px] tracking-[0.24em] text-[#C9A84C]/80">
                      {story.jp}
                    </p>

                    <p className="mt-5 max-w-[480px] text-[14px] leading-[1.9] text-[#1D2432]/80">
                      <L en={story.excerpt} ja={story.excerptJp} />
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Closing CTA ===== */}
      <section className="relative bg-[#0F1D30] text-[#F2E4C7]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#D7B46A]/40 to-transparent"
        />
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 px-7 py-16 md:flex-row md:items-center md:px-12 md:py-20">
          <div className="max-w-[540px]">
            <p className="font-jp text-[12px] tracking-[0.3em] text-[#D7B46A]/85">
              ― 今宵の一本 ―
            </p>
            <h2 className="mt-4 font-serif text-[clamp(22px,2.4vw,30px)] font-semibold leading-[1.18] tracking-[0.06em] text-[#F2E4C7]">
              <L en="Find the bottle for tonight." ja="今宵の一本を、選ぶ。" />
            </h2>
            <p className="mt-4 text-[13.5px] leading-[1.85] text-[#F2E4C7]/78">
              <L
                en="Six labels, each with its own character — from crisp and dry to round and rich. Pick the one that fits the evening."
                ja="六つの銘柄、それぞれに個性があります。きりりと辛口のものから、丸くコクのあるものまで。今宵に合う一本をどうぞ。"
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
