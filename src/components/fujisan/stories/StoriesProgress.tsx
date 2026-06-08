"use client";

import { useRef } from "react";
import { ensureGsap, gsap, ScrollTrigger, useGSAP } from "./gsap-setup";

ensureGsap();

type Props = {
  /** スクロールトラックの基準にする要素の querySelector */
  trackSelector: string;
  /** チャプター数（DOTは N+1 = opening 含む） */
  chapterCount: number;
};

/**
 * 上端の進捗バー（金色1pxライン）と右側のチャプタードット。
 * - 進捗バー: ページ全体の scroll に scrub で追従
 * - ドット: 各 .story-item のビュー入退場で active を付け外し
 */
export function StoriesProgress({ trackSelector, chapterCount }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const track = document.querySelector(trackSelector);
      if (!track) return;

      // 進捗バー
      gsap.fromTo(
        ".progress-fill",
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          transformOrigin: "left center",
          scrollTrigger: {
            trigger: track,
            start: "top top",
            end: "bottom bottom",
            scrub: reduce ? false : 0.3,
          },
        },
      );

      // チャプタードットの active 切替（クラスを付け外し）
      const items = gsap.utils.toArray<HTMLElement>(".story-item");
      const dots = gsap.utils.toArray<HTMLElement>(".chapter-dot");
      items.forEach((item, i) => {
        ScrollTrigger.create({
          trigger: item,
          start: "top 55%",
          end: "bottom 45%",
          onToggle: (self) => {
            if (self.isActive) {
              dots.forEach((d, j) => {
                d.classList.toggle("is-active", j === i);
              });
            }
          },
        });
      });

      // ロード時の登場
      gsap.from(".progress-rail", {
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.3,
      });
      gsap.from(".chapter-index", {
        x: 18,
        opacity: 0,
        duration: 0.8,
        delay: 0.5,
        ease: "power3.out",
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden>
      {/* top progress bar */}
      <div className="progress-rail pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] bg-[#0B1A2E]/8">
        <div className="progress-fill h-full w-full bg-linear-to-r from-[#C9A84C] via-[#E2C97E] to-[#C9A84C]" />
      </div>

      {/* right-side chapter dots */}
      <div className="chapter-index pointer-events-none fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-end gap-3 md:flex">
        {Array.from({ length: chapterCount }).map((_, i) => (
          <span
            key={i}
            className="chapter-dot group/dot relative flex h-2 items-center justify-end gap-2 transition-all duration-500"
          >
            <span className="dot-label font-serif text-[10px] tracking-[0.34em] text-[#0B1A2E]/0 transition-all duration-500">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="dot-circle h-[6px] w-[6px] rounded-full bg-[#0B1A2E]/25 transition-all duration-500" />
          </span>
        ))}
      </div>

      <style>{`
        .chapter-dot.is-active .dot-circle {
          width: 22px;
          background: #C9A84C;
        }
        .chapter-dot.is-active .dot-label {
          color: rgba(11,26,46,0.7);
        }
      `}</style>
    </div>
  );
}
