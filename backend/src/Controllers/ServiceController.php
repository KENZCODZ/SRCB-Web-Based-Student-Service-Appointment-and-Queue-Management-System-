<?php
namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\ServiceManager;

class ServiceController {
    public function index(Request $request): void {
        $type = $request->getQuery('type');
        $category = $request->getQuery('category');
        $onlyActive = $request->getQuery('all') !== 'true'; // Default active only for public/students

        $services = ServiceManager::getAllServices($onlyActive, $type, $category);
        Response::json($services, 200, 'Services retrieved successfully.');
    }

    public function show(Request $request, array $params): void {
        $id = (int)($params['id'] ?? 0);
        $service = ServiceManager::getServiceById($id);
        if (!$service) {
            Response::error('Service not found', 404);
        }
        Response::json($service, 200, 'Service details retrieved.');
    }

    public function store(Request $request): void {
        $user = $request->getUser();
        $body = $request->getBody();
        $service = ServiceManager::createService($body, (int)$user['id']);
        Response::json($service, 201, 'Service created successfully.');
    }

    public function update(Request $request, array $params): void {
        $user = $request->getUser();
        $id = (int)($params['id'] ?? 0);
        $body = $request->getBody();
        $service = ServiceManager::updateService($id, $body, (int)$user['id']);
        Response::json($service, 200, 'Service updated successfully.');
    }

    public function toggle(Request $request, array $params): void {
        $user = $request->getUser();
        $id = (int)($params['id'] ?? 0);
        $body = $request->getBody();
        $isActive = !empty($body['is_active']);
        $service = ServiceManager::toggleServiceActive($id, $isActive, (int)$user['id']);
        Response::json($service, 200, 'Service status updated.');
    }

    public function slots(Request $request, array $params): void {
        $id = (int)($params['id'] ?? 0);
        $date = $request->getQuery('date') ?? date('Y-m-d');
        $slots = ServiceManager::getAvailableSlots($id, $date);
        Response::json($slots, 200, 'Available slots calculated.');
    }
}
