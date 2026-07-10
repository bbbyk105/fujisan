ALTER TABLE `orders` ADD `stripe_payment_intent_id` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `stripe_refund_id` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `refunded_at` integer;