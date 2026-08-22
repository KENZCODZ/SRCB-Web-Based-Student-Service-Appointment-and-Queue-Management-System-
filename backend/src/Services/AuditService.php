<?php
namespace App\Services;

use App\Core\Database;
use PDO;

class AuditService {
    public static function log(?int $userId, string $action, ?string $entityType = null, ?int $entityId = null, ?array $details = null, ?string $ipAddress = null): void {
        try {
            $db = Database::getConnection();
            $stmt = $db->prepare("
                INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details_json, ip_address, created_at)
                VALUES (:user_id, :action, :entity_type, :entity_id, :details_json, :ip_address, NOW())
            ");
            
            $stmt->execute([
                'user_id'      => $userId,
                'action'       => $action,
                'entity_type'  => $entityType,
                'entity_id'    => $entityId,
                'details_json' => $details ? json_encode($details, JSON_UNESCAPED_UNICODE) : null,
                'ip_address'   => $ipAddress ?? ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null)
            ]);
        } catch (\Exception $e) {
            // Fail safely: Never crash the main request because of audit log failure
            error_log("Audit log failure: " . $e->getMessage());
        }
    }
}
