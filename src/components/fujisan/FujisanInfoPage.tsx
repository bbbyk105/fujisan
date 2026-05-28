import type { ReactNode } from "react";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { FujisanInnerHero } from "@/components/fujisan/FujisanInnerHero";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { L } from "@/i18n/Localized";

export type InfoSection = {
  num?: string;
  heading: ReactNode;
  jp?: ReactNode;
  body: ReactNode[];
  bullets?: ReactNode[];
};

type Props = {
  eyebrow: ReactNode;
  chapter: string;
  title: ReactNode;
  jp: ReactNode;
  lead: ReactNode;
  crumb: { label: ReactNode; href: string };
  updated?: string;
  sections: InfoSection[];
};

export default function FujisanInfoPage({
  eyebrow,
  chapter,
  title,
  jp,
  lead,
  crumb,
  updated,
  sections,
}: Props) {
  return (
    <main className="bg-[#FAF5E8] text-[#0B1A2E] min-h-screen">
      <FujisanNav />

      <FujisanInnerHero
        eyebrow={eyebrow}
        chapter={chapter}
        title={title}
        jp={jp}
        lead={lead}
        crumbs={[
          { label: "HOME", href: "/#top" },
          crumb,
        ]}
      />

      <section className="relative bg-[#FAF5E8]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0B1A2E]/15 to-transparent"
        />

        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-12 px-7 py-20 md:grid-cols-[220px_1fr] md:gap-16 md:px-12 md:py-24">
          {/* Sticky index */}
          <aside className="md:sticky md:top-[110px] md:self-start">
            {updated && (
              <p className="text-[10px] font-semibold tracking-[0.28em] text-[#0B1A2E]/55">
                <L en={`LAST UPDATED · ${updated}`} ja={`最終更新 · ${updated}`} />
              </p>
            )}
            <div className="mt-4 h-px w-10 bg-[#C9A84C]/55" />
            <ul className="mt-7 hidden space-y-3 md:block">
              {sections.map((s, i) => (
                <li key={i}>
                  <a
                    href={`#section-${i + 1}`}
                    className="group inline-flex items-baseline gap-2 text-[11px] font-semibold tracking-[0.18em] text-[#0B1A2E]/72 no-underline transition-colors hover:text-[#C9A84C]"
                  >
                    <span className="font-serif text-[10px] tracking-[0.24em] text-[#C9A84C]/85">
                      {s.num ?? String(i + 1).padStart(2, "0")}
                    </span>
                    {s.heading}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          {/* Body */}
          <div className="max-w-[760px]">
            {sections.map((s, i) => (
              <Reveal
                key={i}
                as="div"
                delay={revealDelays.d1}
                id={`section-${i + 1}`}
                className="scroll-mt-[110px] border-t border-[#0B1A2E]/12 pt-12 first:border-t-0 first:pt-0 [&+&]:mt-12"
              >
                <div className="flex items-center gap-3">
                  <span className="font-serif text-[10px] font-medium tracking-[0.34em] text-[#C9A84C]">
                    {s.num ?? String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px w-8 bg-[#C9A84C]/60" />
                </div>
                <h2 className="mt-4 font-serif text-[clamp(22px,2.2vw,30px)] font-semibold leading-[1.18] tracking-[0.04em] text-[#0B1A2E]">
                  {s.heading}
                </h2>
                {s.jp && (
                  <p className="mt-2 font-jp text-[12px] tracking-[0.26em] text-[#C9A84C]/85">
                    {s.jp}
                  </p>
                )}
                {s.body.map((p, k) => (
                  <p
                    key={k}
                    className="mt-5 max-w-[640px] text-[14px] font-light leading-[1.85] text-[#1D2432]/82 md:text-[15px]"
                  >
                    {p}
                  </p>
                ))}
                {s.bullets && s.bullets.length > 0 && (
                  <ul className="mt-6 space-y-3">
                    {s.bullets.map((b, k) => (
                      <li
                        key={k}
                        className="flex items-start gap-3 text-[13.5px] font-light leading-[1.75] text-[#1D2432]/82 md:text-[14.5px]"
                      >
                        <span
                          aria-hidden
                          className="mt-2 h-px w-4 shrink-0 bg-[#C9A84C]"
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}
