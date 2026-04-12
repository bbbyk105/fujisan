"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

export default function Story() {
  const ref = useReveal<HTMLElement>();

  return (
    <section id="story" ref={ref}>
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Image */}
        <div className="relative overflow-hidden min-h-[clamp(320px,50vw,700px)] group">
          <Image
            src="/images/bottle_nature.jpg"
            alt="Sake bottle in nature"
            fill
            className="object-cover brightness-[0.88] contrast-[1.05] transition-transform duration-[8s] ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-ink/80 md:bg-gradient-to-r md:from-transparent md:via-[55%] md:to-ink/80 max-md:bg-gradient-to-b max-md:from-transparent max-md:via-[50%] max-md:to-ink/70" />
        </div>

        {/* Text */}
        <div className="bg-ink2 px-[clamp(32px,5vw,80px)] py-[clamp(48px,7vw,100px)] flex flex-col justify-center border-l border-gold/15 max-md:border-l-0 max-md:border-t max-md:border-gold/15">
          <p className="reveal text-[12px] tracking-[5px] uppercase text-gold font-normal mb-[18px]">
            Origin
          </p>
          <div className="reveal d1 w-[52px] h-px bg-gold mb-9" />
          <h2 className="reveal d1 font-serif text-[clamp(38px,6vw,72px)] font-light leading-[1.05] mb-7">
            Brewed in<br />the <em className="italic text-gold-lt">shadow</em><br />of Fuji
          </h2>
          <p className="reveal d2 text-[clamp(16px,2vw,19px)] leading-[1.85] text-off-white/78 max-w-[540px]">
            At the sacred shores of Tanuki Lake, where the reflection of Mount Fuji dissolves
            into the night sky, AMACHI HOSHISORA is born. Each bottle carries the silence
            of the mountain, the clarity of alpine water, and the discipline of a craft
            refined over generations.
          </p>
          <p className="reveal d3 text-[clamp(16px,2vw,19px)] leading-[1.85] text-off-white/78 max-w-[540px] mt-[18px]">
            A Junmai Daiginjo of the highest order — not simply sake,
            but a meditation on place, season, and spirit.
          </p>
          <div className="reveal d3 font-jp text-[15px] font-light leading-[2.2] text-off-white/58 mt-9 pt-9 border-t border-gold/20">
            富士山の麓、田貫湖のほとりで<br />
            静かに醸される天地星空。<br />
            星空を映す湖面のように<br />
            透明で深い味わいを一滴一滴に込めました。
          </div>
        </div>
      </div>
    </section>
  );
}
