import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { L } from "@/i18n/Localized";
import { Chars, Words } from "./split-text";

export type Story = {
  /** 章を象徴する一文字（ゴースト漢字・目次・進捗レールで共用） */
  kanji: string;
  tocJa: string;
  tocEn: string;
  eyebrow: string;
  eyebrowJp: string;
  title: string;
  jp: string;
  excerpt: string;
  excerptJp: string;
  image: string;
  position: string;
  /** 「続きを読む」の遷移先。深掘りページがある章だけ指定。未指定なら CTA を出さない。 */
  href?: string;
  ctaEn?: string;
  ctaJp?: string;
};

type Props = {
  stories: Story[];
};

const NUMERAL_JA = ["一", "二", "三", "四", "五", "六"];
const NUMERAL_EN = ["I", "II", "III", "IV", "V", "VI"];

/** 上巻・下巻 — 絵巻の二部構成。前半は造り、後半は呑み方。 */
const PARTS = [
  {
    key: "making",
    labelJa: "上巻",
    nameJa: "造る",
    labelEn: "PART ONE",
    nameEn: "The Making",
    lineJa: "水と米と、冬の仕事のこと。",
    lineEn: "Water, rice, and the work of winter.",
  },
  {
    key: "drinking",
    labelJa: "下巻",
    nameJa: "呑む",
    labelEn: "PART TWO",
    nameEn: "The Drinking",
    lineJa: "今宵の卓で、どうひらくか。",
    lineEn: "How it opens at tonight's table.",
  },
] as const;

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/></svg>\")";

/** 章カードの中身（番地・題・本文・CTA） */
function ChapterCard({ story, n }: { story: Story; n: number }) {
  return (
    <>
      <div className="story-meta flex items-center gap-4">
        <span className="font-serif text-[11px] tracking-[0.28em] text-[#C9A84C]">
          <L en={`CHAPTER ${NUMERAL_EN[n]}`} ja={`第${NUMERAL_JA[n]}章`} />
        </span>
        <span className="h-px w-9 bg-[#C9A84C]/50" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#0B1A2E]/55">
          <L en={story.eyebrow} ja={story.eyebrowJp} />
        </span>
      </div>

      <h2 className="story-title mt-6 font-serif text-[clamp(28px,3.2vw,44px)] font-semibold leading-[1.18] tracking-[0.04em] text-[#0B1A2E]">
        <span className="i18n-fragment i18n-ja">
          <Chars text={story.jp} className="story-char" />
        </span>
        <span className="i18n-fragment i18n-en">
          <Words text={story.title} className="story-char" />
        </span>
      </h2>

      <p className="i18n-en mt-3 font-jp text-[11.5px] tracking-[0.26em] text-[#C9A84C]/80">
        {story.jp}
      </p>

      <p className="story-excerpt mt-7 max-w-[560px] text-[14px] leading-[2.05] text-[#1D2432]/82 md:text-[14.5px]">
        <L en={story.excerpt} ja={story.excerptJp} />
      </p>

      {story.href && (
        <Link
          href={story.href}
          className="group/read mt-9 inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E] no-underline"
        >
          <span className="relative pb-1">
            <L
              en={story.ctaEn ?? "READ THE FULL STORY"}
              ja={story.ctaJp ?? "続きを読む"}
            />
            <span className="absolute inset-x-0 bottom-0 h-px bg-[#0B1A2E]/45 transition-all duration-500 group-hover/read:bg-[#C9A84C]" />
          </span>
          <span
            aria-hidden
            className="transition-transform duration-500 group-hover/read:translate-x-1 group-hover/read:text-[#C9A84C]"
          >
            →
          </span>
        </Link>
      )}
    </>
  );
}

/**
 * /stories 本編 — 絵巻仕立て。Server Component（演出は StoriesFx）。
 *
 * 構成: 上巻（造る: 寒・米・水）→ 下巻（呑む: 燗・温・器）。
 * 演出の原則:
 *  - 画像はリビール演出なし。緩い parallax だけ（ワンパターンなワイプは廃止）
 *  - 題は文字単位のせり上げ、本文はカードごと一度だけ立ち上がる
 *  - 章ごとに巨大なゴースト漢字が一字、奥でゆっくり流れる
 *  - reduced-motion 時は SSR マークアップがそのまま見える
 */
export function StoriesNarrative({ stories }: Props) {
  const parts = [stories.slice(0, 3), stories.slice(3)];

  return (
    <div className="stories-track relative bg-paper">
      {PARTS.map((part, pi) => (
        <Fragment key={part.key}>
          {/* ===== 巻の見出し ===== */}
          <section className="part-marker relative overflow-hidden">
            <div className="mx-auto flex max-w-[1480px] flex-col items-center px-6 py-20 text-center md:py-28">
              <span className="part-line block h-14 w-px bg-[#C9A84C]/60" />

              <div className="part-body mt-8 flex flex-col items-center gap-6">
                <span className="i18n-fragment i18n-ja">
                  <span className="flex items-start justify-center gap-4">
                    <span className="tategaki pt-1 font-serif text-[12px] tracking-[0.34em] text-[#C9A84C]">
                      {part.labelJa}
                    </span>
                    <span className="tategaki font-serif text-[clamp(34px,4.4vw,52px)] font-semibold leading-none tracking-[0.3em] text-[#0B1A2E]">
                      {part.nameJa}
                    </span>
                  </span>
                </span>
                <span className="i18n-fragment i18n-en">
                  <span className="flex flex-col items-center gap-3">
                    <span className="text-[10px] font-semibold tracking-[0.4em] text-[#C9A84C]">
                      {part.labelEn}
                    </span>
                    <span className="font-serif text-[clamp(26px,3vw,38px)] font-semibold tracking-[0.06em] text-[#0B1A2E]">
                      {part.nameEn}
                    </span>
                  </span>
                </span>

                <p className="text-[12px] tracking-[0.18em] text-[#0B1A2E]/55">
                  <L en={part.lineEn} ja={part.lineJa} />
                </p>
              </div>
            </div>
          </section>

          {/* ===== 章 ===== */}
          {parts[pi].map((story, si) => {
            const n = pi * 3 + si;

            // 第一章 — 全幅の巻頭絵
            if (n === 0) {
              return (
                <article
                  key={story.title}
                  id="story-ch-1"
                  className="story-item relative scroll-mt-24"
                >
                  <div className="relative h-[64vh] min-h-[420px] overflow-hidden md:h-[80vh]">
                    <div className="story-image-frame absolute inset-0">
                      <div className="story-image-inner absolute inset-[-8%]">
                        <Image
                          src={story.image}
                          alt=""
                          fill
                          sizes="100vw"
                          className={`fujisan-grade object-cover ${story.position}`}
                        />
                      </div>
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0B1A2E]/40 via-transparent to-transparent"
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.16]"
                        style={{ backgroundImage: GRAIN }}
                      />
                      <span
                        aria-hidden
                        className="ghost-kanji pointer-events-none absolute right-[5%] top-1/2 -translate-y-1/2 select-none font-serif text-[clamp(160px,30vh,320px)] font-semibold leading-none text-paper/12"
                      >
                        {story.kanji}
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 mx-auto max-w-[1480px] px-5 md:px-12">
                    <div className="story-card relative -mt-24 max-w-[720px] border border-[#0B1A2E]/10 bg-paper-card px-7 py-11 md:-mt-36 md:px-14 md:py-16">
                      <ChapterCard story={story} n={n} />
                    </div>
                  </div>
                </article>
              );
            }

            // 第二章以降 — 画像とカードが重なる非対称の見開き
            const imageRight = n % 2 === 1;
            return (
              <article
                key={story.title}
                id={`story-ch-${n + 1}`}
                className="story-item relative scroll-mt-24 py-16 md:py-24"
              >
                <span
                  aria-hidden
                  className={`ghost-kanji pointer-events-none absolute top-0 z-0 select-none font-serif text-[clamp(140px,20vw,300px)] font-semibold leading-none text-[#0B1A2E]/[0.045] ${
                    imageRight ? "left-[2%]" : "right-[2%]"
                  }`}
                >
                  {story.kanji}
                </span>

                <div className="relative mx-auto max-w-[1480px] md:px-12">
                  <div className="grid grid-cols-1 md:grid-cols-12 md:items-center">
                    <div
                      className={`relative aspect-[4/3] overflow-hidden md:row-start-1 ${
                        imageRight
                          ? "md:col-start-6 md:col-end-13"
                          : "md:col-start-1 md:col-end-8"
                      }`}
                    >
                      <div className="story-image-frame absolute inset-0">
                        <div className="story-image-inner absolute inset-[-8%]">
                          <Image
                            src={story.image}
                            alt=""
                            fill
                            sizes="(min-width: 768px) 58vw, 100vw"
                            className={`fujisan-grade object-cover ${story.position}`}
                          />
                        </div>
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0B1A2E]/25 via-transparent to-transparent"
                        />
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.14]"
                          style={{ backgroundImage: GRAIN }}
                        />
                      </div>
                    </div>

                    <div
                      className={`story-card relative z-10 mx-5 -mt-16 border border-[#0B1A2E]/10 bg-paper-card px-7 py-10 md:m-0 md:row-start-1 md:my-14 md:px-12 md:py-14 ${
                        imageRight
                          ? "md:col-start-1 md:col-end-7"
                          : "md:col-start-7 md:col-end-13"
                      }`}
                    >
                      <ChapterCard story={story} n={n} />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </Fragment>
      ))}

      <div className="h-16 md:h-24" />
    </div>
  );
}
