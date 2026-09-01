-- SKU（銘柄 × 容量）の価格・在庫テーブル。
-- 価格と在庫をコード（fujisan-products.ts）から D1 へ移し、管理画面から
-- 再デプロイなしで変更できるようにする。銘柄のストーリー・画像はコードのまま。
CREATE TABLE `product_sku` (
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
CREATE INDEX `product_sku_slug_idx` ON `product_sku` (`slug`);
--> statement-breakpoint
-- 初期データ。価格・卸価格・入数は fujisan-products.ts の値をそのまま移送する。
-- stock_qty は暫定値（各24本）。**公開前に管理画面から実在庫へ差し替えること。**
INSERT INTO `product_sku`
	(`id`, `slug`, `ml`, `price_jpy`, `wholesale_price_jpy`, `case_size`, `stock_qty`, `low_stock_threshold`)
VALUES
	('shogun-300',  'shogun',  300, 2750, 1651, 12, 24, 6),
	('shogun-180',  'shogun',  180, 1950, 1155, 24, 24, 6),
	('tenka-300',   'tenka',   300, 2750, 1651, 12, 24, 6),
	('tenka-180',   'tenka',   180, 1950, 1155, 24, 24, 6),
	('samurai-300', 'samurai', 300, 2100, 1254, 12, 24, 6),
	('ninja-300',   'ninja',   300, 1850, 1105, 12, 24, 6),
	('kokoro-300',  'kokoro',  300, 1600,  956, 12, 24, 6);
