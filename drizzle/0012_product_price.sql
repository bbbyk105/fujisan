-- 価格の上書き表と、旧 `product_sku` からの移行。
--
-- ## 背景
-- 本番には、main へ入らなかったブランチ（feat/admin-products-inventory）の
-- `product_sku` が適用済みで、価格と在庫を 1 表で持っていた。一方 main は
-- 在庫を `inventory`（引き当て付き）で持つ。両者を次のように 1 本化する。
--
--   価格・卸価格・入数 → `product_price`（この表。オプトインの上書き）
--   実在庫・引き当て    → `inventory`（0009。オプトインの在庫管理）
--
-- 表を分けるのは、価格と在庫で「誰がいつ変えるか」が違うため。
-- 詳細は src/db/price-schema.ts のコメントを参照。

CREATE TABLE `product_price` (
	`product_slug` text NOT NULL,
	`ml` integer NOT NULL,
	`price_jpy` integer NOT NULL,
	`wholesale_price_jpy` integer NOT NULL,
	`case_size` integer NOT NULL,
	`updated_by_email` text,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`product_slug`, `ml`)
);
--> statement-breakpoint

-- 在庫僅少のしきい値。旧 `product_sku` が持っていた運用値をこちらへ移す。
ALTER TABLE `inventory` ADD `low_stock_threshold` integer DEFAULT 6 NOT NULL;
--> statement-breakpoint

-- 旧表からの移行。`product_sku` が無い環境（ローカル・新規 D1）でも同じ SQL が
-- 通るように、空の表を用意してから読む。移行後に必ず落とすので残らない。
CREATE TABLE IF NOT EXISTS `product_sku` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`ml` integer NOT NULL,
	`price_jpy` integer NOT NULL,
	`wholesale_price_jpy` integer NOT NULL,
	`case_size` integer NOT NULL,
	`stock_qty` integer DEFAULT 0 NOT NULL,
	`low_stock_threshold` integer DEFAULT 6 NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint

-- 在庫は必ず引き継ぐ。引き継がないと、本番で効いていた在庫上限が黙って外れ、
-- 蔵にある本数を超えて売れてしまう。`reserved` は 0 から始める
-- （旧実装に引き当ての概念が無く、決済中の本数を復元できないため）。
INSERT INTO `inventory`
	(`product_slug`, `ml`, `on_hand`, `reserved`, `low_stock_threshold`, `updated_by_email`)
SELECT `slug`, `ml`, `stock_qty`, 0, `low_stock_threshold`, 'migration:0012'
FROM `product_sku`
WHERE true
ON CONFLICT(`product_slug`, `ml`) DO NOTHING;
--> statement-breakpoint

-- 価格は「管理画面で実際に変更されたものだけ」を引き継ぐ。
-- 0007 の初期投入値のままの行を移すと、以後コードのカタログで価格を直しても
-- D1 の同値の行に上書きされ続け、直したつもりが反映されない事故になる。
-- 下の一覧は 0007_product_sku.sql の INSERT と同じ値。
INSERT INTO `product_price`
	(`product_slug`, `ml`, `price_jpy`, `wholesale_price_jpy`, `case_size`, `updated_by_email`)
SELECT `slug`, `ml`, `price_jpy`, `wholesale_price_jpy`, `case_size`, 'migration:0012'
FROM `product_sku`
WHERE NOT (
	(`id` = 'shogun-300'  AND `price_jpy` = 2750 AND `wholesale_price_jpy` = 1651 AND `case_size` = 12) OR
	(`id` = 'shogun-180'  AND `price_jpy` = 1950 AND `wholesale_price_jpy` = 1155 AND `case_size` = 24) OR
	(`id` = 'tenka-300'   AND `price_jpy` = 2750 AND `wholesale_price_jpy` = 1651 AND `case_size` = 12) OR
	(`id` = 'tenka-180'   AND `price_jpy` = 1950 AND `wholesale_price_jpy` = 1155 AND `case_size` = 24) OR
	(`id` = 'samurai-300' AND `price_jpy` = 2100 AND `wholesale_price_jpy` = 1254 AND `case_size` = 12) OR
	(`id` = 'ninja-300'   AND `price_jpy` = 1850 AND `wholesale_price_jpy` = 1105 AND `case_size` = 12) OR
	(`id` = 'kokoro-300'  AND `price_jpy` = 1600 AND `wholesale_price_jpy` =  956 AND `case_size` = 12)
)
ON CONFLICT(`product_slug`, `ml`) DO NOTHING;
--> statement-breakpoint

DROP TABLE `product_sku`;
