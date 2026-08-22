<?php
namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use App\Services\AuditService;
use PDO;

class UserController {
    public function index(Request $request): void {
        $role = $request->getQuery('role');
        $search = $request->getQuery('search');

        $db = Database::getConnection();
        $sql = "SELECT id, student_id_number, first_name, last_name, email, role, contact_number, department_or_course, year_level, is_active, last_login_at, created_at FROM users WHERE 1=1";
        $params = [];

        if ($role) {
            $sql .= " AND role = :role";
            $params['role'] = $role;
        }

        if ($search) {
            $sql .= " AND (email LIKE :search OR first_name LIKE :search OR last_name LIKE :search OR student_id_number LIKE :search)";
            $params['search'] = '%' . $search . '%';
        }

        $sql .= " ORDER BY id DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::json($users, 200, 'Users retrieved.');
    }

    public function store(Request $request): void {
        $admin = $request->getUser();
        $body = $request->getBody();

        $email = strtolower(trim($body['email'] ?? ''));
        $firstName = trim($body['first_name'] ?? '');
        $lastName = trim($body['last_name'] ?? '');
        $role = trim($body['role'] ?? 'student');
        $password = $body['password'] ?? 'password123';
        $studentId = trim($body['student_id_number'] ?? '');
        $contact = trim($body['contact_number'] ?? '');
        $course = trim($body['department_or_course'] ?? '');
        $yearLevel = trim($body['year_level'] ?? '');

        if (empty($email) || empty($firstName) || empty($lastName) || !in_array($role, ['admin', 'staff', 'student'], true)) {
            Response::error('First name, last name, valid email, and role are required.', 422);
        }

        $db = Database::getConnection();

        // Check email uniqueness
        $check = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
        $check->execute(['email' => $email]);
        if ($check->fetch()) {
            Response::error('A user with this email already exists.', 409);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

        $stmt = $db->prepare("
            INSERT INTO users (student_id_number, first_name, last_name, email, password_hash, role, contact_number, department_or_course, year_level, is_active, created_at)
            VALUES (:student_id, :first_name, :last_name, :email, :password_hash, :role, :contact, :course, :year_level, 1, NOW())
        ");

        $stmt->execute([
            'student_id'    => $studentId ?: null,
            'first_name'    => $firstName,
            'last_name'     => $lastName,
            'email'         => $email,
            'password_hash' => $hash,
            'role'          => $role,
            'contact'       => $contact ?: null,
            'course'        => $course ?: null,
            'year_level'    => $yearLevel ?: null
        ]);

        $newId = (int)$db->lastInsertId();
        AuditService::log($admin['id'], 'CREATE_USER', 'user', $newId, ['email' => $email, 'role' => $role]);

        Response::json(['id' => $newId, 'email' => $email, 'role' => $role], 201, 'User created successfully.');
    }

    public function toggleActive(Request $request, array $params): void {
        $admin = $request->getUser();
        $id = (int)($params['id'] ?? 0);
        $body = $request->getBody();
        $isActive = !empty($body['is_active']) ? 1 : 0;

        if ($id === (int)$admin['id']) {
            Response::error('You cannot deactivate your own account.', 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE users SET is_active = :is_active WHERE id = :id");
        $stmt->execute(['is_active' => $isActive, 'id' => $id]);

        AuditService::log($admin['id'], $isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', 'user', $id);
        Response::json(null, 200, 'User status updated.');
    }
}
