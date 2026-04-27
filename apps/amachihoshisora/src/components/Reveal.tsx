"use client";

import * as React from "react";

export const revealEase = [0.22, 1, 0.36, 1] as [number, number, number, number];
export const revealDelays = { d1: 0.12, d2: 0.26, d3: 0.42 } as const;

type As = "div" | "p" | "h1" | "h2" | "h3" | "span";

export type RevealProps = {
  as?: As;
  className?: string;
  children?: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLElement>;
};

export function Reveal({
  as = "div",
  className,
  children,
  style,
  onClick,
  delay = 0,
}: RevealProps) {
  const [node, setNode] = React.useState<HTMLElement | null>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    if (!node) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    io.observe(node);
    return () => io.disconnect();
  }, [node]);

  const combinedStyle: React.CSSProperties = {
    transitionDelay: delay ? `${Math.round(delay * 1000)}ms` : undefined,
    ...style,
  };

  const combinedClassName = [
    "reveal",
    shown ? "reveal-shown" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return React.createElement(
    as,
    { ref: setNode, className: combinedClassName, style: combinedStyle, onClick },
    children
  );
}
