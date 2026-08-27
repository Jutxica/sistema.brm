<?php session_start(); if(($_GET['param1'] == "editar") && ($_GET['param2'] == 1)): die(); endif;
    
    require_once 'config.php';

    use App\classes\Usuarios;

    $conUsu = new Usuarios();

    $permissoes = [];

    if(isset($_POST['frNomeUsu'])):
        $conUsu->altUsuarios($_POST);
    endif;

    if($_GET['param1'] == "excluir"):
        $conUsu->excluirUsuario($_GET['param2']);
    endif;

    if($_GET['param1'] == "editar"):
        $usuario = $conUsu->buscarUsuario($_GET['param2']);
        $permissoes = json_decode($usuario[0]['usu_acessos']);
    endif;

    $usuarios = $conUsu->buscarUsuarios();

?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Se usar PNG -->
  <link rel="icon" type="image/png" href="img/logo-pequeno.png">
  
  <title>Sistema - Conventinho SCJ - Usuários</title>

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

  <link rel="stylesheet" type="text/css" href="lib/lou-multi-select/css/multi-select.css">

  <!-- Estilo principal do Conventinho SCJ -->
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
        
        Configurações > Usuários

      </div>
    </section>

    <section class="content">
      <div class="container-fluid">
        
        <div class="card card-primary card-outline">
          <div class="card-header">
            <h3 class="card-title">Usuários</h3>
            <div class="card-tools">
              <?php if(($_GET['param1'] != "adicionar") && ($_GET['param1'] != "editar")): ?>
                <a href="/usuarios/adicionar" class="btn btn-default btn-sm">Adicionar</a>
              <?php endif; ?>
            </div>
          </div>
          <div class="card-body">

            <?php if(($_GET['param1'] == "adicionar") || ($_GET['param1'] == "editar")): ?>

                <?php
                    function permitido($tela,$arrayBuscar){
                        if(in_array($tela, $arrayBuscar)):
                            return "selected";
                        endif;
                    }
                ?>

                <form action="/usuarios" method="POST">

                    <div class="row">
                        <div class="col-sm-4">
                            <label>Nome</label>
                            <input type="hidden" class="form-control" value="<?php echo $usuario[0]['idusuarios']; ?>" name="frIdUsu">
                            <input type="text" class="form-control mb-3" value="<?php echo $usuario[0]['usu_nome']; ?>" name="frNomeUsu" required>
                        </div>
                        <div class="col-sm-4">
                            <label>E-mail</label>
                            <input type="email" class="form-control mb-3" value="<?php echo $usuario[0]['usu_email']; ?>" name="frEmailUsu" required>
                        </div>
                        <div class="col-sm-4">
                            <label>Status</label>
                            <select class="form-control" name="frStatusUsu" required>
                                <option <?php echo $usuario[0]['usu_status'] == "Ativo" ? 'selected="selected"' : ""; ?> value="Ativo">Ativo</option>
                                <option <?php echo $usuario[0]['usu_status'] == "Inativo" ? 'selected="selected"' : ""; ?> value="Inativo">Inativo</option>
                            </select>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-sm-6">
                            <label>Senha</label>
                            <input type="password" class="form-control frUsuSenha mb-3" onkeyup="verificaSenha();" name="frSenhaUsu">
                        </div>
                        <div class="col-sm-6">
                            <label>Confirmar senha</label>
                            <input type="password" class="form-control frUsuConfSenha mb-3" onkeyup="verificaSenha();">
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-sm-12">
                            <label>Permissões</label>
                            <select multiple="multiple" id="selectUsuariosInteligente" class="form-control mb-3" name="frAcessosUsu[]" required>
                                <!-- Separador de Grupos -->
                                <optgroup label="Hospedagens" class="gpHospedagens">
                                    <option <?php echo permitido("s_hospedagens_inscricoes",$permissoes); ?> value="s_hospedagens_inscricoes">Inscricoes</option>
                                    <option <?php echo permitido("s_hospedagens_configuracoes",$permissoes); ?> value="s_hospedagens_configuracoes">Configurações</option>
                                </optgroup>

                                <!-- Separador de Grupos -->
                                <optgroup label="Configurações" class="gpConfiguracoes">
                                    <option <?php echo permitido("s_cadastrar_usuarios",$permissoes); ?> value="s_cadastrar_usuarios">Cadastrar usuários</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>
                                        
                    <br>
                    <button type="submit" onclick="return alterarSenha();" class="btn btn-success">Atualizar</button>
                    <a href="/usuarios" class="btn btn-danger">Cancelar</a>
                </form>

            <?php else: ?>
          
                <table class="table tabelaInteligente">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>E-mail</th>
                            <th>Status</th>
                            <th style="width: 100px;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                            foreach($usuarios as $usuariosL){
                                if($usuariosL['idusuarios'] != 1):
                        ?>
                        <tr>
                            <td><?php echo $usuariosL['usu_nome']; ?></td>
                            <td><?php echo $usuariosL['usu_email']; ?></td>
                            <td><?php echo $usuariosL['usu_status']; ?></td>
                            <td>
                            <a href="/usuarios/editar/<?php echo $usuariosL['idusuarios']; ?>" class="btn btn-xs btn-warning">Editar</a>
                            <a href="/usuarios/excluir/<?php echo $usuariosL['idusuarios']; ?>" onclick="return confirm('Deseja realmente excluir esse usuário?')" class="btn btn-xs btn-danger">Excluir</a>
                            </td>
                        </tr>
                        <?php
                                endif;
                            }
                        ?>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td><input type="text" class="form-control"></td>
                            <td><input type="text" class="form-control"></td>
                            <td><input type="text" class="form-control"></td>
                            <td><input type="text" class="form-control"></td>
                        </tr>
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

    <script src="lib/lou-multi-select/js/jquery.multi-select.js"></script>
    <script src="lib/quicksearch-master/jquery.quicksearch.js"></script>

    <script src="lib/script.js"></script>

    <script>
    $(function () {
      tabela = $('.tabelaInteligente').DataTable({
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
              }/*,
              {
                  extend: 'colvis',
                  className: 'btn btn-default',
                  text: 'Colunas visí­veis'
              }*/
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
    function marcarTodos(){
        $('#selectUsuariosInteligente').multiSelect('select_all');
    }
    function desmarcarTodos(){
        $('#selectUsuariosInteligente').multiSelect('deselect_all');
    }
    $(document).ready(function(){
        $('#selectUsuariosInteligente').multiSelect({
            selectableHeader: "<label>Sem permissão</label><div class=\"input-group\"><input type=\"text\" class=\"form-control search-input\" autocomplete='off' placeholder=\"Buscar\"><span class=\"input-group-btn\"><button onclick=\"marcarTodos();\" class=\"btn btn-default\" type=\"button\">Marcar todos</button></span></div><br />",
            selectionHeader: "<label>Com permissão</label><div class=\"input-group\"><input type=\"text\" class=\"form-control search-input\" autocomplete='off' placeholder=\"Buscar\"><span class=\"input-group-btn\"><button onclick=\"desmarcarTodos();\" class=\"btn btn-default\" type=\"button\">Desmarcar todos</button></span></div><br />",
            afterInit: function(ms){
                var that = this,
                    $selectableSearch = that.$selectableUl.prev().prev().children(".search-input"),
                    $selectionSearch = that.$selectionUl.prev().prev().children(".search-input"),
                    selectableSearchString = '#'+that.$container.attr('id')+' .ms-elem-selectable:not(.ms-selected)',
                    selectionSearchString = '#'+that.$container.attr('id')+' .ms-elem-selection.ms-selected';

                that.qs1 = $selectableSearch.quicksearch(selectableSearchString)
                .on('keydown', function(e){
                    if (e.which === 40){
                    that.$selectableUl.focus();
                    return false;
                    }
                });

                that.qs2 = $selectionSearch.quicksearch(selectionSearchString)
                .on('keydown', function(e){
                    if (e.which == 40){
                    that.$selectionUl.focus();
                    return false;
                    }
                });
            },
            afterSelect: function(){
                this.qs1.cache();
                this.qs2.cache();
            },
            afterDeselect: function(){
                this.qs1.cache();
                this.qs2.cache();
            }
        });
    });
  </script>
  <script>
    function alterarSenha(){
        var senhaA = $(".frUsuSenha").val();
        var senhaB = $(".frUsuConfSenha").val();
        if(senhaA != senhaB){
            $(".frUsuSenha, .frUsuConfSenha").css({"border":"red solid 1px"});
            return false;
        }
    }
    function verificaSenha(){
        var senhaA = $(".frUsuSenha").val();
        var senhaB = $(".frUsuConfSenha").val();
        if(senhaA == senhaB){
            $(".frUsuSenha, .frUsuConfSenha").css({"border":"green solid 1px"});
        } else {
            $(".frUsuSenha, .frUsuConfSenha").css({"border":"red solid 1px"});
        }
    }
  </script>
</body>
</html>