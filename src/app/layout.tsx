import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AMACHI HOSHISORA — Mt. Fuji Sake Project",
  description: "Born of Stars. Brewed in Silence. A Junmai Daiginjo from the sacred shores of Mt. Fuji.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Noto+Serif+JP:wght@200;300;400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
