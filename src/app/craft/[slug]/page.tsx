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
    <main className="bg-paper text-[#0B1A2E] min-h-screen">
      <FujisanNav />

      <FujisanInnerHero
        eyebrow={`${pillar.num} · ${pillar.eyebrow}`}
        chapter={pillar.chapter}
        title={pillar.title}
        jp={`― ${pillar.catchJp} ―`}
        lead={<L en={pillar.lead} ja={pillar.leadJp} />}
        crumbs={[
          { label: "HOME", href: "/#top" },
          { label: "STORIES", href: "/stories" },
          { label: pillar.eyebrow, href: `/craft/${pillar.slug}` },
        ]}
        bgPosition={pillar.heroPosition}
      />

      {/* ===== Story — エディトリアルな本文カラム ===== */}
      <section className="relative bg-paper">
        <div className="mx-auto max-w-[720px] px-7 py-24 md:py-32">
          <Reveal className="flex items-center gap-4">
            <span className="h-px w-10 bg-[#C9A84C]/60" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#0B1A2E]/55">
              <L en="The Story" ja="ものがたり" />
            </span>
          </Reveal>

          <Reveal
            as="h2"
            className="mt-7 font-serif text-[clamp(26px,3vw,38px)] font-semibold leading-[1.25] tracking-[0.05em] text-[#0B1A2E]"
            delay={revealDelays.d1}
          >
            <L en={pillar.storyTitle} ja={pillar.storyTitleJp} />
          </Reveal>

          {/* EN locale */}
          <div className="i18n-en">
            {pillar.storyEn.map((para, i) => (
              <Reveal
                as="p"
                key={i}
                delay={revealDelays.d2 + i * 0.08}
                className={
                  i === 0
                    ? "mt-10 font-serif text-[clamp(16px,1.5vw,18px)] leading-[1.9] text-[#1D2432]/92"
                    : "mt-7 font-serif text-[clamp(15px,1.4vw,17px)] leading-[1.9] text-[#1D2432]/82"
                }
              >
                {para}
              </Reveal>
            ))}
          </div>

          {/* JA locale */}
          <div className="i18n-ja">
            {pillar.storyJp.map((para, i) => (
              <Reveal
                as="p"
                key={i}
                delay={revealDelays.d2 + i * 0.08}
                className={
                  i === 0
                    ? "mt-10 whitespace-pre-line font-jp text-[clamp(14.5px,1.3vw,16px)] leading-[2.1] text-[#1D2432]/90"
                    : "mt-7 whitespace-pre-line font-jp text-[clamp(13.5px,1.2vw,15px)] leading-[2.05] text-[#1D2432]/80"
                }
              >
                {para}
              </Reveal>
            ))}
          </div>

          {/* プルクオート — 中央寄せ・上下ヘアラインの誌面スタイル */}
          <Reveal className="mt-20 flex flex-col items-center text-center" delay={revealDelays.d2}>
            <span aria-hidden className="h-px w-14 bg-[#C9A84C]/60" />
            <p className="mt-8 max-w-[540px] font-serif text-[clamp(19px,2vw,25px)] leading-[1.75] tracking-[0.04em] text-[#0B1A2E]/88">
              <L en={pillar.pullQuote} ja={pillar.pullQuoteJp} />
            </p>
            <span aria-hidden className="mt-8 h-px w-14 bg-[#C9A84C]/60" />
          </Reveal>
        </div>
      </section>

      {/* ===== Spec sheet — 額装プレート + ヘアラインの仕様表 ===== */}
      <section className="relative border-y border-[#0B1A2E]/10 bg-paper-tint/55">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-14 px-7 py-20 md:px-12 md:py-28 lg:grid-cols-[minmax(0,44%)_minmax(0,1fr)] lg:gap-20">
          <Reveal>
            <figure className="m-0">
              <div className="relative aspect-[4/3] border border-[#0B1A2E]/15 bg-paper p-2.5 md:p-3">
                <div className="group/plate relative h-full w-full overflow-hidden">
                  <Image
                    src={pillar.detailImage}
                    alt={pillar.title}
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="fujisan-grade object-cover transition-transform duration-[1600ms] ease-out group-hover/plate:scale-[1.03]"
                  />
                </div>
              </div>
              <figcaption className="mt-4 flex items-baseline justify-between gap-4 text-[10px] tracking-[0.26em] text-[#0B1A2E]/50">
                <span>
                  <L en={pillar.eyebrow} ja={pillar.jp} />
                </span>
                <span className="shrink-0 font-serif tracking-[0.2em] text-[#0B1A2E]/45">
                  FIG. {pillar.num}
                </span>
              </figcaption>
            </figure>
          </Reveal>

          <div className="self-center">
            <Reveal className="flex items-center gap-4">
              <span className="h-px w-10 bg-[#C9A84C]/60" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#0B1A2E]/55">
                <L en="In Numbers" ja="数値で見る" />
              </span>
            </Reveal>
            <Reveal
              as="h2"
              className="mt-6 font-serif text-[clamp(22px,2.4vw,32px)] font-semibold leading-[1.2] tracking-[0.06em] text-[#0B1A2E]"
              delay={revealDelays.d1}
            >
              <L
                en="The mountain, in measurements"
                ja="数値で辿る、山のかたち"
              />
            </Reveal>

            <dl className="mt-10 border-t border-[#0B1A2E]/12">
              {pillar.stats.map((s, i) => (
                <Reveal
                  key={s.label}
                  delay={0.1 + i * 0.07}
                  className="flex items-baseline justify-between gap-6 border-b border-[#0B1A2E]/12 py-5"
                >
                  <dt>
                    <span className="text-[10.5px] font-semibold tracking-[0.26em] text-[#0B1A2E]/60">
                      <L en={s.label} ja={s.labelJp} />
                    </span>
                    {s.caption ? (
                      <span className="mt-1 block text-[10.5px] font-light leading-[1.5] tracking-[0.06em] text-[#0B1A2E]/48">
                        <L en={s.caption} ja={s.captionJp ?? s.caption} />
                      </span>
                    ) : null}
                  </dt>
                  <dd className="shrink-0 font-serif text-[19px] font-semibold tracking-[0.04em] text-[#0B1A2E] md:text-[21px]">
                    <L en={s.value} ja={s.valueJp} />
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ===== Process — 縦の工程インデックス ===== */}
      <section className="relative bg-paper">
        <div className="mx-auto max-w-[1280px] px-7 py-20 md:px-12 md:py-28">
          <Reveal className="flex items-center gap-4">
            <span className="h-px w-10 bg-[#C9A84C]/60" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#0B1A2E]/55">
              <L en="The Process" ja="醸しの工程" />
            </span>
          </Reveal>
          <Reveal
            as="h2"
            className="mt-6 max-w-[680px] font-serif text-[clamp(22px,2.4vw,32px)] font-semibold leading-[1.2] tracking-[0.06em] text-[#0B1A2E]"
            delay={revealDelays.d1}
          >
            <L
              en="Four movements, one quiet hand."
              ja="四つの所作、ひとつの静かな手。"
            />
          </Reveal>

          <ol className="m-0 mt-12 list-none border-t border-[#0B1A2E]/12 p-0 md:mt-16">
            {pillar.steps.map((step, i) => (
              <Reveal
                as="li"
                key={step.en}
                delay={0.08 + i * 0.08}
                className="group grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 border-b border-[#0B1A2E]/12 py-7 sm:grid-cols-[64px_minmax(0,220px)_minmax(0,1fr)] sm:gap-x-10 md:py-8"
              >
                <span
                  aria-hidden
                  className="font-serif text-[26px] font-medium leading-none tracking-[0.06em] text-[#0B1A2E]/22 transition-colors duration-500 group-hover:text-[#C9A84C] md:text-[30px]"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-serif text-[15px] font-semibold tracking-[0.18em] text-[#0B1A2E] transition-colors duration-500 group-hover:text-[#C9A84C] md:text-[16px]">
                    <L en={step.en.toUpperCase()} ja={step.jp} />
                  </h3>
                  <p className="i18n-en mt-1.5 font-jp text-[10.5px] tracking-[0.24em] text-[#C9A84C]/85">
                    {step.jp}
                  </p>
                </div>
                <p className="col-start-2 max-w-[560px] text-[13px] font-light leading-[1.85] text-[#1D2432]/75 sm:col-start-3 md:text-[13.5px]">
                  <L en={step.desc} ja={step.descJp} />
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== Prev / Next ===== */}
      <section className="border-t border-[#0B1A2E]/10 bg-paper-tint/55">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 md:grid-cols-2">
          {[
            {
              p: prev,
              labelEn: "PREV CHAPTER",
              labelJa: "前の章",
              align: "left" as const,
            },
            {
              p: next,
              labelEn: "NEXT CHAPTER",
              labelJa: "次の章",
              align: "right" as const,
            },
          ].map(({ p, labelEn, labelJa, align }) => (
            <Link
              key={p.slug}
              href={`/craft/${p.slug}`}
              className={`group flex flex-col gap-2.5 border-[#0B1A2E]/10 px-7 py-12 no-underline transition-colors hover:bg-paper md:px-12 md:py-16 ${
                align === "right"
                  ? "md:items-end md:border-l md:text-right"
                  : "border-b md:items-start md:border-b-0"
              }`}
            >
              <span className="text-[10px] font-semibold tracking-[0.34em] text-[#0B1A2E]/55">
                <L en={labelEn} ja={labelJa} />
              </span>
              <span className="font-serif text-[clamp(20px,2.2vw,28px)] font-semibold tracking-[0.05em] text-[#0B1A2E] transition-colors duration-500 group-hover:text-[#C9A84C]">
                {p.title}
              </span>
              <span className="font-jp text-[11px] tracking-[0.24em] text-[#C9A84C]/85">
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
