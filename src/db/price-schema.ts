import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

/**
 * SKU（銘柄 × 容量）の価格の上書き。
 *
 * **オプトイン方式**: 行がある SKU だけがこの値で売られる。行が無い SKU は
 * `src/data/fujisan-products.ts` のカタログ価格で従来どおり売れる。
 * D1 が読めない障害時もコードの価格で売り続けられる（fail-open）。
 *
 * ## なぜ在庫（`inventory`）と別の表なのか
 *
 * 「蔵に何本あるか」と「いくらで売るか」は**変える人も変える頻度も違う**。
 * 在庫は棚卸しのたびに staff が動かし、価格は owner しか動かさない。
 * 1 つの表にまとめると「価格だけ直したいのに行ができて、在庫 0 として
 * 管理対象になり、その場で完売になる」という事故が起きる。
 * 表を分けておけば、どちらの管理を始めるかを独立に選べる。
 *
 * 銘柄名・ストーリー・画像・`soldOut` フラグはコード側に残す
 * （変更にはどのみちデプロイが要るため）。
 */
export const productPrice = sqliteTable(
  "product_price",
  {
    /** 銘柄（fujisan-products.ts の slug） */
    productSlug: text("product_slug").notNull(),
    /** 容量（ml）。同じ銘柄でも容量が違えば別 SKU。 */
    ml: integer("ml").notNull(),

    /** 税込小売価格（円）。 */
    priceJpy: integer("price_jpy").notNull(),
    /** 卸価格（税抜・1本あたり、円）。承認済みの取扱店にのみ開示する。 */
    wholesalePriceJpy: integer("wholesale_price_jpy").notNull(),
    /** 卸の 1 ケース入数（300ml×12／180ml×24）。 */
    caseSize: integer("case_size").notNull(),

    /** 価格を最後に変更した管理者（監査用）。 */
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

export type ProductPriceRow = typeof productPrice.$inferSelect;
