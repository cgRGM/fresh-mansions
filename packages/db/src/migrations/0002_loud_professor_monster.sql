PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_quote` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`customer_id` text NOT NULL,
	`estimate_high` integer,
	`estimate_low` integer,
	`finalized_at` integer,
	`id` text PRIMARY KEY NOT NULL,
	`notes` text,
	`preferred_end_date` text,
	`preferred_start_date` text,
	`preferred_visit_time` text,
	`property_id` text NOT NULL,
	`property_size` text,
	`scheduled_visit_at` integer,
	`service_type` text NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`time_preference` text,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`property_id`) REFERENCES `property`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_quote`("created_at", "customer_id", "estimate_high", "estimate_low", "finalized_at", "id", "notes", "preferred_end_date", "preferred_start_date", "preferred_visit_time", "property_id", "property_size", "scheduled_visit_at", "service_type", "status", "time_preference", "updated_at") SELECT "created_at", "customer_id", "estimate_high", "estimate_low", "finalized_at", "id", "notes", "preferred_end_date", "preferred_start_date", "preferred_visit_time", "property_id", "property_size", "scheduled_visit_at", "service_type", "status", "time_preference", "updated_at" FROM `quote`;--> statement-breakpoint
DROP TABLE `quote`;--> statement-breakpoint
ALTER TABLE `__new_quote` RENAME TO `quote`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `quote_customerId_idx` ON `quote` (`customer_id`);--> statement-breakpoint
CREATE INDEX `quote_propertyId_idx` ON `quote` (`property_id`);