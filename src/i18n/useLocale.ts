"use client";

import { useSyncExternalStore } from "react";

type Locale = "ja" | "en";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-locale"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Locale {
  return document.documentElement.getAttribute("data-locale") === "en"
    ? "en"
    : "ja";
}

/**
 * 現在のロケールを購読する。<L> が使えない属性値（placeholder 等）を
 * 言語ごとに切り替えたい時に使う。SSR では "ja" を返す。
 */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getSnapshot, () => "ja");
}
