CREATE UNIQUE INDEX `achievements_device_key_idx` ON `achievements` (`device_id`,`achievement_key`);--> statement-breakpoint
CREATE INDEX `analytics_events_device_id_idx` ON `analytics_events` (`device_id`);--> statement-breakpoint
CREATE INDEX `analytics_events_name_idx` ON `analytics_events` (`event_name`);--> statement-breakpoint
CREATE INDEX `goals_device_id_idx` ON `goals` (`device_id`);--> statement-breakpoint
CREATE INDEX `journal_entries_device_id_idx` ON `journal_entries` (`device_id`);--> statement-breakpoint
CREATE INDEX `mission_completions_device_id_idx` ON `mission_completions` (`device_id`);