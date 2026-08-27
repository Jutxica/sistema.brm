<?php

namespace App\classes;

use App\classes\Email;

class Login extends Conexao {

    public function login($login, $password) {
	        $pdo = $this->conectar();

	        $sql = "SELECT * FROM usuarios WHERE usu_email = :login AND (usu_senha IS NOT NULL OR usu_senha <> '') LIMIT 1";
	        $stmt = $pdo->prepare($sql);
	        $stmt->bindParam(':login', $login);
	        $stmt->execute();

	        $usuario = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($usuario && password_verify($password, $usuario['usu_senha'])) {
                // Login bem-sucedido
                if (session_status() === PHP_SESSION_NONE) {
                    session_start();
                }
                $_SESSION['usuario_id'] = $usuario['idusuarios'];
                $_SESSION['usuario_nome'] = $usuario['usu_nome'];
                $_SESSION['usuario_email'] = $usuario['usu_email'];
                $_SESSION['usuario_status'] = $usuario['usu_status'];
                $_SESSION['usuario_acessos'] = $usuario['usu_acessos'];
                $_SESSION['logado'] = true;
                
                header('Location: inicio');
                exit;
            }

        // Login falhou
	    return false;
    }

    public function deslogar(){
        session_start();
        
        $_SESSION = array();
        session_unset();
        session_destroy();

        echo "<script>window.location='https://sistema.conventinho.org.br';</script>";
    }

    public function recuperarSenha($cpf)
    {
        $pdo = $this->conectar();

        session_start();
        $cpf = preg_replace('/\D/', '', $cpf ?? '');

        try {
            
            $stmt = $pdo->prepare("SELECT ass_email FROM assinantes WHERE ass_cpfcnpj = ?");
            $stmt->execute([trim($cpf)]);
            $cliente = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$cliente || empty($cliente['ass_email'])) {
                $ret = "<p>CPF não encontrado ou sem e-mail cadastrado.</p>";
                $ret .= '<a href="index/rec">Tentar novamente</a>';
                return $ret;
            }

            $email = $cliente['ass_email'];
            $token = bin2hex(random_bytes(32));
            $expira = date('Y-m-d H:i:s', strtotime('+30 minutes'));

            // Salva o token
            $stmt = $pdo->prepare("INSERT INTO recuperacao_senha (cpf, token, expira_em) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = VALUES(token), expira_em = VALUES(expira_em)");
            $stmt->execute([$cpf, $token, $expira]);

            // Monta o link
            $link = "https://bibliotecadocoracao.editorascj.com.br/wp-content/themes/bibliotecadocoracao/sistema/redefinir_senha/$token";

            $conEmail = new Email();
            // Envia o e-mail
            $mensagem = "<p>Clique no link abaixo para redefinir sua senha. Este link expira em 30 minutos:<br><a href='$link'>$link</a></p>";
            $conEmail->buscarTemplate("recuperar-senha");
            $conEmail->enviarEmail($email, "Recuperação de senha", $mensagem);

            // Mascarar e-mail
            $emailMasc = preg_replace_callback('/^(.{3})([^@]*)(@.*)$/', function($m) {
                return $m[1] . str_repeat('*', strlen($m[2])) . $m[3];
            }, $email);
            return "<p>Enviamos o link de recuperação para <strong>$emailMasc</strong></p>";

        } catch (PDOException $e) {
            return "Erro ao processar: " . $e->getMessage();
        }

    }

    public function validateUser($login, $password) {
        $pdo = $this->conectar();
        $sql = "SELECT * FROM usuarios WHERE usu_email = :login AND (usu_senha IS NOT NULL OR usu_senha <> '') LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':login', $login);
        $stmt->execute();

        $usuario = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($usuario && password_verify($password, $usuario['usu_senha'])) {
            return $usuario;
        }
        return false;
    }

}