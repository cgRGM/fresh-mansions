CREATE TABLE `invoice` (
	`amount_due` integer NOT NULL,
	`amount_paid` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`customer_id` text NOT NULL,
	`due_date` text,
	`hosted_invoice_url` text,
	`id` text PRIMARY KEY NOT NULL,
	`note` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`stripe_customer_id` text,
	`stripe_invoice_id` text,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`work_order_id` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_order`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `invoice_customerId_idx` ON `invoice` (`customer_id`);--> statement-breakpoint
CREATE INDEX `invoice_workOrderId_idx` ON `invoice` (`work_order_id`);--> statement-breakpoint
CREATE TABLE `route` (
	`contractor_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`route_date` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractor`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `route_contractorId_idx` ON `route` (`contractor_id`);--> statement-breakpoint
CREATE INDEX `route_routeDate_idx` ON `route` (`route_date`);--> statement-breakpoint
CREATE TABLE `route_stop` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`notes` text,
	`route_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`work_order_id` text NOT NULL,
	FOREIGN KEY (`route_id`) REFERENCES `route`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_order`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `routeStop_routeId_idx` ON `route_stop` (`route_id`);--> statement-breakpoint
CREATE INDEX `routeStop_workOrderId_idx` ON `route_stop` (`work_order_id`);--> statement-breakpoint
CREATE TABLE `stripe_event` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`event_type` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`livemode` integer DEFAULT false NOT NULL,
	`payload` text NOT NULL,
	`processed_at` integer,
	`status` text DEFAULT 'received' NOT NULL,
	`stripe_created_at` integer,
	`stripe_event_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stripe_event_stripe_event_id_unique` ON `stripe_event` (`stripe_event_id`);--> statement-breakpoint
CREATE TABLE `subscription` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`customer_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`interval` text DEFAULT 'month' NOT NULL,
	`interval_count` integer DEFAULT 1 NOT NULL,
	`nickname` text,
	`price_cents` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`stripe_customer_id` text,
	`stripe_price_id` text,
	`stripe_subscription_id` text,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `subscription_customerId_idx` ON `subscription` (`customer_id`);--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'customer' NOT NULL;--> statement-breakpoint
ALTER TABLE `contractor` ADD `charges_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `contractor` ADD `contact_email` text;--> statement-breakpoint
ALTER TABLE `contractor` ADD `contact_phone` text;--> statement-breakpoint
ALTER TABLE `contractor` ADD `onboarding_completed_at` integer;--> statement-breakpoint
ALTER TABLE `contractor` ADD `payouts_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `contractor` ADD `stripe_account_id` text;--> statement-breakpoint
ALTER TABLE `contractor` ADD `stripe_account_status` text DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE `property` ADD `address_source` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `property` ADD `address_validation_status` text DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE `property` ADD `formatted_address` text;--> statement-breakpoint
ALTER TABLE `property` ADD `latitude` real;--> statement-breakpoint
ALTER TABLE `property` ADD `longitude` real;--> statement-breakpoint
ALTER TABLE `property` ADD `radar_metadata` text;--> statement-breakpoint
ALTER TABLE `property` ADD `radar_place_id` text;