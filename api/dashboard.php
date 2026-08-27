<?php

require_once __DIR__ . '/api_helper.php';

use App\classes\Conexao;

// Verify authorization
$user = require_auth();

$db = (new Conexao())->conectar();

try {
    // 1. Total registrations
    $stmt = $db->query("SELECT COUNT(*) FROM hospedagens");
    $totalInscricoes = (int)$stmt->fetchColumn();

    // 2. Pending Check-ins
    $stmt = $db->query("SELECT COUNT(*) FROM hospedagens WHERE hos_checkin IS NULL OR hos_checkin = ''");
    $checkinsPendentes = (int)$stmt->fetchColumn();

    // 3. Pending Check-outs (Checked-in but not Checked-out)
    $stmt = $db->query("SELECT COUNT(*) FROM hospedagens WHERE (hos_checkin IS NOT NULL AND hos_checkin <> '') AND (hos_checkout IS NULL OR hos_checkout = '')");
    $checkoutsPendentes = (int)$stmt->fetchColumn();

    // 4. Occupied Rooms (Checked-in, not Checked-out, room assigned)
    $stmt = $db->query("SELECT COUNT(DISTINCT hos_quarto) FROM hospedagens WHERE (hos_checkin IS NOT NULL AND hos_checkin <> '') AND (hos_checkout IS NULL OR hos_checkout = '') AND hos_quarto IS NOT NULL AND hos_quarto <> '0'");
    $quartosOcupados = (int)$stmt->fetchColumn();

    // 5. Recent/Upcoming arrivals
    $stmt = $db->query("SELECT h.idhospedagens, h.hos_nome, h.hos_cidade, h.hos_estado, h.hos_previsaochegada, h.hos_status, m.main_motivo 
                        FROM hospedagens h 
                        LEFT JOIN mainhospedagem m ON h.hos_estadiamotivo = m.idmainhospedagem 
                        ORDER BY h.hos_previsaochegada ASC 
                        LIMIT 5");
    $recentesRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $recentes = [];
    foreach ($recentesRaw as $row) {
        $recentes[] = [
            'id' => $row['idhospedagens'],
            'nome' => $row['hos_nome'],
            'cidade' => $row['hos_cidade'] . ' - ' . $row['hos_estado'],
            'curso' => $row['main_motivo'] ?? 'Outro',
            'chegada' => $row['hos_previsaochegada'],
            'status' => $row['hos_status'] === '0' || empty($row['hos_status']) ? 'Pendente' : $row['hos_status'] // placeholder if raw status ID
        ];
    }

    send_json([
        'totalInscricoes' => $totalInscricoes,
        'checkinsPendentes' => $checkinsPendentes,
        'checkoutsPendentes' => $checkoutsPendentes,
        'quartosOcupados' => $quartosOcupados,
        'recentes' => $recentes
    ]);

} catch (PDOException $e) {
    send_json(['success' => false, 'message' => 'Erro no banco de dados: ' . $e->getMessage()], 500);
}
