import { Noto_Serif, Noto_Serif_JP, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import AgeGate from "@/components/fujisan/AgeGate";
import { Toaster } from "@/components/fujisan/Toaster";
import { UnsavedChangesGuard } from "@/components/fujisan/UnsavedChangesGuard";
import { LocaleBoot } from "@/i18n/LocaleBoot";
import { buildMetadata } from "@/lib/seo";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-noto-serif",
  adjustFontFallback: true,
  preload: true,
});

const notoSerifJp = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-noto-serif-jp",
  adjustFontFallback: true,
  preload: false,
});

const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-shippori-mincho",
  adjustFontFallback: true,
  preload: false,
});

/**
 * ルートの Metadata＝トップページの Metadata（app/page.tsx は metadata を持たない）。
 * 下位ページはそれぞれ buildMetadata で完全な OGP を出力して上書きする。
 */
export const metadata = buildMetadata({
  title: "Japan Premium Sake",
  description:
    "The spirit of Japan, crafted at the foot of Fujisan. A premium sake collection born from Mt. Fuji's pristine snowmelt and traditional brewing methods.",
  path: "/",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      data-locale="ja"
      data-scroll-behavior="smooth"
      // LocaleBoot がハイドレーション前に lang/data-locale を上書きするため
      suppressHydrationWarning
      className={`${notoSerif.variable} ${notoSerifJp.variable} ${shipporiMincho.variable} h-full antialiased`}
    >
      <head>
        <LocaleBoot />
      </head>
      <body>
        {children}
        <AgeGate />
        <Toaster />
        <UnsavedChangesGuard />
      </body>
    </html>
  );
}
