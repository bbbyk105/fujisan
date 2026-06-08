"use client";

import { useEffect, useState } from "react";
import { L } from "@/i18n/Localized";

export type SidebarItem = {
  id: string;
  en: string;
  ja: string;
  number: string;
};

type Props = {
  items: SidebarItem[];
};

/**
 * ダッシュボードの左ナビ。
 * - 各セクション ID への anchor リンク
 * - IntersectionObserver で現在のセクションを追跡し active を付ける
 * - sticky で左に固定（lg以上）、モバイルでは横並び（スクロール可）
 */
export function AccountSidebar({ items }: Props) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const ids = items.map((i) => i.id);
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Account sections"
      className="-mx-7 mb-8 overflow-x-auto px-7 lg:sticky lg:top-[110px] lg:mx-0 lg:mb-0 lg:px-0"
    >
      <ul className="flex min-w-max gap-2 lg:flex-col lg:gap-0">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id} className="lg:border-b lg:border-[#0B1A2E]/8">
              <a
                href={`#${item.id}`}
                className={`group flex items-center gap-3 whitespace-nowrap px-4 py-3 text-[11px] font-semibold tracking-[0.26em] no-underline transition-colors lg:px-2 lg:py-4 ${
                  isActive
                    ? "text-[#0B1A2E]"
                    : "text-[#0B1A2E]/45 hover:text-[#0B1A2E]/80"
                }`}
              >
                <span
                  className={`font-serif text-[12px] tracking-[0.3em] transition-colors ${
                    isActive ? "text-[#C9A84C]" : "text-[#0B1A2E]/30"
                  }`}
                >
                  {item.number}
                </span>
                <span
                  className={`h-px w-4 transition-all duration-500 ${
                    isActive ? "w-8 bg-[#C9A84C]" : "bg-[#0B1A2E]/15"
                  }`}
                />
                <span className="flex flex-col items-start gap-[2px]">
                  <span>
                    <L en={item.en} ja={item.ja} />
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
