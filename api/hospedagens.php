<?php

require_once __DIR__ . '/api_helper.php';

use App\classes\Hospedagens;
use App\classes\Conexao;
use App\classes\Email;

// Verify authorization for all routes
$user = require_auth();

$action = $_GET['action'] ?? '';
$conHos = new Hospedagens();
$db = (new Conexao())->conectar();

switch ($action) {
    case 'metadata':
        try {
            $motivos = $conHos->buscarEstadiasMail(null); // Wait, buscarEstadiasMotivo() returns ID and name
            $motivos = $conHos->buscarEstadiasMotivo();
            $modulos = $conHos->buscarModulos();
            $status = $conHos->buscarAllStatusAtivos();
            $quartos = $conHos->buscarQuartos();
            $lavanderias = $conHos->buscarLavanderias();
            
            // Get config for columns
            $config = $conHos->buscarConfigHospedagens(1);
            $visiveis = [];
            $invisiveis = [];
            if (!empty($config)) {
                $visiveis = json_decode($config[0]['chos_visiveis'] ?? '[]', true) ?: [];
                $invisiveis = json_decode($config[0]['chos_invisiveis'] ?? '[]', true) ?: [];
            }

            send_json([
                'motivos' => $motivos,
                'modulos' => $modulos,
                'status' => $status,
                'quartos' => $quartos,
                'lavanderias' => $lavanderias,
                'colunasVisiveis' => $visiveis,
                'colunasInvisiveis' => $invisiveis
            ]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'list':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            send_json(['success' => false, 'message' => 'Método inválido.'], 405);
        }
        $input = get_json_input();
        $motivos = $input['motivos'] ?? [];
        $modulos = $input['modulos'] ?? [];
        
        try {
            $list = $conHos->buscarHospedagens($motivos, $modulos);
            send_json($list ?: []);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'delete':
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            send_json(['success' => false, 'message' => 'Método inválido.'], 405);
        }
        $id = $_GET['id'] ?? '';
        if (!$id) {
            send_json(['success' => false, 'message' => 'ID ausente.'], 400);
        }
        try {
            $conHos->excluirHospedagem($id);
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'update_columns':
        $input = get_json_input();
        $visiveis = $input['visiveis'] ?? [];
        $invisiveis = $input['invisiveis'] ?? [];
        
        try {
            $conHos->filtroHospedagens([
                'frVisiveis' => json_encode($visiveis, JSON_UNESCAPED_UNICODE),
                'frInvisiveis' => json_encode($invisiveis, JSON_UNESCAPED_UNICODE)
            ]);
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'update_status':
        $input = get_json_input();
        $id = $input['id'] ?? '';
        $status = $input['status'] ?? '';
        try {
            $conHos->altStatusHospedagem(['id' => $id, 'status' => $status]);
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'update_quarto':
        $input = get_json_input();
        $id = $input['id'] ?? '';
        $quarto = $input['quarto'] ?? '';
        try {
            $conHos->altQuartoHospedagem(['id' => $id, 'quarto' => $quarto]);
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'update_checkin':
        $input = get_json_input();
        $id = $input['id'] ?? '';
        $datahora = $input['datahora'] ?? '';
        try {
            $conHos->altCheckInHospedagem(['id' => $id, 'datahora' => $datahora]);
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'update_checkout':
        $input = get_json_input();
        $id = $input['id'] ?? '';
        $datahora = $input['datahora'] ?? '';
        try {
            $conHos->altCheckOutHospedagem(['id' => $id, 'datahora' => $datahora]);
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'save':
        $input = get_json_input();
        
        $dados = [
            'fridhospedagens' => $input['idhospedagens'] ?? '',
            'frcategoria' => $input['hos_categoria'] ?? '',
            'frnome' => $input['hos_nome'] ?? '',
            'frnascimento' => $input['hos_nascimento'] ?? '',
            'frcpfrg' => $input['hos_cpfrg'] ?? '',
            'fremail' => $input['hos_email'] ?? '',
            'frtelefone' => $input['hos_telefone'] ?? '',
            'frtelefoneemergencia' => $input['hos_telefoneemergencia'] ?? '',
            'frlogradouro' => $input['hos_logradouro'] ?? '',
            'frnumero' => $input['hos_numero'] ?? '',
            'frcep' => $input['hos_cep'] ?? '',
            'frbairro' => $input['hos_bairro'] ?? '',
            'frcidade' => $input['hos_cidade'] ?? '',
            'frestado' => $input['hos_estado'] ?? '',
            'fralergico' => $input['hos_alergico'] ?? 'Não',
            'frespecifiquealergia' => $input['hos_especifiquealergia'] ?? '',
            'frrestricaoalimentar' => $input['hos_restricaoalimentar'] ?? 'Não',
            'frespecifiquerestricao' => $input['hos_especifiquerestricao'] ?? '',
            'frlavanderia' => $input['hos_lavanderia'] ?? '',
            'frestadiamotivo' => $input['hos_estadiamotivo'] ?? '',
            'frestadiamodulo' => $input['hos_modulo'] ?? '',
            'frrecibo' => $input['hos_recibo'] ?? 'Emitir o recibo no meu próprio nome.',
            'frnomerecibo' => $input['hos_recnome'] ?? '',
            'frrecibocpfcnpj' => $input['hos_reccpfcnpj'] ?? '',
            'frlogradouroRecibo' => $input['hos_reclogradouro'] ?? '',
            'frnumeroRecibo' => $input['hos_recnumero'] ?? '',
            'frcepRecibo' => $input['hos_reccep'] ?? '',
            'frbairroRecibo' => $input['hos_recbairro'] ?? '',
            'frcidadeRecibo' => $input['hos_reccidade'] ?? '',
            'frestadoRecibo' => $input['hos_recestado'] ?? '',
            'frtermo' => $input['hos_termo'] ?? 'Aceito',
        ];

        // Format dates
        $chegada = $input['hos_previsaochegada'] ?? '';
        $saida = $input['hos_previsaosaida'] ?? '';

        if ($chegada && strpos($chegada, 'T') !== false) {
            $parts = explode('T', $chegada);
            $dados['frprevisaochegadaData'] = $parts[0] ?? '';
            $dados['frprevisaochegadaHora'] = substr($parts[1] ?? '12:00:00', 0, 5);
        } else {
            $dados['frprevisaochegadaData'] = date('Y-m-d');
            $dados['frprevisaochegadaHora'] = '12:00';
        }

        if ($saida && strpos($saida, 'T') !== false) {
            $parts = explode('T', $saida);
            $dados['frprevisaosaidaData'] = $parts[0] ?? '';
            $dados['frprevisaosaidaHora'] = substr($parts[1] ?? '12:00:00', 0, 5);
        } else {
            $dados['frprevisaosaidaData'] = date('Y-m-d');
            $dados['frprevisaosaidaHora'] = '12:00';
        }

        try {
            $newId = $conHos->altHospedagem($dados);
            send_json(['success' => true, 'id' => $newId]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'config_all':
        try {
            // General Config
            $config = $conHos->buscarConfigHospedagens(1);
            $geral = !empty($config) ? $config[0] : [
                'chos_acolhida' => '',
                'chos_ativar' => 'Sim',
                'chos_txtinativo' => ''
            ];

            // Estadias (mainhospedagem)
            $estadias = $conHos->buscarEstadias();
            $modulos = $conHos->buscarModulos();
            $quartos = $conHos->buscarQuartos();
            $statuses = $conHos->buscarAllStatus();

            send_json([
                'geral' => $geral,
                'estadias' => $estadias,
                'modulos' => $modulos,
                'quartos' => $quartos,
                'statuses' => $statuses
            ]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'save_config_geral':
        $input = get_json_input();
        try {
            $conHos->configHospedagens([
                'frIdConfigHospedagens' => 1,
                'frAcolhida' => $input['chos_acolhida'] ?? ''
            ]);
            $conHos->altInativo([
                'frAtivar' => $input['chos_ativar'] ?? 'Sim',
                'frTxtInativo' => $input['chos_txtinativo'] ?? ''
            ]);
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'save_estadia':
        $input = get_json_input();
        $dados = [
            'frIdMain' => $input['idmainhospedagem'] ?? '',
            'frMotivo' => $input['main_motivo'] ?? '',
            'frHost' => $input['main_host'] ?? '',
            'frSeguranca' => $input['main_seguranca'] ?? 'TLS',
            'frPorta' => $input['main_porta'] ?? '587',
            'frRemetente' => $input['main_remetente'] ?? '',
            'frEmail' => $input['main_email'] ?? '',
            'frSenha' => $input['main_senha'] ?? '',
            'frTela' => $input['main_mensagemtela'] ?? '',
            'frMsgEmail' => $input['main_mensagememail'] ?? '',
            'frTermos' => $input['main_termos'] ?? '',
            'frReciboPessoal' => $input['main_recibo_pessoal'] ?? '',
            'frReciboTerceiros' => $input['main_recibo_terceiros'] ?? '',
            'frReciboMensagem' => $input['main_recibo_mensagem'] ?? '',
            'frStatus' => $input['main_status'] ?? 'Ativo'
        ];
        try {
            $conHos->altMain($dados);
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'duplicate_estadia':
        $input = get_json_input();
        $id = $input['id'] ?? '';
        try {
            $newId = $conHos->duplicarMainHospedagem($id);
            send_json(['success' => true, 'id' => $newId]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'delete_estadia':
        $id = $_GET['id'] ?? '';
        try {
            $conHos->excluirEstadia($id);
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'save_modulo':
        $input = get_json_input();
        try {
            $conHos->altModulos([
                'frIdModulo' => $input['idmodulos'] ?? '',
                'frModulo' => $input['mod_nome'] ?? '',
                'frStatusModulo' => $input['mod_status'] ?? 'Ativo'
            ]);
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'delete_modulo':
        $id = $_GET['id'] ?? '';
        try {
            $conHos->excluirModulo($id);
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'save_quarto':
        $input = get_json_input();
        try {
            $conHos->altQuarto([
                'frIdQuartoHospedagem' => $input['idhos_quartos'] ?? '',
                'frQuartoNome' => $input['hos_qua_nome'] ?? '',
                'frQuartoStatus' => $input['hos_qua_status'] ?? 'Ativo'
            ]);
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'delete_quarto':
        $id = $_GET['id'] ?? '';
        try {
            $conHos->excluirQuarto($id);
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'save_status':
        $input = get_json_input();
        try {
            $conHos->altStatus([
                'frIdStatusHospedagem' => $input['idstatushospedagem'] ?? '',
                'frStatusNome' => $input['sta_nome'] ?? '',
                'frStatusStatus' => $input['sta_status'] ?? 'Ativo'
            ]);
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'delete_status':
        $id = $_GET['id'] ?? '';
        try {
            $conHos->excluirStatus($id);
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'send_receipt_email':
        $input = get_json_input();
        $id = $input['id'] ?? '';
        try {
            $conEmail = new Email();
            $conEmail->enviarRecibo($id);
            send_json(['success' => true]);
        } catch (Exception $e) {
            send_json(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    default:
        send_json(['success' => false, 'message' => 'Ação inválida.'], 400);
        break;
}
