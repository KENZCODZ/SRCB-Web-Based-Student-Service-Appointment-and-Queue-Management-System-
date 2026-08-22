<?php
namespace App\Services;

use App\Core\Database;
use PDO;

class NotificationService {
    public static function create(int $userId, string $title, string $message, string $type = 'system', ?int $relatedId = null): bool {
        try {
            $db = Database::getConnection();
            $stmt = $db->prepare("
                INSERT INTO notifications (user_id, title, message, type, related_id, is_read, created_at)
                VALUES (:user_id, :title, :message, :type, :related_id, 0, NOW())
            ");
            
            return $stmt->execute([
                'user_id'    => $userId,
                'title'      => $title,
                'message'    => $message,
                'type'       => $type,
                'related_id' => $relatedId
            ]);
        } catch (\Exception $e) {
            error_log("Notification creation failure: " . $e->getMessage());
            return false;
        }
    }
}
