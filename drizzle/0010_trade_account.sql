-- 取扱店（法人）アカウントの審査。
--
-- `user.role = 'business'` は「法人として登録した」ことしか表さない。
-- 卸価格を見せてよいかは、この表の status = 'approved' で決める。
-- 登録済みでこの表に行が無い法人は「未申請」= 未承認として扱う
-- （既存アカウントは /admin/customers から承認すると行ができる）。
CREATE TABLE `trade_account` (
	`user_id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`business_type` text NOT NULL,
	`licence_number` text,
	`applied_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`reviewed_at` integer,
	`reviewed_by_email` text,
	`review_note` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `trade_account_status_idx` ON `trade_account` (`status`);
