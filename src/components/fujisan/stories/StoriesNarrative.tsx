"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { L } from "@/i18n/Localized";
import { ensureGsap, gsap, SplitText, useGSAP } from "./gsap-setup";

ensureGsap();

export type Story = {
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

const KANJI = ["一", "二", "三", "四", "五", "六"];

type Props = {
  stories: Story[];
};

/**
 * /stories 本編。
 *
 * 演出のレイヤー:
 *  - 開幕 (opening) はピン留めシーン。巨大な漢字背景 + 画像 clip-path リビール +
 *    タイトルの行単位アニメで一気に世界観に入る。
 *  - 章ごとに番号カウンター（CountUp）、画像 clip-path、縦線の伸び、
 *    本文の split-by-line リビール、画像 parallax を組み合わせる。
 *  - 画像 hover で 4% scale + サブレイヤー。
 *  - reduced-motion 時はすべて即時表示。
 */
export function StoriesNarrative({ stories }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [opening, ...rest] = stories;

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const splits: SplitText[] = [];

      if (reduce) {
        gsap.set(
          [
            ".story-image-clip",
            ".story-line",
            ".story-text-line",
            ".story-kanji-big",
            ".story-counter",
            ".section-eyebrow > *",
            ".section-title-line",
            ".opening-kanji",
          ],
          { y: 0, opacity: 1, scaleX: 1, scaleY: 1, clipPath: "inset(0 0 0 0)" },
        );
        return;
      }

      // ----- Section heading SplitText -----
      const sectionTitle = root.current?.querySelector<HTMLElement>(
        ".section-title",
      );
      if (sectionTitle) {
        const sp = new SplitText(sectionTitle, {
          type: "words,lines",
          linesClass: "section-title-line",
        });
        splits.push(sp);
        gsap.set(sectionTitle, { perspective: 600 });
        gsap.from(sp.lines, {
          yPercent: 110,
          opacity: 0,
          rotateX: -20,
          duration: 1.0,
          stagger: 0.1,
          ease: "power4.out",
          scrollTrigger: { trigger: sectionTitle, start: "top 82%" },
        });
      }

      gsap.from(".section-eyebrow > *", {
        y: 18,
        opacity: 0,
        duration: 0.8,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: { trigger: ".section-eyebrow", start: "top 86%" },
      });

      // ----- Opening pinned scene -----
      const opening = root.current?.querySelector<HTMLElement>(".opening-scene");
      if (opening) {
        const openTitle = opening.querySelector<HTMLElement>(".opening-title");
        if (openTitle) {
          const sp = new SplitText(openTitle, {
            type: "chars,words,lines",
            linesClass: "opening-title-line",
          });
          splits.push(sp);
          gsap.from(sp.chars, {
            yPercent: 130,
            opacity: 0,
            rotate: 4,
            duration: 1.1,
            stagger: 0.022,
            ease: "power4.out",
            scrollTrigger: { trigger: opening, start: "top 68%" },
          });
        }

        // Image: clip-path 100% bottom-up reveal + slow scale
        gsap.fromTo(
          ".opening-image-clip",
          { clipPath: "inset(100% 0% 0% 0%)", scale: 1.18 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            scale: 1.0,
            duration: 1.6,
            ease: "power4.out",
            scrollTrigger: { trigger: opening, start: "top 70%" },
          },
        );

        // Huge kanji that scales in
        gsap.fromTo(
          ".opening-kanji",
          { scale: 0.4, opacity: 0, rotate: -8 },
          {
            scale: 1,
            opacity: 1,
            rotate: 0,
            duration: 1.4,
            ease: "expo.out",
            scrollTrigger: { trigger: opening, start: "top 72%" },
          },
        );

        // Image parallax over its section
        gsap.to(".opening-image-inner", {
          yPercent: -14,
          ease: "none",
          scrollTrigger: {
            trigger: opening,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.4,
          },
        });

        // Opening eyebrow / lead / excerpt stagger
        gsap.from(".opening-meta > *", {
          y: 30,
          opacity: 0,
          duration: 0.9,
          stagger: 0.1,
          delay: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: opening, start: "top 70%" },
        });
      }

      // ----- Per-story (alternating) -----
      const items = gsap.utils.toArray<HTMLElement>(".story-item.is-alt", root.current!);
      items.forEach((item, i) => {
        const image = item.querySelector(".story-image-clip");
        const imageInner = item.querySelector(".story-image-inner");
        const titleEl = item.querySelector<HTMLElement>(".story-title");
        const text = item.querySelector(".story-excerpt");
        const meta = item.querySelectorAll(".story-meta > *");
        const line = item.querySelector(".story-line");
        const kanjiBig = item.querySelector(".story-kanji-big");
        const counter = item.querySelector<HTMLElement>(".story-counter");

        // Image clip-path reveal
        if (image) {
          gsap.fromTo(
            image,
            { clipPath: "inset(100% 0% 0% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.3,
              ease: "power4.out",
              scrollTrigger: { trigger: item, start: "top 78%" },
            },
          );
        }

        // Image parallax
        if (imageInner) {
          gsap.fromTo(
            imageInner,
            { yPercent: 8, scale: 1.08 },
            {
              yPercent: -8,
              scale: 1.0,
              ease: "none",
              scrollTrigger: {
                trigger: item,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.4,
              },
            },
          );
        }

        // Title: split into lines, slide up with rotateX
        if (titleEl) {
          const sp = new SplitText(titleEl, {
            type: "lines,words",
            linesClass: "story-text-line",
          });
          splits.push(sp);
          gsap.set(titleEl, { perspective: 800 });
          gsap.from(sp.lines, {
            yPercent: 110,
            opacity: 0,
            rotateX: -18,
            duration: 1.0,
            stagger: 0.08,
            ease: "power4.out",
            scrollTrigger: { trigger: item, start: "top 80%" },
          });
        }

        // Excerpt: line-by-line stagger
        if (text) {
          const sp = new SplitText(text, {
            type: "lines",
            linesClass: "story-text-line",
          });
          splits.push(sp);
          gsap.from(sp.lines, {
            y: 24,
            opacity: 0,
            duration: 0.7,
            stagger: 0.05,
            ease: "power2.out",
            delay: 0.2,
            scrollTrigger: { trigger: item, start: "top 80%" },
          });
        }

        // Meta row stagger
        if (meta.length) {
          gsap.from(meta, {
            y: 18,
            opacity: 0,
            duration: 0.7,
            stagger: 0.07,
            ease: "power3.out",
            scrollTrigger: { trigger: item, start: "top 82%" },
          });
        }

        // Vertical line grows
        if (line) {
          gsap.fromTo(
            line,
            { scaleY: 0 },
            {
              scaleY: 1,
              transformOrigin: "top",
              duration: 1.0,
              ease: "power2.out",
              scrollTrigger: { trigger: item, start: "top 82%" },
            },
          );
        }

        // Background giant kanji scales in
        if (kanjiBig) {
          gsap.fromTo(
            kanjiBig,
            { scale: 0.5, opacity: 0, rotate: i % 2 === 0 ? -6 : 6 },
            {
              scale: 1,
              opacity: 1,
              rotate: 0,
              duration: 1.4,
              ease: "expo.out",
              scrollTrigger: { trigger: item, start: "top 78%" },
            },
          );
          gsap.to(kanjiBig, {
            yPercent: -10,
            ease: "none",
            scrollTrigger: {
              trigger: item,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.5,
            },
          });
        }

        // Number counter (00 → NN)
        if (counter) {
          const target = i + 2;
          const obj = { val: 0 };
          gsap.to(obj, {
            val: target,
            duration: 1.4,
            ease: "power2.out",
            scrollTrigger: { trigger: item, start: "top 80%" },
            onUpdate: () => {
              counter.textContent = String(Math.floor(obj.val)).padStart(2, "0");
            },
          });
        }
      });

      // Cleanup all SplitText instances
      return () => {
        splits.forEach((s) => s.revert());
      };
    },
    { scope: root },
  );

  if (!opening) return null;

  return (
    <div ref={root} className="stories-track">
      {/* ===== Opening — large editorial feature ===== */}
      <section className="opening-scene story-item relative bg-paper">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0B1A2E]/15 to-transparent"
        />

        {/* Oversized background kanji (typography as art) */}
        <span
          aria-hidden
          className="opening-kanji pointer-events-none absolute -left-8 top-[8%] z-0 select-none font-serif text-[clamp(180px,26vw,400px)] leading-none text-[#0B1A2E]/[0.05] md:-left-16"
        >
          {KANJI[0]}
        </span>

        <article className="relative z-10 mx-auto grid max-w-[1480px] grid-cols-1 items-stretch gap-0 lg:grid-cols-[1.2fr_1fr]">
          {/* Image */}
          <div className="relative min-h-[460px] overflow-hidden md:min-h-[720px]">
            <div
              className="opening-image-clip absolute inset-0"
              style={{ clipPath: "inset(0% 0% 0% 0%)" }}
            >
              <div className="opening-image-inner absolute inset-[-10%]">
                <Image
                  src={opening.image}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className={`fujisan-grade object-cover ${opening.position}`}
                />
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0B1A2E]/45 via-transparent to-transparent"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.18]"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/></svg>\")",
                }}
              />
              <div className="absolute left-7 top-7 flex items-baseline gap-3 text-paper/95">
                <span className="font-serif text-[48px] leading-none">
                  {KANJI[0]}
                </span>
                <span className="text-[10px] font-semibold tracking-[0.34em]">
                  CHAPTER 01
                </span>
              </div>
            </div>
          </div>

          {/* Text panel */}
          <div className="relative flex flex-col justify-center gap-7 bg-[#F1E6CB] px-7 py-24 sm:px-12 md:px-16 md:py-32">
            <div
              aria-hidden
              className="story-line absolute left-7 top-16 hidden h-[calc(100%-8rem)] w-px bg-[#C9A84C]/55 sm:left-12 md:block"
            />

            <div className="opening-meta flex flex-col gap-7">
              <div className="flex items-center gap-3 md:pl-7">
                <span className="font-serif text-[14px] leading-none text-[#C9A84C]">
                  {KANJI[0]}
                </span>
                <span className="h-px w-9 bg-[#C9A84C]/55" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#0B1A2E]/65">
                  <L en={opening.eyebrow} ja={opening.eyebrowJp} />
                </span>
              </div>

              <h2
                className="opening-title font-serif text-[clamp(32px,4.4vw,56px)] font-semibold leading-[1.08] tracking-[0.03em] text-[#0B1A2E] md:pl-7"
              >
                <L en={opening.title} ja={opening.jp} />
              </h2>

              <p className="i18n-en font-jp text-[12.5px] tracking-[0.28em] text-[#C9A84C]/85 md:pl-7">
                {opening.jp}
              </p>

              <p className="max-w-[580px] text-[14.5px] leading-[1.95] text-[#2B2419]/82 md:pl-7 md:text-[15px]">
                <L en={opening.excerpt} ja={opening.excerptJp} />
              </p>

              {opening.href && (
                <Link
                  href={opening.href}
                  className="group/read mt-2 inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E] no-underline md:pl-7"
                >
                  <span className="relative pb-1">
                    <L
                      en={opening.ctaEn ?? "READ THE FULL STORY"}
                      ja={opening.ctaJp ?? "続きを読む"}
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
            </div>
          </div>
        </article>
      </section>

      {/* ===== Alternating chapters ===== */}
      <section className="relative bg-[#FBF7EE]">
        <div className="mx-auto max-w-[1280px] px-7 pb-32 pt-28 md:px-12 md:pb-44 md:pt-36">
          <div className="section-eyebrow flex items-center gap-3">
            <span className="font-serif text-[11px] tracking-[0.3em] text-[#C9A84C]">
              覚え書き
            </span>
            <span className="h-px w-10 bg-[#C9A84C]/55" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#0B1A2E]/60">
              MORE NOTES
            </span>
          </div>

          <h2 className="section-title mt-6 max-w-[820px] font-serif text-[clamp(28px,3.4vw,46px)] font-semibold leading-[1.12] tracking-[0.04em] text-[#0B1A2E]">
            <L
              en="A few more, from around the kura"
              ja="蔵のまわりから、もう少し"
            />
          </h2>

          <div className="mt-24 flex flex-col gap-28 md:mt-32 md:gap-40">
            {rest.map((story, i) => {
              const imageRight = i % 2 === 1;
              const kanji = KANJI[i + 1];
              const wideImage = i === 0 || i === 3;
              return (
                <article
                  key={story.title}
                  className="story-item is-alt group/item relative grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-20"
                >
                  {/* Giant background kanji */}
                  <span
                    aria-hidden
                    className={`story-kanji-big pointer-events-none absolute z-0 select-none font-serif text-[clamp(160px,22vw,340px)] leading-none text-[#0B1A2E]/[0.05] ${
                      imageRight
                        ? "right-[-2vw] top-[-6%]"
                        : "left-[-2vw] top-[-6%]"
                    }`}
                  >
                    {kanji}
                  </span>

                  {/* Image */}
                  <div
                    className={`relative z-10 overflow-hidden ${
                      wideImage
                        ? "aspect-[4/3] lg:col-span-7"
                        : "aspect-[5/4] lg:col-span-6"
                    } ${imageRight ? "lg:order-2 lg:col-start-6" : ""}`}
                  >
                    <div
                      className="story-image-clip absolute inset-0"
                      style={{ clipPath: "inset(0% 0% 0% 0%)" }}
                    >
                      <div className="story-image-inner absolute inset-[-10%]">
                        <Image
                          src={story.image}
                          alt=""
                          fill
                          sizes={
                            wideImage
                              ? "(min-width: 1024px) 56vw, 92vw"
                              : "(min-width: 1024px) 48vw, 92vw"
                          }
                          className={`fujisan-grade object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/item:scale-[1.04] ${story.position}`}
                        />
                      </div>
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0B1A2E]/30 via-transparent to-transparent"
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.16]"
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/></svg>\")",
                        }}
                      />
                      <div className="absolute left-5 top-5 flex items-baseline gap-2 text-paper/92">
                        <span className="font-serif text-[32px] leading-none">
                          {kanji}
                        </span>
                        <span className="story-counter font-serif text-[11px] tracking-[0.32em]">
                          00
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Text */}
                  <div
                    className={`relative z-10 lg:col-span-5 ${
                      imageRight
                        ? "lg:order-1 lg:col-start-1 lg:pr-10"
                        : "lg:pl-10"
                    }`}
                  >
                    <div
                      aria-hidden
                      className={`story-line absolute top-0 hidden h-full w-px bg-[#C9A84C]/55 md:block ${
                        imageRight ? "right-0" : "left-0"
                      }`}
                    />

                    <div className="story-meta flex items-center gap-3 md:px-7">
                      <span className="font-serif text-[13px] leading-none text-[#C9A84C]">
                        {kanji}
                      </span>
                      <span className="h-px w-7 bg-[#C9A84C]/50" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#0B1A2E]/55">
                        <L en={story.eyebrow} ja={story.eyebrowJp} />
                      </span>
                    </div>

                    <h3
                      className={`story-title mt-6 font-serif text-[clamp(26px,2.8vw,38px)] font-semibold leading-[1.16] tracking-[0.03em] text-[#0B1A2E] md:px-7`}
                    >
                      <L en={story.title} ja={story.jp} />
                    </h3>
                    <p
                      className={`i18n-en mt-3 font-jp text-[11.5px] tracking-[0.24em] text-[#C9A84C]/80 md:px-7`}
                    >
                      {story.jp}
                    </p>

                    <p
                      className={`story-excerpt mt-6 max-w-[540px] text-[14px] leading-[1.95] text-[#1D2432]/82 md:px-7 md:text-[14.5px]`}
                    >
                      <L en={story.excerpt} ja={story.excerptJp} />
                    </p>

                    {story.href && (
                      <Link
                        href={story.href}
                        className={`group/read mt-9 inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E] no-underline md:px-7`}
                      >
                        <span className="relative pb-1">
                          <L
                            en={story.ctaEn ?? "READ STORY"}
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
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
