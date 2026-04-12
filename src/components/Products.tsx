"use client";

import Image from "next/image";
import { useState } from "react";
import { useReveal } from "@/hooks/useReveal";

const products = [
  {
    edition: "2023 Special Edition",
    name: "Amachi\nHoshisora",
    nameJp: "天地星空　黄金",
    specs: ["720ml", "15% vol", "純米大吟醸"],
    image: "/images/bottle_gold.jpg",
    soldOut: true,
  },
  {
    edition: "2025 Special Edition",
    name: "Amachi\nHoshisora",
    nameJp: "天地星空　蒼穹",
    specs: ["720ml", "15% vol", "純米大吟醸"],
    image: "/images/bottle_blue.jpg",
    soldOut: true,
  },
  {
    edition: "2026 Limited Edition",
    name: "Fuji\nReserve",
    nameJp: "富士山　限定醸造",
    specs: ["720ml", "Limited", "純米大吟醸"],
    image: "/images/bottle_nature.jpg",
    soldOut: false,
  },
];

function ProductCard({
  product,
  index,
}: {
  product: (typeof products)[0];
  index: number;
}) {
  const [showSoldOut, setShowSoldOut] = useState(false);

  const handleClick = () => {
    if (product.soldOut) {
      setShowSoldOut(true);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`reveal ${index === 1 ? "d1" : index === 2 ? "d2" : ""} relative overflow-hidden aspect-[3/4] group ${
        product.soldOut ? "cursor-pointer" : "cursor-default"
      } ${index === 2 ? "sm:max-lg:col-span-2 sm:max-lg:aspect-video" : ""}`}
    >
      <Image
        src={product.image}
        alt={product.edition}
        fill
        className="object-cover brightness-[0.82] contrast-[1.08] transition-all duration-900 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.06] group-hover:brightness-[0.72]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/92 via-ink/28 to-transparent flex flex-col justify-end p-[clamp(20px,3vw,40px)] transition-all duration-400 group-hover:from-ink/96 group-hover:via-ink/50">
        <p className="text-[12px] tracking-[4px] uppercase text-gold font-normal mb-2">
          {product.edition}
        </p>
        <h3 className="font-serif text-[clamp(24px,3.5vw,36px)] font-light leading-[1.1] mb-[6px] whitespace-pre-line">
          {product.name}
        </h3>
        <p className="font-jp text-[14px] font-light tracking-[4px] text-off-white/60 mb-4">
          {product.nameJp}
        </p>
        <div className="flex gap-4 flex-wrap text-[11px] tracking-[2px] uppercase text-off-white/55 border-t border-gold/25 pt-4">
          {product.specs.map((spec) => (
            <span key={spec}>{spec}</span>
          ))}
        </div>
      </div>

      {/* SOLD OUT overlay */}
      {product.soldOut && showSoldOut && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-ink/85 backdrop-blur-[6px] animate-[fadeIn_0.4s_ease-out]"
          onClick={(e) => {
            e.stopPropagation();
            setShowSoldOut(false);
          }}
        >
          <div className="text-center">
            <div className="w-[60px] h-px bg-gold/30 mx-auto mb-6" />
            <p className="font-serif text-[clamp(28px,4vw,44px)] font-light tracking-[8px] text-off-white/90 mb-3">
              SOLD OUT
            </p>
            <p className="text-[11px] tracking-[4px] uppercase text-gold/60 mb-2">
              {product.edition}
            </p>
            <p className="font-jp text-[13px] font-extralight text-off-white/40 mt-4">
              完売いたしました
            </p>
            <div className="w-[60px] h-px bg-gold/30 mx-auto mt-6" />
            <p className="text-[9px] text-off-white/25 mt-4 tracking-[2px]">
              Click to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

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
          <ProductCard key={product.edition} product={product} index={i} />
        ))}
      </div>
    </section>
  );
}
