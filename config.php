<?php session_start();

if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    exit('Acesso direto não permitido.');
}

require_once __DIR__ . '/vendor/autoload.php';

use App\classes\Login;
use App\classes\Usuarios;

$conLog = new Login();
if(($_GET['param1'] == "sair") || ($_GET['param2'] == "sair") || ($_GET['param3'] == "sair") || ($_GET['param4'] == "sair") || ($_GET['param5'] == "sair") || ($_SESSION['usuario_id'] == "")):
    $conLog->deslogar();
endif;

$conUsu = new Usuarios();

$usuario = $conUsu->buscarUsuario($_SESSION['usuario_id']);