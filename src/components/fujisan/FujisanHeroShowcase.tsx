"use client";

import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import type { FujisanProduct } from "@/data/fujisan-products";

type Props = {
  products: FujisanProduct[];
};

/** View Transition とホバー演出が必要なボトルショーケース（クライアント境界） */
export function FujisanHeroShowcase({ products }: Props) {
  return (
    <>
      <div
        id="showcase"
        className="relative z-20 mt-8 scroll-mt-[86px] px-2 sm:px-4 md:mt-4 md:px-7 lg:mt-0 xl:mt-10"
      >
        <div className="mx-auto grid max-w-[1330px] grid-cols-3 items-end gap-x-1 gap-y-3 sm:gap-x-3 md:grid-cols-6 md:gap-x-2 lg:gap-x-4 xl:max-w-[1660px] xl:gap-x-6">
          {products.map((p, i) => (
            <Link
              key={`${p.slug}-bottle`}
              href={`/products/${p.slug}`}
              aria-label={`${p.name} ${p.variantLine}`}
              className="group relative flex h-[270px] items-end justify-center overflow-visible no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/60 sm:h-[330px] md:h-[390px] lg:h-[430px] xl:h-[455px]"
              style={{ zIndex: 20 - i }}
            >
              <div
                className="pointer-events-none absolute bottom-[4px] left-1/2 h-[116%] w-[330%] -translate-x-1/2 transition-transform duration-500 group-hover:-translate-y-[6px] sm:w-[315%] md:h-[114%] md:w-[302%] lg:h-[112%]"
                aria-hidden
              >
                <div className="fujisan-bottle-drop relative h-full w-full">
                  <div
                    className="fujisan-bottle relative h-full w-full"
                    style={{
                      animationDelay: `${800 + i * 150}ms, ${2300 + i * 150}ms`,
                    }}
                  >
                    <ViewTransition name={`bottle-${p.slug}`} share="morph">
                      <Image
                        src={p.img}
                        alt={`${p.name} ${p.variantLine}`}
                        fill
                        fetchPriority="low"
                        sizes="(min-width: 1024px) 34vw, (min-width: 768px) 42vw, 95vw"
                        className="object-contain object-bottom"
                      />
                    </ViewTransition>
                  </div>
                </div>
              </div>
              <span className="absolute bottom-0 left-1/2 h-5 w-[66%] -translate-x-1/2 rounded-[50%] bg-[#0B1A2E]/18 blur-[10px]" />
            </Link>
          ))}
        </div>
      </div>

      <div className="relative z-20 bg-[#FAF5E8]/92 px-2 pb-8 pt-3 sm:px-4 md:px-7 md:pb-1 md:pt-2">
        <div className="mx-auto grid max-w-[1330px] grid-cols-3 gap-x-1 gap-y-6 sm:gap-x-3 md:grid-cols-6 md:gap-x-2 lg:gap-x-4 xl:max-w-[1660px] xl:gap-x-6">
          {products.map((p, i) => (
            <Link
              key={`${p.slug}-info`}
              href={`/products/${p.slug}`}
              className="fujisan-rise group flex flex-col items-center px-1 text-center no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/60"
              style={{ animationDelay: `${1400 + i * 120}ms` }}
            >
              <p className="font-serif text-[12px] font-semibold tracking-[0.16em] text-[#0B1A2E] transition-colors duration-300 group-hover:text-[#C9A84C] md:text-[15px] md:tracking-[0.18em]">
                {p.name}
              </p>
              <p className="mt-1 whitespace-pre-line text-[9px] font-semibold leading-[1.35] tracking-[0.13em] text-[#0B1A2E]/80 md:text-[10px] md:tracking-[0.16em]">
                {p.variant}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
