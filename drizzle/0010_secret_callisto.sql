ALTER TABLE `goals` ADD `is_primary` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `goals` ADD `kind` text;--> statement-breakpoint
ALTER TABLE `goals` ADD `target_amount` integer;--> statement-breakpoint
ALTER TABLE `goals` ADD `current_amount` integer;--> statement-breakpoint
ALTER TABLE `goals` ADD `deadline` text;--> statement-breakpoint
ALTER TABLE `goals` ADD `motivation` text;--> statement-breakpoint
ALTER TABLE `goals` ADD `stage` text;--> statement-breakpoint
ALTER TABLE `goals` ADD `blocker` text;--> statement-breakpoint
ALTER TABLE `goals` ADD `daily_minutes` integer;