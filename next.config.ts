import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  // Cloudflare(opennext) では /_next/image の最適化が効かず原寸PNGを返すため、
  // 画像は事前に WebP へ最適化済み。next/image の最適化は無効化し、
  // 軽量 WebP を直接配信して Worker CPU も節約する。
  images: {
    unoptimized: true,
  },
  async redirects() {
    // /craft に一覧ページは無い（/stories は 2026-09-23 に削除）。入口は最初の章へ。
    // 一覧を作る余地を残すため、恒久（308）ではなく一時（307）の転送にする。
    return [
      { source: "/craft", destination: "/craft/water", permanent: false },
      // 正規ドメインは sakefujisan.com。www はそのまま apex へ寄せる。
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.sakefujisan.com" }],
        destination: "https://sakefujisan.com/:path*",
        permanent: true,
      },
      // workers.dev でも同じサイトが開けるが、BETTER_AUTH_URL と Origin が合わず
      // ログインできないので apex へ寄せる。Stripe の Webhook だけは残す。
      // 本番の Webhook は sakefujisan.com を向いているが、sandbox など旧 URL のままの
      // エンドポイントが残っていても受けられるようにしておく（Stripe はリダイレクトを追わない）。
      {
        source: "/:path((?!api/stripe/webhook$).*)",
        has: [{ type: "host", value: "fujisan.bbbyk105.workers.dev" }],
        destination: "https://sakefujisan.com/:path",
        permanent: true,
      },
    ];
  },
};

initOpenNextCloudflareForDev();

export default nextConfig;
