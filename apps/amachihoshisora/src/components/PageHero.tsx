import type { ReactNode } from "react";

type PageHeroProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
};

export default function PageHero({
  eyebrow,
  title,
  description,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-ink px-[clamp(24px,5vw,60px)] pt-32 pb-20 text-off-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.12),transparent_42%)]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="relative mx-auto max-w-[980px] text-center">
        <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-gold/70">
          {eyebrow}
        </p>
        <h1 className="mb-6 font-serif text-[clamp(42px,7vw,88px)] font-normal leading-[1.08]">
          {title}
        </h1>
        <div className="mx-auto mb-8 h-px w-[56px] bg-gold/35" />
        <p className="mx-auto max-w-[680px] text-[clamp(15px,2vw,18px)] font-normal leading-[1.95] text-off-white/68">
          {description}
        </p>
      </div>
    </section>
  );
}
