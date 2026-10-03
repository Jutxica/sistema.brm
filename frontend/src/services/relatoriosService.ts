import * as XLSX from 'xlsx';
import type {
  ImovelPatrimonio,
  VeiculoPatrimonio,
  BemPatrimonio,
  ContratoPatrimonio,
  ManutencaoPatrimonio,
  ConformidadeItem
} from '../types/patrimonio';

export const relatoriosService = {
  /**
   * Exporta conjunto de dados para arquivo Excel (.xlsx).
   */
  exportarParaExcel(dados: any[], nomeArquivo: string, nomePlanilha: string = 'Patrimônio BRM') {
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, nomePlanilha);
    XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
  },

  /**
   * Exporta conjunto de dados para arquivo CSV estruturado.
   */
  exportarParaCsv(dados: any[], nomeArquivo: string) {
    const ws = XLSX.utils.json_to_sheet(dados);
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nomeArquivo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Exporta Livro de Tombo Oficial da Província (Bens Móveis, Imóveis e Arte Sacra) em Excel.
   */
  exportarLivroDeTomboExcel(imoveis: ImovelPatrimonio[], bens: BemPatrimonio[]) {
    const wb = XLSX.utils.book_new();

    // Planilha 1: Imóveis e Edificações
    const dadosImoveis = imoveis.map(i => ({
      'Denominação': i.nome,
      'Tipo': i.tipo,
      'Comunidade / Obra': i.comunidade_obra || '',
      'Cidade': i.cidade,
      'UF': i.uf,
      'Área Construída (m²)': i.area_construida_m2 || 0,
      'Matrícula RGI': i.numero_matricula || '',
      'Cartório': i.cartorio_registro || '',
      'AVCB Bombeiros': i.avcb_vencimento || 'N/A',
      'Seguro Predial': i.seguro_predial_vencimento || 'N/A',
      'Valor Venal (R$)': i.valor_venal || 0,
      'Status': i.status
    }));
    const wsImoveis = XLSX.utils.json_to_sheet(dadosImoveis);
    XLSX.utils.book_append_sheet(wb, wsImoveis, 'Imóveis Provinciais');

    // Planilha 2: Inventário de Arte Sacra e Bens Tombados
    const dadosBens = bens.map(b => ({
      'Código de Tombo': b.codigo_tombamento,
      'Título / Bem': b.titulo,
      'Categoria': b.categoria,
      'Comunidade Guardiã': b.comunidade_obra,
      'Localização Específica': b.localizacao_especifica || '',
      'Estado Conservação': b.estado_conservacao,
      'Tombamento Histórico': b.tombamento_historico ? 'Sim' : 'Não',
      'Ano Aquisição': b.ano_aquisicao || '',
      'Valor Estimado (R$)': b.valor_estimado || 0,
      'Status': b.status
    }));
    const wsBens = XLSX.utils.json_to_sheet(dadosBens);
    XLSX.utils.book_append_sheet(wb, wsBens, 'Livro de Tombo');

    XLSX.writeFile(wb, `LIVRO_DE_TOMBO_PROVINCIAL_BRM_${new Date().getFullYear()}.xlsx`);
  },

  /**
   * Exporta Relatório de Frota Automotiva em Excel.
   */
  exportarFrotaExcel(veiculos: VeiculoPatrimonio[]) {
    const dados = veiculos.map(v => ({
      'Marca / Modelo': v.marca_modelo,
      'Placa': v.placa,
      'Tipo': v.tipo,
      'Comunidade Atribuída': v.comunidade_obra,
      'Responsável': v.responsavel_nome || '',
      'KM Atual': v.quilometragem_atual,
      'Próxima Revisão (KM)': v.proxima_revisao_km || 'N/A',
      'Data Próx. Revisão': v.proxima_revisao_data || 'N/A',
      'IPVA': v.ipva_pago ? 'Pago' : 'Pendente',
      'Venc. IPVA': v.ipva_vencimento || 'N/A',
      'Seguradora': v.seguro_seguradora || '',
      'Venc. Seguro': v.seguro_vencimento || 'N/A',
      'Status': v.status
    }));
    this.exportarParaExcel(dados, `FROTA_VEICULOS_BRM_${new Date().getFullYear()}`, 'Frota Provincial');
  },

  /**
   * Exporta Relatório da Central de Conformidades e Prazos.
   */
  exportarConformidadesExcel(conformidades: ConformidadeItem[]) {
    const dados = conformidades.map(c => ({
      'Obrigação': c.titulo,
      'Entidade': c.entidade_nome,
      'Comunidade': c.comunidade_obra || '',
      'Data de Vencimento': c.data_vencimento,
      'Dias Restantes': c.dias_restantes,
      'Nível': c.nivel.toUpperCase(),
      'Diagnóstico': c.descricao
    }));
    this.exportarParaExcel(dados, `CONFORMIDADE_E_PRAZOS_BRM_${new Date().toISOString().split('T')[0]}`, 'Prazos e Alertas');
  },

  /**
   * Dispara a impressão oficial do Livro de Tombo com termo canônico.
   */
  imprimirLivroDeTomboCanonica(imoveis: ImovelPatrimonio[], bens: BemPatrimonio[]) {
    const janela = window.open('', '_blank');
    if (!janela) return;

    const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Livro de Tombo Oficial - Província BRM</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          @page { size: A4 portrait; margin: 15mm 15mm 20mm 15mm; }
          body { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: #1c1917; margin: 0; padding: 20px; line-height: 1.4; }
          .header { text-align: center; border-bottom: 2px solid #113240; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-family: 'Cinzel', serif; font-size: 18px; font-weight: 700; color: #113240; letter-spacing: 0.5px; text-transform: uppercase; }
          .subtitle { font-size: 11px; color: #78716c; font-weight: 500; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
          .canonico-box { background: #fbfbfa; border: 1px solid #e7e5e4; padding: 12px; border-radius: 4px; font-style: italic; margin-bottom: 20px; font-size: 10.5px; color: #44403c; }
          h2 { font-family: 'Cinzel', serif; font-size: 13px; color: #113240; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 24px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 20px; font-size: 10px; }
          th { background: #f1f5f9; color: #0f172a; font-weight: 600; text-align: left; padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 9.5px; text-transform: uppercase; }
          td { padding: 5px 8px; border: 1px solid #e2e8f0; vertical-align: top; }
          tr:nth-child(even) { background: #fafaf9; }
          .footer-signatures { margin-top: 40px; display: flex; justify-content: space-around; text-align: center; page-break-inside: avoid; }
          .sig-line { width: 220px; border-top: 1px solid #1c1917; padding-top: 4px; font-size: 10px; font-weight: 600; }
          .sig-title { font-size: 9px; color: #78716c; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Congregação dos Padres do Sagrado Coração de Jesus</div>
          <div class="subtitle">Província Brasil Meridional · Livro de Tombo e Patrimônio Provincial</div>
        </div>

        <div class="canonico-box">
          <strong>Termo Canônico de Registro e Veracidade:</strong> Em observância às normas do Direito Canônico Universal (Cân. 1283 §2) e dos Estatutos Provinciais Dehonianos, certifica-se que os bens e edificações abaixo arrolados constituem patrimônio estável e jurídico da Província Brasil Meridional, sob a guarda e zelação de seus respectivos superiores e ecônomos locais.
        </div>

        <h2>I. Registro de Imóveis, Casas de Formação e Terrenos</h2>
        <table>
          <thead>
            <tr>
              <th>Denominação</th>
              <th>Comunidade / Localidade</th>
              <th>Área Const.</th>
              <th>RGI / Matrícula</th>
              <th>Valor Venal</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            ${imoveis.map(i => `
              <tr>
                <td><strong>${i.nome}</strong><br><span style="color:#78716c">${i.tipo}</span></td>
                <td>${i.cidade}/${i.uf} · ${i.comunidade_obra || 'Curia'}</td>
                <td>${i.area_construida_m2 ? i.area_construida_m2 + ' m²' : 'N/D'}</td>
                <td>${i.numero_matricula || 'Em regularização'}</td>
                <td>R$ ${(i.valor_venal || 0).toLocaleString('pt-BR')}</td>
                <td>${i.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>II. Inventário de Bens Móveis, Arte Sacra e Tombamento</h2>
        <table>
          <thead>
            <tr>
              <th>Tombo</th>
              <th>Denominação do Bem</th>
              <th>Categoria</th>
              <th>Comunidade Guardiã</th>
              <th>Conservação</th>
              <th>Tombamento</th>
            </tr>
          </thead>
          <tbody>
            ${bens.map(b => `
              <tr>
                <td><strong>${b.codigo_tombamento}</strong></td>
                <td><strong>${b.titulo}</strong><br><span style="color:#78716c">${b.descricao_detalhada ? b.descricao_detalhada.slice(0, 70) + '...' : ''}</span></td>
                <td>${b.categoria}</td>
                <td>${b.comunidade_obra}</td>
                <td>${b.estado_conservacao}</td>
                <td>${b.tombamento_historico ? 'Histórico Oficial' : 'Acervo Comum'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer-signatures">
          <div>
            <div class="sig-line">Pe. Superior Provincial, SCJ</div>
            <div class="sig-title">Província Brasil Meridional</div>
          </div>
          <div>
            <div class="sig-line">Pe. Ecônomo Provincial, SCJ</div>
            <div class="sig-title">Curadoria e Administração de Bens</div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-size: 9px; color: #a8a29e;">
          Emitido aos ${dataHoje} através do Sistema Integrado Conventinho BRM.
        </div>
      </body>
      </html>
    `;

    janela.document.write(html);
    janela.document.close();
    janela.focus();
    setTimeout(() => {
      janela.print();
    }, 400);
  }
};
