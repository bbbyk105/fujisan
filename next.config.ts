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
    // /craft 入口は /stories に統合（/craft/[slug] の詳細ページは /stories 各章「続きを読む」の遷移先として残す）
    return [
      { source: "/craft", destination: "/stories", permanent: true },
      // 正規ドメインは sakefujisan.com。www はそのまま apex へ寄せる。
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.sakefujisan.com" }],
        destination: "https://sakefujisan.com/:path*",
        permanent: true,
      },
      // workers.dev でも同じサイトが開けるが、BETTER_AUTH_URL と Origin が合わず
      // ログインできないので apex へ寄せる。Stripe の Webhook だけは残す
      // （Stripe はリダイレクトを追わず、失敗として再送し続ける）。
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
