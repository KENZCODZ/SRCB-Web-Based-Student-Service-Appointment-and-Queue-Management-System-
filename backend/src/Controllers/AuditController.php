<?php
namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use PDO;

class AuditController {
    public function index(Request $request): void {
        $action = $request->getQuery('action');
        $search = $request->getQuery('search');
        $limit = min(100, max(10, (int)($request->getQuery('limit') ?? 50)));

        $db = Database::getConnection();
        $sql = "
            SELECT a.*, u.first_name, u.middle_name, u.last_name, u.email, u.role
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE 1=1
        ";
        $params = [];

        if ($action) {
            $sql .= " AND a.action = :action";
            $params['action'] = $action;
        }

        if ($search) {
            $sql .= " AND (a.action LIKE :search OR a.entity_type LIKE :search OR u.email LIKE :search OR a.details_json LIKE :search)";
            $params['search'] = '%' . $search . '%';
        }

        $sql .= " ORDER BY a.created_at DESC LIMIT " . $limit;

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::json($logs, 200, 'Audit logs retrieved.');
    }

    public function emailLogs(Request $request): void {
        $limit = min(100, max(10, (int)($request->getQuery('limit') ?? 50)));
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM email_logs ORDER BY created_at DESC LIMIT " . $limit);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::json($logs, 200, 'Email dispatch logs retrieved.');
    }
}
