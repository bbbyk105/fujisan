"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type MouseEventHandler,
} from "react";
import { Reveal, revealDelays } from "@/components/Reveal";
import { bushidoDesigns, type BushidoDesign } from "@/data/bushido-data";

const IMAGE_CYCLE_INTERVAL_MS = 6000;
const CROSSFADE_DURATION_MS = 1200;
const INITIAL_PARALLAX_TRANSFORM = "scale(1.1) translateY(0px)";
const BOTTLE_IMAGE_SIZES = "(max-width: 1024px) 75vw, 38vw";
const SCENE_IMAGE_CLASS =
  "object-cover transition-opacity duration-[1.5s] ease-in-out brightness-[0.35] saturate-[0.8]";
const BOTTLE_LAYER_CLASS =
  "absolute inset-0 flex items-center justify-center transition-all duration-[1.4s] ease-in-out";

type TransitionPhase = "show" | "crossfade";

function formatDesignName(name: string) {
  return name.replace(/\n/g, " ");
}

function getRandomDesignIndex(exclude: number) {
  let next = exclude;

  while (next === exclude) {
    next = Math.floor(Math.random() * bushidoDesigns.length);
  }

  return next;
}

function getParallaxTransform(offset: number) {
  return `scale(${1.1 + Math.abs(offset) * 0.002}) translateY(${offset}px)`;
}

type BottleImageProps = {
  design: BushidoDesign;
  priority?: boolean;
};

function BottleImage({ design, priority = false }: BottleImageProps) {
  return (
    <div className="opus-float relative w-[75%] max-w-[380px] aspect-[3/5]">
      <Image
        src={design.image}
        alt={design.name}
        fill
        className="object-contain opus-shadow"
        sizes={BOTTLE_IMAGE_SIZES}
        priority={priority}
      />
    </div>
  );
}

function AmbientParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className={`particle particle-${index + 1}`} />
      ))}
    </div>
  );
}

type DesignCardProps = {
  design: BushidoDesign;
  onMouseEnter: MouseEventHandler<HTMLAnchorElement>;
  onMouseLeave: MouseEventHandler<HTMLAnchorElement>;
};

function DesignCard({ design, onMouseEnter, onMouseLeave }: DesignCardProps) {
  return (
    <Link
      href={`/bushido/${design.slug}`}
      className="group no-underline block"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative aspect-[3/5] overflow-hidden mb-2">
        <Image
          src={design.image}
          alt={design.name}
          fill
          className="object-contain scale-[0.8] group-hover:scale-[0.95] transition-all duration-700 opacity-50 group-hover:opacity-100"
          sizes="100px"
        />
      </div>
      <div className="text-center">
        <p className="text-[10px] tracking-[3px] uppercase text-off-white/35 group-hover:text-gold/80 transition-colors duration-500">
          {design.letter}
        </p>
        <p className="text-[9px] tracking-[1px] uppercase text-off-white/25 group-hover:text-off-white/60 transition-colors duration-500 mt-0.5">
          {formatDesignName(design.name)}
        </p>
      </div>
    </Link>
  );
}

export default function Bushido() {
  const heroRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const transitionTimeoutRef = useRef<number | null>(null);

  const [currentImage, setCurrentImage] = useState(0);
  const [nextImage, setNextImage] = useState(1);
  const [phase, setPhase] = useState<TransitionPhase>("show");
  const [hoveredDesign, setHoveredDesign] = useState<number | null>(null);
  const [displayedHoveredDesign, setDisplayedHoveredDesign] = useState<number | null>(
    null,
  );

  const currentDesign = bushidoDesigns[currentImage];
  const nextDesign = bushidoDesigns[nextImage];
  const activeDesign = bushidoDesigns[hoveredDesign ?? currentImage];
  const hoveredPreviewDesign =
    displayedHoveredDesign === null ? null : bushidoDesigns[displayedHoveredDesign];

  // rAF-throttled parallax — writes transform directly to DOM, no re-renders on scroll.
  useEffect(() => {
    let frameId = 0;
    let scheduled = false;

    const update = () => {
      scheduled = false;

      const hero = heroRef.current;
      const target = parallaxRef.current;

      if (!hero || !target) {
        return;
      }

      const offset = (window.scrollY - hero.offsetTop) * 0.12;
      target.style.transform = getParallaxTransform(offset);
    };

    const queueUpdate = () => {
      if (scheduled) {
        return;
      }

      scheduled = true;
      frameId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate, { passive: true });

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
    };
  }, []);

  const startImageCycle = useEffectEvent(() => {
    if (hoveredDesign !== null) {
      return;
    }

    const nextIndex = getRandomDesignIndex(currentImage);
    setNextImage(nextIndex);
    setPhase("crossfade");

    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
    }

    transitionTimeoutRef.current = window.setTimeout(() => {
      setCurrentImage(nextIndex);
      setPhase("show");
      transitionTimeoutRef.current = null;
    }, CROSSFADE_DURATION_MS);
  });

  useEffect(() => {
    const intervalId = window.setInterval(startImageCycle, IMAGE_CYCLE_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);

      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section id="bushido">
      {/* ===== FULL BLEED HERO — Dom Perignon style ===== */}
      <div ref={heroRef} className="relative h-screen overflow-hidden bg-ink">
        {/* Full-screen scene image with parallax zoom */}
        <div
          ref={parallaxRef}
          className="absolute inset-0 will-change-transform"
          style={{ transform: INITIAL_PARALLAX_TRANSFORM }}
        >
          <Image
            src={activeDesign.imageScene}
            alt="Bushido atmosphere"
            fill
            className={`${SCENE_IMAGE_CLASS} ${
              phase === "crossfade" ? "opacity-0" : "opacity-100"
            }`}
            sizes="100vw"
            priority
          />
          <Image
            src={nextDesign.imageScene}
            alt="Bushido atmosphere next"
            fill
            className={`${SCENE_IMAGE_CLASS} ${
              phase === "crossfade" ? "opacity-100" : "opacity-0"
            }`}
            sizes="100vw"
          />
        </div>

        {/* Dark vignette overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,transparent_20%,rgba(14,12,10,0.7)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-transparent to-ink" />
        <AmbientParticles />

        {/* Glow behind center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[400px] bg-[radial-gradient(ellipse,rgba(201,168,76,0.1)_0%,transparent_65%)] blur-[50px] bottle-glow pointer-events-none" />

        {/* Center content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center">
          <Reveal as="p" className="mb-6 text-[13px] uppercase tracking-[0.3em] text-gold/75 font-medium">
            The Bushido Edition
          </Reveal>
          <Reveal
            as="h2"
            className="mb-4 font-serif text-[clamp(44px,7vw,96px)] font-normal leading-[1.08]"
            delay={revealDelays.d1}
          >
            The Spirit of
            <br />
            the <em className="italic text-gold-lt">Samurai</em>
          </Reveal>
          <Reveal className="mx-auto mb-6 h-px w-[48px] bg-gold/40" delay={revealDelays.d1} />
          <Reveal
            as="p"
            className="max-w-[580px] text-[clamp(15px,1.8vw,18px)] font-normal leading-[1.95] text-off-white/68"
            delay={revealDelays.d2}
          >
            Seven distinct expressions of Bushido — each bottle a different warrior
            archetype, a different chapter of Japan&apos;s timeless code of honor.
          </Reveal>
          <Reveal
            as="p"
            className="mt-8 text-[12px] uppercase tracking-[0.28em] text-gold/58"
            delay={revealDelays.d3}
          >
            300ml · 7 Designs · 純米大吟醸
          </Reveal>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
          <p className="text-[10px] uppercase tracking-[0.28em] text-off-white/38">Scroll</p>
          <div className="h-10 w-px bg-gradient-to-b from-off-white/20 to-transparent animate-scroll-pulse" />
        </div>
      </div>

      {/* ===== SPLIT SCREEN — Bottle + Grid ===== */}
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* LEFT — Cinematic bottle on black */}
        <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-ink lg:min-h-screen">
          {/* Spotlight */}
          <div className="absolute top-0 left-1/2 h-[60%] w-[50%] -translate-x-1/2 bg-[conic-gradient(from_180deg,transparent_36%,rgba(248,245,238,0.04)_48%,rgba(201,168,76,0.03)_50%,rgba(248,245,238,0.04)_52%,transparent_64%)]" />

          <div
            className={`${BOTTLE_LAYER_CLASS} ${
              phase === "crossfade" ? "opacity-0 scale-[0.97]" : "opacity-100 scale-100"
            }`}
          >
            <BottleImage design={currentDesign} priority />
          </div>

          <div
            className={`${BOTTLE_LAYER_CLASS} ${
              phase === "crossfade" ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"
            }`}
          >
            <BottleImage design={nextDesign} />
          </div>

          {/* Hovered bottle — always mounted for smooth fade in/out */}
          <div
            className={`${BOTTLE_LAYER_CLASS} z-10 transition-opacity duration-500 ${
              hoveredPreviewDesign ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {hoveredPreviewDesign ? <BottleImage design={hoveredPreviewDesign} /> : null}
          </div>

          {/* Floor reflection */}
          <div className="absolute bottom-[6%] left-1/2 h-[12%] w-[45%] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(201,168,76,0.08)_0%,transparent_70%)] blur-[8px] bottle-glow" />

          {/* Active design label */}
          <div
            className={`absolute right-0 bottom-8 left-0 text-center transition-all duration-700 ${
              phase === "crossfade" && hoveredDesign === null ? "opacity-0" : "opacity-100"
            }`}
          >
            <p className="text-[11px] uppercase tracking-[5px] text-gold/55">
              Design {activeDesign.letter}
            </p>
            <p className="mt-1 font-serif text-xl font-light text-off-white/75">
              {formatDesignName(activeDesign.name)}
            </p>
          </div>
        </div>

        {/* RIGHT — Text + Design grid */}
        <div className="flex flex-col justify-center border-l border-gold/6 bg-ink2 px-[clamp(40px,6vw,100px)] py-[clamp(60px,7vw,100px)]">
          <Reveal as="p" className="mb-6 text-[12px] uppercase tracking-[0.3em] text-gold/65 font-medium">
            The Collection
          </Reveal>
          <Reveal className="mb-8 h-px w-[36px] bg-gold/30" delay={revealDelays.d1} />

          <Reveal
            as="h3"
            className="mb-6 font-serif text-[clamp(30px,3.5vw,48px)] font-normal leading-[1.16]"
            delay={revealDelays.d1}
          >
            From <em className="italic text-gold-lt/80">White Peak</em>
            <br />
            to Black Snow
          </Reveal>

          <Reveal
            as="p"
            className="mb-12 max-w-[480px] text-[clamp(15px,1.7vw,18px)] leading-[2] text-off-white/66"
            delay={revealDelays.d2}
          >
            From the White Peak to the Black Snow, each design encapsulates a virtue.
            Seven warrior archetypes, seven chapters of Japan&apos;s timeless code.
          </Reveal>

          {/* Design Grid — Dom Perignon editorial grid */}
          <Reveal className="grid grid-cols-4 gap-4" delay={revealDelays.d3}>
            {bushidoDesigns.map((design, index) => (
              <DesignCard
                key={design.letter}
                design={design}
                onMouseEnter={() => {
                  setDisplayedHoveredDesign(index);
                  setHoveredDesign(index);
                }}
                onMouseLeave={() => setHoveredDesign(null)}
              />
            ))}
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="font-jp text-base font-normal text-gold/46">武士道</p>
                <p className="mt-1 text-[9px] uppercase tracking-[2px] text-off-white/30">
                  Complete
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
