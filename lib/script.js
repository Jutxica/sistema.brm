$(document).on('click', '[data-widget="pushmenu"]', function() {
    // Usamos um pequeno timeout para garantir que o AdminLTE já tenha alterado a classe do body
    setTimeout(function() {
        // Verifica se o body tem a classe de menu fechado
        const menuFechado = $('body').hasClass('sidebar-collapse') ? 'sidebar-collapse' : '';

        // Envia para o seu arquivo PHP via AJAX
        $.ajax({
            url: 'ajax/atualizar_preferencias.php', // Nome do seu arquivo PHP
            method: 'POST',
            data: { 
                sidebar_state: menuFechado
            },
            success: function(response) {
                
            }
        });
    }, 300); 
});