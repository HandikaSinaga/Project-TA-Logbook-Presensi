-- Migration: Add social media columns to users table
-- Date: 2026-01-11

ALTER TABLE `users` 
ADD COLUMN `nip` VARCHAR(50) NULL COMMENT 'Nomor Induk Pegawai/Peserta' AFTER `phone`,
ADD COLUMN `linkedin` VARCHAR(255) NULL COMMENT 'LinkedIn profile URL' AFTER `nip`,
ADD COLUMN `instagram` VARCHAR(255) NULL COMMENT 'Instagram username or URL' AFTER `linkedin`,
ADD COLUMN `telegram` VARCHAR(255) NULL COMMENT 'Telegram username or URL' AFTER `instagram`,
ADD COLUMN `github` VARCHAR(255) NULL COMMENT 'GitHub profile URL' AFTER `telegram`,
ADD COLUMN `twitter` VARCHAR(255) NULL COMMENT 'Twitter/X username or URL' AFTER `github`,
ADD COLUMN `facebook` VARCHAR(255) NULL COMMENT 'Facebook profile URL' AFTER `twitter`,
ADD COLUMN `bio` TEXT NULL COMMENT 'User biography/description' AFTER `facebook`;

-- Note: Run this migration to add social media support
-- Command: mysql -u root -p db_presensi_ta < add-social-media-columns.sql
