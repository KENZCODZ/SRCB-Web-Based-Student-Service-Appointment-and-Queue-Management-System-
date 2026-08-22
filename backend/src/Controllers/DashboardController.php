<?php
namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use PDO;

class DashboardController {
    public function stats(Request $request): void {
        $user = $request->getUser();
        $db = Database::getConnection();
        $today = date('Y-m-d');

        if ($user['role'] === 'student') {
            // Student-specific dashboard stats
            $aptStmt = $db->prepare("
                SELECT 
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_appointments,
                    COUNT(CASE WHEN status = 'approved' AND appointment_date >= :today THEN 1 END) as upcoming_appointments,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments
                FROM appointments 
                WHERE user_id = :user_id
            ");
            $aptStmt->execute(['today' => $today, 'user_id' => $user['id']]);
            $aptStats = $aptStmt->fetch(PDO::FETCH_ASSOC);

            $queueStmt = $db->prepare("
                SELECT COUNT(*) as active_tickets 
                FROM queue_entries 
                WHERE user_id = :user_id AND queue_date = :today AND status IN ('waiting', 'calling', 'serving')
            ");
            $queueStmt->execute(['user_id' => $user['id'], 'today' => $today]);
            $activeTickets = (int)$queueStmt->fetchColumn();

            // Next upcoming appointment
            $nextAptStmt = $db->prepare("
                SELECT a.*, s.name as service_name, s.location_or_counter 
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                WHERE a.user_id = :user_id AND a.appointment_date >= :today AND a.status IN ('pending', 'approved')
                ORDER BY a.appointment_date ASC, a.start_time ASC
                LIMIT 1
            ");
            $nextAptStmt->execute(['user_id' => $user['id'], 'today' => $today]);
            $nextAppointment = $nextAptStmt->fetch(PDO::FETCH_ASSOC);

            Response::json([
                'summary' => [
                    'pending_appointments'  => (int)$aptStats['pending_appointments'],
                    'upcoming_appointments' => (int)$aptStats['upcoming_appointments'],
                    'completed_appointments'=> (int)$aptStats['completed_appointments'],
                    'active_queue_tickets'  => $activeTickets,
                ],
                'next_appointment' => $nextAppointment ?: null
            ], 200, 'Student stats loaded.');
        }

        // Admin & Staff Dashboard Stats
        $aptStatsStmt = $db->prepare("
            SELECT 
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as total_pending_appointments,
                COUNT(CASE WHEN status = 'approved' AND appointment_date = :today THEN 1 END) as today_approved_appointments,
                COUNT(CASE WHEN appointment_date = :today THEN 1 END) as today_total_appointments,
                COUNT(CASE WHEN status = 'completed' AND appointment_date = :today THEN 1 END) as today_completed_appointments
            FROM appointments
        ");
        $aptStatsStmt->execute(['today' => $today]);
        $aptStats = $aptStatsStmt->fetch(PDO::FETCH_ASSOC);

        $queueStatsStmt = $db->prepare("
            SELECT 
                COUNT(CASE WHEN status = 'waiting' THEN 1 END) as currently_waiting,
                COUNT(CASE WHEN status = 'calling' THEN 1 END) as currently_calling,
                COUNT(CASE WHEN status = 'serving' THEN 1 END) as currently_serving,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as today_completed,
                COUNT(CASE WHEN status = 'skipped' THEN 1 END) as today_skipped,
                COUNT(*) as total_today_tickets
            FROM queue_entries
            WHERE queue_date = :today
        ");
        $queueStatsStmt->execute(['today' => $today]);
        $queueStats = $queueStatsStmt->fetch(PDO::FETCH_ASSOC);

        $servicesCountStmt = $db->query("
            SELECT 
                COUNT(*) as total_services,
                COUNT(CASE WHEN service_type = 'appointment' AND is_active = 1 THEN 1 END) as active_appointment_services,
                COUNT(CASE WHEN service_type = 'queue' AND is_active = 1 THEN 1 END) as active_queue_services
            FROM services
        ");
        $servicesStats = $servicesCountStmt->fetch(PDO::FETCH_ASSOC);

        $usersCountStmt = $db->query("
            SELECT 
                COUNT(CASE WHEN role = 'student' THEN 1 END) as total_students,
                COUNT(CASE WHEN role IN ('admin', 'staff') THEN 1 END) as total_staff
            FROM users
        ");
        $userStats = $usersCountStmt->fetch(PDO::FETCH_ASSOC);

        // 7-day appointment and queue trend
        $trends = [];
        for ($i = 6; $i >= 0; $i--) {
            $d = date('Y-m-d', strtotime("-{$i} days"));
            $dayName = date('D (m/d)', strtotime($d));

            $dStmt1 = $db->prepare("SELECT COUNT(*) FROM appointments WHERE appointment_date = :d");
            $dStmt1->execute(['d' => $d]);
            $aptCount = (int)$dStmt1->fetchColumn();

            $dStmt2 = $db->prepare("SELECT COUNT(*) FROM queue_entries WHERE queue_date = :d");
            $dStmt2->execute(['d' => $d]);
            $qCount = (int)$dStmt2->fetchColumn();

            $trends[] = [
                'date'         => $d,
                'label'        => $dayName,
                'appointments' => $aptCount,
                'queues'       => $qCount
            ];
        }

        Response::json([
            'appointments' => $aptStats,
            'queues'       => $queueStats,
            'services'     => $servicesStats,
            'users'        => $userStats,
            'trends_7days' => $trends
        ], 200, 'Admin metrics loaded.');
    }
}
