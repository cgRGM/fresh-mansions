CREATE TABLE `service` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_slug_unique` ON `service` (`slug`);
--> statement-breakpoint
-- Recreate route_stop with nullable work_order_id and new property_id column
CREATE TABLE `route_stop_new` (
	`id` text PRIMARY KEY NOT NULL,
	`route_id` text NOT NULL REFERENCES `route`(`id`) ON DELETE cascade,
	`work_order_id` text REFERENCES `work_order`(`id`) ON DELETE cascade,
	`property_id` text REFERENCES `property`(`id`) ON DELETE set null,
	`sequence` integer NOT NULL,
	`status` text NOT NULL DEFAULT 'pending',
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `route_stop_new` (`id`, `route_id`, `work_order_id`, `sequence`, `status`, `notes`, `created_at`)
  SELECT `id`, `route_id`, `work_order_id`, `sequence`, `status`, `notes`, `created_at` FROM `route_stop`;
--> statement-breakpoint
DROP TABLE `route_stop`;
--> statement-breakpoint
ALTER TABLE `route_stop_new` RENAME TO `route_stop`;
--> statement-breakpoint
CREATE INDEX `routeStop_routeId_idx` ON `route_stop` (`route_id`);
--> statement-breakpoint
CREATE INDEX `routeStop_workOrderId_idx` ON `route_stop` (`work_order_id`);
--> statement-breakpoint
CREATE INDEX `routeStop_propertyId_idx` ON `route_stop` (`property_id`);
--> statement-breakpoint
-- Seed default services
INSERT INTO `service` (`id`, `name`, `slug`, `description`, `is_active`, `sort_order`) VALUES
  ('svc_mowing', 'Mowing', 'mowing', 'Weekly or bi-weekly lawn maintenance', 1, 0),
  ('svc_landscaping', 'Landscaping', 'landscaping', 'Beds, borders, and larger outdoor projects', 1, 1),
  ('svc_cleanup', 'Cleanup', 'cleanup', 'Leaves, debris, and overgrowth removal', 1, 2),
  ('svc_fertilization', 'Fertilization', 'fertilization', 'Feeding plans and turf health support', 1, 3);
