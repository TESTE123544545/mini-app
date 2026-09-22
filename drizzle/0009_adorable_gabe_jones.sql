CREATE TABLE `ai_weekly_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`device_id` text NOT NULL,
	`week_start` text NOT NULL,
	`summary` text NOT NULL,
	`recommendation` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `profiles`(`device_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_weekly_reports_device_week_idx` ON `ai_weekly_reports` (`device_id`,`week_start`);