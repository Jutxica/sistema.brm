<?php

// Allow cross-origin requests in development mode
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle CORS Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Bootstrap Composer autoloader
require_once __DIR__ . '/../vendor/autoload.php';

use App\classes\JWT;

define('JWT_SECRET', 'yZ0QSbfF)m!]conventinhoSCJsecretkey2026!');

/**
 * Parses and returns the JSON request body as an associative array.
 */
function get_json_input(): array {
    $input = file_get_contents('php://input');
    $decoded = json_decode($input, true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * Validates the JWT authorization header. Exits with 401 if invalid.
 * Returns the decoded payload if successful.
 */
function require_auth(): array {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        send_json(['success' => false, 'message' => 'Token de autorização ausente.'], 401);
    }
    
    $token = $matches[1];
    $payload = JWT::decode($token, JWT_SECRET);
    
    if (!$payload) {
        send_json(['success' => false, 'message' => 'Token inválido ou expirado.'], 401);
    }
    
    return $payload;
}

/**
 * Sends a JSON response and terminates execution.
 */
function send_json(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}
