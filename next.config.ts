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
    ];
  },
};

initOpenNextCloudflareForDev();

export default nextConfig;
