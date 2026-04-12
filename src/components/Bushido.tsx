"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { useReveal } from "@/hooks/useReveal";
import { bushidoDesigns } from "@/data/bushido-data";

function useScrollY() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrollY;
}

export default function Bushido() {
  const ref = useReveal<HTMLElement>();
  const heroRef = useRef<HTMLDivElement>(null);
  const scrollY = useScrollY();
  const [currentImage, setCurrentImage] = useState(0);
  const [nextImage, setNextImage] = useState(1);
  const [phase, setPhase] = useState<"show" | "crossfade">("show");
  const [hoveredDesign, setHoveredDesign] = useState<number | null>(null);

  const cycleImage = useCallback(() => {
    if (hoveredDesign !== null) return;
    setPhase("crossfade");
    let next: number;
    do {
      next = Math.floor(Math.random() * bushidoDesigns.length);
    } while (next === currentImage);
    setNextImage(next);
    setTimeout(() => {
      setCurrentImage(next);
      setPhase("show");
    }, 1200);
  }, [currentImage, hoveredDesign]);

  useEffect(() => {
    const interval = setInterval(cycleImage, 6000);
    return () => clearInterval(interval);
  }, [cycleImage]);

  const activeDesign = hoveredDesign !== null ? hoveredDesign : currentImage;

  // Parallax for the hero image section
  const heroTop = heroRef.current?.offsetTop ?? 0;
  const parallaxOffset = (scrollY - heroTop) * 0.12;

  return (
    <section id="bushido" ref={ref}>
      {/* ===== FULL BLEED HERO — Dom Perignon style ===== */}
      <div ref={heroRef} className="relative h-screen overflow-hidden bg-ink">
        {/* Full-screen scene image with parallax zoom */}
        <div
          className="absolute inset-0 transition-transform duration-100 ease-linear"
          style={{
            transform: `scale(${1.1 + Math.abs(parallaxOffset) * 0.002}) translateY(${parallaxOffset}px)`,
          }}
        >
          <Image
            src={bushidoDesigns[activeDesign].imageScene}
            alt="Bushido atmosphere"
            fill
            className={`object-cover transition-opacity duration-[1.5s] ease-in-out brightness-[0.35] saturate-[0.8] ${
              phase === "crossfade" ? "opacity-0" : "opacity-100"
            }`}
            sizes="100vw"
            priority
          />
          <Image
            src={bushidoDesigns[nextImage].imageScene}
            alt="Bushido atmosphere next"
            fill
            className={`object-cover transition-opacity duration-[1.5s] ease-in-out brightness-[0.35] saturate-[0.8] ${
              phase === "crossfade" ? "opacity-100" : "opacity-0"
            }`}
            sizes="100vw"
          />
        </div>

        {/* Dark vignette overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,transparent_20%,rgba(14,12,10,0.7)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-transparent to-ink" />

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8">
          <p className="reveal text-[10px] tracking-[8px] uppercase text-gold/60 mb-6">
            The Bushido Edition
          </p>
          <h2 className="reveal d1 font-serif text-[clamp(40px,7vw,90px)] font-light leading-[1.0] mb-4 tracking-[-0.02em]">
            The Spirit of<br />the <em className="italic text-gold-lt/80">Samurai</em>
          </h2>
          <div className="reveal d1 w-[48px] h-px bg-gold/30 mx-auto mb-6" />
          <p className="reveal d2 text-[clamp(13px,1.6vw,16px)] leading-[1.9] text-off-white/50 max-w-[560px] font-light">
            Seven distinct expressions of Bushido — each bottle a different warrior archetype,
            a different chapter of Japan&apos;s timeless code of honor.
          </p>
          <p className="reveal d3 text-[10px] tracking-[5px] uppercase text-gold/40 mt-8">
            300ml · 7 Designs · 純米大吟醸
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <p className="text-[8px] tracking-[4px] uppercase text-off-white/25">Scroll</p>
          <div className="w-px h-10 bg-gradient-to-b from-off-white/20 to-transparent animate-scroll-pulse" />
        </div>
      </div>

      {/* ===== SPLIT SCREEN — Bottle + Grid ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">

        {/* LEFT — Cinematic bottle on black */}
        <div className="relative bg-ink flex items-center justify-center min-h-[70vh] lg:min-h-screen overflow-hidden">
          {/* Spotlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-[60%] bg-[conic-gradient(from_180deg,transparent_36%,rgba(248,245,238,0.04)_48%,rgba(201,168,76,0.03)_50%,rgba(248,245,238,0.04)_52%,transparent_64%)]" />

          {/* Current bottle */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-[1.4s] ease-in-out ${
            phase === "crossfade" ? "opacity-0 scale-[0.97]" : "opacity-100 scale-100"
          }`}>
            <div className="opus-float relative w-[75%] max-w-[380px] aspect-[3/5]">
              <Image
                src={bushidoDesigns[currentImage].image}
                alt={bushidoDesigns[currentImage].name}
                fill
                className="object-contain opus-shadow"
                sizes="(max-width: 1024px) 75vw, 38vw"
                priority
              />
            </div>
          </div>

          {/* Next bottle */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-[1.4s] ease-in-out ${
            phase === "crossfade" ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"
          }`}>
            <div className="opus-float relative w-[75%] max-w-[380px] aspect-[3/5]">
              <Image
                src={bushidoDesigns[nextImage].image}
                alt={bushidoDesigns[nextImage].name}
                fill
                className="object-contain opus-shadow"
                sizes="(max-width: 1024px) 75vw, 38vw"
              />
            </div>
          </div>

          {/* Hovered bottle */}
          {hoveredDesign !== null && (
            <div className="absolute inset-0 flex items-center justify-center z-10 animate-[bottleReveal_0.6s_ease-out_both]">
              <div className="opus-float relative w-[75%] max-w-[380px] aspect-[3/5]">
                <Image
                  src={bushidoDesigns[hoveredDesign].image}
                  alt={bushidoDesigns[hoveredDesign].name}
                  fill
                  className="object-contain opus-shadow"
                  sizes="(max-width: 1024px) 75vw, 38vw"
                />
              </div>
            </div>
          )}

          {/* Floor reflection */}
          <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 w-[45%] h-[12%] bg-[radial-gradient(ellipse,rgba(201,168,76,0.08)_0%,transparent_70%)] blur-[8px] bottle-glow" />

          {/* Active design label */}
          <div className={`absolute bottom-8 left-0 right-0 text-center transition-all duration-700 ${
            phase === "crossfade" && hoveredDesign === null ? "opacity-0" : "opacity-100"
          }`}>
            <p className="text-[9px] tracking-[5px] uppercase text-gold/40">
              Design {bushidoDesigns[activeDesign].letter}
            </p>
            <p className="font-serif text-lg font-light text-off-white/60 mt-1">
              {bushidoDesigns[activeDesign].name.replace("\n", " ")}
            </p>
          </div>
        </div>

        {/* RIGHT — Text + Design grid */}
        <div className="bg-ink2 flex flex-col justify-center px-[clamp(40px,6vw,100px)] py-[clamp(60px,7vw,100px)] border-l border-gold/6">
          <p className="reveal text-[9px] tracking-[6px] uppercase text-gold/50 mb-6">
            The Collection
          </p>
          <div className="reveal d1 w-[32px] h-px bg-gold/25 mb-8" />

          <h3 className="reveal d1 font-serif text-[clamp(28px,3.5vw,44px)] font-light leading-[1.1] mb-6">
            From <em className="italic text-gold-lt/70">White Peak</em><br />to Black Snow
          </h3>

          <p className="reveal d2 text-[clamp(14px,1.6vw,16px)] leading-[1.95] text-off-white/45 max-w-[480px] mb-12">
            From the White Peak to the Black Snow, each design encapsulates a virtue.
            Seven warrior archetypes, seven chapters of Japan&apos;s timeless code.
          </p>

          {/* Design Grid — Dom Perignon editorial grid */}
          <div className="reveal d3 grid grid-cols-4 gap-4">
            {bushidoDesigns.map((d, i) => (
              <Link
                href={`/bushido/${d.slug}`}
                key={d.letter}
                className="group no-underline block"
                onMouseEnter={() => setHoveredDesign(i)}
                onMouseLeave={() => setHoveredDesign(null)}
              >
                <div className="relative aspect-[3/5] overflow-hidden mb-2">
                  <Image
                    src={d.image}
                    alt={d.name}
                    fill
                    className="object-contain scale-[0.8] group-hover:scale-[0.95] transition-all duration-700 opacity-50 group-hover:opacity-100"
                    sizes="100px"
                  />
                </div>
                <div className="text-center">
                  <p className="text-[8px] tracking-[3px] uppercase text-off-white/25 group-hover:text-gold/70 transition-colors duration-500">
                    {d.letter}
                  </p>
                  <p className="text-[7px] tracking-[1px] uppercase text-off-white/20 group-hover:text-off-white/50 transition-colors duration-500 mt-0.5">
                    {d.name.replace("\n", " ")}
                  </p>
                </div>
              </Link>
            ))}
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="font-jp text-sm font-extralight text-gold/30">武士道</p>
                <p className="text-[7px] tracking-[2px] uppercase text-off-white/20 mt-1">Complete</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
