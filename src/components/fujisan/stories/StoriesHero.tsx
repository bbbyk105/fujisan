import Image from "next/image";
import Link from "next/link";
import { Chars, Words } from "./split-text";

type Crumb = { label: string; href: string };

export type HeroChapter = {
  kanji: string;
  labelJa: string;
  labelEn: string;
};

type Props = {
  titleEn: string;
  titleJp: string;
  leadEn: string;
  leadJa: string;
  crumbs: Crumb[];
  chapters: HeroChapter[];
  bgSrc?: string;
  bgPosition?: string;
};

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.7'/></svg>\")";

/**
 * /stories の序（Hero）— 絵巻の巻頭。Server Component（演出は StoriesFx）。
 * - 日本語: 縦書きタイトル「富士山酒物語」を右に立て、左下に前書きと目次
 * - 英語: 横組みの大見出しに同じ構成
 */
export function StoriesHero({
  titleEn,
  titleJp,
  leadEn,
  leadJa,
  crumbs,
  chapters,
  bgSrc = "/images/fujisan/hero/mtfuji.webp",
  bgPosition = "object-[50%_46%]",
}: Props) {
  const crumbRow = (
    <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-semibold tracking-[0.24em]">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="hero-crumb flex items-center gap-2">
          <Link
            href={crumb.href}
            className="text-[#0B1A2E]/60 no-underline transition-colors hover:text-[#C9A84C]"
          >
            {crumb.label}
          </Link>
          {i < crumbs.length - 1 && (
            <span aria-hidden className="text-[#0B1A2E]/30">
              /
            </span>
          )}
        </span>
      ))}
    </div>
  );

  return (
    <section className="stories-hero relative isolate overflow-hidden bg-paper text-[#0B1A2E]">
      {/* 背景 */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="hero-bg-image absolute inset-0 will-change-transform">
          <Image
            src={bgSrc}
            alt=""
            fill
            priority
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className={`fujisan-grade object-cover ${bgPosition}`}
          />
        </div>
        <div className="absolute inset-0 bg-linear-to-r from-paper-warm/90 via-paper-warm/30 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-36 bg-linear-to-b from-[#F9EFE0]/75 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[240px] bg-linear-to-b from-transparent via-paper/70 to-paper" />
        <div
          aria-hidden
          className="absolute inset-0 mix-blend-overlay opacity-[0.10]"
          style={{ backgroundImage: GRAIN }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1480px] flex-col px-6 pb-14 pt-[100px] sm:px-8 md:px-12 md:pb-16 md:pt-[118px]">
        {crumbRow}

        {/* ===== 日本語 — 縦書きの巻頭 ===== */}
        <div className="i18n-fragment i18n-ja">
          <div className="hero-text-stack mt-8 flex flex-1 flex-col justify-between gap-14 will-change-transform md:mt-4 md:flex-row-reverse md:items-end md:gap-10">
            {/* 縦書きタイトル — 夜の富士に掛け軸のように立てる */}
            <div className="flex items-end justify-end self-end md:pb-10 md:pr-[2vw]">
              <h1
                className="tategaki font-serif text-[clamp(46px,8.2vh,92px)] font-semibold leading-[1.05] tracking-[0.14em] text-off-white"
                style={{ textShadow: "0 1px 24px rgba(11,26,46,0.45)" }}
              >
                <Chars text={titleJp} className="hero-char" />
              </h1>
            </div>

            {/* 前書き + 目次 */}
            <div className="flex max-w-[560px] flex-col gap-8 pb-1">
              <div className="hero-eyebrow flex items-center gap-4">
                <span className="font-serif text-[12px] tracking-[0.3em] text-[#C9A84C]">
                  序
                </span>
                <span className="h-px w-12 bg-[#C9A84C]/55" />
                <span className="font-jp text-[11px] tracking-[0.28em] text-[#0B1A2E]/60">
                  富士のふもと、六つの覚え書き
                </span>
              </div>

              <p className="hero-lead max-w-[520px] text-[14px] font-light leading-[2.15] text-[#2B2419]/85 md:text-[15px]">
                {leadJa}
              </p>

              <nav
                aria-label="章の目次"
                className="hero-toc mt-1 flex flex-wrap gap-x-7 gap-y-5"
              >
                {chapters.map((c, i) => (
                  <a
                    key={c.kanji}
                    href={`#story-ch-${i + 1}`}
                    className="group flex flex-col items-center gap-2 no-underline"
                  >
                    <span className="font-serif text-[24px] leading-none text-[#0B1A2E]/85 transition-colors duration-300 group-hover:text-[#C9A84C]">
                      {c.kanji}
                    </span>
                    <span className="text-[9.5px] tracking-[0.18em] text-[#0B1A2E]/45">
                      {c.labelJa}
                    </span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* ===== English — horizontal opening ===== */}
        <div className="i18n-fragment i18n-en">
          <div className="hero-text-stack mt-10 flex flex-1 flex-col justify-end gap-8 will-change-transform">
            <div className="hero-eyebrow flex items-center gap-4">
              <span className="font-serif text-[12px] tracking-[0.3em] text-[#C9A84C]">
                序
              </span>
              <span className="h-px w-12 bg-[#C9A84C]/55" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#0B1A2E]/60">
                SIX NOTES FROM THE FOOT OF MT. FUJI
              </span>
            </div>

            <h1 className="max-w-[980px] font-serif text-[clamp(44px,6.6vw,100px)] font-semibold leading-[0.98] tracking-[0.02em] text-[#0B1A2E]">
              <Words text={titleEn} className="hero-word" masked />
            </h1>

            <p className="font-jp text-[12.5px] tracking-[0.3em] text-[#C9A84C]/90">
              ― 富士山酒物語 ―
            </p>

            <p className="hero-lead max-w-[620px] text-[14.5px] font-light leading-[1.9] text-[#2B2419]/85 md:text-[16px]">
              {leadEn}
            </p>

            <nav
              aria-label="Chapters"
              className="hero-toc mt-2 flex flex-wrap gap-x-8 gap-y-5"
            >
              {chapters.map((c, i) => (
                <a
                  key={c.kanji}
                  href={`#story-ch-${i + 1}`}
                  className="group flex flex-col items-center gap-2 no-underline"
                >
                  <span className="font-serif text-[24px] leading-none text-[#0B1A2E]/85 transition-colors duration-300 group-hover:text-[#C9A84C]">
                    {c.kanji}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.22em] text-[#0B1A2E]/45">
                    {c.labelEn}
                  </span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
