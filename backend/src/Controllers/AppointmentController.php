<?php
namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\AppointmentService;

class AppointmentController {
    public function index(Request $request): void {
        $user = $request->getUser();
        $filters = $request->getQueries();
        $appointments = AppointmentService::getAppointments($filters, $user);
        Response::json($appointments, 200, 'Appointments retrieved.');
    }

    public function show(Request $request, array $params): void {
        $user = $request->getUser();
        $id = (int)($params['id'] ?? 0);
        $appointment = AppointmentService::getAppointmentById($id, $user);
        if (!$appointment) {
            Response::error('Appointment not found.', 404);
        }
        Response::json($appointment, 200, 'Appointment details.');
    }

    public function store(Request $request): void {
        $user = $request->getUser();
        $body = $request->getBody();
        $appointment = AppointmentService::bookAppointment((int)$user['id'], $body);
        Response::json($appointment, 201, 'Appointment booked successfully.');
    }

    public function updateStatus(Request $request, array $params): void {
        $user = $request->getUser();
        $id = (int)($params['id'] ?? 0);
        $body = $request->getBody();
        $status = $body['status'] ?? '';

        $updated = AppointmentService::updateStatus($id, $status, $body, (int)$user['id']);
        Response::json($updated, 200, "Appointment status updated to '{$status}'.");
    }

    public function cancel(Request $request, array $params): void {
        $user = $request->getUser();
        $id = (int)($params['id'] ?? 0);
        $cancelled = AppointmentService::cancelByStudent($id, (int)$user['id']);
        Response::json($cancelled, 200, 'Appointment cancelled successfully.');
    }
}
