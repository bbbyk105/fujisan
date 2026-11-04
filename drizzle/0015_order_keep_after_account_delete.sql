-- 退会しても注文の記録を残す。user_id を NULL 可にし、ON DELETE を cascade から set null へ変える。
-- SQLite は外部キーを ALTER できないので表を作り直す。
-- orders を参照する表は無いので、DROP TABLE で他の行が消えることはない。
-- drizzle-kit が出す PRAGMA foreign_keys は入れていない（D1 はトランザクションの中で流すので効かない）。
CREATE TABLE `__new_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`order_ref` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`items_json` text NOT NULL,
	`items_count` integer NOT NULL,
	`subtotal` integer NOT NULL,
	`shipping` integer NOT NULL,
	`total` integer NOT NULL,
	`customer_name` text NOT NULL,
	`customer_email` text NOT NULL,
	`postal_code` text NOT NULL,
	`address` text NOT NULL,
	`phone` text NOT NULL,
	`stripe_session_id` text,
	`stripe_payment_intent_id` text,
	`paid_at` integer,
	`stripe_refund_id` text,
	`refunded_at` integer,
	`refunded_amount` integer,
	`receipt_addressee` text,
	`cancel_requested_at` integer,
	`cancel_reason` text,
	`tracking_carrier` text,
	`tracking_number` text,
	`shipped_at` integer,
	`delivered_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_orders`("id", "user_id", "order_ref", "status", "items_json", "items_count", "subtotal", "shipping", "total", "customer_name", "customer_email", "postal_code", "address", "phone", "stripe_session_id", "stripe_payment_intent_id", "paid_at", "stripe_refund_id", "refunded_at", "refunded_amount", "receipt_addressee", "cancel_requested_at", "cancel_reason", "tracking_carrier", "tracking_number", "shipped_at", "delivered_at", "created_at", "updated_at") SELECT "id", "user_id", "order_ref", "status", "items_json", "items_count", "subtotal", "shipping", "total", "customer_name", "customer_email", "postal_code", "address", "phone", "stripe_session_id", "stripe_payment_intent_id", "paid_at", "stripe_refund_id", "refunded_at", "refunded_amount", "receipt_addressee", "cancel_requested_at", "cancel_reason", "tracking_carrier", "tracking_number", "shipped_at", "delivered_at", "created_at", "updated_at" FROM `orders`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
ALTER TABLE `__new_orders` RENAME TO `orders`;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_ref_unique` ON `orders` (`order_ref`);--> statement-breakpoint
CREATE INDEX `orders_user_id_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_created_at_idx` ON `orders` (`created_at`);