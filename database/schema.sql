-- =====================================================================
-- EduQueue: Student Service Appointment & Queue Management System
-- Unified MySQL Schema & Initial Seed Data
--
-- LARAGON / PHPMYADMIN / HEIDISQL QUICK SETUP:
-- 1. Open Laragon -> Click "Database" or open HeidiSQL / phpMyAdmin.
-- 2. Create/Select a query tab.
-- 3. Copy & paste this entire script and click "Execute" / "Run" (F9 in HeidiSQL).
-- =====================================================================

-- Step 1: Create Database
CREATE DATABASE IF NOT EXISTS `student_services_db`
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_unicode_ci;

USE `student_services_db`;

-- Step 2: Disable Foreign Key Checks for Safe Table Drops
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `email_logs`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `queue_entries`;
DROP TABLE IF EXISTS `appointments`;
DROP TABLE IF EXISTS `service_schedules`;
DROP TABLE IF EXISTS `services`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. USERS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id_number` VARCHAR(50) NULL UNIQUE,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'staff', 'student') NOT NULL DEFAULT 'student',
    `contact_number` VARCHAR(30) NULL,
    `department_or_course` VARCHAR(150) NULL,
    `year_level` VARCHAR(20) NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `last_login_at` DATETIME NULL DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user_role` (`role`),
    INDEX `idx_user_email` (`email`),
    INDEX `idx_user_student_id` (`student_id_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. SERVICES TABLE (Appointment vs Queue)
-- ---------------------------------------------------------------------
CREATE TABLE `services` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(20) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `category` VARCHAR(100) NOT NULL DEFAULT 'General',
    `service_type` ENUM('appointment', 'queue') NOT NULL,
    `location_or_counter` VARCHAR(150) NULL,
    `estimated_duration_mins` INT NOT NULL DEFAULT 15,
    `max_daily_capacity` INT NOT NULL DEFAULT 50,
    `requirements` TEXT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_service_type` (`service_type`),
    INDEX `idx_service_active` (`is_active`),
    INDEX `idx_service_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. SERVICE SCHEDULES TABLE (For Appointment-based services)
-- day_of_week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
-- ---------------------------------------------------------------------
CREATE TABLE `service_schedules` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `service_id` INT NOT NULL,
    `day_of_week` TINYINT NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `slot_duration_mins` INT NOT NULL DEFAULT 30,
    `max_students_per_slot` INT NOT NULL DEFAULT 3,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_service_day` (`service_id`, `day_of_week`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. APPOINTMENTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE `appointments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `appointment_code` VARCHAR(50) NOT NULL UNIQUE,
    `user_id` INT NOT NULL,
    `service_id` INT NOT NULL,
    `appointment_date` DATE NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `purpose` TEXT NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'rescheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    `admin_notes` TEXT NULL,
    `rejection_reason` TEXT NULL,
    `processed_by` INT NULL,
    `processed_at` DATETIME NULL DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`processed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_apt_date` (`appointment_date`),
    INDEX `idx_apt_status` (`status`),
    INDEX `idx_apt_user` (`user_id`),
    INDEX `idx_apt_service` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. QUEUE ENTRIES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE `queue_entries` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `queue_number` VARCHAR(50) NOT NULL,
    `user_id` INT NOT NULL,
    `service_id` INT NOT NULL,
    `queue_date` DATE NOT NULL,
    `sequence_number` INT NOT NULL,
    `status` ENUM('waiting', 'calling', 'serving', 'completed', 'skipped', 'cancelled') NOT NULL DEFAULT 'waiting',
    `counter_number` VARCHAR(50) NULL,
    `called_by` INT NULL,
    `called_at` DATETIME NULL DEFAULT NULL,
    `served_at` DATETIME NULL DEFAULT NULL,
    `completed_at` DATETIME NULL DEFAULT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`called_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    UNIQUE KEY `unique_daily_queue_number` (`queue_date`, `service_id`, `sequence_number`),
    INDEX `idx_queue_date_status` (`queue_date`, `status`),
    INDEX `idx_queue_user` (`user_id`),
    INDEX `idx_queue_service` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. NOTIFICATIONS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('appointment', 'queue', 'system') NOT NULL DEFAULT 'system',
    `related_id` INT NULL,
    `is_read` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_notif_user_read` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. EMAIL LOGS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE `email_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `recipient_email` VARCHAR(150) NOT NULL,
    `recipient_name` VARCHAR(150) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `template` VARCHAR(100) NOT NULL,
    `payload_json` TEXT NULL,
    `status` ENUM('sent', 'failed', 'queued') NOT NULL DEFAULT 'sent',
    `error_message` TEXT NULL,
    `external_message_id` VARCHAR(255) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_email_recipient` (`recipient_email`),
    INDEX `idx_email_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. AUDIT LOGS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(100) NULL,
    `entity_id` INT NULL,
    `details_json` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- STEP 3: INSERT DEFAULT SEED DATA
-- Default password for all seed accounts: password123
-- Bcrypt Hash: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- =====================================================================

-- 1. Default Users
INSERT INTO `users` (`id`, `student_id_number`, `first_name`, `last_name`, `email`, `password_hash`, `role`, `contact_number`, `department_or_course`, `year_level`, `is_active`) VALUES
(1, NULL, 'System', 'Administrator', 'admin@srcb.edu.ph', '$2y$10$Sdexpc.rHmE51ul4Ip9d7OxmwIB43nY0EitAcT.BnnxJAWg3T8SDO', 'admin', '09123456789', 'Information Technology Office', NULL, 1),
(2, NULL, 'Maria', 'Santos', 'staff@srcb.edu.ph', '$2y$10$Sdexpc.rHmE51ul4Ip9d7OxmwIB43nY0EitAcT.BnnxJAWg3T8SDO', 'staff', '09234567890', 'Registrar Office', NULL, 1),
(3, '2026-0001', 'Juan', 'Dela Cruz', 'student1@srcb.edu.ph', '$2y$10$Sdexpc.rHmE51ul4Ip9d7OxmwIB43nY0EitAcT.BnnxJAWg3T8SDO', 'student', '09345678901', 'BS Information Technology', '3rd Year', 1);

-- 2. Default Services
INSERT INTO `services` (`id`, `name`, `code`, `description`, `category`, `service_type`, `location_or_counter`, `estimated_duration_mins`, `max_daily_capacity`, `requirements`, `is_active`) VALUES
-- Appointment-Based Services
(1, 'Transcript of Records (TOR) Request', 'REG-TOR', 'Formal issuance of Official Transcript of Records for graduation, employment, or scholarship purposes.', 'Registrar', 'appointment', 'Registrar Office - Window 1', 20, 30, 'Clearance Form, 2x2 ID Picture, Valid Student ID', 1),
(2, 'Academic Advising & Evaluation', 'DEAN-ADV', 'One-on-one academic consultation with Department Head or Dean regarding course prerequisites and graduation status.', 'Dean Office', 'appointment', 'Dean Office - Consultation Room', 30, 20, 'Latest Curriculum Checklist, Copy of Grades', 1),
(3, 'Guidance Counseling Session', 'GUID-CNSL', 'Confidential student counseling, psycho-social evaluation, or career assessment.', 'Guidance', 'appointment', 'Guidance Office - Room 204', 45, 15, 'Student ID', 1),
(4, 'Certificate of Good Moral Character', 'REG-GMC', 'Request and release of official certificate of good standing and moral conduct.', 'Registrar', 'appointment', 'Registrar Office - Window 2', 15, 40, 'Official Receipt of Fee, Valid Student ID', 1),

-- Queue-Based Services
(5, 'Tuition & Fees Payment', 'FIN-PAY', 'Walk-in cashier counter for tuition payment, promissory note validation, and official receipts.', 'Finance', 'queue', 'Cashier Counter 1 & 2', 10, 150, 'Assessment Form, Cash / Proof of Payment', 1),
(6, 'Student ID Validation & RFID Sticker', 'IT-ID', 'Annual ID barcode validation, RFID activation, and semester sticker renewal.', 'IT Department', 'queue', 'IT Helpdesk - Booth A', 5, 200, 'Current Semester Registration Form, Physical ID Card', 1),
(7, 'Semester Clearance Signing', 'REG-CLR', 'Walk-in verification and physical or digital signature stamping on student clearance sheets.', 'Registrar', 'queue', 'Registrar Office - Express Window', 8, 120, 'Printed Clearance Form with Library/Dept approvals', 1),
(8, 'Library Book Borrowing & Return', 'LIB-CIR', 'General circulation counter for physical book checkout, returns, and penalty clearance.', 'Library', 'queue', 'Library Main Circulation Desk', 5, 100, 'Student Library Card', 1);

-- 3. Default Weekly Schedules for Appointment Services (Mon-Fri 8:00 AM - 5:00 PM)
INSERT INTO `service_schedules` (`service_id`, `day_of_week`, `start_time`, `end_time`, `slot_duration_mins`, `max_students_per_slot`, `is_active`) VALUES
-- REG-TOR (Service 1) Mon-Fri
(1, 1, '08:00:00', '16:00:00', 30, 3, 1),
(1, 2, '08:00:00', '16:00:00', 30, 3, 1),
(1, 3, '08:00:00', '16:00:00', 30, 3, 1),
(1, 4, '08:00:00', '16:00:00', 30, 3, 1),
(1, 5, '08:00:00', '16:00:00', 30, 3, 1),

-- DEAN-ADV (Service 2) Tue, Thu
(2, 2, '09:00:00', '15:00:00', 30, 2, 1),
(2, 4, '09:00:00', '15:00:00', 30, 2, 1),

-- GUID-CNSL (Service 3) Mon, Wed, Fri
(3, 1, '09:00:00', '16:00:00', 45, 1, 1),
(3, 3, '09:00:00', '16:00:00', 45, 1, 1),
(3, 5, '09:00:00', '16:00:00', 45, 1, 1),

-- REG-GMC (Service 4) Mon-Fri
(4, 1, '08:00:00', '17:00:00', 15, 4, 1),
(4, 2, '08:00:00', '17:00:00', 15, 4, 1),
(4, 3, '08:00:00', '17:00:00', 15, 4, 1),
(4, 4, '08:00:00', '17:00:00', 15, 4, 1),
(4, 5, '08:00:00', '17:00:00', 15, 4, 1);
