import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { FujisanInnerHero } from "@/components/fujisan/FujisanInnerHero";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import {
  fujisanCraftPillars,
  getCraftPillarBySlug,
} from "@/data/fujisan-craft";
import { L } from "@/i18n/Localized";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return fujisanCraftPillars.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const pillar = getCraftPillarBySlug(slug);
  if (!pillar) return { title: "FUJISAN SAKE" };
  return {
    title: `${pillar.title} — The Craft of FUJISAN SAKE`,
    description: pillar.lead,
  };
}

export default async function CraftPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const pillar = getCraftPillarBySlug(slug);
  if (!pillar) notFound();

  const idx = fujisanCraftPillars.findIndex((p) => p.slug === slug);
  const prev =
    fujisanCraftPillars[
      (idx - 1 + fujisanCraftPillars.length) % fujisanCraftPillars.length
    ];
  const next = fujisanCraftPillars[(idx + 1) % fujisanCraftPillars.length];

  return (
    <main className="bg-[#FAF5E8] text-[#0B1A2E] min-h-screen">
      <FujisanNav />

      <FujisanInnerHero
        eyebrow={`${pillar.num} · ${pillar.eyebrow}`}
        chapter={pillar.chapter}
        title={pillar.title}
        jp={`― ${pillar.catchJp} ―`}
        lead={pillar.lead}
        crumbs={[
          { label: "HOME", href: "/#top" },
          { label: "THE CRAFT", href: "/craft" },
          { label: pillar.eyebrow, href: `/craft/${pillar.slug}` },
        ]}
        bgPosition={pillar.heroPosition}
      />

      {/* ===== Story (locale-aware single column) ===== */}
      <section className="relative bg-[#FAF5E8]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0B1A2E]/15 to-transparent"
        />
        <div className="mx-auto max-w-[840px] px-7 py-20 md:px-12 md:py-24">
          {/* EN locale */}
          <div className="i18n-en">
            <Reveal className="flex items-center gap-3">
              <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#C9A84C]">
                {pillar.chapter}
              </span>
              <span className="h-px w-10 bg-[#C9A84C]/55" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#0B1A2E]/65">
                {pillar.storyTitle}
              </span>
            </Reveal>

            {pillar.storyEn.map((para, i) => (
              <Reveal
                as="p"
                key={i}
                delay={revealDelays.d1 + i * 0.08}
                className="mt-7 max-w-[640px] font-serif text-[clamp(15px,1.4vw,17px)] leading-[1.85] text-[#1D2432]/88"
              >
                {para}
              </Reveal>
            ))}

            <Reveal
              className="mt-12 max-w-[560px] border-l-2 border-[#C9A84C]/60 pl-6"
              delay={revealDelays.d3}
            >
              <p className="font-serif text-[clamp(18px,1.7vw,22px)] italic leading-[1.55] text-[#0B1A2E]/85">
                {pillar.pullQuote}
              </p>
            </Reveal>
          </div>

          {/* JA locale */}
          <div className="i18n-ja">
            <Reveal className="flex items-center gap-3">
              <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#C9A84C]">
                {pillar.chapter}
              </span>
              <span className="h-px w-10 bg-[#C9A84C]/55" />
              <span className="font-jp text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/70">
                {pillar.storyTitleJp}
              </span>
            </Reveal>

            <Reveal
              as="p"
              delay={revealDelays.d1}
              className="mt-6 font-jp text-[12px] font-semibold tracking-[0.3em] text-[#C9A84C]"
            >
              {pillar.jp}
            </Reveal>

            {pillar.storyJp.map((para, i) => (
              <Reveal
                as="p"
                key={i}
                delay={revealDelays.d2 + i * 0.08}
                className="mt-7 max-w-[640px] whitespace-pre-line font-jp text-[clamp(13.5px,1.2vw,15px)] leading-[2] text-[#1D2432]/82"
              >
                {para}
              </Reveal>
            ))}

            <Reveal
              className="mt-12 max-w-[560px] border-l-2 border-[#C9A84C]/60 pl-6"
              delay={revealDelays.d3}
            >
              <p className="font-jp text-[clamp(15px,1.5vw,18px)] leading-[1.8] text-[#0B1A2E]/85">
                {pillar.pullQuoteJp}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== Visual + Stats ===== */}
      <section className="relative bg-[#0F1D30] text-[#F2E4C7]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#D7B46A]/40 to-transparent"
        />
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 lg:grid-cols-[1fr_1fr]">
          <div className="relative min-h-[320px] overflow-hidden md:min-h-[460px]">
            <Image
              src={pillar.detailImage}
              alt={pillar.title}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#0F1D30]/30 via-transparent to-[#0F1D30]/40"
            />
          </div>

          <div className="fujisan-dark-panel relative px-7 py-16 sm:px-10 md:px-14 md:py-20">
            <span
              aria-hidden
              className="fujisan-breathe pointer-events-none absolute right-6 top-6 select-none font-jp text-[160px] leading-none text-[#D7B46A]/[0.06] md:text-[200px]"
            >
              {pillar.jp.charAt(0)}
            </span>

            <Reveal className="flex items-center gap-3">
              <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#D7B46A]">
                {pillar.chapter}.II
              </span>
              <span className="h-px w-10 bg-[#D7B46A]/55" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#D7B46A]/85">
                <L en="Numbers" ja="数値で見る" />
              </span>
            </Reveal>

            <Reveal
              as="h2"
              className="mt-5 font-serif text-[clamp(22px,2.2vw,30px)] font-semibold leading-[1.15] tracking-[0.08em] text-[#F2E4C7]"
              delay={revealDelays.d1}
            >
              <L
                en="The mountain, in measurements"
                ja="数値で辿る、山のかたち"
              />
            </Reveal>

            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-9">
              {pillar.stats.map((s, i) => (
                <Reveal
                  key={s.label}
                  as="div"
                  delay={0.15 + i * 0.1}
                  className="flex flex-col"
                >
                  <dt className="text-[10px] font-semibold tracking-[0.26em] text-[#D7B46A]/85">
                    <L en={s.label} ja={s.labelJp} />
                  </dt>
                  <dd className="mt-2 font-serif text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[0.04em] text-[#F2E4C7]">
                    <L en={s.value} ja={s.valueJp} />
                  </dd>
                  {s.caption && (
                    <p className="mt-1 text-[11px] leading-[1.5] text-[#F2E4C7]/65">
                      <L en={s.caption} ja={s.captionJp ?? s.caption} />
                    </p>
                  )}
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ===== Process ===== */}
      <section className="relative bg-[#FAF5E8]">
        <div className="mx-auto max-w-[1280px] px-7 py-20 md:px-12 md:py-24">
          <Reveal className="flex items-center gap-3">
            <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#C9A84C]">
              {pillar.chapter}.III
            </span>
            <span className="h-px w-10 bg-[#C9A84C]/55" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#0B1A2E]/65">
              <L en="The Process" ja="醸しの工程" />
            </span>
          </Reveal>

          <Reveal
            as="h2"
            className="mt-5 max-w-[680px] font-serif text-[clamp(24px,2.6vw,34px)] font-semibold leading-[1.15] tracking-[0.06em] text-[#0B1A2E]"
            delay={revealDelays.d1}
          >
            <L
              en="Four movements, one quiet hand."
              ja="四つの所作、ひとつの静かな手。"
            />
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-y-10 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:gap-x-8">
            {pillar.steps.map((step, i) => (
              <Reveal
                key={step.en}
                delay={0.12 + i * 0.1}
                className="relative flex flex-col gap-4 border-t border-[#0B1A2E]/15 pt-6"
              >
                <span
                  aria-hidden
                  className="absolute -top-[1px] left-0 h-px w-10 bg-[#C9A84C]"
                />
                <span className="font-serif text-[12px] font-medium tracking-[0.34em] text-[#C9A84C]">
                  {step.num}
                </span>
                <div>
                  <h3 className="font-serif text-[15px] font-semibold tracking-[0.18em] text-[#0B1A2E]">
                    <L en={step.en.toUpperCase()} ja={step.jp} />
                  </h3>
                  <p className="i18n-en mt-1 font-jp text-[11px] tracking-[0.24em] text-[#C9A84C]/85">
                    {step.jp}
                  </p>
                </div>
                <p className="text-[13px] font-light leading-[1.75] text-[#1D2432]/78">
                  <L en={step.desc} ja={step.descJp} />
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Prev / Next ===== */}
      <section className="border-t border-[#0B1A2E]/10 bg-[#F4ECD9]">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 md:grid-cols-2">
          {[
            {
              p: prev,
              labelEn: "PREVIOUS PILLAR",
              labelJa: "前の章",
              arrow: "←",
              align: "left" as const,
            },
            {
              p: next,
              labelEn: "NEXT PILLAR",
              labelJa: "次の章",
              arrow: "→",
              align: "right" as const,
            },
          ].map(({ p, labelEn, labelJa, arrow, align }) => (
            <Link
              key={p.slug}
              href={`/craft/${p.slug}`}
              className={`group flex flex-col gap-2 border-[#0B1A2E]/10 px-7 py-10 no-underline transition-colors hover:bg-[#FAF5E8] md:px-12 md:py-14 ${
                align === "right"
                  ? "md:items-end md:text-right md:border-l"
                  : "md:items-start border-b md:border-b-0"
              }`}
            >
              <span className="text-[10px] font-semibold tracking-[0.28em] text-[#0B1A2E]/60">
                <L
                  en={
                    align === "left"
                      ? `${arrow} ${labelEn}`
                      : `${labelEn} ${arrow}`
                  }
                  ja={
                    align === "left"
                      ? `${arrow} ${labelJa}`
                      : `${labelJa} ${arrow}`
                  }
                />
              </span>
              <span className="font-serif text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[0.04em] text-[#0B1A2E] group-hover:text-[#C9A84C]">
                {p.title}
              </span>
              <span className="font-jp text-[11px] tracking-[0.22em] text-[#0B1A2E]/72">
                {p.jp}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}
