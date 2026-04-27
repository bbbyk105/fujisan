"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { bushidoDesigns } from "@/data/bushido-data";
import { Reveal, revealDelays, revealEase } from "@/components/Reveal";
import { notFound } from "next/navigation";

const MotionLink = motion(Link);

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
  const [loaded, setLoaded] = useState(false);
  const scrollY = useScrollY();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, [slug]);

  if (!design) notFound();

  const idx = bushidoDesigns.findIndex((d) => d.slug === slug);
  const prev = bushidoDesigns[(idx - 1 + bushidoDesigns.length) % bushidoDesigns.length];
  const next = bushidoDesigns[(idx + 1) % bushidoDesigns.length];

  const heroParallax = scrollY * 0.3;
  const heroScale = 1.15 + scrollY * 0.0003;
  const heroOpacity = Math.max(0, 1 - scrollY / 700);

  return (
    <main className="bg-ink min-h-screen">
      {/* Nav */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-5 transition-all duration-700 ${
          scrollY > 100
            ? "bg-ink/90 backdrop-blur-[16px] border-b border-gold/8"
            : "bg-transparent"
        }`}
      >
        <Link
          href="/#bushido"
          className="font-serif text-[13px] tracking-[4px] uppercase text-gold no-underline hover:text-gold-lt transition-colors"
        >
          Amachi Hoshisora
        </Link>
        <div className="flex gap-8 items-center">
          <Link
            href={`/bushido/${prev.slug}`}
            className="text-[11px] tracking-[3px] uppercase text-off-white/50 no-underline hover:text-gold transition-colors"
          >
            ← {prev.letter}
          </Link>
          <span className="text-[11px] tracking-[3px] uppercase text-gold/80 font-normal">
            Design {design.letter}
          </span>
          <Link
            href={`/bushido/${next.slug}`}
            className="text-[11px] tracking-[3px] uppercase text-off-white/50 no-underline hover:text-gold transition-colors"
          >
            {next.letter} →
          </Link>
        </div>
      </nav>

      {/* ============================================================
          SECTION 1 — Full-bleed hero
          ============================================================ */}
      <section className="relative h-screen overflow-hidden">
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

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_40%,transparent_0%,rgba(14,12,10,0.65)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-transparent to-ink" />

        <div
          className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8"
          style={{ opacity: heroOpacity, transform: `translateY(${scrollY * 0.15}px)` }}
        >
          <p className={`text-[12px] tracking-[0.3em] uppercase text-gold/70 mb-8 font-medium transition-all duration-[1.5s] ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}>
            Design {design.letter} · The Bushido Edition
          </p>

          <h1 className={`font-serif text-[clamp(52px,9vw,120px)] font-normal leading-[1.08] mb-5 transition-all duration-[2s] delay-200 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}>
            {design.name.replace("\n", " ")}
          </h1>

          <div className={`w-[48px] h-px bg-gold/40 mb-6 transition-all duration-[1.5s] delay-500 ${
            loaded ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
          }`} />

          <p className={`font-serif text-[clamp(18px,2.5vw,26px)] italic leading-[1.7] text-gold-lt/74 transition-all duration-[2s] delay-700 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}>
            &ldquo;{design.subtitle}&rdquo;
          </p>
        </div>

        <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-all duration-[1.5s] delay-[2s] ${
          loaded ? "opacity-100" : "opacity-0"
        }`}>
          <div className="w-px h-10 bg-gradient-to-b from-off-white/30 to-transparent animate-scroll-pulse" />
        </div>
      </section>

      {/* ============================================================
          SECTION 2 — Split: Bottle + Specs
          ============================================================ */}
      <section className="relative grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* LEFT — Bottle */}
        <div className="relative bg-ink flex items-center justify-center min-h-[80vh] lg:min-h-screen overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-[65%] bg-[conic-gradient(from_180deg,transparent_36%,rgba(248,245,238,0.04)_48%,rgba(201,168,76,0.025)_50%,rgba(248,245,238,0.04)_52%,transparent_64%)]" />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className="font-jp text-[clamp(200px,35vw,420px)] font-light text-off-white kanji-breathe">
              {design.virtueJp}
            </span>
          </div>

          <Reveal
            className="opus-float relative z-10"
            style={{ width: "clamp(260px, 42vw, 440px)", aspectRatio: "3/5" }}
          >
            <Image
              src={design.image}
              alt={design.name}
              fill
              className="object-contain opus-shadow"
              sizes="(max-width: 1024px) 80vw, 42vw"
            />
          </Reveal>

          <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 w-[50%] h-[14%] bg-[radial-gradient(ellipse,rgba(201,168,76,0.07)_0%,transparent_70%)] blur-[10px] bottle-glow" />
          <div className="absolute left-[16%] top-[22%] w-px h-[36%] bg-gradient-to-b from-transparent via-gold/10 to-transparent" />
          <div className="absolute right-[18%] top-[28%] w-px h-[30%] bg-gradient-to-b from-transparent via-off-white/6 to-transparent" />
        </div>

        {/* RIGHT — Details */}
        <div className="bg-ink2 flex flex-col justify-center px-[clamp(40px,6vw,100px)] py-[clamp(60px,6vw,100px)] lg:pr-[clamp(60px,8vw,140px)] border-l border-gold/8">
          <Reveal>
            <p className="text-[11px] tracking-[0.28em] uppercase text-gold/70 mb-2 font-medium">
              Design {design.letter}
            </p>
            <p className="text-[12px] tracking-[4px] uppercase text-off-white/50 mb-8">
              300ml · {design.bottle}
            </p>
          </Reveal>

          <Reveal as="h2" className="font-serif text-[clamp(38px,5vw,68px)] font-normal leading-[1.14] mb-4" delay={revealDelays.d1}>
            {design.name.replace("\n", " ")}
          </Reveal>

          <Reveal className="w-[36px] h-px bg-gold/30 my-7" delay={revealDelays.d1} />

          <Reveal as="p" className="font-serif text-[clamp(18px,2.2vw,24px)] italic text-gold-lt/74 mb-10 leading-[1.75]" delay={revealDelays.d2}>
            &ldquo;{design.subtitle}&rdquo;
          </Reveal>

          <Reveal className="flex items-center gap-6 mb-12" delay={revealDelays.d2}>
            <span className="font-jp text-[clamp(42px,5vw,58px)] font-light text-gold/72">
              {design.virtueJp}
            </span>
            <div className="h-12 w-px bg-gold/20" />
            <div>
              <p className="text-[10px] tracking-[4px] uppercase text-off-white/45 mb-1.5">
                Bushido Virtue
              </p>
              <p className="font-serif text-[clamp(18px,2vw,24px)] italic text-off-white/80">
                {design.virtue}
              </p>
            </div>
          </Reveal>

          {/* Tasting */}
          <Reveal className="border-t border-gold/12 pt-8 mb-10" delay={revealDelays.d3}>
            <p className="text-[10px] tracking-[4px] uppercase text-gold/50 mb-3 font-normal">Tasting Notes</p>
            <p className="font-serif text-[clamp(16px,1.7vw,19px)] italic text-off-white/70 leading-[1.9]">
              {design.tastingNote}
            </p>
          </Reveal>

          {/* Specs */}
          <Reveal className="flex gap-12" delay={revealDelays.d3}>
            {[
              ["Volume", "300ml"],
              ["Cap Seal", design.capSeal],
              ["Class", "純米大吟醸"],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[10px] tracking-[3px] uppercase text-off-white/40 mb-1.5">{k}</p>
                <p className="font-serif text-[15px] text-off-white/75">{v}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          SECTION 3 — Full-bleed quote
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
          <Reveal as="p" className="text-[11px] tracking-[6px] uppercase text-gold/60 mb-6 font-normal">
            The Story
          </Reveal>
          <Reveal className="w-[36px] h-px bg-gold/35 mb-10" delay={revealDelays.d1} />
          <Reveal as="p" className="font-serif text-[clamp(20px,2.8vw,32px)] font-light leading-[2] text-off-white/80 max-w-[720px] italic" delay={revealDelays.d1}>
            {design.descriptionEn[0]}
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          SECTION 4 — Story bilingual
          ============================================================ */}
      <section className="border-t border-gold/8">
        <div className="max-w-[1100px] mx-auto px-[clamp(32px,5vw,80px)] py-[clamp(80px,10vw,140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(48px,7vw,120px)]">
            <div>
              <Reveal as="p" className="text-[11px] tracking-[5px] uppercase text-gold/60 mb-6 font-normal">
                The Story
              </Reveal>
              <Reveal className="w-[28px] h-px bg-gold/30 mb-10" delay={revealDelays.d1} />
              {design.descriptionEn.slice(1).map((p, i) => (
                <Reveal
                  key={i}
                  as="p"
                  className="text-[clamp(15px,1.7vw,18px)] leading-[2] text-off-white/75 mb-7 font-serif font-light"
                  delay={i > 0 ? revealDelays.d1 : 0}
                >
                  {p}
                </Reveal>
              ))}
            </div>
            <div className="lg:border-l lg:border-gold/8 lg:pl-[clamp(36px,5vw,72px)]">
              <Reveal as="p" className="text-[11px] tracking-[5px] uppercase text-gold/60 mb-6 font-jp">
                物語
              </Reveal>
              <Reveal className="w-[28px] h-px bg-gold/30 mb-10" delay={revealDelays.d1} />
              {design.descriptionJp.map((p, i) => (
                <Reveal
                  key={i}
                  as="p"
                  className="text-[clamp(14px,1.5vw,17px)] leading-[2.2] text-off-white/70 mb-8 font-jp font-light whitespace-pre-line"
                  delay={i > 0 ? revealDelays.d1 : 0}
                >
                  {p}
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 5 — Collection strip
          ============================================================ */}
      <section className="border-t border-gold/8 bg-ink2">
        <div className="max-w-[1400px] mx-auto px-[clamp(24px,4vw,48px)] py-[clamp(64px,8vw,110px)]">
          <Reveal as="p" className="text-[11px] tracking-[5px] uppercase text-gold/55 mb-12 text-center font-normal">
            Explore the Collection
          </Reveal>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 sm:gap-5">
            {bushidoDesigns.map((d) => {
              const strip = (
                <>
                  <div className="relative aspect-[2/5] overflow-hidden mb-3">
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
                    <p className={`text-[11px] tracking-[3px] uppercase font-normal transition-colors duration-500 ${
                      d.slug === slug ? "text-gold/80" : "text-off-white/35 group-hover:text-gold/70"
                    }`}>
                      {d.letter}
                    </p>
                    <p className={`text-[9px] tracking-[1px] uppercase mt-1 transition-colors duration-500 ${
                      d.slug === slug ? "text-off-white/60" : "text-off-white/20 group-hover:text-off-white/50"
                    }`}>
                      {d.name.replace("\n", " ")}
                    </p>
                  </div>
                </>
              );
              if (reduceMotion) {
                return (
                  <Link
                    href={`/bushido/${d.slug}`}
                    key={d.letter}
                    className={`group no-underline block transition-all duration-700 ${
                      d.slug === slug ? "opacity-100" : "opacity-45 hover:opacity-100"
                    }`}
                  >
                    {strip}
                  </Link>
                );
              }
              return (
                <MotionLink
                  href={`/bushido/${d.slug}`}
                  key={d.letter}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: d.slug === slug ? 1 : 0.45, y: 0 }}
                  whileHover={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0.08 }}
                  transition={{ duration: 0.9, ease: revealEase }}
                  className="group no-underline block transition-all duration-700"
                >
                  {strip}
                </MotionLink>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 6 — Prev / Next
          ============================================================ */}
      <section className="border-t border-gold/8">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {[
            { d: prev, label: "Previous", dir: "←" },
            { d: next, label: "Next", dir: "→" },
          ].map(({ d, label, dir }) => (
            <Link
              key={d.slug}
              href={`/bushido/${d.slug}`}
              className="group no-underline relative overflow-hidden h-[40vh] md:h-[50vh] flex items-center justify-center border-b md:border-b-0 md:even:border-l border-gold/8"
            >
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
                <p className="text-[10px] tracking-[4px] uppercase text-off-white/35 mb-3 font-normal">
                  {dir} {label}
                </p>
                <p className="font-serif text-[clamp(26px,4vw,44px)] font-light text-off-white/55 group-hover:text-off-white/90 transition-colors duration-500">
                  {d.name.replace("\n", " ")}
                </p>
                <p className="text-[12px] text-off-white/25 mt-3 font-jp group-hover:text-gold/50 transition-colors duration-500">
                  Design {d.letter} · {d.virtueJp}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gold/6 py-14 text-center bg-ink">
        <Link
          href="/#bushido"
          className="text-[11px] tracking-[4px] uppercase text-off-white/35 no-underline hover:text-gold/60 transition-colors"
        >
          ← Back to Collection
        </Link>
        <div className="mt-8">
          <p className="text-[12px] text-off-white/30 tracking-[2px]">
            Mt. Fuji Sake Project
          </p>
          <p className="text-[11px] text-off-white/20 mt-1 tracking-[1px]">
            By KONDO PHARMACY Co., Ltd.
          </p>
          <Link
            href="/contact"
            className="inline-block text-[10px] tracking-[3px] uppercase text-gold/40 no-underline hover:text-gold/70 transition-colors mt-3"
          >
            Contact →
          </Link>
        </div>
      </footer>
    </main>
  );
}
