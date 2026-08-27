<?php session_start();
    
    require_once 'config.php';

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
        
        

      </div>
    </section>

    <section class="content">
      <div class="container-fluid">
        <p>Este é o conteúdo inicial da sua página.</p>
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
<script src="vendor/almasaeed2010/adminlte/plugins/bootstrap/js/bootstrap.bundle.min.js"></script>
<script src="vendor/almasaeed2010/adminlte/dist/js/adminlte.min.js"></script>

<script src="lib/script.js"></script>
</body>
</html>