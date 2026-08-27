<?php

namespace App\classes;

class Usuarios extends Conexao {

    private $resultado;

    public function altUsuarios($dados)
    {
        $pdo = $this->conectar();

        if($dados['frSenhaUsu'] != ""):
            $altUsuarios = $pdo->prepare("INSERT INTO usuarios (
                idusuarios,
                usu_email,
                usu_senha,
                usu_nome,
                usu_status,
                usu_acessos
            ) VALUES (
                :idusuarios,
                :usu_email,
                :usu_senha,
                :usu_nome,
                :usu_status,
                :usu_acessos
            ) ON DUPLICATE KEY UPDATE 
                usu_email = :usu_email,
                usu_senha = :usu_senha,
                usu_nome = :usu_nome,
                usu_status = :usu_status,
                usu_acessos = :usu_acessos
            ");
        else:
            $altUsuarios = $pdo->prepare("INSERT INTO usuarios (
                idusuarios,
                usu_email,
                usu_nome,
                usu_status,
                usu_acessos
            ) VALUES (
                :idusuarios,
                :usu_email,
                :usu_nome,
                :usu_status,
                :usu_acessos
            ) ON DUPLICATE KEY UPDATE 
                usu_email = :usu_email,
                usu_nome = :usu_nome,
                usu_status = :usu_status,
                usu_acessos = :usu_acessos
            ");
        endif;
        $altUsuarios->bindValue(":idusuarios",$dados['frIdUsu']);
        $altUsuarios->bindValue(":usu_email",$dados['frEmailUsu']);

        if($dados['frSenhaUsu'] != ""):
            $altUsuarios->bindValue(":usu_senha",password_hash($dados['frSenhaUsu'], PASSWORD_DEFAULT));
        endif;

        $altUsuarios->bindValue(":usu_nome",$dados['frNomeUsu']);
        $altUsuarios->bindValue(":usu_status",$dados['frStatusUsu']);
        $altUsuarios->bindValue(":usu_acessos",json_encode($dados['frAcessosUsu']));
        $altUsuarios->execute();
    }

    public function buscarUsuarios()
    {
        $pdo = $this->conectar();

        $buscarUsuarios = $pdo->prepare("SELECT * FROM usuarios");
        $buscarUsuarios->execute();

        return $buscarUsuarios->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function buscarUsuario($ident)
    {
        $pdo = $this->conectar();

        $buscarUsuario = $pdo->prepare("SELECT * FROM usuarios WHERE idusuarios = :id");
        $buscarUsuario->bindValue(":id",$ident);
        $buscarUsuario->execute();

        return $buscarUsuario->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function excluirUsuario($ident)
    {
        $pdo = $this->conectar();

        $excluirUsuario = $pdo->prepare("DELETE FROM usuarios WHERE idusuarios = :id");
        $excluirUsuario->bindValue(":id",$ident);
        $excluirUsuario->execute();
    }

    public function atualizarOpenSidebar($dado,$usu)
    {
        $pdo = $this->conectar();

        $atualizarOpenSidebar = $pdo->prepare("UPDATE usuarios SET usu_pref_opensidebar = :si WHERE idusuarios = :id");
        $atualizarOpenSidebar->bindValue(":si",$dado);
        $atualizarOpenSidebar->bindValue(":id",$usu);
        $atualizarOpenSidebar->execute();
    }

}