import type { Metadata } from "next";
import { Noto_Serif, Noto_Serif_JP, Shippori_Mincho } from "next/font/google";
import "./globals.css";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-noto-serif",
});

const notoSerifJp = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-noto-serif-jp",
});

const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-shippori-mincho",
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
      lang="en"
      className={`${notoSerif.variable} ${notoSerifJp.variable} ${shipporiMincho.variable} h-full antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
