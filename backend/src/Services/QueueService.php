<?php
namespace App\Services;

use App\Core\Database;
use App\Core\Response;
use PDO;

class QueueService {
    public static function joinQueue(int $userId, int $serviceId): array {
        $service = ServiceManager::getServiceById($serviceId);
        if (!$service || !in_array($service['service_type'], ['queue', 'both'], true) || (int)$service['is_active'] !== 1) {
            Response::error('Selected service is not currently accepting walk-in queue requests.', 400);
        }

        $today = date('Y-m-d');
        $db = Database::getConnection();

        // Check if student already holds any active queue ticket in line today
        $check = $db->prepare("
            SELECT q.id, q.queue_number, q.status, q.sequence_number,
                   s.name as service_name, s.code as service_code, s.category as service_category, s.location_or_counter
            FROM queue_entries q
            JOIN services s ON q.service_id = s.id
            WHERE q.user_id = :user_id 
              AND q.queue_date = :date 
              AND q.status IN ('waiting', 'calling', 'serving') 
            LIMIT 1
        ");
        $check->execute(['user_id' => $userId, 'date' => $today]);
        $existing = $check->fetch(PDO::FETCH_ASSOC);
        if ($existing) {
            Response::error(
                "You already hold an active queue ticket ({$existing['queue_number']}) for '{$existing['service_name']}' with status '{$existing['status']}'. You cannot join another queue while you have a ticket in line. You may wait for your turn or cancel your existing ticket anytime.",
                409,
                ['existing_ticket' => $existing]
            );
        }

        // Calculate next sequence number for this service today
        $seqStmt = $db->prepare("
            SELECT COALESCE(MAX(sequence_number), 0) + 1 AS next_seq 
            FROM queue_entries 
            WHERE service_id = :service_id AND queue_date = :date
        ");
        $seqStmt->execute(['service_id' => $serviceId, 'date' => $today]);
        $nextSeq = (int)$seqStmt->fetchColumn();

        // Check max daily capacity
        if ($nextSeq > (int)$service['max_daily_capacity']) {
            Response::error("Daily queue capacity ({$service['max_daily_capacity']} tickets) has been reached for {$service['name']}. Please visit tomorrow or book an appointment.", 400);
        }

        // Formatted queue number: e.g. FIN-PAY -> FP-001 or REG-001
        $prefix = preg_replace('/[^A-Z0-9]/', '', strtoupper($service['code']));
        $queueNumber = sprintf("%s-%03d", $prefix, $nextSeq);

        $stmt = $db->prepare("
            INSERT INTO queue_entries (queue_number, user_id, service_id, queue_date, sequence_number, status, created_at)
            VALUES (:queue_number, :user_id, :service_id, :queue_date, :sequence_number, 'waiting', NOW())
        ");

        $stmt->execute([
            'queue_number'    => $queueNumber,
            'user_id'         => $userId,
            'service_id'      => $serviceId,
            'queue_date'      => $today,
            'sequence_number' => $nextSeq
        ]);

        $queueId = (int)$db->lastInsertId();

        // In-app notification
        NotificationService::create($userId, 'Queue Ticket Issued', "You have joined the queue for {$service['name']}. Your ticket number is {$queueNumber}.", 'queue', $queueId);

        // Audit Log
        AuditService::log($userId, 'JOIN_QUEUE', 'queue', $queueId, ['queue_number' => $queueNumber, 'service' => $service['name']]);

        return self::getQueueEntryById($queueId);
    }

    public static function getQueueEntryById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT q.*, 
                   u.student_id_number, u.first_name, u.middle_name, u.last_name, u.email as student_email, u.contact_number, u.department_or_course, u.year_level,
                   s.name as service_name, s.code as service_code, s.category as service_category, s.location_or_counter, s.estimated_duration_mins,
                   c.first_name as caller_first_name, c.middle_name as caller_middle_name, c.last_name as caller_last_name
            FROM queue_entries q
            JOIN users u ON q.user_id = u.id
            JOIN services s ON q.service_id = s.id
            LEFT JOIN users c ON q.called_by = c.id
            WHERE q.id = :id 
            LIMIT 1
        ");
        $stmt->execute(['id' => $id]);
        $entry = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$entry) {
            return null;
        }

        // Calculate position in line if waiting
        if ($entry['status'] === 'waiting') {
            $posStmt = $db->prepare("
                SELECT COUNT(*) 
                FROM queue_entries 
                WHERE service_id = :service_id 
                  AND queue_date = :date 
                  AND status = 'waiting' 
                  AND sequence_number < :seq
            ");
            $posStmt->execute([
                'service_id' => $entry['service_id'],
                'date'       => $entry['queue_date'],
                'seq'        => $entry['sequence_number']
            ]);
            $entry['ahead_in_line'] = (int)$posStmt->fetchColumn();
            $entry['estimated_wait_mins'] = ($entry['ahead_in_line'] + 1) * (int)$entry['estimated_duration_mins'];
        } else {
            $entry['ahead_in_line'] = 0;
            $entry['estimated_wait_mins'] = 0;
        }

        return $entry;
    }

    public static function getActiveQueueForService(int $serviceId, ?string $date = null): array {
        $date = $date ?? date('Y-m-d');
        $db = Database::getConnection();
        
        $stmt = $db->prepare("
            SELECT q.*, 
                   u.student_id_number, u.first_name, u.middle_name, u.last_name, u.department_or_course, u.year_level,
                   s.name as service_name, s.code as service_code, s.location_or_counter,
                   c.first_name as caller_first_name, c.middle_name as caller_middle_name, c.last_name as caller_last_name
            FROM queue_entries q
            JOIN users u ON q.user_id = u.id
            JOIN services s ON q.service_id = s.id
            LEFT JOIN users c ON q.called_by = c.id
            WHERE q.service_id = :service_id 
              AND q.queue_date = :date 
              AND q.status IN ('waiting', 'calling', 'serving')
            ORDER BY 
              CASE q.status 
                WHEN 'calling' THEN 1 
                WHEN 'serving' THEN 2 
                WHEN 'waiting' THEN 3 
                ELSE 4 
              END ASC,
              q.sequence_number ASC
        ");
        $stmt->execute(['service_id' => $serviceId, 'date' => $date]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function callNext(int $serviceId, string $counterNumber, int $staffUserId): ?array {
        $today = date('Y-m-d');
        $db = Database::getConnection();

        // Get the next waiting ticket in line
        $stmt = $db->prepare("
            SELECT id FROM queue_entries 
            WHERE service_id = :service_id 
              AND queue_date = :date 
              AND status = 'waiting' 
            ORDER BY sequence_number ASC 
            LIMIT 1
        ");
        $stmt->execute(['service_id' => $serviceId, 'date' => $today]);
        $nextId = $stmt->fetchColumn();

        if (!$nextId) {
            Response::error('No waiting students in queue for this service.', 404);
        }

        // Update status to 'calling'
        $update = $db->prepare("
            UPDATE queue_entries 
            SET status = 'calling',
                counter_number = :counter,
                called_by = :staff_id,
                called_at = NOW()
            WHERE id = :id
        ");
        $update->execute([
            'counter'  => $counterNumber ?: 'Window Counter',
            'staff_id' => $staffUserId,
            'id'       => $nextId
        ]);

        $ticket = self::getQueueEntryById((int)$nextId);

        // In-app alert to student
        NotificationService::create($ticket['user_id'], 'Your Turn! Queue Called', "Ticket {$ticket['queue_number']} is now being called at {$ticket['counter_number']}.", 'queue', $ticket['id']);

        AuditService::log($staffUserId, 'CALL_QUEUE_TICKET', 'queue', $ticket['id'], ['ticket' => $ticket['queue_number'], 'counter' => $counterNumber]);

        return $ticket;
    }

    public static function updateStatus(int $queueId, string $status, array $data, int $staffUserId): array {
        $validStatuses = ['calling', 'serving', 'completed', 'skipped', 'cancelled'];
        if (!in_array($status, $validStatuses, true)) {
            Response::error('Invalid queue status.', 422);
        }

        $ticket = self::getQueueEntryById($queueId);
        if (!$ticket) {
            Response::error('Queue entry not found.', 404);
        }

        $db = Database::getConnection();
        $counter = trim($data['counter_number'] ?? $ticket['counter_number'] ?? '');
        $notes = trim($data['notes'] ?? $ticket['notes'] ?? '');

        $sql = "UPDATE queue_entries SET status = :status, counter_number = :counter, notes = :notes";
        $params = [
            'status'  => $status,
            'counter' => $counter ?: null,
            'notes'   => $notes ?: null,
            'id'      => $queueId
        ];

        if ($status === 'serving') {
            $sql .= ", served_at = NOW()";
        } elseif ($status === 'completed') {
            $sql .= ", completed_at = NOW()";
        }

        $sql .= " WHERE id = :id";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        $updated = self::getQueueEntryById($queueId);

        if ($status === 'completed') {
            NotificationService::create($ticket['user_id'], 'Service Completed', "Transaction for ticket {$ticket['queue_number']} has been completed. Thank you!", 'queue', $queueId);
        } elseif ($status === 'skipped') {
            NotificationService::create($ticket['user_id'], 'Ticket Skipped', "Ticket {$ticket['queue_number']} was marked as skipped due to no-show.", 'queue', $queueId);
        } elseif ($status === 'cancelled') {
            NotificationService::create($ticket['user_id'], 'Ticket Cancelled', "Ticket {$ticket['queue_number']} was cancelled by counter staff.", 'queue', $queueId);
        }

        AuditService::log($staffUserId, 'UPDATE_QUEUE_STATUS', 'queue', $queueId, ['status' => $status, 'ticket' => $ticket['queue_number']]);

        return $updated;
    }

    public static function cancelStudentTicket(int $queueId, int $userId): array {
        $ticket = self::getQueueEntryById($queueId);
        if (!$ticket) {
            Response::error('Queue ticket not found.', 404);
        }
        if ((int)$ticket['user_id'] !== $userId) {
            Response::error('Unauthorized to cancel this queue ticket.', 403);
        }
        if (!in_array($ticket['status'], ['waiting', 'calling', 'serving'], true)) {
            Response::error("Ticket cannot be cancelled because it is already marked as '{$ticket['status']}'.", 422);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE queue_entries SET status = 'cancelled' WHERE id = :id");
        $stmt->execute(['id' => $queueId]);

        // Create in-app notification confirming ticket cancellation
        NotificationService::create(
            $userId, 
            'Queue Ticket Cancelled', 
            "Your ticket {$ticket['queue_number']} for {$ticket['service_name']} ({$ticket['service_category']}) has been cancelled.", 
            'queue', 
            $queueId
        );

        AuditService::log($userId, 'CANCEL_QUEUE_TICKET', 'queue', $queueId, [
            'ticket'  => $ticket['queue_number'],
            'service' => $ticket['service_name'],
            'office'  => $ticket['service_category']
        ]);

        return self::getQueueEntryById($queueId) ?? [];
    }

    public static function getStudentActiveTickets(int $userId): array {
        $today = date('Y-m-d');
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT q.*, s.name as service_name, s.code as service_code, s.category as service_category, s.location_or_counter, s.estimated_duration_mins
            FROM queue_entries q
            JOIN services s ON q.service_id = s.id
            WHERE q.user_id = :user_id 
              AND q.queue_date = :date
              AND q.status IN ('waiting', 'calling', 'serving')
            ORDER BY q.created_at DESC
        ");
        $stmt->execute(['user_id' => $userId, 'date' => $today]);
        $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($tickets as &$t) {
            if ($t['status'] === 'waiting') {
                $posStmt = $db->prepare("
                    SELECT COUNT(*) 
                    FROM queue_entries 
                    WHERE service_id = :service_id AND queue_date = :date AND status = 'waiting' AND sequence_number < :seq
                ");
                $posStmt->execute(['service_id' => $t['service_id'], 'date' => $today, 'seq' => $t['sequence_number']]);
                $t['ahead_in_line'] = (int)$posStmt->fetchColumn();
                $t['estimated_wait_mins'] = ($t['ahead_in_line'] + 1) * (int)$t['estimated_duration_mins'];
            } else {
                $t['ahead_in_line'] = 0;
                $t['estimated_wait_mins'] = 0;
            }
        }

        return $tickets;
    }

    public static function getPublicDisplayData(): array {
        $today = date('Y-m-d');
        $db = Database::getConnection();

        // Currently Calling / Serving across all counters
        $activeStmt = $db->prepare("
            SELECT q.id, q.queue_number, q.status, q.counter_number, q.called_at, q.served_at,
                   s.name as service_name, s.code as service_code, s.category as service_category, s.location_or_counter
            FROM queue_entries q
            JOIN services s ON q.service_id = s.id
            WHERE q.queue_date = :date 
              AND q.status IN ('calling', 'serving')
            ORDER BY q.called_at DESC
        ");
        $activeStmt->execute(['date' => $today]);
        $nowServing = $activeStmt->fetchAll(PDO::FETCH_ASSOC);

        // Upcoming Waiting summary per service (accurately picking lowest sequence waiting student)
        $waitingStmt = $db->prepare("
            SELECT s.id as service_id, s.name as service_name, s.code as service_code, s.category,
                   COUNT(q.id) as total_waiting,
                   (
                       SELECT q2.queue_number 
                       FROM queue_entries q2 
                       WHERE q2.service_id = s.id 
                         AND q2.queue_date = :date 
                         AND q2.status = 'waiting' 
                       ORDER BY q2.sequence_number ASC 
                       LIMIT 1
                   ) as next_in_line
            FROM services s
            LEFT JOIN queue_entries q ON s.id = q.service_id AND q.queue_date = :date AND q.status = 'waiting'
            WHERE s.service_type IN ('queue', 'both') AND s.is_active = 1
            GROUP BY s.id, s.name, s.code, s.category
            ORDER BY s.category ASC, s.name ASC
        ");
        $waitingStmt->execute(['date' => $today]);
        $servicesWaiting = $waitingStmt->fetchAll(PDO::FETCH_ASSOC);

        // Distinct active registered offices offering queue services
        $officesStmt = $db->query("
            SELECT DISTINCT category 
            FROM services 
            WHERE service_type IN ('queue', 'both') AND is_active = 1 AND category IS NOT NULL AND TRIM(category) != ''
            ORDER BY category ASC
        ");
        $registeredOffices = $officesStmt->fetchAll(PDO::FETCH_COLUMN);

        return [
            'now_serving'        => $nowServing,
            'services_summary'   => $servicesWaiting,
            'registered_offices' => $registeredOffices,
            'server_time'        => date('Y-m-d H:i:s'),
            'date_formatted'     => date('l, F d, Y')
        ];
    }
}
