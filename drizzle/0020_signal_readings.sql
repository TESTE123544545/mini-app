CREATE TABLE `signal_readings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`device_id` text NOT NULL,
	`time` text NOT NULL,
	`day_key` text NOT NULL,
	`sign` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `profiles`(`device_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `signal_readings_unique_idx` ON `signal_readings` (`device_id`,`day_key`,`time`);--> statement-breakpoint
CREATE INDEX `signal_readings_device_idx` ON `signal_readings` (`device_id`,`created_at`);