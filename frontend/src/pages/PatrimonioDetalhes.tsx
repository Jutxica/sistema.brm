import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Edit3, Building2, Car, Package, 
  ShieldCheck, Wrench, MapPin, Calendar, CheckCircle2, 
  AlertTriangle, FileText, Download, Eye, Plus, Shield,
  Share2, ExternalLink, HardDrive, Clock, RotateCw
} from 'lucide-react';
import { showToast } from '../hooks/useFeedback';
import { downloadArquivo } from '../lib/downloadHelper';
import { PatrimonioAnexosManager } from '../components/PatrimonioAnexosManager';
import { CabecalhoTimbradoBRM, RodapeTimbradoBRM, type OrientacaoDocumento } from '../components/PapelTimbradoBRM';
import { 
  imoveisService, 
  veiculosService, 
  bensService, 
  contratosService, 
  manutencoesService, 
  dashboardService 
} from '../services/patrimonioService';
import { 
  getPatrimonioLocal,
  type TipoPatrimonio, 
  type ImovelPatrimonio, 
  type VeiculoPatrimonio, 
  type BemPatrimonio, 
  type ContratoPatrimonio, 
  type ManutencaoPatrimonio,
  type PatrimonioAnexo,
  type PatrimonioTimelineEvent
} from '../types/patrimonio';

export const PatrimonioDetalhes: React.FC = () => {
  const { tipo: rawTipo, id } = useParams<{ tipo: string; id: string }>();
  const navigate = useNavigate();

  const tipo: TipoPatrimonio = (
    rawTipo === 'veiculo' ? 'veiculo' :
    rawTipo === 'bem' ? 'bem' :
    rawTipo === 'contrato' ? 'contrato' :
    rawTipo === 'vistoria' || rawTipo === 'manutencao' ? 'vistoria' : 'imovel'
  );

  const localInicial = useMemo(() => {
    if (!id) return null;
    const local = getPatrimonioLocal();
    if (tipo === 'imovel') return local.imoveis?.find((i: ImovelPatrimonio) => i.id === id) || null;
    if (tipo === 'veiculo') return local.veiculos?.find((v: VeiculoPatrimonio) => v.id === id) || null;
    if (tipo === 'bem') return local.bens?.find((b: BemPatrimonio) => b.id === id) || null;
    if (tipo === 'contrato') return local.contratos?.find((c: ContratoPatrimonio) => c.id === id) || null;
    if (tipo === 'vistoria') return local.manutencoes?.find((m: ManutencaoPatrimonio) => m.id === id) || null;
    return null;
  }, [id, tipo]);

  const [item, setItem] = useState<any>(() => localInicial);
  const [anexos, setAnexos] = useState<PatrimonioAnexo[]>(() => localInicial?.anexos || []);
  const [timeline, setTimeline] = useState<PatrimonioTimelineEvent[]>([]);
  const [loading, setLoading] = useState(() => !localInicial);
  const [orientacao, setOrientacao] = useState<OrientacaoDocumento>('vertical');

  // Carrega o registro através da camada de serviços
  useEffect(() => {
    const carregarItem = async () => {
      if (!id) return;
      if (!item) setLoading(true);

      let encontrado: any = null;

      try {
        if (tipo === 'imovel') encontrado = await imoveisService.obterPorId(id);
        else if (tipo === 'veiculo') encontrado = await veiculosService.obterPorId(id);
        else if (tipo === 'bem') encontrado = await bensService.obterPorId(id);
        else if (tipo === 'contrato') encontrado = await contratosService.obterPorId(id);
        else if (tipo === 'vistoria') encontrado = await manutencoesService.obterPorId(id);
      } catch (err) {
        console.warn('Erro ao consultar serviço de patrimônio:', err);
      }

      if (encontrado) {
        setItem(encontrado);
        setAnexos(encontrado.anexos || []);

        // Carrega histórico e timeline institucional
        try {
          const eventos = await dashboardService.obterTimelinePatrimonio(tipo as any, id);
          setTimeline(eventos);
        } catch (_) {}
      } else {
        showToast.error('Registro não encontrado no livro provincial.', 'Não Encontrado');
      }
      setLoading(false);
    };

    carregarItem();
  }, [id, tipo]);

  // Atualiza anexos tanto no estado quanto através do serviço especializado
  const handleAtualizarAnexos = async (novosAnexos: PatrimonioAnexo[]) => {
    setAnexos(novosAnexos);
    if (!item) return;

    const itemAtualizado = { ...item, anexos: novosAnexos };
    setItem(itemAtualizado);

    try {
      if (tipo === 'imovel') await imoveisService.salvar(itemAtualizado);
      else if (tipo === 'veiculo') await veiculosService.salvar(itemAtualizado);
      else if (tipo === 'bem') await bensService.salvar(itemAtualizado);
      else if (tipo === 'contrato') await contratosService.salvar(itemAtualizado);
      else if (tipo === 'vistoria') await manutencoesService.salvar(itemAtualizado);
    } catch (err) {
      console.warn('Erro ao atualizar anexos via serviço:', err);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const voltarParaAba = () => {
    const tab = 
      tipo === 'imovel' ? 'imoveis' :
      tipo === 'veiculo' ? 'veiculos' :
      tipo === 'bem' ? 'inventario' :
      tipo === 'contrato' ? 'contratos' : 'manutencoes';
    navigate(`/patrimonio?tab=${tab}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-8 h-8 rounded-full border-2 border-[#113240]/20 border-t-[#113240] animate-spin mb-3" />
        <span className="text-xs font-medium">Carregando ficha patrimonial...</span>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-[#9E6B28] dark:text-[#F2C894] mx-auto" />
        <h2 className="text-lg font-cinzel font-bold text-[#113240] dark:text-white">Registro não localizado</h2>
        <p className="text-xs text-slate-500">
          O bem solicitado não foi encontrado nos cadastros provinciais ou foi removido.
        </p>
        <button
          type="button"
          onClick={() => navigate('/patrimonio')}
          className="px-4 py-2 bg-[#113240] text-white text-xs font-semibold rounded-[6px] hover:bg-[#226380] transition-colors cursor-pointer"
        >
          Retornar ao Painel de Patrimônio
        </button>
      </div>
    );
  }

  // Título e Ícone do tipo
  const tituloPagina = 
    tipo === 'imovel' ? (item as ImovelPatrimonio).nome :
    tipo === 'veiculo' ? `${(item as VeiculoPatrimonio).marca_modelo} (${(item as VeiculoPatrimonio).placa})` :
    tipo === 'bem' ? (item as BemPatrimonio).titulo :
    tipo === 'contrato' ? (item as ContratoPatrimonio).titulo :
    (item as ManutencaoPatrimonio).titulo;

  const subtitulo = 
    tipo === 'imovel' ? `${(item as ImovelPatrimonio).tipo} · ${(item as ImovelPatrimonio).cidade}/${(item as ImovelPatrimonio).uf}` :
    tipo === 'veiculo' ? `Placa: ${(item as VeiculoPatrimonio).placa} · Alocado em ${(item as VeiculoPatrimonio).comunidade_obra}` :
    tipo === 'bem' ? `Tombo: ${(item as BemPatrimonio).codigo_tombamento} · ${(item as BemPatrimonio).categoria}` :
    tipo === 'contrato' ? `${(item as ContratoPatrimonio).fornecedor_prestador} · Vigência até ${(item as ContratoPatrimonio).data_fim}` :
    `Prioridade ${(item as ManutencaoPatrimonio).prioridade} · ${(item as ManutencaoPatrimonio).comunidade_obra}`;

  const IconeTipo = 
    tipo === 'imovel' ? Building2 :
    tipo === 'veiculo' ? Car :
    tipo === 'bem' ? Package :
    tipo === 'contrato' ? ShieldCheck : Wrench;

  return (
    <div className="space-y-6 pb-16 animate-fade-in max-w-5xl mx-auto font-sans">
      {/* Estilo Dinâmico de Impressão (Retrato / Paisagem) */}
      <style>{`
        @media print {
          @page {
            size: A4 ${orientacao};
            margin: ${orientacao === 'horizontal' ? '12mm 15mm' : '15mm'};
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* BARRA SUPERIOR DE AÇÕES (Oculta na impressão)                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={voltarParaAba}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Painel</span>
          </button>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Ficha Completa do Ativo Provincial
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Seletor de Orientação para Impressão */}
          <button
            type="button"
            onClick={() => setOrientacao(prev => prev === 'vertical' ? 'horizontal' : 'vertical')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            title="Alternar orientação do documento de impressão (Vertical / Horizontal)"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#226380]" />
            <span>{orientacao === 'vertical' ? 'Retrato (Vertical)' : 'Paisagem (Horizontal)'}</span>
          </button>

          <button
            type="button"
            onClick={handleImprimir}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer motion-press"
          >
            <Printer className="w-3.5 h-3.5 text-[#226380]" />
            <span>Imprimir Ficha Completa</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/patrimonio/editar/${tipo}/${item.id}`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#113240] text-white hover:bg-[#226380] transition-all text-xs font-semibold shadow-sm cursor-pointer motion-press"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar Registro</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISUALIZAÇÃO INTERATIVA DA WEB (Completamente oculta na impressão)        */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[8px] p-6 shadow-xs print:hidden space-y-6">
        
        {/* Hero Card do Ativo */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-[8px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
              <IconeTipo className="w-7 h-7 text-[#226380] dark:text-[#A3C3C7]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {tipo === 'imovel' ? 'Imóvel Provincial' :
                   tipo === 'veiculo' ? 'Veículo da Frota' :
                   tipo === 'bem' ? 'Item de Inventário / Acervo' :
                   tipo === 'contrato' ? 'Contrato / Seguro' : 'Ordem de Vistoria'}
                </span>
                <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#226380]/10 text-[#113240] dark:text-[#A3C3C7] border border-[#226380]/20">
                  {item.status || 'Ativo'}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-cinzel font-bold text-[#113240] dark:text-white leading-snug">
                {tituloPagina}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#226380]" />
                <span>{subtitulo}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 shrink-0">
            {tipo === 'imovel' && item.numero_matricula && (
              <div className="text-left md:text-right">
                <span className="text-[11px] text-slate-400 block">Matrícula / RGI</span>
                <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white">
                  {item.numero_matricula}
                </span>
              </div>
            )}
            {tipo === 'veiculo' && (
              <div className="text-left md:text-right">
                <span className="text-[11px] text-slate-400 block">Placa Oficial</span>
                <span className="text-xs font-mono font-bold text-[#113240] dark:text-[#A3C3C7] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 inline-block">
                  {item.placa}
                </span>
              </div>
            )}
            {tipo === 'bem' && (
              <div className="text-left md:text-right">
                <span className="text-[11px] text-slate-400 block">Código de Tombamento</span>
                <span className="text-xs font-mono font-bold text-[#113240] dark:text-[#A3C3C7] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 inline-block">
                  {item.codigo_tombamento}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* GRID DE DADOS ESPECÍFICOS DO PATRIMÔNIO                                */}
        {/* ===================================================================== */}
        <div className="space-y-6">

          {/* CASO: IMÓVEL */}
          {tipo === 'imovel' && (
            <div className="space-y-6">
              {/* Seção 1: Dados Gerais e Endereço */}
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  1. Localização & Ocupação Canônica
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Comunidade Vinculada</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.comunidade_obra || 'Sede Provincial BRM'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Endereço Completo</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.endereco || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Bairro / CEP</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.bairro || 'Centro'} · {item.cep || 'CEP não cadastrado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Cidade / UF</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.cidade} / {item.uf}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Área Construída</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.area_construida_m2 ? `${item.area_construida_m2.toLocaleString('pt-BR')} m²` : 'Não informada'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Área do Terreno</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.area_terreno_m2 ? `${item.area_terreno_m2.toLocaleString('pt-BR')} m²` : 'Não informada'}</span>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <span className="text-slate-400 block">Destinação / Finalidade</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.destinacao || 'Uso institucional provincial e comunitário.'}</span>
                  </div>
                </div>
              </div>

              {/* Seção 2: Regularização Notarial e Fiscal */}
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  2. Situação Notarial, Cartorial e Fiscal
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Matrícula Imobiliária</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">{item.numero_matricula || 'Pendente'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Cartório de Registro de Imóveis</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.cartorio_registro || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Escritura Pública</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.tem_escritura ? '✓ Lavrada e Regularizada' : '✗ Pendente de Lavratura'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Habite-se Municipal</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.tem_habite_se ? '✓ Expedido pela Prefeitura' : '✗ Pendente de Expedição'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Inscrição Municipal / IPTU</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">{item.inscricao_municipal || 'Imune / Isento'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Avaliação Venal Estimada</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.valor_venal ? `R$ ${item.valor_venal.toLocaleString('pt-BR')}` : 'Não avaliado'}</span>
                  </div>
                </div>
              </div>

              {/* Seção 3: Seguros e AVCB */}
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  3. Segurança Contra Incêndio & Apólice de Seguro
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">AVCB Bombeiros</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.avcb_numero || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Validade do AVCB</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.avcb_vencimento ? new Date(item.avcb_vencimento).toLocaleDateString('pt-BR') : 'Não cadastrado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Seguradora Predial</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.seguro_predial_seguradora || 'Porto Seguro'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Apólice / Vigência</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.seguro_predial_apolice || 'Ativa'} {item.seguro_predial_vencimento ? `(até ${new Date(item.seguro_predial_vencimento).toLocaleDateString('pt-BR')})` : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CASO: VEÍCULO */}
          {tipo === 'veiculo' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  1. Dados Mecânicos & Alocação
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Marca / Modelo</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.marca_modelo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Placa de Identificação</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{item.placa}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Ano de Fabricação / Modelo</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.ano_fabricacao || '-'}/{item.ano_modelo || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Cor / Combustível</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.cor || 'Não informada'} · {item.combustivel || 'Flex'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Comunidade Responsável</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.comunidade_obra}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Condutor / Responsável</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.responsavel_nome || 'Governo Provincial'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Quilometragem Atual</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.quilometragem_atual?.toLocaleString('pt-BR')} km</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Próxima Revisão</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.proxima_revisao_km ? `${item.proxima_revisao_km.toLocaleString('pt-BR')} km` : 'Não agendada'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  2. Documentação & Seguro Automotivo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">IPVA & Licenciamento</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.ipva_pago ? '✓ Quitado e Regular' : '⚠ Pendente de Pagamento'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Seguradora</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.seguro_seguradora || 'Porto Seguro'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Apólice / Vencimento</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.seguro_apolice || 'Ativa'} ({item.seguro_vencimento ? new Date(item.seguro_vencimento).toLocaleDateString('pt-BR') : '-'})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Assistência 24h</span>
                    <span className="font-mono font-medium text-[#226380] dark:text-[#A3C3C7]">{item.seguro_contato_emergencia || '0800 727 0727'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CASO: BEM / ARTE SACRA */}
          {tipo === 'bem' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  1. Descrição & Tombamento Canônico
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Código de Tombamento</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{item.codigo_tombamento}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Categoria do Bem</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.categoria}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Comunidade Guardiã</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.comunidade_obra}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Localização Específica</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.localizacao_especifica || 'Capela / Sede'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Estado de Conservação</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.estado_conservacao}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Ano de Aquisição / Época</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.ano_aquisicao || 'Século XX'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Origem / Procedência</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.origem_procedencia || 'Europa / Brasil'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Valor Estimado de Avaliação</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.valor_estimado ? `R$ ${item.valor_estimado.toLocaleString('pt-BR')}` : 'Valor inestimável / histórico'}</span>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4">
                    <span className="text-slate-400 block">Descrição Detalhada & Características</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.descricao_detalhada || 'Sem notas adicionais.'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CASO: CONTRATO */}
          {tipo === 'contrato' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  1. Dados Contratuais & Partes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Prestador / Fornecedor</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.fornecedor_prestador}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tipo do Contrato</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.tipo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Imóvel / Polo Vinculado</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.imovel_vinculado || 'Geral Provincial'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">CNPJ / CPF</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">{item.cnpj_cpf || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Início da Vigência</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.data_inicio ? new Date(item.data_inicio).toLocaleDateString('pt-BR') : '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Término da Vigência</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.data_fim ? new Date(item.data_fim).toLocaleDateString('pt-BR') : '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Valor Mensal</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.valor_mensal ? `R$ ${item.valor_mensal.toLocaleString('pt-BR')}` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Valor Anual Global</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.valor_anual ? `R$ ${item.valor_anual.toLocaleString('pt-BR')}` : '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CASO: VISTORIA / MANUTENÇÃO */}
          {tipo === 'vistoria' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  1. Dados da Vistoria / Obra
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Imóvel Alvo</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.imovel_nome || item.comunidade_obra}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tipo da Intervenção</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.tipo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Data de Solicitação</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.data_solicitacao ? new Date(item.data_solicitacao).toLocaleDateString('pt-BR') : '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Data Prevista / Conclusão</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.data_conclusao ? new Date(item.data_conclusao).toLocaleDateString('pt-BR') : 'Em andamento'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Responsável Técnico</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.responsavel_vistoria || 'Engenharia Provincial'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Prestador / Empreiteira</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.prestador_executante || 'A Definir'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Custo Estimado</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.custo_estimado ? `R$ ${item.custo_estimado.toLocaleString('pt-BR')}` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Prioridade</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.prioridade}</span>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4">
                    <span className="text-slate-400 block">Escopo da Ordem de Serviço</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.descricao}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* SEÇÃO DE ANEXOS, DOCUMENTOS E FOTOS DIGITAIS                       */}
          {/* =================================================================== */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <PatrimonioAnexosManager
              anexos={anexos}
              onChange={handleAtualizarAnexos}
              tipoPatrimonio={tipo}
            />
          </div>

          {/* =================================================================== */}
          {/* MEMÓRIA & LINHA DO TEMPO INSTITUCIONAL DO ATIVO                    */}
          {/* =================================================================== */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 print:hidden space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#226380] dark:text-[#A3C3C7]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                  Memória & Linha do Tempo Institucional
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                {timeline.length} {timeline.length === 1 ? 'evento registrado' : 'eventos registrados'}
              </span>
            </div>

            {timeline.length === 0 ? (
              <div className="p-4 rounded-[6px] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-500 italic">
                Nenhuma alteração ou vistoria cronológica registrada na trilha até o momento.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {timeline.map((ev) => (
                  <div key={ev.id} className="relative group">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#161b22] bg-[#226380] group-hover:scale-125 transition-transform" />
                    <div className="p-3 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {ev.titulo}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {ev.data ? new Date(ev.data).toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {ev.descricao}
                      </p>
                      {ev.autor && (
                        <span className="text-[10px] text-slate-400 block pt-0.5">
                          Registrado por: {ev.autor}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DOCUMENTO OFICIAL INSTITUCIONAL PARA IMPRESSÃO FÍSICA / CANÔNICA          */}
      {/* Estritamente no Papel Timbrado BRM, com cabeçalho oficial e sem anexos    */}
      {/* ========================================================================= */}
      <div className="hidden print:block w-full max-w-[210mm] mx-auto text-black bg-white select-none">
        {/* Cabeçalho Oficial: Somente Emblema + Congregação + Província */}
        <CabecalhoTimbradoBRM />

        {/* Faixa Notarial de Identificação do Documento */}
        <div className="border-t-2 border-b-2 border-black py-2 my-3 text-center">
          <h2 className="font-timbrado text-[14pt] font-bold uppercase tracking-wider text-black">
            {tipo === 'imovel' ? 'Ficha de Cadastro de Imóvel Provincial' :
             tipo === 'veiculo' ? 'Ficha de Registro e Controle de Veículo da Frota' :
             tipo === 'bem' ? 'Termo de Inventário e Tombo Histórico-Artístico' :
             tipo === 'contrato' ? 'Extrato de Instrumento Contratual e Seguro' :
             'Relatório Técnico de Vistoria e Manutenção'}
          </h2>
          <p className="font-timbrado text-[9.5pt] italic text-slate-700 mt-0.5">
            Livro de Tombo e Arquivo Patrimonial da Província BRM
          </p>
        </div>

        {/* Metadados Notariais de Assento */}
        <div className="flex justify-between items-center text-[8.5pt] font-mono border-b border-slate-300 pb-1.5 mb-3 px-1 text-slate-700">
          <span><strong>Registro / Protocolo:</strong> {item.codigo_tombamento || item.numero_matricula || item.placa || item.id}</span>
          <span><strong>Situação Cadastral:</strong> {item.status || 'Ativo'}</span>
          <span><strong>Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</span>
        </div>

        {/* SEÇÃO I: DADOS GERAIS & VINCULAÇÃO CANÔNICA */}
        <table className="w-full border-collapse border border-black text-[9pt] mb-3">
          <thead>
            <tr className="bg-slate-100 border-b border-black">
              <th colSpan={4} className="p-1.5 text-left font-bold uppercase text-[8pt] tracking-wider text-black">
                I. Identificação Geral & Vinculação Canônica
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-300">
              <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">Denominação Oficial:</td>
              <td className="p-1.5 w-1/4 border-r border-slate-300">{tituloPagina}</td>
              <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">Classificação / Tipo:</td>
              <td className="p-1.5 w-1/4">{item.tipo || item.categoria}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Comunidade / Obra Guardiã:</td>
              <td className="p-1.5 border-r border-slate-300">{item.comunidade_obra || 'Sede Provincial BRM'}</td>
              <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Município / UF:</td>
              <td className="p-1.5">{item.cidade ? `${item.cidade}/${item.uf}` : 'SC'}</td>
            </tr>
            <tr>
              <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Destinação / Finalidade:</td>
              <td colSpan={3} className="p-1.5">{item.destinacao || item.descricao_detalhada || item.descricao || 'Uso institucional provincial e comunitário.'}</td>
            </tr>
          </tbody>
        </table>

        {/* SEÇÃO II: ESPECIFICAÇÕES TÉCNICAS E CARACTERÍSTICAS FÍSICAS */}
        {tipo === 'imovel' && (
          <table className="w-full border-collapse border border-black text-[9pt] mb-3">
            <thead>
              <tr className="bg-slate-100 border-b border-black">
                <th colSpan={4} className="p-1.5 text-left font-bold uppercase text-[8pt] tracking-wider text-black">
                  II. Especificações Imobiliárias, Áreas e Localização
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">Endereço Completo:</td>
                <td className="p-1.5 w-1/4 border-r border-slate-300">{item.endereco || 'Não informado'}</td>
                <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">Bairro / CEP:</td>
                <td className="p-1.5 w-1/4">{item.bairro || 'Centro'} · {item.cep || '-'}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Área Construída:</td>
                <td className="p-1.5 border-r border-slate-300">{item.area_construida_m2 ? `${item.area_construida_m2.toLocaleString('pt-BR')} m²` : 'Não informada'}</td>
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Área do Terreno:</td>
                <td className="p-1.5">{item.area_terreno_m2 ? `${item.area_terreno_m2.toLocaleString('pt-BR')} m²` : 'Não informada'}</td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Inscrição Municipal (IPTU):</td>
                <td className="p-1.5 border-r border-slate-300">{item.inscricao_municipal || 'Imune / Isento'}</td>
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Valor Venal Estimado:</td>
                <td className="p-1.5">{item.valor_venal ? `R$ ${item.valor_venal.toLocaleString('pt-BR')}` : 'Não avaliado'}</td>
              </tr>
            </tbody>
          </table>
        )}

        {tipo === 'veiculo' && (
          <table className="w-full border-collapse border border-black text-[9pt] mb-3">
            <thead>
              <tr className="bg-slate-100 border-b border-black">
                <th colSpan={4} className="p-1.5 text-left font-bold uppercase text-[8pt] tracking-wider text-black">
                  II. Dados Técnicos e Mecânicos do Veículo
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">Marca / Modelo:</td>
                <td className="p-1.5 w-1/4 border-r border-slate-300">{item.marca_modelo}</td>
                <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">Placa Oficial:</td>
                <td className="p-1.5 w-1/4 font-mono font-bold">{item.placa}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Ano Fab. / Mod.:</td>
                <td className="p-1.5 border-r border-slate-300">{item.ano_fabricacao || '-'}/{item.ano_modelo || '-'}</td>
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Cor / Combustível:</td>
                <td className="p-1.5">{item.cor || '-'} · {item.combustivel || 'Flex'}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Chassi:</td>
                <td className="p-1.5 border-r border-slate-300 font-mono">{item.chassi || '-'}</td>
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Renavam:</td>
                <td className="p-1.5 font-mono">{item.renavam || '-'}</td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Quilometragem Atual:</td>
                <td className="p-1.5 border-r border-slate-300">{item.quilometragem_atual ? `${item.quilometragem_atual.toLocaleString('pt-BR')} km` : '0 km'}</td>
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Condutor Responsável:</td>
                <td className="p-1.5">{item.responsavel_nome || 'Governo Provincial'}</td>
              </tr>
            </tbody>
          </table>
        )}

        {tipo === 'bem' && (
          <table className="w-full border-collapse border border-black text-[9pt] mb-3">
            <thead>
              <tr className="bg-slate-100 border-b border-black">
                <th colSpan={4} className="p-1.5 text-left font-bold uppercase text-[8pt] tracking-wider text-black">
                  II. Ficha do Acervo, Dimensões e Salvaguarda
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">Código de Tombo:</td>
                <td className="p-1.5 w-1/4 border-r border-slate-300 font-bold">{item.codigo_tombamento}</td>
                <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">Categoria do Bem:</td>
                <td className="p-1.5 w-1/4">{item.categoria}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Localização no Imóvel:</td>
                <td className="p-1.5 border-r border-slate-300">{item.localizacao_especifica || 'Capela / Sede'}</td>
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Estado de Conservação:</td>
                <td className="p-1.5">{item.estado_conservacao}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Ano / Época Estimada:</td>
                <td className="p-1.5 border-r border-slate-300">{item.ano_aquisicao || 'Século XX'}</td>
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Origem / Procedência:</td>
                <td className="p-1.5">{item.origem_procedencia || 'Europa / Brasil'}</td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Tombamento Histórico:</td>
                <td className="p-1.5 border-r border-slate-300">{item.tombamento_historico ? 'Oficialmente Tombado' : 'Acervo Comum'}</td>
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Valor Estimado:</td>
                <td className="p-1.5">{item.valor_estimado ? `R$ ${item.valor_estimado.toLocaleString('pt-BR')}` : 'Inestimável'}</td>
              </tr>
            </tbody>
          </table>
        )}

        {tipo === 'contrato' && (
          <table className="w-full border-collapse border border-black text-[9pt] mb-3">
            <thead>
              <tr className="bg-slate-100 border-b border-black">
                <th colSpan={4} className="p-1.5 text-left font-bold uppercase text-[8pt] tracking-wider text-black">
                  II. Dados Contratuais, Partes e Valores
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">Fornecedor / Prestador:</td>
                <td className="p-1.5 w-1/4 border-r border-slate-300">{item.fornecedor_prestador}</td>
                <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">CNPJ / CPF:</td>
                <td className="p-1.5 w-1/4 font-mono">{item.cnpj_cpf || '-'}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Início de Vigência:</td>
                <td className="p-1.5 border-r border-slate-300">{item.data_inicio ? new Date(item.data_inicio).toLocaleDateString('pt-BR') : '-'}</td>
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Término de Vigência:</td>
                <td className="p-1.5">{item.data_fim ? new Date(item.data_fim).toLocaleDateString('pt-BR') : '-'}</td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Valor Mensal:</td>
                <td className="p-1.5 border-r border-slate-300">{item.valor_mensal ? `R$ ${item.valor_mensal.toLocaleString('pt-BR')}` : '-'}</td>
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Valor Anual Global:</td>
                <td className="p-1.5">{item.valor_anual ? `R$ ${item.valor_anual.toLocaleString('pt-BR')}` : '-'}</td>
              </tr>
            </tbody>
          </table>
        )}

        {tipo === 'vistoria' && (
          <table className="w-full border-collapse border border-black text-[9pt] mb-3">
            <thead>
              <tr className="bg-slate-100 border-b border-black">
                <th colSpan={4} className="p-1.5 text-left font-bold uppercase text-[8pt] tracking-wider text-black">
                  II. Ficha Técnica de Engenharia e Vistoria
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">Imóvel Alvo:</td>
                <td className="p-1.5 w-1/4 border-r border-slate-300">{item.imovel_nome || item.comunidade_obra}</td>
                <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">Tipo da Intervenção:</td>
                <td className="p-1.5 w-1/4">{item.tipo}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Data de Solicitação:</td>
                <td className="p-1.5 border-r border-slate-300">{item.data_solicitacao ? new Date(item.data_solicitacao).toLocaleDateString('pt-BR') : '-'}</td>
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Data de Conclusão / Previsão:</td>
                <td className="p-1.5">{item.data_conclusao ? new Date(item.data_conclusao).toLocaleDateString('pt-BR') : 'Em andamento'}</td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Responsável Técnico:</td>
                <td className="p-1.5 border-r border-slate-300">{item.responsavel_vistoria || 'Engenharia Provincial'}</td>
                <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Custo Estimado / Realizado:</td>
                <td className="p-1.5">{item.custo_estimado ? `R$ ${item.custo_estimado.toLocaleString('pt-BR')}` : '-'}</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* SEÇÃO III: REGULARIDADE NOTARIAL, CARTORIAL & SECURITÁRIA */}
        <table className="w-full border-collapse border border-black text-[9pt] mb-3">
          <thead>
            <tr className="bg-slate-100 border-b border-black">
              <th colSpan={4} className="p-1.5 text-left font-bold uppercase text-[8pt] tracking-wider text-black">
                III. Regularidade Notarial, Registros & Seguros
              </th>
            </tr>
          </thead>
          <tbody>
            {tipo === 'imovel' && (
              <>
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">Matrícula (RGI):</td>
                  <td className="p-1.5 w-1/4 border-r border-slate-300 font-mono">{item.numero_matricula || 'Pendente'}</td>
                  <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">Cartório de Registro:</td>
                  <td className="p-1.5 w-1/4">{item.cartorio_registro || 'Não informado'}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Escritura Pública:</td>
                  <td className="p-1.5 border-r border-slate-300">{item.tem_escritura ? '✓ Lavrada e Regular' : '✗ Pendente'}</td>
                  <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Habite-se Municipal:</td>
                  <td className="p-1.5">{item.tem_habite_se ? '✓ Expedido' : '✗ Pendente'}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">AVCB Bombeiros:</td>
                  <td className="p-1.5 border-r border-slate-300">{item.avcb_numero ? `Nº ${item.avcb_numero} (Validade: ${item.avcb_vencimento ? new Date(item.avcb_vencimento).toLocaleDateString('pt-BR') : 'N/D'})` : 'Pendente'}</td>
                  <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Seguro Predial:</td>
                  <td className="p-1.5">{item.seguro_predial_seguradora || 'Porto Seguro'} {item.seguro_predial_vencimento ? `(Venc: ${new Date(item.seguro_predial_vencimento).toLocaleDateString('pt-BR')})` : ''}</td>
                </tr>
              </>
            )}
            {tipo === 'veiculo' && (
              <>
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">IPVA / Licenciamento:</td>
                  <td className="p-1.5 w-1/4 border-r border-slate-300">{item.ipva_pago ? '✓ Quitado e Regular' : '✗ Pendente'}</td>
                  <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">Companhia Seguradora:</td>
                  <td className="p-1.5 w-1/4">{item.seguro_seguradora || 'Porto Seguro Auto'}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Apólice de Seguro:</td>
                  <td className="p-1.5 border-r border-slate-300">{item.seguro_apolice || 'Ativa'} (Vigência: {item.seguro_vencimento ? new Date(item.seguro_vencimento).toLocaleDateString('pt-BR') : '-'})</td>
                  <td className="p-1.5 font-bold bg-slate-50 border-r border-slate-300">Assistência Emergencial:</td>
                  <td className="p-1.5 font-mono">{item.seguro_contato_emergencia || '0800 727 0727'}</td>
                </tr>
              </>
            )}
            {tipo !== 'imovel' && tipo !== 'veiculo' && (
              <tr>
                <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">Status Jurídico-Canônico:</td>
                <td className="p-1.5 w-1/4 border-r border-slate-300">{item.status || 'Regular'}</td>
                <td className="p-1.5 font-bold w-1/4 bg-slate-50 border-r border-slate-300">Guarda e Governança:</td>
                <td className="p-1.5 w-1/4">{item.comunidade_obra || 'Sede Provincial BRM'}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* SEÇÃO IV: OBSERVAÇÕES E HISTÓRICO CANÔNICO */}
        <table className="w-full border-collapse border border-black text-[9pt] mb-3">
          <thead>
            <tr className="bg-slate-100 border-b border-black">
              <th className="p-1.5 text-left font-bold uppercase text-[8pt] tracking-wider text-black">
                IV. Observações e Disposições de Governança Provincial
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 leading-relaxed">
                {item.observacoes || 'Sem anotações complementares registradas para este ativo nos arquivos provinciais.'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* LOCAL E DATA POR EXTENSO */}
        <div className="text-right text-[9pt] font-timbrado my-4">
          Sede Provincial — Corupá / SC, {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())}
        </div>

        {/* BLOCO FORMAL DE ASSINATURAS */}
        <div className="mt-8 pt-4 grid grid-cols-2 gap-12 text-center text-[8.5pt]">
          <div>
            <div className="border-t border-black pt-1.5 font-bold uppercase text-black">
              Secretaria Provincial / Economato
            </div>
            <span className="text-[7.5pt] text-slate-600 block">Sede Provincial BRM (Corupá/SC)</span>
          </div>
          <div>
            <div className="border-t border-black pt-1.5 font-bold uppercase text-black">
              Superior Local
            </div>
            <span className="text-[7.5pt] text-slate-600 block">{item.comunidade_obra || 'Comunidade Religiosa'}</span>
          </div>
        </div>

        {/* Certidão Canônica Livre junto ao rodapé */}
        <p className="mt-8 mb-2 text-[7.5pt] text-slate-600 font-serif italic text-center leading-relaxed max-w-3xl mx-auto select-none">
          Certifico para os devidos fins de direito canônico e civil que as informações constantes nesta ficha documental conferem integralmente com os assentos do Livro de Tombo e arquivos da Secretaria Provincial e Economato da Província Brasileira Meridional da Congregação dos Sacerdotes do Sagrado Coração de Jesus.
        </p>

        {/* Rodapé Oficial Timbrado BRM */}
        <div className="mt-1">
          <RodapeTimbradoBRM />
        </div>
      </div>
    </div>
  );
};

export default PatrimonioDetalhes;
