<?php
require_once __DIR__ . '/vendor/autoload.php';

use App\classes\Hospedagens;
$conHos = new Hospedagens();

$estadia = $conHos->buscarEstadia($_GET['param1']);

$mpdf = new \Mpdf\Mpdf([
    'mode' => 'utf-8',
    'format' => 'A4',
    'margin_top' => 40,
    'margin_bottom' => 40,
    'margin_left' => 20,
    'margin_right' => 20
]);

$mpdf->showImageErrors = true; 
$mpdf->SetDisplayMode('fullpage');

// Definir imagem de fundo
$mpdf->SetDefaultBodyCSS('background', "url('img/fundo-a4-termos.jpg')");
$mpdf->SetDefaultBodyCSS('background-image-resize', 6); // cobre a página inteira

// Conteúdo do PDF (sobre o fundo)
$html = $estadia[0]['main_termos'];

$mpdf->WriteHTML($html);
$mpdf->Output('ficha-hospedagem.pdf', 'I');