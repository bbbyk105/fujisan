ALTER TABLE `orders` ADD `stock_state` text DEFAULT 'reserved' NOT NULL;--> statement-breakpoint
UPDATE `orders` SET `stock_state` = CASE
  WHEN `status` IN ('shipped', 'delivered') OR `shipped_at` IS NOT NULL THEN 'shipped'
  WHEN `status` = 'pending' AND `paid_at` IS NULL THEN 'reserved'
  WHEN `status` IN ('pending', 'confirmed', 'preparing') THEN 'committed'
  ELSE 'none'
END;
