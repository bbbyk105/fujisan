"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

let registered = false;

/**
 * SSR セーフ。クライアントでだけプラグインを 1 回だけ登録する。
 * 各クライアントコンポーネントの先頭で `ensureGsap()` を呼ぶ。
 */
export function ensureGsap() {
  if (typeof window === "undefined") return;
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  registered = true;
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
