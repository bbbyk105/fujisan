import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditorialPage } from "@/components/fujisan/editorial/EditorialPage";
import { EditorialPageHeader } from "@/components/fujisan/editorial/EditorialPageHeader";
import {
  EditorialSection,
  EditorialSectionHead,
} from "@/components/fujisan/editorial/EditorialSection";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import {
  fujisanCraftPillars,
  getCraftPillarBySlug,
} from "@/data/fujisan-craft";
import { L } from "@/i18n/Localized";
import { buildMetadata } from "@/lib/seo";

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
  return buildMetadata({
    title: `${pillar.title} — The Craft`,
    description: pillar.lead,
    path: `/craft/${pillar.slug}`,
  });
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
    <EditorialPage>
      <EditorialPageHeader
        kicker={
          <>
            <span className="ed-num mr-3">{pillar.num}</span>
            <L en={pillar.eyebrow} ja={pillar.jp} />
          </>
        }
        title={<L en={pillar.title} ja={pillar.catchJp} />}
        lead={<L en={pillar.lead} ja={pillar.leadJp} />}
        width="narrow"
      />

      {/* 記事の扉写真。飾りではなく、その章が何を指しているかを示す一枚 */}
      <div className="ed-wrap ed-wrap-wide">
        <div className="relative aspect-[16/7] w-full">
          <Image
            src={pillar.heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className={`fujisan-grade object-cover ${pillar.heroPosition}`}
          />
        </div>
      </div>

      {/* ===== Story — エディトリアルな本文カラム ===== */}
      <EditorialSection width="narrow" ruled={false}>
        <div>
          <EditorialSectionHead
            label={<L en="The story" ja="ものがたり" />}
            heading={<L en={pillar.storyTitle} ja={pillar.storyTitleJp} />}
          />

          {/* EN locale */}
          <div className="i18n-en">
            {pillar.storyEn.map((para, i) => (
              <Reveal
                as="p"
                key={i}
                delay={revealDelays.d2 + i * 0.08}
                className={
                  i === 0
                    ? "mt-10 font-serif text-[clamp(16px,1.5vw,18px)] leading-[1.9] text-indigo/92"
                    : "mt-7 font-serif text-[clamp(15px,1.4vw,17px)] leading-[1.9] text-indigo/82"
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
                    ? "mt-10 whitespace-pre-line font-jp text-[clamp(14.5px,1.3vw,16px)] leading-[2.1] text-indigo/90"
                    : "mt-7 whitespace-pre-line font-jp text-[clamp(13.5px,1.2vw,15px)] leading-[2.05] text-indigo/80"
                }
              >
                {para}
              </Reveal>
            ))}
          </div>

          {/* プルクオート — 中央寄せ・上下ヘアラインの誌面スタイル */}
          <Reveal className="mt-20 flex flex-col items-center text-center" delay={revealDelays.d2}>
            <span aria-hidden className="h-px w-14 bg-gold/60" />
            <p className="mt-8 max-w-[540px] font-serif text-[clamp(19px,2vw,25px)] leading-[1.75] tracking-[0.04em] text-indigo/88">
              <L en={pillar.pullQuote} ja={pillar.pullQuoteJp} />
            </p>
            <span aria-hidden className="mt-8 h-px w-14 bg-gold/60" />
          </Reveal>
        </div>
      </EditorialSection>

      {/* ===== Spec sheet — 額装プレート + ヘアラインの仕様表 ===== */}
      <section className="relative border-y border-indigo/10 bg-paper-tint/55">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-14 px-7 py-20 md:px-12 md:py-28 lg:grid-cols-[minmax(0,44%)_minmax(0,1fr)] lg:gap-20">
          <Reveal>
            <figure className="m-0">
              <div className="relative aspect-[4/3] border border-indigo/15 bg-paper p-2.5 md:p-3">
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
              <figcaption className="mt-4 flex items-baseline justify-between gap-4 text-[11px] tracking-[0.12em] text-indigo/50">
                <span>
                  <L en={pillar.eyebrow} ja={pillar.jp} />
                </span>
                <span className="shrink-0 font-serif tracking-[0.2em] text-indigo/45">
                  FIG. {pillar.num}
                </span>
              </figcaption>
            </figure>
          </Reveal>

          <div className="self-center">
            <EditorialSectionHead
              label={<L en="In numbers" ja="数値で見る" />}
              heading={
                <L
                  en="The mountain, in measurements"
                  ja="数値で辿る、山のかたち"
                />
              }
            />

            <dl className="mt-10 border-t border-indigo/12">
              {pillar.stats.map((s, i) => (
                <Reveal
                  key={s.label}
                  delay={0.1 + i * 0.07}
                  className="flex items-baseline justify-between gap-6 border-b border-indigo/12 py-5"
                >
                  <dt>
                    <span className="text-[11.5px] font-semibold tracking-[0.12em] text-indigo/60">
                      <L en={s.label} ja={s.labelJp} />
                    </span>
                    {s.caption ? (
                      <span className="mt-1 block text-[11.5px] font-light leading-[1.5] tracking-[0.06em] text-indigo/48">
                        <L en={s.caption} ja={s.captionJp ?? s.caption} />
                      </span>
                    ) : null}
                  </dt>
                  <dd className="shrink-0 font-serif text-[19px] font-semibold tracking-[0.04em] text-indigo md:text-[21px]">
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
          <EditorialSectionHead
            label={<L en="The process" ja="醸しの工程" />}
            heading={
              <L
                en="Four stages of the work"
                ja="造りの四つの工程"
              />
            }
          />

          <ol className="m-0 mt-12 list-none border-t border-indigo/12 p-0 md:mt-16">
            {pillar.steps.map((step, i) => (
              <Reveal
                as="li"
                key={step.en}
                delay={0.08 + i * 0.08}
                className="group grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 border-b border-indigo/12 py-7 sm:grid-cols-[64px_minmax(0,220px)_minmax(0,1fr)] sm:gap-x-10 md:py-8"
              >
                <span
                  aria-hidden
                  className="font-serif text-[26px] font-medium leading-none tracking-[0.06em] text-indigo/22 transition-colors duration-500 group-hover:text-gold md:text-[30px]"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-serif text-[15px] font-semibold tracking-[0.18em] text-indigo transition-colors duration-500 group-hover:text-gold md:text-[16px]">
                    <L en={step.en} ja={step.jp} />
                  </h3>
                  <p className="i18n-en mt-1.5 font-jp text-[11.5px] tracking-[0.12em] text-gold/85">
                    {step.jp}
                  </p>
                </div>
                <p className="col-start-2 max-w-[560px] text-[13px] font-light leading-[1.85] text-indigo/75 sm:col-start-3 md:text-[13.5px]">
                  <L en={step.desc} ja={step.descJp} />
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== Prev / Next ===== */}
      <section className="border-t border-indigo/10 bg-paper-tint/55">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 md:grid-cols-2">
          {[
            {
              p: prev,
              labelEn: "Previous",
              labelJa: "前の章",
              align: "left" as const,
            },
            {
              p: next,
              labelEn: "Next",
              labelJa: "次の章",
              align: "right" as const,
            },
          ].map(({ p, labelEn, labelJa, align }) => (
            <Link
              key={p.slug}
              href={`/craft/${p.slug}`}
              className={`group flex flex-col gap-2.5 border-indigo/10 px-7 py-12 no-underline transition-colors hover:bg-paper md:px-12 md:py-16 ${
                align === "right"
                  ? "md:items-end md:border-l md:text-right"
                  : "border-b md:items-start md:border-b-0"
              }`}
            >
              <span className="text-[11px] font-semibold tracking-[0.12em] text-indigo/55">
                <L en={labelEn} ja={labelJa} />
              </span>
              <span className="font-serif text-[clamp(20px,2.2vw,28px)] font-semibold tracking-[0.05em] text-indigo transition-colors duration-500 group-hover:text-gold">
                {p.title}
              </span>
              <span className="font-jp text-[11px] tracking-[0.12em] text-gold/85">
                {p.jp}
              </span>
            </Link>
          ))}
        </div>
      </section>

    </EditorialPage>
  );
}
