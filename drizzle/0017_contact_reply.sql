CREATE TABLE `contact_reply` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_id` text NOT NULL,
	`body` text NOT NULL,
	`sent_by_email` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`contact_id`) REFERENCES `contact_message`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `contact_reply_contact_id_idx` ON `contact_reply` (`contact_id`,`created_at`);