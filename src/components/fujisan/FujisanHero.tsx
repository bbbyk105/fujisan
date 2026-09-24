import Image from "next/image";
import { fujisanProducts } from "@/data/fujisan-products";
import { FujisanHeroShowcase } from "./FujisanHeroShowcase";
import { FujisanHeroFx } from "./FujisanHeroFx";
import { KineticFujisanTitle } from "./KineticFujisanTitle";
import { L } from "@/i18n/Localized";

export default function FujisanHero() {
  return (
    <section
      id="top"
      className="fujisan-paper relative isolate scroll-mt-[86px] overflow-hidden bg-paper pt-[72px] text-indigo md:pt-[86px]"
    >
      <div className="absolute inset-x-0 top-[72px] z-0 h-[620px] overflow-hidden md:top-[86px] md:h-[650px] lg:h-[675px]">
        <Image
          src="/images/fujisan/hero/mtfuji.webp"
          alt="Mt. Fuji at sunrise"
          fill
          priority
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="fujisan-kenburn object-cover object-[50%_46%] md:object-[50%_44%]"
        />
        <div className="absolute inset-0 bg-linear-to-r from-paper-warm/92 via-paper-warm/28 to-[#DCE6EE]/8" />
        <div className="absolute inset-x-0 top-0 h-44 bg-linear-to-b from-[#F9EFE0]/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[260px] bg-linear-to-b from-transparent via-paper/74 to-paper" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1760px] px-6 pt-10 sm:px-8 md:px-[7vw] md:pt-12 lg:px-[4.5vw] 2xl:px-16">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,730px)_1fr] xl:grid-cols-[minmax(0,820px)_1fr]">
          <div className="max-w-[820px]">
            <h1 className="font-serif leading-[1.08] tracking-[0.02em] text-indigo">
              <L
                en={
                  <>
                    <span
                      className="fujisan-rise block text-[clamp(24px,3vw,42px)] font-medium tracking-[0.07em] xl:whitespace-nowrap"
                      style={{ animationDelay: "120ms" }}
                    >
                      SAKE BREWED
                    </span>
                    <span
                      className="fujisan-rise mt-2 block text-[clamp(24px,3vw,42px)] font-medium tracking-[0.07em] xl:whitespace-nowrap"
                      style={{ animationDelay: "260ms" }}
                    >
                      AT THE FOOT OF
                    </span>
                  </>
                }
                ja={
                  <>
                    <span
                      className="fujisan-rise block font-jp text-[clamp(22px,2.6vw,36px)] font-medium tracking-[0.18em] xl:whitespace-nowrap"
                      style={{ animationDelay: "120ms" }}
                    >
                      富士山の麓で造られた
                    </span>
                    <span
                      className="fujisan-rise mt-2 block font-jp text-[clamp(22px,2.6vw,36px)] font-medium tracking-[0.18em] xl:whitespace-nowrap"
                      style={{ animationDelay: "260ms" }}
                    >
                      日本酒
                    </span>
                  </>
                }
              />
              <KineticFujisanTitle />
            </h1>

            <p
              className="fujisan-rise mt-8 max-w-[440px] text-[15px] leading-[1.62] text-[#2B2419]/86 [word-break:auto-phrase] md:text-[16px] md:leading-[1.58]"
              style={{ animationDelay: "980ms" }}
            >
              <L
                en="The Bushido series, brewed with Mt. Fuji spring water and sake rice from Hyogo and Shizuoka. Five bottles, from Junmai Daiginjo to Tokubetsu Honjozo."
                ja="武士道シリーズは、富士山の湧水と兵庫・静岡の酒米で造る日本酒です。純米大吟醸から特別本醸造まで、5つの銘柄をご用意しています。"
              />
            </p>
          </div>

          <div
            className="fujisan-fade relative hidden h-[430px] w-[280px] justify-self-end pr-[1.8vw] pt-3 lg:block xl:h-[500px] xl:w-[330px]"
            style={{ animationDelay: "1200ms" }}
            aria-hidden
          >
            <Image
              src="/images/logo/logo-fuji.webp"
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

      {/* 演出（GSAP）はこの Client Component だけが担う */}
      <FujisanHeroFx />
    </section>
  );
}
