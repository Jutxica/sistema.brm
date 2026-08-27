<?php

require_once __DIR__ . '/api_helper.php';

use App\classes\Usuarios;

// Verify authorization
$user = require_auth();

// Restrict user management to admins (or accounts with "usuarios" permission)
$acessos = $user['acessos'] ?? [];
if (!in_array('usuarios', $acessos) && !in_array('admin', $acessos)) {
    // If it's a simple GET self action, allow it. Otherwise restrict.
    $action = $_GET['action'] ?? '';
    if ($action !== 'me') {
        send_json(['success' => false, 'message' => 'Acesso negado. Permissão insuficiente.'], 403);
    }
}

$action = $_GET['action'] ?? '';
$conUsu = new Usuarios();

switch ($action) {
    case 'me':
        send_json([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'nome' => $user['nome'],
                'email' => $user['email'],
                'acessos' => $user['acessos']
            ]
        ]);
        break;

    case 'list':
        try {
            $usersList = $conUsu->buscarUsuarios();
            send_json($usersList ?: []);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'delete':
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            send_json(['success' => false, 'message' => 'Método inválido.'], 405);
        }
        $id = $_GET['id'] ?? '';
        if (!$id) {
            send_json(['success' => false, 'message' => 'ID ausente.'], 400);
        }
        try {
            $conUsu->excluirUsuario($id);
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'save':
        $input = get_json_input();
        
        $dados = [
            'frIdUsu' => $input['idusuarios'] ?? '',
            'frNomeUsu' => $input['usu_nome'] ?? '',
            'frEmailUsu' => $input['usu_email'] ?? '',
            'frSenhaUsu' => $input['password'] ?? '', // empty if not changing
            'frStatusUsu' => $input['usu_status'] ?? 'Ativo',
            'frAcessosUsu' => $input['acessos'] ?? []
        ];

        try {
            $conUsu->altUsuarios($dados);
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    default:
        send_json(['success' => false, 'message' => 'Ação inválida.'], 400);
        break;
}
