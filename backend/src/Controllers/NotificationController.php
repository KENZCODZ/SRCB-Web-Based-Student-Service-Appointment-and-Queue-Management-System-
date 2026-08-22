<?php
namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use PDO;

class NotificationController {
    public function index(Request $request): void {
        $user = $request->getUser();
        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT * FROM notifications 
            WHERE user_id = :user_id 
            ORDER BY created_at DESC 
            LIMIT 50
        ");
        $stmt->execute(['user_id' => $user['id']]);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $unreadCount = 0;
        foreach ($notifications as $n) {
            if ((int)$n['is_read'] === 0) {
                $unreadCount++;
            }
        }

        Response::json([
            'notifications' => $notifications,
            'unread_count'  => $unreadCount
        ], 200, 'Notifications retrieved.');
    }

    public function markAsRead(Request $request, array $params): void {
        $user = $request->getUser();
        $id = (int)($params['id'] ?? 0);
        $db = Database::getConnection();

        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = :id AND user_id = :user_id");
        $stmt->execute(['id' => $id, 'user_id' => $user['id']]);

        Response::json(null, 200, 'Notification marked as read.');
    }

    public function markAllAsRead(Request $request): void {
        $user = $request->getUser();
        $db = Database::getConnection();

        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = :user_id");
        $stmt->execute(['user_id' => $user['id']]);

        Response::json(null, 200, 'All notifications marked as read.');
    }
}
