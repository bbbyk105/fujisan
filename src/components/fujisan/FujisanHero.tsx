import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { fujisanProducts } from "@/data/fujisan-products";

export default function FujisanHero() {
  return (
    <section
      id="top"
      className="fujisan-paper relative isolate scroll-mt-[86px] overflow-hidden bg-[#FAF5E8] pt-[72px] text-[#0B1A2E] md:pt-[86px]"
    >
      <div className="absolute inset-x-0 top-[72px] z-0 h-[620px] overflow-hidden md:top-[86px] md:h-[650px] lg:h-[675px]">
        <Image
          src="/images/site/mtfuji.png"
          alt="Mt. Fuji at sunrise"
          fill
          priority
          sizes="100vw"
          className="scale-[1.02] object-cover object-[50%_46%] md:object-[50%_44%]"
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#FAF2E4]/92 via-[#FAF2E4]/28 to-[#DCE6EE]/8" />
        <div className="absolute inset-x-0 top-0 h-44 bg-linear-to-b from-[#F9EFE0]/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[260px] bg-linear-to-b from-transparent via-[#FAF5E8]/74 to-[#FAF5E8]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1760px] px-6 pt-10 sm:px-8 md:px-[7vw] md:pt-12 lg:px-[4.5vw] 2xl:px-16">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,730px)_1fr] xl:grid-cols-[minmax(0,820px)_1fr]">
          <div className="max-w-[820px]">
            <h1 className="font-serif leading-[1.08] tracking-[0.02em] text-[#0B1A2E]">
              <span className="block text-[clamp(24px,3vw,42px)] font-medium tracking-[0.07em] xl:whitespace-nowrap">
                THE SPIRIT OF JAPAN,
              </span>
              <span className="mt-2 block text-[clamp(24px,3vw,42px)] font-medium tracking-[0.07em] xl:whitespace-nowrap">
                CRAFTED AT THE FOOT OF
              </span>
              <span className="mt-4 block font-serif text-[clamp(66px,10vw,150px)] font-semibold leading-[0.9] tracking-[0.04em]">
                FUJISAN
              </span>
            </h1>

            <p className="mt-5 font-jp text-[clamp(17px,1.75vw,25px)] font-medium tracking-[0.16em] text-[#1D2432]">
              ー 富士の恵み、伝統の一滴 ー
            </p>

            <p className="mt-5 max-w-[380px] text-[15px] leading-[1.62] text-[#2B2419]/86 md:text-[16px] md:leading-[1.58]">
              From the pure snowmelt of Mt. Fuji
              <br />
              to masterful brewing, discover a sake
              <br />
              collection that embodies Japan&apos;s
              <br />
              heritage and natural beauty.
            </p>
          </div>

          <div className="relative hidden h-[430px] w-[280px] justify-self-end pr-[1.8vw] pt-3 lg:block xl:h-[500px] xl:w-[330px]" aria-hidden>
            <Image
              src="/images/logo/logo-fuji.png"
              alt=""
              fill
              sizes="(min-width: 1280px) 330px, 280px"
              className="fujisan-fuji-logo-image object-contain object-top"
            />
          </div>
        </div>
      </div>

      <div id="showcase" className="relative z-20 mt-8 scroll-mt-[86px] px-2 sm:px-4 md:mt-4 md:px-7 lg:mt-0 xl:mt-10">
        <div className="mx-auto grid max-w-[1330px] grid-cols-3 items-end gap-x-1 gap-y-3 sm:gap-x-3 md:grid-cols-6 md:gap-x-2 lg:gap-x-4 xl:max-w-[1660px] xl:gap-x-6">
          {fujisanProducts.map((p, i) => (
            <Link
              key={`${p.slug}-bottle`}
              href={`/products/${p.slug}`}
              aria-label={`${p.name} ${p.variantLine}`}
              className="group relative flex h-[270px] items-end justify-center overflow-visible no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/60 sm:h-[330px] md:h-[390px] lg:h-[430px] xl:h-[455px]"
              style={{ zIndex: 20 - i }}
            >
              <div
                className="absolute bottom-[4px] left-1/2 h-[116%] w-[330%] -translate-x-1/2 transition-transform duration-500 group-hover:-translate-y-[6px] sm:w-[315%] md:h-[114%] md:w-[302%] lg:h-[112%]"
                aria-hidden
              >
                <div
                  className="fujisan-bottle relative h-full w-full"
                  style={{ animationDelay: `${i * 180}ms` }}
                >
                  <ViewTransition name={`bottle-${p.slug}`} share="morph">
                    <Image
                      src={p.img}
                      alt={`${p.name} ${p.variantLine}`}
                      fill
                      sizes="(min-width: 1024px) 34vw, (min-width: 768px) 42vw, 95vw"
                      className="object-contain object-bottom"
                    />
                  </ViewTransition>
                </div>
              </div>
              <span className="absolute bottom-0 left-1/2 h-5 w-[66%] -translate-x-1/2 rounded-[50%] bg-[#0B1A2E]/18 blur-[10px]" />
            </Link>
          ))}
        </div>
      </div>

      <div className="relative z-20 bg-[#FAF5E8]/92 px-2 pb-8 pt-3 sm:px-4 md:px-7 md:pb-1 md:pt-2">
        <div className="mx-auto grid max-w-[1330px] grid-cols-3 gap-x-1 gap-y-6 sm:gap-x-3 md:grid-cols-6 md:gap-x-2 lg:gap-x-4 xl:max-w-[1660px] xl:gap-x-6">
          {fujisanProducts.map((p) => (
            <Link
              key={`${p.slug}-info`}
              href={`/products/${p.slug}`}
              className="group flex flex-col items-center px-1 text-center no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/60"
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
    </section>
  );
}
