"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart/useCart";
import { useLiveCatalog, liveKey } from "@/lib/cart/useLiveCatalog";
import { pushToast } from "@/lib/cart/toast-store";
import { L } from "@/i18n/Localized";

type Props = {
  slug: string;
  name: string;
  /** 既定 SKU の容量。 */
  ml: number;
  /**
   * この銘柄の全容量と、カタログ側の販売停止フラグ。
   * 「完売」と「他の容量を見る」を出し分けるのに、既定 SKU だけでなく
   * 全容量の状態が要る。
   */
  volumes: Array<{ ml: number; catalogSoldOut: boolean }>;
  /** 配置側のレイアウト調整用（余白・幅のみ）。見た目の本体は共通。 */
  className?: string;
};

/**
 * 一覧カードの購入ボタン（クライアント境界はここだけ）。
 * カード本体のマークアップは Server Component（ShopCollectionGrid）が持つ。
 *
 * **完売の出し分けもここで行う。** 一覧は静的配信なので、ビルド後に売り切れた
 * SKU をサーバー側では判定できない。ハイドレーション後に実勢在庫を重ねて、
 * カートに入れてから決済で弾かれる状況を減らす。
 * 取得前・取得失敗時はカタログのフラグだけで判断する（最後の砦は
 * startCheckoutAction のサーバー側検証）。
 */
export function ShopAddToCart({
  slug,
  name,
  ml,
  volumes,
  className = "mt-4 w-full",
}: Props) {
  const { add } = useCart();
  const { catalog } = useLiveCatalog();
  const [added, setAdded] = useState(false);

  const isSoldOut = (v: { ml: number; catalogSoldOut: boolean }) =>
    v.catalogSoldOut || catalog[liveKey(slug, v.ml)]?.soldOut === true;

  const base = volumes.find((v) => v.ml === ml);
  const baseSoldOut = base ? isSoldOut(base) : false;
  const allSoldOut = volumes.every(isSoldOut);
  const low = catalog[liveKey(slug, ml)]?.low === true;

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
    // 完売 SKU は追加させない（ボタンは出していないが、念のため）。
    if (baseSoldOut) return;
    add(slug, ml, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
    pushToast({
      ja: `${name}をカートに追加しました`,
      en: `${name} added to your cart`,
      action: { href: "/cart", ja: "カートを見る", en: "VIEW CART" },
    });
  };

  // 完売しているときは、追加ボタンではなく商品ページへの導線を出す。
  // 全容量が完売なら「完売しました」、他の容量が残っていればそちらへ促す。
  if (baseSoldOut) {
    return (
      <Link
        href={`/products/${slug}`}
        className={`inline-flex items-center justify-center gap-2 border border-indigo/25 bg-indigo/6 px-5 py-3.5 text-[10.5px] font-semibold tracking-[0.26em] text-indigo/70 no-underline transition-colors hover:border-indigo/45 ${className}`}
      >
        {allSoldOut ? (
          <L en="SOLD OUT" ja="完売しました" />
        ) : (
          <>
            <L en="OTHER SIZES" ja="他の容量を見る" />
            <span aria-hidden>→</span>
          </>
        )}
      </Link>
    );
  }

  return (
    <div className={className}>
      {low && (
        <p className="mb-2 text-center text-[10.5px] font-semibold tracking-[0.18em] text-gold-ink">
          <L en="ONLY A FEW LEFT" ja="残りわずか" />
        </p>
      )}
      <button
        type="button"
        onClick={onAdd}
        aria-live="polite"
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 border border-indigo bg-indigo px-5 py-3.5 text-[10.5px] font-semibold tracking-[0.26em] text-paper-card transition-colors hover:bg-[#1D2432]"
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
    </div>
  );
}
