CREATE TABLE `sky_daily` (
	`day` text NOT NULL,
	`key` text NOT NULL,
	`payload_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`day`, `key`)
);
