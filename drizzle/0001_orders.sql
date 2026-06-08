CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
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
	`tracking_carrier` text,
	`tracking_number` text,
	`shipped_at` integer,
	`delivered_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_ref_unique` ON `orders` (`order_ref`);--> statement-breakpoint
CREATE INDEX `orders_user_id_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_created_at_idx` ON `orders` (`created_at`);