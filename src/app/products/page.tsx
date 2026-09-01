import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { FujisanInnerHero } from "@/components/fujisan/FujisanInnerHero";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { LivePrice } from "@/components/fujisan/LivePrice";
import {
  fujisanProducts,
  primaryVolume,
  isProductSoldOut,
  type FujisanProduct,
} from "@/data/fujisan-products";
import { ShopAddToCart } from "@/components/fujisan/ShopAddToCart";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "Collection — FUJISAN SAKE",
  description:
    "The five bottles of the Bushido series — Shogun, Tenka, Samurai, Ninja, and Kokoro. Grades, tasting notes, serving temperatures, and prices in one place.",
};

function specValue(product: FujisanProduct, label: string) {
  return product.specs.find((s) => s.label === label)?.value ?? "—";
}

function CollectionRow({
  product,
  index,
}: {
  product: FujisanProduct;
  index: number;
}) {
  const reversed = index % 2 === 1;
  const base = primaryVolume(product);
  const multiVolume = product.volumes.length > 1;
  const baseSoldOut = base.soldOut === true;
  const allSoldOut = isProductSoldOut(product);

  const facts = [
    {
      en: "Taste",
      ja: "味わい",
      value: <L en={product.grade} ja={product.gradeJp} />,
    },
    {
      en: "Serving",
      ja: "温度",
      value: <L en={product.serveTemp} ja={product.serveTempJp} />,
    },
    { en: "Polish", ja: "精米歩合", value: specValue(product, "Polish") },
    { en: "SMV", ja: "日本酒度", value: product.smv.replace("SMV ", "") },
  ];

  return (
    <Reveal
      as="article"
      delay={revealDelays.d1}
      className="border-b border-[#0B1A2E]/12"
    >
      <div
        className={`mx-auto grid max-w-[1280px] items-center gap-10 px-7 py-16 md:px-12 md:py-20 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:gap-16 ${
          reversed ? "lg:grid-flow-dense" : ""
        }`}
      >
        {/* ボトル */}
        <Link
          href={`/products/${product.slug}`}
          className={`group relative block no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/60 ${
            reversed ? "lg:col-start-2" : ""
          }`}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-jp text-[clamp(120px,18vw,220px)] font-medium leading-none text-[#0B1A2E]/6"
          >
            {product.variantJp}
          </span>
          <div className="relative mx-auto flex h-[340px] w-full max-w-[300px] items-end justify-center md:h-[460px] md:max-w-[380px] lg:h-[540px] lg:max-w-[440px]">
            <div className="relative h-full w-[62%] transition-transform duration-700 ease-out group-hover:-translate-y-2 md:w-[70%]">
              <ViewTransition name={`bottle-${product.slug}`} share="morph">
                <Image
                  src={product.img}
                  alt={`${product.name} ${product.variant} — ${product.variantLine}`}
                  fill
                  sizes="(min-width: 1024px) 440px, (min-width: 768px) 380px, 60vw"
                  className="object-contain object-bottom"
                />
              </ViewTransition>
            </div>
            <span
              aria-hidden
              className="absolute bottom-2 left-1/2 h-4 w-[46%] -translate-x-1/2 rounded-[50%] bg-[#0B1A2E]/14 blur-[10px]"
            />
          </div>
        </Link>

        {/* 銘柄情報 */}
        <div className={reversed ? "lg:col-start-1 lg:row-start-1" : ""}>
          <div className="flex items-center gap-4">
            <span className="font-serif text-[26px] font-medium leading-none tracking-[0.08em] text-[#0B1A2E]/22">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="h-px w-10 bg-[#C9A84C]/55" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#C9A84C]">
              <L en={product.variantLine} ja={product.variantLineJp} />
            </span>
          </div>

          <h2 className="mt-5 font-serif text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[0.1em] text-[#0B1A2E]">
            {product.variant}
            <span className="ml-4 align-middle font-jp text-[0.5em] font-medium tracking-[0.3em] text-[#C9A84C]">
              {product.variantJp}
            </span>
          </h2>

          <p className="mt-3 font-jp text-[12px] tracking-[0.26em] text-[#0B1A2E]/60">
            <L en={product.title} ja={product.catchJp} />
          </p>

          <p className="mt-6 max-w-[520px] whitespace-pre-line text-[13.5px] font-light leading-[1.9] text-[#2B2419]/78">
            <L en={product.desc} ja={product.descJp} />
          </p>

          <dl className="mt-8 grid max-w-[560px] grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            {facts.map((f) => (
              <div
                key={f.en}
                className="border-t border-[#0B1A2E]/12 pt-3"
              >
                <dt className="text-[9.5px] font-semibold uppercase tracking-[0.28em] text-[#0B1A2E]/50">
                  <L en={f.en} ja={f.ja} />
                </dt>
                <dd className="mt-1.5 text-[12px] leading-[1.5] text-[#0B1A2E]/85">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-1.5">
            {product.volumes.map((v) => (
              <p
                key={v.ml}
                className="font-serif text-[18px] font-semibold tracking-[0.02em] text-[#0B1A2E]"
              >
                <LivePrice slug={product.slug} ml={v.ml} fallback={v.priceJpy} />
                <span className="ml-1.5 align-middle text-[10px] font-medium tracking-[0.14em] text-[#0B1A2E]/70">
                  <L en={`${v.ml}ml · tax incl.`} ja={`${v.ml}ml・税込`} />
                </span>
              </p>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
            {baseSoldOut ? (
              <Link
                href={`/products/${product.slug}`}
                className="inline-flex items-center justify-center gap-2 border border-[#0B1A2E]/25 bg-[#0B1A2E]/6 px-8 py-3.5 text-[10.5px] font-semibold tracking-[0.26em] text-[#0B1A2E]/70 no-underline transition-colors hover:border-[#0B1A2E]/45"
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
                name={`${product.name} ${product.variant}`}
                ml={base.ml}
                className="w-full px-8 sm:w-auto"
              />
            )}

            <Link
              href={`/products/${product.slug}`}
              className="group/cta inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E] no-underline"
            >
              <span className="relative pb-1">
                <L en="VIEW THE BOTTLE" ja="この銘柄を詳しく" />
                <span className="absolute inset-x-0 -bottom-0 h-px bg-[#0B1A2E]/50 transition-all duration-500 group-hover/cta:bg-[#C9A84C]" />
              </span>
              <span
                aria-hidden
                className="transition-transform duration-500 group-hover/cta:translate-x-1 group-hover/cta:text-[#C9A84C]"
              >
                →
              </span>
            </Link>
          </div>

          {!baseSoldOut && multiVolume ? (
            <p className="mt-3 text-[10.5px] tracking-[0.12em] text-[#0B1A2E]/60">
              <L
                ja={`カート追加は ${base.ml}ml。ほかの容量は商品ページからお選びいただけます。`}
                en={`Adds the ${base.ml} ml bottle — other sizes are available on the product page.`}
              />
            </p>
          ) : null}
        </div>
      </div>
    </Reveal>
  );
}

export default function ProductsIndexPage() {
  return (
    <main className="bg-paper text-[#0B1A2E] min-h-screen">
      <FujisanNav />

      <FujisanInnerHero
        eyebrow="COLLECTION · 商品一覧"
        chapter="Ⅱ"
        title="THE BUSHIDO SERIES."
        jp="― 武士道、五つの銘柄 ―"
        lead={
          <L
            en="Five bottles brewed at the foot of Mt. Fuji — from a 40%-polished Junmai Daiginjo to a crisp, dry Honjozo for every evening. Grades, tasting notes, and prices, all in one place."
            ja="富士の麓で醸す、五つの銘柄。精米歩合四十%の純米大吟醸から、日々の食卓に寄り添う辛口の本醸造まで。味わい・温度・価格を、この一覧でご覧いただけます。"
          />
        }
        crumbs={[
          { label: "HOME", href: "/#top" },
          { label: "COLLECTION", href: "/products" },
        ]}
        bgSrc="/images/torii-fuji.webp"
        bgPosition="object-[50%_55%]"
      />

      {/* ===== 銘柄一覧 ===== */}
      <section className="relative bg-paper">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0B1A2E]/15 to-transparent"
        />
        <div className="border-t border-transparent">
          {fujisanProducts.map((p, i) => (
            <CollectionRow key={p.slug} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* ===== 購入導線 ===== */}
      <section className="bg-paper-tint">
        <div className="mx-auto max-w-[1280px] px-7 py-16 md:px-12 md:py-20">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <Reveal className="flex items-center gap-3">
                <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#C9A84C]">
                  Ⅱ.Ⅰ
                </span>
                <span className="h-px w-10 bg-[#C9A84C]/55" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#0B1A2E]/65">
                  PURCHASE · ご購入
                </span>
              </Reveal>
              <Reveal
                as="h2"
                delay={revealDelays.d1}
                className="mt-5 max-w-[560px] font-serif text-[clamp(22px,2.4vw,30px)] font-semibold leading-[1.2] tracking-[0.06em] text-[#0B1A2E]"
              >
                <L
                  en="Found your bottle? Two paths to order."
                  ja="気になる一本が見つかったら。"
                />
              </Reveal>
            </div>

            <Reveal
              delay={revealDelays.d2}
              className="flex flex-wrap items-center gap-x-8 gap-y-4"
            >
              <Link
                href="/shop/personal"
                className="group/btn inline-flex items-center justify-center gap-3 border border-[#0B1A2E] bg-[#0B1A2E] px-8 py-4 text-[10.5px] font-semibold tracking-[0.34em] text-paper-card no-underline transition-colors hover:bg-[#1D2432]"
              >
                <L en="ORDER FOR YOUR TABLE" ja="個人のお客様はこちら" />
                <span
                  aria-hidden
                  className="transition-transform duration-500 group-hover/btn:translate-x-1"
                >
                  →
                </span>
              </Link>
              <Link
                href="/shop/business"
                className="group/link inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E] no-underline"
              >
                <span className="relative pb-1">
                  <L en="FOR TRADE ACCOUNTS" ja="法人・卸のご相談" />
                  <span className="absolute inset-x-0 -bottom-0 h-px bg-[#0B1A2E]/40 transition-all duration-500 group-hover/link:bg-[#C9A84C]" />
                </span>
                <span
                  aria-hidden
                  className="transition-transform duration-500 group-hover/link:translate-x-1 group-hover/link:text-[#C9A84C]"
                >
                  →
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}
