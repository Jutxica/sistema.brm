<?php session_start();

require_once '../vendor/autoload.php';

use App\classes\Usuarios;

$conUsu = new Usuarios();

$conUsu->atualizarOpenSidebar($_POST['sidebar_state'],$_SESSION['usuario_id']);