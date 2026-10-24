<?php
namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\QueueService;

class QueueController {
    public function join(Request $request): void {
        $user = $request->getUser();
        $body = $request->getBody();
        $serviceId = (int)($body['service_id'] ?? 0);

        if (!$serviceId) {
            Response::error('Service ID is required to join queue.', 422);
        }

        $ticket = QueueService::joinQueue((int)$user['id'], $serviceId);
        Response::json($ticket, 201, 'Joined queue successfully.');
    }

    public function activeForService(Request $request, array $params): void {
        $user = $request->getUser();
        $serviceId = (int)($params['serviceId'] ?? 0);
        $date = $request->getQuery('date');

        if ($user && $user['role'] === 'staff') {
            $service = \App\Services\ServiceManager::getServiceById($serviceId);
            if ($service && !\App\Services\ServiceManager::officeMatchesCategory($user['department_or_course'] ?? '', $service['category'] ?? '')) {
                Response::error("Access denied. Service '{$service['name']}' belongs to {$service['category']}, not your designated office ({$user['department_or_course']}).", 403);
            }
        }

        $tickets = QueueService::getActiveQueueForService($serviceId, $date);
        Response::json($tickets, 200, 'Active queue list retrieved.');
    }

    public function myActive(Request $request): void {
        $user = $request->getUser();
        $tickets = QueueService::getStudentActiveTickets((int)$user['id']);
        Response::json($tickets, 200, 'Active student tickets retrieved.');
    }

    public function callNext(Request $request, array $params): void {
        $user = $request->getUser();
        $serviceId = (int)($params['serviceId'] ?? 0);
        $body = $request->getBody();
        $counter = $body['counter_number'] ?? 'Counter 1';

        if ($user && $user['role'] === 'staff') {
            $service = \App\Services\ServiceManager::getServiceById($serviceId);
            if ($service && !\App\Services\ServiceManager::officeMatchesCategory($user['department_or_course'] ?? '', $service['category'] ?? '')) {
                Response::error("Access denied. You cannot call tickets for services outside your designated office ({$user['department_or_course']}).", 403);
            }
        }

        $ticket = QueueService::callNext($serviceId, $counter, (int)$user['id']);
        Response::json($ticket, 200, "Next ticket called: {$ticket['queue_number']}");
    }

    public function updateStatus(Request $request, array $params): void {
        $user = $request->getUser();
        $id = (int)($params['id'] ?? 0);
        $body = $request->getBody();
        $status = $body['status'] ?? '';

        if ($user && $user['role'] === 'staff') {
            $entry = QueueService::getQueueEntryById($id);
            if ($entry && !\App\Services\ServiceManager::officeMatchesCategory($user['department_or_course'] ?? '', $entry['service_category'] ?? '')) {
                Response::error("Access denied. Ticket {$entry['queue_number']} belongs to {$entry['service_category']}, not your designated office ({$user['department_or_course']}).", 403);
            }
        }

        $updated = QueueService::updateStatus($id, $status, $body, (int)$user['id']);
        Response::json($updated, 200, "Queue status updated to '{$status}'.");
    }

    public function cancel(Request $request, array $params): void {
        $user = $request->getUser();
        $id = (int)($params['id'] ?? 0);
        $updated = QueueService::cancelStudentTicket($id, (int)$user['id']);
        Response::json($updated, 200, 'Queue ticket cancelled successfully.');
    }

    public function publicDisplay(Request $request): void {
        $data = QueueService::getPublicDisplayData();
        Response::json($data, 200, 'Public display data.');
    }
}
