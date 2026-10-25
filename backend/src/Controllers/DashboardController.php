<?php
namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use App\Services\QueueService;
use PDO;

class DashboardController {
    public function stats(Request $request): void {
        $user = $request->getUser();
        $db = Database::getConnection();
        $today = date('Y-m-d');

        if ($user['role'] === 'student') {
            $userId = (int)$user['id'];

            // Student-specific summary stats
            $aptStmt = $db->prepare("
                SELECT 
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_appointments,
                    COUNT(CASE WHEN status IN ('approved', 'rescheduled') AND appointment_date >= :today THEN 1 END) as upcoming_appointments,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments
                FROM appointments 
                WHERE user_id = :user_id
            ");
            $aptStmt->execute(['today' => $today, 'user_id' => $userId]);
            $aptStats = $aptStmt->fetch(PDO::FETCH_ASSOC);

            // Active student queue tickets today
            $activeTickets = QueueService::getStudentActiveTickets($userId);

            // Next upcoming appointment
            $nextAptStmt = $db->prepare("
                SELECT a.*, s.name as service_name, s.code as service_code, s.location_or_counter 
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                WHERE a.user_id = :user_id 
                  AND a.appointment_date >= :today 
                  AND a.status IN ('pending', 'approved', 'rescheduled')
                ORDER BY a.appointment_date ASC, a.start_time ASC
                LIMIT 1
            ");
            $nextAptStmt->execute(['user_id' => $userId, 'today' => $today]);
            $nextAppointment = $nextAptStmt->fetch(PDO::FETCH_ASSOC);

            // Student's recent appointments (up to 5)
            $recentAptStmt = $db->prepare("
                SELECT a.*, s.name as service_name, s.code as service_code, s.location_or_counter 
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                WHERE a.user_id = :user_id
                ORDER BY a.appointment_date DESC, a.start_time DESC
                LIMIT 5
            ");
            $recentAptStmt->execute(['user_id' => $userId]);
            $recentAppointments = $recentAptStmt->fetchAll(PDO::FETCH_ASSOC);

            // Live queue status across all active campus services
            $liveServicesStmt = $db->query("
                SELECT 
                    s.id, s.name, s.code, s.category, s.location_or_counter, s.estimated_duration_mins,
                    COUNT(CASE WHEN q.status = 'waiting' AND q.queue_date = CURDATE() THEN 1 END) as waiting_count,
                    (
                        SELECT q2.queue_number 
                        FROM queue_entries q2 
                        WHERE q2.service_id = s.id AND q2.queue_date = CURDATE() AND q2.status IN ('calling', 'serving')
                        ORDER BY CASE q2.status WHEN 'calling' THEN 1 ELSE 2 END ASC, q2.sequence_number ASC
                        LIMIT 1
                    ) as now_serving
                FROM services s
                LEFT JOIN queue_entries q ON s.id = q.service_id AND q.queue_date = CURDATE()
                WHERE s.service_type IN ('queue', 'both') AND s.is_active = 1
                GROUP BY s.id
                ORDER BY s.category ASC, s.name ASC
            ");
            $liveServices = $liveServicesStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($liveServices as &$ls) {
                $waitCount = (int)$ls['waiting_count'];
                $duration = (int)$ls['estimated_duration_mins'] ?: 10;
                $ls['estimated_wait_mins'] = $waitCount * $duration;
            }

            Response::json([
                'summary' => [
                    'pending_appointments'  => (int)($aptStats['pending_appointments'] ?? 0),
                    'upcoming_appointments' => (int)($aptStats['upcoming_appointments'] ?? 0),
                    'completed_appointments'=> (int)($aptStats['completed_appointments'] ?? 0),
                    'active_queue_tickets'  => count($activeTickets),
                ],
                'next_appointment'     => $nextAppointment ?: null,
                'recent_appointments'  => $recentAppointments,
                'active_tickets'       => $activeTickets,
                'live_services'        => $liveServices,
                'server_time'          => date('Y-m-d H:i:s')
            ], 200, 'Student live operational metrics loaded.');
            return;
        }

        // =====================================================================
        // ADMIN & STAFF OPERATIONS COMMAND CENTER (LIVE REAL-TIME DATA)
        // =====================================================================

        // Determine Office Scoping
        $targetOfficeCategory = null;
        $scopedOfficeName = 'All Campus Offices';

        if ($user['role'] === 'staff') {
            $targetOfficeCategory = \App\Services\ServiceManager::getCategoryForOffice($user['department_or_course'] ?? '');
            $scopedOfficeName = $user['department_or_course'] ?? 'Designated Office';
        } else {
            // Admin can pass ?office=Registrar or ?office=Finance
            $officeParam = $request->getQuery('office');
            if ($officeParam && $officeParam !== 'all') {
                $targetOfficeCategory = \App\Services\ServiceManager::getCategoryForOffice($officeParam);
                $scopedOfficeName = $officeParam;
            }
        }

        $officeParams = [];
        $aptOfficeFilter = '';
        $queueOfficeFilter = '';
        $svcOfficeFilter = '';

        if ($targetOfficeCategory) {
            $officeParams = [
                'target_cat'      => $targetOfficeCategory,
                'target_cat_like' => "%{$targetOfficeCategory}%"
            ];
            $aptOfficeFilter = " AND (s.category = :target_cat OR s.category LIKE :target_cat_like)";
            $queueOfficeFilter = " AND (s.category = :target_cat OR s.category LIKE :target_cat_like)";
            $svcOfficeFilter = " AND (category = :target_cat OR category LIKE :target_cat_like)";
        }

        // 1. Core Appointment Aggregate Metrics
        $aptSql = "
            SELECT 
                COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as total_pending_appointments,
                COUNT(CASE WHEN a.status IN ('approved', 'rescheduled') AND a.appointment_date = CURDATE() THEN 1 END) as today_approved_appointments,
                COUNT(CASE WHEN a.appointment_date = CURDATE() THEN 1 END) as today_total_appointments,
                COUNT(CASE WHEN a.status = 'completed' AND a.appointment_date = CURDATE() THEN 1 END) as today_completed_appointments
            FROM appointments a
            JOIN services s ON a.service_id = s.id
            WHERE 1=1 {$aptOfficeFilter}
        ";
        $aptStatsStmt = $db->prepare($aptSql);
        $aptStatsStmt->execute($officeParams);
        $aptStats = $aptStatsStmt->fetch(PDO::FETCH_ASSOC);

        // 2. Core Queue Aggregate Metrics
        $queueSql = "
            SELECT 
                COUNT(CASE WHEN q.status = 'waiting' THEN 1 END) as currently_waiting,
                COUNT(CASE WHEN q.status = 'calling' THEN 1 END) as currently_calling,
                COUNT(CASE WHEN q.status = 'serving' THEN 1 END) as currently_serving,
                COUNT(CASE WHEN q.status = 'completed' THEN 1 END) as today_completed,
                COUNT(CASE WHEN q.status = 'skipped' THEN 1 END) as today_skipped,
                COUNT(*) as total_today_tickets
            FROM queue_entries q
            JOIN services s ON q.service_id = s.id
            WHERE q.queue_date = CURDATE() {$queueOfficeFilter}
        ";
        $queueStatsStmt = $db->prepare($queueSql);
        $queueStatsStmt->execute($officeParams);
        $queueStats = $queueStatsStmt->fetch(PDO::FETCH_ASSOC);

        // 3. Services and User Counts
        $svcSql = "
            SELECT 
                COUNT(*) as total_services,
                COUNT(CASE WHEN service_type IN ('appointment', 'both') AND is_active = 1 THEN 1 END) as active_appointment_services,
                COUNT(CASE WHEN service_type IN ('queue', 'both') AND is_active = 1 THEN 1 END) as active_queue_services
            FROM services
            WHERE 1=1 {$svcOfficeFilter}
        ";
        $servicesCountStmt = $db->prepare($svcSql);
        $servicesCountStmt->execute($officeParams);
        $servicesStats = $servicesCountStmt->fetch(PDO::FETCH_ASSOC);

        $usersCountStmt = $db->query("
            SELECT 
                COUNT(CASE WHEN role = 'student' THEN 1 END) as total_students,
                COUNT(CASE WHEN role IN ('admin', 'staff') THEN 1 END) as total_staff
            FROM users
        ");
        $userStats = $usersCountStmt->fetch(PDO::FETCH_ASSOC);

        // 4. Live Active Queue Tickets Today (waiting, calling, serving)
        $liveQueuesSql = "
            SELECT q.*, 
                   u.student_id_number, u.first_name, u.middle_name, u.last_name, u.email as student_email, u.contact_number, u.department_or_course, u.year_level,
                   s.name as service_name, s.code as service_code, s.category as service_category, s.location_or_counter, s.estimated_duration_mins,
                   c.first_name as caller_first_name, c.middle_name as caller_middle_name, c.last_name as caller_last_name
            FROM queue_entries q
            JOIN users u ON q.user_id = u.id
            JOIN services s ON q.service_id = s.id
            LEFT JOIN users c ON q.called_by = c.id
            WHERE q.queue_date = CURDATE() AND q.status IN ('calling', 'serving', 'waiting') {$queueOfficeFilter}
            ORDER BY 
              CASE q.status 
                WHEN 'calling' THEN 1 
                WHEN 'serving' THEN 2 
                WHEN 'waiting' THEN 3 
                ELSE 4 
              END ASC,
              q.sequence_number ASC
            LIMIT 20
        ";
        $liveQueuesStmt = $db->prepare($liveQueuesSql);
        $liveQueuesStmt->execute($officeParams);
        $liveQueues = $liveQueuesStmt->fetchAll(PDO::FETCH_ASSOC);

        // 5. Today's Appointments and Pending Action List
        $todayAptsSql = "
            SELECT a.*, 
                   u.student_id_number, u.first_name, u.middle_name, u.last_name, u.email as student_email, u.contact_number, u.department_or_course, u.year_level,
                   s.name as service_name, s.code as service_code, s.category as service_category, s.location_or_counter
            FROM appointments a
            JOIN users u ON a.user_id = u.id
            JOIN services s ON a.service_id = s.id
            WHERE (a.appointment_date = CURDATE() OR a.status = 'pending') {$aptOfficeFilter}
            ORDER BY 
              CASE a.status 
                WHEN 'pending' THEN 1 
                WHEN 'approved' THEN 2 
                WHEN 'rescheduled' THEN 3 
                ELSE 4 
              END ASC,
              a.appointment_date ASC, 
              a.start_time ASC
            LIMIT 15
        ";
        $todayAptsStmt = $db->prepare($todayAptsSql);
        $todayAptsStmt->execute($officeParams);
        $todayAppointments = $todayAptsStmt->fetchAll(PDO::FETCH_ASSOC);

        // 6. Live Service / Counter Summaries
        $counterSummariesSql = "
            SELECT 
                s.id as service_id,
                s.name as service_name,
                s.code as service_code,
                s.category as service_category,
                s.location_or_counter,
                COUNT(CASE WHEN q.status = 'waiting' AND q.queue_date = CURDATE() THEN 1 END) as waiting_count,
                (
                    SELECT q2.queue_number 
                    FROM queue_entries q2 
                    WHERE q2.service_id = s.id AND q2.queue_date = CURDATE() AND q2.status IN ('calling', 'serving')
                    ORDER BY CASE q2.status WHEN 'calling' THEN 1 ELSE 2 END ASC, q2.sequence_number ASC
                    LIMIT 1
                ) as current_ticket,
                (
                    SELECT q2.status 
                    FROM queue_entries q2 
                    WHERE q2.service_id = s.id AND q2.queue_date = CURDATE() AND q2.status IN ('calling', 'serving')
                    ORDER BY CASE q2.status WHEN 'calling' THEN 1 ELSE 2 END ASC, q2.sequence_number ASC
                    LIMIT 1
                ) as current_status,
                (
                    SELECT q2.counter_number 
                    FROM queue_entries q2 
                    WHERE q2.service_id = s.id AND q2.queue_date = CURDATE() AND q2.status IN ('calling', 'serving')
                    ORDER BY CASE q2.status WHEN 'calling' THEN 1 ELSE 2 END ASC, q2.sequence_number ASC
                    LIMIT 1
                ) as counter_number
            FROM services s
            LEFT JOIN queue_entries q ON s.id = q.service_id AND q.queue_date = CURDATE()
            WHERE s.service_type IN ('queue', 'both') AND s.is_active = 1 {$aptOfficeFilter}
            GROUP BY s.id
            ORDER BY s.category ASC, s.name ASC
        ";
        $counterSummariesStmt = $db->prepare($counterSummariesSql);
        $counterSummariesStmt->execute($officeParams);
        $counterSummaries = $counterSummariesStmt->fetchAll(PDO::FETCH_ASSOC);

        // 7. Recent Transactions Completed Today
        $recentCompletedSql = "
            SELECT q.*, 
                   u.student_id_number, u.first_name, u.middle_name, u.last_name,
                   s.name as service_name, s.code as service_code, s.location_or_counter
            FROM queue_entries q
            JOIN users u ON q.user_id = u.id
            JOIN services s ON q.service_id = s.id
            WHERE q.queue_date = CURDATE() AND q.status = 'completed' {$queueOfficeFilter}
            ORDER BY q.completed_at DESC, q.id DESC
            LIMIT 5
        ";
        $recentCompletedStmt = $db->prepare($recentCompletedSql);
        $recentCompletedStmt->execute($officeParams);
        $recentCompleted = $recentCompletedStmt->fetchAll(PDO::FETCH_ASSOC);

        // 8. 7-Day Operational Volume Breakdown Chart
        $trends = [];
        for ($i = 6; $i >= 0; $i--) {
            $d = date('Y-m-d', strtotime("-{$i} days"));
            $dayName = date('D (m/d)', strtotime($d));

            $dStmt1 = $db->prepare("
                SELECT COUNT(*) 
                FROM appointments a 
                JOIN services s ON a.service_id = s.id 
                WHERE a.appointment_date = :d {$aptOfficeFilter}
            ");
            $dStmt1->execute(array_merge(['d' => $d], $officeParams));
            $aptCount = (int)$dStmt1->fetchColumn();

            $dStmt2 = $db->prepare("
                SELECT COUNT(*) 
                FROM queue_entries q 
                JOIN services s ON q.service_id = s.id 
                WHERE q.queue_date = :d {$queueOfficeFilter}
            ");
            $dStmt2->execute(array_merge(['d' => $d], $officeParams));
            $qCount = (int)$dStmt2->fetchColumn();

            $trends[] = [
                'date'         => $d,
                'label'        => $dayName,
                'appointments' => $aptCount,
                'queues'       => $qCount
            ];
        }

        Response::json([
            'scoped_office'          => $scopedOfficeName,
            'is_scoped'              => !empty($targetOfficeCategory),
            'appointments'           => $aptStats,
            'queues'                 => $queueStats,
            'services'               => $servicesStats,
            'users'                  => $userStats,
            'trends_7days'           => $trends,
            'live_queue_entries'     => $liveQueues,
            'today_appointments_list'=> $todayAppointments,
            'counter_summaries'      => $counterSummaries,
            'recent_completed_today' => $recentCompleted,
            'server_time'            => date('Y-m-d H:i:s'),
        ], 200, 'Operations live operational metrics loaded.');
    }
}
