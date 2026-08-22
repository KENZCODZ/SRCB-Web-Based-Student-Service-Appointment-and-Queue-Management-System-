<?php
namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;

class RoleMiddleware {
    public static function for(array $allowedRoles): \Closure {
        return function(Request $request) use ($allowedRoles) {
            $user = $request->getUser();
            if (!$user) {
                Response::error('Unauthorized. Authentication required.', 401);
                exit();
            }

            if (!in_array($user['role'], $allowedRoles, true)) {
                Response::error("Forbidden. You do not have permission to access this resource. Required role(s): " . implode(', ', $allowedRoles), 403);
                exit();
            }
        };
    }
}
