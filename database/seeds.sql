-- =====================================================================
-- Seed Data for Student Service Appointment & Queue Management System
-- Passwords for default accounts:
-- Admin:    admin@srcb.edu.ph    / Admin@123 (or password123)
-- Staff:    staff@srcb.edu.ph    / Staff@123 (or password123)
-- Student:  student1@srcb.edu.ph / Student@123 (or password123)
-- All default seed accounts use bcrypt hash for: 'password123'
-- Hash: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- =====================================================================

USE `student_services_db`;

-- 1. Insert Initial Users
INSERT INTO `users` (`id`, `student_id_number`, `first_name`, `middle_name`, `last_name`, `email`, `password_hash`, `role`, `contact_number`, `department_or_course`, `year_level`, `is_active`) VALUES
(1, NULL, 'System', NULL, 'Administrator', 'admin@srcb.edu.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '09123456789', 'Information Technology Office', NULL, 1),
(2, NULL, 'Maria', 'Santos', 'Reyes', 'staff@srcb.edu.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', '09234567890', 'Registrar Office', NULL, 1),
(3, '2026-0001', 'Juan', 'Protacio', 'Dela Cruz', 'student1@srcb.edu.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', '09345678901', 'BS Information Technology', '3rd Year', 1)
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- 2. Insert Standard Institutional Services
-- Mix of Appointment-Based and Queue-Based Services
INSERT INTO `services` (`id`, `name`, `code`, `description`, `category`, `service_type`, `location_or_counter`, `estimated_duration_mins`, `max_daily_capacity`, `requirements`, `is_active`) VALUES
-- Appointment Services
(1, 'Transcript of Records (TOR) Request', 'REG-TOR', 'Formal issuance of Official Transcript of Records for graduation, employment, or scholarship purposes.', 'Registrar', 'appointment', 'Registrar Office - Window 1', 20, 30, 'Clearance Form, 2x2 ID Picture, Valid Student ID', 1),
(2, 'Academic Advising & Evaluation', 'DEAN-ADV', 'One-on-one academic consultation with Department Head or Dean regarding course prerequisites and graduation status.', 'Dean Office', 'appointment', 'Dean Office - Consultation Room', 30, 20, 'Latest Curriculum Checklist, Copy of Grades', 1),
(3, 'Guidance Counseling Session', 'GUID-CNSL', 'Confidential student counseling, psycho-social evaluation, or career assessment.', 'Guidance', 'appointment', 'Guidance Office - Room 204', 45, 15, 'Student ID', 1),
(4, 'Certificate of Good Moral Character', 'REG-GMC', 'Request and release of official certificate of good standing and moral conduct.', 'Registrar', 'appointment', 'Registrar Office - Window 2', 15, 40, 'Official Receipt of Fee, Valid Student ID', 1),

-- Queue Services
(5, 'Tuition & Fees Payment', 'FIN-PAY', 'Walk-in cashier counter for tuition payment, promissory note validation, and official receipts.', 'Finance', 'queue', 'Cashier Counter 1 & 2', 10, 150, 'Assessment Form, Cash / Proof of Payment', 1),
(6, 'Student ID Validation & RFID Sticker', 'IT-ID', 'Annual ID barcode validation, RFID activation, and semester sticker renewal.', 'IT Department', 'queue', 'IT Helpdesk - Booth A', 5, 200, 'Current Semester Registration Form, Physical ID Card', 1),
(7, 'Semester Clearance Signing', 'REG-CLR', 'Walk-in verification and physical or digital signature stamping on student clearance sheets.', 'Registrar', 'queue', 'Registrar Office - Express Window', 8, 120, 'Printed Clearance Form with Library/Dept approvals', 1),
(8, 'Library Book Borrowing & Return', 'LIB-CIR', 'General circulation counter for physical book checkout, returns, and penalty clearance.', 'Library', 'queue', 'Library Main Circulation Desk', 5, 100, 'Student Library Card', 1)
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

-- 3. Insert Service Schedules for Appointment Services (Monday to Friday: 8 AM to 5 PM)
-- day_of_week: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
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
(4, 5, '08:00:00', '17:00:00', 15, 4, 1)
ON DUPLICATE KEY UPDATE `is_active` = VALUES(`is_active`);
