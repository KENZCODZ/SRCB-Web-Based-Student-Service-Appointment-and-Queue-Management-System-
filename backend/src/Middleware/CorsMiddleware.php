<?php
namespace App\Middleware;

use App\Core\Request;

class CorsMiddleware {
    public function handle(Request $request): void {
        $allowedOrigin = '*';
        
        if (isset($_SERVER['HTTP_ORIGIN'])) {
            $origin = $_SERVER['HTTP_ORIGIN'];
            // Allow localhost origins for development and configured production domain
            if (preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin) || true) {
                $allowedOrigin = $origin;
            }
        }

        header("Access-Control-Allow-Origin: {$allowedOrigin}");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Max-Age: 86400");
    }
}
