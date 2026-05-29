"use client";

import Image from "next/image";
import Link from "next/link";
import { ViewTransition, useState } from "react";
import { primaryVolume, type FujisanProduct } from "@/data/fujisan-products";
import { useCart } from "@/lib/cart/useCart";
import { pushToast } from "@/lib/cart/toast-store";
import { L } from "@/i18n/Localized";

const yen = new Intl.NumberFormat("ja-JP");

function ShopBottleCard({ product }: { product: FujisanProduct }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const base = primaryVolume(product);
  const multiVolume = product.volumes.length > 1;

  const onAdd = () => {
    add(product.slug, base.ml, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
    pushToast({
      ja: `${product.name}をカートに追加しました`,
      en: `${product.name} added to your cart`,
      action: { href: "/cart", ja: "カートを見る", en: "VIEW CART" },
    });
  };

  return (
    <article className="group flex flex-col border border-[#0B1A2E]/12 bg-[#F8F3E7] transition-colors hover:border-[#C9A84C]/55">
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
              <span className="ml-1.5 align-middle text-[10px] font-medium tracking-[0.14em] text-[#0B1A2E]/55">
                <L en={`${base.ml}ml · tax incl.`} ja={`${base.ml}ml・税込`} />
              </span>
            </p>
            {multiVolume ? (
              <p className="mt-0.5 text-[10px] tracking-[0.12em] text-[#0B1A2E]/50">
                <L en="Other sizes available" ja="他の容量もあります" />
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onAdd}
          aria-live="polite"
          className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 border border-[#0B1A2E] bg-[#0B1A2E] px-5 py-3 text-[10.5px] font-semibold tracking-[0.26em] text-[#F8F3E7] transition-colors hover:bg-[#1D2432]"
        >
          {added ? (
            <L en="ADDED ✓" ja="追加しました ✓" />
          ) : (
            <>
              <L en="ADD TO CART" ja="カートに追加" />
              <span aria-hidden>+</span>
            </>
          )}
        </button>
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
