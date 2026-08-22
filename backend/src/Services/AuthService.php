<?php
namespace App\Services;

use App\Core\Database;
use App\Core\JWT;
use App\Core\Response;
use PDO;

class AuthService {
    public static function registerStudent(array $data): array {
        $studentId = trim($data['student_id_number'] ?? '');
        $firstName = trim($data['first_name'] ?? '');
        $lastName = trim($data['last_name'] ?? '');
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';
        $contactNumber = trim($data['contact_number'] ?? '');
        $course = trim($data['department_or_course'] ?? '');
        $yearLevel = trim($data['year_level'] ?? '');

        // Validation
        $errors = [];
        if (empty($studentId)) {
            $errors['student_id_number'] = 'Student ID number is required.';
        }
        if (empty($firstName)) {
            $errors['first_name'] = 'First name is required.';
        }
        if (empty($lastName)) {
            $errors['last_name'] = 'Last name is required.';
        }
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'A valid email address is required.';
        }
        if (strlen($password) < 6) {
            $errors['password'] = 'Password must be at least 6 characters long.';
        }

        if (!empty($errors)) {
            Response::error('Validation failed', 422, $errors);
        }

        $db = Database::getConnection();

        // Check uniqueness of student ID number and email
        $checkStmt = $db->prepare("SELECT id, email, student_id_number FROM users WHERE email = :email OR student_id_number = :student_id LIMIT 1");
        $checkStmt->execute(['email' => $email, 'student_id' => $studentId]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            if (strtolower($existing['email']) === $email) {
                Response::error('An account with this email address already exists.', 409);
            }
            if ($existing['student_id_number'] === $studentId) {
                Response::error('An account with this Student ID Number already exists.', 409);
            }
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

        $insertStmt = $db->prepare("
            INSERT INTO users (student_id_number, first_name, last_name, email, password_hash, role, contact_number, department_or_course, year_level, is_active, created_at)
            VALUES (:student_id, :first_name, :last_name, :email, :password_hash, 'student', :contact_number, :course, :year_level, 1, NOW())
        ");

        $insertStmt->execute([
            'student_id'     => $studentId,
            'first_name'     => $firstName,
            'last_name'      => $lastName,
            'email'          => $email,
            'password_hash'  => $passwordHash,
            'contact_number' => $contactNumber ?: null,
            'course'         => $course ?: null,
            'year_level'     => $yearLevel ?: null,
        ]);

        $userId = (int)$db->lastInsertId();

        // Send welcome in-app notification
        NotificationService::create($userId, 'Welcome to SRCB Student Services!', 'Your account has been registered successfully. You can now book appointments and join service queues online.', 'system', null);

        // Audit Log
        AuditService::log($userId, 'REGISTER_STUDENT', 'user', $userId, ['email' => $email, 'student_id' => $studentId]);

        $userPayload = [
            'id'                   => $userId,
            'student_id_number'    => $studentId,
            'first_name'           => $firstName,
            'last_name'            => $lastName,
            'email'                => $email,
            'role'                 => 'student',
            'department_or_course' => $course,
            'year_level'           => $yearLevel,
        ];

        $token = JWT::generate([
            'user_id' => $userId,
            'email'   => $email,
            'role'    => 'student'
        ]);

        return [
            'token' => $token,
            'user'  => $userPayload
        ];
    }

    public static function login(string $identifier, string $password): array {
        $identifier = trim($identifier);
        if (empty($identifier) || empty($password)) {
            Response::error('Email/Student ID and password are required.', 422);
        }

        $db = Database::getConnection();
        // Support login by either email or student_id_number
        $stmt = $db->prepare("
            SELECT id, student_id_number, first_name, last_name, email, password_hash, role, contact_number, department_or_course, year_level, is_active 
            FROM users 
            WHERE (email = :id_email OR student_id_number = :id_student) 
            LIMIT 1
        ");
        $stmt->execute([
            'id_email'   => strtolower($identifier),
            'id_student' => $identifier
        ]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            AuditService::log(null, 'LOGIN_FAILED', 'user', null, ['identifier' => $identifier]);
            Response::error('Invalid credentials. Please check your login details.', 401);
        }

        if ((int)$user['is_active'] !== 1) {
            Response::error('Your account is currently disabled. Please contact the administrator.', 403);
        }

        // Update last login
        $db->prepare("UPDATE users SET last_login_at = NOW() WHERE id = :id")->execute(['id' => $user['id']]);

        // Audit Log
        AuditService::log($user['id'], 'LOGIN_SUCCESS', 'user', $user['id']);

        unset($user['password_hash']);

        $token = JWT::generate([
            'user_id' => $user['id'],
            'email'   => $user['email'],
            'role'    => $user['role']
        ]);

        return [
            'token' => $token,
            'user'  => $user
        ];
    }

    public static function getUserProfile(int $userId): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT id, student_id_number, first_name, last_name, email, role, contact_number, department_or_course, year_level, is_active, last_login_at, created_at 
            FROM users 
            WHERE id = :id 
            LIMIT 1
        ");
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            Response::error('User not found', 404);
        }

        return $user;
    }

    public static function updateProfile(int $userId, array $data): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            UPDATE users 
            SET first_name = :first_name,
                last_name = :last_name,
                contact_number = :contact_number,
                department_or_course = :course,
                year_level = :year_level
            WHERE id = :id
        ");

        $stmt->execute([
            'first_name'     => trim($data['first_name']),
            'last_name'      => trim($data['last_name']),
            'contact_number' => trim($data['contact_number'] ?? ''),
            'course'         => trim($data['department_or_course'] ?? ''),
            'year_level'     => trim($data['year_level'] ?? ''),
            'id'             => $userId
        ]);

        AuditService::log($userId, 'UPDATE_PROFILE', 'user', $userId);
        return self::getUserProfile($userId);
    }

    public static function changePassword(int $userId, string $currentPassword, string $newPassword): bool {
        if (strlen($newPassword) < 6) {
            Response::error('New password must be at least 6 characters long.', 422);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row || !password_verify($currentPassword, $row['password_hash'])) {
            Response::error('Current password is incorrect.', 400);
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 10]);
        $updateStmt = $db->prepare("UPDATE users SET password_hash = :hash WHERE id = :id");
        $updateStmt->execute(['hash' => $newHash, 'id' => $userId]);

        AuditService::log($userId, 'CHANGE_PASSWORD', 'user', $userId);
        return true;
    }
}
