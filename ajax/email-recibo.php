<?php session_start();

require_once '../vendor/autoload.php';

use App\classes\Email;

$conEmail = new Email();

$conEmail->enviarRecibo($_POST['id']);