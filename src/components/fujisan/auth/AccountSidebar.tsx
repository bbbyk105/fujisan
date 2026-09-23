"use client";

import { useEffect, useState } from "react";
import { L } from "@/i18n/Localized";

export type SidebarItem = {
  id: string;
  en: string;
  ja: string;
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
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`flex whitespace-nowrap border-l-2 py-2.5 pl-4 text-[13px] font-semibold tracking-[0.06em] no-underline transition-colors lg:py-3 ${
                  isActive
                    ? "border-indigo text-indigo"
                    : "border-transparent text-indigo/45 hover:text-indigo/80"
                }`}
              >
                <L en={item.en} ja={item.ja} />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
