-- お問い合わせの保存先。
-- メール通知（Resend）はベストエフォートのため、受領の正はこの表とする。
-- メール送信が落ちても問い合わせは失われず、/admin/contacts から拾える。
CREATE TABLE `contact_message` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`locale` text DEFAULT 'ja' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`ip_hash` text,
	`handled_by_email` text,
	`handled_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `contact_message_status_idx` ON `contact_message` (`status`);
--> statement-breakpoint
CREATE INDEX `contact_message_created_at_idx` ON `contact_message` (`created_at`);
--> statement-breakpoint
CREATE INDEX `contact_message_ip_hash_idx` ON `contact_message` (`ip_hash`,`created_at`);
