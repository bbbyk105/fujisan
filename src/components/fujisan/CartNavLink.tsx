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

export function CartNavLink({ mobile = false }: { mobile?: boolean }) {
  const { count, ready } = useCart();
  // SSR/初回描画では count を出さず、ハイドレーション不整合を避ける。
  const showCount = ready && count > 0;

  if (mobile) {
    return (
      <Link
        href="/cart"
        className="flex items-center justify-between border-b border-[#0F1F36]/10 py-4 text-[13px] font-semibold tracking-[0.14em] text-[#0F1F36]/82 no-underline transition-colors hover:text-[#0F1F36]"
      >
        <span className="inline-flex items-center gap-2">
          <BagIcon />
          <L en="CART" ja="カート" />
          {showCount ? (
            <span className="text-[#C9A84C]">({count})</span>
          ) : null}
        </span>
        <span
          aria-hidden
          className="text-[10px] tracking-[0.3em] text-[#C9A84C]"
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
      className="relative inline-flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.06em] text-[#0F1F36]/75 no-underline transition-colors duration-300 hover:text-[#0F1F36]"
    >
      <BagIcon />
      <L en="CART" ja="カート" />
      {showCount ? (
        <span className="ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#0F1F36] px-1 text-[10px] font-semibold leading-none text-[#F6F0E5]">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
