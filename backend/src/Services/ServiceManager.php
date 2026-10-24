<?php
namespace App\Services;

use App\Core\Database;
use App\Core\Response;
use PDO;

class ServiceManager {
    /**
     * Map a designated user office string to the canonical service category.
     */
    public static function getCategoryForOffice(?string $office): ?string {
        if (!$office) return null;
        $o = strtolower(trim($office));
        if ($o === 'all offices / system administration' || $o === 'all') {
            return null;
        }
        if (strpos($o, 'finance') !== false || strpos($o, 'cashier') !== false) {
            return 'Finance';
        }
        if (strpos($o, 'registrar') !== false) {
            return 'Registrar';
        }
        if (strpos($o, 'information technology') !== false || strpos($o, 'it') !== false) {
            return 'IT Department';
        }
        if (strpos($o, 'guidance') !== false) {
            return 'Guidance';
        }
        if (strpos($o, 'dean') !== false) {
            return 'Dean Office';
        }
        if (strpos($o, 'library') !== false) {
            return 'Library';
        }
        return $office;
    }

    /**
     * Verify whether a user's designated office matches a service's category.
     */
    public static function officeMatchesCategory(?string $userOffice, ?string $serviceCategory): bool {
        if (!$userOffice || !$serviceCategory) return false;
        $uo = strtolower(trim($userOffice));
        $sc = strtolower(trim($serviceCategory));

        if ($uo === 'all offices / system administration' || $uo === 'all') {
            return true;
        }

        if (strpos($uo, $sc) !== false || strpos($sc, $uo) !== false) {
            return true;
        }

        if ((strpos($uo, 'finance') !== false || strpos($uo, 'cashier') !== false) &&
            (strpos($sc, 'finance') !== false || strpos($sc, 'cashier') !== false)) {
            return true;
        }

        if ((strpos($uo, 'it') !== false || strpos($uo, 'information technology') !== false) &&
            (strpos($sc, 'it') !== false || strpos($sc, 'information technology') !== false)) {
            return true;
        }

        if (strpos($uo, 'registrar') !== false && strpos($sc, 'registrar') !== false) {
            return true;
        }

        if (strpos($uo, 'guidance') !== false && strpos($sc, 'guidance') !== false) {
            return true;
        }

        if (strpos($uo, 'dean') !== false && strpos($sc, 'dean') !== false) {
            return true;
        }

        if (strpos($uo, 'library') !== false && strpos($sc, 'library') !== false) {
            return true;
        }

        return false;
    }

    public static function getAllServices(bool $onlyActive = false, ?string $type = null, ?string $category = null, ?array $currentUser = null): array {
        $db = Database::getConnection();
        $sql = "SELECT s.*, 
                    (SELECT COUNT(*) FROM service_schedules ss WHERE ss.service_id = s.id AND ss.is_active = 1) AS active_schedules_count
                FROM services s 
                WHERE 1=1";
        $params = [];

        // If logged-in user is staff, scope to their designated office
        if ($currentUser && ($currentUser['role'] ?? '') === 'staff') {
            $staffCategory = self::getCategoryForOffice($currentUser['department_or_course'] ?? '');
            if ($staffCategory) {
                $category = $staffCategory;
            }
        }

        if ($onlyActive) {
            $sql .= " AND s.is_active = 1";
        }
        if ($type && in_array($type, ['appointment', 'queue'], true)) {
            $sql .= " AND s.service_type = :type";
            $params['type'] = $type;
        }
        if ($category) {
            $sql .= " AND (s.category = :category OR s.category LIKE :category_like)";
            $params['category'] = $category;
            $params['category_like'] = "%{$category}%";
        }

        $sql .= " ORDER BY s.category ASC, s.name ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($services)) {
            $schedSql = "SELECT * FROM service_schedules " . ($onlyActive ? "WHERE is_active = 1 " : "") . "ORDER BY day_of_week ASC";
            $schedStmt = $db->query($schedSql);
            $allSchedules = $schedStmt->fetchAll(PDO::FETCH_ASSOC);
            $grouped = [];
            foreach ($allSchedules as $sc) {
                $grouped[(int)$sc['service_id']][] = [
                    'id'                    => (int)$sc['id'],
                    'service_id'            => (int)$sc['service_id'],
                    'day_of_week'           => (int)$sc['day_of_week'],
                    'start_time'            => $sc['start_time'],
                    'end_time'              => $sc['end_time'],
                    'slot_duration_mins'    => (int)$sc['slot_duration_mins'],
                    'max_students_per_slot' => (int)$sc['max_students_per_slot'],
                    'is_active'             => (int)$sc['is_active']
                ];
            }

            foreach ($services as &$service) {
                $service['id'] = (int)$service['id'];
                $service['estimated_duration_mins'] = (int)$service['estimated_duration_mins'];
                $service['max_daily_capacity'] = (int)$service['max_daily_capacity'];
                $service['is_active'] = (int)$service['is_active'];
                $service['active_schedules_count'] = (int)$service['active_schedules_count'];
                $service['schedules'] = $grouped[$service['id']] ?? [];
            }
            unset($service);
        }

        return $services;
    }

    public static function getServiceById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM services WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        $service = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$service) {
            return null;
        }

        $service['id'] = (int)$service['id'];
        $service['estimated_duration_mins'] = (int)$service['estimated_duration_mins'];
        $service['max_daily_capacity'] = (int)$service['max_daily_capacity'];
        $service['is_active'] = (int)$service['is_active'];

        // Fetch schedules if appointment type
        $schedStmt = $db->prepare("SELECT * FROM service_schedules WHERE service_id = :id AND is_active = 1 ORDER BY day_of_week ASC");
        $schedStmt->execute(['id' => $id]);
        $service['schedules'] = array_map(function($sc) {
            return [
                'id'                    => (int)$sc['id'],
                'service_id'            => (int)$sc['service_id'],
                'day_of_week'           => (int)$sc['day_of_week'],
                'start_time'            => $sc['start_time'],
                'end_time'              => $sc['end_time'],
                'slot_duration_mins'    => (int)$sc['slot_duration_mins'],
                'max_students_per_slot' => (int)$sc['max_students_per_slot'],
                'is_active'             => (int)$sc['is_active']
            ];
        }, $schedStmt->fetchAll(PDO::FETCH_ASSOC));

        return $service;
    }

    public static function createService(array $data, int $adminId): array {
        $name = trim($data['name'] ?? '');
        $code = strtoupper(trim($data['code'] ?? ''));
        $type = trim($data['service_type'] ?? '');
        $category = trim($data['category'] ?? 'General');
        $location = trim($data['location_or_counter'] ?? '');
        $duration = (int)($data['estimated_duration_mins'] ?? 15);
        $capacity = (int)($data['max_daily_capacity'] ?? 50);
        $requirements = trim($data['requirements'] ?? '');
        $description = trim($data['description'] ?? '');

        if (empty($name) || empty($code) || !in_array($type, ['appointment', 'queue'], true)) {
            Response::error('Service name, unique code, and valid service type (appointment/queue) are required.', 422);
        }

        $db = Database::getConnection();
        
        // Check code uniqueness
        $check = $db->prepare("SELECT id FROM services WHERE code = :code LIMIT 1");
        $check->execute(['code' => $code]);
        if ($check->fetch()) {
            Response::error('A service with this code already exists.', 409);
        }

        $stmt = $db->prepare("
            INSERT INTO services (name, code, description, category, service_type, location_or_counter, estimated_duration_mins, max_daily_capacity, requirements, is_active, created_at)
            VALUES (:name, :code, :description, :category, :type, :location, :duration, :capacity, :requirements, 1, NOW())
        ");

        $stmt->execute([
            'name'         => $name,
            'code'         => $code,
            'description'  => $description ?: null,
            'category'     => $category ?: 'General',
            'type'         => $type,
            'location'     => $location ?: null,
            'duration'     => $duration,
            'capacity'     => $capacity,
            'requirements' => $requirements ?: null,
        ]);

        $serviceId = (int)$db->lastInsertId();

        // If default schedules provided for appointment service
        if ($type === 'appointment') {
            $schedulesToSave = !empty($data['schedules']) && is_array($data['schedules'])
                ? $data['schedules']
                : [
                    ['day_of_week' => 1, 'start_time' => '08:00:00', 'end_time' => '17:00:00', 'slot_duration_mins' => 30, 'max_students_per_slot' => 3],
                    ['day_of_week' => 2, 'start_time' => '08:00:00', 'end_time' => '17:00:00', 'slot_duration_mins' => 30, 'max_students_per_slot' => 3],
                    ['day_of_week' => 3, 'start_time' => '08:00:00', 'end_time' => '17:00:00', 'slot_duration_mins' => 30, 'max_students_per_slot' => 3],
                    ['day_of_week' => 4, 'start_time' => '08:00:00', 'end_time' => '17:00:00', 'slot_duration_mins' => 30, 'max_students_per_slot' => 3],
                    ['day_of_week' => 5, 'start_time' => '08:00:00', 'end_time' => '17:00:00', 'slot_duration_mins' => 30, 'max_students_per_slot' => 3],
                ];
            self::updateServiceSchedules($serviceId, $schedulesToSave, $adminId);
        }

        AuditService::log($adminId, 'CREATE_SERVICE', 'service', $serviceId, ['code' => $code, 'name' => $name]);

        return self::getServiceById($serviceId);
    }

    public static function updateService(int $id, array $data, int $adminId): array {
        $service = self::getServiceById($id);
        if (!$service) {
            Response::error('Service not found', 404);
        }

        $name = trim($data['name'] ?? $service['name']);
        $code = strtoupper(trim($data['code'] ?? $service['code']));
        $category = trim($data['category'] ?? $service['category']);
        $location = trim($data['location_or_counter'] ?? $service['location_or_counter']);
        $duration = (int)($data['estimated_duration_mins'] ?? $service['estimated_duration_mins']);
        $capacity = (int)($data['max_daily_capacity'] ?? $service['max_daily_capacity']);
        $requirements = trim($data['requirements'] ?? $service['requirements']);
        $description = trim($data['description'] ?? $service['description']);
        $type = trim($data['service_type'] ?? $service['service_type']);
        $isActive = isset($data['is_active']) ? (int)$data['is_active'] : (int)$service['is_active'];

        $db = Database::getConnection();

        // Check code uniqueness if changed
        if ($code !== $service['code']) {
            $check = $db->prepare("SELECT id FROM services WHERE code = :code AND id != :id LIMIT 1");
            $check->execute(['code' => $code, 'id' => $id]);
            if ($check->fetch()) {
                Response::error('Another service with this code already exists.', 409);
            }
        }

        $stmt = $db->prepare("
            UPDATE services 
            SET name = :name,
                code = :code,
                description = :description,
                category = :category,
                service_type = :type,
                location_or_counter = :location,
                estimated_duration_mins = :duration,
                max_daily_capacity = :capacity,
                requirements = :requirements,
                is_active = :is_active
            WHERE id = :id
        ");

        $stmt->execute([
            'name'         => $name,
            'code'         => $code,
            'description'  => $description ?: null,
            'category'     => $category,
            'type'         => $type,
            'location'     => $location ?: null,
            'duration'     => $duration,
            'capacity'     => $capacity,
            'requirements' => $requirements ?: null,
            'is_active'    => $isActive,
            'id'           => $id
        ]);

        if (isset($data['schedules']) && is_array($data['schedules'])) {
            if ($type === 'appointment') {
                if (empty($data['schedules'])) {
                    Response::error('Appointment services must have at least one operating day configured in the weekly schedule.', 422);
                }
                self::updateServiceSchedules($id, $data['schedules'], $adminId);
            }
        }

        AuditService::log($adminId, 'UPDATE_SERVICE', 'service', $id, ['code' => $code]);

        return self::getServiceById($id);
    }

    public static function toggleServiceActive(int $id, bool $isActive, int $adminId): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE services SET is_active = :is_active WHERE id = :id");
        $stmt->execute(['is_active' => $isActive ? 1 : 0, 'id' => $id]);
        
        AuditService::log($adminId, $isActive ? 'ACTIVATE_SERVICE' : 'DEACTIVATE_SERVICE', 'service', $id);
        return self::getServiceById($id);
    }

    public static function updateServiceSchedules(int $serviceId, array $schedules, int $adminId): void {
        $db = Database::getConnection();
        // Clear existing schedules
        $db->prepare("DELETE FROM service_schedules WHERE service_id = :service_id")->execute(['service_id' => $serviceId]);

        $insertStmt = $db->prepare("
            INSERT INTO service_schedules (service_id, day_of_week, start_time, end_time, slot_duration_mins, max_students_per_slot, is_active, created_at)
            VALUES (:service_id, :day_of_week, :start_time, :end_time, :slot_duration, :max_students, 1, NOW())
        ");

        foreach ($schedules as $sched) {
            if (!isset($sched['day_of_week']) || empty($sched['start_time']) || empty($sched['end_time'])) {
                continue;
            }
            $startTime = trim($sched['start_time']);
            $endTime = trim($sched['end_time']);
            if (strlen($startTime) === 5) $startTime .= ':00';
            if (strlen($endTime) === 5) $endTime .= ':00';

            $insertStmt->execute([
                'service_id'    => $serviceId,
                'day_of_week'   => (int)$sched['day_of_week'],
                'start_time'    => $startTime,
                'end_time'      => $endTime,
                'slot_duration' => max(5, (int)($sched['slot_duration_mins'] ?? 30)),
                'max_students'  => max(1, (int)($sched['max_students_per_slot'] ?? 3))
            ]);
        }

        AuditService::log($adminId, 'UPDATE_SCHEDULES', 'service', $serviceId);
    }

    /**
     * Compute real available time slots for a given date and service
     */
    public static function getAvailableSlots(int $serviceId, string $date): array {
        $service = self::getServiceById($serviceId);
        if (!$service || $service['service_type'] !== 'appointment' || (int)$service['is_active'] !== 1) {
            Response::error('Invalid or inactive appointment service.', 400);
        }

        // Validate date (must be today or future date)
        $timestamp = strtotime($date);
        if (!$timestamp) {
            Response::error('Invalid date format. Expected YYYY-MM-DD.', 422);
        }
        $today = date('Y-m-d');
        if ($date < $today) {
            return []; // Cannot book in the past
        }

        $dayOfWeek = (int)date('w', $timestamp); // 0=Sunday, 6=Saturday

        $db = Database::getConnection();
        $schedStmt = $db->prepare("SELECT * FROM service_schedules WHERE service_id = :service_id AND day_of_week = :day AND is_active = 1 LIMIT 1");
        $schedStmt->execute(['service_id' => $serviceId, 'day' => $dayOfWeek]);
        $schedule = $schedStmt->fetch(PDO::FETCH_ASSOC);

        if (!$schedule) {
            return []; // Service does not operate on this day
        }

        // Fetch existing booked appointments on this date
        $bookedStmt = $db->prepare("
            SELECT start_time, end_time, COUNT(*) as booked_count 
            FROM appointments 
            WHERE service_id = :service_id 
              AND appointment_date = :date 
              AND status IN ('pending', 'approved') 
            GROUP BY start_time, end_time
        ");
        $bookedStmt->execute(['service_id' => $serviceId, 'date' => $date]);
        $bookedCounts = [];
        while ($row = $bookedStmt->fetch(PDO::FETCH_ASSOC)) {
            $bookedCounts[$row['start_time']] = (int)$row['booked_count'];
        }

        // Generate discrete slots
        $slotDuration = (int)$schedule['slot_duration_mins'];
        $maxPerSlot = (int)$schedule['max_students_per_slot'];
        $startSeconds = strtotime($schedule['start_time']);
        $endSeconds = strtotime($schedule['end_time']);

        $slots = [];
        $current = $startSeconds;

        while ($current + ($slotDuration * 60) <= $endSeconds) {
            $slotStart = date('H:i:s', $current);
            $slotEnd = date('H:i:s', $current + ($slotDuration * 60));
            $slotStartHuman = date('h:i A', $current);
            $slotEndHuman = date('h:i A', $current + ($slotDuration * 60));

            $booked = $bookedCounts[$slotStart] ?? 0;
            $availableCapacity = max(0, $maxPerSlot - $booked);

            // If date is today, check if slot has already passed
            $slotTimestamp = strtotime("{$date} {$slotStart}");
            $isPastSlot = ($date === $today && $slotTimestamp <= time());

            $slots[] = [
                'start_time'         => $slotStart,
                'end_time'           => $slotEnd,
                'start_time_human'   => $slotStartHuman,
                'end_time_human'     => $slotEndHuman,
                'max_capacity'       => $maxPerSlot,
                'booked_count'       => $booked,
                'available_capacity' => $availableCapacity,
                'is_available'       => ($availableCapacity > 0 && !$isPastSlot)
            ];

            $current += ($slotDuration * 60);
        }

        return $slots;
    }
}
