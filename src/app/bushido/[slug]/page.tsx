"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useRef, useState, useCallback } from "react";
import { bushidoDesigns } from "@/data/bushido-data";
import { notFound } from "next/navigation";

function GalleryViewer({
  images,
  labels,
}: {
  images: string[];
  labels: string[];
}) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isTransparent = images[current].endsWith(".png");

  const goTo = useCallback(
    (idx: number) => {
      if (idx === current || isTransitioning) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrent(idx);
        setIsTransitioning(false);
      }, 400);
    },
    [current, isTransitioning]
  );

  const next = useCallback(() => {
    goTo((current + 1) % images.length);
  }, [current, images.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + images.length) % images.length);
  }, [current, images.length, goTo]);

  return (
    <div className="relative flex items-center justify-center py-32 px-8 lg:py-0 min-h-[70vh]">
      {/* Radial glow backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(201,168,76,0.05)_0%,transparent_60%)]" />

      {/* Ambient particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
        <div className="particle particle-5" />
      </div>

      {/* Main image area */}
      <div
        className={`transition-all duration-400 ease-out ${
          isTransitioning
            ? "opacity-0 scale-[0.96]"
            : "opacity-100 scale-100"
        }`}
      >
        {isTransparent ? (
          /* Transparent PNG — floating bottle */
          <div
            className="bottle-float-hero relative"
            style={{
              width: "clamp(300px, 55vw, 580px)",
              aspectRatio: "3/5",
            }}
          >
            <Image
              src={images[current]}
              alt="Bottle"
              fill
              priority={current === 0}
              className="object-contain bottle-shadow"
              sizes="(max-width: 1024px) 90vw, 50vw"
            />
          </div>
        ) : (
          /* Scene / background image — full frame */
          <div className="relative w-[clamp(320px,50vw,600px)] aspect-[3/4] overflow-hidden rounded-sm shadow-2xl">
            <Image
              src={images[current]}
              alt="Scene"
              fill
              priority={current === 0}
              className="object-cover"
              sizes="(max-width: 1024px) 90vw, 50vw"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-gold/10 rounded-sm" />
          </div>
        )}
      </div>

      {/* Glow effects */}
      {isTransparent && (
        <>
          <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[55%] h-[25%] bg-gradient-to-t from-gold/10 via-gold/4 to-transparent rounded-full blur-[60px] bottle-glow" />
          <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[35%] h-[6%] bg-gold/8 rounded-full blur-[25px]" />
        </>
      )}

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-off-white/40 hover:text-gold transition-colors bg-ink/30 hover:bg-ink/60 backdrop-blur-sm rounded-full border border-gold/10"
        aria-label="Previous image"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 3L5 8L10 13" />
        </svg>
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-off-white/40 hover:text-gold transition-colors bg-ink/30 hover:bg-ink/60 backdrop-blur-sm rounded-full border border-gold/10"
        aria-label="Next image"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 3L11 8L6 13" />
        </svg>
      </button>

      {/* Thumbnail strip */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 items-center">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`relative overflow-hidden transition-all duration-300 border ${
              i === current
                ? "w-14 h-14 border-gold/60 ring-1 ring-gold/30"
                : "w-11 h-11 border-gold/15 opacity-50 hover:opacity-90"
            } rounded-sm`}
            aria-label={labels[i]}
          >
            <Image
              src={img}
              alt={labels[i]}
              fill
              className={`${img.endsWith(".png") ? "object-contain p-0.5" : "object-cover"}`}
              sizes="56px"
            />
          </button>
        ))}
      </div>

      {/* Label */}
      <div
        className={`absolute top-28 left-1/2 -translate-x-1/2 transition-all duration-400 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        <p className="text-[9px] tracking-[4px] uppercase text-gold/50 text-center">
          {labels[current]}
        </p>
      </div>
    </div>
  );
}

export default function BushidoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const design = bushidoDesigns.find((d) => d.slug === slug);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    el.querySelectorAll(".reveal").forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);

  if (!design) {
    notFound();
  }

  const currentIndex = bushidoDesigns.findIndex((d) => d.slug === slug);
  const prevDesign =
    bushidoDesigns[
      (currentIndex - 1 + bushidoDesigns.length) % bushidoDesigns.length
    ];
  const nextDesign =
    bushidoDesigns[(currentIndex + 1) % bushidoDesigns.length];

  const galleryImages = [design.image, design.imageScene, design.imageDark];
  const galleryLabels = [
    "Product — Transparent",
    "Atmosphere — Scene",
    "Studio — Dark",
  ];

  return (
    <main ref={sectionRef} className="bg-ink min-h-screen">
      {/* Back nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-5 bg-ink/90 backdrop-blur-[12px] border-b border-gold/12">
        <Link
          href="/#bushido"
          className="font-serif text-xs tracking-[5px] uppercase text-gold no-underline hover:text-gold-lt transition-colors"
        >
          Amachi Hoshisora
        </Link>
        <div className="flex gap-8 items-center">
          <Link
            href={`/bushido/${prevDesign.slug}`}
            className="text-[10px] tracking-[3px] uppercase text-off-white/50 no-underline hover:text-gold transition-colors"
          >
            ← {prevDesign.letter}
          </Link>
          <span className="text-[10px] tracking-[3px] uppercase text-gold">
            Design {design.letter}
          </span>
          <Link
            href={`/bushido/${nextDesign.slug}`}
            className="text-[10px] tracking-[3px] uppercase text-off-white/50 no-underline hover:text-gold transition-colors"
          >
            {nextDesign.letter} →
          </Link>
        </div>
      </nav>

      {/* Hero Section with Gallery */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background kanji */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="font-jp text-[clamp(200px,40vw,500px)] font-extralight text-off-white kanji-breathe">
            {design.virtueJp}
          </span>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0 w-full min-h-screen">
          {/* Left: Gallery Viewer */}
          <GalleryViewer images={galleryImages} labels={galleryLabels} />

          {/* Right: Content */}
          <div className="flex flex-col justify-center px-[clamp(32px,5vw,80px)] py-[clamp(40px,5vw,80px)] lg:pr-[clamp(60px,8vw,140px)]">
            <div className="reveal">
              <span className="inline-block text-[10px] tracking-[4px] uppercase text-crimson border border-crimson/50 px-3.5 py-1.5 mb-6">
                Design {design.letter} · The Bushido Edition
              </span>
            </div>

            <div className="reveal d1">
              <p className="text-[10px] tracking-[5px] uppercase text-gold font-normal mb-2">
                300ml · {design.bottle}
              </p>
              <div className="w-[52px] h-px bg-gold mb-8" />
            </div>

            <h1 className="reveal d1 font-serif text-[clamp(36px,5vw,72px)] font-light leading-[1.05] mb-3">
              {design.name.split("\n").map((line, i) => (
                <span key={i}>
                  {i === 0 ? line : <><br />{line}</>}
                </span>
              ))}
            </h1>

            <p className="reveal d2 font-serif text-[clamp(16px,2vw,22px)] italic text-gold-lt/80 mb-2">
              &ldquo;{design.subtitle}&rdquo;
            </p>

            <div className="reveal d2 flex items-center gap-4 mb-10 mt-4">
              <span className="font-jp text-4xl font-extralight text-gold">
                {design.virtueJp}
              </span>
              <div className="h-8 w-px bg-gold/30" />
              <div>
                <p className="text-[10px] tracking-[3px] uppercase text-off-white/50">
                  Bushido Virtue
                </p>
                <p className="font-serif text-lg italic text-off-white/80">
                  {design.virtue}
                </p>
              </div>
            </div>

            {/* Tasting Note */}
            <div className="reveal d2 border-t border-b border-gold/15 py-5 mb-10">
              <p className="text-[10px] tracking-[3px] uppercase text-gold/60 mb-2">
                Tasting Notes
              </p>
              <p className="font-serif text-[clamp(14px,1.5vw,17px)] italic text-off-white/70">
                {design.tastingNote}
              </p>
            </div>

            {/* Specs */}
            <div className="reveal d3 grid grid-cols-3 gap-6 mb-10">
              <div>
                <p className="text-[9px] tracking-[3px] uppercase text-off-white/35 mb-1">
                  Volume
                </p>
                <p className="font-serif text-sm text-off-white/80">300ml</p>
              </div>
              <div>
                <p className="text-[9px] tracking-[3px] uppercase text-off-white/35 mb-1">
                  Cap Seal
                </p>
                <p className="font-serif text-sm text-off-white/80">
                  {design.capSeal}
                </p>
              </div>
              <div>
                <p className="text-[9px] tracking-[3px] uppercase text-off-white/35 mb-1">
                  Classification
                </p>
                <p className="font-serif text-sm text-off-white/80">
                  純米大吟醸
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="bg-ink3 border-t border-gold/10">
        <div className="max-w-[1100px] mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(60px,8vw,120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(40px,6vw,100px)]">
            {/* English */}
            <div>
              <p className="reveal text-[10px] tracking-[5px] uppercase text-gold-dark font-normal mb-5">
                The Story
              </p>
              <div className="reveal d1 w-[52px] h-px bg-gold mb-8" />
              {design.descriptionEn.map((p, i) => (
                <p
                  key={i}
                  className={`reveal ${
                    i > 0 ? "d1" : ""
                  } text-[clamp(15px,1.8vw,17px)] leading-[2] text-off-white/65 mb-6 font-serif`}
                >
                  {p}
                </p>
              ))}
            </div>

            {/* Japanese */}
            <div className="lg:border-l lg:border-gold/10 lg:pl-[clamp(30px,4vw,60px)]">
              <p className="reveal text-[10px] tracking-[5px] uppercase text-gold-dark font-normal mb-5 font-jp">
                物語
              </p>
              <div className="reveal d1 w-[52px] h-px bg-gold mb-8" />
              {design.descriptionJp.map((p, i) => (
                <p
                  key={i}
                  className={`reveal ${
                    i > 0 ? "d1" : ""
                  } text-[clamp(14px,1.6vw,16px)] leading-[2.2] text-off-white/55 mb-6 font-jp font-extralight`}
                >
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Navigation to other designs */}
      <section className="border-t border-gold/10">
        <div className="max-w-[1240px] mx-auto px-[clamp(24px,5vw,60px)] py-[clamp(48px,6vw,80px)]">
          <p className="reveal text-[10px] tracking-[5px] uppercase text-gold font-normal mb-8 text-center">
            Explore the Collection
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-4">
            {bushidoDesigns.map((d) => (
              <Link
                href={`/bushido/${d.slug}`}
                key={d.letter}
                className={`reveal group no-underline block ${
                  d.slug === slug
                    ? "opacity-100"
                    : "opacity-60 hover:opacity-100"
                } transition-opacity duration-300`}
              >
                <div className="relative aspect-[3/5] overflow-hidden mb-2">
                  <Image
                    src={d.image}
                    alt={d.name}
                    fill
                    className={`object-contain transition-all duration-500 ${
                      d.slug === slug
                        ? "scale-100 bottle-shadow"
                        : "scale-[0.85] group-hover:scale-100 opacity-70 group-hover:opacity-100"
                    }`}
                    sizes="120px"
                  />
                  {d.slug === slug && (
                    <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-gold rounded-full" />
                  )}
                </div>
                <p
                  className={`text-[8px] tracking-[2px] uppercase text-center ${
                    d.slug === slug
                      ? "text-gold"
                      : "text-off-white/40 group-hover:text-off-white/70"
                  } transition-colors duration-300`}
                >
                  {d.letter} · {d.name.replace("\n", " ")}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Prev / Next navigation */}
      <section className="border-t border-gold/10">
        <div className="grid grid-cols-2">
          <Link
            href={`/bushido/${prevDesign.slug}`}
            className="group no-underline relative overflow-hidden py-16 px-[clamp(24px,4vw,60px)] border-r border-gold/10 hover:bg-ink3/50 transition-colors duration-500"
          >
            <p className="text-[10px] tracking-[3px] uppercase text-off-white/35 mb-2">
              ← Previous
            </p>
            <p className="font-serif text-[clamp(20px,3vw,32px)] font-light text-off-white/70 group-hover:text-gold transition-colors duration-300">
              {prevDesign.name.replace("\n", " ")}
            </p>
            <p className="text-xs text-off-white/30 mt-1 font-jp">
              Design {prevDesign.letter} · {prevDesign.virtueJp}
            </p>
          </Link>
          <Link
            href={`/bushido/${nextDesign.slug}`}
            className="group no-underline relative overflow-hidden py-16 px-[clamp(24px,4vw,60px)] text-right hover:bg-ink3/50 transition-colors duration-500"
          >
            <p className="text-[10px] tracking-[3px] uppercase text-off-white/35 mb-2">
              Next →
            </p>
            <p className="font-serif text-[clamp(20px,3vw,32px)] font-light text-off-white/70 group-hover:text-gold transition-colors duration-300">
              {nextDesign.name.replace("\n", " ")}
            </p>
            <p className="text-xs text-off-white/30 mt-1 font-jp">
              Design {nextDesign.letter} · {nextDesign.virtueJp}
            </p>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gold/10 py-10 text-center">
        <Link
          href="/#bushido"
          className="text-[10px] tracking-[4px] uppercase text-off-white/40 no-underline hover:text-gold transition-colors"
        >
          ← Back to Full Collection
        </Link>
        <p className="text-[10px] text-off-white/20 mt-4 tracking-[2px]">
          AMACHI HOSHISORA · Mt. Fuji Sake Project
        </p>
      </footer>
    </main>
  );
}
