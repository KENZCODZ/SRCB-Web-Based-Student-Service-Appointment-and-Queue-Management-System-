<?php
namespace App\Core;

class Env {
    private static array $variables = [];

    public static function load(string $filePath): void {
        if (!file_exists($filePath)) {
            return;
        }

        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || str_starts_with($line, '#')) {
                continue;
            }

            if (str_contains($line, '=')) {
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                // Strip outer quotes if present
                if (preg_match('/^"(.*)"$/', $value, $m) || preg_match("/^'(.*)'$/", $value, $m)) {
                    $value = $m[1];
                }
                self::$variables[$name] = $value;
                if (!array_key_exists($name, $_ENV)) {
                    $_ENV[$name] = $value;
                }
            }
        }
    }

    public static function get(string $key, mixed $default = null): mixed {
        if (isset(self::$variables[$key])) {
            return self::$variables[$key];
        }
        if (isset($_ENV[$key])) {
            return $_ENV[$key];
        }
        $envVal = getenv($key);
        return $envVal !== false ? $envVal : $default;
    }
}
