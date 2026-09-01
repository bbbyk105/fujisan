import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

/**
 * SKU（銘柄 × 容量）の商取引データ。
 *
 * 銘柄のストーリー・画像・スペックは `src/data/fujisan-products.ts` に残す
 * （変更時にはどのみちデプロイが要るため）。ここに置くのは **運用で日々動く値**
 * ＝価格・卸価格・在庫だけで、蔵側が管理画面から即時に変更できるようにする。
 *
 * 行が存在しない SKU は「在庫管理の対象外」として扱い、コード側の価格と
 * `soldOut` フラグで従来どおり動く（D1 が読めない障害時も販売を止めない）。
 */
export const productSku = sqliteTable(
  "product_sku",
  {
    /** `${slug}-${ml}`（例: "shogun-300"）。skuId() で組み立てる。 */
    id: text("id").primaryKey(),
    /** 銘柄 slug。fujisan-products.ts の slug と対応する。 */
    slug: text("slug").notNull(),
    /** 内容量（ml）。 */
    ml: integer("ml").notNull(),

    /** 税込小売価格（円）。 */
    priceJpy: integer("price_jpy").notNull(),
    /** 卸価格（税抜・1本あたり、円）。business ロールにのみ開示する。 */
    wholesalePriceJpy: integer("wholesale_price_jpy").notNull(),
    /** 卸の1ケース入数（300ml×12／180ml×24）。 */
    caseSize: integer("case_size").notNull(),

    /** 在庫数（本）。0 以下で購入不可。決済確定時に Webhook が原子的に減算する。 */
    stockQty: integer("stock_qty").notNull().default(0),
    /** この本数以下になったら管理画面に「在庫僅少」を表示する。 */
    lowStockThreshold: integer("low_stock_threshold").notNull().default(6),

    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("product_sku_slug_idx").on(table.slug)],
);

export type ProductSkuRow = typeof productSku.$inferSelect;

/** SKU の主キー。`slug` と `ml` から一意に決まる。 */
export function skuId(slug: string, ml: number): string {
  return `${slug}-${ml}`;
}
