CREATE TABLE `community_blocks` (
	`blocker_id` text NOT NULL,
	`blocked_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`blocker_id`, `blocked_id`),
	FOREIGN KEY (`blocker_id`) REFERENCES `community_profiles`(`device_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`blocked_id`) REFERENCES `community_profiles`(`device_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `community_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room` text NOT NULL,
	`device_id` text NOT NULL,
	`body` text NOT NULL,
	`reply_to` integer,
	`pinned` integer DEFAULT false NOT NULL,
	`removed` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `community_profiles`(`device_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `community_messages_room_idx` ON `community_messages` (`room`,`id`);--> statement-breakpoint
CREATE INDEX `community_messages_device_idx` ON `community_messages` (`device_id`);--> statement-breakpoint
CREATE TABLE `community_mod_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target_username` text,
	`message_id` integer,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `community_profiles` (
	`device_id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`sign` text NOT NULL,
	`joined_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`suspended_until` text,
	`strikes` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `profiles`(`device_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_profiles_username_idx` ON `community_profiles` (`username`);--> statement-breakpoint
CREATE TABLE `community_reads` (
	`device_id` text NOT NULL,
	`room` text NOT NULL,
	`last_id` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`device_id`, `room`),
	FOREIGN KEY (`device_id`) REFERENCES `community_profiles`(`device_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `community_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reporter_id` text NOT NULL,
	`message_id` integer NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`handled_at` text,
	FOREIGN KEY (`reporter_id`) REFERENCES `community_profiles`(`device_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_reports_once_idx` ON `community_reports` (`reporter_id`,`message_id`);--> statement-breakpoint
CREATE INDEX `community_reports_status_idx` ON `community_reports` (`status`,`id`);