"use client";

import { ensureGsap, gsap, useGSAP } from "./stories/gsap-setup";

ensureGsap();

/** 稜線の輪郭に沿った文字ごとの上昇量（山頂 = 中央の I）。px */
const RIDGE_OFFSETS = [0, -10, -22, -32, -22, -12, -4];

/**
 * トップページ hero の演出をすべて担う唯一の Client Component（DOM は出力しない）。
 * マークアップは Server Component（KineticFujisanTitle / FujisanHeroShowcase）が
 * SSR し、hydration 後にここから演出を重ねる。
 *
 * - FUJISAN 見出し: スクロール scrub で 1 文字ずつ稜線を描いて持ち上がる
 *   （transform のみ = compositor-only なので操作は奪わない）
 * - ボトル: 下方からぼかしを伴って立ち上がり、傾きを戻しながら整列 →
 *   最後に一拍浮いて落ち着く（マークアップ側は opacity-0 で始まる）
 */
export function FujisanHeroFx() {
  useGSAP(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // ----- ボトルの出現演出 -----
    const bottles = gsap.utils.toArray<HTMLElement>("[data-hero-bottle]");
    const shadows = gsap.utils.toArray<HTMLElement>("[data-hero-shadow]");
    if (bottles.length) {
      if (reduced) {
        gsap.set([...bottles, ...shadows], { opacity: 1 });
      } else {
        gsap.set(bottles, {
          opacity: 0,
          y: 64,
          scale: 0.96,
          rotate: (i: number) => (i % 2 === 0 ? -2.2 : 2.2),
          filter: "blur(8px)",
          transformOrigin: "50% 100%",
        });
        gsap.set(shadows, { opacity: 0 });

        const tl = gsap.timeline({
          delay: 0.7,
          defaults: { ease: "power3.out" },
        });
        tl.to(bottles, {
          opacity: 1,
          y: 0,
          scale: 1,
          rotate: 0,
          filter: "blur(0px)",
          duration: 1.3,
          stagger: 0.13,
        })
          .to(
            shadows,
            { opacity: 1, duration: 0.8, stagger: 0.13, ease: "power2.out" },
            0.3,
          )
          .to(
            bottles,
            { y: -7, duration: 0.55, ease: "sine.inOut", stagger: 0.07 },
            "-=0.3",
          )
          .to(
            bottles,
            { y: 0, duration: 0.75, ease: "sine.inOut", stagger: 0.07 },
            "-=0.1",
          );
      }
    }

    // ----- FUJISAN 見出しの稜線スクラブ -----
    const title = document.querySelector<HTMLElement>(".kinetic-title");
    if (title && !reduced) {
      gsap.to(".kinetic-char", {
        y: (i: number) => RIDGE_OFFSETS[i],
        ease: "none",
        scrollTrigger: {
          trigger: title,
          start: "top 32%",
          end: "top -35%",
          scrub: 0.6,
        },
      });
    }
  });

  return null;
}
