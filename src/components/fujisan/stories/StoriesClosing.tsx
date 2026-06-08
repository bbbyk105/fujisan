"use client";

import Link from "next/link";
import { useRef } from "react";
import { L } from "@/i18n/Localized";
import { ensureGsap, gsap, SplitText, useGSAP } from "./gsap-setup";

ensureGsap();

/**
 * 暮れ際の CTA セクション。
 * - 見出しを SplitText で 1 行ずつせり上げ
 * - 金色のゴールデンライン（左→右）が文字下を走る
 * - CTA はマグネット効果（カーソル位置に向かって 0.3s で寄る）
 * - 背景にゆっくり流れる縦のグラデ
 */
export function StoriesClosing() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const splits: SplitText[] = [];

      if (reduce) return;

      const title = root.current?.querySelector<HTMLElement>(".closing-title");
      if (title) {
        const sp = new SplitText(title, {
          type: "lines,words",
        });
        splits.push(sp);
        gsap.set(title, { perspective: 600 });
        gsap.from(sp.lines, {
          yPercent: 110,
          opacity: 0,
          rotateX: -20,
          duration: 1.1,
          stagger: 0.1,
          ease: "power4.out",
          scrollTrigger: { trigger: root.current!, start: "top 78%" },
        });
      }

      gsap.from(".closing-eyebrow", {
        y: 18,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current!, start: "top 80%" },
      });

      gsap.from(".closing-lead", {
        y: 24,
        opacity: 0,
        duration: 0.9,
        delay: 0.2,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current!, start: "top 78%" },
      });

      // Golden underline sweep
      gsap.fromTo(
        ".closing-underline",
        { scaleX: 0, transformOrigin: "left center" },
        {
          scaleX: 1,
          duration: 1.4,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current!, start: "top 70%" },
        },
      );

      // Background gradient drift
      gsap.to(".closing-bg-drift", {
        backgroundPosition: "0% 100%",
        duration: 18,
        ease: "none",
        repeat: -1,
        yoyo: true,
      });

      // Magnetic CTA
      const cta = root.current?.querySelector<HTMLElement>(".closing-cta");
      if (cta) {
        const xTo = gsap.quickTo(cta, "x", { duration: 0.4, ease: "power3" });
        const yTo = gsap.quickTo(cta, "y", { duration: 0.4, ease: "power3" });
        const onMove = (e: PointerEvent) => {
          const rect = cta.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = (e.clientX - cx) * 0.25;
          const dy = (e.clientY - cy) * 0.25;
          xTo(dx);
          yTo(dy);
        };
        const onLeave = () => {
          xTo(0);
          yTo(0);
        };
        cta.addEventListener("pointermove", onMove);
        cta.addEventListener("pointerleave", onLeave);
        return () => {
          cta.removeEventListener("pointermove", onMove);
          cta.removeEventListener("pointerleave", onLeave);
          splits.forEach((s) => s.revert());
        };
      }

      return () => {
        splits.forEach((s) => s.revert());
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative overflow-hidden bg-[#0F1D30] text-[#F2E4C7]"
    >
      <div
        aria-hidden
        className="closing-bg-drift pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(215,180,106,0.10) 0%, rgba(15,29,48,0) 35%, rgba(15,29,48,0) 65%, rgba(215,180,106,0.10) 100%)",
          backgroundSize: "100% 200%",
          backgroundPosition: "0% 0%",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#D7B46A]/40 to-transparent"
      />

      {/* Oversized background kanji */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-12 bottom-[-40px] z-0 select-none font-serif text-[clamp(200px,28vw,420px)] leading-none text-[#F2E4C7]/[0.05]"
      >
        宵
      </span>

      <div className="relative z-10 mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-10 px-7 py-24 md:flex-row md:items-end md:px-12 md:py-28">
        <div className="max-w-[600px]">
          <p className="closing-eyebrow font-jp text-[12px] tracking-[0.32em] text-[#D7B46A]/85">
            ― 今宵の一本 ―
          </p>
          <h2 className="closing-title mt-5 font-serif text-[clamp(28px,3.4vw,46px)] font-semibold leading-[1.12] tracking-[0.04em] text-[#F2E4C7]">
            <L en="Find the bottle for tonight." ja="今宵の一本を、選ぶ。" />
          </h2>
          <span
            aria-hidden
            className="closing-underline mt-5 block h-px w-32 bg-linear-to-r from-[#D7B46A] to-transparent"
          />
          <p className="closing-lead mt-7 max-w-[520px] text-[13.5px] leading-[1.9] text-[#F2E4C7]/78">
            <L
              en="Five labels, each with its own character — from crisp and dry to round and slightly sweet. Pick the one that fits the evening."
              ja="五つの銘柄、それぞれに個性があります。きりりと辛口のものから、ふくよかでやや甘口のものまで。今宵に合う一本をどうぞ。"
            />
          </p>
        </div>

        <Link
          href="/shop/personal"
          className="closing-cta group/link relative inline-flex items-center gap-3 border border-[#D7B46A]/35 bg-[#D7B46A]/[0.06] px-8 py-5 text-[10.5px] font-semibold tracking-[0.34em] text-[#F2E4C7] no-underline transition-colors hover:border-[#D7B46A] hover:bg-[#D7B46A]/12"
        >
          <span className="relative">
            <L en="VIEW THE COLLECTION" ja="コレクションを見る" />
          </span>
          <span
            aria-hidden
            className="transition-transform duration-500 group-hover/link:translate-x-1 group-hover/link:text-[#D7B46A]"
          >
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
