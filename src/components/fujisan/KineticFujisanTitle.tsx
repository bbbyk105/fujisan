"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CHARS = "FUJISAN".split("");

/** 稜線の輪郭に沿った文字ごとの上昇量（山頂 = 中央の I）。px */
const RIDGE_OFFSETS = [0, -10, -22, -32, -22, -12, -4];

/**
 * ヒーローの FUJISAN 見出し。
 * スクロールに応じて 1 文字ずつ稜線の輪郭を描いて持ち上がる
 * （シグネチャー = 稜線をタイポグラフィでも反復する）。
 * transform のみ（compositor-only）・scrub なので操作は奪わない。
 */
export function KineticFujisanTitle() {
  const root = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(".kinetic-char", {
          y: (i: number) => RIDGE_OFFSETS[i],
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top 32%",
            end: "top -35%",
            scrub: 0.6,
          },
        });
      });
    },
    { scope: root },
  );

  return (
    <span
      ref={root}
      role="text"
      aria-label="FUJISAN"
      className="fujisan-rise-lcp mt-4 block font-serif text-[clamp(66px,10vw,150px)] font-semibold leading-[0.9] tracking-[0.04em]"
      style={{ animationDelay: "420ms" }}
    >
      {CHARS.map((c, i) => (
        <span key={i} aria-hidden className="kinetic-char inline-block">
          {c}
        </span>
      ))}
    </span>
  );
}
