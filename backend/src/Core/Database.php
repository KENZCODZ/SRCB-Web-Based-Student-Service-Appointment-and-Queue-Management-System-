<?php
namespace App\Core;

use PDO;
use PDOException;

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $host = Env::get('DB_HOST', '127.0.0.1');
            $port = Env::get('DB_PORT', '3306');
            $database = Env::get('DB_DATABASE', 'student_services_db');
            $username = Env::get('DB_USERNAME', 'root');
            $password = Env::get('DB_PASSWORD', '');

            $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                self::$instance = new PDO($dsn, $username, $password, $options);
            } catch (PDOException $e) {
                // If database doesn't exist yet, attempt connecting without dbname and create it
                if ($e->getCode() == 1049 || str_contains($e->getMessage(), 'Unknown database')) {
                    $initDsn = "mysql:host={$host};port={$port};charset=utf8mb4";
                    $initPdo = new PDO($initDsn, $username, $password, $options);
                    $initPdo->exec("CREATE DATABASE IF NOT EXISTS `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
                    self::$instance = new PDO($dsn, $username, $password, $options);
                } else {
                    Response::error('Database Connection Error: ' . $e->getMessage(), 500);
                    exit();
                }
            }
        }

        return self::$instance;
    }
}
