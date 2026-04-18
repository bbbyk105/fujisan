"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Reveal, revealDelays } from "@/components/Reveal";
import { bushidoDesigns } from "@/data/bushido-data";

export default function Bushido() {
  const heroRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [nextImage, setNextImage] = useState(1);
  const [phase, setPhase] = useState<"show" | "crossfade">("show");
  const [hoveredDesign, setHoveredDesign] = useState<number | null>(null);

  // Refs mirror state so the cycle interval stays stable across renders.
  const currentImageRef = useRef(0);
  currentImageRef.current = currentImage;
  const hoveredRef = useRef<number | null>(null);
  hoveredRef.current = hoveredDesign;

  // rAF-throttled parallax — writes transform directly to DOM, no re-renders on scroll.
  useEffect(() => {
    let scheduled = false;
    const update = () => {
      scheduled = false;
      const hero = heroRef.current;
      const target = parallaxRef.current;
      if (!hero || !target) return;
      const offset = (window.scrollY - hero.offsetTop) * 0.12;
      target.style.transform = `scale(${1.1 + Math.abs(offset) * 0.002}) translateY(${offset}px)`;
    };
    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Stable image cycle — deps-free, uses refs to peek current state.
  useEffect(() => {
    const interval = setInterval(() => {
      if (hoveredRef.current !== null) return;
      setPhase("crossfade");
      let next: number;
      do {
        next = Math.floor(Math.random() * bushidoDesigns.length);
      } while (next === currentImageRef.current);
      setNextImage(next);
      setTimeout(() => {
        setCurrentImage(next);
        setPhase("show");
      }, 1200);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const activeDesign = hoveredDesign !== null ? hoveredDesign : currentImage;

  // Keep last hovered image mounted during fade-out so transition is smooth
  const lastHoveredRef = useRef<number>(0);
  if (hoveredDesign !== null) lastHoveredRef.current = hoveredDesign;

  return (
    <section id="bushido">
      {/* ===== FULL BLEED HERO — Dom Perignon style ===== */}
      <div ref={heroRef} className="relative h-screen overflow-hidden bg-ink">
        {/* Full-screen scene image with parallax zoom */}
        <div
          ref={parallaxRef}
          className="absolute inset-0 will-change-transform"
          style={{ transform: "scale(1.1) translateY(0px)" }}
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
          <Reveal as="p" className="text-[13px] tracking-[6px] uppercase text-gold/75 mb-6 font-normal">
            The Bushido Edition
          </Reveal>
          <Reveal as="h2" className="font-serif text-[clamp(44px,7vw,96px)] font-light leading-[1.0] mb-4 tracking-[-0.02em]" delay={revealDelays.d1}>
            The Spirit of<br />the <em className="italic text-gold-lt">Samurai</em>
          </Reveal>
          <Reveal className="w-[48px] h-px bg-gold/40 mx-auto mb-6" delay={revealDelays.d1} />
          <Reveal as="p" className="text-[clamp(15px,1.8vw,18px)] leading-[1.9] text-off-white/65 max-w-[580px] font-light" delay={revealDelays.d2}>
            Seven distinct expressions of Bushido — each bottle a different warrior archetype,
            a different chapter of Japan&apos;s timeless code of honor.
          </Reveal>
          <Reveal as="p" className="text-[12px] tracking-[5px] uppercase text-gold/55 mt-8" delay={revealDelays.d3}>
            300ml · 7 Designs · 純米大吟醸
          </Reveal>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <p className="text-[10px] tracking-[4px] uppercase text-off-white/35">Scroll</p>
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

          {/* Hovered bottle — always mounted for smooth fade in/out */}
          <div className={`absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-500 ease-in-out ${
            hoveredDesign !== null ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}>
            <div className="opus-float relative w-[75%] max-w-[380px] aspect-3/5">
              <Image
                src={bushidoDesigns[lastHoveredRef.current].image}
                alt={bushidoDesigns[lastHoveredRef.current].name}
                fill
                className="object-contain opus-shadow"
                sizes="(max-width: 1024px) 75vw, 38vw"
              />
            </div>
          </div>

          {/* Floor reflection */}
          <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 w-[45%] h-[12%] bg-[radial-gradient(ellipse,rgba(201,168,76,0.08)_0%,transparent_70%)] blur-[8px] bottle-glow" />

          {/* Active design label */}
          <div className={`absolute bottom-8 left-0 right-0 text-center transition-all duration-700 ${
            phase === "crossfade" && hoveredDesign === null ? "opacity-0" : "opacity-100"
          }`}>
            <p className="text-[11px] tracking-[5px] uppercase text-gold/55">
              Design {bushidoDesigns[activeDesign].letter}
            </p>
            <p className="font-serif text-xl font-light text-off-white/75 mt-1">
              {bushidoDesigns[activeDesign].name.replace("\n", " ")}
            </p>
          </div>
        </div>

        {/* RIGHT — Text + Design grid */}
        <div className="bg-ink2 flex flex-col justify-center px-[clamp(40px,6vw,100px)] py-[clamp(60px,7vw,100px)] border-l border-gold/6">
          <Reveal as="p" className="text-[12px] tracking-[5px] uppercase text-gold/65 mb-6 font-normal">
            The Collection
          </Reveal>
          <Reveal className="w-[36px] h-px bg-gold/30 mb-8" delay={revealDelays.d1} />

          <Reveal as="h3" className="font-serif text-[clamp(30px,3.5vw,48px)] font-light leading-[1.1] mb-6" delay={revealDelays.d1}>
            From <em className="italic text-gold-lt/80">White Peak</em><br />to Black Snow
          </Reveal>

          <Reveal as="p" className="text-[clamp(15px,1.7vw,18px)] leading-[1.95] text-off-white/60 max-w-[480px] mb-12" delay={revealDelays.d2}>
            From the White Peak to the Black Snow, each design encapsulates a virtue.
            Seven warrior archetypes, seven chapters of Japan&apos;s timeless code.
          </Reveal>

          {/* Design Grid — Dom Perignon editorial grid */}
          <Reveal className="grid grid-cols-4 gap-4" delay={revealDelays.d3}>
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
                  <p className="text-[10px] tracking-[3px] uppercase text-off-white/35 group-hover:text-gold/80 transition-colors duration-500">
                    {d.letter}
                  </p>
                  <p className="text-[9px] tracking-[1px] uppercase text-off-white/25 group-hover:text-off-white/60 transition-colors duration-500 mt-0.5">
                    {d.name.replace("\n", " ")}
                  </p>
                </div>
              </Link>
            ))}
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="font-jp text-base font-light text-gold/40">武士道</p>
                <p className="text-[9px] tracking-[2px] uppercase text-off-white/30 mt-1">Complete</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
