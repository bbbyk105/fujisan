import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { LivePrice } from "@/components/fujisan/LivePrice";
import { SoldOutBadge } from "@/components/fujisan/SoldOutBadge";
import {
  primaryVolume,
  type FujisanProduct,
} from "@/data/fujisan-products";
import { ShopAddToCart } from "./ShopAddToCart";
import { L } from "@/i18n/Localized";

/**
 * 一覧の一本。Server Component — カート追加ボタン（ShopAddToCart）だけが
 * クライアント境界。
 *
 * 枠と地色で囲わない。瓶は和紙の上にそのまま置き、区切りは上の罫だけで作る。
 * 囲むと 5 本が「商品カード」になり、蔵の棚に並んだ見え方が消える。
 */
function ShopBottle({ product }: { product: FujisanProduct }) {
  const base = primaryVolume(product);
  const multiVolume = product.volumes.length > 1;
  // 完売の出し分けは ShopAddToCart（クライアント）が行う。
  // 一覧は静的配信なので、ビルド後に売り切れた SKU をここでは判定できない。
  const volumes = product.volumes.map((v) => ({
    ml: v.ml,
    catalogSoldOut: v.soldOut === true,
  }));

  return (
    <article className="group flex flex-col border-t border-[var(--ed-rule)] pt-8">
      <Link
        href={`/products/${product.slug}`}
        className="no-underline outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        <div className="relative flex h-[250px] w-full items-end justify-center overflow-visible md:h-[290px]">
          <div className="fujisan-bottle-drop relative h-full w-[56%] max-w-[190px]">
            <div className="fujisan-bottle relative h-full w-full transition-transform duration-700 ease-out group-hover:-translate-y-[7px]">
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
          <span
            aria-hidden
            className="absolute bottom-1 left-1/2 h-4 w-[40%] -translate-x-1/2 rounded-[50%] bg-indigo/14 blur-[9px]"
          />
          <SoldOutBadge
            slug={product.slug}
            ml={base.ml}
            catalogSoldOut={base.soldOut === true}
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col pt-7">
        <Link
          href={`/products/${product.slug}`}
          className="no-underline outline-none"
        >
          <h3 className="ed-h3 transition-colors group-hover:text-gold-ink">
            {product.name}
          </h3>
          <p className="ed-small mt-1.5">
            {product.variant.replace(/\n/g, " ")}
            <span aria-hidden className="mx-2 opacity-40">
              /
            </span>
            <L en={product.variantLine} ja={product.variantLineJp} />
          </p>
        </Link>

        <p className="ed-p mt-4 text-[13px] md:text-[13px]">
          <L en={product.title} ja={product.titleJp} />
        </p>

        <div className="mt-auto pt-7">
          <p className="font-serif text-[19px] font-medium tabular-nums tracking-[0.02em] text-indigo">
            <LivePrice
              slug={product.slug}
              ml={base.ml}
              fallback={base.priceJpy}
            />
            <span className="ml-2 align-middle text-[11px] font-normal tracking-[0.06em] text-indigo/60">
              <L en={`${base.ml}ml, tax incl.`} ja={`${base.ml}ml・税込`} />
            </span>
          </p>
          {multiVolume ? (
            <p className="ed-small mt-1">
              <L en="Other sizes available" ja="他の容量もあります" />
            </p>
          ) : null}
        </div>

        <ShopAddToCart
          slug={product.slug}
          name={product.name}
          ml={base.ml}
          volumes={volumes}
        />
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
    <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <ShopBottle key={p.slug} product={p} />
      ))}
    </div>
  );
}
