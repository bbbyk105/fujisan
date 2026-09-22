import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

/**
 * SKU（銘柄 × 容量）ごとの在庫。
 *
 * **オプトイン方式**: 行が存在する SKU だけを在庫管理の対象とする。
 * 行が無い SKU は「数量無制限」として従来どおり売れる。こうしないと、
 * デプロイした瞬間に全 SKU が在庫 0 になって販売が止まってしまう。
 * 蔵で本数を数え終わった SKU から `/admin/inventory` で管理を開始する。
 *
 * カタログ側（`fujisan-products.ts`）の `soldOut` フラグは引き続き有効で、
 * 在庫数とは独立した「販売停止」スイッチとして働く。
 *
 * ## 引き当ての流れ
 *
 * 1. 決済開始: `reserved += qty`（`onHand - reserved >= qty` を WHERE で守る）
 * 2. 入金確定: `onHand -= qty; reserved -= qty`
 * 3. 期限切れ・決済失敗・Session 生成失敗: `reserved -= qty`
 *
 * 決済ページに滞在している間も在庫を押さえる必要があるため、
 * 「確定時に減らす」だけでは同時注文で売り越す。
 */
export const inventory = sqliteTable(
  "inventory",
  {
    /** 銘柄（fujisan-products.ts の slug） */
    productSlug: text("product_slug").notNull(),
    /** 容量（ml）。同じ銘柄でも容量が違えば別 SKU。 */
    ml: integer("ml").notNull(),

    /** 蔵にある実在庫の本数。 */
    onHand: integer("on_hand").notNull().default(0),
    /** 決済待ちで確保中の本数。`onHand - reserved` が販売可能数。 */
    reserved: integer("reserved").notNull().default(0),

    /** 在庫を最後に手で調整した管理者（監査用）。 */
    updatedByEmail: text("updated_by_email"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.productSlug, table.ml] })],
);

/** 在庫の現在値（読み取り用）。 */
export type StockLevel = {
  productSlug: string;
  ml: number;
  onHand: number;
  reserved: number;
  /** 今すぐ売れる本数（onHand - reserved、負にはしない）。 */
  available: number;
};
