import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
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
