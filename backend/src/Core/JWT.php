<?php
namespace App\Core;

class JWT {
    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
    }

    public static function generate(array $payload, int $expirationSeconds = 86400): string {
        $secret = Env::get('JWT_SECRET', 'eduqueue_super_secret_jwt_key_default_2026');
        
        $header = json_encode([
            'typ' => 'JWT',
            'alg' => 'HS256'
        ]);

        $issuedAt = time();
        $payload['iat'] = $issuedAt;
        $payload['exp'] = $issuedAt + $expirationSeconds;

        $encodedHeader = self::base64UrlEncode($header);
        $encodedPayload = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $encodedHeader . '.' . $encodedPayload, $secret, true);
        $encodedSignature = self::base64UrlEncode($signature);

        return $encodedHeader . '.' . $encodedPayload . '.' . $encodedSignature;
    }

    public static function verify(string $token): ?array {
        $secret = Env::get('JWT_SECRET', 'eduqueue_super_secret_jwt_key_default_2026');
        
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        list($encodedHeader, $encodedPayload, $encodedSignature) = $parts;

        // Verify signature
        $expectedSignature = self::base64UrlEncode(hash_hmac('sha256', $encodedHeader . '.' . $encodedPayload, $secret, true));
        if (!hash_equals($expectedSignature, $encodedSignature)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($encodedPayload), true);
        if (!$payload || !isset($payload['exp'])) {
            return null;
        }

        // Verify expiration
        if (time() > $payload['exp']) {
            return null;
        }

        return $payload;
    }
}
