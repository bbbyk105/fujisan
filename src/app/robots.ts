import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * クローラー向けの指示。
 *
 * 個人ごとの内容しか無いページ、認証フロー、管理画面はクロールさせない。
 * （各ページ側でも noindex を指定しているが、そもそも辿らせない方が無駄がない）
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/admin",
        "/admin/",
        "/cart",
        "/checkout/",
        "/login/",
        "/register/",
        "/forgot-password/",
        "/reset-password",
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
