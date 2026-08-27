<?php

namespace App\classes;

class Conexao {

    private static $conexao;

    public function conectar(){
        try{
            if(!isset(self::$conexao)):
                $host = getenv('DB_HOST') ?: '127.0.0.1';
                $dbname = getenv('DB_NAME') ?: 'conven80_sistema';
                $user = getenv('DB_USER') ?: 'conven80_sistema';
                $pass = getenv('DB_PASSWORD') ?: 'yZ0QSbfF)m!]';
                $port = getenv('DB_PORT') ?: '3306';

                self::$conexao = new \PDO(
                    "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8",
                    $user,
                    $pass
                );
            endif;
        } catch (\PDOException $e){
            echo "Erro ao conectar ao banco: " . $e->getMessage();
        }
        return self::$conexao;
    }

}