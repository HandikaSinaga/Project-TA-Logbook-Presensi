-- Migration: Add testing mode fields to office_networks table
-- Date: 2024-01-XX
-- Purpose: Enable localhost testing mode for WiFi checkin without valid SSID

-- Add bssid column (BSSID/IP Address) if not exists
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'db_presensi_ta' 
    AND TABLE_NAME = 'office_networks' 
    AND COLUMN_NAME = 'bssid');

SET @sql_bssid = IF(@col_exists = 0,
    'ALTER TABLE office_networks ADD COLUMN bssid VARCHAR(100) NULL COMMENT "BSSID (MAC Address) atau IP Address WiFi untuk testing" AFTER ssid',
    'SELECT "Column bssid already exists" AS message');

PREPARE stmt FROM @sql_bssid;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add is_testing column if not exists
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'db_presensi_ta' 
    AND TABLE_NAME = 'office_networks' 
    AND COLUMN_NAME = 'is_testing');

SET @sql_testing = IF(@col_exists = 0,
    'ALTER TABLE office_networks ADD COLUMN is_testing BOOLEAN DEFAULT FALSE COMMENT "Mode testing: bypass validasi SSID, hanya cek IP 127.0.0.1" AFTER is_active',
    'SELECT "Column is_testing already exists" AS message');

PREPARE stmt FROM @sql_testing;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Show structure
DESCRIBE office_networks;
