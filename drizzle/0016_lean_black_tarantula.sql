-- Production: these columns were added by hand before this file was generated (27-28/09/2026).
ALTER TABLE `users` ADD `trial_ends_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `trial_day2_sent_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `trial_reminder_sent_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `trial_ended_sent_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `email_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `email_opt_out` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_token_idx` ON `users` (`email_token`);