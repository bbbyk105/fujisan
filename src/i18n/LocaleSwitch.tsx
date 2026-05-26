"use client";

import { useSyncExternalStore } from "react";

type Locale = "ja" | "en";
const STORAGE_KEY = "fujisan-locale";

// <html data-locale> を外部ストアとして購読する。
// これで全 LocaleSwitch インスタンスが常に同期し、effect 内 setState を避けられる。
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

function getServerSnapshot(): Locale {
  return "ja";
}

export function LocaleSwitch({
  className = "",
  variant = "inline",
}: {
  className?: string;
  variant?: "inline" | "stacked";
}) {
  const locale = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const switchTo = (l: Locale) => {
    if (l === locale) return;
    const html = document.documentElement;
    html.setAttribute("data-locale", l);
    html.setAttribute("lang", l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    // 言語を切り替えたら、そのページの先頭へ
    window.scrollTo({ top: 0, left: 0 });
  };

  const isInline = variant === "inline";

  return (
    <div
      role="group"
      aria-label="Language switcher"
      className={`inline-flex items-center ${
        isInline ? "gap-2 text-[12px]" : "gap-1 text-[11px]"
      } font-medium tracking-[0.16em] select-none ${className}`}
    >
      <button
        type="button"
        aria-pressed={locale === "ja"}
        onClick={() => switchTo("ja")}
        className={`cursor-pointer px-1 transition-colors ${
          locale === "ja"
            ? "text-[#0F1F36]"
            : "text-[#0F1F36]/40 hover:text-[#0F1F36]/80"
        }`}
      >
        JP
      </button>
      <span aria-hidden className="text-[#0F1F36]/30">
        |
      </span>
      <button
        type="button"
        aria-pressed={locale === "en"}
        onClick={() => switchTo("en")}
        className={`cursor-pointer px-1 transition-colors ${
          locale === "en"
            ? "text-[#0F1F36]"
            : "text-[#0F1F36]/40 hover:text-[#0F1F36]/80"
        }`}
      >
        EN
      </button>
    </div>
  );
}
