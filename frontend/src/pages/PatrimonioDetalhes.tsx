import React, { useState, useEffect } from 'react';
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
import type { 
  TipoPatrimonio, 
  ImovelPatrimonio, 
  VeiculoPatrimonio, 
  BemPatrimonio, 
  ContratoPatrimonio, 
  ManutencaoPatrimonio,
  PatrimonioAnexo,
  PatrimonioTimelineEvent
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

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [anexos, setAnexos] = useState<PatrimonioAnexo[]>([]);
  const [timeline, setTimeline] = useState<PatrimonioTimelineEvent[]>([]);
  const [orientacao, setOrientacao] = useState<OrientacaoDocumento>('vertical');

  // Carrega o registro através da camada de serviços
  useEffect(() => {
    const carregarItem = async () => {
      if (!id) return;
      setLoading(true);

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
      {/* CABEÇALHO OFICIAL DA PROVÍNCIA (Exibido na tela e na impressão)            */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[8px] p-6 shadow-xs print:border-none print:shadow-none print:p-0 space-y-6">
        
        {/* Timbre Canônico Oficial (Para impressão - Papel Timbrado BRM) */}
        <div className="hidden print:block mb-4">
          <CabecalhoTimbradoBRM
            orgaoEmissor="Economato Provincial • Livro de Tombo e Patrimônio"
            subtituloDocumento={`Ficha Cadastral Oficial • ${item?.codigo_tombamento || item?.codigo || item?.placa || 'Patrimônio BRM'}`}
            dataEmissao={new Date().toLocaleDateString('pt-BR')}
          />
        </div>

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
                    <span className="font-medium text-slate-900 dark:text-white">{item.comunidade_obra || 'Curia Provincial BRM'}</span>
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

          {/* TABELA DE DOCUMENTOS ARQUIVADOS PARA IMPRESSÃO (Visível apenas ao imprimir) */}
          <div className="hidden print:block pt-6 border-t border-slate-300">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2">
              DOCUMENTOS & CERTIDÕES ARQUIVADOS NO PROTOCOLO PROVINCIAL
            </h4>
            {anexos.length === 0 ? (
              <p className="text-xs italic text-slate-500">Nenhum documento anexado digitalmente a esta ficha.</p>
            ) : (
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-[11px] uppercase">
                    <th className="p-2 border-r border-slate-300">Nome do Documento / Identificação</th>
                    <th className="p-2 border-r border-slate-300">Tipo de Documento</th>
                    <th className="p-2 border-r border-slate-300">Data de Arquivamento</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {anexos.map((anexo) => (
                    <tr key={anexo.id} className="border-b border-slate-300">
                      <td className="p-2 border-r border-slate-300 font-medium">{anexo.nome}</td>
                      <td className="p-2 border-r border-slate-300">{anexo.tipo}</td>
                      <td className="p-2 border-r border-slate-300">{anexo.created_at ? new Date(anexo.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                      <td className="p-2 text-[#113240] font-semibold">✓ Arquivado Digitalmente</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* BLOCO FORMAL DE ASSINATURAS */}
            <div className="pt-16 grid grid-cols-2 gap-12 text-center text-xs">
              <div>
                <div className="border-t border-slate-800 pt-2 font-bold text-slate-900 uppercase">
                  Pe. Ecônomo Provincial SCJ
                </div>
                <span className="text-[10px] text-slate-500">Curia Provincial BRM • Visto do Economato</span>
              </div>
              <div>
                <div className="border-t border-slate-800 pt-2 font-bold text-slate-900 uppercase">
                  Responsável pelo Patrimônio / Superior Local
                </div>
                <span className="text-[10px] text-slate-500">Comunidade Religiosa de Alocação</span>
              </div>
            </div>

            {/* Rodapé Oficial Timbrado BRM (Para impressão) */}
            <div className="hidden print:block mt-8">
              <RodapeTimbradoBRM />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PatrimonioDetalhes;
