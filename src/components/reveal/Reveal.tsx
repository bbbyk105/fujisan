"use client";

import * as React from "react";

export type RevealProps = {
  as?: "div" | "p" | "h1" | "h2" | "h3" | "span";
  id?: string;
  className?: string;
  children?: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLElement>;
};

export function Reveal({
  as = "div",
  id,
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

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      setShown(true);
      return;
    }

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
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
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

  return React.createElement(as, {
    ref: setNode,
    id,
    className: combinedClassName,
    style: combinedStyle,
    onClick,
    children,
  });
}
