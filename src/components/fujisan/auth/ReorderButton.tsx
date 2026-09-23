"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart/useCart";
import { pushToast } from "@/lib/cart/toast-store";
import { getFujisanProductBySlug, findVolume } from "@/data/fujisan-products";
import type { OrderLine } from "@/db/orders-schema";
import { L } from "@/i18n/Localized";

/**
 * 同じ内容をもう一度カートに入れる。
 *
 * 注文明細は購入時点のスナップショットなので、取り扱いが終わった銘柄や
 * 完売中の SKU が含まれていることがある。入れられたものだけ入れ、
 * 入れられなかったものは件数を添えて知らせる（黙って減らさない）。
 */
export function ReorderButton({ items }: { items: OrderLine[] }) {
  const { add } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const reorder = () => {
    if (busy) return;
    setBusy(true);

    let added = 0;
    let skipped = 0;
    for (const it of items) {
      const product = getFujisanProductBySlug(it.slug);
      const volume = product ? findVolume(product, it.ml) : undefined;
      if (!product || !volume || volume.soldOut) {
        skipped += 1;
        continue;
      }
      add(it.slug, it.ml, it.qty);
      added += 1;
    }

    if (added === 0) {
      pushToast({
        ja: "現在お取り扱いのある商品がありませんでした",
        en: "None of these bottles are available right now",
      });
      setBusy(false);
      return;
    }

    pushToast({
      ja:
        skipped > 0
          ? `${added}点をカートに追加しました（${skipped}点は現在お取り扱いがありません）`
          : `${added}点をカートに追加しました`,
      en:
        skipped > 0
          ? `Added ${added} item(s); ${skipped} unavailable`
          : `Added ${added} item(s) to your cart`,
      action: { href: "/cart", ja: "カートを見る", en: "VIEW CART" },
    });
    router.push("/cart");
  };

  return (
    <button
      type="button"
      onClick={reorder}
      disabled={busy}
      className="ed-btn-ghost"
    >
      <L en="ORDER AGAIN" ja="同じ内容で注文する" />
    </button>
  );
}
