import type { Metadata } from "next";
import { Noto_Serif, Noto_Serif_JP, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import AgeGate from "@/components/fujisan/AgeGate";
import { LocaleBoot } from "@/i18n/LocaleBoot";

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

export const metadata: Metadata = {
  title: "FUJISAN — Japan Premium Sake",
  description:
    "The spirit of Japan, crafted at the foot of Fujisan. A premium sake collection born from Mt. Fuji's pristine snowmelt and traditional brewing methods.",
};

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
      </body>
    </html>
  );
}
