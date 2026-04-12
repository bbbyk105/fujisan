import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bushido Edition — AMACHI HOSHISORA",
  description: "Seven distinct expressions of Bushido. Each bottle a different warrior archetype, a different chapter of Japan's timeless code of honor.",
};

export default function BushidoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
