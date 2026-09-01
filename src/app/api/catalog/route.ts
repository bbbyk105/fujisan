import { getLiveSkus } from "@/lib/catalog";
import { skuId } from "@/db/products-schema";

/**
 * 公開カタログの実勢値（価格・在庫・完売）。
 *
 * 商品ページは Worker の CPU 制限（error 1102）を避けるため `force-static` で
 * 書き出している。そのため「今の在庫」だけをこの軽量エンドポイントから取り、
 * 購入導線（ProductPurchaseBlock / CartView）がハイドレーション後に反映する。
 *
 * **卸価格は返さない**（business ロール以外に漏らさないため）。
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const skus = await getLiveSkus();
  const map: Record<
    string,
    { price: number; stock: number | null; soldOut: boolean; low: boolean }
  > = {};
  for (const s of skus) {
    map[skuId(s.slug, s.ml)] = {
      price: s.priceJpy,
      stock: s.stockQty,
      soldOut: s.soldOut,
      low: s.lowStock,
    };
  }
  return Response.json(
    { skus: map },
    { headers: { "cache-control": "no-store" } },
  );
}
