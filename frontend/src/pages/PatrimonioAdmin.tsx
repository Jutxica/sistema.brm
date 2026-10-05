import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Building2, Car, Package, ShieldCheck, Wrench, AlertTriangle, 
  Search, Plus, Trash2, Edit3, 
  CheckCircle2, X, Calendar, MapPin, FileText, Check, 
  Eye, RefreshCw, Printer, LayoutGrid, ListFilter,
  ChevronRight, ChevronDown, HardDrive, Clock, Layers, Landmark, Shield,
  ArrowUpRight, FileCheck, FileSpreadsheet, Wifi, WifiOff, Download,
  SlidersHorizontal, History, ScrollText, Filter, User, Tag
} from 'lucide-react';
import { 
  imoveisService, 
  veiculosService, 
  bensService, 
  contratosService, 
  manutencoesService, 
  dashboardService, 
  relatoriosService,
  auditoriaService
} from '../services/patrimonioService';
import { useAuth } from '../contexts/AuthContext';
import { usePatrimonioSync } from '../hooks/usePatrimonioSync';
import { useAnimatedNumber } from '../hooks/useMotion';
import { confirmAction, showToast } from '../hooks/useFeedback';
import type {
  AbaPatrimonio,
  TipoPatrimonio,
  ImovelPatrimonio,
  VeiculoPatrimonio,
  BemPatrimonio,
  ContratoPatrimonio,
  ManutencaoPatrimonio,
  ConformidadeItem,
  AuditLogEntry
} from '../types/patrimonio';
import {
  getPatrimonioLocal,
  savePatrimonioLocal,
  SEED_IMOVEIS,
  SEED_VEICULOS,
  SEED_BENS,
  SEED_CONTRATOS,
  SEED_MANUTENCOES
} from '../types/patrimonio';

const AnimatedStat: React.FC<{ value: number }> = ({ value }) => {
  const animated = useAnimatedNumber(value);
  return <>{animated}</>;
};

export const PatrimonioAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Abas
  const activeTab = (searchParams.get('tab') as AbaPatrimonio) || 'visao-geral';
  const handleTabChange = (tab: AbaPatrimonio) => {
    setSearchParams({ tab });
  };

  // Estados dos Ativos
  const [imoveis, setImoveis] = useState<ImovelPatrimonio[]>([]);
  const [veiculos, setVeiculos] = useState<VeiculoPatrimonio[]>([]);
  const [bens, setBens] = useState<BemPatrimonio[]>([]);
  const [contratos, setContratos] = useState<ContratoPatrimonio[]>([]);
  const [manutencoes, setManutencoes] = useState<ManutencaoPatrimonio[]>([]);

  const { user } = useAuth();
  const { isOnline, pendingCount, hasConflicts, conflicts, syncNow, resolveConflict } = usePatrimonioSync();
  const [conformidades, setConformidades] = useState<ConformidadeItem[]>([]);
  const [modalConflito, setModalConflito] = useState<any>(null);

  // Estados de UI e Filtros
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [filtroComunidade, setFiltroComunidade] = useState<string>('Todas');
  const [filtroConformidade, setFiltroConformidade] = useState<'todos' | 'seguros' | 'bombeiros' | 'veiculos' | 'contratos'>('todos');
  const [filtroNivelConformidade, setFiltroNivelConformidade] = useState<'todos' | 'critico' | 'urgente' | 'atencao' | 'regular'>('todos');
  const [menuAcoesAberto, setMenuAcoesAberto] = useState(false);
  const menuAcoesRef = useRef<HTMLDivElement>(null);

  // Estados de Auditoria e Rastreabilidade
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [filtroAuditEntidade, setFiltroAuditEntidade] = useState<string>('todas');
  const [filtroAuditAcao, setFiltroAuditAcao] = useState<string>('todas');
  const [searchAudit, setSearchAudit] = useState<string>('');
  const [logSelecionado, setLogSelecionado] = useState<AuditLogEntry | null>(null);

  // Fechar menu de ações ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuAcoesRef.current && !menuAcoesRef.current.contains(event.target as Node)) {
        setMenuAcoesAberto(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuAcoesAberto(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleResolverConflito = async (id: string, estrategia: 'servidor' | 'local' | 'mesclar') => {
    try {
      const ok = await resolveConflict(id, estrategia);
      if (ok) {
        showToast.success('Conflito mediado com sucesso.', 'Integridade Restaurada');
        setModalConflito(null);
        await carregarDados();
      } else {
        showToast.error('Não foi possível mediar o conflito.', 'Erro de Sincronização');
      }
    } catch (err: any) {
      showToast.error(err.message || 'Erro ao resolver conflito.', 'Erro');
    }
  };

  // Carregar dados através da API agregada do dashboard
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setSyncing(true);
    try {
      const data = await dashboardService.getPatrimonioDashboard();
      setImoveis(data.imoveis);
      setVeiculos(data.veiculos);
      setBens(data.bens);
      setContratos(data.contratos);
      setManutencoes(data.manutencoes);
      setConformidades(data.conformidades);
    } catch (err) {
      console.warn('Falha ao consultar dashboard agregado; utilizando dados locais:', err);
      const local = getPatrimonioLocal();
      setImoveis(local.imoveis);
      setVeiculos(local.veiculos);
      setBens(local.bens);
      setContratos(local.contratos);
      setManutencoes(local.manutencoes);
      setConformidades(dashboardService.calcularConformidades(local.imoveis, local.veiculos, local.contratos));
    } finally {
      try {
        const logs = await auditoriaService.listarAuditoria({ limite: 250 });
        setAuditLogs(logs);
      } catch (_) {}
      setSyncing(false);
      setLoading(false);
    }
  };

  const copySqlMigration = () => {
    const sql = `-- Script de Criação do Módulo de Patrimônio Provincial BRM
-- Acesse Supabase -> SQL Editor -> Cole e Execute
${document.location.origin}/supabase/migration-fase1-seguranca-auditoria.sql`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    showToast.success('Script SQL copiado com sucesso!', 'SQL Copiado');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const usuarioLogado = user ? { id: user.id, email: user.email, nome: user.nome } : undefined;

  const handleExcluirImovel = async (id: string, nome: string) => {
    const confirmou = await confirmAction({
      title: 'Excluir Imóvel do Patrimônio',
      message: `Tem certeza que deseja remover o imóvel "${nome}"? Esta operação é definitiva e auditada.`,
      confirmLabel: 'Remover Imóvel',
      tone: 'danger'
    });
    if (!confirmou) return;

    await imoveisService.excluir(id, usuarioLogado);
    setImoveis(prev => prev.filter(i => i.id !== id));
    showToast.success(`Imóvel "${nome}" removido do cadastro provincial.`, 'Imóvel Removido');
  };

  const handleExcluirVeiculo = async (id: string, modelo: string, placa: string) => {
    const confirmou = await confirmAction({
      title: 'Remover Veículo da Frota',
      message: `Deseja realmente remover o veículo ${modelo} (${placa}) do livro de frota?`,
      confirmLabel: 'Remover Veículo',
      tone: 'danger'
    });
    if (!confirmou) return;

    await veiculosService.excluir(id, usuarioLogado);
    setVeiculos(prev => prev.filter(v => v.id !== id));
    showToast.success(`Veículo ${placa} removido da frota provincial.`, 'Veículo Removido');
  };

  const handleExcluirBem = async (id: string, titulo: string, tombo: string) => {
    const confirmou = await confirmAction({
      title: 'Desincorporar Bem do Inventário',
      message: `Deseja remover o bem tombo ${tombo} ("${titulo}") do acervo provincial?`,
      confirmLabel: 'Desincorporar Bem',
      tone: 'danger'
    });
    if (!confirmou) return;

    await bensService.excluir(id, usuarioLogado);
    setBens(prev => prev.filter(b => b.id !== id));
    showToast.success(`Item tombo ${tombo} desincorporado.`, 'Bem Removido');
  };

  const handleExcluirContrato = async (id: string, titulo: string) => {
    const confirmou = await confirmAction({
      title: 'Excluir Contrato / Apólice',
      message: `Deseja remover o registro de contrato "${titulo}"?`,
      confirmLabel: 'Excluir Contrato',
      tone: 'danger'
    });
    if (!confirmou) return;

    await contratosService.excluir(id, usuarioLogado);
    setContratos(prev => prev.filter(c => c.id !== id));
    showToast.success(`Contrato removido.`, 'Contrato Excluído');
  };

  const handleExcluirManutencao = async (id: string, titulo: string) => {
    const confirmou = await confirmAction({
      title: 'Excluir Vistoria / Ordem de Serviço',
      message: `Deseja remover o registro de manutenção "${titulo}"?`,
      confirmLabel: 'Excluir Registro',
      tone: 'danger'
    });
    if (!confirmou) return;

    await manutencoesService.excluir(id, usuarioLogado);
    setManutencoes(prev => prev.filter(m => m.id !== id));
    showToast.success(`Registro de vistoria excluído.`, 'Ordem Removida');
  };

  // Agregações
  const valorTotalImoveis = useMemo(() => {
    return imoveis.reduce((acc, i) => acc + (Number(i.valor_venal) || 0), 0);
  }, [imoveis]);

  const valorTotalBens = useMemo(() => {
    return bens.reduce((acc, b) => acc + (Number(b.valor_estimado) || 0), 0);
  }, [bens]);

  const valorTotalEstimado = valorTotalImoveis + valorTotalBens;

  const areaTotalConstruida = useMemo(() => {
    return imoveis.reduce((acc, i) => acc + (Number(i.area_construida_m2) || 0), 0);
  }, [imoveis]);

  const imoveisEscriturados = useMemo(() => {
    return imoveis.filter(i => i.tem_escritura).length;
  }, [imoveis]);

  const veiculosSegurados = useMemo(() => {
    return veiculos.filter(v => v.seguro_vencimento).length;
  }, [veiculos]);

  const contratosVigentes = useMemo(() => {
    return contratos.filter(c => c.status === 'Vigente').length;
  }, [contratos]);

  // Alertas de Conformidade & Prazos
  const alertasVencimento = useMemo(() => {
    const hoje = new Date();
    const alertas: Array<{
      id: string;
      itemId: string;
      tipo: TipoPatrimonio;
      categoriaTipo: 'seguros' | 'bombeiros' | 'veiculos' | 'contratos';
      titulo: string;
      descricao: string;
      diasRestantes: number;
      severidade: 'urgente' | 'atencao' | 'info';
    }> = [];

    // Veículos
    veiculos.forEach(v => {
      if (v.seguro_vencimento) {
        const dataVenc = new Date(v.seguro_vencimento);
        const diff = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
        if (diff <= 35) {
          alertas.push({
            id: `seguro-veic-${v.id}`,
            itemId: v.id,
            tipo: 'veiculo',
            categoriaTipo: 'seguros',
            titulo: `Seguro Auto: ${v.marca_modelo} (${v.placa})`,
            descricao: diff < 0 ? `Venceu há ${Math.abs(diff)} dias` : `Vence em ${diff} dias (${v.seguro_seguradora || 'Seguradora'})`,
            diasRestantes: diff,
            severidade: diff <= 7 ? 'urgente' : 'atencao'
          });
        }
      }

      if (v.proxima_revisao_km && v.quilometragem_atual >= v.proxima_revisao_km - 1500) {
        alertas.push({
          id: `rev-veic-${v.id}`,
          itemId: v.id,
          tipo: 'veiculo',
          categoriaTipo: 'veiculos',
          titulo: `Revisão Preventiva: ${v.marca_modelo} (${v.placa})`,
          descricao: `Odômetro: ${v.quilometragem_atual.toLocaleString('pt-BR')} km. Revisão aos ${v.proxima_revisao_km.toLocaleString('pt-BR')} km.`,
          diasRestantes: 5,
          severidade: v.quilometragem_atual >= v.proxima_revisao_km ? 'urgente' : 'atencao'
        });
      }
    });

    // Imóveis
    imoveis.forEach(im => {
      if (im.avcb_vencimento) {
        const dataVenc = new Date(im.avcb_vencimento);
        const diff = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
        if (diff <= 60) {
          alertas.push({
            id: `avcb-${im.id}`,
            itemId: im.id,
            tipo: 'imovel',
            categoriaTipo: 'bombeiros',
            titulo: `Renovação de AVCB Bombeiros: ${im.nome}`,
            descricao: diff < 0 ? `AVCB Vencido! Regularizar junto aos Bombeiros.` : `Expira em ${diff} dias (${im.cidade}/${im.uf})`,
            diasRestantes: diff,
            severidade: diff <= 15 ? 'urgente' : 'atencao'
          });
        }
      }

      if (im.seguro_predial_vencimento) {
        const dataVenc = new Date(im.seguro_predial_vencimento);
        const diff = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
        if (diff <= 45) {
          alertas.push({
            id: `seguro-predial-${im.id}`,
            itemId: im.id,
            tipo: 'imovel',
            categoriaTipo: 'seguros',
            titulo: `Seguro Predial: ${im.nome}`,
            descricao: diff < 0 ? `Apólice vencida` : `Expira em ${diff} dias (${im.seguro_predial_seguradora || 'Seguro Predial'})`,
            diasRestantes: diff,
            severidade: diff <= 10 ? 'urgente' : 'atencao'
          });
        }
      }
    });

    // Contratos
    contratos.forEach(c => {
      if (c.data_fim) {
        const dataVenc = new Date(c.data_fim);
        const diff = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
        if (diff <= 60) {
          alertas.push({
            id: `contrato-${c.id}`,
            itemId: c.id,
            tipo: 'contrato',
            categoriaTipo: 'contratos',
            titulo: `Vigência de Contrato: ${c.titulo}`,
            descricao: diff < 0 ? `Contrato vencido` : `Expira em ${diff} dias (${c.fornecedor_prestador})`,
            diasRestantes: diff,
            severidade: diff <= 15 ? 'urgente' : 'atencao'
          });
        }
      }
    });

    return alertas.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [veiculos, imoveis, contratos]);

  const alertasFiltrados = useMemo(() => {
    if (filtroConformidade === 'todos') return alertasVencimento;
    return alertasVencimento.filter(a => a.categoriaTipo === filtroConformidade);
  }, [alertasVencimento, filtroConformidade]);

  // Contadores e Filtros do Semáforo Canônico de Conformidade
  const contadoresSemaforo = useMemo(() => {
    return {
      critico: conformidades.filter(c => c.nivel === 'critico').length,
      urgente: conformidades.filter(c => c.nivel === 'urgente').length,
      atencao: conformidades.filter(c => c.nivel === 'atencao').length,
      regular: conformidades.filter(c => c.nivel === 'regular').length,
      total: conformidades.length
    };
  }, [conformidades]);

  const conformidadesFiltradas = useMemo(() => {
    return conformidades.filter(c => {
      if (filtroNivelConformidade !== 'todos' && c.nivel !== filtroNivelConformidade) return false;
      if (filtroConformidade !== 'todos') {
        if (filtroConformidade === 'seguros' && c.categoria !== 'seguro') return false;
        if (filtroConformidade === 'bombeiros' && c.categoria !== 'avcb') return false;
        if (filtroConformidade === 'veiculos' && c.categoria !== 'revisao') return false;
        if (filtroConformidade === 'contratos' && c.categoria !== 'contrato') return false;
      }
      return true;
    });
  }, [conformidades, filtroNivelConformidade, filtroConformidade]);

  // Distribuição por Comunidades e Presenças
  const distribuicaoPolos = useMemo(() => {
    const contagem: Record<string, { imoveis: number; veiculos: number; bens: number; total: number }> = {};

    const registrar = (chaveRaw: string | undefined, tipoAtivo: 'imoveis' | 'veiculos' | 'bens') => {
      let chave = (chaveRaw || 'Outros').trim();
      if (chave.toLowerCase().includes('brusque')) chave = 'Polo Vale do Itajaí · Brusque / SC';
      else if (chave.toLowerCase().includes('corupá') || chave.toLowerCase().includes('corupa')) chave = 'Polo Planalto Norte · Corupá / SC';
      else if (chave.toLowerCase().includes('rio negrinho')) chave = 'Polo Planalto Norte · Rio Negrinho / SC';
      else if (chave.toLowerCase().includes('jaraguá') || chave.toLowerCase().includes('jaragua')) chave = 'Polo Vale do Itapocu · Jaraguá do Sul / SC';
      else if (chave.toLowerCase().includes('curitiba')) chave = 'Presença Metropolitana · Curitiba / PR';
      else if (chave.toLowerCase().includes('joinville')) chave = 'Polo Litoral Norte · Joinville / SC';
      else chave = 'Outras Presenças Dehonianas BRM';

      if (!contagem[chave]) {
        contagem[chave] = { imoveis: 0, veiculos: 0, bens: 0, total: 0 };
      }
      contagem[chave][tipoAtivo]++;
      contagem[chave].total++;
    };

    imoveis.forEach(i => registrar(i.cidade || i.comunidade_obra, 'imoveis'));
    veiculos.forEach(v => registrar(v.comunidade_obra, 'veiculos'));
    bens.forEach(b => registrar(b.comunidade_obra, 'bens'));

    return Object.entries(contagem).sort((a, b) => b[1].total - a[1].total);
  }, [imoveis, veiculos, bens]);

  const imoveisFiltrados = useMemo(() => {
    return imoveis.filter(i => 
      i.nome.toLowerCase().includes(search.toLowerCase()) || 
      i.cidade.toLowerCase().includes(search.toLowerCase()) || 
      (i.comunidade_obra && i.comunidade_obra.toLowerCase().includes(search.toLowerCase()))
    );
  }, [imoveis, search]);

  const veiculosFiltrados = useMemo(() => {
    return veiculos.filter(v => 
      v.marca_modelo.toLowerCase().includes(search.toLowerCase()) || 
      v.placa.toLowerCase().includes(search.toLowerCase()) || 
      (v.comunidade_obra && v.comunidade_obra.toLowerCase().includes(search.toLowerCase()))
    );
  }, [veiculos, search]);

  const bensFiltrados = useMemo(() => {
    return bens.filter(b => 
      b.titulo.toLowerCase().includes(search.toLowerCase()) || 
      b.codigo_tombamento.toLowerCase().includes(search.toLowerCase()) || 
      (b.comunidade_obra && b.comunidade_obra.toLowerCase().includes(search.toLowerCase()))
    );
  }, [bens, search]);

  const contratosFiltrados = useMemo(() => {
    return contratos.filter(c => 
      c.titulo.toLowerCase().includes(search.toLowerCase()) || 
      c.fornecedor_prestador.toLowerCase().includes(search.toLowerCase())
    );
  }, [contratos, search]);

  const manutencoesFiltrados = useMemo(() => {
    return manutencoes.filter(m => 
      m.titulo.toLowerCase().includes(search.toLowerCase()) || 
      (m.comunidade_obra && m.comunidade_obra.toLowerCase().includes(search.toLowerCase()))
    );
  }, [manutencoes, search]);

  const logsFiltrados = useMemo(() => {
    return auditLogs.filter(log => {
      if (filtroAuditEntidade !== 'todas' && log.entity !== filtroAuditEntidade) return false;
      if (filtroAuditAcao !== 'todas' && log.action !== filtroAuditAcao) return false;
      if (searchAudit) {
        const q = searchAudit.toLowerCase();
        const matchNome = log.entity_nome?.toLowerCase().includes(q);
        const matchUser = log.user_nome?.toLowerCase().includes(q) || log.user_email?.toLowerCase().includes(q);
        const matchId = log.entity_id?.toLowerCase().includes(q);
        if (!matchNome && !matchUser && !matchId) return false;
      }
      return true;
    });
  }, [auditLogs, filtroAuditEntidade, filtroAuditAcao, searchAudit]);

  return (
    <div className="space-y-6 animate-fade-in print:space-y-4 font-sans pb-12">
      {/* 1. Header Oficial do Economato Provincial */}
      <header className="rounded-[10px] bg-white dark:bg-[#161b22] p-6 md:p-8 border border-slate-200/90 dark:border-slate-800 border-t-2 border-t-[#226380] shadow-xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center shrink-0">
              <img src="/logo-sistema.png" alt="Brasão SCJ BRM" className="h-14 w-auto object-contain dark:hidden" />
              <img src="/logo-branco.png" alt="Brasão SCJ BRM" className="h-14 w-auto object-contain hidden dark:block" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-cinzel text-xs font-bold tracking-[0.16em] text-[#226380] dark:text-[#A3C3C7] uppercase">
                  Província BRM
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Congregação dos Padres do Sagrado Coração de Jesus
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[10px] font-semibold tracking-wide uppercase bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] border border-[#226380]/30 ml-1">
                  <CheckCircle2 className="w-3 h-3 text-[#226380] dark:text-[#A3C3C7]" />
                  Livro de Tombo Oficial
                </span>
              </div>
              <h1 className="font-cinzel text-2xl md:text-3xl font-bold tracking-tight text-[#113240] dark:text-white mt-1">
                Patrimônio & Imobilizado Provincial
              </h1>
            </div>
          </div>

          {/* Ações Institucionais Discretas */}
          <div className="flex items-center gap-2 print:hidden shrink-0">
            {/* Alertas Operacionais (apenas quando houver pendência ou conflito) */}
            {hasConflicts ? (
              <button
                type="button"
                onClick={() => setModalConflito(conflicts[0])}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-[#80282E]/10 text-[#80282E] dark:text-[#F2C894] border border-[#80282E]/30 rounded-[6px] hover:bg-[#80282E]/15 transition-all cursor-pointer"
                title="Divergência entre dados locais e banco central. Clique para mediar."
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#80282E]" />
                <span>{conflicts.length} Conflito{conflicts.length > 1 ? 's' : ''}</span>
              </button>
            ) : pendingCount > 0 ? (
              <button
                type="button"
                onClick={syncNow}
                disabled={!isOnline}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[#F2C894]/20 text-[#7A5016] dark:text-[#F2C894] border border-[#F2C894]/40 rounded-[6px] hover:bg-[#F2C894]/30 transition-all cursor-pointer"
                title={isOnline ? "Fila offline com alterações. Sincronizar agora." : "Modo offline ativo."}
              >
                {isOnline ? <Wifi className="w-3.5 h-3.5 text-[#9E6B28]" /> : <WifiOff className="w-3.5 h-3.5 text-slate-400" />}
                <span>{pendingCount} Pendente{pendingCount > 1 ? 's' : ''}</span>
              </button>
            ) : (
              <div 
                className="hidden md:inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono text-slate-500 dark:text-[#A3C3C7] bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[5px]"
                title="Conectado com o banco de dados provincial"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#226380]"></span>
                <span>Sincronizado</span>
              </div>
            )}

            {/* Menu Discreto de Opções & Relatórios */}
            <div className="relative" ref={menuAcoesRef}>
              <button
                type="button"
                onClick={() => setMenuAcoesAberto(!menuAcoesAberto)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer rounded-[6px] shadow-xs"
                title="Opções do Livro de Tombo, relatórios e sincronização"
                aria-expanded={menuAcoesAberto}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7]" />
                <span>Opções</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${menuAcoesAberto ? 'rotate-180' : ''}`} />
              </button>

              {menuAcoesAberto && (
                <div className="absolute right-0 mt-1.5 w-64 rounded-[8px] bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-cinzel border-b border-slate-100 dark:border-slate-800/80">
                    Relatórios Canônicos
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAcoesAberto(false);
                      relatoriosService.imprimirLivroDeTomboCanonica(imoveis, bens);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#226380]" />
                    <div>
                      <span className="font-medium block">Livro Canônico Oficial</span>
                      <span className="text-[10px] text-slate-400 block">Emitir termo timbrado para chancela</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuAcoesAberto(false);
                      relatoriosService.exportarLivroDeTomboExcel(imoveis, bens);
                      showToast.success('Livro de Tombo exportado com sucesso em Excel (.xlsx)', 'Relatório Gerado');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7]" />
                    <div>
                      <span className="font-medium block">Exportar Planilha (Excel)</span>
                      <span className="text-[10px] text-slate-400 block">Download de inventário e imóveis (.xlsx)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuAcoesAberto(false);
                      handleTabChange('auditoria');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-[#226380]" />
                    <div>
                      <span className="font-medium block">Trilha de Auditoria & Logs</span>
                      <span className="text-[10px] text-slate-400 block">Rastreabilidade completa de atos e operadores</span>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-cinzel">
                    Sincronização & Dados
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuAcoesAberto(false);
                      carregarDados();
                    }}
                    disabled={syncing}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#226380] ${syncing ? 'animate-spin' : ''}`} />
                    <div>
                      <span className="font-medium block">{syncing ? 'Atualizando...' : 'Recarregar Dados'}</span>
                      <span className="text-[10px] text-slate-400 block">Consultar banco de dados central</span>
                    </div>
                  </button>

                  <div className="mt-1 px-3 py-2 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Base Provincial:</span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${hasConflicts ? 'bg-[#80282E]' : pendingCount > 0 ? 'bg-[#9E6B28]' : 'bg-[#226380]'}`} />
                      {hasConflicts ? `${conflicts.length} Conflito(s)` : pendingCount > 0 ? `${pendingCount} Pendente(s)` : 'Sincronizado'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Ação Primária Limpa */}
            <button
              type="button"
              onClick={() => navigate('/patrimonio/novo')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#113240] text-white hover:bg-[#226380] transition-all cursor-pointer rounded-[6px] shadow-xs motion-press"
              title="Abre a ficha para lançamento de novo ativo"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lançar Patrimônio</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Abas de Navegação Editorial */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs print:hidden border-b border-slate-200/80 dark:border-slate-800">
        {[
          { id: 'visao-geral', label: 'Visão Geral & Indicadores', icon: Layers, badge: alertasVencimento.length || null },
          { id: 'imoveis', label: 'Imóveis & Terrenos', icon: Building2, count: imoveis.length },
          { id: 'veiculos', label: 'Frota Veicular', icon: Car, count: veiculos.length },
          { id: 'inventario', label: 'Inventário Sacro & Arte', icon: Package, count: bens.length },
          { id: 'contratos', label: 'Contratos & Seguros', icon: ShieldCheck, count: contratos.length },
          { id: 'manutencoes', label: 'Vistorias & Obras', icon: Wrench, count: manutencoes.length },
          { id: 'auditoria', label: 'Trilha de Auditoria', icon: History, count: auditLogs.length },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id as AbaPatrimonio)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-[6px] text-xs font-medium transition-all cursor-pointer shrink-0 border-b-2 -mb-[2px] ${
                isActive
                  ? 'border-[#226380] text-[#113240] dark:text-white font-semibold bg-white dark:bg-[#161b22] border-t border-l border-r border-t-slate-200/90 dark:border-t-slate-800 border-l-slate-200/90 dark:border-l-slate-800 border-r-slate-200/90 dark:border-r-slate-800 shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 text-[#226380]" />
              <span className="font-cinzel text-xs">{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F2C894]/25 text-[#7A5016] dark:text-[#F2C894] border border-[#F2C894]/40">
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && (
                <span className="text-[11px] text-slate-400 font-mono">
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: VISÃO GERAL — ASYMMETRIC EXECUTIVE PORTFOLIO BENTO                 */}
      {/* ========================================================================= */}
      {activeTab === 'visao-geral' && (
        <div className="space-y-6">
          {/* Asymmetric Bento Portfolio Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5">
            {/* Anchor Card: Avaliação Consolidada do Imobilizado & Acervo (Spans 7 cols, 2 rows) */}
            <div className="lg:col-span-7 lg:row-span-2 rounded-[10px] bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-xs hover:border-[#226380]/40 transition-all group">
              {/* Brasão d'água sutil no fundo */}
              <div className="absolute -right-6 -bottom-6 w-52 h-52 pointer-events-none opacity-[0.035] dark:opacity-[0.045] select-none transition-transform group-hover:scale-105 duration-700">
                <img src="/logo-sistema.png" alt="" className="w-full h-full object-contain dark:hidden" />
                <img src="/logo-branco.png" alt="" className="w-full h-full object-contain hidden dark:block" />
              </div>

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#226380] dark:bg-[#A3C3C7]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#226380] dark:text-[#A3C3C7]">
                      Livro de Tombo Consolidado
                    </span>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                    Exercício Vigente · Província BRM
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-medium block mb-1">
                    Avaliação Global Estimada do Ativo
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-cinzel font-bold text-[#113240] dark:text-[#F2C894] tabular-nums tracking-tight">
                      R$ {(valorTotalEstimado / 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md leading-relaxed">
                    Patrimônio imobiliário venal registrado em cartório e acervos litúrgicos tombados sob custódia canônica da Província BRM.
                  </p>
                </div>

                {/* Subdivisão Editorial dos Ativos */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Imóveis & Sedes</span>
                    <span className="text-lg font-cinzel font-bold text-[#113240] dark:text-white tabular-nums">
                      R$ {(valorTotalImoveis / 1000000).toFixed(1)}M
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      {imoveis.length} sedes registradas
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Inventário Sacro</span>
                    <span className="text-lg font-cinzel font-bold text-[#113240] dark:text-white tabular-nums">
                      R$ {(valorTotalBens / 1000).toFixed(0)}k
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      {bens.length} itens tombados
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 relative z-10">
                <span className="truncate">
                  Cartórios de Registro de Imóveis (RGI) e Arquivo Canônico
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      relatoriosService.exportarLivroDeTomboExcel(imoveis, bens);
                      showToast.success('Livro de Tombo exportado com sucesso em Excel (.xlsx)', 'Relatório Gerado');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-[#226380] dark:hover:text-[#A3C3C7] font-medium transition-colors cursor-pointer"
                    title="Baixar planilha Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7]" />
                    <span>Exportar Excel</span>
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <button
                    type="button"
                    onClick={() => relatoriosService.imprimirLivroDeTomboCanonica(imoveis, bens)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#226380] dark:text-[#A3C3C7] font-semibold hover:underline cursor-pointer"
                    title="Emitir termo canônico timbrado oficial"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Livro Canônico</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Sedes Canônicas & Edificações (lg:col-span-5) */}
            <div 
              onClick={() => handleTabChange('imoveis')}
              className="lg:col-span-5 rounded-[10px] bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs hover:border-[#226380]/60 transition-all cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-[8px] bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-[#226380]">
                    <Building2 className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-xs font-semibold text-[#226380] dark:text-[#A3C3C7] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Ver imóveis</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Sedes Canônicas & Obras
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-cinzel font-bold text-[#113240] dark:text-white tabular-nums">
                      <AnimatedStat value={imoveis.length} />
                    </span>
                    <span className="text-xs text-slate-400">propriedades</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Área Edificada Total</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {areaTotalConstruida.toLocaleString('pt-BR')} m²
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Escrituradas em RGI</span>
                    <span className="font-medium text-[#226380] dark:text-[#A3C3C7]">
                      {imoveisEscriturados} de {imoveis.length} regulares
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Frota Veicular Provincial (lg:col-span-5) */}
            <div 
              onClick={() => handleTabChange('veiculos')}
              className="lg:col-span-5 rounded-[10px] bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs hover:border-[#226380]/60 transition-all cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-[8px] bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-[#226380]">
                    <Car className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-xs font-semibold text-[#226380] dark:text-[#A3C3C7] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Ver frota</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Frota Veicular Ativa
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-cinzel font-bold text-[#113240] dark:text-white tabular-nums">
                      <AnimatedStat value={veiculos.length} />
                    </span>
                    <span className="text-xs text-slate-400">veículos alocados</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cobertura de Seguros</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {veiculosSegurados} de {veiculos.length} apólices vigentes
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Regularidade Fiscal</span>
                    <span className="font-medium text-[#226380] dark:text-[#A3C3C7]">
                      100% IPVA quitado
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Inventário Sacro & Histórico (lg:col-span-4) */}
            <div 
              onClick={() => handleTabChange('inventario')}
              className="lg:col-span-4 rounded-[10px] bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between shadow-xs hover:border-[#226380]/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-[#226380]">
                  <Package className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-400 group-hover:text-[#226380] transition-colors">
                  Inventário
                </span>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-cinzel font-bold text-[#113240] dark:text-white tabular-nums">
                  <AnimatedStat value={bens.length} />
                </span>
                <span className="block text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  Bens Sacros & Relíquias
                </span>
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  Curadoria histórica canônica
                </span>
              </div>
            </div>

            {/* Card 5: Contratos & Apólices (lg:col-span-4) */}
            <div 
              onClick={() => handleTabChange('contratos')}
              className="lg:col-span-4 rounded-[10px] bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between shadow-xs hover:border-[#226380]/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-[#226380]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-400 group-hover:text-[#226380] transition-colors">
                  Seguros
                </span>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-cinzel font-bold text-[#113240] dark:text-white tabular-nums">
                  <AnimatedStat value={contratos.length} />
                </span>
                <span className="block text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  Contratos & Apólices
                </span>
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  {contratosVigentes} apólices ativas
                </span>
              </div>
            </div>

            {/* Card 6: Vistorias & Manutenções (lg:col-span-4) */}
            <div 
              onClick={() => handleTabChange('manutencoes')}
              className="lg:col-span-4 rounded-[10px] bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between shadow-xs hover:border-[#226380]/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-[#226380]">
                  <Wrench className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-400 group-hover:text-[#226380] transition-colors">
                  Engenharia
                </span>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-cinzel font-bold text-[#113240] dark:text-white tabular-nums">
                  <AnimatedStat value={manutencoes.length} />
                </span>
                <span className="block text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  Vistorias & Manutenções
                </span>
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  Acompanhamento predial
                </span>
              </div>
            </div>
          </section>

          {/* Grid: Presenças Territoriais e Ações de Lançamento */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Diretório Editorial de Presenças */}
            <div className="lg:col-span-7 bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 rounded-[10px] p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#226380]" />
                    <span>Presenças Territoriais & Polos da Província BRM</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Alocação do patrimônio entre as sedes conventuais, paróquias e seminários.
                  </p>
                </div>
                {filtroComunidade !== 'Todas' && (
                  <button
                    type="button"
                    onClick={() => setFiltroComunidade('Todas')}
                    className="text-xs text-[#226380] dark:text-[#A3C3C7] font-semibold underline cursor-pointer"
                  >
                    Limpar filtro ({filtroComunidade})
                  </button>
                )}
              </div>

              {/* Editorial Hub List — Typographic and Crisp without toy progress bars */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {distribuicaoPolos.map(([polo, cont]) => {
                  const isFiltered = filtroComunidade === polo;
                  return (
                    <div
                      key={polo}
                      onClick={() => setFiltroComunidade(isFiltered ? 'Todas' : polo)}
                      className={`py-3 px-3.5 -mx-1 rounded-[6px] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isFiltered
                          ? 'bg-[#226380]/10 border border-[#226380]/40 dark:bg-[#226380]/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                          {polo}
                        </span>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{cont.imoveis} {cont.imoveis === 1 ? 'imóvel' : 'imóveis'}</span>
                          <span>·</span>
                          <span>{cont.veiculos} {cont.veiculos === 1 ? 'veículo' : 'veículos'}</span>
                          <span>·</span>
                          <span>{cont.bens} {cont.bens === 1 ? 'peça sacra' : 'peças sacras'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-[4px]">
                          {cont.total} {cont.total === 1 ? 'ativo' : 'ativos'}
                        </span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[3px] ${
                          isFiltered ? 'bg-[#226380] text-white' : 'text-slate-400'
                        }`}>
                          {isFiltered ? 'Filtrado' : 'Filtrar'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ações de Gestão & Lançamento (Command Hub) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 rounded-[10px] p-6 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>Ações do Economato Provincial</span>
                  <span className="text-[11px] font-normal text-slate-400">Lançamentos</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
                  Abertura de novas fichas patrimoniais, tombamento de acervo e ordens técnicas:
                </p>

                <div className="space-y-2">
                  {[
                    { label: 'Cadastrar Imóvel ou Terreno', sub: 'Conventos, sedes e colégios', tipo: 'imovel', icon: Building2 },
                    { label: 'Incorporar Veículo à Frota', sub: 'Carros, vans e apólices auto', tipo: 'veiculo', icon: Car },
                    { label: 'Tombar Bem no Inventário Sacro', sub: 'Arte sacra, relíquias e alfaias', tipo: 'bem', icon: Package },
                    { label: 'Firmar Contrato ou Apólice', sub: 'Seguros prediais e comodatos', tipo: 'contrato', icon: ShieldCheck },
                    { label: 'Agendar Vistoria Predial / Obra', sub: 'Laudos técnicos, AVCB e obras', tipo: 'vistoria', icon: Wrench },
                  ].map(action => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.tipo}
                        type="button"
                        onClick={() => navigate(`/patrimonio/novo?tipo=${action.tipo}`)}
                        className="w-full flex items-center justify-between p-3 rounded-[6px] border border-slate-200/80 dark:border-slate-800 hover:border-[#226380]/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-all text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center text-[#226380] group-hover:bg-[#113240] group-hover:text-white transition-colors shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold block">{action.label}</span>
                            <span className="text-[11px] text-slate-400 block">{action.sub}</span>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#226380] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Sede Provincial BRM (Corupá/SC)</span>
                <span className="font-medium text-slate-600 dark:text-slate-300">Dehonianos</span>
              </div>
            </div>
          </div>

          {/* Central Canônica de Prazos & Conformidades — Design Editorial Unificado (Padrão Estatística BRM) */}
          <div className="rounded-[6px] bg-white dark:bg-[#161b22] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-all">
            
            {/* Header da Seção */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-[6px] bg-[#113240]/5 dark:bg-white/5 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[#226380] shrink-0">
                  <ShieldCheck className="w-6 h-6 text-[#226380]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-cinzel text-xs font-bold tracking-[0.2em] text-[#226380] uppercase">
                      Província BRM
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="text-xs text-[#707070] dark:text-[#86868b] font-mono uppercase tracking-wider">
                      Secretaria Provincial & Economato
                    </span>
                  </div>
                  <h2 className="font-cinzel text-2xl md:text-3xl font-bold tracking-tight text-[#113240] dark:text-white mt-1">
                    Central Canônica de Prazos & Conformidades
                  </h2>
                  <p className="text-xs text-[#707070] dark:text-[#86868b] mt-1 font-sans">
                    Vigilância contínua de seguros prediais e auto, laudos do Corpo de Bombeiros (AVCB), certidões e manutenções preventivas.
                  </p>
                </div>
              </div>

              {/* Filtros de Categoria (Padrão Estatística BRM) */}
              <div className="flex flex-wrap items-center gap-1.5 print:hidden">
                <span className="text-[11px] font-mono uppercase text-[#707070] dark:text-[#86868b] mr-2">Filtrar:</span>
                {[
                  { id: 'todos', label: `Todas (${conformidades.length})` },
                  { id: 'seguros', label: `Seguros (${conformidades.filter(c => c.tipo?.includes('seguro')).length})` },
                  { id: 'bombeiros', label: `AVCB Bombeiros (${conformidades.filter(c => c.tipo === 'avcb').length})` },
                  { id: 'veiculos', label: `Revisões Frota (${conformidades.filter(c => c.tipo?.includes('veic') || c.tipo === 'ipva').length})` },
                  { id: 'contratos', label: `Contratos (${conformidades.filter(c => c.tipo === 'contrato').length})` }
                ].map(sub => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setFiltroConformidade(sub.id as any)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-[6px] border transition-all cursor-pointer motion-press ${
                      filtroConformidade === sub.id
                        ? 'border-[#113240] bg-[#113240] text-white dark:border-white dark:bg-white dark:text-slate-900 font-semibold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-[#226380]/40'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Architectural Ledger Strip (Semáforo Institucional Unificado) */}
            <div className="rounded-[6px] overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 shadow-sm">
              {/* 1. Crítico */}
              <button
                type="button"
                onClick={() => setFiltroNivelConformidade(filtroNivelConformidade === 'critico' ? 'todos' : 'critico')}
                className={`p-5 sm:p-6 text-left flex flex-col justify-between transition-colors cursor-pointer ${
                  filtroNivelConformidade === 'critico'
                    ? 'bg-[#80282E]/10 ring-1 ring-inset ring-[#80282E]'
                    : 'hover:bg-slate-50/70 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#80282E] font-sans flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#80282E]" />
                    Crítico
                  </span>
                  <span className="text-[10px] font-mono text-[#80282E] uppercase font-semibold">Vencido</span>
                </div>
                <div className="mt-3">
                  <span className="font-serif text-3xl sm:text-4xl font-light text-[#80282E] tabular-nums">
                    {contadoresSemaforo.critico}
                  </span>
                  <span className="block text-[11px] text-slate-400 mt-1 font-sans">
                    {contadoresSemaforo.critico === 1 ? 'pendência com ação imediata' : 'pendências com ação imediata'}
                  </span>
                </div>
              </button>

              {/* 2. Urgente */}
              <button
                type="button"
                onClick={() => setFiltroNivelConformidade(filtroNivelConformidade === 'urgente' ? 'todos' : 'urgente')}
                className={`p-5 sm:p-6 text-left flex flex-col justify-between transition-colors cursor-pointer ${
                  filtroNivelConformidade === 'urgente'
                    ? 'bg-[#9E6B28]/10 ring-1 ring-inset ring-[#9E6B28]'
                    : 'hover:bg-slate-50/70 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9E6B28] dark:text-[#F2C894] font-sans flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#9E6B28]" />
                    Urgente
                  </span>
                  <span className="text-[10px] font-mono text-[#9E6B28] dark:text-[#F2C894] uppercase font-semibold">Até 30 dias</span>
                </div>
                <div className="mt-3">
                  <span className="font-serif text-3xl sm:text-4xl font-light text-[#9E6B28] dark:text-[#F2C894] tabular-nums">
                    {contadoresSemaforo.urgente}
                  </span>
                  <span className="block text-[11px] text-slate-400 mt-1 font-sans">
                    {contadoresSemaforo.urgente === 1 ? 'prazo prioritário para renovar' : 'prazos prioritários para renovar'}
                  </span>
                </div>
              </button>

              {/* 3. Atenção */}
              <button
                type="button"
                onClick={() => setFiltroNivelConformidade(filtroNivelConformidade === 'atencao' ? 'todos' : 'atencao')}
                className={`p-5 sm:p-6 text-left flex flex-col justify-between transition-colors cursor-pointer ${
                  filtroNivelConformidade === 'atencao'
                    ? 'bg-[#226380]/15 ring-1 ring-inset ring-[#226380]'
                    : 'hover:bg-slate-50/70 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#226380] dark:text-[#A3C3C7] font-sans flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#226380]" />
                    Atenção
                  </span>
                  <span className="text-[10px] font-mono text-[#226380] dark:text-[#A3C3C7] uppercase font-semibold">31 a 60 dias</span>
                </div>
                <div className="mt-3">
                  <span className="font-serif text-3xl sm:text-4xl font-light text-[#226380] dark:text-[#A3C3C7] tabular-nums">
                    {contadoresSemaforo.atencao}
                  </span>
                  <span className="block text-[11px] text-slate-400 mt-1 font-sans">
                    {contadoresSemaforo.atencao === 1 ? 'alerta para cotação e agenda' : 'alertas para cotação e agenda'}
                  </span>
                </div>
              </button>

              {/* 4. Em Dia */}
              <button
                type="button"
                onClick={() => setFiltroNivelConformidade(filtroNivelConformidade === 'regular' ? 'todos' : 'regular')}
                className={`p-5 sm:p-6 text-left flex flex-col justify-between transition-colors cursor-pointer ${
                  filtroNivelConformidade === 'regular'
                    ? 'bg-slate-100 dark:bg-white/10 ring-1 ring-inset ring-slate-400'
                    : 'hover:bg-slate-50/70 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300 font-sans flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#113240] dark:bg-[#A3C3C7]" />
                    Em Dia
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">&gt; 60 dias</span>
                </div>
                <div className="mt-3">
                  <span className="font-serif text-3xl sm:text-4xl font-light text-slate-950 dark:text-white tabular-nums">
                    {contadoresSemaforo.regular}
                  </span>
                  <span className="block text-[11px] text-slate-400 mt-1 font-sans">
                    {contadoresSemaforo.regular === 1 ? 'registro canônico regular' : 'registros canônicos regulares'}
                  </span>
                </div>
              </button>
            </div>

            {/* Indicador de Filtro Ativo */}
            {(filtroNivelConformidade !== 'todos' || filtroConformidade !== 'todos') && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-mono">
                  Filtrado por: <strong className="text-slate-800 dark:text-slate-200">{filtroNivelConformidade !== 'todos' ? `Nível ${filtroNivelConformidade.toUpperCase()}` : 'Todos os Níveis'}</strong> {filtroConformidade !== 'todos' ? `· Categoria: ${filtroConformidade}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFiltroNivelConformidade('todos');
                    setFiltroConformidade('todos');
                  }}
                  className="text-xs text-[#226380] dark:text-[#A3C3C7] font-semibold hover:underline cursor-pointer"
                >
                  Limpar Filtros
                </button>
              </div>
            )}

            {/* Lista Ledger de Conformidades (Zero AI Card Clutter) */}
            {conformidadesFiltradas.length === 0 ? (
              <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-[6px]">
                <CheckCircle2 className="w-8 h-8 text-[#226380] dark:text-[#A3C3C7] mx-auto opacity-90" />
                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold font-cinzel">
                  Nenhuma pendência localizada com os filtros selecionados.
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Todos os ativos desta categoria encontram-se dentro do padrão de governança da Sede Provincial.
                </p>
              </div>
            ) : (
              <div className="rounded-[6px] overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] shadow-sm divide-y divide-slate-100 dark:border-slate-800/80">
                {conformidadesFiltradas.map(conf => {
                  const isCritico = conf.nivel === 'critico';
                  const isUrgente = conf.nivel === 'urgente';
                  const isAtencao = conf.nivel === 'atencao';
                  const targetId = conf.item_id || conf.entidade_id || conf.id;
                  const targetTipo = conf.entidade_tipo || conf.tipo || 'imovel';
                  const dataRef = conf.data_limite || conf.data_vencimento;
                  const tituloRef = conf.titulo_pendencia || conf.titulo;
                  const descRef = conf.descricao_detalhada || conf.descricao;
                  const catRef = (conf.categoria || conf.tipo || 'geral').toUpperCase();

                  return (
                    <div
                      key={conf.id}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isCritico
                              ? 'bg-[#80282E]/10 text-[#80282E] border border-[#80282E]/30'
                              : isUrgente
                              ? 'bg-[#9E6B28]/10 text-[#9E6B28] dark:text-[#F2C894] border border-[#9E6B28]/30'
                              : isAtencao
                              ? 'bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] border border-[#226380]/30'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}>
                            {isCritico ? 'Crítico · Vencido' : isUrgente ? 'Urgente' : isAtencao ? 'Atenção' : 'Regular'}
                          </span>
                          <span className="text-[11px] font-mono uppercase font-semibold text-slate-500">
                            {catRef}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {tituloRef}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-sans">
                          {descRef}
                        </p>
                        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono flex-wrap">
                          {conf.comunidade_obra && (
                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <MapPin className="w-3 h-3 text-[#226380]" />
                              {conf.comunidade_obra}
                            </span>
                          )}
                          {dataRef && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              Limite: {new Date(dataRef).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {conf.dias_restantes !== undefined && (
                            <span className={`font-semibold ${
                              conf.dias_restantes < 0 ? 'text-[#80282E]' : conf.dias_restantes <= 30 ? 'text-[#9E6B28] dark:text-[#F2C894]' : 'text-slate-500'
                            }`}>
                              {conf.dias_restantes < 0 ? `(${Math.abs(conf.dias_restantes)} dias de atraso)` : `(${conf.dias_restantes} dias restantes)`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/patrimonio/detalhes/${targetTipo}/${targetId}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer motion-press"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#226380]" />
                          <span>Ver Ficha</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/patrimonio/editar/${targetTipo}/${targetId}`)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-[#113240] hover:bg-[#226380] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs motion-press"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Regularizar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: IMÓVEIS & TERRENOS                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'imoveis' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, cidade ou matrícula..."
                className="w-full pl-9 pr-4 py-2 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-[6px] p-0.5 bg-slate-50 dark:bg-slate-900 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-[4px] transition-all cursor-pointer ${
                    viewMode === 'cards' ? 'bg-white dark:bg-slate-800 shadow-xs text-slate-900 dark:text-white' : 'text-slate-400'
                  }`}
                  title="Fichas Cadastrais"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-[4px] transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-white dark:bg-slate-800 shadow-xs text-slate-900 dark:text-white' : 'text-slate-400'
                  }`}
                  title="Tabela Estruturada"
                >
                  <ListFilter className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate('/patrimonio/novo?tipo=imovel')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#113240] text-white hover:bg-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Imóvel</span>
              </button>
            </div>
          </div>

          {viewMode === 'table' ? (
            /* Tabela Estruturada */
            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[6px] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Imóvel & Finalidade</th>
                      <th className="px-4 py-3">Localização</th>
                      <th className="px-4 py-3">Área (Const./Terr.)</th>
                      <th className="px-4 py-3">RGI / Matrícula</th>
                      <th className="px-4 py-3">AVCB Bombeiros</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {imoveisFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                          <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Nenhum imóvel localizado</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Nenhum registro corresponde aos critérios pesquisados.</p>
                        </td>
                      </tr>
                    ) : (
                      imoveisFiltrados.map(im => (
                        <tr key={im.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-slate-900 dark:text-white block">{im.nome}</span>
                            <span className="text-[11px] text-slate-400">{im.tipo}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span>{im.cidade}, {im.uf}</span>
                            <span className="block text-[11px] text-slate-400 truncate max-w-[200px]">{im.endereco || im.comunidade_obra}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">{im.area_construida_m2 ? `${im.area_construida_m2.toLocaleString('pt-BR')} m²` : 'N/I'}</span>
                            <span className="block text-[11px] text-slate-400 font-mono">Terr: {im.area_terreno_m2 ? `${im.area_terreno_m2.toLocaleString('pt-BR')} m²` : 'N/I'}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">{im.numero_matricula || 'Sem matrícula'}</span>
                            <span className={`block text-[10px] font-medium ${im.tem_escritura ? 'text-[#226380] dark:text-[#A3C3C7]' : 'text-[#80282E]'}`}>{im.tem_escritura ? 'Escriturado' : 'Pendente'}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-mono text-[11px]">{im.avcb_vencimento || 'N/A'}</span>
                            <span className="block text-[10px] text-slate-400 truncate max-w-[120px] font-mono">{im.avcb_numero || 'Não informado'}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2.5 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#226380]/10 text-[#113240] dark:text-[#A3C3C7] border border-[#226380]/20">
                              {im.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right space-x-1">
                            <button
                              type="button"
                              onClick={() => navigate(`/patrimonio/detalhes/imovel/${im.id}`)}
                              className="p-1.5 rounded-[4px] text-slate-400 hover:text-[#226380] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="Visualizar Ficha Completa & Documentos"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/patrimonio/editar/imovel/${im.id}`)}
                              className="p-1.5 rounded-[4px] text-slate-400 hover:text-[#226380] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExcluirImovel(im.id, im.nome)}
                              className="p-1.5 rounded-[4px] text-slate-400 hover:text-[#80282E] hover:bg-[#80282E]/10 cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Fichas Cadastrais (Cards Arquitetônicos e Editoriais) */
            imoveisFiltrados.length === 0 ? (
              <div className="bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 rounded-[10px] p-12 text-center space-y-3 shadow-xs">
                <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-cinzel">Nenhum Imóvel Localizado</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Não foram encontradas sedes provinciais ou terrenos cadastrados para os critérios pesquisados.
                </p>
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-xs font-semibold text-[#226380] hover:underline cursor-pointer"
                  >
                    Limpar filtro de busca
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {imoveisFiltrados.map(im => (
                  <div
                    key={im.id}
                    className="bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 rounded-[10px] p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:border-[#226380]/60 transition-all group"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#226380] dark:text-[#A3C3C7]">
                          {im.tipo}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#226380]/10 text-[#113240] dark:text-[#A3C3C7] border border-[#226380]/20">
                          {im.status}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                          {im.nome}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#226380] shrink-0" />
                          <span>{im.cidade}, {im.uf} {im.endereco ? `· ${im.endereco}` : ''}</span>
                        </p>
                      </div>

                      {/* Dados Técnicos Notariais & Físicos */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Área Construída</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">
                            {im.area_construida_m2 ? `${im.area_construida_m2.toLocaleString('pt-BR')} m²` : 'Não informada'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Matrícula (RGI)</span>
                          <span className="font-mono text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                            {im.numero_matricula || 'Sem matrícula'}
                          </span>
                        </div>
                        {im.avcb_vencimento && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Vigência AVCB</span>
                            <span className="text-[11px] font-medium text-[#9E6B28] dark:text-[#F2C894] flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" />
                              {im.avcb_vencimento}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/patrimonio/detalhes/imovel/${im.id}`)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#113240] dark:text-[#A3C3C7] hover:text-[#226380] transition-colors cursor-pointer group/link"
                      >
                        <span>Ficha & Documentos</span>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/patrimonio/editar/imovel/${im.id}`)}
                          className="p-1.5 rounded-[4px] text-slate-400 hover:text-[#226380] hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          title="Editar imóvel"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExcluirImovel(im.id, im.nome)}
                          className="p-1.5 rounded-[4px] text-slate-400 hover:text-[#80282E] hover:bg-[#80282E]/10 cursor-pointer"
                          title="Excluir imóvel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: FROTA VEICULAR                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'veiculos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar veículo por modelo, placa ou comunidade..."
                className="w-full pl-9 pr-4 py-2 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={() => navigate('/patrimonio/novo?tipo=veiculo')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#113240] text-white hover:bg-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Veículo</span>
            </button>
          </div>

          {veiculosFiltrados.length === 0 ? (
            <div className="bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 rounded-[10px] p-12 text-center space-y-3 shadow-xs">
              <Car className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-cinzel">Nenhum Veículo Localizado</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Não foram encontrados veículos cadastrados na frota provincial para os termos pesquisados.
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-xs font-semibold text-[#226380] hover:underline cursor-pointer"
                >
                  Limpar filtro de busca
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {veiculosFiltrados.map(v => (
                <div
                  key={v.id}
                  className="bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 rounded-[10px] p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:border-[#226380]/60 transition-all group"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      {/* Placa Mercosul Estilizada */}
                      <div className="inline-flex flex-col border border-slate-300 dark:border-slate-700 rounded-[4px] overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                        <div className="bg-[#113240] px-2.5 py-0.5 flex items-center justify-between gap-1.5 text-[7px] text-white font-bold tracking-wider">
                          <span>BRASIL</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F2C894]" />
                        </div>
                        <div className="px-2.5 py-0.5 text-center font-mono font-black text-xs tracking-widest text-slate-900 dark:text-white">
                          {v.placa}
                        </div>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#226380]/10 text-[#113240] dark:text-[#A3C3C7] border border-[#226380]/20">
                        {v.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                        {v.marca_modelo}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Alocação: <span className="text-slate-800 dark:text-slate-200 font-medium">{v.comunidade_obra}</span>
                      </p>
                      {v.responsavel_nome && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Condutor: {v.responsavel_nome}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Odômetro Atual</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">
                          {v.quilometragem_atual.toLocaleString('pt-BR')} km
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Seguro Vigência</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">
                          {v.seguro_vencimento || 'Não informado'}
                        </span>
                      </div>
                      {v.seguro_seguradora && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 truncate max-w-[140px]">{v.seguro_seguradora}</span>
                          {v.seguro_contato_emergencia && (
                            <span className="text-[#226380] dark:text-[#A3C3C7] font-medium">{v.seguro_contato_emergencia}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/patrimonio/detalhes/veiculo/${v.id}`)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#113240] dark:text-[#A3C3C7] hover:text-[#226380] transition-colors cursor-pointer group/link"
                    >
                      <span>Ficha & Documentos</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => navigate(`/patrimonio/editar/veiculo/${v.id}`)}
                        className="p-1.5 rounded-[4px] text-slate-400 hover:text-[#226380] hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        title="Editar veículo"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluirVeiculo(v.id, v.marca_modelo, v.placa)}
                        className="p-1.5 rounded-[4px] text-slate-400 hover:text-[#80282E] hover:bg-[#80282E]/10 cursor-pointer"
                        title="Excluir veículo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: INVENTÁRIO SACRO & BENS HISTÓRICOS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'inventario' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por código de tombamento, denominação ou comunidade..."
                className="w-full pl-9 pr-4 py-2 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={() => navigate('/patrimonio/novo?tipo=bem')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#113240] text-white hover:bg-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tombar Novo Item</span>
            </button>
          </div>

          <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[6px] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Código Tombo</th>
                    <th className="px-4 py-3">Denominação / Objeto</th>
                    <th className="px-4 py-3">Classificação</th>
                    <th className="px-4 py-3">Comunidade / Local</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Avaliação Est.</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bensFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Nenhum item do acervo sacro localizado</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Não foram encontrados bens históricos ou alfaias sagradas para os critérios pesquisados.</p>
                      </td>
                    </tr>
                  ) : (
                    bensFiltrados.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-1 rounded-[4px] font-mono text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[#113240] dark:text-[#A3C3C7] shadow-2xs tracking-wider inline-block">
                            {b.codigo_tombamento}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-900 dark:text-white block">{b.titulo}</span>
                          <span className="text-[11px] text-slate-400">
                            {b.autor_escola ? `${b.autor_escola} · ` : ''}{b.origem_procedencia || 'Procedência documentada'}{b.ano_aquisicao ? ` (${b.ano_aquisicao})` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{b.categoria}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-slate-800 dark:text-slate-200 font-medium">{b.comunidade_obra}</span>
                          <span className="block text-[11px] text-slate-400">{b.localizacao_especifica || 'Local designado'}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded-[4px] text-[11px] border font-medium ${
                            b.estado_conservacao === 'Excelente' ? 'bg-[#113240]/10 text-[#113240] dark:text-[#A3C3C7] border-[#113240]/20' :
                            b.estado_conservacao === 'Bom' ? 'bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] border-[#226380]/20' :
                            b.estado_conservacao === 'Regular' ? 'bg-[#9E6B28]/10 text-[#9E6B28] dark:text-[#F2C894] border-[#9E6B28]/20' :
                            'bg-[#80282E]/10 text-[#80282E] border-[#80282E]/20'
                          }`}>
                            {b.estado_conservacao}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium font-mono text-slate-900 dark:text-white">
                          {b.valor_estimado ? `R$ ${b.valor_estimado.toLocaleString('pt-BR')}` : 'Sob avaliação'}
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/patrimonio/detalhes/bem/${b.id}`)}
                            className="p-1.5 rounded-[4px] text-slate-400 hover:text-[#226380] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Visualizar Ficha Completa & Documentos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/patrimonio/editar/bem/${b.id}`)}
                            className="p-1.5 rounded-[4px] text-slate-400 hover:text-[#226380] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluirBem(b.id, b.titulo, b.codigo_tombamento)}
                            className="p-1.5 rounded-[4px] text-slate-400 hover:text-[#80282E] hover:bg-[#80282E]/10 cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 5: CONTRATOS & SEGUROS                                                */}
      {/* ========================================================================= */}
      {activeTab === 'contratos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar contrato ou prestador de serviço..."
                className="w-full pl-9 pr-4 py-2 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={() => navigate('/patrimonio/novo?tipo=contrato')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#113240] text-white hover:bg-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Contrato</span>
            </button>
          </div>

          {contratosFiltrados.length === 0 ? (
            <div className="bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 rounded-[10px] p-12 text-center space-y-3 shadow-xs">
              <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-cinzel">Nenhum Contrato Localizado</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Não foram encontrados contratos ou apólices vigentes para os critérios de busca informados.
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-xs font-semibold text-[#226380] hover:underline cursor-pointer"
                >
                  Limpar filtro de busca
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {contratosFiltrados.map(c => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 rounded-[10px] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:border-[#226380]/60 transition-all group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#226380]/10 text-[#113240] dark:text-[#A3C3C7] border border-[#226380]/20">
                        {c.status}
                      </span>
                      <span className="text-xs text-[#226380] dark:text-[#A3C3C7] font-medium">{c.tipo}</span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {c.titulo}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Fornecedor / Prestador: <span className="font-medium text-slate-900 dark:text-white">{c.fornecedor_prestador}</span>
                      {c.contato_telefone && ` · Tel: ${c.contato_telefone}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-xs shrink-0">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Vigência Legal</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
                        {c.data_inicio} até {c.data_fim}
                      </span>
                    </div>

                    {c.valor_anual && (
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Valor Anual</span>
                        <span className="font-semibold text-slate-900 dark:text-white text-sm font-mono">
                          R$ {c.valor_anual.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/patrimonio/detalhes/contrato/${c.id}`)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#113240] dark:text-[#A3C3C7] hover:text-[#226380] transition-colors cursor-pointer group/link px-2 py-1"
                      >
                        <span>Ficha & Documentos</span>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/patrimonio/editar/contrato/${c.id}`)}
                        className="p-1.5 rounded-[4px] text-slate-400 hover:text-[#226380] hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluirContrato(c.id, c.titulo)}
                        className="p-1.5 rounded-[4px] text-slate-400 hover:text-[#80282E] hover:bg-[#80282E]/10 cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 6: VISTORIAS & MANUTENÇÕES                                            */}
      {/* ========================================================================= */}
      {activeTab === 'manutencoes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar chamados ou vistorias..."
                className="w-full pl-9 pr-4 py-2 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={() => navigate('/patrimonio/novo?tipo=vistoria')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#113240] text-white hover:bg-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Vistoria</span>
            </button>
          </div>

          {manutencoesFiltrados.length === 0 ? (
            <div className="bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 rounded-[10px] p-12 text-center space-y-3 shadow-xs">
              <Wrench className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-cinzel">Nenhuma Vistoria Localizada</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Não foram registradas vistorias prediais ou chamados técnicos com os critérios selecionados.
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-xs font-semibold text-[#226380] hover:underline cursor-pointer"
                >
                  Limpar filtro de busca
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {manutencoesFiltrados.map(m => (
                <div
                  key={m.id}
                  className="bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 rounded-[10px] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:border-[#226380]/60 transition-all group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#9E6B28]/10 text-[#9E6B28] dark:text-[#F2C894] border border-[#9E6B28]/20">
                        {m.status}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-[4px] text-[11px] font-medium ${
                        m.prioridade === 'Urgente'
                          ? 'bg-[#80282E]/10 text-[#80282E] border border-[#80282E]/20'
                          : 'bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] border border-[#226380]/20'
                      }`}>
                        Prioridade {m.prioridade}
                      </span>
                      <span className="text-xs text-slate-400">{m.tipo}</span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {m.titulo}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {m.descricao}
                    </p>

                    <p className="text-xs text-slate-500 pt-0.5">
                      Comunidade: <span className="text-slate-800 dark:text-slate-200 font-medium">{m.comunidade_obra}</span> · Responsável: {m.responsavel_vistoria || 'Setor de Patrimônio'}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-xs shrink-0">
                    {m.custo_estimado && (
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Custo Estimado</span>
                        <span className="font-semibold text-slate-900 dark:text-white text-sm font-mono">
                          R$ {m.custo_estimado.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/patrimonio/detalhes/vistoria/${m.id}`)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#113240] dark:text-[#A3C3C7] hover:text-[#226380] transition-colors cursor-pointer group/link px-2 py-1"
                      >
                        <span>Ficha & Documentos</span>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/patrimonio/editar/vistoria/${m.id}`)}
                        className="p-1.5 rounded-[4px] text-slate-400 hover:text-[#226380] hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluirManutencao(m.id, m.titulo)}
                        className="p-1.5 rounded-[4px] text-slate-400 hover:text-[#80282E] hover:bg-[#80282E]/10 cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 7: TRILHA DE AUDITORIA & LOG DE REGISTROS                           */}
      {/* ========================================================================= */}
      {activeTab === 'auditoria' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header da Trilha de Auditoria */}
          <div className="rounded-[10px] bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#226380] dark:bg-[#A3C3C7]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#226380] dark:text-[#A3C3C7]">
                    Governança & Rastreabilidade Notarial
                  </span>
                </div>
                <h2 className="font-cinzel text-xl md:text-2xl font-bold tracking-tight text-[#113240] dark:text-white mt-1">
                  Trilha de Auditoria & Registro de Atos
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Registro contínuo e imutável de todas as inclusões, retificações e baixas realizadas no patrimônio provincial, identificando data, operador e valores modificados.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={carregarDados}
                  disabled={syncing}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[6px] shadow-xs cursor-pointer transition-all motion-press"
                  title="Atualizar lista de logs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#226380] ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Atualizando...' : 'Recarregar'}</span>
                </button>
              </div>
            </div>

            {/* Métricas da Auditoria */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
              <div className="p-3.5 rounded-[8px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block">Total de Atos</span>
                <span className="text-xl sm:text-2xl font-cinzel font-bold text-[#113240] dark:text-white tabular-nums">
                  {auditLogs.length}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Eventos auditados</span>
              </div>

              <div className="p-3.5 rounded-[8px] bg-[#226380]/5 border border-[#226380]/20">
                <span className="text-[11px] text-[#226380] dark:text-[#A3C3C7] font-medium block">Incorporações</span>
                <span className="text-xl sm:text-2xl font-cinzel font-bold text-[#226380] dark:text-[#A3C3C7] tabular-nums">
                  {auditLogs.filter(l => l.action === 'INSERT').length}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Novos registros (INSERT)</span>
              </div>

              <div className="p-3.5 rounded-[8px] bg-[#9E6B28]/5 border border-[#9E6B28]/20">
                <span className="text-[11px] text-[#9E6B28] dark:text-[#F2C894] font-medium block">Retificações</span>
                <span className="text-xl sm:text-2xl font-cinzel font-bold text-[#9E6B28] dark:text-[#F2C894] tabular-nums">
                  {auditLogs.filter(l => l.action === 'UPDATE').length}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Alterações cadastrais (UPDATE)</span>
              </div>

              <div className="p-3.5 rounded-[8px] bg-[#80282E]/5 border border-[#80282E]/20">
                <span className="text-[11px] text-[#80282E] dark:text-[#F2C894] font-medium block">Baixas / Exclusões</span>
                <span className="text-xl sm:text-2xl font-cinzel font-bold text-[#80282E] tabular-nums">
                  {auditLogs.filter(l => l.action === 'DELETE').length}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Desincorporações (DELETE)</span>
              </div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchAudit}
                onChange={(e) => setSearchAudit(e.target.value)}
                placeholder="Filtrar por nome do ativo, operador ou e-mail..."
                className="w-full pl-9 pr-4 py-2 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro por Entidade */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 text-[11px] hidden sm:inline">Entidade:</span>
                <select
                  value={filtroAuditEntidade}
                  onChange={(e) => setFiltroAuditEntidade(e.target.value)}
                  className="px-2.5 py-1.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-[#226380] cursor-pointer"
                >
                  <option value="todas">Todas as Entidades</option>
                  <option value="imoveis">Imóveis & Terrenos</option>
                  <option value="veiculos">Frota de Veículos</option>
                  <option value="bens">Inventário Sacro</option>
                  <option value="contratos">Contratos & Seguros</option>
                  <option value="manutencoes">Vistorias & Obras</option>
                  <option value="documentos">Gestão Documental</option>
                </select>
              </div>

              {/* Filtro por Ação */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 text-[11px] hidden sm:inline">Ação:</span>
                <select
                  value={filtroAuditAcao}
                  onChange={(e) => setFiltroAuditAcao(e.target.value)}
                  className="px-2.5 py-1.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-[#226380] cursor-pointer"
                >
                  <option value="todas">Todas as Ações</option>
                  <option value="INSERT">Inclusões (INSERT)</option>
                  <option value="UPDATE">Retificações (UPDATE)</option>
                  <option value="DELETE">Exclusões (DELETE)</option>
                  <option value="DOWNLOAD">Downloads de Documentos</option>
                </select>
              </div>

              {(searchAudit || filtroAuditEntidade !== 'todas' || filtroAuditAcao !== 'todas') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchAudit('');
                    setFiltroAuditEntidade('todas');
                    setFiltroAuditAcao('todas');
                  }}
                  className="px-2.5 py-1.5 text-xs text-[#80282E] hover:underline cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Tabela Estruturada de Auditoria */}
          {logsFiltrados.length === 0 ? (
            <div className="p-12 text-center rounded-[10px] bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 space-y-3">
              <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-cinzel text-sm font-semibold text-slate-800 dark:text-slate-200">
                Nenhum registro de auditoria encontrado
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Não foram localizados eventos correspondentes aos filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="rounded-[10px] bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-[11px] uppercase tracking-wider font-cinzel">
                    <tr>
                      <th className="px-4 py-3">Data / Hora</th>
                      <th className="px-4 py-3">Ação</th>
                      <th className="px-4 py-3">Entidade & Ativo</th>
                      <th className="px-4 py-3">Operador Responsável</th>
                      <th className="px-4 py-3 text-right">Inspecionar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {logsFiltrados.map((log) => {
                      const isInsert = log.action === 'INSERT';
                      const isUpdate = log.action === 'UPDATE';
                      const isDelete = log.action === 'DELETE';

                      const EntidadeIcon = (
                        log.entity === 'imoveis' ? Building2 :
                        log.entity === 'veiculos' ? Car :
                        log.entity === 'bens' ? Package :
                        log.entity === 'contratos' ? ShieldCheck :
                        log.entity === 'manutencoes' ? Wrench : FileText
                      );

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <div>
                                <span className="font-mono text-xs text-slate-900 dark:text-white font-medium block">
                                  {new Date(log.created_at).toLocaleDateString('pt-BR')}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400 block">
                                  {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${
                              isInsert
                                ? 'bg-[#226380]/15 text-[#226380] dark:text-[#A3C3C7] border border-[#226380]/30'
                                : isUpdate
                                ? 'bg-[#9E6B28]/15 text-[#9E6B28] dark:text-[#F2C894] border border-[#9E6B28]/30'
                                : isDelete
                                ? 'bg-[#80282E]/15 text-[#80282E] border border-[#80282E]/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200'
                            }`}>
                              {isInsert ? 'Incorporação' : isUpdate ? 'Retificação' : isDelete ? 'Baixa' : log.action}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-[5px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#226380] shrink-0 mt-0.5">
                                <EntidadeIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-xs text-slate-900 dark:text-white block truncate">
                                  {log.entity_nome || 'Registro não nomeado'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 block truncate">
                                  {log.entity.toUpperCase()} · ID: {log.entity_id}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div>
                              <span className="font-medium text-xs text-slate-800 dark:text-slate-200 block">
                                {log.user_nome || 'Operador BRM'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono block">
                                {log.user_email || 'sistema.interno'}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setLogSelecionado(log)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs motion-press"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#226380]" />
                              <span>Ver Registro</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalhamento do Registro de Auditoria */}
      {logSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#226380]/10 border border-[#226380]/30 flex items-center justify-center text-[#226380]">
                  <ScrollText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cinzel text-base font-bold text-slate-900 dark:text-white">
                    Certidão Notarial do Evento de Auditoria
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    Protocolo: {logSelecionado.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLogSelecionado(null)}
                className="p-1 rounded-[4px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {/* Metadados */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-[6px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ação Executada</span>
                  <span className="font-bold text-slate-800 dark:text-white text-xs">
                    {logSelecionado.action === 'INSERT' ? 'Incorporação (INSERT)' :
                     logSelecionado.action === 'UPDATE' ? 'Retificação (UPDATE)' :
                     logSelecionado.action === 'DELETE' ? 'Baixa (DELETE)' : logSelecionado.action}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Entidade</span>
                  <span className="font-medium text-slate-800 dark:text-white text-xs capitalize">
                    {logSelecionado.entity}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Data & Hora</span>
                  <span className="font-mono text-slate-800 dark:text-white text-xs">
                    {new Date(logSelecionado.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Operador</span>
                  <span className="font-medium text-slate-800 dark:text-white text-xs">
                    {logSelecionado.user_nome || 'Não identificado'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">E-mail do Operador</span>
                  <span className="font-mono text-slate-800 dark:text-white text-xs truncate block">
                    {logSelecionado.user_email || 'sistema.interno'}
                  </span>
                </div>
              </div>

              {/* Ativo Afetado */}
              <div className="p-3.5 rounded-[6px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Ativo Provincial</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                  {logSelecionado.entity_nome || 'Registro não nomeado'}
                </span>
                <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                  ID do Registro: {logSelecionado.entity_id}
                </span>
              </div>

              {/* Conteúdo Modificado / Payload */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  {logSelecionado.action === 'UPDATE' ? 'Dados Anteriores vs Novos Valores' : 'Payload Registrado'}
                </span>

                {logSelecionado.action === 'UPDATE' && logSelecionado.old_values && logSelecionado.new_values ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 pb-1 border-b border-slate-200 dark:border-slate-800">
                        Valores Anteriores
                      </span>
                      <pre className="text-[11px] font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {JSON.stringify(logSelecionado.old_values, null, 2)}
                      </pre>
                    </div>

                    <div className="p-3 rounded-[6px] border border-[#226380]/30 bg-[#226380]/5">
                      <span className="text-[11px] font-semibold text-[#226380] dark:text-[#A3C3C7] block mb-1.5 pb-1 border-b border-[#226380]/20">
                        Novos Valores Gravados
                      </span>
                      <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {JSON.stringify(logSelecionado.new_values, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {JSON.stringify(logSelecionado.new_values || logSelecionado.old_values || {}, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setLogSelecionado(null)}
                className="px-4 py-2 text-xs font-semibold bg-[#113240] text-white hover:bg-[#226380] rounded-[6px] cursor-pointer transition-colors shadow-xs"
              >
                Concluir Inspeção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Rodapé Institucional do Economato Provincial */}
      <footer className="mt-12 pt-6 border-t border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 print:hidden space-y-2 select-none">
        <p className="tracking-wide font-medium">
          sistema.brm.org - todos os direitos reservados-2026
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">
          Secretaria Provincial · Economato Provincial · Sede Provincial (Corupá / SC) · Livro de Tombo e Gestão de Patrimônio
        </p>
      </footer>

      {/* 5. Modal de Mediação Humana de Conflitos */}
      {modalConflito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-fade-in">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-[#80282E]/10 border border-[#80282E]/30 flex items-center justify-center text-[#80282E]">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cinzel text-base font-bold text-slate-900 dark:text-white">
                    Mediação de Conflito de Integridade
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tabela: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{modalConflito.tabela}</span> · Operação: {modalConflito.operacao}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalConflito(null)}
                className="p-1 rounded-[4px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              O registro foi alterado simultaneamente no servidor central da Província e na sessão de contingência local. Selecione a política de reconciliação canônica:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block border-b border-slate-200 dark:border-slate-800 pb-1">
                  Versão do Servidor (Supabase)
                </span>
                <pre className="text-[11px] font-mono text-slate-600 dark:text-slate-400 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {JSON.stringify(modalConflito.dados_conflito?.servidor || modalConflito.payload, null, 2)}
                </pre>
              </div>

              <div className="p-3.5 rounded-[6px] border border-[#9E6B28]/30 bg-[#9E6B28]/5 space-y-2">
                <span className="font-semibold text-[#9E6B28] dark:text-[#F2C894] block border-b border-[#9E6B28]/20 pb-1">
                  Versão Local (Contingência)
                </span>
                <pre className="text-[11px] font-mono text-slate-600 dark:text-slate-400 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {JSON.stringify(modalConflito.dados_conflito?.local || modalConflito.payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleResolverConflito(modalConflito.id, 'servidor')}
                className="w-full sm:w-auto px-4 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[6px] cursor-pointer"
              >
                Manter Versão do Servidor
              </button>

              <button
                type="button"
                onClick={() => handleResolverConflito(modalConflito.id, 'mesclar')}
                className="w-full sm:w-auto px-4 py-2 text-xs font-medium border border-[#226380] text-[#226380] dark:text-[#A3C3C7] bg-[#226380]/10 hover:bg-[#226380]/20 rounded-[6px] cursor-pointer"
              >
                Mesclar Registros
              </button>

              <button
                type="button"
                onClick={() => handleResolverConflito(modalConflito.id, 'local')}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold bg-[#113240] text-white hover:bg-[#226380] rounded-[6px] cursor-pointer shadow-sm"
              >
                Sobrescrever com Local
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatrimonioAdmin;
