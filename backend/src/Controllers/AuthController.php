<?php
namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\AuthService;

class AuthController {
    public function register(Request $request): void {
        $body = $request->getBody();
        $result = AuthService::registerStudent($body);
        Response::json($result, 201, 'Student registered successfully.');
    }

    public function login(Request $request): void {
        $body = $request->getBody();
        $identifier = $body['email'] ?? $body['identifier'] ?? $body['student_id_number'] ?? '';
        $password = $body['password'] ?? '';

        $result = AuthService::login($identifier, $password);
        Response::json($result, 200, 'Login successful.');
    }

    public function me(Request $request): void {
        $user = $request->getUser();
        $profile = AuthService::getUserProfile((int)$user['id']);
        Response::json($profile, 200, 'Current user profile retrieved.');
    }

    public function updateProfile(Request $request): void {
        $user = $request->getUser();
        $body = $request->getBody();
        $updated = AuthService::updateProfile((int)$user['id'], $body);
        Response::json($updated, 200, 'Profile updated successfully.');
    }

    public function changePassword(Request $request): void {
        $user = $request->getUser();
        $body = $request->getBody();
        $currentPassword = $body['current_password'] ?? '';
        $newPassword = $body['new_password'] ?? '';

        AuthService::changePassword((int)$user['id'], $currentPassword, $newPassword);
        Response::json(null, 200, 'Password updated successfully.');
    }

    public function logout(Request $request): void {
        // Since JWT is stateless, returning success tells client to discard stored token
        Response::json(null, 200, 'Logged out successfully.');
    }
}
