<?php
/**
 * Web-Based Student Service Appointment and Queue Management System
 * RESTful API Front Controller & Router Dispatcher
 */

// 1. Set global error reporting based on environment
error_reporting(E_ALL);
ini_set('display_errors', '0');

// 2. Register Class Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/../src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Core\Env;
use App\Core\Request;
use App\Core\Response;
use App\Core\Router;
use App\Middleware\CorsMiddleware;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

use App\Controllers\AuthController;
use App\Controllers\UserController;
use App\Controllers\ServiceController;
use App\Controllers\AppointmentController;
use App\Controllers\QueueController;
use App\Controllers\NotificationController;
use App\Controllers\DashboardController;
use App\Controllers\AuditController;

// 3. Load Environment Configuration
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    Env::load($envPath);
}

// Set application timezone (default to Philippine Standard Time: Asia/Manila)
date_default_timezone_set(Env::get('APP_TIMEZONE', 'Asia/Manila'));

// 4. Initialize Router & Global CORS Middleware
$router = new Router();
$router->addGlobalMiddleware(new CorsMiddleware());

// -------------------------------------------------------------
// PUBLIC / GUEST ROUTES
// -------------------------------------------------------------
$router->post('/api/auth/register', [AuthController::class, 'register']);
$router->post('/api/auth/login', [AuthController::class, 'login']);
$router->get('/api/public/services', [ServiceController::class, 'index']);
$router->get('/api/public/queue/display', [QueueController::class, 'publicDisplay']);
$router->get('/api/services/{id}/slots', [ServiceController::class, 'slots']);

// -------------------------------------------------------------
// AUTHENTICATED USER ROUTES (Any valid role)
// -------------------------------------------------------------
$authMw = [AuthMiddleware::class];

$router->get('/api/auth/me', [AuthController::class, 'me'], $authMw);
$router->put('/api/auth/profile', [AuthController::class, 'updateProfile'], $authMw);
$router->put('/api/auth/password', [AuthController::class, 'changePassword'], $authMw);
$router->post('/api/auth/logout', [AuthController::class, 'logout'], $authMw);

$router->get('/api/services', [ServiceController::class, 'index'], $authMw);
$router->get('/api/services/{id}', [ServiceController::class, 'show'], $authMw);

$router->get('/api/dashboard/stats', [DashboardController::class, 'stats'], $authMw);

$router->get('/api/notifications', [NotificationController::class, 'index'], $authMw);
$router->put('/api/notifications/{id}/read', [NotificationController::class, 'markAsRead'], $authMw);
$router->put('/api/notifications/read-all', [NotificationController::class, 'markAllAsRead'], $authMw);

// Appointments (Shared access with controller-level role scoping)
$router->get('/api/appointments', [AppointmentController::class, 'index'], $authMw);
$router->get('/api/appointments/{id}', [AppointmentController::class, 'show'], $authMw);
$router->post('/api/appointments', [AppointmentController::class, 'store'], $authMw);
$router->put('/api/appointments/{id}/cancel', [AppointmentController::class, 'cancel'], $authMw);

// Queue (Student actions)
$router->post('/api/queue/join', [QueueController::class, 'join'], $authMw);
$router->get('/api/queue/my-active', [QueueController::class, 'myActive'], $authMw);
$router->put('/api/queue/{id}/cancel', [QueueController::class, 'cancel'], $authMw);

// -------------------------------------------------------------
// STAFF & ADMIN ROUTES (Appointments & Queue Operations)
// -------------------------------------------------------------
$staffRoleMw = [AuthMiddleware::class, RoleMiddleware::for(['admin', 'staff'])];

$router->put('/api/appointments/{id}/status', [AppointmentController::class, 'updateStatus'], $staffRoleMw);
$router->get('/api/queue/service/{serviceId}', [QueueController::class, 'activeForService'], $staffRoleMw);
$router->post('/api/queue/service/{serviceId}/call-next', [QueueController::class, 'callNext'], $staffRoleMw);
$router->put('/api/queue/{id}/status', [QueueController::class, 'updateStatus'], $staffRoleMw);

// -------------------------------------------------------------
// ADMIN-ONLY ROUTES (Services, User Provisioning, Audit Logs)
// -------------------------------------------------------------
$adminRoleMw = [AuthMiddleware::class, RoleMiddleware::for(['admin'])];

$router->post('/api/services', [ServiceController::class, 'store'], $adminRoleMw);
$router->put('/api/services/{id}', [ServiceController::class, 'update'], $adminRoleMw);
$router->put('/api/services/{id}/toggle', [ServiceController::class, 'toggle'], $adminRoleMw);

$router->get('/api/users', [UserController::class, 'index'], $adminRoleMw);
$router->post('/api/users', [UserController::class, 'store'], $adminRoleMw);
$router->put('/api/users/{id}/toggle', [UserController::class, 'toggleActive'], $adminRoleMw);

$router->get('/api/audit-logs', [AuditController::class, 'index'], $adminRoleMw);
$router->get('/api/audit-logs/emails', [AuditController::class, 'emailLogs'], $adminRoleMw);

// -------------------------------------------------------------
// DISPATCH REQUEST
// -------------------------------------------------------------
try {
    $request = new Request();
    $router->dispatch($request);
} catch (\Throwable $e) {
    Response::error($e->getMessage(), 500);
}
