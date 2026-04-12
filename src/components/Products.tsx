"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

const products = [
  {
    edition: "Gold Edition",
    name: "Amachi\nHoshisora",
    nameJp: "天地星空　黄金",
    specs: ["720ml", "15% vol", "純米大吟醸"],
    image: "/images/bottle_gold.jpg",
  },
  {
    edition: "Blue Edition",
    name: "Amachi\nHoshisora",
    nameJp: "天地星空　蒼穹",
    specs: ["720ml", "15% vol", "純米大吟醸"],
    image: "/images/bottle_blue.jpg",
  },
  {
    edition: "Limited",
    name: "Fuji\nReserve",
    nameJp: "富士山　限定醸造",
    specs: ["720ml", "Limited", "純米大吟醸"],
    image: "/images/bottle_nature.jpg",
  },
];

export default function Products() {
  const ref = useReveal<HTMLElement>();

  return (
    <section className="bg-cream py-[clamp(80px,10vw,140px)]" id="collection" ref={ref}>
      <div className="max-w-[1240px] mx-auto px-[clamp(24px,5vw,60px)]">
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(32px,6vw,80px)] items-end mb-[clamp(48px,6vw,80px)]">
          <div>
            <p className="reveal text-[10px] tracking-[5px] uppercase text-gold-dark font-normal mb-[18px]">
              Collection
            </p>
            <div className="reveal d1 w-[52px] h-px bg-gold-dark mb-9" />
            <h2 className="reveal d1 font-serif text-[clamp(36px,6vw,72px)] font-light leading-[1.05] mb-7 text-ink">
              The <em className="italic text-gold-dark">Hoshisora</em><br />Collection
            </h2>
          </div>
          <p className="reveal d2 text-[clamp(14px,1.8vw,16px)] leading-[1.85] text-ink/62">
            Three expressions of Mt. Fuji&apos;s spirit — the golden warmth of sunrise,
            the blue clarity of alpine twilight, and a limited reserve that captures
            the mountain&apos;s rarest moment.
          </p>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[2px]">
        {products.map((product, i) => (
          <div
            key={product.edition}
            className={`reveal ${i === 1 ? "d1" : i === 2 ? "d2" : ""} relative overflow-hidden aspect-[3/4] cursor-pointer group ${
              i === 2 ? "sm:max-lg:col-span-2 sm:max-lg:aspect-video" : ""
            }`}
          >
            <Image
              src={product.image}
              alt={product.edition}
              fill
              className="object-cover brightness-[0.82] contrast-[1.08] transition-all duration-900 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.06] group-hover:brightness-[0.72]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/92 via-ink/28 to-transparent flex flex-col justify-end p-[clamp(20px,3vw,40px)] transition-all duration-400 group-hover:from-ink/96 group-hover:via-ink/50">
              <p className="text-[10px] tracking-[4px] uppercase text-gold font-normal mb-2">
                {product.edition}
              </p>
              <h3 className="font-serif text-[clamp(22px,3vw,32px)] font-light leading-[1.1] mb-[6px] whitespace-pre-line">
                {product.name}
              </h3>
              <p className="font-jp text-xs font-extralight tracking-[4px] text-off-white/55 mb-4">
                {product.nameJp}
              </p>
              <div className="flex gap-4 flex-wrap text-[10px] tracking-[2px] uppercase text-off-white/45 border-t border-gold/25 pt-4">
                {product.specs.map((spec) => (
                  <span key={spec}>{spec}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
