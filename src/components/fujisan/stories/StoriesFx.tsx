"use client";

import { ensureGsap, gsap, ScrollTrigger, useGSAP } from "./gsap-setup";

ensureGsap();

/**
 * /stories の演出をすべて担う唯一の Client Component（DOM は出力しない）。
 *
 * マークアップは Server Component（StoriesHero / StoriesNarrative /
 * StoriesProgress / StoriesClosing）が SSR し、このコンポーネントが
 * hydration 後に className を対象へアニメーションを重ねる。
 * useGSAP の context がアンマウント時に tween / ScrollTrigger を自動掃除する。
 *
 * 演出の原則:
 *  - 画像はリビール演出なし。緩い parallax だけ
 *  - 題は文字単位のせり上げ、本文はカードごと一度だけ立ち上がる
 *  - reduced-motion 時はモーションを一切足さない（SSR マークアップが常に可視）
 */
export function StoriesFx() {
  useGSAP(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const track = document.querySelector(".stories-page");
    if (!track) return;

    // ===== 進捗バー + 章インデックス（モーション設定に関わらず機能させる） =====
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

    if (reduce) return;

    // ===== 序（Hero） =====
    const hero = document.querySelector<HTMLElement>(".stories-hero");
    if (hero) {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay: 0.1,
      });

      // 背景 — スケールがゆっくり収まるだけ（LCP のため opacity/クリップは動かさない）
      gsap.set(".hero-bg-image", { scale: 1.12 });
      tl.to(".hero-bg-image", { scale: 1, duration: 2.4, ease: "power2.out" }, 0);

      tl.from(
        ".hero-crumb",
        { y: 10, opacity: 0, duration: 0.5, stagger: 0.05 },
        0.15,
      );

      // タイトル — 縦書き（ja）は上から順に、横組み（en）はマスク下からせり上げ
      tl.from(
        ".hero-char",
        { y: 22, opacity: 0, duration: 0.9, stagger: 0.07, ease: "power4.out" },
        0.4,
      );
      tl.from(
        ".hero-word",
        { yPercent: 118, duration: 1.0, stagger: 0.08, ease: "power4.out" },
        0.4,
      );

      tl.from(".hero-eyebrow > *", { y: 14, opacity: 0, duration: 0.6, stagger: 0.06 }, 0.7)
        .from(".hero-lead", { y: 18, opacity: 0, duration: 0.8 }, 0.85)
        .from(
          ".hero-toc a",
          { y: 14, opacity: 0, duration: 0.6, stagger: 0.06 },
          1.0,
        );

      tl.timeScale(1.25);

      // スクロール parallax
      gsap.to(".hero-bg-image", {
        yPercent: 16,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.4,
        },
      });
      gsap.to(".hero-text-stack", {
        yPercent: -14,
        opacity: 0.65,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.4,
        },
      });

      // 進捗レールの登場
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
    }

    // ===== 巻の見出し =====
    gsap.utils.toArray<HTMLElement>(".part-marker").forEach((marker) => {
      const line = marker.querySelector(".part-line");
      if (line) {
        gsap.fromTo(
          line,
          { scaleY: 0 },
          {
            scaleY: 1,
            transformOrigin: "top",
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: { trigger: marker, start: "top 80%" },
          },
        );
      }
      gsap.from(marker.querySelectorAll(".part-body > *"), {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.09,
        delay: 0.15,
        ease: "power3.out",
        scrollTrigger: { trigger: marker, start: "top 80%" },
      });
    });

    // ===== 各章 =====
    items.forEach((item) => {
      const inner = item.querySelector(".story-image-inner");
      const card = item.querySelector(".story-card");
      const chars = item.querySelectorAll(".story-char");
      const meta = item.querySelectorAll(".story-meta > *");
      const ghost = item.querySelector(".ghost-kanji");

      // 画像はリビール演出を持たない。緩い parallax だけで見せる
      if (inner) {
        gsap.fromTo(
          inner,
          { yPercent: 6, scale: 1.06 },
          {
            yPercent: -6,
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

      if (card) {
        gsap.from(card, {
          y: 44,
          opacity: 0,
          duration: 1.0,
          ease: "power3.out",
          scrollTrigger: { trigger: item, start: "top 74%" },
        });
      }

      if (meta.length) {
        gsap.from(meta, {
          y: 14,
          opacity: 0,
          duration: 0.6,
          stagger: 0.06,
          delay: 0.25,
          ease: "power3.out",
          scrollTrigger: { trigger: item, start: "top 74%" },
        });
      }

      if (chars.length) {
        gsap.from(chars, {
          y: 26,
          opacity: 0,
          duration: 0.8,
          stagger: 0.045,
          delay: 0.3,
          ease: "power4.out",
          scrollTrigger: { trigger: item, start: "top 74%" },
        });
      }

      // ゴースト漢字 — 奥でゆっくり逆方向に流れる
      if (ghost) {
        gsap.from(ghost, {
          opacity: 0,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: { trigger: item, start: "top 70%" },
        });
        gsap.fromTo(
          ghost,
          { yPercent: 10 },
          {
            yPercent: -10,
            ease: "none",
            scrollTrigger: {
              trigger: item,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
            },
          },
        );
      }
    });

    // ===== 結（Closing） =====
    const closing = document.querySelector<HTMLElement>(".stories-closing");
    if (closing) {
      gsap.from(".closing-eyebrow > *", {
        y: 14,
        opacity: 0,
        duration: 0.7,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: { trigger: closing, start: "top 80%" },
      });

      gsap.from(".closing-title", {
        y: 34,
        opacity: 0,
        duration: 1.0,
        ease: "power4.out",
        scrollTrigger: { trigger: closing, start: "top 78%" },
      });

      gsap.fromTo(
        ".closing-underline",
        { scaleX: 0, transformOrigin: "left center" },
        {
          scaleX: 1,
          duration: 1.4,
          ease: "power3.out",
          scrollTrigger: { trigger: closing, start: "top 70%" },
        },
      );

      gsap.from(".closing-lead", {
        y: 22,
        opacity: 0,
        duration: 0.9,
        delay: 0.2,
        ease: "power3.out",
        scrollTrigger: { trigger: closing, start: "top 78%" },
      });

      gsap.from(".closing-cta", {
        y: 18,
        opacity: 0,
        duration: 0.8,
        delay: 0.3,
        ease: "power3.out",
        scrollTrigger: { trigger: closing, start: "top 75%" },
      });

      // 背景のゆらぎ — transform（compositor-only）で動かす
      gsap.to(".closing-bg-drift", {
        yPercent: -50,
        duration: 18,
        ease: "none",
        repeat: -1,
        yoyo: true,
      });
    }
  });

  return null;
}
