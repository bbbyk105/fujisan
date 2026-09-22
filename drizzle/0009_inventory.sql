-- SKU（銘柄 × 容量）ごとの在庫。
--
-- オプトイン方式: 行がある SKU だけを在庫管理の対象とし、行が無い SKU は
-- 従来どおり数量無制限で売れる。初期データを入れないのは意図的で、
-- 全 SKU に 0 を入れるとデプロイした瞬間に販売が止まるため。
-- 蔵で本数を数え終わった SKU から /admin/inventory で管理を開始する。
CREATE TABLE `inventory` (
	`product_slug` text NOT NULL,
	`ml` integer NOT NULL,
	`on_hand` integer DEFAULT 0 NOT NULL,
	`reserved` integer DEFAULT 0 NOT NULL,
	`updated_by_email` text,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`product_slug`, `ml`)
);
