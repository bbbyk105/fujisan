import Image from "next/image";
import { fujisanProducts } from "@/data/fujisan-products";
import { FujisanHeroShowcase } from "./FujisanHeroShowcase";

export default function FujisanHero() {
  return (
    <section
      id="top"
      className="fujisan-paper relative isolate scroll-mt-[86px] overflow-hidden bg-[#FAF5E8] pt-[72px] text-[#0B1A2E] md:pt-[86px]"
    >
      <div className="absolute inset-x-0 top-[72px] z-0 h-[620px] overflow-hidden md:top-[86px] md:h-[650px] lg:h-[675px]">
        <Image
          src="/images/fujisan/hero/mtfuji.png"
          alt="Mt. Fuji at sunrise"
          fill
          priority
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="fujisan-kenburn object-cover object-[50%_46%] md:object-[50%_44%]"
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#FAF2E4]/92 via-[#FAF2E4]/28 to-[#DCE6EE]/8" />
        <div className="absolute inset-x-0 top-0 h-44 bg-linear-to-b from-[#F9EFE0]/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[260px] bg-linear-to-b from-transparent via-[#FAF5E8]/74 to-[#FAF5E8]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1760px] px-6 pt-10 sm:px-8 md:px-[7vw] md:pt-12 lg:px-[4.5vw] 2xl:px-16">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,730px)_1fr] xl:grid-cols-[minmax(0,820px)_1fr]">
          <div className="max-w-[820px]">
            <h1 className="font-serif leading-[1.08] tracking-[0.02em] text-[#0B1A2E]">
              <span
                className="fujisan-rise block text-[clamp(24px,3vw,42px)] font-medium tracking-[0.07em] xl:whitespace-nowrap"
                style={{ animationDelay: "120ms" }}
              >
                THE SPIRIT OF JAPAN,
              </span>
              <span
                className="fujisan-rise mt-2 block text-[clamp(24px,3vw,42px)] font-medium tracking-[0.07em] xl:whitespace-nowrap"
                style={{ animationDelay: "260ms" }}
              >
                CRAFTED AT THE FOOT OF
              </span>
              <span
                className="fujisan-rise-slow mt-4 block font-serif text-[clamp(66px,10vw,150px)] font-semibold leading-[0.9] tracking-[0.04em]"
                style={{ animationDelay: "420ms" }}
              >
                FUJISAN
              </span>
            </h1>

            <p
              className="fujisan-rise mt-5 font-jp text-[clamp(17px,1.75vw,25px)] font-medium tracking-[0.16em] text-[#1D2432]"
              style={{ animationDelay: "820ms" }}
            >
              ー 富士の恵み、伝統の一滴 ー
            </p>

            <p
              className="fujisan-rise mt-5 max-w-[380px] text-[15px] leading-[1.62] text-[#2B2419]/86 md:text-[16px] md:leading-[1.58]"
              style={{ animationDelay: "980ms" }}
            >
              From the pure snowmelt of Mt. Fuji
              <br />
              to masterful brewing, discover a sake
              <br />
              collection that embodies Japan&apos;s
              <br />
              heritage and natural beauty.
            </p>
          </div>

          <div
            className="fujisan-fade relative hidden h-[430px] w-[280px] justify-self-end pr-[1.8vw] pt-3 lg:block xl:h-[500px] xl:w-[330px]"
            style={{ animationDelay: "1200ms" }}
            aria-hidden
          >
            <Image
              src="/images/logo/logo-fuji.png"
              alt=""
              fill
              fetchPriority="low"
              sizes="(min-width: 1280px) 330px, 280px"
              className="fujisan-fuji-logo-image object-contain object-top"
            />
          </div>
        </div>
      </div>

      <FujisanHeroShowcase products={fujisanProducts} />
    </section>
  );
}
