"use client";

import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import type { FujisanProduct } from "@/data/fujisan-products";

type Props = {
  products: FujisanProduct[];
  /** Desktop column count. Defaults to 5 (used on product detail pages). */
  columns?: 5 | 6;
};

// 商品数で割り切れる列構成にし、最終行に1本だけ取り残されないようにする
const COLUMN_CLASS: Record<5 | 6, string> = {
  5: "md:grid-cols-5",
  6: "md:grid-cols-3 lg:grid-cols-6",
};

export function ProductCollectionBottles({ products, columns = 5 }: Props) {
  return (
    <div
      className={`mt-10 grid grid-cols-3 gap-x-3 gap-y-10 md:gap-x-5 ${COLUMN_CLASS[columns]}`}
    >
      {products.map((p) => (
        <Link
          key={p.slug}
          href={`/products/${p.slug}`}
          className="group no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/60"
        >
          <div className="relative mx-auto flex h-[220px] w-full items-end justify-center overflow-visible md:h-[280px]">
            <div className="fujisan-bottle-drop relative h-[114%] w-[128%]">
              <div className="fujisan-bottle relative h-full w-full animate-none transition-transform duration-500 group-hover:-translate-y-[6px]">
                <ViewTransition name={`bottle-${p.slug}`} share="morph">
                  <Image
                    src={p.img}
                    alt={`${p.name} ${p.variantLine}`}
                    fill
                    fetchPriority="low"
                    sizes="(min-width: 768px) 20vw, 33vw"
                    className="object-contain object-bottom"
                  />
                </ViewTransition>
              </div>
            </div>
            <span className="absolute bottom-0 left-1/2 h-4 w-[52%] -translate-x-1/2 rounded-[50%] bg-[#0B1A2E]/16 blur-[9px]" />
          </div>
          <p className="mt-3 text-center font-serif text-[11px] font-semibold tracking-[0.18em] text-[#0B1A2E] transition-colors group-hover:text-[#C9A84C] md:text-[13px]">
            {p.name}
          </p>
          <p className="mt-1 whitespace-pre-line text-center text-[9px] font-semibold leading-[1.35] tracking-[0.14em] text-[#0B1A2E]/70 md:text-[10px]">
            {p.variant}
          </p>
        </Link>
      ))}
    </div>
  );
}
