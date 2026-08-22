<?php
namespace App\Core;

class Request {
    private string $method;
    private string $uri;
    private array $queryParams;
    private array $bodyParams;
    private array $headers;
    private ?array $user = null;

    public function __construct() {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        
        $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
        $uriParts = explode('?', $requestUri, 2);
        $this->uri = '/' . trim($uriParts[0], '/');
        
        $this->queryParams = $_GET;
        $this->headers = $this->extractHeaders();
        $this->bodyParams = $this->extractBody();
    }

    private function extractHeaders(): array {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $headerName = str_replace('_', '-', strtolower(substr($key, 5)));
                $headers[$headerName] = $value;
            } elseif (in_array($key, ['CONTENT_TYPE', 'CONTENT_LENGTH'])) {
                $headerName = str_replace('_', '-', strtolower($key));
                $headers[$headerName] = $value;
            }
        }
        return $headers;
    }

    private function extractBody(): array {
        if ($this->method === 'GET') {
            return [];
        }

        $rawInput = file_get_contents('php://input');
        if (!empty($rawInput)) {
            $json = json_decode($rawInput, true);
            if (is_array($json)) {
                return $json;
            }
        }

        return $_POST;
    }

    public function getMethod(): string {
        return $this->method;
    }

    public function getUri(): string {
        return $this->uri;
    }

    public function getQuery(string $key, mixed $default = null): mixed {
        return $this->queryParams[$key] ?? $default;
    }

    public function getQueries(): array {
        return $this->queryParams;
    }

    public function getBody(string $key = null, mixed $default = null): mixed {
        if ($key === null) {
            return $this->bodyParams;
        }
        return $this->bodyParams[$key] ?? $default;
    }

    public function getHeader(string $name): ?string {
        $normalized = strtolower($name);
        return $this->headers[$normalized] ?? null;
    }

    public function getBearerToken(): ?string {
        $auth = $this->getHeader('authorization');
        if ($auth && preg_match('/Bearer\s+(\S+)/i', $auth, $matches)) {
            return $matches[1];
        }
        return null;
    }

    public function getClientIp(): string {
        return $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }

    public function setUser(array $user): void {
        $this->user = $user;
    }

    public function getUser(): ?array {
        return $this->user;
    }
}
