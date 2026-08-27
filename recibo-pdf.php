<?php
require_once __DIR__ . '/vendor/autoload.php';

use App\classes\Hospedagens;
$conHos = new Hospedagens();

$hospede = $conHos->buscarHospedagemRecibo($_GET['param1']);

$mpdf = new \Mpdf\Mpdf([
    'mode' => 'utf-8',
    'format' => 'A4',
    'margin_top' => 50,
    'margin_bottom' => 40,
    'margin_left' => 0,
    'margin_right' => 0
]);

$mpdf->showImageErrors = true; 
$mpdf->SetDisplayMode('fullpage');

// Definir imagem de fundo
$mpdf->SetDefaultBodyCSS('background', "url('img/fundo-a4-recibo.jpg')");
$mpdf->SetDefaultBodyCSS('background-image-resize', 6); // cobre a página inteira

// Conteúdo do PDF (sobre o fundo)
$html = '<h1 style="font-size:16px; color:#FFFFFF; position:absolute; width:100%; padding:10px 0; left:0; text-align:right; background-color:#9d9d9d;">'.$hospede[0]['main_motivo'].'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</h1>';

if($hospede[0]['hos_recibo'] == "Emitir o recibo no nome de terceiro."):
    $recibo .= $hospede[0]['main_recibo_terceiros'] == "" ? "Nenhum recibo configurado" : $hospede[0]['main_recibo_terceiros'];
elseif($hospede[0]['hos_recibo'] == "Emitir o recibo no meu próprio nome."):
    $recibo .= $hospede[0]['main_recibo_pessoal'] == "" ? "Nenhum recibo configurado" : $hospede[0]['main_recibo_pessoal'];
endif;

switch(date("m")){
    case 1: $mesEscrito = "Janeiro"; break;
    case 2: $mesEscrito = "Fevereiro"; break;
    case 3: $mesEscrito = "Março"; break;
    case 4: $mesEscrito = "Abril"; break;
    case 5: $mesEscrito = "Maio"; break;
    case 6: $mesEscrito = "Junho"; break;
    case 7: $mesEscrito = "Julho"; break;
    case 8: $mesEscrito = "Agosto"; break;
    case 9: $mesEscrito = "Setembro"; break;
    case 10: $mesEscrito = "Outubro"; break;
    case 11: $mesEscrito = "Novembro"; break;
    case 12: $mesEscrito = "Dezembro"; break;
    default: $mesEscrito = "";
}

$recibo = str_replace('[[dia]]', date("d"), $recibo);
$recibo = str_replace('[[mes]]', date("m"), $recibo);
$recibo = str_replace('[[mesescrito]]', $mesEscrito, $recibo);
$recibo = str_replace('[[ano]]', date("Y"), $recibo);

$recibo = str_replace('[[idhospedagens]]', $hospede[0]['idhospedagens'], $recibo);
$recibo = str_replace('[[hos_categoria]]', $hospede[0]['hos_categoria'], $recibo);
$recibo = str_replace('[[hos_nome]]', $hospede[0]['hos_nome'], $recibo);
$recibo = str_replace('[[hos_nascimento]]', $hospede[0]['hos_nascimento'], $recibo);
$recibo = str_replace('[[hos_cpfrg]]', $hospede[0]['hos_cpfrg'], $recibo);
$recibo = str_replace('[[hos_email]]', $hospede[0]['hos_email'], $recibo);
$recibo = str_replace('[[hos_telefone]]', $hospede[0]['hos_telefone'], $recibo);
$recibo = str_replace('[[hos_telefoneemergencia]]', $hospede[0]['hos_telefoneemergencia'], $recibo);
$recibo = str_replace('[[hos_logradouro]]', $hospede[0]['hos_logradouro'], $recibo);
$recibo = str_replace('[[hos_numero]]', $hospede[0]['hos_numero'], $recibo);
$recibo = str_replace('[[hos_cep]]', $hospede[0]['hos_cep'], $recibo);
$recibo = str_replace('[[hos_bairro]]', $hospede[0]['hos_bairro'], $recibo);
$recibo = str_replace('[[hos_cidade]]', $hospede[0]['hos_cidade'], $recibo);
$recibo = str_replace('[[hos_estado]]', $hospede[0]['hos_estado'], $recibo);
$recibo = str_replace('[[hos_alergico]]', $hospede[0]['hos_alergico'], $recibo);
$recibo = str_replace('[[hos_especifiquealergia]]', $hospede[0]['hos_especifiquealergia'], $recibo);
$recibo = str_replace('[[hos_restricaoalimentar]]', $hospede[0]['hos_restricaoalimentar'], $recibo);
$recibo = str_replace('[[hos_especifiquerestricao]]', $hospede[0]['hos_especifiquerestricao'], $recibo);
$recibo = str_replace('[[hos_lavanderia]]', $hospede[0]['hos_lavanderia'], $recibo);
$recibo = str_replace('[[hos_estadiamotivo]]', $hospede[0]['hos_estadiamotivo'], $recibo);
$recibo = str_replace('[[hos_modulo]]', $hospede[0]['hos_modulo'], $recibo);
$recibo = str_replace('[[hos_previsaochegada]]', $hospede[0]['hos_previsaochegada'], $recibo);
$recibo = str_replace('[[hos_previsaosaida]]', $hospede[0]['hos_previsaosaida'], $recibo);
$recibo = str_replace('[[hos_quarto]]', $hospede[0]['hos_quarto'], $recibo);
$recibo = str_replace('[[hos_recibo]]', $hospede[0]['hos_recibo'], $recibo);
$recibo = str_replace('[[hos_recnome]]', $hospede[0]['hos_recnome'], $recibo);
$recibo = str_replace('[[hos_reccpfcnpj]]', $hospede[0]['hos_reccpfcnpj'], $recibo);
$recibo = str_replace('[[hos_reclogradouro]]', $hospede[0]['hos_reclogradouro'], $recibo);
$recibo = str_replace('[[hos_recnumero]]', $hospede[0]['hos_recnumero'], $recibo);
$recibo = str_replace('[[hos_reccep]]', $hospede[0]['hos_reccep'], $recibo);
$recibo = str_replace('[[hos_recbairro]]', $hospede[0]['hos_recbairro'], $recibo);
$recibo = str_replace('[[hos_reccidade]]', $hospede[0]['hos_reccidade'], $recibo);
$recibo = str_replace('[[hos_recestado]]', $hospede[0]['hos_recestado'], $recibo);
$recibo = str_replace('[[hos_termo]]', $hospede[0]['hos_termo'], $recibo);
$recibo = str_replace('[[hos_inscricao]]', $hospede[0]['hos_inscricao'], $recibo);
$recibo = str_replace('[[hos_status]]', $hospede[0]['hos_status'], $recibo);
$recibo = str_replace('[[hos_checkin]]', $hospede[0]['hos_checkin'], $recibo);
$recibo = str_replace('[[hos_checkout]]', $hospede[0]['hos_checkout'], $recibo);

$html .= '<div style="display:block; padding:80px 80px 0 80px;">';
$html .= $recibo;    
$html .= '</div>';

$mpdf->WriteHTML($html);
$mpdf->Output('recibo-hospedagem.pdf', 'I');