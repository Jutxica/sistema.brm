import type {
  ImovelPatrimonio,
  VeiculoPatrimonio,
  BemPatrimonio,
  ContratoPatrimonio,
  ManutencaoPatrimonio,
  PatrimonioDashboardMetrics,
  ConformidadeItem,
  PatrimonioTimelineEvent,
  NivelConformidade
} from '../types/patrimonio';
import { imoveisService } from './imoveisService';
import { veiculosService } from './veiculosService';
import { bensService } from './bensService';
import { contratosService } from './contratosService';
import { manutencoesService } from './manutencoesService';
import { auditoriaService } from './auditoriaService';

export const dashboardService = {
  /**
   * Obtém os dados completos e agregados do dashboard de patrimônio.
   */
  async getPatrimonioDashboard(): Promise<{
    metrics: PatrimonioDashboardMetrics;
    imoveis: ImovelPatrimonio[];
    veiculos: VeiculoPatrimonio[];
    bens: BemPatrimonio[];
    contratos: ContratoPatrimonio[];
    manutencoes: ManutencaoPatrimonio[];
    conformidades: ConformidadeItem[];
  }> {
    const [imoveis, veiculos, bens, contratos, manutencoes] = await Promise.all([
      imoveisService.listar(),
      veiculosService.listar(),
      bensService.listar(),
      contratosService.listar(),
      manutencoesService.listar()
    ]);

    // Agregações de Imóveis
    const valorTotalImoveis = imoveis.reduce((acc, i) => acc + (Number(i.valor_venal) || 0), 0);
    const areaTotalConstruida = imoveis.reduce((acc, i) => acc + (Number(i.area_construida_m2) || 0), 0);

    // Agregações de Veículos
    const veiculosEmUso = veiculos.filter(v => v.status === 'Em Uso').length;
    const veiculosManutencao = veiculos.filter(v => v.status === 'Em Manutenção').length;

    // Agregações de Bens
    const valorTotalBens = bens.reduce((acc, b) => acc + (Number(b.valor_estimado) || 0), 0);
    const bensRestauracao = bens.filter(b => b.status === 'Em Restauração' || b.estado_conservacao?.includes('Restauração')).length;
    const bensTombados = bens.filter(b => b.tombamento_historico).length;

    // Agregações de Contratos
    const contratosVigentes = contratos.filter(c => c.status === 'Vigente').length;
    const contratosAVencer = contratos.filter(c => c.status === 'A Vencer (60 dias)').length;
    const valorTotalMensalContratos = contratos.reduce((acc, c) => acc + (Number(c.valor_mensal) || 0), 0);

    // Agregações de Manutenções
    const manutencoesPendentes = manutencoes.filter(m => m.status === 'Pendente' || m.status?.includes('Análise')).length;
    const manutencoesEmExecucao = manutencoes.filter(m => m.status?.includes('Execução')).length;
    const custoTotalManutencoes = manutencoes.reduce((acc, m) => acc + (Number(m.custo_realizado || m.custo_estimado) || 0), 0);

    // Distribuição por comunidade/obra
    const mapaComunidades: Record<string, { count: number; valor: number }> = {};
    imoveis.forEach(i => {
      const com = i.comunidade_obra || 'Curia Provincial BRM';
      if (!mapaComunidades[com]) mapaComunidades[com] = { count: 0, valor: 0 };
      mapaComunidades[com].count += 1;
      mapaComunidades[com].valor += Number(i.valor_venal) || 0;
    });

    const distribuicaoComunidades = Object.entries(mapaComunidades).map(([comunidade, dados]) => ({
      comunidade,
      count: dados.count,
      valor: dados.valor
    }));

    // Central de Prazos e Conformidades
    const conformidades = this.calcularConformidades(imoveis, veiculos, contratos);
    const alertasCriticos = conformidades.filter(c => c.nivel === 'critico').length;
    const alertasAtencao = conformidades.filter(c => c.nivel === 'urgente' || c.nivel === 'atencao').length;

    const metrics: PatrimonioDashboardMetrics = {
      totalImoveis: imoveis.length,
      valorTotalImoveis,
      areaTotalConstruida,
      totalVeiculos: veiculos.length,
      veiculosEmUso,
      veiculosManutencao,
      totalBens: bens.length,
      valorTotalBens,
      bensRestauracao,
      bensTombados,
      totalContratos: contratos.length,
      contratosVigentes,
      contratosAVencer,
      valorTotalMensalContratos,
      totalManutencoes: manutencoes.length,
      manutencoesPendentes,
      manutencoesEmExecucao,
      custoTotalManutencoes,
      valorTotalPatrimonial: valorTotalImoveis + valorTotalBens,
      alertasCriticos,
      alertasAtencao,
      distribuicaoComunidades
    };

    return {
      metrics,
      imoveis,
      veiculos,
      bens,
      contratos,
      manutencoes,
      conformidades
    };
  },

  /**
   * Avalia todos os prazos das entidades patrimoniais e gera os itens do semáforo de conformidade.
   */
  calcularConformidades(
    imoveis: ImovelPatrimonio[],
    veiculos: VeiculoPatrimonio[],
    contratos: ContratoPatrimonio[]
  ): ConformidadeItem[] {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const itens: ConformidadeItem[] = [];

    const calcularDiferencaDias = (dataStr: string): number => {
      const [ano, mes, dia] = dataStr.split('T')[0].split('-').map(Number);
      const dataAlvo = new Date(ano, mes - 1, dia);
      const diffMs = dataAlvo.getTime() - hoje.getTime();
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    };

    const determinarNivel = (dias: number): NivelConformidade => {
      if (dias < 0) return 'critico'; // 🔴 Vencido
      if (dias <= 30) return 'urgente'; // 🟠 Vence em até 30 dias
      if (dias <= 60) return 'atencao'; // 🟡 Vence em até 60 dias
      return 'regular'; // 🟢 Regular
    };

    // 1. AVCB dos Imóveis
    imoveis.forEach(imovel => {
      if (imovel.avcb_vencimento) {
        const dias = calcularDiferencaDias(imovel.avcb_vencimento);
        const nivel = determinarNivel(dias);
        if (nivel !== 'regular') {
          itens.push({
            id: `avcb-${imovel.id}`,
            tipo: 'avcb',
            titulo: `Alvará Bombeiros (AVCB) - ${imovel.nome}`,
            entidade_tipo: 'imovel',
            entidade_id: imovel.id,
            entidade_nome: imovel.nome,
            comunidade_obra: imovel.comunidade_obra,
            data_vencimento: imovel.avcb_vencimento,
            dias_restantes: dias,
            nivel,
            descricao: dias < 0 
              ? `Vencido há ${Math.abs(dias)} dias (${imovel.avcb_numero || 'S/N'}). Requer renovação com urgência.`
              : `Vence em ${dias} dias (${imovel.avcb_numero || 'S/N'}). Agendar vistoria técnica.`
          });
        }
      }

      // Seguro Predial dos Imóveis
      if (imovel.seguro_predial_vencimento) {
        const dias = calcularDiferencaDias(imovel.seguro_predial_vencimento);
        const nivel = determinarNivel(dias);
        if (nivel !== 'regular') {
          itens.push({
            id: `seguro-predial-${imovel.id}`,
            tipo: 'seguro_predial',
            titulo: `Seguro Predial - ${imovel.nome}`,
            entidade_tipo: 'imovel',
            entidade_id: imovel.id,
            entidade_nome: imovel.nome,
            comunidade_obra: imovel.comunidade_obra,
            data_vencimento: imovel.seguro_predial_vencimento,
            dias_restantes: dias,
            nivel,
            descricao: dias < 0 
              ? `Apólice vencida há ${Math.abs(dias)} dias (${imovel.seguro_predial_seguradora || 'Seguradora'}). Edificação desprotegida.`
              : `Apólice vence em ${dias} dias (${imovel.seguro_predial_seguradora || 'Seguradora'}). Renovar com corretora provincial.`
          });
        }
      }
    });

    // 2. Veículos: IPVA, Seguro e Revisão
    veiculos.forEach(veic => {
      if (veic.ipva_vencimento && !veic.ipva_pago) {
        const dias = calcularDiferencaDias(veic.ipva_vencimento);
        const nivel = determinarNivel(dias);
        if (nivel !== 'regular') {
          itens.push({
            id: `ipva-${veic.id}`,
            tipo: 'ipva',
            titulo: `Licenciamento & IPVA - ${veic.marca_modelo} (${veic.placa})`,
            entidade_tipo: 'veiculo',
            entidade_id: veic.id,
            entidade_nome: `${veic.marca_modelo} (${veic.placa})`,
            comunidade_obra: veic.comunidade_obra,
            data_vencimento: veic.ipva_vencimento,
            dias_restantes: dias,
            nivel,
            descricao: dias < 0 
              ? `IPVA em atraso há ${Math.abs(dias)} dias. Risco de apreensão em blitz de trânsito.`
              : `Vencimento do IPVA em ${dias} dias. Providenciar pagamento do DPVAT/Taxa.`
          });
        }
      }

      if (veic.seguro_vencimento) {
        const dias = calcularDiferencaDias(veic.seguro_vencimento);
        const nivel = determinarNivel(dias);
        if (nivel !== 'regular') {
          itens.push({
            id: `seguro-veic-${veic.id}`,
            tipo: 'seguro_veiculo',
            titulo: `Seguro Automotivo - ${veic.marca_modelo} (${veic.placa})`,
            entidade_tipo: 'veiculo',
            entidade_id: veic.id,
            entidade_nome: `${veic.marca_modelo} (${veic.placa})`,
            comunidade_obra: veic.comunidade_obra,
            data_vencimento: veic.seguro_vencimento,
            dias_restantes: dias,
            nivel,
            descricao: dias < 0 
              ? `Seguro vencido há ${Math.abs(dias)} dias. Veículo não deve rodar em estradas.`
              : `Apólice vence em ${dias} dias (${veic.seguro_seguradora || 'Seguradora'}).`
          });
        }
      }

      if (veic.proxima_revisao_data) {
        const dias = calcularDiferencaDias(veic.proxima_revisao_data);
        const nivel = determinarNivel(dias);
        if (nivel !== 'regular') {
          itens.push({
            id: `revisao-${veic.id}`,
            tipo: 'revisao_veiculo',
            titulo: `Revisão Preventiva - ${veic.marca_modelo} (${veic.placa})`,
            entidade_tipo: 'veiculo',
            entidade_id: veic.id,
            entidade_nome: `${veic.marca_modelo} (${veic.placa})`,
            comunidade_obra: veic.comunidade_obra,
            data_vencimento: veic.proxima_revisao_data,
            dias_restantes: dias,
            nivel,
            descricao: dias < 0 
              ? `Revisão preventiva ultrapassada há ${Math.abs(dias)} dias. KM Atual: ${veic.quilometragem_atual} km.`
              : `Agendamento previsto em ${dias} dias. Meta: ${veic.proxima_revisao_km || 'conforme manual'} km.`
          });
        }
      }
    });

    // 3. Contratos a Vencer
    contratos.forEach(contrato => {
      if (contrato.data_fim) {
        const dias = calcularDiferencaDias(contrato.data_fim);
        const nivel = determinarNivel(dias);
        if (nivel !== 'regular') {
          itens.push({
            id: `contrato-${contrato.id}`,
            tipo: 'contrato',
            titulo: `Vigência Contratual - ${contrato.titulo}`,
            entidade_tipo: 'contrato',
            entidade_id: contrato.id,
            entidade_nome: contrato.titulo,
            comunidade_obra: contrato.fornecedor_prestador,
            data_vencimento: contrato.data_fim,
            dias_restantes: dias,
            nivel,
            descricao: dias < 0 
              ? `Contrato encerrado há ${Math.abs(dias)} dias. Avaliar termo aditivo ou renovação.`
              : `Contrato encerra em ${dias} dias (${contrato.fornecedor_prestador}).`
          });
        }
      }
    });

    // Ordenar do mais urgente/crítico para o mais distante
    return itens.sort((a, b) => a.dias_restantes - b.dias_restantes);
  },

  /**
   * Constrói a linha do tempo cronológica institucional de um ativo específico.
   */
  async obterTimelinePatrimonio(
    entidadeTipo: 'imovel' | 'veiculo' | 'bem',
    entidadeId: string
  ): Promise<PatrimonioTimelineEvent[]> {
    const eventos: PatrimonioTimelineEvent[] = [];

    // 1. Manutenções vinculadas
    const manutencoes = await manutencoesService.listar();
    const manutencoesDoAtivo = manutencoes.filter(m => m.imovel_nome?.includes(entidadeId) || m.id === entidadeId);
    manutencoesDoAtivo.forEach(m => {
      eventos.push({
        id: `manut-${m.id}`,
        data: m.data_conclusao || m.data_solicitacao,
        tipo: 'manutencao',
        titulo: m.titulo,
        descricao: `${m.tipo} - Status: ${m.status}. Custo: R$ ${(m.custo_realizado || m.custo_estimado || 0).toLocaleString('pt-BR')}`,
        autor: m.prestador_executante || m.responsavel_vistoria
      });
    });

    // 2. Logs de Auditoria
    const logs = await auditoriaService.listarAuditoria({
      entity_id: entidadeId,
      limite: 20
    });

    logs.forEach(l => {
      eventos.push({
        id: `audit-${l.id}`,
        data: l.created_at,
        tipo: 'auditoria',
        titulo: `${l.action === 'INSERT' ? 'Cadastro do Ativo' : l.action === 'UPDATE' ? 'Atualização Cadastral' : 'Operação'} no Livro Provincial`,
        descricao: l.action === 'INSERT' ? 'Registro inicial incorporado ao acervo provincial BRM.' : 'Dados ou anexos atualizados na curadoria patrimonial.',
        autor: l.user_nome || l.user_email
      });
    });

    return eventos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }
};
