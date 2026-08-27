<?php
require_once __DIR__ . '/vendor/autoload.php';

use App\classes\Hospedagens;
$conHos = new Hospedagens();

$ficha = $conHos->buscarHospedagem($_GET['param1']);

$nascimento = new DateTime($ficha[0]['hos_nascimento']);
$dtnascimento = $nascimento->format('d/m/Y');

$chegada = new DateTime($ficha[0]['hos_previsaochegada']);
$dtChegada = $chegada->format("d/m/Y - H:i");

$saida = new DateTime($ficha[0]['hos_previsaosaida']);
$dtSaida = $saida->format("d/m/Y - H:i");

$mpdf = new \Mpdf\Mpdf([
    'mode' => 'utf-8',
    'format' => 'A4',
    'margin_top' => 40,
    'margin_bottom' => 0,
    'margin_left' => 0,
    'margin_right' => 0
]);

$mpdf->showImageErrors = true; 
$mpdf->SetDisplayMode('fullpage');

// Definir imagem de fundo
$mpdf->SetDefaultBodyCSS('background', "url('img/fundo-a4.jpg')");
$mpdf->SetDefaultBodyCSS('background-image-resize', 6); // cobre a página inteira

// Conteúdo do PDF (sobre o fundo)
$html = '
<style>
body {
    margin: 0;
    padding: 0;
    font-family: sans-serif;
    font-size: 12pt;
}

/* Área onde o conteúdo deve ficar
   Ajuste "margin-top" conforme a altura do seu topo na imagem */
.content {
    margin: 250px 40px 60px 40px !important;
}
</style>

<div class="content">

<h3>'.$ficha[0]['hos_categoria'].'</h3>

<h4 style="text-align: center;display: block;background-color: #b1a789;color: #FFF;padding: 5px;border-radius: 10px;margin: 10px 0;">Dados Pessoais</h4>

<style>
* {
    font-size: 11pt !important;
}
.table-form {
    width: 100%;
    border-collapse: collapse;
    font-size: 11pt;
}

.table-form td {
    padding: 6px 4px;
    vertical-align: top;
}

.label {
    font-weight: bold;
    font-size: 11pt;
}

.input {
    padding: 6px;
}
</style>

<table class="table-form">

    <tr>
        <td width="70%">
            <div class="label">Nome completo</div>
            <div class="input">'.$ficha[0]['hos_nome'].'</div>
        </td>

        <td width="30%">
            <div class="label">Nascimento</div>
            <div class="input">'.$dtnascimento.'</div>
        </td>
    </tr>

    <tr>
        <td>
            <div class="label">CPF / RG</div>
            <div class="input">'.$ficha[0]['hos_cpfrg'].'</div>
        </td>

        <td>
            <div class="label">E-mail</div>
            <div class="input">'.$ficha[0]['hos_email'].'</div>
        </td>
    </tr>

    <tr>
        <td>
            <div class="label">Telefone de contato</div>
            <div class="input">'.$ficha[0]['hos_telefone'].'</div>
        </td>

        <td>
            <div class="label">Telefone 2 (Urgência)</div>
            <div class="input">'.$ficha[0]['hos_telefoneemergencia'].'</div>
        </td>
    </tr>

    <tr>
        <!-- Endereço -->
        <td width="50%">
            <div class="label">Endereço</div>
            <div class="input">'.$ficha[0]['hos_logradouro'].'</div>
        </td>

        <!-- Número -->
        <td width="25%">
            <div class="label">Número</div>
            <div class="input">'.$ficha[0]['hos_numero'].'</div>
        </td>

        <!-- CEP -->
        <td width="25%">
            <div class="label">CEP</div>
            <div class="input">'.$ficha[0]['hos_cep'].'</div>
        </td>
    </tr>

    <tr>
        <td width="33%">
            <div class="label">Bairro</div>
            <div class="input">'.$ficha[0]['hos_bairro'].'</div>
        </td>

        <td width="34%">
            <div class="label">Cidade</div>
            <div class="input">'.$ficha[0]['hos_cidade'].'</div>
        </td>

        <td width="33%">
            <div class="label">Estado</div>
            <div class="input">'.$ficha[0]['hos_estado'].'</div>
        </td>
    </tr>

    <tr>
        <td>
            <div class="label">É alérgico?</div>
            <div class="input">'.$ficha[0]['hos_alergico'].'</div>
        </td>

        <td colspan="2">
            <div class="label">Especifique</div>
            <div class="input">'.$ficha[0]['hos_especifiquealergia'].'</div>
        </td>
    </tr>

    <tr>
        <td>
            <div class="label">Alguma restrição alimentar?</div>
            <div class="input">'.$ficha[0]['hos_restricaoalimentar'].'</div>
        </td>

        <td colspan="2">
            <div class="label">Especifique</div>
            <div class="input">'.$ficha[0]['hos_especifiquerestricao'].'</div>
        </td>
    </tr>

</table>

<h4 style="text-align: center;display: block;background-color: #b1a789;color: #FFF;padding: 5px;border-radius: 10px;margin: 10px 0;">Serviço de lavanderia</h4>

<table class="table-form">

    <tr>
        <td width="100%">
            <div class="label">Você precisará de serviços de lavanderia?</div>
            <div class="input">'.$ficha[0]['hos_lavanderia'].'</div>
        </td>
    </tr>

</table>

<h4 style="text-align: center;display: block;background-color: #b1a789;color: #FFF;padding: 5px;border-radius: 10px;margin: 10px 0;">Sobre sua estadia</h4>

<table class="table-form">

    <tr>
        <td width="70%">
            <div class="label">Curso que fará na Faculdade Dehoniana</div>
            <div class="input">'.$conHos->buscarEstadia($ficha[0]['hos_estadiamotivo'])[0]['main_motivo'].'</div>
        </td>
        <td width="30%">
            <div class="label">Módulo</div>
            <div class="input">'.$conHos->buscarModulo($ficha[0]['hos_modulo'])[0]['mod_nome'].'</div>
        </td>
    </tr>

</table>

<h4 style="text-align: center;display: block;background-color: #b1a789;color: #FFF;padding: 5px;border-radius: 10px;margin: 10px 0;">Recibo</h4>

<table class="table-form">

    <tr>
        <td width="100%">
            <div class="label">Como emitir o recibo de pagamento?</div>
            <div class="input">'.$ficha[0]['hos_recibo'].'</div>
        </td>
    </tr>';

if($ficha[0]['hos_recibo'] == "Emitir o recibo no nome de terceiro."):
    $html .= '<tr>
        <td width="60%">
            <div class="label">Nome</div>
            <div class="input">'.$ficha[0]['hos_recnome'].'</div>
        </td>

        <td width="40%">
            <div class="label">CPF ou CNPJ</div>
            <div class="input">'.$ficha[0]['hos_reccpfcnpj'].'</div>
        </td>
    </tr>
    <tr>
        <td width="50%">
            <div class="label">Endereço</div>
            <div class="input">'.$ficha[0]['hos_reclogradouro'].'</div>
        </td>

        <td width="25%">
            <div class="label">Número</div>
            <div class="input">'.$ficha[0]['hos_recnumero'].'</div>
        </td>

        <td width="25%">
            <div class="label">CEP</div>
            <div class="input">'.$ficha[0]['hos_reccep'].'</div>
        </td>
    </tr>

    <tr>
        <td width="33%">
            <div class="label">Bairro</div>
            <div class="input">'.$ficha[0]['hos_recbairro'].'</div>
        </td>

        <td width="34%">
            <div class="label">Cidade</div>
            <div class="input">'.$ficha[0]['hos_reccidade'].'</div>
        </td>

        <td width="33%">
            <div class="label">Estado</div>
            <div class="input">'.$ficha[0]['hos_recestado'].'</div>
        </td>
    </tr>';
endif;

$html .= '
</table>

<h4 style="text-align: center;display: block;background-color: #b1a789;color: #FFF;padding: 5px;border-radius: 10px;margin: 10px 0;">Check-in e Check-out</h4>

<table class="table-form">

    <tr>
        <td width="50%" style="text-align:center;">
            <div class="label">Previsão de chegada</div>
            <div class="input">'.$dtChegada.'</div>
        </td>
        <td width="50%" style="text-align:center;">
            <div class="label">Previsão de saída</div>
            <div class="input">'.$dtSaida.'</div>
        </td>
    </tr>

    <tr>
        <td width="50%" style="text-align:center;padding-top:25px;">
            <div class="label">_______________________</div>
            <div class="input">Assinatura do hóspede</div>
        </td>
        <td width="50%" style="text-align:center;padding-top:25px;">
            <div class="label">_______________________</div>
            <div class="input">Assinatura do hóspede</div>
        </td>
    </tr>

</table>

    
</div>
';

$mpdf->WriteHTML($html);
$mpdf->Output('ficha-hospedagem.pdf', 'I');