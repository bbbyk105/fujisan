CREATE TABLE `team_invite` (
	`email` text PRIMARY KEY NOT NULL,
	`admin_role` text NOT NULL,
	`invited_by_email` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
