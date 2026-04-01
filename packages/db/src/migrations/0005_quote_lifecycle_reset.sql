ALTER TABLE `quote` ADD `final_price` integer;--> statement-breakpoint
ALTER TABLE `quote` ADD `proposed_work_date` text;--> statement-breakpoint
ALTER TABLE `quote` ADD `quoted_at` integer;--> statement-breakpoint
UPDATE `quote`
SET `final_price` = COALESCE(`estimate_high`, `estimate_low`)
WHERE `final_price` IS NULL
  AND (`estimate_high` IS NOT NULL OR `estimate_low` IS NOT NULL);--> statement-breakpoint
UPDATE `quote`
SET `quoted_at` = `finalized_at`
WHERE `quoted_at` IS NULL
  AND `finalized_at` IS NOT NULL;--> statement-breakpoint
UPDATE `quote`
SET `proposed_work_date` = (
  SELECT `scheduled_date`
  FROM `work_order`
  WHERE `work_order`.`quote_id` = `quote`.`id`
  ORDER BY `created_at` DESC
  LIMIT 1
)
WHERE `proposed_work_date` IS NULL;--> statement-breakpoint
UPDATE `quote`
SET `status` = CASE
  WHEN `status` = 'quote_ready' THEN 'quote_sent'
  WHEN `status` = 'approved' THEN 'accepted'
  WHEN `status` = 'converted' THEN 'accepted'
  ELSE `status`
END;--> statement-breakpoint
