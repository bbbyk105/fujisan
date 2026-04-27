import Image from "next/image";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import FujisanFooter from "./FujisanFooter";

export default function FujisanExperience() {
  return (
    <section className="relative scroll-mt-[86px] overflow-hidden bg-[#FAF5E8]" id="about">
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
              富士山酒
            </span>
            <span className="h-px w-10 bg-[#C9A84C]/55" />
          </Reveal>

          <Reveal
            as="h3"
            className="mt-7 font-serif text-[clamp(22px,2.6vw,34px)] font-semibold leading-[1.15] tracking-[0.16em] text-[#0B1A2E]"
            delay={revealDelays.d1}
          >
            EXPERIENCE JAPAN
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            IN EVERY SIP
          </Reveal>

          <Reveal
            as="p"
            className="mt-6 max-w-[560px] text-[14px] font-light leading-[1.8] text-[#2B2419]/75 md:text-[15px]"
            delay={revealDelays.d2}
          >
            Each bottle tells a story of the land, the people, and the
            timeless art of sake brewing. Enjoy it chilled, and savor the
            true essence of Japan.
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

        <div className="mt-16 grid grid-cols-1 items-center gap-10 md:grid-cols-[1fr_1fr_1fr] md:gap-8">
          <div className="flex justify-center md:justify-start">
            <div className="relative h-[104px] w-[240px] overflow-hidden md:h-[120px] md:w-[280px]">
              <Image
                src="/images/logo/logo-nihonshu.png"
                alt="日本酒 SAKE"
                fill
                sizes="(min-width: 768px) 280px, 240px"
                className="fujisan-nihonshu-logo object-cover opacity-90"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-[10px] font-semibold tracking-[0.38em] text-[#C9A84C]">
              JAPAN PREMIUM EDITION
            </span>
            <span className="h-px w-16 bg-[#C9A84C]/45" />
            <span className="font-serif text-[13px] tracking-[0.28em] text-[#0B1A2E]/80">
              FUJISAN SAKE COLLECTION
            </span>
          </div>

          <div className="flex flex-col items-center gap-3 md:items-end">
            <span className="font-jp text-[11px] tracking-[0.3em] text-[#0B1A2E]/60">
              公式取扱店
            </span>
            <span className="h-px w-16 bg-[#C9A84C]/45" />
            <span className="text-[10px] font-semibold tracking-[0.32em] text-[#0B1A2E]/70">
              AUTHORIZED · EST. JAPAN
            </span>
          </div>
        </div>
      </div>

      <FujisanFooter />
    </section>
  );
}
