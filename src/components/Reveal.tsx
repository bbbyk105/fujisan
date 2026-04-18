"use client";

import * as React from "react";

export const revealEase = [0.22, 1, 0.36, 1] as [number, number, number, number];
export const revealDelays = { d1: 0.1, d2: 0.22, d3: 0.36 } as const;

type As = "div" | "p" | "h1" | "h2" | "h3" | "span";

export type RevealProps = {
  as?: As;
  className?: string;
  children?: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLElement>;
};

export function Reveal({ as = "div", className, children, style, onClick }: RevealProps) {
  return React.createElement(as, { className, style, onClick }, children);
}
