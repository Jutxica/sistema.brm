<?php

require_once __DIR__ . '/api_helper.php';

use App\classes\Login;
use App\classes\JWT;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['success' => false, 'message' => 'Método não permitido.'], 405);
}

$input = get_json_input();
$email = $input['email'] ?? '';
$senha = $input['senha'] ?? '';

if (empty($email) || empty($senha)) {
    send_json(['success' => false, 'message' => 'E-mail e senha são obrigatórios.'], 400);
}

$conLogin = new Login();
$user = $conLogin->validateUser($email, $senha);

if (!$user) {
    send_json(['success' => false, 'message' => 'E-mail ou senha inválidos.'], 401);
}

if ($user['usu_status'] !== 'Ativo') {
    send_json(['success' => false, 'message' => 'Esta conta está inativa.'], 403);
}

// Decode access permissions JSON
$acessos = [];
try {
    $acessos = json_decode($user['usu_acessos'] ?: '[]', true);
    if (!is_array($acessos)) {
        $acessos = [];
    }
} catch (Exception $e) {
    $acessos = [];
}

// Create JWT Payload
$issuedAt = time();
$expirationTime = $issuedAt + (3600 * 24); // Valid for 24 hours
$payload = [
    'id' => $user['idusuarios'],
    'nome' => $user['usu_nome'],
    'email' => $user['usu_email'],
    'acessos' => $acessos,
    'iat' => $issuedAt,
    'exp' => $expirationTime
];

$token = JWT::encode($payload, JWT_SECRET);

send_json([
    'success' => true,
    'token' => $token,
    'user' => [
        'id' => $user['idusuarios'],
        'nome' => $user['usu_nome'],
        'email' => $user['usu_email'],
        'status' => $user['usu_status'],
        'acessos' => $acessos
    ]
]);
