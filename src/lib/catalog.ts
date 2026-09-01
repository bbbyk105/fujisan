import "server-only";
import { getDb } from "@/db";
import { productSku, skuId, type ProductSkuRow } from "@/db/products-schema";
import {
  fujisanProducts,
  getFujisanProductBySlug,
  findVolume,
  type FujisanProduct,
  type FujisanVolume,
} from "@/data/fujisan-products";

/**
 * 1 SKU の「実勢」データ。コードのカタログ（銘柄名・容量）に、D1 の
 * product_sku（価格・在庫）を重ねたもの。決済・管理画面はこれを正とする。
 */
export type LiveSku = {
  slug: string;
  ml: number;
  /** 銘柄名（管理画面の表示用）。 */
  name: string;
  variant: string;
  priceJpy: number;
  wholesalePriceJpy: number;
  caseSize: number;
  /**
   * 在庫数（本）。`null` は「在庫管理の対象外」。
   * D1 に行が無い／読めない場合に null になり、在庫による購入制限をかけない。
   * 障害時に販売を止めてしまわないための fail-open。
   */
  stockQty: number | null;
  lowStockThreshold: number;
  /** 購入不可か。コード側の手動 soldOut フラグ、または在庫切れ。 */
  soldOut: boolean;
  /** 在庫僅少か（管理画面のアラート用）。在庫管理外は常に false。 */
  lowStock: boolean;
};

/**
 * D1 の product_sku を id → 行 の Map で返す。
 * 読み取りに失敗しても例外を投げず空 Map を返す（コードの価格で動き続ける）。
 */
async function readSkuRows(): Promise<Map<string, ProductSkuRow>> {
  try {
    const db = await getDb();
    const rows = await db.select().from(productSku);
    return new Map(rows.map((r) => [r.id, r]));
  } catch {
    return new Map();
  }
}

/** コードの銘柄 × 容量に D1 行を重ねて 1 SKU 分の実勢データを作る。 */
function mergeSku(
  product: FujisanProduct,
  volume: FujisanVolume,
  row: ProductSkuRow | undefined,
): LiveSku {
  const stockQty = row ? row.stockQty : null;
  const manualSoldOut = volume.soldOut === true;
  const lowStockThreshold = row?.lowStockThreshold ?? 0;
  return {
    slug: product.slug,
    ml: volume.ml,
    name: product.name,
    variant: product.variant,
    priceJpy: row?.priceJpy ?? volume.priceJpy,
    wholesalePriceJpy: row?.wholesalePriceJpy ?? volume.wholesalePriceJpy,
    caseSize: row?.caseSize ?? volume.caseSize,
    stockQty,
    lowStockThreshold,
    soldOut: manualSoldOut || (stockQty !== null && stockQty <= 0),
    lowStock:
      stockQty !== null && stockQty > 0 && stockQty <= lowStockThreshold,
  };
}

/** 全 SKU の実勢データ。カタログの並び順（銘柄順 → 容量の大きい順）で返す。 */
export async function getLiveSkus(): Promise<LiveSku[]> {
  const rows = await readSkuRows();
  return fujisanProducts.flatMap((product) =>
    product.volumes.map((volume) =>
      mergeSku(product, volume, rows.get(skuId(product.slug, volume.ml))),
    ),
  );
}

/**
 * 1 SKU の実勢データ。存在しない銘柄・容量なら undefined。
 * 決済の価格引き直しはこれを使う（クライアント申告を信用しない）。
 */
export async function getLiveSku(
  slug: string,
  ml: number,
): Promise<LiveSku | undefined> {
  const product = getFujisanProductBySlug(slug);
  if (!product) return undefined;
  const volume = findVolume(product, ml);
  if (!volume) return undefined;

  const rows = await readSkuRows();
  return mergeSku(product, volume, rows.get(skuId(slug, ml)));
}

/**
 * 複数 SKU をまとめて引く（カート1件ごとに D1 を叩かないため）。
 * キーは `skuId(slug, ml)`。存在しない指定はキーごと含まれない。
 */
export async function getLiveSkuMap(): Promise<Map<string, LiveSku>> {
  const skus = await getLiveSkus();
  return new Map(skus.map((s) => [skuId(s.slug, s.ml), s]));
}
