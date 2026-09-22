CREATE TABLE `goal_suggestions` (
	`goal_id` integer PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`steps_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `profiles`(`device_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `goal_suggestions_device_id_idx` ON `goal_suggestions` (`device_id`);