"use client";

import { Reveal, revealDelays } from "@/components/Reveal";

export default function AmachiPhilosophy() {
  return (
    <div className="bg-ink2 py-[clamp(64px,8vw,100px)] text-center border-t border-b border-gold/12">
      <div className="max-w-[860px] mx-auto px-[clamp(24px,5vw,60px)]">
        <Reveal as="p" className="font-serif text-[clamp(22px,3.5vw,44px)] font-normal italic leading-[1.55] text-gold-lt mb-7">
          &ldquo;Not a sake of battle, but of self-mastery and inner resolve.&rdquo;
        </Reveal>
        <Reveal as="p" className="text-[13px] tracking-[0.28em] uppercase text-silver" delay={revealDelays.d1}>
          The Bushido Code — 武士道
        </Reveal>
        <Reveal as="p" className="font-jp text-[16px] font-normal text-off-white/50 mt-6" delay={revealDelays.d2}>
          義　勇　仁　礼　誠　名誉　忠義
        </Reveal>
      </div>
    </div>
  );
}
