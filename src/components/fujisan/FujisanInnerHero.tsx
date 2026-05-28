import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";

type Crumb = { label: ReactNode; href: string };

type Props = {
  /** Overline text (use <L> for bilingual) */
  eyebrow: ReactNode;
  /** Roman numeral or chapter mark, e.g. "Ⅰ" */
  chapter?: string;
  /** Main title (use <L> for bilingual) */
  title: ReactNode;
  /** Sub-title under the title */
  jp?: ReactNode;
  /** Lead paragraph (use <L> for bilingual) */
  lead?: ReactNode;
  /** Breadcrumb links shown above the eyebrow */
  crumbs?: Crumb[];
  /** Hero background image. Defaults to Mt. Fuji silhouette. */
  bgSrc?: string;
  /** object-position for the background */
  bgPosition?: string;
  /** Color theme — light = paper background, dark = navy panel */
  tone?: "light" | "dark";
};

export function FujisanInnerHero({
  eyebrow,
  chapter,
  title,
  jp,
  lead,
  crumbs,
  bgSrc = "/images/fujisan/hero/mtfuji.png",
  bgPosition = "object-[50%_46%]",
  tone = "light",
}: Props) {
  const isDark = tone === "dark";

  return (
    <section
      className={`relative isolate overflow-hidden pt-[86px] ${
        isDark
          ? "fujisan-dark-panel bg-[#0F1D30] text-[#F2E4C7]"
          : "fujisan-paper bg-[#FAF5E8] text-[#0B1A2E]"
      }`}
    >
      <div className="absolute inset-x-0 top-[86px] z-0 h-[460px] overflow-hidden md:h-[520px]">
        <Image
          src={bgSrc}
          alt=""
          fill
          priority
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className={`fujisan-kenburn object-cover ${bgPosition}`}
        />
        {isDark ? (
          <>
            <div className="absolute inset-0 bg-linear-to-r from-[#0F1D30]/92 via-[#0F1D30]/72 to-[#0F1D30]/40" />
            <div className="absolute inset-x-0 bottom-0 h-[220px] bg-linear-to-b from-transparent via-[#0F1D30]/72 to-[#0F1D30]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-linear-to-r from-[#FAF2E4]/94 via-[#FAF2E4]/40 to-[#DCE6EE]/8" />
            <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-[#F9EFE0]/80 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-[200px] bg-linear-to-b from-transparent via-[#FAF5E8]/74 to-[#FAF5E8]" />
          </>
        )}
      </div>

      <div className="relative z-10 mx-auto max-w-[1360px] px-7 pb-20 pt-12 sm:px-8 md:px-12 md:pb-24 md:pt-20">
        {crumbs && crumbs.length > 0 && (
          <Reveal className="flex flex-wrap items-center gap-2 text-[10.5px] font-semibold tracking-[0.24em]">
            {crumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-2">
                <Link
                  href={crumb.href}
                  className={`no-underline transition-colors ${
                    isDark
                      ? "text-[#F2E4C7]/60 hover:text-[#D7B46A]"
                      : "text-[#0B1A2E]/60 hover:text-[#C9A84C]"
                  }`}
                >
                  {crumb.label}
                </Link>
                {i < crumbs.length - 1 && (
                  <span
                    aria-hidden
                    className={isDark ? "text-[#F2E4C7]/30" : "text-[#0B1A2E]/30"}
                  >
                    /
                  </span>
                )}
              </span>
            ))}
          </Reveal>
        )}

        <div className="mt-8 flex max-w-[760px] flex-col gap-5">
          <Reveal className="flex items-center gap-4" delay={revealDelays.d1}>
            {chapter && (
              <span
                className={`font-serif text-[11px] font-medium tracking-[0.36em] ${
                  isDark ? "text-[#D7B46A]" : "text-[#C9A84C]"
                }`}
              >
                {chapter}
              </span>
            )}
            <span
              className={`h-px w-10 ${
                isDark ? "bg-[#D7B46A]/55" : "bg-[#C9A84C]/55"
              }`}
            />
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.38em] ${
                isDark ? "text-[#D7B46A]/85" : "text-[#C9A84C]"
              }`}
            >
              {eyebrow}
            </span>
          </Reveal>

          <Reveal
            as="h1"
            className={`font-serif text-[clamp(36px,5.5vw,72px)] font-semibold leading-[1.05] tracking-[0.04em] ${
              isDark ? "text-[#F2E4C7]" : "text-[#0B1A2E]"
            }`}
            delay={revealDelays.d2}
          >
            {title}
          </Reveal>

          {jp && (
            <Reveal
              as="p"
              className={`font-jp text-[13px] tracking-[0.28em] ${
                isDark ? "text-[#D7B46A]/85" : "text-[#C9A84C]/90"
              }`}
              delay={revealDelays.d3}
            >
              {jp}
            </Reveal>
          )}

          {lead && (
            <Reveal
              as="p"
              className={`mt-4 max-w-[580px] text-[14.5px] font-light leading-[1.78] md:text-[15.5px] ${
                isDark ? "text-[#F2E4C7]/80" : "text-[#2B2419]/82"
              }`}
              delay={revealDelays.d3 + 0.1}
            >
              {lead}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
