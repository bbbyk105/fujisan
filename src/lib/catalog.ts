import "server-only";
import { getDb } from "@/db";
import { productPrice, type ProductPriceRow } from "@/db/price-schema";
import { readAllStock } from "@/lib/inventory";
import type { StockLevel } from "@/db/inventory-schema";
import {
  fujisanProducts,
  getFujisanProductBySlug,
  findVolume,
  skuKey,
  type FujisanProduct,
  type FujisanVolume,
} from "@/data/fujisan-products";

/**
 * 「実勢カタログ」— コードのカタログ（銘柄・容量・ストーリー）に、D1 の
 * 価格上書き（`product_price`）と在庫（`inventory`）を重ねたもの。
 *
 * **決済と管理画面はこれを正とする。** カタログ定数を直接読むと、管理画面で
 * 変えた価格や在庫が効かない経路が残ってしまう。
 *
 * ## fail-open
 * D1 が読めないときは例外を投げず、コードのカタログ価格・在庫管理なしで返す。
 * 在庫が読めないことを理由に販売を止めると、障害が売り逃しに直結する。
 * 逆に「安全側」に倒して全部を完売扱いにするのは、蔵にとっての損失が大きい。
 */
export type LiveSku = {
  slug: string;
  ml: number;
  /** 銘柄名（管理画面・メールの表示用）。 */
  name: string;
  variant: string;
  variantJp: string;

  /** 実際に請求する税込価格（円）。 */
  priceJpy: number;
  /** 卸価格（税抜・1本）。承認済みの取扱店にのみ開示する。 */
  wholesalePriceJpy: number;
  caseSize: number;
  /** 価格が D1 で上書きされているか（管理画面で「カタログ価格」と区別する）。 */
  priceOverridden: boolean;

  /** 在庫管理の対象か。false なら数量無制限で売れる。 */
  tracked: boolean;
  /** 蔵にある本数。管理対象外なら null。 */
  onHand: number | null;
  /** 決済待ちで確保中の本数。管理対象外なら null。 */
  reserved: number | null;
  /** 今すぐ売れる本数。管理対象外（無制限）なら null。 */
  available: number | null;
  lowStockThreshold: number;

  /** カタログ側の手動「販売停止」スイッチ（在庫数とは独立）。 */
  catalogSoldOut: boolean;
  /** 買えないか。手動停止、または在庫管理下で販売可能数が 0。 */
  soldOut: boolean;
  /** 在庫僅少か（管理画面のアラート用）。管理対象外は常に false。 */
  lowStock: boolean;
};

/** 価格上書きを `${slug}__${ml}` キーの Map で返す。読めなければ空 Map。 */
async function readPriceOverrides(): Promise<Map<string, ProductPriceRow>> {
  try {
    const db = await getDb();
    const rows = await db.select().from(productPrice);
    return new Map(rows.map((r) => [skuKey(r.productSlug, r.ml), r]));
  } catch (err) {
    console.error("[catalog] 価格上書きの読み取りに失敗（カタログ価格で継続）:", err);
    return new Map();
  }
}

/** 在庫を `${slug}__${ml}` キーの Map で返す。読めなければ空 Map（＝無制限）。 */
async function readStockLevels(): Promise<Map<string, StockLevel>> {
  try {
    return await readAllStock();
  } catch (err) {
    console.error("[catalog] 在庫の読み取りに失敗（無制限として継続）:", err);
    return new Map();
  }
}

function mergeSku(
  product: FujisanProduct,
  volume: FujisanVolume,
  price: ProductPriceRow | undefined,
  stock: StockLevel | undefined,
): LiveSku {
  const catalogSoldOut = volume.soldOut === true;
  return {
    slug: product.slug,
    ml: volume.ml,
    name: product.name,
    variant: product.variant,
    variantJp: product.variantJp,

    priceJpy: price?.priceJpy ?? volume.priceJpy,
    wholesalePriceJpy: price?.wholesalePriceJpy ?? volume.wholesalePriceJpy,
    caseSize: price?.caseSize ?? volume.caseSize,
    priceOverridden: price !== undefined,

    tracked: stock !== undefined,
    onHand: stock?.onHand ?? null,
    reserved: stock?.reserved ?? null,
    available: stock?.available ?? null,
    lowStockThreshold: stock?.lowStockThreshold ?? 0,

    catalogSoldOut,
    soldOut: catalogSoldOut || (stock !== undefined && stock.available === 0),
    lowStock: stock?.lowStock ?? false,
  };
}

/** 全 SKU の実勢データ。カタログの並び順（銘柄順 → 容量の大きい順）で返す。 */
export async function getLiveSkus(): Promise<LiveSku[]> {
  const [prices, stock] = await Promise.all([
    readPriceOverrides(),
    readStockLevels(),
  ]);
  return fujisanProducts.flatMap((product) =>
    product.volumes.map((volume) => {
      const key = skuKey(product.slug, volume.ml);
      return mergeSku(product, volume, prices.get(key), stock.get(key));
    }),
  );
}

/** `${slug}__${ml}` をキーにした実勢カタログ。カート 1 行ごとに D1 を叩かないため。 */
export async function getLiveSkuMap(): Promise<Map<string, LiveSku>> {
  const skus = await getLiveSkus();
  return new Map(skus.map((s) => [skuKey(s.slug, s.ml), s]));
}

/**
 * 1 SKU の実勢データ。カタログに無い銘柄・容量なら undefined。
 *
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

  const [prices, stock] = await Promise.all([
    readPriceOverrides(),
    readStockLevels(),
  ]);
  const key = skuKey(slug, ml);
  return mergeSku(product, volume, prices.get(key), stock.get(key));
}
