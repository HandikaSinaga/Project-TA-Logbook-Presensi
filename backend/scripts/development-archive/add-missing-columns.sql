-- Add missing columns to logbooks and leaves tables
-- Run this using MySQL client or Laragon's phpMyAdmin

USE db_presensi_ta;

-- Add location column to logbooks table if it doesn't exist
ALTER TABLE `logbooks` 
ADD COLUMN IF NOT EXISTS `location` VARCHAR(255) NULL COMMENT 'Lokasi kegiatan' AFTER `description`;

-- Add total_days column to leaves table if it doesn't exist
ALTER TABLE `leaves` 
ADD COLUMN IF NOT EXISTS `total_days` INT NULL COMMENT 'Alias untuk duration (backward compatibility)' AFTER `duration`;

-- Verify changes
DESCRIBE logbooks;
DESCRIBE leaves;
