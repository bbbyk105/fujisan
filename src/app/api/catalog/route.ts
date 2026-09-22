import { getLiveSkus } from "@/lib/catalog";
import { skuKey } from "@/data/fujisan-products";
import { MAX_QTY_PER_LINE } from "@/lib/cart/cart-core";

/**
 * 公開カタログの実勢値（価格・在庫・完売）。
 *
 * 商品ページは Worker の CPU 制限を避けるため静的に書き出している。そのため
 * 「いまの価格と在庫」だけをこの軽いエンドポイントから取り、購入導線
 * （ProductPurchaseBlock / CartView / 一覧カード）がハイドレーション後に反映する。
 *
 * **卸価格は返さない。** ここは誰でも叩ける公開エンドポイントで、卸価格は
 * 承認済みの取扱店にしか見せない値。`/shop/business` はサーバー側で描画する。
 */
export const dynamic = "force-dynamic";

/** 公開してよい実勢値だけ。 */
type PublicSku = {
  price: number;
  /** 買える本数。null は在庫管理の対象外＝数量制限なし。 */
  stock: number | null;
  soldOut: boolean;
  /** 在庫僅少（管理画面のしきい値以下）。「残りわずか」の告知に使う。 */
  low: boolean;
};

export async function GET(): Promise<Response> {
  const skus = await getLiveSkus();
  const map: Record<string, PublicSku> = {};
  for (const s of skus) {
    map[skuKey(s.slug, s.ml)] = {
      price: s.priceJpy,
      // **実在庫そのものは出さない。** UI が必要とするのは「あと何本カートに
      // 入れられるか」までで、1 行の上限は MAX_QTY_PER_LINE 本。蔵の在庫数を
      // そのまま公開する理由が無いので、上限で頭打ちにしてから返す。
      stock:
        s.available === null ? null : Math.min(s.available, MAX_QTY_PER_LINE),
      soldOut: s.soldOut,
      low: s.lowStock,
    };
  }
  return Response.json(
    { skus: map },
    { headers: { "cache-control": "no-store" } },
  );
}
