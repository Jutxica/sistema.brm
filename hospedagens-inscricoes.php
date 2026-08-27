<?php session_start();
    
    require_once 'config.php';

    use App\classes\Hospedagens;

    $conHos = new Hospedagens();

    if($_GET['param1'] == "excluir"){
      $conHos->excluirHospedagem($_GET['param2']);
    }
    
    if($_GET['param1'] == "editar"){
      $hospedagem = $conHos->buscarHospedagem($_GET['param2']);
    }

    if (!empty($_POST['frnome'])) {
        $conHos->altHospedagem($_POST);
    }

    if(isset($_POST['frInvisiveis'])):
      $conHos->filtroHospedagens($_POST);
    endif;

    if (isset($_POST['frBuscaMotivo'])):
        $motivos = $_POST['frBuscaMotivo'];
        $modulos = $_POST['frBuscaModulo'] ?? [];
        $inscricoes = $conHos->buscarHospedagens($motivos, $modulos);
    endif;
    
    $hosp = $conHos->buscarConfigHospedagens(1);
    $lavanderias = $conHos->buscarLavanderias();
    $motivos = $conHos->buscarEstadiasMotivoExterno();
    $motivosBusca = $conHos->buscarEstadiasMotivo();
    $modulos = $conHos->buscarModulosExterno();
    $modulosBusca = $conHos->buscarModulos();
    $status = $conHos->buscarAllStatusAtivos();
    $quartos = $conHos->buscarQuartosExterno();

    foreach($status as $statusL){
      $selectStatus .= '<option value="'.$statusL['idstatushospedagem'].'">'.$statusL['sta_nome'].'</option>';
    }

    foreach($quartos as $quartosL){
      $selectQuartos .= '<option value="'.$quartosL['idhos_quartos'].'">'.$quartosL['hos_qua_nome'].'</option>';
    }

?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Se usar PNG -->
  <link rel="icon" type="image/png" href="img/logo-pequeno.png">
  
  <title>Sistema - Conventinho SCJ</title>

  <?php
    $protocolo = 'http://';

    if (
        (!empty($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) !== 'off') ||
        (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https') ||
        (isset($_SERVER['HTTP_X_FORWARDED_SSL']) && strtolower($_SERVER['HTTP_X_FORWARDED_SSL']) === 'on') ||
        (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)
    ) {
        $protocolo = 'https://';
    }

    $host = $_SERVER['HTTP_HOST'];
    $path = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/') . '/';
    $baseUrl = $protocolo . $host . $path;
    echo '<base href="'.$baseUrl.'">';
  ?>

  <!-- Fonte Google (opcional, usada pelo AdminLTE) -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback">

  <!-- Font Awesome -->
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/plugins/fontawesome-free/css/all.min.css">

  <!-- Estilo principal do AdminLTE -->
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/dist/css/adminlte.min.css">

  <!-- DataTables CSS -->
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css">
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/plugins/datatables-responsive/css/responsive.bootstrap4.min.css">
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/plugins/datatables-buttons/css/buttons.bootstrap4.min.css">
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/plugins/datatables-select/css/select.bootstrap4.min.css">
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/plugins/datatables-colreorder/css/colReorder.bootstrap4.min.css">
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/plugins/datatables-autofill/css/autoFill.bootstrap4.min.css">

  <!-- Select2 -->
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/plugins/select2/css/select2.min.css">

  <!-- Estilo principal do Conventinho SCJ -->
  <link rel="stylesheet" href="lib/style.css">

  <style>
    h4 {
        text-align: center;
        display: block;
        background-color: #b1a789;
        color: #FFF;
        padding: 5px;
        border-radius: 10px;
        margin: 10px 0;
    }
    .formBusca {
      margin: 0 0 20px 0;
      border-radius: 10px;
      box-shadow: 1px 1px 3px 0px #cdcdcd;
      padding: 10px;
    }
    .select2-container--default .select2-selection--multiple .select2-selection__choice {
      color: var(--conventinho-primary);
    }
  </style>

</head>
<body class="layout-fixed control-sidebar-slide-open sidebar-mini layout-navbar-fixed <?php echo $usuario[0]['usu_pref_opensidebar']; ?> ">

<!-- Modal -->
<div class="modal fade" id="modalFiltro" tabindex="-1" role="dialog" aria-labelledby="modalFiltroLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">
      
        <div class="modal-header">
          <h5 class="modal-title" id="modalFiltroLabel">Filtros</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          
          <div class="row">
            <div class="col">
              <div class="callout callout-danger">
                <h5>Invisíveis</h5>
              </div>
              <ul id="sortable1" class="connectedSortable">
                <?php foreach(json_decode($hosp[0]['chos_invisiveis']) as $hospL){ ?>
                <li class="ui-state-default"><?php echo $hospL; ?></li>
                <?php } ?>
              </ul>
            </div>
            <div class="col">
              <div class="callout callout-success">
                <h5>Visíveis</h5>
              </div>
              <ul id="sortable2" class="connectedSortable">
                <?php foreach(json_decode($hosp[0]['chos_visiveis']) as $hospL){ ?>
                <li class="ui-state-default"><?php echo $hospL; ?></li>
                <?php } ?>
              </ul>
            </div>
          </div>

        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-danger" data-dismiss="modal">Cancelar</button>
          <form action="/hospedagens-inscricoes" id="formFiltro" method="POST">
            <input type="hidden" name="frInvisiveis" id="frinvisiveis"></input>
            <input type="hidden" name="frVisiveis" id="frvisiveis"></input>
            <button type="submit" class="btn btn-success">Salvar alterações</button>
          </form>
        </div>
    </div>
  </div>
</div>

<div class="wrapper">

  <?php include("navbar.php"); ?>

  <?php include("sidebar.php"); ?>

  <!-- Conteúdo principal -->
  <div class="content-wrapper">
    <section class="content-header">
      <div class="container-fluid">
        
        Hospedagens > Inscrições

      </div>
    </section>

    <section class="content">
      <div class="container-fluid">
        
        <div class="card card-primary card-outline">
          <div class="card-header">
            <h3 class="card-title">Inscritos</h3>
            <div class="card-tools">
              <button type="button" class="btn btn-tool" title="Contacts" data-toggle="modal" data-target="#modalFiltro">
                <i class="fas fa-filter"></i>
              </button>
            </div>
          </div>
          <div class="card-body">

            <?php if($_GET['param1'] == "editar"): ?>

              <form action="/hospedagens-inscricoes" id="formFicha" method="POST">
            
                <h3>Ficha de hospedagem</h3>

                <div class="hierarquia">
                <div>
                    <input type="hidden" value="<?php echo $hospedagem[0]['idhospedagens']; ?>" name="fridhospedagens">
                    <input class="form-check-input" <?php echo $hospedagem[0]['hos_categoria'] == "Padre" ? 'checked="checked"' : ""; ?> type="radio" name="frcategoria" id="padre" value="Padre" required>
                    <label class="form-check-label" for="padre">Padre</label>
                </div>
                
                <div>
                    <input class="form-check-input" <?php echo $hospedagem[0]['hos_categoria'] == "Diácono" ? 'checked="checked"' : ""; ?> type="radio" name="frcategoria" id="diacono" value="Diácono" required>
                    <label class="form-check-label" for="diacono">Diácono</label>
                </div>
                
                <div>
                    <input class="form-check-input" <?php echo $hospedagem[0]['hos_categoria'] == "Religioso(a)" ? 'checked="checked"' : ""; ?> type="radio" name="frcategoria" id="religioso" value="Religioso(a)" required>
                    <label class="form-check-label" for="religioso">Religioso(a)</label>
                </div>
                
                <div>
                    <input class="form-check-input" <?php echo $hospedagem[0]['hos_categoria'] == "Seminarista" ? 'checked="checked"' : ""; ?> type="radio" name="frcategoria" id="seminarista" value="Seminarista" required>
                    <label class="form-check-label" for="seminarista">Seminarista</label>
                </div>
                
                <div>
                    <input class="form-check-input" <?php echo $hospedagem[0]['hos_categoria'] == "Leigo(a)" ? 'checked="checked"' : ""; ?> type="radio" name="frcategoria" id="leigo" value="Leigo(a)" required>
                    <label class="form-check-label" for="leigo">Leigo(a)</label>
                </div>
                </div>
                
                <h4>Dados pessoais</h4>
            
                <div class="row">
                    <div class="form-group col-md-8">
                        <label for="">Nome completo</label>
                        <input type="text" class="form-control" value="<?php echo $hospedagem[0]['hos_nome']; ?>" name="frnome" required>
                    </div>
                    <div class="form-group col-md-4">
                        <label for="">Nascimento</label>
                        <input type="date" class="form-control" value="<?php echo $hospedagem[0]['hos_nascimento']; ?>" name="frnascimento" required>
                    </div>
                </div>
                
                <div class="row">
                    <div class="form-group col-md-6">
                        <label for="">CPF / RG</label>
                        <input type="text" class="form-control" value="<?php echo $hospedagem[0]['hos_cpfrg']; ?>" name="frcpfrg" required>
                    </div>
                    <div class="form-group col-md-6">
                        <label for="">E-mail</label>
                        <input type="email" class="form-control" value="<?php echo $hospedagem[0]['hos_email']; ?>" name="fremail" required>
                    </div>
                </div>
                
                <div class="row">
                    <div class="form-group col-md-6">
                        <label for="">Telefone de contato</label>
                        <input type="text" class="form-control" value="<?php echo $hospedagem[0]['hos_telefone']; ?>" name="frtelefone" required>
                    </div>
                    <div class="form-group col-md-6">
                        <label for="">Telefone 2 (Urgência)</label>
                        <input type="text" class="form-control" value="<?php echo $hospedagem[0]['hos_telefoneemergencia']; ?>" name="frtelefoneemergencia" required>
                    </div>
                </div>
                
                <div class="row">
                    <div class="form-group col-md-6">
                        <label for="">Endereço</label>
                        <input type="text" class="form-control" value="<?php echo $hospedagem[0]['hos_logradouro']; ?>" name="frlogradouro" required>
                    </div>
                    <div class="form-group col-md-3">
                        <label for="">Número</label>
                        <input type="text" class="form-control" value="<?php echo $hospedagem[0]['hos_numero']; ?>" name="frnumero" required>
                    </div>
                    <div class="form-group col-md-3">
                        <label for="">CEP</label>
                        <input type="text" class="form-control" value="<?php echo $hospedagem[0]['hos_cep']; ?>" name="frcep" required>
                    </div>
                </div>
                
                <div class="row">
                    <div class="form-group col-md-4">
                        <label for="">Bairro</label>
                        <input type="text" class="form-control" value="<?php echo $hospedagem[0]['hos_bairro']; ?>" name="frbairro" required>
                    </div>
                    <div class="form-group col-md-4">
                        <label for="">Cidade</label>
                        <input type="text" class="form-control" value="<?php echo $hospedagem[0]['hos_cidade']; ?>" name="frcidade" required>
                    </div>
                    <div class="form-group col-md-4">
                        <label for="">Estado</label>
                        <input type="text" class="form-control" value="<?php echo $hospedagem[0]['hos_estado']; ?>" name="frestado" required>
                    </div>
                </div>
                
                <div class="row">
                    <div class="form-group col-md-4">
                        <label for="">É alérgico?</label>
                        <select class="form-control alergico" name="fralergico" required>
                            <option value="">Selecione</option>
                            <option <?php echo $hospedagem[0]['hos_alergico'] == "Sim" ? 'selected="selected"' : ""; ?> value="Sim">Sim</option>
                            <option <?php echo $hospedagem[0]['hos_alergico'] == "Não" ? 'selected="selected"' : ""; ?> value="Não">Não</option>
                        </select>
                    </div>
                    <div class="form-group col-md-8 espAlergico">
                        <label for="">Especifique</label>
                        <input type="text" class="form-control" value="<?php echo $hospedagem[0]['hos_especifiquealergia']; ?>" name="frespecifiquealergia">
                    </div>
                </div>
                
                <div class="row">
                    <div class="form-group col-md-4">
                        <label for="">Alguma restrição alimentar?</label>
                        <select class="form-control resAlimentar" name="frrestricaoalimentar" required>
                            <option value="">Selecione</option>
                            <option <?php echo $hospedagem[0]['hos_restricaoalimentar'] == "Sim" ? 'selected="selected"' : ""; ?> value="Sim">Sim</option>
                            <option <?php echo $hospedagem[0]['hos_restricaoalimentar'] == "Não" ? 'selected="selected"' : ""; ?> value="Não">Não</option>
                        </select>
                    </div>
                    <div class="form-group col-md-8 espAlimentar">
                        <label for="">Especifique</label>
                        <input type="text" class="form-control" value="<?php echo $hospedagem[0]['hos_especifiquerestricao']; ?>" name="frespecifiquerestricao">
                    </div>
                </div>
                
                <h4>Serviço de lavanderia</h4>
                
                <div class="row">
                    <div class="form-group col-md-12">
                        <label for="">Você precisará de serviços de lavanderia?</label>
                        <select class="form-control" name="frlavanderia" required>
                            <option value="">Selecione</option>
                            <?php foreach($lavanderias as $lavanderiasL){ ?>
                            <option <?php echo $hospedagem[0]['hos_lavanderia'] == $lavanderiasL['lav_servico'] ? 'selected="selected"' : ""; ?> value="<?php echo $lavanderiasL['lav_servico']; ?>"><?php echo $lavanderiasL['lav_servico']; ?></option>
                            <?php } ?>
                        </select>
                    </div>
                </div>
                
                <h4>Sobre sua estadia</h4>
                
                <div class="row">
                    <div class="form-group col-md-8">
                        <label for="">Selecione o curso que fará na Faculdade Dehoniana:</label>
                        <select class="form-control" name="frestadiamotivo" id="frestadiamotivo" required>
                            <option value="">Selecione</option>
                            <?php foreach($motivos as $motivosL){ ?>
                            <option <?php echo $hospedagem[0]['hos_estadiamotivo'] == $motivosL['idmainhospedagem'] ? 'selected="selected"' : ""; ?> value="<?php echo $motivosL['idmainhospedagem']; ?>"><?php echo $motivosL['main_motivo']; ?></option>
                            <?php } ?>
                        </select>
                    </div>
                    <div class="form-group col-md-4">
                        <label for="">Módulo</label>
                        <select class="form-control" name="frestadiamodulo" id="frestadiamodulo" required>
                            <option value="">Selecione</option>
                            <?php foreach($modulos as $modulosL){ ?>
                            <option <?php echo $hospedagem[0]['hos_modulo'] == $modulosL['idmodulos'] ? 'selected="selected"' : ""; ?> value="<?php echo $modulosL['idmodulos']; ?>"><?php echo $modulosL['mod_nome']; ?></option>
                            <?php } ?>
                        </select>
                    </div>
                </div>

                <h4 class="mt-3">Check-in e Check-out</h4>

                <?php
                  $dthChegada = explode("T", $hospedagem[0]['hos_previsaochegada']);
                  $dthSaida = explode("T", $hospedagem[0]['hos_previsaosaida']);
                ?>

                <div class="row">
                    <div class="col-md-6">
                        <h4>Previsão de chegada</h4>
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label for="">Data</label>
                                <input type="date" value="<?php echo $dthChegada[0]; ?>" class="form-control mb-3" name="frprevisaochegadaData" required>
                            </div>
                            <div class="form-group col-md-6">
                                <label for="">Hora</label>
                                <input type="time" value="<?php echo substr($dthChegada[1],0,-3); ?>" class="form-control mb-3" name="frprevisaochegadaHora" required>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h4>Previsão de saída</h4>
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label for="">Data</label>
                                <input type="date" value="<?php echo $dthSaida[0]; ?>" class="form-control mb-3" name="frprevisaosaidaData" required>
                            </div>
                            <div class="form-group col-md-6">
                                <label for="">Hora</label>
                                <input type="time" value="<?php echo substr($dthSaida[1],0,-3); ?>" class="form-control mb-3" name="frprevisaosaidaHora" required>
                            </div>
                        </div>
                    </div>
                </div>

                <h4>Recibo</h4>
                
                <div class="row">
                    <div class="form-group col-md-12">
                        <label for="">Como emitir o recibo de pagamento?</label>
                        <select class="form-control frrecibo" name="frrecibo" required>
                            <option value="">Selecione</option>
                            <option <?php echo $hospedagem[0]['hos_recibo'] == "Emitir o recibo no meu próprio nome." ? 'selected="selected"' : ""; ?> value="Emitir o recibo no meu próprio nome.">Emitir o recibo no meu próprio nome.</option>
                            <option <?php echo $hospedagem[0]['hos_recibo'] == "Emitir o recibo no nome de terceiro." ? 'selected="selected"' : ""; ?> value="Emitir o recibo no nome de terceiro.">Emitir o recibo no nome de terceiro.</option>
                        </select>
                    </div>
                </div>

                <div class="row">
                    <div class="form-group col-md-8">
                        <label for="">Nome</label>
                        <input type="text" class="form-control frnomerecibo" value="<?php echo $hospedagem[0]['hos_recnome']; ?>" name="frnomerecibo">
                    </div>
                    <div class="form-group col-md-4">
                        <label for="">CPF ou CNPJ</label>
                        <input type="text" class="form-control frrecibocpfcnpj" value="<?php echo $hospedagem[0]['hos_reccpfcnpj']; ?>" name="frrecibocpfcnpj">
                    </div>
                </div>

                <div class="row">
                    <div class="form-group col-md-6">
                        <label for="">Endereço</label>
                        <input type="text" class="form-control frlogradouroRecibo" value="<?php echo $hospedagem[0]['hos_reclogradouro']; ?>" name="frlogradouroRecibo">
                    </div>
                    <div class="form-group col-md-3">
                        <label for="">Número</label>
                        <input type="text" class="form-control frnumeroRecibo" value="<?php echo $hospedagem[0]['hos_recnumero']; ?>" name="frnumeroRecibo">
                    </div>
                    <div class="form-group col-md-3">
                        <label for="">CEP</label>
                        <input type="text" class="form-control frcep frcepRecibo" value="<?php echo $hospedagem[0]['hos_reccep']; ?>" name="frcepRecibo">
                    </div>
                </div>
                
                <div class="row">
                    <div class="form-group col-md-4">
                        <label for="">Bairro</label>
                        <input type="text" class="form-control frbairroRecibo" value="<?php echo $hospedagem[0]['hos_recbairro']; ?>" name="frbairroRecibo">
                    </div>
                    <div class="form-group col-md-4">
                        <label for="">Cidade</label>
                        <input type="text" class="form-control frcidadeRecibo" value="<?php echo $hospedagem[0]['hos_reccidade']; ?>" name="frcidadeRecibo">
                    </div>
                    <div class="form-group col-md-4">
                        <label for="">Estado</label>
                        <input type="text" class="form-control frestadoRecibo" value="<?php echo $hospedagem[0]['hos_recestado']; ?>" name="frestadoRecibo">
                    </div>
                </div>

                <h4>Termos e condições</h4>

                <div class="form-check form-switch">
                    <input class="form-check-input" <?php if($hospedagem[0]['hos_termo'] == "Aceito"): echo 'checked="checked"'; endif; ?> type="checkbox" id="flexSwitchCheckDefault" value="Aceito" name="frtermo" required>
                    <?php echo $hospedagem[0]['hos_termo']; ?>
                </div>
                
                <br>
                <button type="submit" class="btn btn-success btnEnviar">Atualizar</button>
                <a href="/hospedagens-inscricoes" class="btn btn-danger">Cancelar</a>
            
              </form>

            <?php else: ?>

              <form action="" method="POST">
                
                  <div class="row formBusca">
                    <div class="col-sm-4">
                      <label class="" for="">Motivo da estadia (curso)</label>
                      <select class="form-control select-multiplo" name="frBuscaMotivo[]" multiple required>
                        <option value="">Selecione</option>
                        <?php
                          // 1. Criamos uma variável segura para o array de busca
                          // Se existir o POST, usamos ele. Se não, usamos um array vazio para não dar erro no in_array.
                          $motivosSelecionados = isset($_POST['frBuscaMotivo']) ? (array)$_POST['frBuscaMotivo'] : [];

                          foreach($motivosBusca as $motivosBuscaL){
                              $selecionaMot = ''; // Resetamos a variável no início do loop
                              
                              // 2. Agora o in_array nunca receberá um valor nulo
                              if(in_array($motivosBuscaL['idmainhospedagem'], $motivosSelecionados)){
                                  $selecionaMot = 'selected="selected"';
                              }
                              
                              echo '<option '.$selecionaMot.' value="'.$motivosBuscaL['idmainhospedagem'].'">'.$motivosBuscaL['main_motivo'].'</option>';
                          }
                          ?>
                      </select>
                    </div>
                    <div class="col-sm-4">
                      <label class="" for="">Módulo</label>
                      <select class="form-control select-multiplo" name="frBuscaModulo[]" multiple>
                        <option value="">Selecione</option>
                        <?php
                          $modulosSelecionados = isset($_POST['frBuscaModulo']) ? (array)$_POST['frBuscaModulo'] : [];

                          foreach($modulosBusca as $modulosBuscaL){
                            $selecionaMod = '';

                            if(in_array($modulosBuscaL['idmodulos'], $modulosSelecionados)){
                              $selecionaMod = 'selected="selected"';
                            }

                            echo '<option '.$selecionaMod.' value="'.$modulosBuscaL['idmodulos'].'">'.$modulosBuscaL['mod_nome'].'</option>';
                          }
                        ?>
                      </select>
                    </div>
                    <div class="col-sm-4">
                      <button type="submit" class="btn btn-primary mb-2" style="margin-top: 32px; width: 100%;">Buscar</button>
                    </div>
                  </div>
                
              </form>
            
            <table class="table table-striped table-bordered tabelaInteligente dtr-inline">
              <thead>
                <tr>
                  <?php foreach(json_decode($hosp[0]['chos_visiveis']) as $hospL){ ?>
                    <th><?php echo $hospL; ?></th>
                  <?php } ?>
                </tr>
                <tr class="filtrosHeader">
                  <?php foreach(json_decode($hosp[0]['chos_visiveis']) as $chave => $hospL){ ?>
                    <th><input type="text" name="<?php echo "bottomBusca".$chave; ?>" placeholder="Filtrar..." class="form-control"></th>
                  <?php } ?>
                </tr>
              </thead>
              <tbody>
                <?php foreach($inscricoes as $inscricoesL){ ?>
                <tr>
                  <?php
                    foreach(json_decode($hosp[0]['chos_visiveis']) as $hospL){
                      switch($hospL){
                        case "Categoria" : $imprime = "hos_categoria"; break;
                        case "Nome" : $imprime = "hos_nome"; break;
                        case "CPF/RG" : $imprime = "hos_cpfrg"; break;
                        case "Cidade" : $imprime = "hos_cidade"; break;
                        case "E-mail" : $imprime = "hos_email"; break;
                        case "Celular/Whatsapp" : $imprime = "hos_telefone"; break;
                        case "Inscrição" : $imprime = "hos_inscricao"; break;
                        case "Ações" : $imprime = "acoes"; break;
                        case "Previsão de chegada" : $imprime = "hos_previsaochegada"; break;
                        case "Previsão de saída" : $imprime = "hos_previsaosaida"; break;
                        case "Hierarquia" : $imprime = "hos_categoria"; break;
                        case "Nascimento" : $imprime = "hos_nascimento"; break;
                        case "Telefone 2 (Urgência)" : $imprime = "hos_telefoneemergencia"; break;
                        case "Endereço" : $imprime = "hos_logradouro"; break;
                        case "Número" : $imprime = "hos_numero"; break;
                        case "CEP" : $imprime = "hos_cep"; break;
                        case "Bairro" : $imprime = "hos_bairro"; break;
                        case "Estado" : $imprime = "hos_estado"; break;
                        case "É alérgico?" : $imprime = "hos_alergico"; break;
                        case "Especifique (alergia)" : $imprime = "hos_especifiquealergia"; break;
                        case "Alguma restrição alimentar?" : $imprime = "hos_restricaoalimentar"; break;
                        case "Especifique (restrição alimentar)" : $imprime = "hos_especifiquerestricao"; break;
                        case "Você precisará de serviços de lavanderia?" : $imprime = "hos_lavanderia"; break;
                        case "Motivo da hospedagem (curso)" : $imprime = "hos_estadiamotivo"; break;
                        case "Módulo" : $imprime = "hos_modulo"; break;
                        case "Recibo?" : $imprime = "hos_recibo"; break;
                        case "Nome (Recibo)" : $imprime = "hos_recnome"; break;
                        case "CPF/CNPJ (Recibo)" : $imprime = "hos_reccpfcnpj"; break;
                        case "Endereço (Recibo)" : $imprime = "hos_reclogradouro"; break;
                        case "Número (Recibo)" : $imprime = "hos_recnumero"; break;
                        case "CEP (Recibo)" : $imprime = "hos_reccep"; break;
                        case "Bairro (Recibo)" : $imprime = "hos_recbairro"; break;
                        case "Cidade (Recibo)" : $imprime = "hos_reccidade"; break;
                        case "Estado (Recibo)" : $imprime = "hos_recestado"; break;
                        case "Termos" : $imprime = "hos_termo"; break;
                        case "Status" : $imprime = "hos_status"; break;
                        case "Check-in" : $imprime = "hos_checkin"; break;
                        case "Check-out" : $imprime = "hos_checkout"; break;
                        case "Quarto" : $imprime = "hos_quarto"; break;
                        case "Número de inscrição" : $imprime = "idhospedagens"; break;
                        default: $imprime = "";
                      }
                  ?>
                    <?php if(($imprime == "hos_inscricao") || ($imprime == "hos_previsaochegada") || ($imprime == "hos_previsaosaida")): ?>
                      <td><?php $data = new DateTime($inscricoesL[$imprime]); echo $data->format('d/m/Y H:i:s'); ?></td>
                    <?php elseif($imprime == "hos_status"): ?>
                      <?php if($inscricoesL[$imprime] == "" || $inscricoesL[$imprime] == "0"): ?>
                        <td><a href="javascript:void(0);" data-id="<?php echo $inscricoesL['idhospedagens']; ?>" class="btnAddStatus">Acrescentar</a></td>
                      <?php else: ?>
                        <td><a href="javascript:void(0);" data-id="<?php echo $inscricoesL['idhospedagens']; ?>" data-status="<?php echo $inscricoesL[$imprime]; ?>" class="btnAddStatus"><?php echo $conHos->buscarStatus($inscricoesL[$imprime])[0]['sta_nome']; ?></a></td>
                      <?php endif; ?>
                    <?php elseif($imprime == "hos_quarto"): ?>

                      <?php if($inscricoesL[$imprime] == "" || $inscricoesL[$imprime] == "0"): ?>
                        <td><a href="javascript:void(0);" data-id="<?php echo $inscricoesL['idhospedagens']; ?>" class="btnAddQuarto">Acrescentar</a></td>
                      <?php else: ?>
                        <td><a href="javascript:void(0);" data-id="<?php echo $inscricoesL['idhospedagens']; ?>" data-quarto="<?php echo $inscricoesL[$imprime]; ?>" class="btnAddQuarto"><?php echo $conHos->buscarQuarto($inscricoesL[$imprime])[0]['hos_qua_nome']; ?></a></td>
                      <?php endif; ?>
                      
                    <?php elseif($imprime == "hos_nascimento"): ?>
                      <td><?php $data = new DateTime($inscricoesL[$imprime]); echo $data->format('d/m/Y'); ?></td>
                    <?php elseif($imprime == "hos_modulo"): ?>
                      <td><?php echo $conHos->buscarModulo($inscricoesL['hos_modulo'])[0]['mod_nome']; ?></td>
                    <?php elseif($imprime == "hos_estadiamotivo"): ?>
                      <td><?php echo $conHos->buscarEstadia($inscricoesL['hos_estadiamotivo'])[0]['main_motivo']; ?></td>
                    <?php elseif($imprime == "hos_checkin"): ?>
                      <?php if($inscricoesL[$imprime] != ""): ?>
                        <td><a href="javascript:void(0);" data-id="<?php echo $inscricoesL['idhospedagens']; ?>" class="btnAddCheckIn"><?php $data = new DateTime($inscricoesL[$imprime]); echo $data->format('d/m/Y H:i:s'); ?></a></td>
                      <?php else: ?>
                        <td><a href="javascript:void(0);" data-id="<?php echo $inscricoesL['idhospedagens']; ?>" class="btnAddCheckIn">Acrescentar</a></td>
                      <?php endif; ?>
                    <?php elseif($imprime == "hos_checkout"): ?>
                      <?php if($inscricoesL[$imprime] != ""): ?>
                        <td><a href="javascript:void(0);" data-id="<?php echo $inscricoesL['idhospedagens']; ?>" class="btnAddCheckOut"><?php $data = new DateTime($inscricoesL[$imprime]); echo $data->format('d/m/Y H:i:s'); ?></a></td>
                      <?php else: ?>
                        <td><a href="javascript:void(0);" data-id="<?php echo $inscricoesL['idhospedagens']; ?>" class="btnAddCheckOut">Acrescentar</a></td>
                      <?php endif; ?>
                    <?php elseif($imprime == "acoes"): ?>
                      <td>
                        <div class="dropdown">
                          <button class="btn btn-xs btn-info dropdown-toggle" data-recibo="<?php echo $inscricoesL["idhospedagens"]; ?>" type="button" data-toggle="dropdown" aria-expanded="false">
                            Recibo
                          </button>
                          <div class="dropdown-menu">
                            <a class="dropdown-item" target="_blank" href="/recibo-pdf/<?php echo $inscricoesL["idhospedagens"]; ?>">Imprimir</a>
                            <a class="dropdown-item btnEnviarRecibo" data-id="<?php echo $inscricoesL["idhospedagens"]; ?>" href="javascript:void(0);">Enviar por e-mail</a>
                          </div>
                        </div>
                        <a href="/ficha-hospedagem/<?php echo $inscricoesL["idhospedagens"]; ?>" target="_blank" class="btn btn-xs btn-info">Ficha de Inscrição</a>
                        <a href="/termos-pdf/<?php echo $inscricoesL['hos_estadiamotivo']; ?>" target="_blank" class="btn btn-xs btn-info">Termos e condições</a>
                        <a href="/hospedagens-inscricoes/editar/<?php echo $inscricoesL["idhospedagens"]; ?>" class="btn btn-xs btn-warning">Editar</a>
                        <a href="/hospedagens-inscricoes/excluir/<?php echo $inscricoesL["idhospedagens"]; ?>" onclick="return confirm('Deseja realmente excluir esse cadastro?')" class="btn btn-xs btn-danger">Excluir</a>
                      </td>
                    <?php else: ?>
                      <td><?php echo $inscricoesL[$imprime]; ?></td>
                    <?php endif; ?>
                  <?php } ?>
                  
                  
                </tr>
                <?php } ?>
              </tbody>
              <tfoot>
                <?php foreach(json_decode($hosp[0]['chos_visiveis']) as $chave => $hospL){ ?>
                    <td></td>
                  <?php } ?>
              </tfoot>
            </table>
            
            <?php endif; ?>

          </div>
        </div>

      </div>
    </section>
  </div>
  <!-- /.content-wrapper -->

  <!-- Rodapé -->
  <footer class="main-footer">
    <strong>&copy; 2025 Conventinho SCJ.</strong> Todos os direitos reservados.
  </footer>
</div>
<!-- ./wrapper -->

  <!-- Scripts principais -->
  <script src="vendor/almasaeed2010/adminlte/plugins/jquery/jquery.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/jquery-ui/jquery-ui.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/bootstrap/js/bootstrap.bundle.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/dist/js/adminlte.min.js"></script>

  <!-- DataTables JS -->
  <script src="vendor/almasaeed2010/adminlte/plugins/datatables/jquery.dataTables.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/datatables-bs4/js/dataTables.bootstrap4.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/datatables-responsive/js/dataTables.responsive.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/datatables-responsive/js/responsive.bootstrap4.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/datatables-buttons/js/dataTables.buttons.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/datatables-buttons/js/buttons.bootstrap4.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/datatables-buttons/js/buttons.print.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/datatables-buttons/js/buttons.colVis.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/datatables-buttons/js/buttons.flash.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/datatables-buttons/js/buttons.html5.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/datatables-select/js/dataTables.select.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/datatables-select/js/select.bootstrap4.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/datatables-colreorder/js/dataTables.colReorder.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/datatables-colreorder/js/colReorder.bootstrap4.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/datatables-autofill/js/dataTables.autoFill.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/datatables-autofill/js/autoFill.bootstrap4.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/jszip/jszip.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/pdfmake/pdfmake.min.js"></script>
  <script src="vendor/almasaeed2010/adminlte/plugins/pdfmake/vfs_fonts.js"></script>

  <!-- Select2 -->
  <script src="vendor/almasaeed2010/adminlte/plugins/select2/js/select2.full.min.js"></script>

  <script src="lib/script.js"></script>

  <script>
    $(function () {
      $(".select-multiplo").select2({
        placeholder: "Selecione uma opção",
        //allowClear: true // Adiciona um "X" para limpar a seleção
      });

      $("body").on("click",".btnEnviarRecibo",function(){
        $(this).parent().prev().html('<i class="fas fa-spinner fa-spin"></i>');
        idRec = $(this).attr("data-id");
        $.ajax({
          url: 'ajax/email-recibo.php',
          method: 'POST',
          data: { id: idRec }
        })
        .done(function (dados) {
          $('[data-recibo="'+idRec+'"]').html('Recibo');
        })
      });

      tabela = $('.tabelaInteligente').DataTable({
          initComplete: function () {
            this.api()
                .columns()
                .every(function () {
                    let column = this;

                    let hasHTML = column
                        .data()
                        .toArray()
                        .some(d => /<[^>]+>/.test(d));

                    let inputElement;

                    if (hasHTML) {
                        inputElement = document.createElement('input');
                        inputElement.type = 'text';
                        inputElement.classList.add('form-control');
                        inputElement.placeholder = 'Filtrar...';

                        inputElement.addEventListener('keyup', function () {
                            column
                                .search(this.value)
                                .draw();
                        });
                    } else {
                        inputElement = document.createElement('select');
                        inputElement.classList.add('form-control');
                        inputElement.add(new Option(''));

                        inputElement.addEventListener('change', function () {
                            column
                                .search(this.value, { exact: true })
                                .draw();
                        });

                        column
                            .data()
                            .unique()
                            .sort()
                            .each(function (d) {
                                inputElement.add(new Option(d));
                            });
                    }

                    column.footer().replaceChildren(inputElement);
                });
          },
          orderCellsTop: true,   // mantém ordenação nos títulos
          fixedHeader: true,
          stateSave: true,
          scrollX: true,
          layout: {
              //top2Start: 'pageLength',
              //top2End: 'search',
              //topStart: 'info',
              //topEnd: 'paging',
              //bottomStart: 'pageLength',
              //bottomEnd: 'search',
              //bottom2Start: 'info',
              //bottom2End: 'paging'
          },
          dom: 'Bfrtip',
            "aoColumnDefs" : [{
            "bSortable" : false,
            "aTargets" : ["no-sort"]
          },{
            "bSearchable": false,
            "aTargets" : ["no-search"]
          }],
          buttons: [
              {
                  extend: 'pageLength',
                  className: 'btn btn-default',
              },
              //'copy',
              //'csv',
              {
                  extend: 'excel',
                  className: 'btn btn-default',
                  exportOptions: {
                      columns: ':visible'
                  },
                  text: 'Excel'
              },
              {
                  extend: 'pdf',
                  className: 'btn btn-default',
                  exportOptions: {
                      columns: ':visible'
                  },
                  text: 'PDF'
              },
              {
                  extend: 'print',
                  className: 'btn btn-default',
                  exportOptions: {
                      columns: ':visible'
                  },
                  text: 'Imprimir'
              },
              {
                  extend: 'colvis',
                  className: 'btn btn-default',
                  text: 'Colunas visí­veis'
              }
          ],
          columnDefs: [ {
              //targets: -1,
              //visible: false
          } ],
      searching: true,
          drawCallback: function () {
              $('[data-toggle="popover"]').popover({
                  //'trigger': 'hover',
                  'placement': 'top',
                  'container': 'body',
                  'html' :true
              })
          },
          language: {
              processing:     "Buscando...",
              search:         "Buscar:",
              lengthMenu:     "Mostrar _MENU_ registros por página",
              info:           "Mostrando de _START_ até  _END_ registros de _TOTAL_ registros",
              infoEmpty:      "Sem registros",
              infoFiltered:   "(Filtro de _MAX_ elementos no total)",
              infoPostFix:    "",
              loadingRecords: "Carregando...",
              zeroRecords:    "Nenhum registro encontrado.",
              emptyTable:     "Não há dados disponí­veis na tabela",
              paginate: {
                  first:      "Primeiro",
                  previous:   "Anterior",
                  next:       "Próximo",
                  last:       "Último"
              },
              aria: {
                  sortAscending:  ": permitem classificar a coluna em ordem crescente",
                  sortDescending: ": permitem classificar a coluna em ordem decrescente"
              },
              buttons: {
                  pageLength: {
                      _: "Mostrar %d registros por página"
                  }
              }
          },
          lengthChange: true,
          pageLength: 10,
          lengthMenu: [ 10, 25, 50, 75, 100, 150, 200 ]
      });
      // Apply the search
      
      // Armazena os valores digitados por coluna
      const filtrosPorColuna = {};

      // Aplica os eventos de busca por coluna
      tabela.columns().every(function () {
          const colunaIndex = this.index();

          // Seleciona inputs do header e do footer
          $('.tabelaInteligente thead tr:eq(1) th').eq(colunaIndex).find('input')
          .off().on('keyup change', function () {
            filtrosPorColuna[colunaIndex] = this.value.trim();
            aplicarFiltroGlobal();
          });

          $('input', this.footer()).off().on('keyup change', function () {
              const valor = this.value.trim();
              filtrosPorColuna[colunaIndex] = valor;
              aplicarFiltroGlobal();
          });

      });

      function aplicarFiltroGlobal() {
          $.fn.dataTable.ext.search = [];

          $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
              // Verifica se estamos na tabela correta
              if (settings.nTable !== tabela.table().node()) return true;

              // Verifica cada coluna com base nos filtros armazenados
              for (let i in filtrosPorColuna) {
                  const termo = filtrosPorColuna[i];
                  const valorColuna = data[i].toLowerCase();

                  if (termo.startsWith('!')) {
                      const termoNegado = termo.substring(1).toLowerCase();
                      if (valorColuna.includes(termoNegado)) {
                          return false; // Exclui linha
                      }
                  } else if (termo !== '') {
                      if (!valorColuna.includes(termo.toLowerCase())) {
                          return false; // NÃ£o bate com busca positiva
                      }
                  }
              }

              return true; // Linha vÃ¡lida
          });

          tabela.draw();
      }
    });
  </script>

    <script>
      $( function() {
        $( "#sortable1, #sortable2" ).sortable({
          connectWith: ".connectedSortable",
          update: function(event, ui) {
              var itens = [];
              var itens2 = [];

              // percorre todos os <li> dentro de #sortable1
              $("#sortable1 li").each(function(){
                  itens.push($(this).text()); // pega o texto de cada li
              });

              // percorre todos os <li> dentro de #sortable2
              $("#sortable2 li").each(function(){
                  itens2.push($(this).text()); // pega o texto de cada li
              });

              // transforma o array em JSON e coloca no textarea
              $("#frinvisiveis").val(JSON.stringify(itens));
              $("#frvisiveis").val(JSON.stringify(itens2));
          }
        }).disableSelection();

        $(".tabelaInteligente").on("click",".btnAddCheckIn",function(){
          idhosp = $(this).attr("data-id");
          $(this).parent("td").html('<input type="datetime-local" data-id="'+idhosp+'" class="form-control txtCheckIn"><button class="btn btn-xs btn-success btnAjaxOkIn"><i class="fas fa-check"></i></button>');
        });

        $(".tabelaInteligente").on("click",".btnAddCheckOut",function(){
          idhosp = $(this).attr("data-id");
          $(this).parent("td").html('<input type="datetime-local" data-id="'+idhosp+'" class="form-control txtCheckOut"><button class="btn btn-xs btn-success btnAjaxOkOut"><i class="fas fa-check"></i></button>');
        });

        $(".tabelaInteligente").on("click",".btnAddStatus",function(){
          ele = $(this);
          idhosp = ele.attr("data-id");
          idstatus = ele.attr("data-status");
          selectStatus = '<?php echo $selectStatus; ?>';
          const td = ele.closest("td");
          td.html('<select class="form-control altStatusHospedagem" data-id="'+idhosp+'" style="min-width: 150px;"><option value="">Selecione</option>'+selectStatus+'</select>');
          const select = td.find("select");
          select.val(String(idstatus));
          //select.trigger("change");
        });

        $(".tabelaInteligente").on("change",".altStatusHospedagem",function(){
          eleSel = $(this);
          valSel = $(this).attr("data-id");
          txtSel = $(this).find("option:selected").text();
          $.ajax({
            url: 'ajax/hospedagem.php',    // endpoint
            method: 'POST',           // ou type: 'GET'
            data: { tipo: 'status', id: valSel, status: $(this).val() }
          })
          .done(function (dados) {
            if(txtSel != "Selecione"){
              eleSel.parent().html('<a href="javascript:void(0);" data-id="'+valSel+'" class="btnAddStatus">'+txtSel+'</a>');
            } else {
              eleSel.parent().html('<a href="javascript:void(0);" data-id="'+valSel+'" class="btnAddStatus">Acrescentar</a>');
            }
          })

        });

        $(".tabelaInteligente").on("click",".btnAddQuarto",function(){
          ele = $(this);
          idhosp = ele.attr("data-id");
          idquarto = ele.attr("data-quarto");
          selectQuartos = '<?php echo $selectQuartos; ?>';
          const td = ele.closest("td");
          td.html('<select class="form-control altQuartoHosp" data-id="'+idhosp+'" style="min-width: 150px;"><option value="">Selecione</option>'+selectQuartos+'</select>');
          const select = td.find("select");
          select.val(String(idquarto));
          //select.trigger("change");
        });

        $(".tabelaInteligente").on("change",".altQuartoHosp",function(){
          eleSel = $(this);
          valSel = $(this).attr("data-id");
          txtSel = $(this).find("option:selected").text();
          $.ajax({
            url: 'ajax/hospedagem.php',    // endpoint
            method: 'POST',           // ou type: 'GET'
            data: { tipo: 'quarto', id: valSel, quarto: $(this).val() }
          })
          .done(function (dados) {
            if(txtSel != "Selecione"){
              eleSel.parent().html('<a href="javascript:void(0);" data-id="'+valSel+'" class="btnAddQuarto">'+txtSel+'</a>');
            } else {
              eleSel.parent().html('<a href="javascript:void(0);" data-id="'+valSel+'" class="btnAddQuarto">Acrescentar</a>');
            }
          })

        });

        $(".tabelaInteligente").on("click",".btnAjaxOkIn",function(){
          var el = $(this).prev("input"); // guarda referência ao input
          valor = $(this).prev("input").val();
          idSel = $(this).prev("input").attr("data-id");
          $.ajax({
            url: 'ajax/hospedagem.php',    // endpoint
            method: 'POST',           // ou type: 'GET'
            data: { tipo: 'checkin', id: idSel, datahora: valor }
          })
          .done(function (dados) {

            if(valor != ""){
              const date = new Date(valor);
              formatado = new Intl.DateTimeFormat("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              }).format(date);
            } else {
              formatado = "Acrescentar";
            }

            el.parent().html('<a href="javascript:void(0);" data-id="'+idSel+'" class="btnAddCheckIn">'+formatado.replace(',', '')+'</a></td>');
          })
        });

        $(".tabelaInteligente").on("click",".btnAjaxOkOut",function(){
          var el = $(this).prev("input"); // guarda referência ao input
          valor = $(this).prev("input").val();
          idSel = $(this).prev("input").attr("data-id");
          $.ajax({
            url: 'ajax/hospedagem.php',    // endpoint
            method: 'POST',           // ou type: 'GET'
            data: { tipo: 'checkout', id: idSel, datahora: valor }
          })
          .done(function (dados) {

            if(valor != ""){
              const date = new Date(valor);
              formatado = new Intl.DateTimeFormat("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              }).format(date);
            } else {
              formatado = "Acrescentar";
            }

            el.parent().html('<a href="javascript:void(0);" data-id="'+idSel+'" class="btnAddCheckOut">'+formatado.replace(',', '')+'</a></td>');
          })
        });

        $('#modalFiltro').on('shown.bs.modal', function (event) {
          var itens = [];
          var itens2 = [];

          // percorre todos os <li> dentro de #sortable1
          $("#sortable1 li").each(function(){
              itens.push($(this).text()); // pega o texto de cada li
          });

          // percorre todos os <li> dentro de #sortable2
          $("#sortable2 li").each(function(){
              itens2.push($(this).text()); // pega o texto de cada li
          });

          // transforma o array em JSON e coloca no textarea
          $("#frinvisiveis").val(JSON.stringify(itens));
          $("#frvisiveis").val(JSON.stringify(itens2));
        });

      });
    </script>
</body>
</html>