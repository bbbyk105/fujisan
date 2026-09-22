-- レート制限のカウンタ。守る面が別なので 2 つある（src/db/rate-limit-schema.ts）。
--
-- Workers はリクエストごとに別のアイソレートで動きうるため、プロセス内の
-- Map では回数を共有できない。D1 に置いて初めて全リクエストで同じ数を見る。

-- Better Auth（/api/auth/*）用。列の構成は Better Auth が決めている。
CREATE TABLE `rate_limit` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rate_limit_key_unique` ON `rate_limit` (`key`);
--> statement-breakpoint
-- Server Action 用の固定ウィンドウ。生 IP は保存せず、key には
-- SHA-256 の先頭16文字だけを入れる。
CREATE TABLE `action_rate_limit` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `action_rate_limit_expires_at_idx` ON `action_rate_limit` (`expires_at`);
