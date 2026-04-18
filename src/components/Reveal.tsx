"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

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

const viewport = { once: true, amount: 0.08 as const };

export function Reveal({ as = "div", className, children, delay = 0, style, onClick }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return React.createElement(as, { className, style, onClick }, children);
  }

  const transition = { duration: 0.9, ease: revealEase, delay };
  const props = {
    className, style, onClick,
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport,
    transition,
  };

  switch (as) {
    case "p":    return <motion.p    {...props}>{children}</motion.p>;
    case "h1":   return <motion.h1   {...props}>{children}</motion.h1>;
    case "h2":   return <motion.h2   {...props}>{children}</motion.h2>;
    case "h3":   return <motion.h3   {...props}>{children}</motion.h3>;
    case "span": return <motion.span {...props}>{children}</motion.span>;
    default:     return <motion.div  {...props}>{children}</motion.div>;
  }
}
