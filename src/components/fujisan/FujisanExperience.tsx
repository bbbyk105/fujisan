import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import FujisanFooter from "./FujisanFooter";
import { L } from "@/i18n/Localized";

const essences: {
  label: string;
  labelJp: string;
  sub: string;
  subJp: string;
}[] = [
  {
    label: "BLESSINGS OF FUJI",
    labelJp: "富士の恵み",
    sub: "Pure water and the clean air it hides",
    subJp: "清らかな水と潜んだ空気",
  },
  {
    label: "THE CRAFT",
    labelJp: "匠の技",
    sub: "Artisan techniques, passed down",
    subJp: "受け継がれる職人の技",
  },
  {
    label: "JAPANESE AESTHETIC",
    labelJp: "日本の美意識",
    sub: "Heart and culture in every drop",
    subJp: "一滴に宿る心と文化",
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
          className="pointer-events-none absolute inset-0 bg-linear-to-b from-[#0B1A2E]/45 via-[#0B1A2E]/20 to-[#0B1A2E]/60"
        />

        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <Reveal className="flex items-center gap-3">
            <span className="h-px w-10 bg-[#E2C97E]/70" />
            <span className="font-jp text-[11.5px] tracking-[0.38em] text-[#E2C97E] md:text-[12px]">
              富士の酒
            </span>
            <span className="h-px w-10 bg-[#E2C97E]/70" />
          </Reveal>

          <Reveal
            as="h3"
            className="mt-7 font-serif text-[clamp(26px,3.4vw,46px)] font-semibold leading-[1.2] tracking-[0.14em] text-[#F8F3E7] [text-shadow:0_2px_28px_rgba(11,26,46,0.45)]"
            delay={revealDelays.d1}
          >
            <L
              en={
                <>
                  EXPERIENCE JAPAN
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>
                  IN EVERY SIP
                </>
              }
              ja={<>一献に、日本を味わう。</>}
            />
          </Reveal>

          <Reveal
            as="p"
            className="mt-6 max-w-[540px] text-[13px] font-light leading-[1.85] text-[#F8F3E7]/85 md:text-[14px]"
            delay={revealDelays.d2}
          >
            <L
              en="Each bottle tells a story of the land, the people, and the timeless art of sake brewing. Enjoy it chilled, and savor the true essence of Japan."
              ja="一本一本に、土地と人、そして時を超えて受け継がれる酒造りの物語が息づいています。よく冷やして、日本の真髄をお楽しみください。"
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
                i > 0 ? "sm:border-l sm:border-[#0B1A2E]/12" : ""
              }`}
              delay={0.12 + i * 0.1}
            >
              <span
                aria-hidden
                className="h-px w-10 bg-[#C9A84C]/60 transition-all duration-500 group-hover:w-16 group-hover:bg-[#C9A84C]"
              />
              <div>
                <p className="font-serif text-[15px] font-semibold tracking-[0.22em] text-[#0B1A2E] md:text-[16px]">
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
          <span aria-hidden className="h-px w-24 bg-[#0B1A2E]/18" />
          <Link
            href="/stories"
            className="group/stories inline-flex items-center gap-3 border border-[#0B1A2E]/35 bg-paper/65 px-7 py-3.5 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E] no-underline transition-colors hover:border-[#0B1A2E] hover:bg-[#F1E6CB]/80 md:px-9 md:py-4"
          >
            <L en="READ THE STORIES" ja="物語を読む" />
            <span
              aria-hidden
              className="transition-transform duration-500 group-hover/stories:translate-x-1 group-hover/stories:text-[#C9A84C]"
            >
              →
            </span>
          </Link>
        </Reveal>
      </div>

      <FujisanFooter />
    </section>
  );
}
