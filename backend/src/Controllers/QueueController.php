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
        $serviceId = (int)($params['serviceId'] ?? 0);
        $date = $request->getQuery('date');
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

        $ticket = QueueService::callNext($serviceId, $counter, (int)$user['id']);
        Response::json($ticket, 200, "Next ticket called: {$ticket['queue_number']}");
    }

    public function updateStatus(Request $request, array $params): void {
        $user = $request->getUser();
        $id = (int)($params['id'] ?? 0);
        $body = $request->getBody();
        $status = $body['status'] ?? '';

        $updated = QueueService::updateStatus($id, $status, $body, (int)$user['id']);
        Response::json($updated, 200, "Queue status updated to '{$status}'.");
    }

    public function publicDisplay(Request $request): void {
        $data = QueueService::getPublicDisplayData();
        Response::json($data, 200, 'Public display data.');
    }
}
