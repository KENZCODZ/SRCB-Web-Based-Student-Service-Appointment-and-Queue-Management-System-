<?php
namespace App\Core;

class Response {
    public static function json(mixed $data = null, int $statusCode = 200, string $message = 'Success', array $extra = []): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        
        $payload = array_merge([
            'success' => $statusCode >= 200 && $statusCode < 300,
            'message' => $message,
            'data'    => $data,
        ], $extra);

        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit();
    }

    public static function success(mixed $data = null, string $message = 'Success', int $statusCode = 200): void {
        self::json($data, $statusCode, $message);
    }

    public static function error(string $message = 'An error occurred', int $statusCode = 400, mixed $errors = null): void {
        $extra = [];
        if ($errors !== null) {
            $extra['errors'] = $errors;
        }
        self::json(null, $statusCode, $message, $extra);
    }
}
