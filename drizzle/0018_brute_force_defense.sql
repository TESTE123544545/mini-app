CREATE TABLE `ip_blocks` (
	`ip` text PRIMARY KEY NOT NULL,
	`until` text NOT NULL,
	`strikes` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `login_failures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ip` text NOT NULL,
	`asn` text,
	`account` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `login_failures_ip_idx` ON `login_failures` (`ip`,`created_at`);--> statement-breakpoint
CREATE INDEX `login_failures_account_idx` ON `login_failures` (`account`,`created_at`);--> statement-breakpoint
CREATE INDEX `login_failures_asn_idx` ON `login_failures` (`asn`,`created_at`);--> statement-breakpoint
CREATE TABLE `security_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`ip` text NOT NULL,
	`asn` text,
	`country` text,
	`detail` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `security_events_created_at_idx` ON `security_events` (`created_at`);