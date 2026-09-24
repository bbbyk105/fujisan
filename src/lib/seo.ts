import type { Metadata } from "next";
import { FUJISAN_LEGAL } from "@/data/fujisan-legal";
import type { FujisanProduct } from "@/data/fujisan-products";
import { primaryVolume, isProductSoldOut } from "@/data/fujisan-products";

/**
 * サイト全体の SEO / OGP を組み立てるヘルパー。
 *
 * ページはほぼ静的書き出しなので、正規 URL はビルド時に確定する必要がある。
 * Cloudflare の env（BETTER_AUTH_URL）はリクエスト時にしか引けないため、
 * ここでは build-time の `NEXT_PUBLIC_SITE_URL` を使い、未設定なら本番ドメインに
 * フォールバックする。プレビュー環境で正規 URL を変えたい場合だけ env を設定する。
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sakefujisan.com"
).replace(/\/$/, "");

export const SITE_NAME = "FUJISAN SAKE";

/** OG 画像は全ページ共通の 1 枚（public/images/og/fujisan-og.jpg）。 */
const OG_IMAGE = {
  url: "/images/og/fujisan-og.jpg",
  width: 1200,
  height: 630,
  alt: "FUJISAN SAKE — 富士山麓で醸す日本酒「武士道シリーズ」",
};

type BuildMetadataInput = {
  /** `<title>` に入る文字列。サイト名は自動で付くので渡さない。 */
  title: string;
  description: string;
  /** サイトルートからのパス（"/products" など）。canonical と og:url に使う。 */
  path: string;
  /** 検索結果に出したくないページ（カート・アカウント・管理画面など）。 */
  noIndex?: boolean;
  /** og:type。商品ページなどで上書きする。 */
  type?: "website" | "article";
};

/**
 * ページの Metadata を組み立てる。
 *
 * Next.js では openGraph のような入れ子フィールドは「最後に定義したセグメントが
 * 丸ごと上書きする」ため、layout に置いても各ページの og:title には反映されない。
 * そこで全ページがこのヘルパーを通り、ページごとに完全な OGP を出力する。
 */
export function buildMetadata({
  title,
  description,
  path,
  noIndex,
  type = "website",
}: BuildMetadataInput): Metadata {
  const url = path === "/" ? "/" : path;
  const fullTitle = `${title} — ${SITE_NAME}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: fullTitle,
    description,
    alternates: { canonical: url },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type,
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      locale: "ja_JP",
      alternateLocale: ["en_US"],
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

/** `<script type="application/ld+json">` に流し込む文字列を作る（XSS 対策込み）。 */
export function jsonLdScript(data: unknown): string {
  // `<` をユニコードエスケープして、文字列中の </script> による脱出を防ぐ。
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** 事業者情報。トップページに 1 回だけ出す。 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    legalName: FUJISAN_LEGAL.sellerName,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo/header-logo.webp`,
    email: FUJISAN_LEGAL.email,
    telephone: FUJISAN_LEGAL.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "2-8-21 Yoshiwara",
      addressLocality: "Fuji-shi",
      addressRegion: "Shizuoka",
      postalCode: "417-0051",
      addressCountry: "JP",
    },
  };
}

/**
 * 商品の構造化データ。
 * 在庫は完売フラグから引き、価格は既定 SKU（先頭の容量）を代表値として出す。
 */
export function productJsonLd(product: FujisanProduct) {
  const base = primaryVolume(product);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.name} ${product.variant}（${product.variantJp}）`,
    description: product.descJp.replace(/\n/g, " "),
    image: `${SITE_URL}${product.img}`,
    brand: { "@type": "Brand", name: SITE_NAME },
    manufacturer: { "@type": "Organization", name: FUJISAN_LEGAL.brewer },
    category: product.variantLineJp,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: "JPY",
      price: base.priceJpy,
      // 税込価格をそのまま表示している旨を明示する。
      priceSpecification: {
        "@type": "PriceSpecification",
        price: base.priceJpy,
        priceCurrency: "JPY",
        valueAddedTaxIncluded: true,
      },
      availability: isProductSoldOut(product)
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: FUJISAN_LEGAL.sellerName },
      // 発送は日本国内のみ。
      eligibleRegion: { "@type": "Country", name: "JP" },
    },
  };
}

/** パンくず。各ページの crumbs と同じ並びを渡す。 */
export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
