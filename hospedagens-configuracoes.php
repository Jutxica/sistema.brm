<?php session_start();
    
    require_once 'config.php';

    use App\classes\Hospedagens;

    $conHos = new Hospedagens();

    if($_POST['frIdConfigHospedagens'] != ""):
      $conHos->configHospedagens($_POST);
    endif;

    if($_POST['frServico'] != ""):
      $conHos->altLavanderia($_POST);
    endif;

    if($_GET['param1'] == "editar-lavanderia"):
      $lavanderia = $conHos->buscarLavanderia($_GET['param2']);
    endif;

    $txtBtnLavanderia = $_GET['param1'] == "editar-lavanderia" ? "Salvar alterações" : "Adicionar";

    if($_GET['param1'] == "excluir-lavanderia"):
      $conHos->excluirLavanderia($_GET['param2']);
    endif;

    $txtBtnEstadia = $_GET['param1'] == "editar-estadia" ? "Salvar alterações" : "Adicionar";

    if($_POST['frMotivo'] != ""):
      $conHos->altMain($_POST);
    endif;

    if($_GET['param1'] == "duplicar-estadia"):
      $estadia = $conHos->duplicarMainHospedagem($_GET['param2']);
    endif;
    
    if($_GET['param1'] == "editar-estadia"):
      $estadia = $conHos->buscarEstadia($_GET['param2']);
    endif;

    if($_GET['param1'] == "excluir-estadia"):
      $conHos->excluirEstadia($_GET['param2']);
    endif;

    $txtBtnModulo = $_GET['param1'] == "editar-modulo" ? "Salvar alterações" : "Adicionar";

    if($_POST['frModulo'] != ""):
      $conHos->altModulos($_POST);
    endif;

    if($_GET['param1'] == "editar-modulo"):
      $modulo = $conHos->buscarModulo($_GET['param2']);
    endif;

    if($_GET['param1'] == "excluir-modulo"):
      $conHos->excluirModulo($_GET['param2']);
    endif;

    $txtBtnStatus = $_GET['param1'] == "editar-status" ? "Salvar alterações" : "Adicionar";

    if($_POST['frStatusNome'] != ""):
      $conHos->altStatus($_POST);
    endif;

    if($_GET['param1'] == "editar-status"):
      $status = $conHos->buscarStatus($_GET['param2']);
    endif;

    if($_GET['param1'] == "excluir-status"):
      $conHos->excluirStatus($_GET['param2']);
    endif;

    $txtBtnQuartos = $_GET['param1'] == "editar-quarto" ? "Salvar alterações" : "Adicionar";

    if($_POST['frQuartoNome'] != ""):
      $conHos->altQuarto($_POST);
    endif;

    if($_GET['param1'] == "editar-quarto"):
      $quarto = $conHos->buscarQuarto($_GET['param2']);
    endif;

    if($_GET['param1'] == "excluir-quarto"):
      $conHos->excluirQuarto($_GET['param2']);
    endif;

    if($_POST['frAtivar'] != ""):
      $conHos->altInativo($_POST);
    endif;

    $configs = $conHos->buscarConfigHospedagens(1);
    $lavanderias = $conHos->buscarLavanderias();
    $estadias = $conHos->buscarEstadias();
    $modulos = $conHos->buscarModulos();
    $allStatus = $conHos->buscarAllStatus();
    $quartos = $conHos->buscarQuartos();

?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Se usar PNG -->
  <link rel="icon" type="image/png" href="img/logo-pequeno.png">
  
  <title>Sistema - Sistema BRM</title>

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

  <!-- Summernote CSS -->
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/plugins/summernote/summernote-bs4.min.css">

  <!-- Estilo principal do Sistema BRM -->
  <link rel="stylesheet" href="lib/style.css">

</head>
<body class="layout-fixed control-sidebar-slide-open sidebar-mini layout-navbar-fixed <?php echo $usuario[0]['usu_pref_opensidebar']; ?> ">
<div class="wrapper">

  <?php include("navbar.php"); ?>

  <?php include("sidebar.php"); ?>

  <!-- Conteúdo principal -->
  <div class="content-wrapper">
    <section class="content-header">
      <div class="container-fluid">
        
        Hospedagens > Configurações

      </div>
    </section>

    <section class="content">
      <div class="container-fluid">
        
        <div class="card card-primary card-outline">
          <div class="card-header">
            <h3 class="card-title">Configurações</h3>
          </div>
          <div class="card-body">

              <div class="row">
                <div class="col-5 col-sm-3">
                  <div class="nav flex-column nav-tabs h-100" id="vert-tabs-tab" role="tablist" aria-orientation="vertical">
                    <a class="nav-link active" id="vert-tabs-acolhida-tab" data-toggle="pill" href="#vert-tabs-acolhida" role="tab" aria-controls="vert-tabs-acolhida" aria-selected="true">Acolhida</a>
                    <a class="nav-link" id="vert-tabs-lavanderia-tab" data-toggle="pill" href="#vert-tabs-lavanderia" role="tab" aria-controls="vert-tabs-lavanderia" aria-selected="false">Lavanderia</a>
                    <a class="nav-link" id="vert-tabs-hospedagem-tab" data-toggle="pill" href="#vert-tabs-hospedagem" role="tab" aria-controls="vert-tabs-hospedagem" aria-selected="false">Cursos</a>
                    <a class="nav-link" id="vert-tabs-modulos-tab" data-toggle="pill" href="#vert-tabs-modulos" role="tab" aria-controls="vert-tabs-modulos" aria-selected="false">Módulos</a>
                    <a class="nav-link" id="vert-tabs-status-tab" data-toggle="pill" href="#vert-tabs-status" role="tab" aria-controls="vert-tabs-status" aria-selected="false">Status</a>
                    <a class="nav-link" id="vert-tabs-quartos-tab" data-toggle="pill" href="#vert-tabs-quartos" role="tab" aria-controls="vert-tabs-quartos" aria-selected="false">Quartos</a>
                    <a class="nav-link" id="vert-tabs-ativar-tab" data-toggle="pill" href="#vert-tabs-ativar" role="tab" aria-controls="vert-tabs-ativar" aria-selected="false">Ativação</a>
                  </div>
                </div>
                <div class="col-7 col-sm-9">
                  <div class="tab-content" id="vert-tabs-tabContent">
                    <div class="tab-pane text-left fade active show" id="vert-tabs-acolhida" role="tabpanel" aria-labelledby="vert-tabs-acolhida-tab">
                        
                      <form action="/hospedagens-configuracoes" method="POST">
                        <input type="hidden" value="1" name="frIdConfigHospedagens">          
                          <div class="card card-outline card-info">
                            <div class="card-header">
                              <h3 class="card-title">Mensagem antes do formulário</h3>
                            </div>
                            <div class="card-body">
                              <textarea id="summernote" name="frAcolhida"><?php echo $configs[0]['chos_acolhida']; ?></textarea>
                            </div>
                          </div>

                          <div class="row-fluid mt-3">
                            <button type="submit" class="btn btn-success">Salvar alterações</button>
                          </div>
                      </form>

                    </div>
                    <div class="tab-pane fade" id="vert-tabs-lavanderia" role="tabpanel" aria-labelledby="vert-tabs-lavanderia-tab">
                        
                          <form action="/hospedagens-configuracoes" method="POST">
                            <div class="row">
                              <div class="input-group input-group-sm mb-3">
                                <input type="hidden" value="<?php echo $lavanderia[0]['idlavanderia']; ?>" class="form-control" name="frIdLavanderia">
                                <input type="text" value="<?php echo $lavanderia[0]['lav_servico']; ?>" class="form-control" name="frServico">
                                <span class="input-group-append">
                                  <button type="submit" class="btn btn-default btn-flat"><?php echo $txtBtnLavanderia; ?></button>
                                </span>
                              </div>
                            </div>
                          </form>
                          <div class="row">
                            <table class="table table-striped">
                              <thead>
                                <tr>
                                  <th>Lavanderia</th>
                                  <th width="130">Ação</th>
                                </tr>
                              </thead>
                              <tbody>
                                <?php foreach($lavanderias as $lavanderiasL){ ?>
                                <tr>
                                  <td><?php echo $lavanderiasL['lav_servico']; ?></td>
                                  <td>
                                    <a href="/hospedagens-configuracoes/editar-lavanderia/<?php echo $lavanderiasL['idlavanderia']; ?>" class="btn btn-xs btn-warning">Editar</a>
                                    <a href="/hospedagens-configuracoes/excluir-lavanderia/<?php echo $lavanderiasL['idlavanderia']; ?>" onclick="return confirm('Deseja realmente excluir essa lavanderia?')" class="btn btn-xs btn-danger">Excluir</a>
                                  </td>
                                </tr>
                                <?php } ?>
                              </tbody>
                            </table>
                          </div>                       

                    </div>
                    <div class="tab-pane fade" id="vert-tabs-hospedagem" role="tabpanel" aria-labelledby="vert-tabs-hospedagem-tab">
                        
                        <?php if(($_GET['param1'] == "editar-estadia") || ($_GET['param1'] == "add-estadia")): ?>

                          <form action="/hospedagens-configuracoes" method="POST">

                            <div class="row">
                              <div class="form-group col-md-8">
                                <label for="">Motivo da estadia</label>
                                <input type="hidden" class="form-control" value="<?php echo $estadia[0]['idmainhospedagem']; ?>" name="frIdMain">
                                <input type="text" class="form-control" value="<?php echo $estadia[0]['main_motivo']; ?>" name="frMotivo">
                              </div>
                              <div class="form-group col-md-4">
                                <label for="">Status</label>
                                <select class="form-control" name="frStatus" required>
                                  <option <?php echo $estadia[0]['main_status'] == "Ativo" ? 'selected="selected"' : ""; ?> value="Ativo">Ativo</option>
                                  <option <?php echo $estadia[0]['main_status'] == "Inativo" ? 'selected="selected"' : ""; ?> value="Inativo">Inativo</option>
                                </select>
                              </div>
                            </div>

                            <div class="row">
                              <div class="form-group col-md-4">
                                <label for="">Host do remetente</label>
                                <input type="text" class="form-control" value="<?php echo $estadia[0]['main_host']; ?>" name="frHost">
                              </div>
                              <div class="form-group col-md-4">
                                <label for="">Segurança do remetente</label>
                                <input type="text" class="form-control" value="<?php echo $estadia[0]['main_seguranca']; ?>" name="frSeguranca">
                              </div>
                              <div class="form-group col-md-4">
                                <label for="">Porta do remetente</label>
                                <input type="text" class="form-control" value="<?php echo $estadia[0]['main_porta']; ?>" name="frPorta">
                              </div>
                            </div>

                            <div class="row">
                              <div class="form-group col-md-4">
                                <label for="">Nome do remetente</label>
                                <input type="text" class="form-control" value="<?php echo $estadia[0]['main_remetente']; ?>" name="frRemetente">
                              </div>
                              <div class="form-group col-md-4">
                                <label for="">E-mail do remetente</label>
                                <input type="text" class="form-control" value="<?php echo $estadia[0]['main_email']; ?>" name="frEmail">
                              </div>
                              <div class="form-group col-md-4">
                                <label for="">Senha do remetente</label>
                                <input type="password" class="form-control" value="<?php echo $estadia[0]['main_senha']; ?>" name="frSenha">
                              </div>
                            </div>

                            <div class="row">
                              <div class="form-group col-md-12">
                                <label for="">Mensagem na tela após envio</label>
                                <textarea name="frTela" id="msgTela"><?php echo $estadia[0]['main_mensagemtela']; ?></textarea>
                              </div>
                            </div>

                            <div class="row">
                              <div class="form-group col-md-12">
                                <label for="">Mensagem a ser enviada no e-mail do hóspede</label>
                                <textarea name="frMsgEmail" id="msgEmail"><?php echo $estadia[0]['main_mensagememail']; ?></textarea>
                              </div>
                            </div>

                            <div class="row">
                              <div class="form-group col-md-12">
                                <label for="">Termos e condições</label>
                                <textarea name="frTermos" id="termos"><?php echo $estadia[0]['main_termos']; ?></textarea>
                              </div>
                            </div>

                            <div class="row">
                              <div class="form-group col-md-12">
                                <label for="">Recibo no próprio nome</label>
                                <textarea name="frReciboPessoal" id="recibopessoal"><?php echo $estadia[0]['main_recibo_pessoal']; ?></textarea>
                              </div>
                            </div>

                            <div class="row">
                              <div class="form-group col-md-12">
                                <label for="">Recibo em nome de terceiros</label>
                                <textarea name="frReciboTerceiros" id="reciboterceiros"><?php echo $estadia[0]['main_recibo_terceiros']; ?></textarea>
                              </div>
                            </div>

                            <div class="row">
                              <div class="form-group col-md-12">
                                <label for="">Mensagem do e-mail de envio de recibo. (O recibo irá anexo ao e-mail)</label>
                                <textarea name="frReciboMensagem" id="recibomensagem"><?php echo $estadia[0]['main_recibo_mensagem']; ?></textarea>
                              </div>
                            </div>

                            <button type="submit" class="btn btn-success"><?php echo $txtBtnEstadia; ?></button>
                            <a href="/hospedagens-configuracoes" class="btn btn-danger">Cancelar</a>

                          </form>

                        <?php else: ?>

                          <a href="/hospedagens-configuracoes/add-estadia" class="btn btn-default mb-3">Adicionar</a>

                          <table class="table">
                            <thead>
                              <tr>
                                <th>Motivo da estadia (curso)</th>
                                <th>Status</th>
                                <th width="170">Ação</th>
                              </tr>
                            </thead>
                            <tbody>
                              <?php foreach($estadias as $estadiasL){ ?>
                              <tr>
                                <td><?php echo $estadiasL['main_motivo']; ?></td>
                                <td><?php echo $estadiasL['main_status']; ?></td>
                                <td>
                                  <a href="/hospedagens-configuracoes/duplicar-estadia/<?php echo $estadiasL['idmainhospedagem']; ?>" onclick="return confirm('Deseja realmente duplicar esse motivo de estadia?')" class="btn btn-xs btn-default">Duplicar</a>
                                  <a href="/hospedagens-configuracoes/editar-estadia/<?php echo $estadiasL['idmainhospedagem']; ?>" class="btn btn-xs btn-warning">Editar</a>
                                  <a href="/hospedagens-configuracoes/excluir-estadia/<?php echo $estadiasL['idmainhospedagem']; ?>" onclick="return confirm('Deseja realmente excluir esse motivo de estadia?')" class="btn btn-xs btn-danger">Excluir</a>
                                </td>
                              </tr>
                              <?php } ?>
                            </tbody>
                          </table>

                        <?php endif; ?>

                    </div>

                    <div class="tab-pane fade" id="vert-tabs-modulos" role="tabpanel" aria-labelledby="vert-tabs-modulos-tab">
                        
                      <?php if(($_GET['param1'] == "editar-modulo") || ($_GET['param1'] == "add-modulo")): ?>

                        <form action="/hospedagens-configuracoes" method="POST">

                            <div class="row">
                              <div class="form-group col-md-8">
                                <label for="">Módulo</label>
                                <input type="hidden" class="form-control" value="<?php echo $modulo[0]['idmodulos']; ?>" name="frIdModulo">
                                <input type="text" class="form-control" value="<?php echo $modulo[0]['mod_nome']; ?>" name="frModulo">
                              </div>
                              <div class="form-group col-md-4">
                                <label for="">Status</label>
                                <select class="form-control" name="frStatusModulo" required>
                                  <option <?php echo $modulo[0]['mod_status'] == "Ativo" ? 'selected="selected"' : ""; ?> value="Ativo">Ativo</option>
                                  <option <?php echo $modulo[0]['mod_status'] == "Inativo" ? 'selected="selected"' : ""; ?> value="Inativo">Inativo</option>
                                </select>
                              </div>
                            </div>

                            <button type="submit" class="btn btn-success"><?php echo $txtBtnModulo; ?></button>
                            <a href="/hospedagens-configuracoes" class="btn btn-danger">Cancelar</a>

                        </form>

                      <?php else: ?>

                        <a href="/hospedagens-configuracoes/add-modulo" class="btn btn-default mb-3">Adicionar</a>

                          <table class="table">
                            <thead>
                              <tr>
                                <th>Módulo</th>
                                <th>Status</th>
                                <th width="130">Ação</th>
                              </tr>
                            </thead>
                            <tbody>
                              <?php foreach($modulos as $modulosL){ ?>
                              <tr>
                                <td><?php echo $modulosL['mod_nome']; ?></td>
                                <td><?php echo $modulosL['mod_status']; ?></td>
                                <td>
                                  <a href="/hospedagens-configuracoes/editar-modulo/<?php echo $modulosL['idmodulos']; ?>" class="btn btn-xs btn-warning">Editar</a>
                                    <a href="/hospedagens-configuracoes/excluir-modulo/<?php echo $modulosL['idmodulos']; ?>" onclick="return confirm('Deseja realmente excluir esse módulo?')" class="btn btn-xs btn-danger">Excluir</a>
                                </td>
                              </tr>
                              <?php } ?>
                            </tbody>
                          </table>

                      <?php endif; ?>

                    </div>

                    <div class="tab-pane fade" id="vert-tabs-status" role="tabpanel" aria-labelledby="vert-tabs-status-tab">
                        
                        <?php if(($_GET['param1'] == "editar-status") || ($_GET['param1'] == "add-status")): ?>

                          <form action="/hospedagens-configuracoes" method="POST">

                              <div class="row">
                                <div class="form-group col-md-8">
                                  <label for="">Nome do status</label>
                                  <input type="hidden" class="form-control" value="<?php echo $status[0]['idstatushospedagem']; ?>" name="frIdStatusHospedagem">
                                  <input type="text" class="form-control" value="<?php echo $status[0]['sta_nome']; ?>" name="frStatusNome">
                                </div>
                                <div class="form-group col-md-4">
                                  <label for="">Status</label>
                                  <select class="form-control" name="frStatusStatus" required>
                                    <option <?php echo $status[0]['sta_status'] == "Ativo" ? 'selected="selected"' : ""; ?> value="Ativo">Ativo</option>
                                    <option <?php echo $status[0]['sta_status'] == "Inativo" ? 'selected="selected"' : ""; ?> value="Inativo">Inativo</option>
                                  </select>
                                </div>
                              </div>

                              <button type="submit" class="btn btn-success"><?php echo $txtBtnStatus; ?></button>
                              <a href="/hospedagens-configuracoes" class="btn btn-danger">Cancelar</a>

                          </form>

                        <?php else: ?>

                          <a href="/hospedagens-configuracoes/add-status" class="btn btn-default mb-3">Adicionar</a>

                            <table class="table">
                              <thead>
                                <tr>
                                  <th>Nome do status</th>
                                  <th>Status</th>
                                  <th width="130">Ação</th>
                                </tr>
                              </thead>
                              <tbody>
                                <?php foreach($allStatus as $allStatusL){ ?>
                                <tr>
                                  <td><?php echo $allStatusL['sta_nome']; ?></td>
                                  <td><?php echo $allStatusL['sta_status']; ?></td>
                                  <td>
                                    <a href="/hospedagens-configuracoes/editar-status/<?php echo $allStatusL['idstatushospedagem']; ?>" class="btn btn-xs btn-warning">Editar</a>
                                      <a href="/hospedagens-configuracoes/excluir-status/<?php echo $allStatusL['idstatushospedagem']; ?>" onclick="return confirm('Deseja realmente excluir esse status?')" class="btn btn-xs btn-danger">Excluir</a>
                                  </td>
                                </tr>
                                <?php } ?>
                              </tbody>
                            </table>

                        <?php endif; ?>

                    </div>

                    <div class="tab-pane fade" id="vert-tabs-quartos" role="tabpanel" aria-labelledby="vert-tabs-quartos-tab">
                        
                        <?php if(($_GET['param1'] == "editar-quarto") || ($_GET['param1'] == "add-quarto")): ?>

                          <form action="/hospedagens-configuracoes" method="POST">

                              <div class="row">
                                <div class="form-group col-md-8">
                                  <label for="">Nome do quarto</label>
                                <input type="hidden" class="form-control" value="<?php echo $quarto[0]['idhos_quartos']; ?>" name="frIdQuartoHospedagem">
                                  <input type="text" class="form-control" value="<?php echo $quarto[0]['hos_qua_nome']; ?>" name="frQuartoNome">
                                </div>
                                <div class="form-group col-md-4">
                                  <label for="">Status</label>
                                  <select class="form-control" name="frQuartoStatus" required>
                                    <option <?php echo $quarto[0]['hos_qua_status'] == "Ativo" ? 'selected="selected"' : ""; ?> value="Ativo">Ativo</option>
                                    <option <?php echo $quarto[0]['hos_qua_status'] == "Inativo" ? 'selected="selected"' : ""; ?> value="Inativo">Inativo</option>
                                  </select>
                                </div>
                              </div>

                              <button type="submit" class="btn btn-success"><?php echo $txtBtnQuartos; ?></button>
                              <a href="/hospedagens-configuracoes" class="btn btn-danger">Cancelar</a>

                          </form>

                        <?php else: ?>

                          <a href="/hospedagens-configuracoes/add-quarto" class="btn btn-default mb-3">Adicionar</a>

                            <table class="table">
                              <thead>
                                <tr>
                                  <th>Nome do quarto</th>
                                  <th>Status</th>
                                  <th width="130">Ação</th>
                                </tr>
                              </thead>
                              <tbody>
                                <?php foreach($quartos as $quartosL){ ?>
                                <tr>
                                  <td><?php echo $quartosL['hos_qua_nome']; ?></td>
                                  <td><?php echo $quartosL['hos_qua_status']; ?></td>
                                  <td>
                                    <a href="/hospedagens-configuracoes/editar-quarto/<?php echo $quartosL['idhos_quartos']; ?>" class="btn btn-xs btn-warning">Editar</a>
                                      <a href="/hospedagens-configuracoes/excluir-quarto/<?php echo $quartosL['idhos_quartos']; ?>" onclick="return confirm('Deseja realmente excluir esse quarto?')" class="btn btn-xs btn-danger">Excluir</a>
                                  </td>
                                </tr>
                                <?php } ?>
                              </tbody>
                            </table>

                        <?php endif; ?>

                    </div>

                    <div class="tab-pane text-left fade" id="vert-tabs-ativar" role="tabpanel" aria-labelledby="vert-tabs-ativar-tab">
                      
                      <form action="/hospedagens-configuracoes" method="POST">

                        <div class="row-fluid">
                          <div class="form-group form-check">
                            <input type="hidden" name="frAtivar" value="ativo">
                            <input type="checkbox" class="form-check-input" <?php echo $configs[0]['chos_ativar'] == "inativo" ? 'checked="checked"' : ''; ?> value="inativo" id="exampleCheck1" name="frAtivar">
                            <label class="form-check-label" for="exampleCheck1">Manter o formulário inativo.</label>
                          </div>
                        </div>

                        <div class="row-fluid">
                          <label for="">Texto da página quando o formulário estiver inativo:</label>
                          <textarea id="ativar" name="frTxtInativo"><?php echo $configs[0]['chos_txtinativo']; ?></textarea>
                        </div>

                        <div class="row-fluid mt-3">
                          <button type="submit" class="btn btn-success">Salvar alterações</button>
                        </div>

                      </form>

                    </div>

                  </div>
                </div>

              </div>

          </div>
        </div>

      </div>
    </section>
  </div>
  <!-- /.content-wrapper -->

  <!-- Rodapé -->
  <footer class="main-footer">
    <strong>&copy; 2025 Sistema BRM.</strong> Todos os direitos reservados.
  </footer>
</div>
<!-- ./wrapper -->

<!-- Scripts principais -->
<script src="vendor/almasaeed2010/adminlte/plugins/jquery/jquery.min.js"></script>
<script src="vendor/almasaeed2010/adminlte/plugins/bootstrap/js/bootstrap.bundle.min.js"></script>
<script src="vendor/almasaeed2010/adminlte/dist/js/adminlte.min.js"></script>

<!-- jQuery (já vem com AdminLTE) -->
<!-- Bootstrap (já vem com AdminLTE) -->
<!-- Summernote JS -->
<script src="vendor/almasaeed2010/adminlte/plugins/summernote/summernote-bs4.min.js"></script>

<script src="lib/script.js"></script>

<script>
  $(function () {
    $('#summernote, #termos, #ativar').summernote({
      height: 400,
      minHeight: null, // altura mínima
      maxHeight: null, // altura máxima
      focus: true,      // foca automaticamente ao abrir
      toolbar: [
        // Grupo de estilo
        ['style', ['style']],
        
        // Grupo de fonte
        ['font', ['bold', 'italic', 'underline', 'clear']],
        
        // Aqui entram os campos de fonte
        ['fontsize', ['fontsize']],   // seletor de tamanho da fonte
        ['fontname', ['fontname']],   // seletor de tipo da fonte
        
        // Grupo de cores
        ['color', ['color']],
        
        // Grupo de parágrafo
        ['para', ['ul', 'ol', 'paragraph']],
        
        // Grupo de inserção
        ['insert', ['link', 'picture', 'video']],
        
        // Grupo de visualização
        ['view', ['fullscreen', 'codeview', 'help']]
      ],
      fontSizes: ['8', '10', '12', '14', '18', '24', '36', '48', '64'] // opções personalizadas
    });

    // 1. ADICIONE ESSE ESTILO CSS NA SUA PÁGINA (Pode ser antes do script, dentro de uma tag <style>)
    const estiloSummernote = `
    <style>
      .dropdown-campos-grid {
          padding: 15px !important;
          width: 460px !important; /* Largura total do painel */
          max-height: 420px;
          overflow-y: auto;
          border-radius: 6px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
      }
      .campos-titulo-bloco {
          display: block;
          width: 100%;
          font-weight: bold;
          font-size: 11px;
          text-transform: uppercase;
          color: #777;
          margin: 12px 0 6px 0;
          border-bottom: 1px solid #eee;
          padding-bottom: 2px;
      }
      .campos-titulo-bloco:first-child {
          margin-top: 0;
      }
      .btn-tag-dinamica {
          margin: 3px !important;
          padding: 5px 9px !important;
          font-size: 12px !important;
          background-color: #f8f9fa !important;
          border: 1px solid #dcdcdc !important;
          border-radius: 4px !important;
          color: #333 !important;
          display: inline-block;
          transition: all 0.15s ease-in-out;
      }
      .btn-tag-dinamica:hover {
          background-color: #e9ecef !important;
          border-color: #007bff !important;
          color: #007bff !important;
      }
    </style>
    `;
    $('head').append(estiloSummernote);

    // 2. SUA ESTRUTURA ATUALIZADA DO SUMMERNOTE
    $('#recibopessoal, #reciboterceiros').summernote({
      height: 300,
      minHeight: null, 
      maxHeight: null, 
      focus: true,     
      toolbar: [
        ['style', ['style']],
        ['font', ['bold', 'italic', 'underline', 'clear']],
        ['fontsize', ['fontsize']],   
        ['fontname', ['fontname']],   
        ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['insert', ['link', 'picture', 'video']],
        ['view', ['fullscreen', 'codeview', 'help']],
        ['campos', ['campos']] // Seu botão customizado
      ],
      fontSizes: ['8', '10', '12', '14', '18', '24', '36', '48', '64'], 
      buttons: {
        campos: function (context) {
          var ui = $.summernote.ui;
          
          // Função rápida para gerar a string do botão HTML puro
          function gerarBotao(label, tag) {
              return '<button type="button" class="btn btn-tag-dinamica" data-tag="[[' + tag + ']]">' + label + '</button>';
          }

          return ui.buttonGroup([
            ui.button({
              className: 'dropdown-toggle',
              contents: 'Campos <span class="caret"></span>',
              tooltip: 'Inserir conteúdo pronto',
              data: { toggle: 'dropdown' }
            }),
            ui.dropdown({
              className: 'dropdown-campos-grid',
              contents: 
                // --- DADOS PESSOAIS ---
                '<div class="campos-titulo-bloco">Inscrição</div>' +
                gerarBotao('Número Inscrição', 'idhospedagens') +
                // --- DADOS PESSOAIS ---
                '<div class="campos-titulo-bloco">Dados Pessoais</div>' +
                gerarBotao('Categoria', 'hos_categoria') +
                gerarBotao('Nome', 'hos_nome') +
                gerarBotao('Nascimento', 'hos_nascimento') +
                gerarBotao('CPF/RG', 'hos_cpfrg') +
                gerarBotao('E-mail', 'hos_email') +
                gerarBotao('Telefone', 'hos_telefone') +
                gerarBotao('Tel. Emergência', 'hos_telefoneemergencia') +

                // --- ENDEREÇO DA HOSPEDAGEM ---
                '<div class="campos-titulo-bloco">Endereço</div>' +
                gerarBotao('Logradouro', 'hos_logradouro') +
                gerarBotao('Número', 'hos_numero') +
                gerarBotao('CEP', 'hos_cep') +
                gerarBotao('Bairro', 'hos_bairro') +
                gerarBotao('Cidade', 'hos_cidade') +
                gerarBotao('Estado', 'hos_estado') +

                // --- SAÚDE E RESTRICÕES ---
                '<div class="campos-titulo-bloco">Saúde e Restrições</div>' +
                gerarBotao('Alérgico', 'hos_alergico') +
                gerarBotao('Especif. Alergia', 'hos_especifiquealergia') +
                gerarBotao('Restrição Alim.', 'hos_restricaoalimentar') +
                gerarBotao('Especif. Restrição', 'hos_especifiquerestricao') +

                // --- DETALHES DA ESTADIA ---
                '<div class="campos-titulo-bloco">Estadia</div>' +
                gerarBotao('Lavanderia', 'hos_lavanderia') +
                gerarBotao('Motivo', 'hos_estadiamotivo') +
                gerarBotao('Módulo', 'hos_modulo') +
                gerarBotao('Prev. Chegada', 'hos_previsaochegada') +
                gerarBotao('Prev. Saída', 'hos_previsaosaida') +
                gerarBotao('Quarto', 'hos_quarto') +

                // --- DADOS DO RECIBO ---
                '<div class="campos-titulo-bloco">Recibo</div>' +
                gerarBotao('Recibo (S/N)', 'hos_recibo') +
                gerarBotao('Rec. Nome', 'hos_recnome') +
                gerarBotao('Rec. CPF/CNPJ', 'hos_reccpfcnpj') +
                gerarBotao('Rec. Logradouro', 'hos_reclogradouro') +
                gerarBotao('Rec. Número', 'hos_recnumero') +
                gerarBotao('Rec. CEP', 'hos_reccep') +
                gerarBotao('Rec. Bairro', 'hos_recbairro') +
                gerarBotao('Rec. Cidade', 'hos_reccidade') +
                gerarBotao('Rec. Estado', 'hos_recestado') +

                // --- CONTRATO E STATUS ---
                '<div class="campos-titulo-bloco">Contrato & Status</div>' +
                gerarBotao('Termo', 'hos_termo') +
                gerarBotao('Inscrição', 'hos_inscricao') +
                gerarBotao('Status', 'hos_status') +
                gerarBotao('Check-in', 'hos_checkin') +
                gerarBotao('Check-out', 'hos_checkout') +

                // --- Data ---
                '<div class="campos-titulo-bloco">Data</div>' +
                gerarBotao('Dia', 'dia') +
                gerarBotao('Mês por escrito', 'mesescrito') +
                gerarBotao('Mês', 'mes') +
                gerarBotao('Ano', 'ano'),
              
              callback: function ($dropdown) {
                // Monitora o clique nos botões criados dentro do painel
                $dropdown.find('.btn-tag-dinamica').click(function () {
                  var tag = $(this).data('tag');
                  context.invoke('editor.insertText', tag);
                });
              }
            })
          ]).render();
        }
      }
    });

    $('#msgTela, #msgEmail, #recibomensagem').summernote({
      height: 300,
      minHeight: null, 
      maxHeight: null, 
      focus: true,     
      toolbar: [
        ['style', ['style']],
        ['font', ['bold', 'italic', 'underline', 'clear']],
        ['fontsize', ['fontsize']],   
        ['fontname', ['fontname']],   
        ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['insert', ['link', 'picture', 'video']],
        ['view', ['fullscreen', 'codeview', 'help']],
        ['campos', ['campos']] // Seu botão customizado
      ],
      fontSizes: ['8', '10', '12', '14', '18', '24', '36', '48', '64'], 
      buttons: {
        campos: function (context) {
          var ui = $.summernote.ui;
          
          // Função rápida para gerar a string do botão HTML puro
          function gerarBotao(label, tag) {
              return '<button type="button" class="btn btn-tag-dinamica" data-tag="[[' + tag + ']]">' + label + '</button>';
          }

          return ui.buttonGroup([
            ui.button({
              className: 'dropdown-toggle',
              contents: 'Campos <span class="caret"></span>',
              tooltip: 'Inserir conteúdo pronto',
              data: { toggle: 'dropdown' }
            }),
            ui.dropdown({
              className: 'dropdown-campos-grid',
              contents: 
                // --- DADOS PESSOAIS ---
                '<div class="campos-titulo-bloco">Dados Pessoais</div>' +
                gerarBotao('Nome', 'hos_nome') +
                gerarBotao('CPF/RG', 'hos_cpfrg'),
              
              callback: function ($dropdown) {
                // Monitora o clique nos botões criados dentro do painel
                $dropdown.find('.btn-tag-dinamica').click(function () {
                  var tag = $(this).data('tag');
                  context.invoke('editor.insertText', tag);
                });
              }
            })
          ]).render();
        }
      }
    });

  });
</script>

<script>
  $(function () {
    // Quando o usuário clicar em uma aba, salva o ID no localStorage
    $('a[data-toggle="pill"]').on('shown.bs.tab', function (e) {
      sessionStorage.setItem('lastTab', $(e.target).attr('href'));
    });

    // Ao carregar a página, verifica se há uma aba salva
    var lastTab = sessionStorage.getItem('lastTab');
    if (lastTab) {
      // Ativa a aba salva
      $('a[href="' + lastTab + '"]').tab('show');
    }
  });
</script>

</body>
</html>