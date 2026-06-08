ALTER TABLE `property` ADD `normalized_address_key` text;
UPDATE `property`
SET `normalized_address_key` =
  lower(trim(coalesce(`street`, ''))) ||
  CASE
    WHEN trim(coalesce(`address_line_2`, '')) = '' THEN ''
    ELSE '|' || lower(trim(`address_line_2`))
  END || '|' ||
  lower(trim(coalesce(`city`, ''))) || '|' ||
  lower(trim(coalesce(`state`, ''))) || '|' ||
  substr(lower(trim(coalesce(`zip`, ''))), 1, 5)
WHERE `normalized_address_key` IS NULL;
CREATE INDEX `property_normalizedAddressKey_idx` ON `property` (`normalized_address_key`);
CREATE TABLE `app_setting` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text,
  `updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
