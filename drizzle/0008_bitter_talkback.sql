CREATE TABLE `subscriptions` (
	`purchase_token` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`product_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`expiry_time_millis` text,
	`auto_renewing` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `profiles`(`device_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `subscriptions_device_id_idx` ON `subscriptions` (`device_id`);