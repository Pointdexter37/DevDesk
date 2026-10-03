CREATE TABLE `daily_reviews` (
	`date` text PRIMARY KEY NOT NULL,
	`reflection` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
