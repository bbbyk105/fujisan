"use client";

import { useLiveCatalog, liveKey } from "@/lib/cart/useLiveCatalog";

const yen = new Intl.NumberFormat("ja-JP");

/**
 * 一覧カードの価格表示。
 *
 * 一覧・商品ページは静的配信（Worker の CPU 制限対策）なので、蔵元が管理画面で
 * 価格を変えた直後は焼き込まれた値が古くなる。ハイドレーション後に
 * /api/catalog の実勢価格へ差し替えて、カート・決済の金額と一致させる。
 *
 * `fallback` はビルド時のカタログ価格。取得できないあいだはこれを表示する。
 */
export function LivePrice({
  slug,
  ml,
  fallback,
}: {
  slug: string;
  ml: number;
  fallback: number;
}) {
  const { catalog } = useLiveCatalog();
  return <>¥{yen.format(catalog[liveKey(slug, ml)]?.price ?? fallback)}</>;
}
