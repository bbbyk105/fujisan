"use client";

import Image from "next/image";
import { Reveal, revealDelays } from "@/components/Reveal";

export default function AmachiStory() {
  return (
    <section id="story">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="relative overflow-hidden min-h-[clamp(320px,50vw,700px)] group">
          <Image
            src="/images/bottle_nature.jpg"
            alt="Sake bottle in nature"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover brightness-[0.88] contrast-[1.05] transition-transform duration-[8s] ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-ink/80 md:bg-gradient-to-r md:from-transparent md:via-[55%] md:to-ink/80 max-md:bg-gradient-to-b max-md:from-transparent max-md:via-[50%] max-md:to-ink/70" />
        </div>

        <div className="bg-ink2 px-[clamp(32px,5vw,80px)] py-[clamp(48px,7vw,100px)] flex flex-col justify-center border-l border-gold/15 max-md:border-l-0 max-md:border-t max-md:border-gold/15">
          <Reveal as="p" className="text-[12px] tracking-[0.3em] uppercase text-gold font-medium mb-[18px]">
            Origin
          </Reveal>
          <Reveal className="w-[52px] h-px bg-gold mb-9" delay={revealDelays.d1} />
          <Reveal as="h2" className="font-serif text-[clamp(38px,6vw,72px)] font-normal leading-[1.12] mb-7" delay={revealDelays.d1}>
            Brewed in<br />the <em className="italic text-gold-lt">shadow</em><br />of Fuji
          </Reveal>
          <Reveal as="p" className="text-[clamp(16px,2vw,19px)] leading-[1.9] text-off-white/80 max-w-[540px]" delay={revealDelays.d2}>
            At the sacred shores of Tanuki Lake, where the reflection of Mount Fuji dissolves
            into the night sky, AMACHI HOSHISORA is born. Each bottle carries the silence
            of the mountain, the clarity of alpine water, and the discipline of a craft
            refined over generations.
          </Reveal>
          <Reveal as="p" className="text-[clamp(16px,2vw,19px)] leading-[1.9] text-off-white/80 max-w-[540px] mt-[18px]" delay={revealDelays.d3}>
            A Junmai Daiginjo of the highest order — not simply sake,
            but a meditation on place, season, and spirit.
          </Reveal>
          <Reveal className="font-jp text-[15px] font-normal leading-[2.25] text-off-white/62 mt-9 pt-9 border-t border-gold/20" delay={revealDelays.d3}>
            富士山の麓、田貫湖のほとりで<br />
            静かに醸される天地星空。<br />
            星空を映す湖面のように<br />
            透明で深い味わいを一滴一滴に込めました。
          </Reveal>
        </div>
      </div>
    </section>
  );
}
