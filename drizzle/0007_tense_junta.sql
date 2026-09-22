CREATE TABLE `trail_progress` (
	`device_id` text PRIMARY KEY NOT NULL,
	`trail_id` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_days_json` text DEFAULT '[]' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `profiles`(`device_id`) ON UPDATE no action ON DELETE cascade
);
