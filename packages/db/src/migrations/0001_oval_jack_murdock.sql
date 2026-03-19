CREATE TABLE `contractor` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`display_name` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contractor_user_id_unique` ON `contractor` (`user_id`);--> statement-breakpoint
CREATE INDEX `contractor_userId_idx` ON `contractor` (`user_id`);--> statement-breakpoint
CREATE TABLE `customer` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`phone` text,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_user_id_unique` ON `customer` (`user_id`);--> statement-breakpoint
CREATE INDEX `customer_userId_idx` ON `customer` (`user_id`);--> statement-breakpoint
CREATE TABLE `property` (
	`address_line_2` text,
	`city` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`customer_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`nickname` text,
	`state` text NOT NULL,
	`street` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`zip` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `property_customerId_idx` ON `property` (`customer_id`);--> statement-breakpoint
CREATE TABLE `quote` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`customer_id` text NOT NULL,
	`estimate_high` integer,
	`estimate_low` integer,
	`id` text PRIMARY KEY NOT NULL,
	`notes` text,
	`preferred_end_date` text,
	`preferred_start_date` text,
	`property_id` text NOT NULL,
	`property_size` text,
	`service_type` text NOT NULL,
	`status` text DEFAULT 'pending_review' NOT NULL,
	`time_preference` text,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`property_id`) REFERENCES `property`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `quote_customerId_idx` ON `quote` (`customer_id`);--> statement-breakpoint
CREATE INDEX `quote_propertyId_idx` ON `quote` (`property_id`);--> statement-breakpoint
CREATE TABLE `quote_photo` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`filename` text,
	`id` text PRIMARY KEY NOT NULL,
	`quote_id` text NOT NULL,
	`url` text NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `quote`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `quotePhoto_quoteId_idx` ON `quote_photo` (`quote_id`);--> statement-breakpoint
CREATE TABLE `work_order` (
	`completed_at` integer,
	`contractor_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`notes` text,
	`quote_id` text NOT NULL,
	`scheduled_date` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractor`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`quote_id`) REFERENCES `quote`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workOrder_quoteId_idx` ON `work_order` (`quote_id`);--> statement-breakpoint
CREATE INDEX `workOrder_contractorId_idx` ON `work_order` (`contractor_id`);