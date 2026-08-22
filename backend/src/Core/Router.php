<?php
namespace App\Core;

class Router {
    private array $routes = [];
    private array $globalMiddleware = [];

    public function addGlobalMiddleware(mixed $middleware): void {
        $this->globalMiddleware[] = $middleware;
    }

    public function add(string $method, string $path, mixed $handler, array $middleware = []): void {
        $this->routes[] = [
            'method'     => strtoupper($method),
            'path'       => '/' . trim($path, '/'),
            'handler'    => $handler,
            'middleware' => $middleware,
        ];
    }

    public function get(string $path, mixed $handler, array $middleware = []): void {
        $this->add('GET', $path, $handler, $middleware);
    }

    public function post(string $path, mixed $handler, array $middleware = []): void {
        $this->add('POST', $path, $handler, $middleware);
    }

    public function put(string $path, mixed $handler, array $middleware = []): void {
        $this->add('PUT', $path, $handler, $middleware);
    }

    public function delete(string $path, mixed $handler, array $middleware = []): void {
        $this->add('DELETE', $path, $handler, $middleware);
    }

    public function dispatch(Request $request): void {
        $method = $request->getMethod();
        $uri = $request->getUri();

        // Handle pre-flight CORS requests
        if ($method === 'OPTIONS') {
            http_response_code(200);
            exit();
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $route['path']);
            $pattern = '#^' . $pattern . '$#';

            if (preg_match($pattern, $uri, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                // Run global middleware
                foreach ($this->globalMiddleware as $mw) {
                    $this->executeMiddleware($mw, $request);
                }

                // Run route middleware
                foreach ($route['middleware'] as $mw) {
                    $this->executeMiddleware($mw, $request);
                }

                // Execute handler
                $this->executeHandler($route['handler'], $request, $params);
                return;
            }
        }

        Response::error("Endpoint not found: {$method} {$uri}", 404);
    }

    private function executeMiddleware(mixed $middleware, Request $request): void {
        if (is_callable($middleware)) {
            $middleware($request);
        } elseif (is_object($middleware) && method_exists($middleware, 'handle')) {
            $middleware->handle($request);
        } elseif (is_string($middleware) && class_exists($middleware)) {
            $instance = new $middleware();
            if (method_exists($instance, 'handle')) {
                $instance->handle($request);
            }
        }
    }

    private function executeHandler(mixed $handler, Request $request, array $params): void {
        if (is_callable($handler)) {
            call_user_func($handler, $request, $params);
            return;
        }

        if (is_array($handler) && count($handler) === 2) {
            [$class, $method] = $handler;
            if (is_string($class)) {
                $class = new $class();
            }
            if (method_exists($class, $method)) {
                $class->$method($request, $params);
                return;
            }
        }

        Response::error('Controller handler not found', 500);
    }
}
