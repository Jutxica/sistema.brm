<?php
    $uri = $_SERVER['REQUEST_URI'];
    $segments = explode('/', trim($uri, '/'));
    $page = $segments[0];
?>

<!-- Menu lateral -->
<aside class="main-sidebar sidebar-light-custom elevation-4">
<!-- Logo -->
<a href="index.html" class="brand-link logo-switch">
    <img src="img/logo-pequeno.png" class="brand-image-xl logo-xs" alt="Logo Sistema BRM">
    <img src="img/logo.png" class="brand-image-xs logo-xl" alt="Logo Sistema BRM">
</a>

<!-- Sidebar -->
<div class="sidebar"> <!-- sidebar-dark-primary -->
    <!-- Menu -->
    <nav class="mt-2">
    <ul class="nav nav-pills nav-sidebar flex-column nav-child-indent" data-widget="treeview" role="menu">
        <li class="nav-item">
        <a href="/inicio" class="nav-link <?php echo ($page == 'inicio' ? 'active' : ''); ?>">
            <i class="nav-icon fas fa-home"></i>
            <p>Início</p>
        </a>
        </li>
        <li class="nav-item <?php echo ($page == 'hospedagens-inscricoes' || $page == 'hospedagens-configuracoes' ? 'menu-is-opening menu-open' : ''); ?>">
            <a href="#" class="nav-link <?php echo ($page == 'hospedagens-inscricoes' || $page == 'hospedagens-configuracoes' ? 'active' : ''); ?>">
                <i class="nav-icon fas fa-building"></i>
                <p>
                    Hospedagens
                    <i class="right fas fa-angle-left"></i>
                </p>
            </a>
            <ul class="nav nav-treeview">
                <li class="nav-item">
                    <a href="/hospedagens-inscricoes" class="nav-link <?php echo ($page == 'hospedagens-inscricoes' ? 'active' : ''); ?>">
                        <i class="far fa-circle nav-icon"></i>
                        <p>Inscrições</p>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="/hospedagens-configuracoes" class="nav-link <?php echo ($page == 'hospedagens-configuracoes' ? 'active' : ''); ?>">
                        <i class="far fa-circle nav-icon"></i>
                        <p>Configurações</p>
                    </a>
                </li>
            </ul>
        </li>
        <!-- Estilo para o efeito de passar o mouse -->
<style>
    .nav-analytics { color: #666 !important; transition: 0.3s; }
    .nav-analytics i { color: #888 !important; }
    .nav-analytics:hover { background-color: #8B0000 !important; color: #fff !important; border-radius: 4px; }
    .nav-analytics:hover i { color: #fff !important; }
</style>

<li class="nav-item">
    <a href="/analise?brand=brm" class="nav-link nav-analytics">
        <i class="nav-icon fas fa-chart-line"></i>
        <p>Comunicação</p>
    </a>
</li>

        <li class="nav-item <?php echo ($page == 'usuarios' ? 'menu-is-opening menu-open' : ''); ?>">
        <a href="#" class="nav-link <?php echo ($page == 'usuarios' ? 'active' : ''); ?>">
            <i class="fas fa-cogs"></i>
            <p>
                Configurações
                <i class="right fas fa-angle-left"></i>
            </p>
        </a>
        <ul class="nav nav-treeview">
            <li class="nav-item">
                <a href="/usuarios" class="nav-link <?php echo ($page == 'usuarios' ? 'active' : ''); ?>">
                <i class="far fa-circle nav-icon"></i>
                <p>Usuários</p>
                </a>
            </li>
        </ul>
        </li>
    </ul>
    </nav>
</div>
<!-- /.sidebar -->
</aside>