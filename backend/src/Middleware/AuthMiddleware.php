<?php
namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;
use App\Core\JWT;
use App\Core\Database;
use PDO;

class AuthMiddleware {
    public function handle(Request $request): void {
        $token = $request->getBearerToken();

        if (!$token) {
            Response::error('Authentication required. Missing authorization token.', 401);
            exit();
        }

        $payload = JWT::verify($token);
        if (!$payload || !isset($payload['user_id'])) {
            Response::error('Invalid or expired authentication token.', 401);
            exit();
        }

        // Fetch fresh user record from DB
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id, student_id_number, first_name, last_name, email, role, department_or_course, year_level, is_active FROM users WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $payload['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            Response::error('User account not found.', 401);
            exit();
        }

        if ((int)$user['is_active'] !== 1) {
            Response::error('Account is deactivated. Please contact the administrator.', 403);
            exit();
        }

        $request->setUser($user);
    }
}
