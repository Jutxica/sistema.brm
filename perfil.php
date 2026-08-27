<?php session_start();
    
    require_once 'config.php';

    use App\classes\Perfil;

    $conPer = new Perfil();

    if(isset($_POST['frInvisiveis'])):
      $conPer->atualizarFiltroPerfil($_POST);
    endif;

    $configsPerfil = $conPer->buscarConfiguracoesPerfil();

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

  <!-- DataTables CSS -->
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css">
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/plugins/datatables-responsive/css/responsive.bootstrap4.min.css">
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/plugins/datatables-buttons/css/buttons.bootstrap4.min.css">
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/plugins/datatables-select/css/select.bootstrap4.min.css">
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/plugins/datatables-colreorder/css/colReorder.bootstrap4.min.css">
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/plugins/datatables-autofill/css/autoFill.bootstrap4.min.css">

  <!-- Select 2 -->
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/plugins/select2/css/select2.min.css">
  <link rel="stylesheet" href="vendor/almasaeed2010/adminlte/plugins/select2-bootstrap4-theme/select2-bootstrap4.min.css">

  <!-- Cropper -->
  <link rel="stylesheet" type="text/css" href="lib/cropper/main.css">
  <link rel="stylesheet" type="text/css" href="lib/cropper/cropper.min.css">

  <!-- Estilo principal do Sistema BRM -->
  <link rel="stylesheet" href="lib/style.css">

  <style>
    .profile-user-img {
      width: 150px;
      cursor: pointer;
    }

    /* Estilo base para os previews */
    .avatar-preview {
      overflow: hidden; /* Essencial para o corte aparecer */
      border: 3px solid #ffffff;
      border-radius: 100%; /* Mantém o preview redondo */
      background-color: #fff;
      margin: 10px auto;
      box-shadow: 0 0 0 3px #adb5bd;
    }

    /* Remova o width: 100% do img aqui, o Cropper cuidará disso */
    .avatar-preview img {
      max-width: none !important; 
    }

    /* Tamanhos específicos para cada preview do seu HTML */
    .preview-lg {
      width: 184px;
      height: 184px;
    }

    .preview-md {
      width: 100px;
      height: 100px;
    }

    .preview-sm {
      width: 50px;
      height: 50px;
    }
  </style>

</head>
<body class="layout-fixed control-sidebar-slide-open sidebar-mini layout-navbar-fixed <?php echo $usuario[0]['usu_pref_opensidebar']; ?> "> <!-- dark-mode -->

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
                  <?php foreach(json_decode($configsPerfil[0]['cpe_invisiveis']) as $configsPerfilL){ ?>
                  <li class="ui-state-default"><?php echo $configsPerfilL; ?></li>
                  <?php } ?>
                </ul>
              </div>
              <div class="col">
                <div class="callout callout-success">
                  <h5>Visíveis</h5>
                </div>
                <ul id="sortable2" class="connectedSortable">
                  <?php foreach(json_decode($configsPerfil[0]['cpe_visiveis']) as $configsPerfilL){ ?>
                  <li class="ui-state-default"><?php echo $configsPerfilL; ?></li>
                  <?php } ?>
                </ul>
              </div>
            </div>

          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-danger" data-dismiss="modal">Cancelar</button>
            <form action="/perfil" id="formFiltro" method="POST">
              <input type="hidden" name="frInvisiveis" id="frinvisiveis"></input>
              <input type="hidden" name="frVisiveis" id="frvisiveis"></input>
              <button type="submit" class="btn btn-success">Salvar alterações</button>
            </form>
          </div>
      </div>
    </div>
  </div>

<?php include("assets/modal-foto.php"); ?>

<div class="wrapper">

  <?php include("navbar.php"); ?>

  <?php include("sidebar.php"); ?>

  <!-- Conteúdo principal -->
  <div class="content-wrapper">

    <section class="content-header">
      <div class="container-fluid">
        
        Perfil > Perfis cadastrados

      </div>
    </section>

    <section class="content-header">
      <div class="container-fluid">
        
        <?php if(isset($_GET['param1'])): ?>

          <div class="row">
            <div class="col-md-3">
              <div class="card card-primary card-outline">
                <div class="card-body box-profile">
                  <div class="text-center qdAvatar">
                    <img class="profile-user-img img-fluid img-circle"
                        id="fotoPerfil"
                         src="img/user.png"
                         alt="Foto do Perfil"
                         data-toggle="modal"
                         data-target="#avatar-modal">
                  </div>
                  <input type="text" class="form-control frFotoAtual" name="frFotoAtualPerfil">
                  <input type="text" class="form-control frNovaFoto" name="frNovaFotoPerfil">
                  <h3 class="profile-username text-center">Nome do Usuário</h3>                  
                </div>
              </div>
            </div>

            <div class="col-md-9">
              <div class="card card-primary card-outline">
                <!-- <div class="card-header p-2">
                  <ul class="nav nav-pills">
                    <li class="nav-item"><a class="nav-link active" href="#dados-pessoais" data-toggle="tab">Dados Pessoais</a></li>
                  </ul>
                </div> -->
                <div class="card-body">
                  <form action="seu-backend.php" method="POST" enctype="multipart/form-data">
                    <div class="row">
                      <div class="col-md-12">
                        <h5 class="text-primary"><i class="fas fa-user-circle"></i> Identificação Principal</h5>
                        <hr>
                      </div>
                      <!-- <div class="form-group col-md-2">
                        <label>Título/Tratamento</label>
                        <select name="titulo" class="form-control">
                          <option value="">Nenhum</option>
                          <option value="Pe.">Pe.</option>
                          <option value="Ir.">Ir.</option>
                          <option value="Msc.">Msc.</option>
                          <option value="Dr.">Dr.</option>
                          <option value="Sr.">Sr.</option>
                          <option value="Sra.">Sra.</option>
                        </select>
                      </div> -->
                      <div class="form-group col-md-6">
                        <label>Nome Completo</label>
                        <input type="hidden" name="frIdPerfil" class="form-control">
                        <input type="text" name="frNomePerfil" class="form-control" required>
                      </div>
                      <div class="form-group col-md-6">
                        <label>E-mail Principal</label>
                        <input type="email" name="frEmailPerfil" class="form-control" required>
                      </div>
                    </div>

                    <div class="row">
                      <div class="form-group col-md-3">
                        <label>Data de Nascimento</label>
                        <input type="date" name="frNascimentoPerfil" class="form-control">
                      </div>
                      <div class="form-group col-md-3">
                        <label>Gênero</label>
                        <select name="frGeneroPerfil" class="form-control">
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                        </select>
                      </div>
                      <div class="form-group col-md-3">
                        <label>Estado Civil</label>
                        <select name="frEstadoCivilPerfil" class="form-control">
                          <option value="Solteiro">Solteiro(a)</option>
                          <option value="Casado">Casado(a)</option>
                          <option value="Divorciado">Divorciado(a)</option>
                          <option value="Viúvo">Viúvo(a)</option>
                        </select>
                      </div>
                      <div class="form-group col-md-3">
                        <label>Nacionalidade</label>
                        <input type="text" name="frNacionalidadePerfil" class="form-control" placeholder="Ex: Brasileira">
                      </div>
                    </div>

                    <div class="row">
                      <div class="form-group col-md-4">
                        <label>CPF (se Brasil)</label>
                        <input type="text" name="frCpfPerfil" class="form-control">
                      </div>
                      <div class="form-group col-md-4">
                        <label>RG / Doc. Identidade</label>
                        <input type="text" name="frRgPerfil" class="form-control">
                      </div>
                      <div class="form-group col-md-4">
                        <label>Passaporte (Internacional)</label>
                        <input type="text" name="frPassaportePerfil" class="form-control">
                      </div>
                    </div>

                    <div class="row mt-3">
                      <div class="col-md-12">
                        <h5 class="text-primary"><i class="fas fa-map-marker-alt"></i> Endereço</h5>
                        <hr>
                      </div>
                      <div class="form-group col-md-4">
                        <label>País</label>
                        <input type="text" name="frPaisPerfil" class="form-control">
                      </div>
                      <div class="form-group col-md-4">
                        <label>UF</label>
                        <input type="text" name="frEstadoPerfil" class="form-control">
                      </div>
                      <div class="form-group col-md-4">
                        <label>Cidade</label>
                        <input type="text" name="frCidadePerfil" class="form-control">
                      </div>
                      <div class="form-group col-md-3">
                        <label>CEP</label>
                        <input type="text" name="frCepPerfil" class="form-control">
                      </div>
                      <div class="form-group col-md-5">
                        <label>Logradouro (Rua/Av)</label>
                        <input type="text" name="frEnderecoPerfil" class="form-control">
                      </div>
                      <div class="form-group col-md-4">
                        <label>Bairro</label>
                        <input type="text" name="frBairroPerfil" class="form-control">
                      </div>
                      <div class="form-group col-md-2">
                        <label>Número</label>
                        <input type="text" name="frNumeroPerfil" class="form-control">
                      </div>
                      <div class="form-group col-md-4">
                        <label>Complemento</label>
                        <input type="text" name="frComplementoPerfil" class="form-control">
                      </div>
                    </div>

                    <div class="row mt-3">
                      <div class="col-md-12">
                        <h5 class="text-primary"><i class="fas fa-phone"></i> Meios de Contato</h5>
                        <hr>
                        <div id="container-contatos">
                          <div class="row contato-item mt-2">
                            <div class="col-md-3">
                              <input type="text" name="frIdContato[]">
                              <select class="form-control" name="frTipoContatoPerfil[]">
                                <option value="celular">Celular</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="telefone">Telefone Fixo</option>
                                <option value="comercial">Comercial</option>
                              </select>
                            </div>
                            <div class="col-md-5">
                              <input type="text" name="frContatoPerfil[]" class="form-control" placeholder="Número">
                            </div>
                            <div class="col-md-3">
                              <input type="text" name="frObsContatoPerfil" class="form-control" placeholder="Observações">
                            </div>
                            <div class="col-md-1 text-center">
                              <button type="button" class="btn btn-success add-contato"><i class="fas fa-plus"></i></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="mt-5 mb-3">
                      <button type="submit" class="btn btn-success"><i class="fas fa-save"></i> Salvar Perfil</button>
                      <a href="/perfil" class="btn btn-danger">Cancelar</a>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

        <?php else: ?>

          <div class="card card-primary card-outline">
            <div class="card-header">
              <h3 class="card-title">Perfis</h3>
              <div class="card-tools">
                <a href="/perfil/add" class="btn btn-default btn-sm" title="Contacts">
                  Cadastrar novo
                </a>
                <button type="button" class="btn btn-tool" title="Contacts" data-toggle="modal" data-target="#modalFiltro">
                  <i class="fas fa-filter"></i>
                </button>
              </div>
            </div>
            <div class="card-body">

              <div class="btn-toolbar mb-3" role="toolbar" aria-label="Toolbar with button groups">
                <div class="btn-group w-100" role="group" aria-label="Alfabeto">
                  <form action="" method="POST">
                    
                    <?php
                      $alfabeto = json_decode('["Todos","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"]');
                      
                      foreach($alfabeto as $alfabetoL){
                        $letraSelecionada = $alfabetoL == $_POST['btnBuscaPerfil'] ? 'primary' : 'default';
                        echo '<button type="submit" name="btnBuscaPerfil" value="'.$alfabetoL.'" class="btn btn-'.$letraSelecionada.'">'.$alfabetoL.'</button>';
                      }
                    ?>
                    
                  </form>
                </div>
              </div>

              <table class="table table-striped table-bordered tabelaInteligente dtr-inline">
                <thead>
                <tr>
                  <?php foreach(json_decode($configsPerfil[0]['cpe_visiveis']) as $configsPerfilL){ ?>
                    <th><?php echo $configsPerfilL; ?></th>
                  <?php } ?>
                </tr>
                <tr class="filtrosHeader">
                  <?php foreach(json_decode($configsPerfil[0]['cpe_visiveis']) as $chave => $configsPerfilL){ ?>
                    <th><input type="text" name="<?php echo "bottomBusca".$chave; ?>" placeholder="Filtrar..." class="form-control"></th>
                  <?php } ?>
                </tr>
              </thead>
                <tbody>
                  <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
                <tfoot>
                  <?php foreach(json_decode($configsPerfil[0]['cpe_visiveis']) as $chave => $configsPerfilL){ ?>
                    <td><input type="text" class="form-control" placeholder="Filtrar..."></td>
                  <?php } ?>
                </tfoot>
              </table>

            </div>
          </div>

        <?php endif; ?>

      </div>
    </section>

    <section class="content">
      <div class="container-fluid">
        
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

<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.mask/1.14.16/jquery.mask.min.js"></script>

<!-- Cropper -->
<script src="lib/cropper/cropper.min.js"></script>
<script src="lib/cropper/main.js"></script>

<script src="vendor/almasaeed2010/adminlte/plugins/select2/js/select2.full.min.js"></script>

<script src="lib/script.js"></script>

  <script>
    document.addEventListener('click', function (e) {
      if (e.target && (e.target.classList.contains('add-contato') || e.target.parentElement.classList.contains('add-contato'))) {
          const container = document.getElementById('container-contatos');
          const novoContato = container.querySelector('.contato-item').cloneNode(true);
          
          // Limpa o input do novo campo
          novoContato.querySelectorAll('input').forEach(input => {
            input.value = '';
          });
          
          // Substitui o botão de adicionar por um de remover
          const btn = novoContato.querySelector('button');
          btn.classList.replace('btn-success', 'btn-danger');
          btn.classList.replace('add-contato', 'remove-contato');
          btn.innerHTML = '<i class="fas fa-trash"></i>';
          
          container.appendChild(novoContato);
      }

      if (e.target && (e.target.classList.contains('remove-contato') || e.target.parentElement.classList.contains('remove-contato'))) {
          e.target.closest('.contato-item').remove();
      }
    });

    $(document).ready(function(){
      // Função para aplicar as máscaras
      function aplicarMascaras() {
          $('input[name="cpf"]').mask('000.000.000-00', {reverse: true});
          $('input[name="rg"]').mask('00.000.000-0', {reverse: true});
          $('input[name="cep"]').mask('00000-000');
          
          // Máscara dinâmica para Telefone/Celular (9 ou 8 dígitos)
          var SPMaskBehavior = function (val) {
            return val.replace(/\D/g, '').length === 11 ? '(00) 00000-0000' : '(00) 0000-00009';
          },
          spOptions = {
            onKeyPress: function(val, e, field, options) {
                field.mask(SPMaskBehavior.apply({}, arguments), options);
              }
          };

          $('input[name="contato[]"]').mask(SPMaskBehavior, spOptions);
      }

      // Inicializa as máscaras ao carregar a página
      aplicarMascaras();

      // Re-aplica as máscaras quando um novo campo de contato for adicionado
      $(document).on('click', '.add-contato', function() {
          // Um pequeno delay para garantir que o elemento já esteja no DOM
          setTimeout(function() {
              aplicarMascaras();
          }, 100);
      });
    });

    $(document).ready(function() {
      // Inicializa o Select2 para uma busca amigável
      $('.select2').select2({
          theme: 'bootstrap4'
      });

      $('#pais').on('change', function() {
          var paisId = $(this).val();
          
          // Exemplo de chamada AJAX para o seu PHP buscar os estados
          $.ajax({
              url: 'buscar_estados.php',
              type: 'POST',
              data: { pais: paisId },
              success: function(data) {
                  $('#estado').html(data); // Preenche o select de estados
                  $('#cidade').html('<option value="">Selecione o estado primeiro</option>');
              }
          });
      });
  });
  </script>

  <script>
    $(function () {

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

      tabela = $('.tabelaInteligente').DataTable({
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