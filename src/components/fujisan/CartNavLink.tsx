"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/useCart";
import { L } from "@/i18n/Localized";

function BagIcon() {
  return (
    <svg aria-hidden width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 5h10l-.7 8.2a1 1 0 0 1-1 .9H4.7a1 1 0 0 1-1-.9L3 5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M5.6 5V4.2a2.4 2.4 0 0 1 4.8 0V5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CartNavLink({
  mobile = false,
  compact = false,
}: {
  mobile?: boolean;
  compact?: boolean;
}) {
  const { count, ready } = useCart();
  // SSR/初回描画では count を出さず、ハイドレーション不整合を避ける。
  const showCount = ready && count > 0;

  // モバイルヘッダー常設用 — アイコン + バッジのみ（ハンバーガー内に隠さない）
  if (compact) {
    return (
      <Link
        href="/cart"
        aria-label={showCount ? `Cart, ${count} items` : "Cart"}
        className="relative flex h-10 w-10 items-center justify-center border border-indigo/20 bg-paper-card/80 text-indigo no-underline"
      >
        <BagIcon />
        {showCount ? (
          <span
            key={count}
            className="fujisan-badge-pop absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-indigo px-1 text-[11px] font-semibold leading-none text-paper-card"
          >
            {count}
          </span>
        ) : null}
      </Link>
    );
  }

  if (mobile) {
    return (
      <Link
        href="/cart"
        className="flex items-center justify-between border-b border-indigo/10 py-4 text-[13px] font-semibold tracking-[0.14em] text-indigo/82 no-underline transition-colors hover:text-indigo"
      >
        <span className="inline-flex items-center gap-2">
          <BagIcon />
          <L en="CART" ja="カート" />
          {showCount ? (
            <span key={count} className="fujisan-badge-pop text-gold">
              ({count})
            </span>
          ) : null}
        </span>
        <span
          aria-hidden
          className="text-[11px] tracking-[0.12em] text-gold"
        >
          ●
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/cart"
      aria-label={showCount ? `Cart, ${count} items` : "Cart"}
      className="relative inline-flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.06em] text-indigo/75 no-underline transition-colors duration-300 hover:text-indigo"
    >
      <BagIcon />
      <L en="CART" ja="カート" />
      {showCount ? (
        <span
          key={count}
          className="fujisan-badge-pop ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-indigo px-1 text-[11px] font-semibold leading-none text-paper-card"
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
