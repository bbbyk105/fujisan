import type { MetadataRoute } from "next";
import { fujisanProducts } from "@/data/fujisan-products";
import { fujisanCraftPillars } from "@/data/fujisan-craft";
import { SITE_URL } from "@/lib/seo";

/**
 * 公開ページのサイトマップ。
 *
 * 収録するのは「検索結果に出てよい静的ページ」だけ。
 * カート・ログイン・アカウント・管理画面・決済完了は載せない
 * （それぞれ noindex 指定済み、または個人ごとの内容で意味がないため）。
 *
 * i18n は URL を分けず CSS で切り替える方式なので、日英で別 URL は生えない。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticPaths: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }> = [
    { path: "/", priority: 1, changeFrequency: "monthly" },
    { path: "/products", priority: 0.9, changeFrequency: "monthly" },
    { path: "/shop", priority: 0.8, changeFrequency: "monthly" },
    { path: "/shop/personal", priority: 0.8, changeFrequency: "monthly" },
    { path: "/shop/business", priority: 0.8, changeFrequency: "monthly" },
    { path: "/stories", priority: 0.7, changeFrequency: "yearly" },
    { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
    { path: "/faq", priority: 0.5, changeFrequency: "yearly" },
    { path: "/shipping", priority: 0.5, changeFrequency: "yearly" },
    { path: "/tokushoho", priority: 0.4, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  ];

  return [
    ...staticPaths.map(({ path, priority, changeFrequency }) => ({
      url: `${SITE_URL}${path}`,
      lastModified,
      changeFrequency,
      priority,
    })),
    ...fujisanProducts.map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...fujisanCraftPillars.map((c) => ({
      url: `${SITE_URL}/craft/${c.slug}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
