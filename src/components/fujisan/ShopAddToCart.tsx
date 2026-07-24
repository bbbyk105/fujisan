"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart/useCart";
import { pushToast } from "@/lib/cart/toast-store";
import { L } from "@/i18n/Localized";

type Props = {
  slug: string;
  name: string;
  ml: number;
  /** 配置側のレイアウト調整用（余白・幅のみ）。見た目の本体は共通。 */
  className?: string;
};

/**
 * 一覧カードの「カートに追加」ボタン（クライアント境界はここだけ）。
 * カード本体のマークアップは Server Component（ShopCollectionGrid）が持つ。
 */
export function ShopAddToCart({
  slug,
  name,
  ml,
  className = "mt-4 w-full",
}: Props) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    // 商品詳細ページと動線を揃える: サイト入場時の AgeGate と同じフラグを参照し、
    // 未確認のままの即時追加を防ぐ（通常は AgeGate 通過済みなので素通り）
    if (window.localStorage.getItem("fujisan-age-confirmed") !== "yes") {
      pushToast({
        ja: "ご購入には年齢確認が必要です。商品ページからお進みください",
        en: "Age verification is required. Please continue from the product page",
        action: {
          href: `/products/${slug}`,
          ja: "商品ページへ",
          en: "VIEW PRODUCT",
        },
      });
      return;
    }
    add(slug, ml, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
    pushToast({
      ja: `${name}をカートに追加しました`,
      en: `${name} added to your cart`,
      action: { href: "/cart", ja: "カートを見る", en: "VIEW CART" },
    });
  };

  return (
    <button
      type="button"
      onClick={onAdd}
      aria-live="polite"
      className={`inline-flex cursor-pointer items-center justify-center gap-2 border border-[#0B1A2E] bg-[#0B1A2E] px-5 py-3.5 text-[10.5px] font-semibold tracking-[0.26em] text-paper-card transition-colors hover:bg-[#1D2432] ${className}`}
    >
      <span key={added ? "added" : "idle"} className="fujisan-swap gap-2">
        {added ? (
          <L en="ADDED ✓" ja="追加しました ✓" />
        ) : (
          <>
            <L en="ADD TO CART" ja="カートに追加" />
            <span aria-hidden>+</span>
          </>
        )}
      </span>
    </button>
  );
}
