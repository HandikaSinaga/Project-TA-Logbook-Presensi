-- Manual SQL Migration: Add Approval Fields to Attendances
-- Run this in MySQL/PhpMyAdmin or your database client

USE db_presensi_ta;

-- Add approval fields
ALTER TABLE attendances ADD COLUMN approved_by INT NULL COMMENT 'ID supervisor yang menyetujui';
ALTER TABLE attendances ADD COLUMN approved_at DATETIME NULL COMMENT 'Waktu persetujuan';
ALTER TABLE attendances ADD COLUMN rejected_by INT NULL COMMENT 'ID supervisor yang menolak';
ALTER TABLE attendances ADD COLUMN rejected_at DATETIME NULL COMMENT 'Waktu penolakan';
ALTER TABLE attendances ADD COLUMN rejection_reason TEXT NULL COMMENT 'Alasan penolakan';
ALTER TABLE attendances ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT 'Status approval oleh supervisor';

-- Add foreign key constraints
ALTER TABLE attendances 
ADD CONSTRAINT fk_attendances_approved_by 
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE attendances 
ADD CONSTRAINT fk_attendances_rejected_by 
FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Update existing records to approved status
UPDATE attendances SET approval_status = 'approved' WHERE approval_status IS NULL OR approval_status = '';

-- Mark migration as done
INSERT INTO SequelizeMeta (name) VALUES ('20260110000001-add-approval-fields-to-attendances.cjs');

SELECT 'Migration completed successfully!' as status;
