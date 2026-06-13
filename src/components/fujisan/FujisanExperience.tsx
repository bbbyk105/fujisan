import type { ComponentType } from "react";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import FujisanFooter from "./FujisanFooter";
import { L } from "@/i18n/Localized";

type IconProps = { className?: string };

const essences: {
  Icon: ComponentType<IconProps>;
  label: string;
  labelJp: string;
  sub: string;
  subJp: string;
}[] = [
  {
    Icon: IconFuji,
    label: "BLESSINGS OF FUJI",
    labelJp: "富士の恵み",
    sub: "Pure water and the clean air it hides",
    subJp: "清らかな水と潜んだ空気",
  },
  {
    Icon: IconBowl,
    label: "THE CRAFT",
    labelJp: "匠の技",
    sub: "Artisan techniques, passed down",
    subJp: "受け継がれる職人の技",
  },
  {
    Icon: IconBottle,
    label: "JAPANESE AESTHETIC",
    labelJp: "日本の美意識",
    sub: "Heart and culture in every drop",
    subJp: "一滴に宿る心と文化",
  },
];

export default function FujisanExperience() {
  return (
    <section className="relative scroll-mt-[86px] overflow-hidden bg-paper" id="about">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-0 bottom-[72px] w-[640px] opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #C9A84C 0 1px, transparent 1px 16px), repeating-linear-gradient(-45deg, #C9A84C 0 1px, transparent 1px 16px)",
        }}
      />

      <div
        id="experience"
        className="relative mx-auto max-w-[1360px] scroll-mt-[86px] px-7 pt-20 pb-16 md:px-12 md:pt-24 md:pb-20"
      >
        <div
          aria-hidden
          className="absolute inset-x-7 top-10 h-px bg-linear-to-r from-transparent via-[#C9A84C]/40 to-transparent md:inset-x-12"
        />

        <div className="flex flex-col items-center text-center">
          <Reveal className="flex items-center gap-3">
            <span className="h-px w-10 bg-[#C9A84C]/55" />
            <span className="font-jp text-[12px] tracking-[0.38em] text-[#C9A84C]">
              富士の酒
            </span>
            <span className="h-px w-10 bg-[#C9A84C]/55" />
          </Reveal>

          <Reveal
            as="h3"
            className="mt-7 font-serif text-[clamp(22px,2.6vw,34px)] font-semibold leading-[1.15] tracking-[0.16em] text-[#0B1A2E]"
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
            className="mt-6 max-w-[560px] text-[14px] font-light leading-[1.8] text-[#2B2419]/75 md:text-[15px]"
            delay={revealDelays.d2}
          >
            <L
              en="Each bottle tells a story of the land, the people, and the timeless art of sake brewing. Enjoy it chilled, and savor the true essence of Japan."
              ja="一本一本に、土地と人、そして時を超えて受け継がれる酒造りの物語が息づいています。よく冷やして、日本の真髄をお楽しみください。"
            />
          </Reveal>

          <Reveal className="mt-10 flex items-center gap-3" delay={revealDelays.d3}>
            <span className="h-px w-12 bg-[#C9A84C]/55" />
            <svg
              viewBox="0 0 64 44"
              fill="none"
              className="h-auto w-[48px] text-[#0B1A2E]"
            >
              <path
                d="M3 38L22 12L30 22L40 8L61 38H3Z"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
              <path
                d="M18 24L22 12L27 20L24 24H18Z"
                fill="currentColor"
                fillOpacity="0.14"
              />
              <path
                d="M35 16L40 8L46 18L42.5 21H38L35 16Z"
                fill="currentColor"
                fillOpacity="0.14"
              />
            </svg>
            <span className="h-px w-12 bg-[#C9A84C]/55" />
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3 md:gap-8">
          {essences.map(({ Icon, label, labelJp, sub, subJp }, i) => (
            <Reveal
              key={labelJp}
              className="group flex flex-col items-center gap-4 text-center"
              delay={0.12 + i * 0.1}
            >
              <Icon className="h-9 w-9 text-[#0B1A2E]/85 transition-colors duration-500 group-hover:text-[#C9A84C]" />
              <span
                aria-hidden
                className="h-px w-8 bg-[#C9A84C]/45 transition-all duration-500 group-hover:w-12 group-hover:bg-[#C9A84C]"
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
      </div>

      <FujisanFooter />
    </section>
  );
}

function IconFuji({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 40" fill="none" className={className}>
      <path
        d="M3 33L18 11L23.5 18.5L30 8L45 33H3Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M14 22L18 11L21.5 17L19 22H14Z" fill="currentColor" fillOpacity="0.6" />
      <path d="M26 14L30 8L34 15L31.5 17.5H28L26 14Z" fill="currentColor" fillOpacity="0.6" />
    </svg>
  );
}

function IconBowl({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <path
        d="M5 18H35C35 27 28.5 33 20 33C11.5 33 5 27 5 18Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M3 18H37" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path
        d="M16 12C16 9 18 8 18 6M22 13C22 10.5 24 9.5 24 7.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

function IconBottle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <path
        d="M16 4H24V10L27 14V34C27 35.1 26.1 36 25 36H15C13.9 36 13 35.1 13 34V14L16 10V4Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M13 22H27" stroke="currentColor" strokeWidth="1" />
      <path d="M16 7H24" stroke="currentColor" strokeWidth="1" />
      <circle cx="20" cy="28" r="1.3" fill="currentColor" />
    </svg>
  );
}
