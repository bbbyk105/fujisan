import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import {
  primaryVolume,
  isProductSoldOut,
  type FujisanProduct,
} from "@/data/fujisan-products";
import { ShopAddToCart } from "./ShopAddToCart";
import { L } from "@/i18n/Localized";

const yen = new Intl.NumberFormat("ja-JP");

/**
 * 一覧カード。Server Component — カート追加ボタン（ShopAddToCart）だけが
 * クライアント境界。
 */
function ShopBottleCard({ product }: { product: FujisanProduct }) {
  const base = primaryVolume(product);
  const multiVolume = product.volumes.length > 1;
  // 既定 SKU（表示中の容量）が完売か / 全 SKU が完売か。
  const baseSoldOut = base.soldOut === true;
  const allSoldOut = isProductSoldOut(product);

  return (
    <article className="group flex flex-col border border-[#0B1A2E]/12 bg-paper-card transition-colors hover:border-[#C9A84C]/55">
      <Link
        href={`/products/${product.slug}`}
        className="no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/60"
      >
        <div className="relative flex h-[260px] w-full items-end justify-center overflow-visible pt-7 md:h-[300px]">
          <div className="fujisan-bottle-drop relative h-[104%] w-[58%] max-w-[200px]">
            <div className="fujisan-bottle relative h-full w-full transition-transform duration-500 group-hover:-translate-y-[6px]">
              <ViewTransition name={`bottle-${product.slug}`} share="morph">
                <Image
                  src={product.img}
                  alt={`${product.name} ${product.variantLine}`}
                  fill
                  fetchPriority="low"
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                  className="object-contain object-bottom"
                />
              </ViewTransition>
            </div>
          </div>
          <span className="absolute bottom-3 left-1/2 h-4 w-[42%] -translate-x-1/2 rounded-[50%] bg-[#0B1A2E]/16 blur-[9px]" />
          {baseSoldOut ? (
            <span className="absolute left-4 top-4 border border-crimson/40 bg-paper-card/90 px-2.5 py-1 text-[9px] font-semibold tracking-[0.22em] text-crimson">
              <L en="SOLD OUT" ja="完売" />
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-2 md:px-7">
        <Link
          href={`/products/${product.slug}`}
          className="no-underline outline-none"
        >
          <h3 className="font-serif text-[15px] font-semibold tracking-[0.14em] text-[#0B1A2E] transition-colors group-hover:text-[#C9A84C]">
            {product.name}
          </h3>
          <p className="mt-1 whitespace-pre-line text-[10px] font-semibold leading-[1.4] tracking-[0.16em] text-[#0B1A2E]/65">
            {product.variant.replace(/\n/g, " ")}
            <span className="mx-1.5 text-[#0B1A2E]/30">·</span>
            <L
              en={product.variantLine}
              ja={product.variantLineJp}
            />
          </p>
        </Link>

        <p className="mt-3 text-[12px] leading-[1.6] text-[#1D2432]/72">
          <L en={product.title} ja={product.titleJp} />
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="font-serif text-[20px] font-semibold tracking-[0.02em] text-[#0B1A2E]">
              ¥{yen.format(base.priceJpy)}
              <span className="ml-1.5 align-middle text-[10px] font-medium tracking-[0.14em] text-[#0B1A2E]/75">
                <L en={`${base.ml}ml · tax incl.`} ja={`${base.ml}ml・税込`} />
              </span>
            </p>
            {multiVolume ? (
              <p className="mt-0.5 text-[10px] tracking-[0.12em] text-[#0B1A2E]/70">
                <L en="Other sizes available" ja="他の容量もあります" />
              </p>
            ) : null}
          </div>
        </div>

        {baseSoldOut ? (
          <Link
            href={`/products/${product.slug}`}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-[#0B1A2E]/25 bg-[#0B1A2E]/6 px-5 py-3.5 text-[10.5px] font-semibold tracking-[0.26em] text-[#0B1A2E]/70 no-underline transition-colors hover:border-[#0B1A2E]/45"
          >
            {allSoldOut ? (
              <L en="SOLD OUT" ja="完売しました" />
            ) : (
              <>
                <L en="OTHER SIZES" ja="他の容量を見る" />
                <span aria-hidden>→</span>
              </>
            )}
          </Link>
        ) : (
          <ShopAddToCart
            slug={product.slug}
            name={product.name}
            ml={base.ml}
          />
        )}
      </div>
    </article>
  );
}

export function ShopCollectionGrid({
  products,
}: {
  products: FujisanProduct[];
}) {
  return (
    <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
      {products.map((p) => (
        <ShopBottleCard key={p.slug} product={p} />
      ))}
    </div>
  );
}
