import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/seo";

/**
 * Web App Manifest。
 * ホーム画面に追加されたときの名前・色を決める。ブランドの紺（#0F1D30）と
 * 和紙色（#F7F1E3）はサイト本体の配色に合わせている。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — 富士山麓の日本酒`,
    short_name: "FUJISAN",
    description:
      "富士山麓で醸す日本酒「武士道シリーズ」。将軍・天下・侍・忍・心の5銘柄をお届けします。",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F1E3",
    theme_color: "#0F1D30",
    lang: "ja",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
