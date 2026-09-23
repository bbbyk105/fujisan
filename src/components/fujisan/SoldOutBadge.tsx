"use client";

import { useLiveSku } from "@/lib/cart/useLiveCatalog";
import { L } from "@/i18n/Localized";

/**
 * 商品画像に重ねる「完売」バッジ。
 *
 * 一覧は静的配信なので、ビルド時点のカタログのフラグだけでは、あとから
 * 売り切れた SKU に印が付かない。ハイドレーション後に実勢在庫を重ねる。
 * 取得前・取得失敗時はカタログのフラグだけで判断する。
 */
export function SoldOutBadge({
  slug,
  ml,
  catalogSoldOut,
  className = "absolute left-4 top-4",
}: {
  slug: string;
  ml: number;
  /** カタログ側の手動「販売停止」フラグ。 */
  catalogSoldOut: boolean;
  className?: string;
}) {
  const live = useLiveSku(slug, ml);
  const soldOut = catalogSoldOut || live?.soldOut === true;
  if (!soldOut) return null;

  return (
    <span
      className={`${className} border border-crimson/40 bg-paper-card/90 px-2.5 py-1 text-[9px] font-semibold tracking-[0.22em] text-crimson`}
    >
      <L en="SOLD OUT" ja="完売" />
    </span>
  );
}
