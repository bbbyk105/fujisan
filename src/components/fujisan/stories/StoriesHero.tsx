"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { L } from "@/i18n/Localized";
import { ensureGsap, gsap, SplitText, useGSAP } from "./gsap-setup";

ensureGsap();

type Crumb = { label: ReactNode; href: string };

type Props = {
  eyebrow: ReactNode;
  chapter: string;
  titleEn: string;
  titleJp: string;
  jp: string;
  lead: ReactNode;
  crumbs: Crumb[];
  bgSrc?: string;
  bgPosition?: string;
};

/**
 * /stories の Hero。
 * - SplitText で英文タイトルを 1 文字ずつ、yPercent + rotate でせり上げ
 * - 日本語タイトルは 1 文字ずつ縦書きで stagger
 * - 富士山背景: clip-path で下から立ち上がる + 雲が横スクロール + 長押しで parallax
 * - カーソル追従の柔らかいスポット（パフォーマンスのため quickTo を使用）
 * - スクロールキューは縦線が伸び縮みする loop
 */
export function StoriesHero({
  eyebrow,
  chapter,
  titleEn,
  titleJp,
  jp,
  lead,
  crumbs,
  bgSrc = "/images/fujisan/hero/mtfuji.png",
  bgPosition = "object-[50%_46%]",
}: Props) {
  const root = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      // ----- Split English title (chars within words) -----
      const titleEl = root.current?.querySelector<HTMLElement>(
        ".hero-title-en",
      );
      let split: SplitText | null = null;
      if (titleEl) {
        split = new SplitText(titleEl, {
          type: "chars,words",
          charsClass: "char-en",
          wordsClass: "word-en",
        });
      }

      // ----- Master timeline -----
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay: 0.1,
      });

      if (reduce) {
        // No motion: just make sure everything is visible
        gsap.set(
          [
            ".hero-bg-image",
            ".char-en",
            ".jp-char",
            ".hero-eyebrow > *",
            ".hero-crumb",
            ".hero-jp",
            ".hero-lead",
            ".hero-scroll-cue",
            ".hero-meta",
          ],
          { y: 0, opacity: 1, clipPath: "inset(0% 0% 0% 0%)" },
        );
      } else {
        // BG: clip-path bottom→top wipe + slow scale-out
        gsap.set(".hero-bg-image", {
          clipPath: "inset(100% 0% 0% 0%)",
          scale: 1.14,
        });
        tl.to(
          ".hero-bg-image",
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.6,
            ease: "power4.out",
          },
          0,
        ).to(
          ".hero-bg-image",
          { scale: 1, duration: 2.2, ease: "power2.out" },
          0,
        );

        // Crumbs
        tl.from(
          ".hero-crumb",
          { y: 12, opacity: 0, duration: 0.5, stagger: 0.05 },
          0.1,
        );

        // Eyebrow (chapter + line + label)
        tl.from(
          ".hero-eyebrow > *",
          { y: 18, opacity: 0, duration: 0.7, stagger: 0.07 },
          0.25,
        );

        // English title — char-by-char with slight rotate
        if (split?.chars?.length) {
          tl.from(
            split.chars,
            {
              yPercent: 140,
              rotate: 5,
              opacity: 0,
              duration: 1.0,
              stagger: 0.025,
              ease: "power4.out",
            },
            0.35,
          );
        }

        // Japanese title — vertical char stagger
        tl.from(
          ".jp-char",
          {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.07,
            ease: "power3.out",
          },
          0.55,
        );

        tl.from(".hero-jp", { y: 18, opacity: 0, duration: 0.7 }, 0.95)
          .from(".hero-lead", { y: 22, opacity: 0, duration: 0.8 }, 1.05)
          .from(".hero-meta > *", { y: 14, opacity: 0, duration: 0.6, stagger: 0.08 }, 1.2);

        // Scroll cue: looping pulse
        gsap.fromTo(
          ".scroll-cue-bar",
          { scaleY: 0.3, transformOrigin: "top" },
          {
            scaleY: 1,
            duration: 1.4,
            ease: "power2.inOut",
            repeat: -1,
            yoyo: true,
          },
        );
        gsap.from(".hero-scroll-cue", { opacity: 0, duration: 0.8, delay: 1.4 });

        // Parallax on scroll
        gsap.to(".hero-bg-image", {
          yPercent: 18,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.4,
          },
        });
        gsap.to(".hero-text-stack", {
          yPercent: -22,
          opacity: 0.7,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.4,
          },
        });

        // Cursor spotlight (quickTo for 60fps performance)
        const spot = root.current?.querySelector<HTMLElement>(".hero-spotlight");
        if (spot) {
          const xTo = gsap.quickTo(spot, "x", { duration: 0.5, ease: "power3" });
          const yTo = gsap.quickTo(spot, "y", { duration: 0.5, ease: "power3" });
          const onMove = (e: PointerEvent) => {
            const rect = root.current!.getBoundingClientRect();
            xTo(e.clientX - rect.left);
            yTo(e.clientY - rect.top);
          };
          root.current?.addEventListener("pointermove", onMove);
          return () => {
            root.current?.removeEventListener("pointermove", onMove);
            split?.revert();
          };
        }
      }

      return () => {
        split?.revert();
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="fujisan-paper relative isolate overflow-hidden bg-[#FAF5E8] pt-[86px] text-[#0B1A2E]"
    >
      {/* Background layer */}
      <div className="absolute inset-x-0 top-[86px] z-0 h-[680px] overflow-hidden md:h-[760px]">
        <div className="hero-bg-image absolute inset-0 will-change-transform">
          <Image
            src={bgSrc}
            alt=""
            fill
            priority
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className={`object-cover ${bgPosition}`}
          />
        </div>
        <div className="absolute inset-0 bg-linear-to-r from-[#FAF2E4]/94 via-[#FAF2E4]/40 to-[#DCE6EE]/8" />
        <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-[#F9EFE0]/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[260px] bg-linear-to-b from-transparent via-[#FAF5E8]/74 to-[#FAF5E8]" />

        {/* grain */}
        <div
          aria-hidden
          className="absolute inset-0 mix-blend-overlay opacity-[0.10]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.7'/></svg>\")",
          }}
        />

        {/* Cursor spotlight */}
        <div
          aria-hidden
          className="hero-spotlight pointer-events-none absolute -left-[200px] -top-[200px] h-[400px] w-[400px] rounded-full opacity-50 mix-blend-screen"
          style={{
            background:
              "radial-gradient(circle, rgba(226,201,126,0.35) 0%, rgba(226,201,126,0) 70%)",
            filter: "blur(20px)",
          }}
        />
      </div>

      {/* Giant background kanji (oversized typography) */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 top-[180px] z-0 select-none font-serif text-[clamp(220px,30vw,440px)] leading-none text-[#0B1A2E]/[0.04] md:-right-24"
      >
        物語
      </span>

      <div className="relative z-10 mx-auto max-w-[1440px] px-7 pb-32 pt-12 sm:px-8 md:px-12 md:pb-44 md:pt-24">
        {/* Crumbs */}
        {crumbs.length > 0 && (
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
        )}

        <div className="hero-text-stack mt-10 flex max-w-[920px] flex-col gap-5 will-change-transform">
          {/* Eyebrow */}
          <div className="hero-eyebrow flex items-center gap-4">
            <span className="font-serif text-[11px] font-medium tracking-[0.36em] text-[#C9A84C]">
              {chapter}
            </span>
            <span className="h-px w-12 bg-[#C9A84C]/55" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#C9A84C]">
              {eyebrow}
            </span>
          </div>

          {/* Title — bilingual */}
          <h1
            aria-label={titleEn}
            className="font-serif text-[clamp(44px,7vw,108px)] font-semibold leading-[0.96] tracking-[0.02em] text-[#0B1A2E]"
          >
            {/* English: SplitText animates .char-en within */}
            <span className="i18n-fragment i18n-en hero-title-en block">
              {titleEn}
            </span>
            {/* Japanese: manually split into chars */}
            <span className="i18n-fragment i18n-ja block">
              {[...titleJp].map((c, i) => (
                <span
                  key={`${c}-${i}`}
                  className="jp-char inline-block"
                >
                  {c}
                </span>
              ))}
            </span>
          </h1>

          <p className="hero-jp font-jp text-[13px] tracking-[0.32em] text-[#C9A84C]/90">
            {jp}
          </p>

          <p className="hero-lead mt-4 max-w-[640px] text-[14.5px] font-light leading-[1.85] text-[#2B2419]/82 md:text-[16px]">
            {lead}
          </p>

          {/* Meta row — chapter count + scroll cue */}
          <div className="hero-meta mt-10 flex flex-wrap items-end gap-x-12 gap-y-6">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#0B1A2E]/55">
                CHAPTERS
              </span>
              <span className="font-serif text-[28px] leading-none text-[#0B1A2E]">
                06
              </span>
              <span className="text-[11px] tracking-[0.3em] text-[#0B1A2E]/40">
                / 六章
              </span>
            </div>

            <div className="hero-scroll-cue flex items-center gap-3">
              <span className="flex h-12 w-px overflow-hidden bg-[#0B1A2E]/15">
                <span className="scroll-cue-bar inline-block h-full w-full bg-[#C9A84C]" />
              </span>
              <span className="text-[10px] font-semibold tracking-[0.34em] text-[#0B1A2E]/60">
                <L en="SCROLL" ja="スクロール" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
