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
    "Stories of the land, the people, and the traditions that live on in every drop of Fujisan sake.",
};

const stories = [
  {
    chapter: "Ⅰ",
    eyebrow: "THE TOJI",
    eyebrowJp: "杜氏",
    title: "A hundred winters at the brewhouse",
    jp: "蔵の冬、百日の沈黙",
    excerpt:
      "Each winter Toji-san walks the cold cedar floor before sunrise, listening for the breath of the moromi. He has done this for fifty-two seasons.",
    excerptJp:
      "冬になると杜氏は、夜明け前の冷えた杉の床を歩き、もろみの息づかいに耳を澄ます。五十二度の冬を、そうして越えてきました。",
    image: "/images/fujisan/toji.png",
    position: "object-[50%_28%]",
  },
  {
    chapter: "Ⅱ",
    eyebrow: "THE FARMER",
    eyebrowJp: "農家",
    title: "The terrace that remembers",
    jp: "棚田の記憶",
    excerpt:
      "Three generations of the Suzuki family have grown Yamadanishiki on the south face of Fuji. Their rice is the silence at the heart of our Daiginjo.",
    excerptJp:
      "鈴木家は三代にわたり、富士の南面で山田錦を育ててきました。その米が、大吟醸の中心に宿る静けさになります。",
    image: "/images/fujisan/features/ricebox.png",
    position: "object-[50%_46%]",
  },
  {
    chapter: "Ⅲ",
    eyebrow: "THE WATER",
    eyebrowJp: "水",
    title: "Snow that fell before the war",
    jp: "戦前の雪、今日の酒",
    excerpt:
      "The water in tonight’s bottle began as snow on Mt. Fuji’s upper slopes nearly half a century ago. We are simply its messenger.",
    excerptJp:
      "今宵の一本に流れる水は、半世紀ほど前、富士山の高みに降り積もった雪でした。私たちは、ただその使いに過ぎません。",
    image: "/images/fujisan/features/water.png",
    position: "object-[50%_42%]",
  },
  {
    chapter: "Ⅳ",
    eyebrow: "THE TABLE",
    eyebrowJp: "食卓",
    title: "An evening at the kappo counter",
    jp: "割烹の夜",
    excerpt:
      "A small kappo on a quiet street in Shimbashi pours our Tokubetsu Junmai by the warmed flask. The conversations rise quietly around it.",
    excerptJp:
      "新橋の静かな路地にある小さな割烹が、特別純米を燗のちろりで注ぎます。語らいが、その周りで静かに立ち昇ります。",
    image: "/images/fujisan/art-of-sake/ochoko.png",
    position: "object-[55%_50%]",
  },
  {
    chapter: "Ⅴ",
    eyebrow: "THE SEASONS",
    eyebrowJp: "四季",
    title: "Four temperatures, four moods",
    jp: "四季の温度",
    excerpt:
      "Chilled in summer, warmed in winter — the same bottle reveals a different voice in every season. Here is how our brewers serve theirs.",
    excerptJp:
      "夏は冷やし、冬は燗で。同じ一本が、季節ごとに違う声を聞かせます。蔵人たちの飲み方を、ここに。",
    image: "/images/fujisan/art-of-sake/sake.png",
    position: "object-[42%_50%]",
  },
  {
    chapter: "Ⅵ",
    eyebrow: "THE ART",
    eyebrowJp: "うつわ",
    title: "Cups of clay, cups of glass",
    jp: "器のはなし",
    excerpt:
      "The vessel changes the sake. We sat down with three Japanese ceramicists to ask what they look for when they shape an ochoko.",
    excerptJp:
      "器は酒の表情を変えます。三人の陶芸家を訪ね、おちょこを成形するとき何を見ているのかを伺いました。",
    image: "/images/fujisan/pairings/cheese.png",
    position: "object-[50%_50%]",
  },
];

const featured = stories[0];

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
        lead="Each bottle carries a story — of the land, the people, and the traditions that live on in every drop. These are some of the voices we have gathered around our brewhouse."
        crumbs={[
          { label: "HOME", href: "/#top" },
          { label: "STORIES", href: "/stories" },
        ]}
        bgPosition="object-[50%_50%]"
      />

      {/* ===== Featured ===== */}
      <section className="relative bg-[#FAF5E8]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0B1A2E]/15 to-transparent"
        />
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-stretch lg:grid-cols-[1.05fr_1fr]">
          <div className="relative min-h-[320px] overflow-hidden md:min-h-[500px]">
            <Image
              src={featured.image}
              alt={featured.title}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className={`object-cover ${featured.position}`}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-transparent to-[#0B1A2E]/22"
            />
            <span className="absolute left-6 top-6 font-serif text-[12px] font-medium tracking-[0.34em] text-[#FAF5E8]">
              {featured.chapter}
            </span>
          </div>

          <div className="flex flex-col justify-center bg-[#F1E6CB] px-7 py-16 sm:px-10 md:px-14 md:py-20">
            <Reveal className="flex items-center gap-3">
              <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#C9A84C]">
                FEATURED
              </span>
              <span className="h-px w-10 bg-[#C9A84C]/55" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#0B1A2E]/65">
                <L en={featured.eyebrow} ja={featured.eyebrowJp} />
              </span>
            </Reveal>

            <Reveal
              as="h2"
              className="mt-6 font-serif text-[clamp(28px,3.4vw,44px)] font-semibold leading-[1.12] tracking-[0.04em] text-[#0B1A2E]"
              delay={revealDelays.d1}
            >
              <L en={featured.title} ja={featured.jp} />
            </Reveal>

            <Reveal
              as="p"
              className="i18n-en mt-3 font-jp text-[12.5px] tracking-[0.26em] text-[#C9A84C]/85"
              delay={revealDelays.d2}
            >
              {featured.jp}
            </Reveal>

            <Reveal
              as="p"
              className="mt-7 max-w-[520px] text-[14px] font-light leading-[1.85] text-[#2B2419]/82 md:text-[15px]"
              delay={revealDelays.d3}
            >
              <L en={featured.excerpt} ja={featured.excerptJp} />
            </Reveal>

            <Reveal className="mt-10" delay={revealDelays.d3 + 0.1}>
              <span className="group/link inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E]">
                <span className="relative pb-1">
                  <L en="COMING SOON" ja="近日公開" />
                  <span className="absolute inset-x-0 -bottom-0 h-px bg-[#0B1A2E]/40" />
                </span>
                <span aria-hidden>→</span>
              </span>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== Story grid ===== */}
      <section className="relative bg-[#FAF5E8]">
        <div className="mx-auto max-w-[1360px] px-7 pb-24 pt-20 md:px-12 md:pb-28">
          <Reveal className="flex items-center gap-3">
            <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#C9A84C]">
              Ⅱ.II
            </span>
            <span className="h-px w-10 bg-[#C9A84C]/55" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#0B1A2E]/65">
              The Archive
            </span>
          </Reveal>

          <Reveal
            as="h2"
            className="mt-5 max-w-[680px] font-serif text-[clamp(24px,2.6vw,34px)] font-semibold leading-[1.15] tracking-[0.06em] text-[#0B1A2E]"
            delay={revealDelays.d1}
          >
            <L
              en="More voices around the brewhouse"
              ja="蔵を囲む、もう少しの声"
            />
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10">
            {rest.map((story, i) => (
              <Reveal
                key={story.title}
                delay={0.1 + i * 0.1}
                className="group flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={story.image}
                    alt={story.title}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                    className={`object-cover transition-transform duration-700 group-hover:scale-[1.04] ${story.position}`}
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0B1A2E]/30 via-transparent to-transparent"
                  />
                  <span className="absolute left-3 top-3 font-serif text-[11px] font-medium tracking-[0.3em] text-[#FAF5E8]">
                    {story.chapter}
                  </span>
                </div>
                <div className="mt-6">
                  <p className="text-[10px] font-semibold tracking-[0.34em] text-[#C9A84C]">
                    <L en={story.eyebrow} ja={story.eyebrowJp} />
                  </p>
                  <h3 className="mt-3 font-serif text-[clamp(18px,1.6vw,22px)] font-semibold leading-[1.28] tracking-[0.04em] text-[#0B1A2E] transition-colors duration-500 group-hover:text-[#C9A84C]">
                    <L en={story.title} ja={story.jp} />
                  </h3>
                  <p className="i18n-en mt-2 font-jp text-[11px] tracking-[0.24em] text-[#0B1A2E]/60">
                    {story.jp}
                  </p>
                  <span
                    aria-hidden
                    className="mt-4 block h-px w-8 bg-[#C9A84C]/45 transition-all duration-500 group-hover:w-14 group-hover:bg-[#C9A84C]"
                  />
                  <p className="mt-4 text-[13px] font-light leading-[1.75] text-[#1D2432]/78">
                    <L en={story.excerpt} ja={story.excerptJp} />
                  </p>
                </div>
              </Reveal>
            ))}
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
          <div className="max-w-[520px]">
            <p className="font-jp text-[12px] tracking-[0.3em] text-[#D7B46A]/85">
              ― 一献の物語 ―
            </p>
            <h2 className="mt-4 font-serif text-[clamp(22px,2.4vw,30px)] font-semibold leading-[1.18] tracking-[0.06em] text-[#F2E4C7]">
              <L
                en="Begin your own story with Fujisan."
                ja="あなたの物語を、富士山から。"
              />
            </h2>
            <p className="mt-4 text-[13.5px] font-light leading-[1.78] text-[#F2E4C7]/78">
              <L
                en="Each bottle in the collection is its own opening line. Choose the one that speaks to your evening."
                ja="一本一本が、それぞれの語り出しです。今宵に寄り添う一本を、お選びください。"
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
