import Image from "next/image";
import { Reveal, revealDelays } from "@/components/Reveal";

const footerLinks = [
  "PRIVACY POLICY",
  "TERMS OF USE",
  "SHIPPING & RETURNS",
  "FAQ",
];

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

      <div id="contact" className="relative bg-[#0F1D30]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#D7B46A]/40 to-transparent"
        />
        <div className="mx-auto flex max-w-[1360px] flex-col items-center justify-between gap-5 px-7 py-7 text-[11px] text-[#F4EBD5]/88 md:flex-row md:px-12">
          <p className="tracking-[0.12em] text-[#F4EBD5]/70">
            © {new Date().getFullYear()} FUJISAN SAKE · ALL RIGHTS RESERVED
          </p>

          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 tracking-[0.22em] font-medium md:gap-x-8">
            {footerLinks.map((label) => (
              <li key={label}>
                <a
                  href="#"
                  className="text-[10.5px] text-[#F4EBD5]/72 no-underline transition-colors hover:text-[#D7B46A]"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-5 text-[#F4EBD5]/72">
            <a
              href="#"
              aria-label="Instagram"
              className="transition-colors hover:text-[#D7B46A]"
            >
              <IconInstagram />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="transition-colors hover:text-[#D7B46A]"
            >
              <IconFacebook />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function IconInstagram() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="currentColor"
    >
      <path d="M13.5 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.2-1.4 1.4-1.4h1.5V5.5a20.1 20.1 0 0 0-2.2-.1c-2.2 0-3.7 1.3-3.7 3.8v2H8v2.8h2.5V21h3z" />
    </svg>
  );
}
