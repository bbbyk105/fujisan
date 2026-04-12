"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { bushidoDesigns } from "@/data/bushido-data";
import { notFound } from "next/navigation";

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
}

export default function BushidoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const design = bushidoDesigns.find((d) => d.slug === slug);
  const mainRef = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState(false);
  const scrollY = useScrollY();

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.08 }
    );
    el.querySelectorAll(".reveal").forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  if (!design) notFound();

  const idx = bushidoDesigns.findIndex((d) => d.slug === slug);
  const prev = bushidoDesigns[(idx - 1 + bushidoDesigns.length) % bushidoDesigns.length];
  const next = bushidoDesigns[(idx + 1) % bushidoDesigns.length];

  // Parallax values
  const heroParallax = scrollY * 0.3;
  const heroScale = 1.15 + scrollY * 0.0003;
  const heroOpacity = Math.max(0, 1 - scrollY / 700);

  return (
    <main ref={mainRef} className="bg-ink min-h-screen">
      {/* Nav — disappears on scroll, very minimal */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-5 transition-all duration-700 ${
          scrollY > 100
            ? "bg-ink/90 backdrop-blur-[16px] border-b border-gold/6"
            : "bg-transparent"
        }`}
      >
        <Link
          href="/#bushido"
          className="font-serif text-[11px] tracking-[5px] uppercase text-gold/70 no-underline hover:text-gold transition-colors"
        >
          Amachi Hoshisora
        </Link>
        <div className="flex gap-8 items-center">
          <Link
            href={`/bushido/${prev.slug}`}
            className="text-[9px] tracking-[3px] uppercase text-off-white/30 no-underline hover:text-gold transition-colors"
          >
            ← {prev.letter}
          </Link>
          <span className="text-[9px] tracking-[3px] uppercase text-gold/50">
            {design.letter}
          </span>
          <Link
            href={`/bushido/${next.slug}`}
            className="text-[9px] tracking-[3px] uppercase text-off-white/30 no-underline hover:text-gold transition-colors"
          >
            {next.letter} →
          </Link>
        </div>
      </nav>

      {/* ============================================================
          SECTION 1 — Full-bleed hero with scene image + parallax
          ============================================================ */}
      <section className="relative h-screen overflow-hidden">
        {/* Background scene — parallax zoom */}
        <div
          className="absolute inset-[-15%] transition-none"
          style={{
            transform: `scale(${heroScale}) translateY(${-heroParallax}px)`,
          }}
        >
          <Image
            src={design.imageScene}
            alt={`${design.name} atmosphere`}
            fill
            priority
            className="object-cover brightness-[0.3] saturate-[0.7]"
            sizes="130vw"
          />
        </div>

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_40%,transparent_0%,rgba(14,12,10,0.65)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-transparent to-ink" />

        {/* Hero text — fades out on scroll */}
        <div
          className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8"
          style={{ opacity: heroOpacity, transform: `translateY(${scrollY * 0.15}px)` }}
        >
          <p className={`text-[9px] tracking-[8px] uppercase text-gold/40 mb-8 transition-all duration-[1.5s] ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}>
            Design {design.letter} · The Bushido Edition
          </p>

          <h1 className={`font-serif text-[clamp(48px,9vw,120px)] font-light leading-[0.95] tracking-[-0.03em] mb-5 transition-all duration-[2s] delay-200 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}>
            {design.name.replace("\n", " ")}
          </h1>

          <div className={`w-[40px] h-px bg-gold/30 mb-6 transition-all duration-[1.5s] delay-500 ${
            loaded ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
          }`} />

          <p className={`font-serif text-[clamp(16px,2.5vw,24px)] italic text-gold-lt/50 transition-all duration-[2s] delay-700 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}>
            &ldquo;{design.subtitle}&rdquo;
          </p>
        </div>

        {/* Scroll indicator */}
        <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-all duration-[1.5s] delay-[2s] ${
          loaded ? "opacity-100" : "opacity-0"
        }`}>
          <div className="w-px h-10 bg-gradient-to-b from-off-white/20 to-transparent animate-scroll-pulse" />
        </div>
      </section>

      {/* ============================================================
          SECTION 2 — Split: Bottle emerges from darkness + Specs
          ============================================================ */}
      <section className="relative grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* LEFT — Bottle on pitch black */}
        <div className="relative bg-ink flex items-center justify-center min-h-[80vh] lg:min-h-screen overflow-hidden">
          {/* Spotlight cone */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-[65%] bg-[conic-gradient(from_180deg,transparent_36%,rgba(248,245,238,0.04)_48%,rgba(201,168,76,0.025)_50%,rgba(248,245,238,0.04)_52%,transparent_64%)]" />

          {/* Kanji background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className="font-jp text-[clamp(200px,35vw,420px)] font-extralight text-off-white kanji-breathe">
              {design.virtueJp}
            </span>
          </div>

          {/* Bottle */}
          <div className="reveal opus-float relative z-10" style={{ width: "clamp(260px, 42vw, 440px)", aspectRatio: "3/5" }}>
            <Image
              src={design.image}
              alt={design.name}
              fill
              className="object-contain opus-shadow"
              sizes="(max-width: 1024px) 80vw, 42vw"
            />
          </div>

          {/* Floor glow */}
          <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 w-[50%] h-[14%] bg-[radial-gradient(ellipse,rgba(201,168,76,0.07)_0%,transparent_70%)] blur-[10px] bottle-glow" />

          {/* Rim lights */}
          <div className="absolute left-[16%] top-[22%] w-px h-[36%] bg-gradient-to-b from-transparent via-gold/10 to-transparent" />
          <div className="absolute right-[18%] top-[28%] w-px h-[30%] bg-gradient-to-b from-transparent via-off-white/6 to-transparent" />
        </div>

        {/* RIGHT — Details on dark */}
        <div className="bg-ink2 flex flex-col justify-center px-[clamp(40px,6vw,100px)] py-[clamp(60px,6vw,100px)] lg:pr-[clamp(60px,8vw,140px)] border-l border-gold/6">
          <div className="reveal">
            <p className="text-[9px] tracking-[6px] uppercase text-gold/40 mb-3">
              Design {design.letter}
            </p>
            <p className="text-[9px] tracking-[5px] uppercase text-off-white/40 mb-8">
              300ml · {design.bottle}
            </p>
          </div>

          <h2 className="reveal d1 font-serif text-[clamp(36px,5vw,64px)] font-light leading-[1.02] tracking-[-0.02em] mb-3">
            {design.name.replace("\n", " ")}
          </h2>

          <div className="reveal d1 w-[32px] h-px bg-gold/25 my-7" />

          <p className="reveal d2 font-serif text-[clamp(16px,2vw,22px)] italic text-gold-lt/60 mb-10 leading-[1.7]">
            &ldquo;{design.subtitle}&rdquo;
          </p>

          <div className="reveal d2 flex items-center gap-5 mb-12">
            <span className="font-jp text-[clamp(40px,5vw,56px)] font-extralight text-gold/60">
              {design.virtueJp}
            </span>
            <div className="h-12 w-px bg-gold/15" />
            <div>
              <p className="text-[8px] tracking-[4px] uppercase text-off-white/35 mb-1">
                Bushido Virtue
              </p>
              <p className="font-serif text-[clamp(17px,2vw,22px)] italic text-off-white/70">
                {design.virtue}
              </p>
            </div>
          </div>

          {/* Tasting */}
          <div className="reveal d3 border-t border-gold/10 pt-8 mb-10">
            <p className="text-[8px] tracking-[4px] uppercase text-gold/40 mb-3">Tasting Notes</p>
            <p className="font-serif text-[clamp(14px,1.5vw,17px)] italic text-off-white/60 leading-[1.9]">
              {design.tastingNote}
            </p>
          </div>

          {/* Specs */}
          <div className="reveal d3 flex gap-10">
            {[
              ["Volume", "300ml"],
              ["Cap Seal", design.capSeal],
              ["Class", "純米大吟醸"],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[8px] tracking-[3px] uppercase text-off-white/30 mb-1">{k}</p>
                <p className="font-serif text-[13px] text-off-white/60">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 3 — Full-bleed scene image with text overlay
          ============================================================ */}
      <section className="relative h-[70vh] lg:h-screen overflow-hidden">
        <div className="absolute inset-[-10%]">
          <Image
            src={design.imageBg}
            alt={`${design.name} label detail`}
            fill
            className="object-cover brightness-[0.25] saturate-[0.6]"
            sizes="120vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-transparent to-ink" />

        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-[clamp(32px,8vw,120px)]">
          <p className="reveal text-[9px] tracking-[6px] uppercase text-gold/50 mb-6">The Story</p>
          <div className="reveal d1 w-[32px] h-px bg-gold/30 mb-10" />
          <p className="reveal d1 font-serif text-[clamp(18px,2.5vw,28px)] font-light leading-[2] text-off-white/70 max-w-[680px] italic">
            {design.descriptionEn[0]}
          </p>
        </div>
      </section>

      {/* ============================================================
          SECTION 4 — Story bilingual
          ============================================================ */}
      <section className="border-t border-gold/6">
        <div className="max-w-[1100px] mx-auto px-[clamp(32px,5vw,80px)] py-[clamp(80px,10vw,140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(48px,7vw,120px)]">
            <div>
              <p className="reveal text-[9px] tracking-[5px] uppercase text-gold/50 mb-6">The Story</p>
              <div className="reveal d1 w-[24px] h-px bg-gold/25 mb-10" />
              {design.descriptionEn.slice(1).map((p, i) => (
                <p key={i} className={`reveal ${i > 0 ? "d1" : ""} text-[clamp(14px,1.6vw,16px)] leading-[2.1] text-off-white/65 mb-7 font-serif`}>
                  {p}
                </p>
              ))}
            </div>
            <div className="lg:border-l lg:border-gold/6 lg:pl-[clamp(36px,5vw,72px)]">
              <p className="reveal text-[9px] tracking-[5px] uppercase text-gold/50 mb-6 font-jp">物語</p>
              <div className="reveal d1 w-[24px] h-px bg-gold/25 mb-10" />
              {design.descriptionJp.map((p, i) => (
                <p key={i} className={`reveal ${i > 0 ? "d1" : ""} text-[clamp(13px,1.4vw,15px)] leading-[2.3] text-off-white/55 mb-7 font-jp font-extralight`}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 5 — Collection strip
          ============================================================ */}
      <section className="border-t border-gold/6 bg-ink2">
        <div className="max-w-[1400px] mx-auto px-[clamp(24px,4vw,48px)] py-[clamp(64px,8vw,110px)]">
          <p className="reveal text-[9px] tracking-[6px] uppercase text-gold/40 mb-12 text-center">
            Explore the Collection
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 sm:gap-5">
            {bushidoDesigns.map((d) => (
              <Link
                href={`/bushido/${d.slug}`}
                key={d.letter}
                className={`reveal group no-underline block transition-all duration-700 ${
                  d.slug === slug ? "opacity-100" : "opacity-40 hover:opacity-100"
                }`}
              >
                <div className="relative aspect-[2/5] overflow-hidden mb-3">
                  {/* Subtle glow behind active bottle */}
                  {d.slug === slug && (
                    <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[70%] h-[20%] bg-gold/8 rounded-full blur-[12px]" />
                  )}
                  <Image
                    src={d.image}
                    alt={d.name}
                    fill
                    className={`object-contain transition-all duration-700 ${
                      d.slug === slug
                        ? "scale-100 opus-shadow"
                        : "scale-[0.85] group-hover:scale-[1.0] group-hover:opus-shadow"
                    }`}
                    sizes="180px"
                  />
                  {d.slug === slug && (
                    <div className="absolute bottom-0 left-[20%] right-[20%] h-px bg-gold/50" />
                  )}
                </div>
                <div className="text-center">
                  <p className={`text-[9px] tracking-[3px] uppercase transition-colors duration-500 ${
                    d.slug === slug ? "text-gold/70" : "text-off-white/25 group-hover:text-gold/60"
                  }`}>
                    {d.letter}
                  </p>
                  <p className={`text-[8px] tracking-[1px] uppercase mt-0.5 transition-colors duration-500 ${
                    d.slug === slug ? "text-off-white/50" : "text-off-white/15 group-hover:text-off-white/40"
                  }`}>
                    {d.name.replace("\n", " ")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 6 — Prev / Next — Dom Perignon editorial style
          ============================================================ */}
      <section className="border-t border-gold/6">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {[
            { d: prev, label: "Previous", dir: "←" },
            { d: next, label: "Next", dir: "→" },
          ].map(({ d, label, dir }) => (
            <Link
              key={d.slug}
              href={`/bushido/${d.slug}`}
              className="group no-underline relative overflow-hidden h-[40vh] md:h-[50vh] flex items-center justify-center border-b md:border-b-0 md:even:border-l border-gold/6"
            >
              {/* Background scene on hover */}
              <div className="absolute inset-0">
                <Image
                  src={d.imageScene}
                  alt={d.name}
                  fill
                  className="object-cover brightness-[0.12] group-hover:brightness-[0.25] saturate-[0.5] transition-all duration-1000 scale-110 group-hover:scale-100"
                  sizes="50vw"
                />
              </div>
              <div className="absolute inset-0 bg-ink/60 group-hover:bg-ink/30 transition-all duration-700" />

              <div className="relative z-10 text-center">
                <p className="text-[8px] tracking-[4px] uppercase text-off-white/20 mb-3">
                  {dir} {label}
                </p>
                <p className="font-serif text-[clamp(24px,4vw,40px)] font-light text-off-white/40 group-hover:text-off-white/80 transition-colors duration-500">
                  {d.name.replace("\n", " ")}
                </p>
                <p className="text-[10px] text-off-white/15 mt-2 font-jp group-hover:text-gold/40 transition-colors duration-500">
                  Design {d.letter} · {d.virtueJp}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gold/4 py-14 text-center bg-ink">
        <Link
          href="/#bushido"
          className="text-[8px] tracking-[5px] uppercase text-off-white/20 no-underline hover:text-gold/50 transition-colors"
        >
          ← Back to Collection
        </Link>
        <p className="text-[8px] text-off-white/10 mt-6 tracking-[3px]">
          AMACHI HOSHISORA · Mt. Fuji Sake Project
        </p>
      </footer>
    </main>
  );
}
