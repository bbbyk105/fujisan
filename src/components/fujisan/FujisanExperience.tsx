import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { L } from "@/i18n/Localized";

const essences: {
  label: string;
  labelJp: string;
  sub: string;
  subJp: string;
}[] = [
  {
    label: "CHILLED",
    labelJp: "冷やして",
    sub: "8–12°C for the Junmai Daiginjo and Junmai Ginjo",
    subJp: "純米大吟醸・純米吟醸は8〜12℃",
  },
  {
    label: "OR AT ROOM TEMPERATURE",
    labelJp: "常温でも",
    sub: "15–20°C for the Tokubetsu Junmai and Honjozo",
    subJp: "特別純米・特別本醸造は15〜20℃",
  },
  {
    label: "ONCE OPENED",
    labelJp: "開けたあとは",
    sub: "Keep it in the fridge; best within 1–2 weeks",
    subJp: "冷蔵庫で保管し、1〜2週間を目安に",
  },
];

export default function FujisanExperience() {
  return (
    <section className="relative scroll-mt-[86px] bg-paper" id="about">
      {/* シネマティックバナー: 夕景の富士にステートメントを重ねる */}
      <div
        id="experience"
        className="relative flex h-[460px] scroll-mt-[86px] items-center justify-center overflow-hidden md:h-[560px]"
      >
        <Image
          src="/images/afternoon-fuji.webp"
          alt="Mt. Fuji reflected on a still lake at dusk"
          fill
          sizes="100vw"
          className="fujisan-grade object-cover object-[50%_58%]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-b from-indigo/45 via-indigo/20 to-indigo/60"
        />

        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <Reveal className="flex items-center gap-3">
            <span className="h-px w-10 bg-[#E2C97E]/70" />
            <span className="font-jp text-[11.5px] tracking-[0.38em] text-[#E2C97E] md:text-[12px]">
              飲み方
            </span>
            <span className="h-px w-10 bg-[#E2C97E]/70" />
          </Reveal>

          <Reveal
            as="h3"
            className="mt-7 font-serif text-[clamp(26px,3.4vw,46px)] font-semibold leading-[1.2] tracking-[0.14em] text-paper-card [text-shadow:0_2px_28px_rgba(11,26,46,0.45)]"
            delay={revealDelays.d1}
          >
            <L
              en={
                <>
                  BEST CHILLED,
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>
                  WITH FOOD
                </>
              }
              ja={<>冷やして、食事と一緒にどうぞ。</>}
            />
          </Reveal>

          <Reveal
            as="p"
            className="mt-6 max-w-[540px] text-[13px] font-light leading-[1.85] text-paper-card/85 md:text-[14px]"
            delay={revealDelays.d2}
          >
            <L
              en="All five are best served chilled. The Junmai Daiginjos suit sushi and sashimi; the drier Tokubetsu Junmai and Tokubetsu Honjozo go well with yakitori and grilled fish."
              ja="どの銘柄も冷やして飲むのがおすすめです。純米大吟醸は寿司や刺身に、辛口の特別純米・特別本醸造は焼き鳥や焼き魚によく合います。"
            />
          </Reveal>
        </div>
      </div>

      {/* エッセンス: 3つの柱と物語への動線 */}
      <div className="mx-auto max-w-[1160px] px-7 py-16 md:px-12 md:py-24">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-0">
          {essences.map(({ label, labelJp, sub, subJp }, i) => (
            <Reveal
              key={labelJp}
              className={`group flex flex-col items-center gap-5 text-center sm:px-8 ${
                i > 0 ? "sm:border-l sm:border-indigo/12" : ""
              }`}
              delay={0.12 + i * 0.1}
            >
              <span
                aria-hidden
                className="h-px w-10 bg-gold/60 transition-all duration-500 group-hover:w-16 group-hover:bg-gold"
              />
              <div>
                <p className="font-serif text-[15px] font-semibold tracking-[0.22em] text-indigo md:text-[16px]">
                  <L en={label} ja={labelJp} />
                </p>
                <p className="mt-2 text-[11.5px] font-light leading-[1.7] tracking-[0.14em] text-[#2B2419]/68 md:text-[12px]">
                  <L en={sub} ja={subJp} />
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal
          className="mt-16 flex flex-col items-center gap-4 md:mt-20"
          delay={revealDelays.d2}
        >
          <span aria-hidden className="h-px w-24 bg-indigo/18" />
          <Link
            href="/craft/water"
            className="group/craft inline-flex items-center gap-3 border border-indigo/35 bg-paper/65 px-7 py-3.5 text-[10.5px] font-semibold tracking-[0.34em] text-indigo no-underline transition-colors hover:border-indigo hover:bg-[#F1E6CB]/80 md:px-9 md:py-4"
          >
            <L en="READ THE CRAFT" ja="造りを読む" />
            <span
              aria-hidden
              className="transition-transform duration-500 group-hover/craft:translate-x-1 group-hover/craft:text-gold"
            >
              →
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
