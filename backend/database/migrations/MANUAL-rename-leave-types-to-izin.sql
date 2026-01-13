-- Manual Migration: Rename Leave Types to Izin
-- Run this in MySQL

USE db_presensi_ta;

-- Step 1: Fix NULL values first
UPDATE leaves SET type = 'keperluan' WHERE type IS NULL;

-- Step 2: Drop existing ENUM constraint
ALTER TABLE leaves MODIFY COLUMN type VARCHAR(20);

-- Step 3: Update values
UPDATE leaves SET type = 'izin_sakit' WHERE type = 'sakit';
UPDATE leaves SET type = 'izin_keperluan' WHERE type = 'keperluan';

-- Step 4: Re-add ENUM constraint with new values
ALTER TABLE leaves MODIFY COLUMN type ENUM('izin_sakit', 'izin_keperluan') NOT NULL;

-- Verify the changes
SELECT type, COUNT(*) as count FROM leaves GROUP BY type;
