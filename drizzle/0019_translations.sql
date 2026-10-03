CREATE TABLE `translations` (
	`key` text PRIMARY KEY NOT NULL,
	`lang` text NOT NULL,
	`text` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `translations_created_at_idx` ON `translations` (`created_at`);