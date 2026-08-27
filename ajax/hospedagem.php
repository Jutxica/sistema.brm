<?php session_start();

    require_once '../config.php';

    use App\classes\Hospedagens;

    $conHos = new Hospedagens();

    if($_POST['tipo'] == "status"){

        $conHos->altStatusHospedagem($_POST);

    } elseif($_POST['tipo'] == "checkin") {
        
        $conHos->altCheckInHospedagem($_POST);

    } elseif($_POST['tipo'] == "checkout") {
        
        $conHos->altCheckOutHospedagem($_POST);

    } elseif($_POST['tipo'] == "quarto") {
        
        $conHos->altQuartoHospedagem($_POST);

    } 
