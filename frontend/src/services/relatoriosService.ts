import * as XLSX from 'xlsx';
import type {
  ImovelPatrimonio,
  VeiculoPatrimonio,
  BemPatrimonio,
  ContratoPatrimonio,
  ManutencaoPatrimonio,
  ConformidadeItem
} from '../types/patrimonio';

import { gerarHtmlTimbradoBRM, type OrientacaoDocumento } from '../components/PapelTimbradoBRM';

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
   * Dispara a impressão oficial do Livro de Tombo com termo canônico
   * estritamente padronizado no Papel Timbrado BRM (horizontal ou vertical).
   */
  imprimirLivroDeTomboCanonica(
    imoveis: ImovelPatrimonio[], 
    bens: BemPatrimonio[], 
    orientacao: OrientacaoDocumento = 'horizontal'
  ) {
    const janela = window.open('', '_blank');
    if (!janela) return;

    const conteudoHtml = `
      <div class="canonico-box">
        <strong>Termo Canônico de Registro e Veracidade:</strong> Em observância às normas do Direito Canônico Universal (Cân. 1283 §2) e dos Estatutos Provinciais Dehonianos, certifica-se que os bens e edificações abaixo arrolados constituem patrimônio estável e jurídico da Província Brasil Meridional, sob a guarda e zelação de seus respectivos superiores e ecônomos locais.
      </div>

      <h3 style="font-family:'Cormorant Garamond', Georgia, serif; font-size: 13pt; color: #113240; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 18px; text-transform: uppercase;">
        I. Registro de Imóveis, Casas de Formação e Terrenos Provinciais
      </h3>
      <table>
        <thead>
          <tr>
            <th style="width: 28%;">Denominação</th>
            <th style="width: 25%;">Comunidade / Localidade</th>
            <th style="width: 12%;">Área Const.</th>
            <th style="width: 17%;">RGI / Matrícula</th>
            <th style="width: 10%;">Valor Venal</th>
            <th style="width: 8%;">Situação</th>
          </tr>
        </thead>
        <tbody>
          ${imoveis.map(i => `
            <tr>
              <td><strong>${i.nome}</strong><br><span style="color:#78716c; font-size: 8.5pt;">${i.tipo}</span></td>
              <td>${i.cidade}/${i.uf} · ${i.comunidade_obra || 'Curia Provincial'}</td>
              <td>${i.area_construida_m2 ? i.area_construida_m2.toLocaleString('pt-BR') + ' m²' : 'N/D'}</td>
              <td>${i.numero_matricula || 'Em regularização'}</td>
              <td>R$ ${(i.valor_venal || 0).toLocaleString('pt-BR')}</td>
              <td>${i.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3 style="font-family:'Cormorant Garamond', Georgia, serif; font-size: 13pt; color: #113240; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 24px; text-transform: uppercase;">
        II. Inventário Canônico de Bens Móveis, Arte Sacra e Acervo Histórico
      </h3>
      <table>
        <thead>
          <tr>
            <th style="width: 12%;">Tombo</th>
            <th style="width: 32%;">Denominação do Bem</th>
            <th style="width: 18%;">Categoria</th>
            <th style="width: 20%;">Comunidade Guardiã</th>
            <th style="width: 10%;">Conservação</th>
            <th style="width: 8%;">Tombamento</th>
          </tr>
        </thead>
        <tbody>
          ${bens.map(b => `
            <tr>
              <td><strong>${b.codigo_tombamento}</strong></td>
              <td><strong>${b.titulo}</strong><br><span style="color:#78716c; font-size: 8.5pt;">${b.descricao_detalhada ? b.descricao_detalhada.slice(0, 90) + '...' : ''}</span></td>
              <td>${b.categoria}</td>
              <td>${b.comunidade_obra}</td>
              <td>${b.estado_conservacao}</td>
              <td>${b.tombamento_historico ? 'Histórico Oficial' : 'Acervo Comum'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const html = gerarHtmlTimbradoBRM({
      titulo: 'Livro de Tombo & Patrimônio Provincial',
      subtitulo: 'Instrumento Oficial de Governança Patrimonial e Canônica',
      orgao: 'Curadoria Provincial de Bens Culturais & Economato Provincial',
      orientacao,
      conteudoHtml,
      assinaturas: [
        {
          cargo: 'Pe. Superior Provincial, SCJ',
          detalhe: 'Província Brasil Meridional'
        },
        {
          cargo: 'Pe. Ecônomo Provincial, SCJ',
          detalhe: 'Curadoria e Administração de Bens'
        }
      ]
    });

    janela.document.write(html);
    janela.document.close();
    janela.focus();
    setTimeout(() => {
      janela.print();
    }, 450);
  }
};
