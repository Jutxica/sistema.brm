<?php

namespace App\classes;

class Conexao {

    private static $conexao;

    public function conectar(){
        try{
            if(!isset(self::$conexao)):
                self::$conexao = new \PDO(
                    "mysql:host=127.0.0.1;dbname=conven80_sistema;charset=utf8",
                    "conven80_sistema",
                    "yZ0QSbfF)m!]"
                );
            endif;
        } catch (\PDOException $e){
            echo "Erro ao conectar ao banco" . $e->getMessage();
        }
        return self::$conexao;
    }

}