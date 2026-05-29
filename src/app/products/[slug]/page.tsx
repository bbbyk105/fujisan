import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import ProductPurchaseBlock from "@/components/fujisan/ProductPurchaseBlock";
import { ProductCollectionBottles } from "@/components/fujisan/ProductCollectionBottles";
import { ProductHeroBottle } from "@/components/fujisan/ProductHeroBottle";
import {
  fujisanProducts,
  getFujisanProductBySlug,
} from "@/data/fujisan-products";
import { FUJISAN_LEGAL } from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";

type Params = { slug: string };

const SPEC_LABEL_JP: Record<string, string> = {
  Class: "種別",
  Rice: "原料米",
  Polish: "精米歩合",
  ABV: "アルコール度数",
  SMV: "日本酒度",
  Acidity: "酸度",
  Volume: "容量",
  Ingredients: "原材料",
  "Amino Acid": "アミノ酸度",
  Yeast: "酵母",
};

function specLabelJp(label: string) {
  return SPEC_LABEL_JP[label] ?? label;
}

// 静的に全商品ページを書き出して Worker の CPU 制限（1102）を踏まないようにする
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return fujisanProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = getFujisanProductBySlug(slug);
  if (!product) return { title: "FUJISAN SAKE" };
  return {
    title: `${product.name} ${product.variant} ${product.variantJp} — ${product.variantLine} — FUJISAN SAKE`,
    description: product.desc.replace(/\n/g, " "),
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = getFujisanProductBySlug(slug);
  if (!product) notFound();

  const idx = fujisanProducts.findIndex((p) => p.slug === slug);
  const prev =
    fujisanProducts[
      (idx - 1 + fujisanProducts.length) % fujisanProducts.length
    ];
  const next = fujisanProducts[(idx + 1) % fujisanProducts.length];
  const others = fujisanProducts.filter((p) => p.slug !== slug);

  return (
    <main className="bg-[#FAF5E8] text-[#0B1A2E] min-h-screen">
      <FujisanNav />

      {/* ===== Hero ===== */}
      <section className="fujisan-paper relative isolate scroll-mt-[86px] overflow-hidden bg-[#FAF5E8] pt-[86px]">
        <div className="absolute inset-x-0 top-[86px] z-0 h-[520px] overflow-hidden md:h-[600px]">
          <Image
            src="/images/fujisan/hero/mtfuji.png"
            alt=""
            fill
            priority
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className="scale-[1.04] object-cover object-[50%_44%]"
          />
          <div className="absolute inset-0 bg-linear-to-r from-[#FAF2E4]/94 via-[#FAF2E4]/34 to-[#DCE6EE]/8" />
          <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-[#F9EFE0]/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[220px] bg-linear-to-b from-transparent via-[#FAF5E8]/76 to-[#FAF5E8]" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-6 pb-4 pt-8 sm:px-8 md:grid-cols-[1.1fr_1fr] md:gap-12 md:px-[6vw] md:pb-0 md:pt-14 lg:px-[4.5vw] lg:pt-16 2xl:px-16">
          <div className="max-w-[620px]">
            <Link
              href="/#showcase"
              className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.24em] text-[#0B1A2E]/70 no-underline transition-colors hover:text-[#C9A84C]"
            >
              <span aria-hidden>←</span> <L en="OUR SAKE" ja="日本酒一覧へ" />
            </Link>

            <p className="mt-5 font-serif text-[12px] font-semibold tracking-[0.28em] text-[#C9A84C]">
              <L
                en={product.variantLine.toUpperCase()}
                ja={product.variantLineJp}
              />
            </p>

            <h1 className="mt-3 font-serif leading-[0.95] tracking-[0.02em] text-[#0B1A2E]">
              <span className="block text-[clamp(36px,4.6vw,60px)] font-medium tracking-[0.06em] text-[#1D2432]/80">
                {product.name}
              </span>
              <span className="mt-2 block text-[clamp(40px,6vw,84px)] font-semibold tracking-[0.04em]">
                <L en={product.variant} ja={product.variantJp} />
              </span>
              <span className="mt-2 block font-jp text-[clamp(13px,1.1vw,15px)] font-semibold tracking-[0.34em] text-[#C9A84C]">
                <L en={product.variantJp} ja={product.variant} />
              </span>
            </h1>

            <p className="mt-6 font-jp text-[clamp(16px,1.4vw,20px)] font-medium tracking-[0.16em] text-[#1D2432]">
              ー {product.catchJp} ー
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <span className="border border-[#0B1A2E]/30 bg-white/64 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-[#0B1A2E]">
                {product.smv}
              </span>
              <span className="border border-[#0B1A2E]/30 bg-white/64 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-[#0B1A2E]">
                <L en={product.grade.toUpperCase()} ja={product.gradeJp} />
              </span>
            </div>

            <p className="mt-7 max-w-[460px] whitespace-pre-line font-serif text-[clamp(18px,1.8vw,24px)] italic leading-[1.55] text-[#0B1A2E]/88">
              <L en={product.hero} ja={product.heroJp} />
            </p>

            <p className="mt-5 max-w-[460px] whitespace-pre-line text-[15px] leading-[1.65] text-[#2B2419]/78 md:text-[16px]">
              <L en={product.desc} ja={product.descJp} />
            </p>
          </div>

          <div className="relative flex h-[440px] items-end justify-center md:h-[620px] lg:h-[680px]">
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-[68%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[#C9A84C]/16 blur-[60px]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[54%] select-none font-jp text-[clamp(160px,24vw,320px)] font-light text-[#0B1A2E]/[0.06]"
            >
              富士
            </span>
            <ProductHeroBottle
              slug={product.slug}
              src={product.img}
              alt={`${product.name} ${product.variantLine}`}
            />
            <span className="absolute bottom-6 left-1/2 h-6 w-[58%] -translate-x-1/2 rounded-[50%] bg-[#0B1A2E]/22 blur-[14px]" />
          </div>
        </div>
      </section>

      {/* ===== Story (dark panel) ===== */}
      <section className="fujisan-dark-panel relative bg-[#122337] text-[#EAD9B5]">
        <div className="mx-auto max-w-[760px] px-7 py-16 md:px-12 md:py-24">
          {/* EN locale */}
          <div className="i18n-en">
            <p className="font-serif text-[11px] font-semibold tracking-[0.3em] text-[#D7B46A]">
              THE STORY
            </p>
            <div className="mt-4 h-px w-8 bg-[#D7B46A]/60" />
            {product.storyEn.map((para, i) => (
              <p
                key={i}
                className="mt-6 font-serif text-[clamp(15px,1.4vw,17px)] leading-[1.85] text-[#F2E4C7]/86"
              >
                {para}
              </p>
            ))}
          </div>
          {/* JA locale */}
          <div className="i18n-ja">
            <p className="font-jp text-[11px] font-semibold tracking-[0.3em] text-[#D7B46A]">
              物語
            </p>
            <div className="mt-4 h-px w-8 bg-[#D7B46A]/60" />
            {product.storyJp.map((para, i) => (
              <p
                key={i}
                className="mt-6 whitespace-pre-line font-jp text-[clamp(14px,1.25vw,15.5px)] leading-[2] text-[#F2E4C7]/82"
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Purchase block (price · 年齢確認 · 未成年防止表示) ===== */}
      <ProductPurchaseBlock
        slug={product.slug}
        productName={product.name}
        variant={product.variant}
        variantJp={product.variantJp}
        variantLine={product.variantLine}
        volumes={product.volumes}
        shippingNote={FUJISAN_LEGAL.shippingFeeNote}
        shippingNoteEn={FUJISAN_LEGAL.shippingFeeNoteEn}
      />

      {/* ===== Specs + Pairing ===== */}
      <section className="bg-[#FAF5E8]">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-7 py-16 md:grid-cols-[1.1fr_1fr] md:gap-14 md:px-12 md:py-20">
          <div>
            <p className="font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/66">
              <L en="SPECIFICATIONS" ja="商品仕様" />
            </p>
            <div className="mt-4 h-px w-8 bg-[#0B1A2E]/30" />
            <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
              {product.specs.map((s) => (
                <div key={s.label}>
                  <dt className="text-[10px] font-semibold tracking-[0.2em] text-[#0B1A2E]/56">
                    <L en={s.label.toUpperCase()} ja={specLabelJp(s.label)} />
                  </dt>
                  <dd className="mt-1.5 font-serif text-[17px] text-[#0B1A2E]">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="md:border-l md:border-[#0B1A2E]/12 md:pl-14">
            <p className="font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/66">
              <L en="SERVING" ja="飲み方" />
            </p>
            <div className="mt-4 h-px w-8 bg-[#0B1A2E]/30" />
            <p className="mt-7 text-[10px] font-semibold tracking-[0.2em] text-[#0B1A2E]/56">
              <L en="SUGGESTED TEMPERATURE" ja="おすすめ温度" />
            </p>
            <p className="mt-2 font-serif text-[18px] text-[#0B1A2E]">
              <L en={product.serveTemp} ja={product.serveTempJp} />
            </p>
          </div>
        </div>
      </section>

      {/* ===== Collection strip ===== */}
      <section className="border-t border-[#0B1A2E]/10 bg-[#FAF5E8]">
        <div className="mx-auto max-w-[1280px] px-7 py-14 md:px-12 md:py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/66">
                <L en="THE COLLECTION" ja="ザ・コレクション" />
              </p>
              <h2 className="mt-3 font-serif text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[0.06em] text-[#0B1A2E]">
                <L en="Explore other Fujisan" ja="他の富士山シリーズを見る" />
              </h2>
            </div>
            <Link
              href="/shop/personal"
              className="group/all inline-flex shrink-0 items-center gap-2.5 text-[11px] font-semibold tracking-[0.22em] text-[#0B1A2E]/70 no-underline"
            >
              <span className="relative pb-1">
                <L en="VIEW ALL" ja="一覧を見る" />
                <span className="absolute inset-x-0 bottom-0 h-px bg-[#0B1A2E]/35 transition-colors duration-500 group-hover/all:bg-[#C9A84C]" />
              </span>
              <span
                aria-hidden
                className="transition-transform duration-500 group-hover/all:translate-x-1 group-hover/all:text-[#C9A84C]"
              >
                →
              </span>
            </Link>
          </div>

          <ProductCollectionBottles products={others} />
        </div>
      </section>

      {/* ===== Prev / Next ===== */}
      <section className="border-t border-[#0B1A2E]/10 bg-[#F4ECD9]">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 md:grid-cols-2">
          {[
            {
              p: prev,
              labelEn: "PREVIOUS",
              labelJa: "前の銘柄",
              arrow: "←",
              align: "left" as const,
            },
            {
              p: next,
              labelEn: "NEXT",
              labelJa: "次の銘柄",
              arrow: "→",
              align: "right" as const,
            },
          ].map(({ p, labelEn, labelJa, arrow, align }) => (
            <Link
              key={p.slug}
              href={`/products/${p.slug}`}
              className={`group flex flex-col gap-2 border-[#0B1A2E]/10 px-7 py-10 no-underline transition-colors hover:bg-[#FAF5E8] md:px-12 md:py-14 ${
                align === "right"
                  ? "md:items-end md:text-right md:border-l"
                  : "md:items-start border-b md:border-b-0"
              }`}
            >
              <span className="text-[10px] font-semibold tracking-[0.28em] text-[#0B1A2E]/60">
                <L
                  en={
                    align === "left"
                      ? `${arrow} ${labelEn}`
                      : `${labelEn} ${arrow}`
                  }
                  ja={
                    align === "left"
                      ? `${arrow} ${labelJa}`
                      : `${labelJa} ${arrow}`
                  }
                />
              </span>
              <span className="font-serif text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[0.04em] text-[#0B1A2E] group-hover:text-[#C9A84C]">
                {p.name} <L en={p.variant} ja={p.variantJp} />
              </span>
              <span className="text-[11px] font-semibold tracking-[0.16em] text-[#0B1A2E]/72">
                <L en={p.variantLine} ja={p.variantLineJp} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== Footer (shared · 未成年防止表示 + 酒類販売管理者標識を含む) ===== */}
      <FujisanFooter />
    </main>
  );
}
