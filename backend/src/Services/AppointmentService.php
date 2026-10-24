<?php
namespace App\Services;

use App\Core\Database;
use App\Core\Response;
use PDO;

class AppointmentService {
    public static function bookAppointment(int $userId, array $data): array {
        $serviceId = (int)($data['service_id'] ?? 0);
        $appointmentDate = trim($data['appointment_date'] ?? '');
        $startTime = trim($data['start_time'] ?? '');
        $endTime = trim($data['end_time'] ?? '');
        $purpose = trim($data['purpose'] ?? '');

        if (!$serviceId || empty($appointmentDate) || empty($startTime) || empty($endTime) || empty($purpose)) {
            Response::error('All fields are required (service, date, time slot, and purpose).', 422);
        }

        $service = ServiceManager::getServiceById($serviceId);
        if (!$service || $service['service_type'] !== 'appointment' || (int)$service['is_active'] !== 1) {
            Response::error('The selected service is not available for online appointment booking.', 400);
        }

        $today = date('Y-m-d');
        if ($appointmentDate < $today) {
            Response::error('Cannot schedule appointments in the past.', 400);
        }

        $db = Database::getConnection();

        // Check if student already has a pending or approved appointment for this service on this date
        $checkExisting = $db->prepare("
            SELECT id, appointment_code, status 
            FROM appointments 
            WHERE user_id = :user_id 
              AND service_id = :service_id 
              AND appointment_date = :date 
              AND status IN ('pending', 'approved') 
            LIMIT 1
        ");
        $checkExisting->execute(['user_id' => $userId, 'service_id' => $serviceId, 'date' => $appointmentDate]);
        if ($checkExisting->fetch()) {
            Response::error('You already have an active (pending or approved) appointment for this service on this date.', 409);
        }

        // Validate slot availability
        $slots = ServiceManager::getAvailableSlots($serviceId, $appointmentDate);
        $selectedSlot = null;
        foreach ($slots as $slot) {
            if ($slot['start_time'] === $startTime || date('H:i:s', strtotime($slot['start_time'])) === date('H:i:s', strtotime($startTime))) {
                $selectedSlot = $slot;
                break;
            }
        }

        if (!$selectedSlot || !$selectedSlot['is_available']) {
            Response::error('The selected time slot is full or unavailable. Please choose another slot.', 400);
        }

        // Generate unique appointment code
        $randomStr = strtoupper(substr(bin2hex(random_bytes(3)), 0, 4));
        $dateCode = date('Ymd', strtotime($appointmentDate));
        $code = "APT-{$dateCode}-{$randomStr}";

        $stmt = $db->prepare("
            INSERT INTO appointments (appointment_code, user_id, service_id, appointment_date, start_time, end_time, purpose, status, created_at)
            VALUES (:code, :user_id, :service_id, :date, :start_time, :end_time, :purpose, 'pending', NOW())
        ");

        $stmt->execute([
            'code'       => $code,
            'user_id'    => $userId,
            'service_id' => $serviceId,
            'date'       => $appointmentDate,
            'start_time' => $startTime,
            'end_time'   => $endTime,
            'purpose'    => $purpose
        ]);

        $appointmentId = (int)$db->lastInsertId();

        // In-app notification
        NotificationService::create($userId, 'Appointment Request Submitted', "Your appointment request for {$service['name']} on " . date('M d, Y', strtotime($appointmentDate)) . " ({$code}) has been submitted and is awaiting staff approval.", 'appointment', $appointmentId);

        // Audit Log
        AuditService::log($userId, 'BOOK_APPOINTMENT', 'appointment', $appointmentId, ['code' => $code, 'service' => $service['name']]);

        return self::getAppointmentById($appointmentId);
    }

    public static function getAppointments(array $filters = [], ?array $currentUser = null): array {
        $db = Database::getConnection();
        $sql = "
            SELECT a.*, 
                   u.student_id_number, u.first_name, u.last_name, u.email as student_email, u.contact_number, u.department_or_course, u.year_level,
                   s.name as service_name, s.code as service_code, s.category as service_category, s.location_or_counter, s.requirements,
                   p.first_name as processor_first_name, p.last_name as processor_last_name
            FROM appointments a
            JOIN users u ON a.user_id = u.id
            JOIN services s ON a.service_id = s.id
            LEFT JOIN users p ON a.processed_by = p.id
            WHERE 1=1
        ";
        $params = [];

        // If student, strictly constrain to their own appointments
        if ($currentUser && $currentUser['role'] === 'student') {
            $sql .= " AND a.user_id = :current_user_id";
            $params['current_user_id'] = $currentUser['id'];
        } elseif ($currentUser && $currentUser['role'] === 'staff') {
            $staffCategory = ServiceManager::getCategoryForOffice($currentUser['department_or_course'] ?? '');
            if ($staffCategory) {
                $sql .= " AND (s.category = :staff_cat OR s.category LIKE :staff_cat_like)";
                $params['staff_cat'] = $staffCategory;
                $params['staff_cat_like'] = "%{$staffCategory}%";
            }
        } elseif (!empty($filters['user_id'])) {
            $sql .= " AND a.user_id = :user_id";
            $params['user_id'] = (int)$filters['user_id'];
        }

        // Support explicit office / category filter
        if (!empty($filters['category']) || !empty($filters['office'])) {
            $filterCat = ServiceManager::getCategoryForOffice($filters['category'] ?? $filters['office']);
            if ($filterCat) {
                $sql .= " AND (s.category = :target_cat OR s.category LIKE :target_cat_like)";
                $params['target_cat'] = $filterCat;
                $params['target_cat_like'] = "%{$filterCat}%";
            }
        }

        if (!empty($filters['status'])) {
            $sql .= " AND a.status = :status";
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['service_id'])) {
            $sql .= " AND a.service_id = :service_id";
            $params['service_id'] = (int)$filters['service_id'];
        }

        if (!empty($filters['date'])) {
            $sql .= " AND a.appointment_date = :date";
            $params['date'] = $filters['date'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (a.appointment_code LIKE :search OR u.student_id_number LIKE :search OR u.first_name LIKE :search OR u.last_name LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }

        $sql .= " ORDER BY a.appointment_date DESC, a.start_time DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function getAppointmentById(int $id, ?array $currentUser = null): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT a.*, 
                   u.student_id_number, u.first_name, u.last_name, u.email as student_email, u.contact_number, u.department_or_course, u.year_level,
                   s.name as service_name, s.code as service_code, s.category as service_category, s.location_or_counter, s.requirements,
                   p.first_name as processor_first_name, p.last_name as processor_last_name
            FROM appointments a
            JOIN users u ON a.user_id = u.id
            JOIN services s ON a.service_id = s.id
            LEFT JOIN users p ON a.processed_by = p.id
            WHERE a.id = :id 
            LIMIT 1
        ");
        $stmt->execute(['id' => $id]);
        $appointment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$appointment) {
            return null;
        }

        // Student access restriction
        if ($currentUser && $currentUser['role'] === 'student' && (int)$appointment['user_id'] !== (int)$currentUser['id']) {
            Response::error('Unauthorized access to this appointment.', 403);
        }

        // Staff access restriction
        if ($currentUser && $currentUser['role'] === 'staff') {
            if (!ServiceManager::officeMatchesCategory($currentUser['department_or_course'] ?? '', $appointment['service_category'] ?? '')) {
                Response::error("Unauthorized access. This appointment belongs to {$appointment['service_category']}, outside your designated office ({$currentUser['department_or_course']}).", 403);
            }
        }

        return $appointment;
    }

    public static function updateStatus(int $id, string $status, array $data, int $staffUserId): array {
        $validStatuses = ['approved', 'rejected', 'rescheduled', 'completed', 'cancelled'];
        if (!in_array($status, $validStatuses, true)) {
            Response::error('Invalid appointment status update.', 422);
        }

        $appointment = self::getAppointmentById($id);
        if (!$appointment) {
            Response::error('Appointment not found.', 404);
        }

        $db = Database::getConnection();

        if ($staffUserId) {
            $userStmt = $db->prepare("SELECT role, department_or_course FROM users WHERE id = :id");
            $userStmt->execute(['id' => $staffUserId]);
            $staffUser = $userStmt->fetch(PDO::FETCH_ASSOC);
            if ($staffUser && $staffUser['role'] === 'staff') {
                if (!ServiceManager::officeMatchesCategory($staffUser['department_or_course'] ?? '', $appointment['service_category'] ?? '')) {
                    Response::error("Access denied. You cannot process appointments outside your designated office ({$staffUser['department_or_course']}).", 403);
                }
            }
        }

        $adminNotes = trim($data['admin_notes'] ?? $appointment['admin_notes'] ?? '');
        $rejectionReason = trim($data['rejection_reason'] ?? $appointment['rejection_reason'] ?? '');
        $newDate = trim($data['appointment_date'] ?? $appointment['appointment_date']);
        $newStartTime = trim($data['start_time'] ?? $appointment['start_time']);
        $newEndTime = trim($data['end_time'] ?? $appointment['end_time']);

        if ($status === 'rejected' && empty($rejectionReason)) {
            Response::error('Please provide a reason for declining the appointment request.', 422);
        }

        $stmt = $db->prepare("
            UPDATE appointments 
            SET status = :status,
                admin_notes = :admin_notes,
                rejection_reason = :rejection_reason,
                appointment_date = :appointment_date,
                start_time = :start_time,
                end_time = :end_time,
                processed_by = :staff_id,
                processed_at = NOW()
            WHERE id = :id
        ");

        $stmt->execute([
            'status'           => $status,
            'admin_notes'      => $adminNotes ?: null,
            'rejection_reason' => ($status === 'rejected') ? $rejectionReason : null,
            'appointment_date' => $newDate,
            'start_time'       => $newStartTime,
            'end_time'         => $newEndTime,
            'staff_id'         => $staffUserId,
            'id'               => $id
        ]);

        $updatedAppointment = self::getAppointmentById($id);

        $studentData = [
            'first_name' => $appointment['first_name'],
            'last_name'  => $appointment['last_name'],
            'email'      => $appointment['student_email']
        ];

        $serviceData = [
            'name'                => $appointment['service_name'],
            'location_or_counter' => $appointment['location_or_counter'],
            'requirements'        => $appointment['requirements']
        ];

        // Trigger Transactional Email & In-App Notification based on status
        switch ($status) {
            case 'approved':
                NotificationService::create($appointment['user_id'], 'Appointment Approved!', "Your appointment for {$appointment['service_name']} ({$appointment['appointment_code']}) has been approved.", 'appointment', $id);
                EmailService::sendAppointmentApproved($updatedAppointment, $studentData, $serviceData);
                break;

            case 'rejected':
                NotificationService::create($appointment['user_id'], 'Appointment Request Declined', "Your appointment request ({$appointment['appointment_code']}) was declined: {$rejectionReason}", 'appointment', $id);
                EmailService::sendAppointmentRejected($updatedAppointment, $studentData, $serviceData, $rejectionReason);
                break;

            case 'rescheduled':
                NotificationService::create($appointment['user_id'], 'Appointment Rescheduled', "Your appointment schedule has been moved to " . date('M d, Y', strtotime($newDate)) . " ({$newStartTime}).", 'appointment', $id);
                EmailService::sendAppointmentRescheduled($updatedAppointment, $studentData, $serviceData, $adminNotes);
                break;

            case 'completed':
                NotificationService::create($appointment['user_id'], 'Appointment Completed', "Your appointment transaction ({$appointment['appointment_code']}) was marked as completed. Thank you!", 'appointment', $id);
                break;

            case 'cancelled':
                NotificationService::create($appointment['user_id'], 'Appointment Cancelled', "Your appointment ({$appointment['appointment_code']}) has been cancelled.", 'appointment', $id);
                break;
        }

        AuditService::log($staffUserId, 'UPDATE_APPOINTMENT_STATUS', 'appointment', $id, ['new_status' => $status, 'code' => $appointment['appointment_code']]);

        return $updatedAppointment;
    }

    public static function cancelByStudent(int $id, int $studentUserId): array {
        $appointment = self::getAppointmentById($id);
        if (!$appointment || (int)$appointment['user_id'] !== $studentUserId) {
            Response::error('Appointment not found or unauthorized.', 404);
        }

        if (!in_array($appointment['status'], ['pending', 'approved'], true)) {
            Response::error('Only pending or approved appointments can be cancelled.', 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = :id");
        $stmt->execute(['id' => $id]);

        NotificationService::create($studentUserId, 'Appointment Cancelled', "You have cancelled your appointment ({$appointment['appointment_code']}).", 'appointment', $id);
        AuditService::log($studentUserId, 'CANCEL_APPOINTMENT', 'appointment', $id, ['code' => $appointment['appointment_code']]);

        return self::getAppointmentById($id);
    }
}
