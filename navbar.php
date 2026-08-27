<!-- Navbar -->
<nav class="main-header navbar navbar-expand navbar-white navbar-light"> <!-- navbar-dark -->
<!-- Botão de menu lateral -->
<ul class="navbar-nav">
    <li class="nav-item">
    <a class="nav-link" data-widget="pushmenu" href="#"><i class="fas fa-bars"></i></a>
    </li>
</ul>
<ul class="navbar-nav ml-auto">
    <li class="nav-item">
        <?php $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH); ?>
        <a class="nav-link" data-widget="exit" data-slide="true" href="<?php echo $path; ?>/sair" role="button">
            <i class="fas fa-sign-out-alt"></i>
        </a>
    </li>
</ul>
</nav>
<!-- /.navbar -->