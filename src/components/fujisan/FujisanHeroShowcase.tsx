import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import type { FujisanProduct } from "@/data/fujisan-products";
import { L } from "@/i18n/Localized";

type Props = {
  products: FujisanProduct[];
};

/**
 * モバイル（6カラム）でのボトル配置。
 * 上段3本は2カラム幅で並べ、下段2本は半カラムずらして上3本の谷間に収める。
 * md 以上は通常の5カラム横並びに戻す。
 */
function stagger(i: number) {
  const base = "col-span-2 md:col-span-1 md:col-start-auto";
  if (i === 3) return `${base} col-start-2`;
  if (i === 4) return `${base} col-start-4`;
  return base;
}

/**
 * ボトルショーケース。Server Component — マークアップのみ。
 * ボトルは opacity-0 で SSR され、出現演出は FujisanHeroFx が担う
 * （reduced-motion 時は FujisanHeroFx が即時に表示へ切り替える）。
 */
export function FujisanHeroShowcase({ products }: Props) {
  return (
    <>
      <div
        id="showcase"
        className="relative z-20 mt-8 scroll-mt-[86px] px-2 sm:px-4 md:mt-4 md:px-7 lg:mt-0 xl:mt-10"
      >
        <div className="mx-auto grid max-w-[1330px] grid-cols-6 items-end gap-x-1 gap-y-3 sm:gap-x-3 md:grid-cols-5 md:gap-x-2 lg:gap-x-4 xl:max-w-[1660px] xl:gap-x-6">
          {products.map((p, i) => (
            <Link
              key={`${p.slug}-bottle`}
              href={`/products/${p.slug}`}
              aria-label={`${p.name} ${p.variantLine}`}
              className={`group relative flex h-[270px] items-end justify-center overflow-visible no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/60 sm:h-[330px] md:h-[390px] lg:h-[430px] xl:h-[455px] ${stagger(i)}`}
              style={{ zIndex: 20 - i }}
            >
              <div
                className="pointer-events-none absolute bottom-[4px] left-1/2 h-[116%] w-[330%] -translate-x-1/2 transition-transform duration-500 group-hover:-translate-y-[6px] sm:w-[315%] md:h-[114%] md:w-[302%] lg:h-[112%]"
                aria-hidden
              >
                <div className="fujisan-bottle-drop relative h-full w-full">
                  <div
                    data-hero-bottle
                    className="relative h-full w-full opacity-0"
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
              <span
                data-hero-shadow
                className="absolute bottom-0 left-1/2 h-5 w-[66%] -translate-x-1/2 rounded-[50%] bg-[#0B1A2E]/18 opacity-0 blur-[10px]"
              />
            </Link>
          ))}
        </div>
      </div>

      <div className="relative z-20 bg-paper/92 px-2 pb-8 pt-3 sm:px-4 md:px-7 md:pb-1 md:pt-2">
        <div className="mx-auto grid max-w-[1330px] grid-cols-6 gap-x-1 gap-y-6 sm:gap-x-3 md:grid-cols-5 md:gap-x-2 lg:gap-x-4 xl:max-w-[1660px] xl:gap-x-6">
          {products.map((p, i) => (
            <Link
              key={`${p.slug}-info`}
              href={`/products/${p.slug}`}
              className={`fujisan-rise group flex flex-col items-center px-1 text-center no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/60 ${stagger(i)}`}
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

      {/* 一覧（/shop/personal）への動線 */}
      <div
        className="fujisan-rise relative z-20 mx-auto flex max-w-[1330px] flex-col items-center gap-4 px-4 pb-8 pt-4 md:flex-row md:justify-center md:gap-8 md:pb-14 md:pt-8 xl:max-w-[1660px]"
        style={{ animationDelay: "1900ms" }}
      >
        <span
          aria-hidden
          className="h-px w-16 bg-[#0B1A2E]/22 md:w-24"
        />
        <Link
          href="/shop/personal"
          className="group/all inline-flex items-center gap-3 border border-[#0B1A2E]/35 bg-paper/65 px-7 py-3.5 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E] no-underline backdrop-blur-sm transition-colors hover:border-[#0B1A2E] hover:bg-[#F1E6CB]/80 hover:text-[#0B1A2E] md:px-9 md:py-4"
        >
          <span className="relative">
            <L en="VIEW THE COLLECTION" ja="銘柄一覧を見る" />
          </span>
          <span
            aria-hidden
            className="transition-transform duration-500 group-hover/all:translate-x-1 group-hover/all:text-[#C9A84C]"
          >
            →
          </span>
        </Link>
        <span
          aria-hidden
          className="h-px w-16 bg-[#0B1A2E]/22 md:w-24"
        />
      </div>
    </>
  );
}
