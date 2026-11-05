import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Archive,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Folder,
  FolderClosed,
  FolderOpen,
  Home,
  LayoutGrid,
  List,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../hooks/useFeedback';
import { atribuirNomeReligioso, formatarComunidadeReligiosa, padronizarSufixoSCJ } from '../lib/religiosoNome';

export interface DossierFolder {
  id: string;
  nome_civil: string;
  nome_religioso: string | null;
  nome_elenco: string | null;
  grau: string | null;
  etapa_formativa_atual?: string | null;
  ano_configuracao?: number | string | null;
  ano_referencia_etapa?: number | string | null;
  status_cadastro: string;
  numero_cadastro: number | null;
  created_at: string;
  comunidade_atual_nome?: string | null;
  obra_atual_nome?: string | null;
  foto_url?: string | null;
  situacao_elenco?: string | null;
  total_documentos?: number;
}

type CategoriaFiltro = 'all' | 'configuracao' | 'tirocinio' | 'padres' | 'diaconos' | 'bispos' | 'em_revisao' | 'aprovados';
type ModoVisualizacao = 'grid' | 'table';
type Ordenacao = 'numero_asc' | 'numero_desc' | 'nome_asc' | 'comunidade_asc' | 'recentes' | 'status';

const formatRegistrationNumber = (number?: number | null, createdAt?: string | null) => {
  const year = createdAt ? new Date(createdAt).getFullYear() : 2026;
  if (number) {
    return `BRM-${year}-${String(number).padStart(6, '0')}`;
  }
  return `BRM-${year}-PROV`;
};

const statusConfig: Record<string, { label: string; badge: string; icon: React.FC<{ className?: string }> }> = {
  Aprovado: {
    label: 'Aprovado',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  'Em revisão': {
    label: 'Em revisão',
    badge: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300',
    icon: Clock,
  },
  'Em verificação': {
    label: 'Em verificação',
    badge: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/40 dark:bg-sky-950/30 dark:text-sky-300',
    icon: FileText,
  },
  'Aguardando complementação': {
    label: 'Complementação',
    badge: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800/40 dark:bg-orange-950/30 dark:text-orange-300',
    icon: Clock,
  },
  Recusado: {
    label: 'Recusado',
    badge: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/40 dark:bg-rose-950/30 dark:text-rose-300',
    icon: X,
  },
  Arquivado: {
    label: 'Arquivado',
    badge: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
    icon: Archive,
  },
};

export const ReligiososDossies: React.FC = () => {
  const navigate = useNavigate();

  const [folders, setFolders] = useState<DossierFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [recarregando, setRecarregando] = useState(false);

  // Estados do Explorer / Nextcloud
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaFiltro>('all');
  const [query, setQuery] = useState('');
  const [modoVisualizacao, setModoVisualizacao] = useState<ModoVisualizacao>('grid');
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('numero_asc');

  // Carrega os dados combinados de religiosos e quantidade de documentos arquivados
  const carregarDossies = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRecarregando(true);
    else setLoading(true);

    try {
      const [{ data: relData, error: relErr }, { data: secDocsData }, { data: relDocsData }] = await Promise.all([
        supabase
          .from('religiosos')
          .select('id,nome_civil,nome_religioso,nome_elenco,grau,etapa_formativa_atual,ano_configuracao,ano_referencia_etapa,status_cadastro,numero_cadastro,created_at,comunidade_atual_nome,obra_atual_nome,foto_url,situacao_elenco')
          .order('numero_cadastro', { ascending: true }),
        supabase
          .from('secretaria_dossie_documentos')
          .select('religioso_id'),
        supabase
          .from('religiosos_documentos')
          .select('religioso_id')
          .eq('status', 'Ativo'),
      ]);

      if (relErr) throw relErr;

      // Monta mapa de contagem de documentos por pasta
      const countMap = new Map<string, number>();
      (secDocsData || []).forEach((d: any) => {
        if (d.religioso_id) {
          countMap.set(d.religioso_id, (countMap.get(d.religioso_id) || 0) + 1);
        }
      });
      (relDocsData || []).forEach((d: any) => {
        if (d.religioso_id) {
          countMap.set(d.religioso_id, (countMap.get(d.religioso_id) || 0) + 1);
        }
      });

      const processed: DossierFolder[] = (relData || []).map((r: any) => ({
        id: r.id,
        nome_civil: r.nome_civil,
        nome_religioso: r.nome_religioso,
        nome_elenco: r.nome_elenco,
        grau: r.grau,
        etapa_formativa_atual: r.etapa_formativa_atual,
        ano_configuracao: r.ano_configuracao,
        ano_referencia_etapa: r.ano_referencia_etapa,
        status_cadastro: r.status_cadastro || 'Em revisão',
        numero_cadastro: r.numero_cadastro,
        created_at: r.created_at,
        comunidade_atual_nome: r.comunidade_atual_nome,
        obra_atual_nome: r.obra_atual_nome,
        foto_url: r.foto_url,
        situacao_elenco: r.situacao_elenco,
        total_documentos: countMap.get(r.id) || 0,
      }));

      setFolders(processed);
    } catch (err: any) {
      console.error('Erro ao carregar dossiês:', err);
      showToast.error(`Não foi possível carregar as pastas dos dossiês: ${err.message || 'Falha de conexão'}`);
    } finally {
      setLoading(false);
      setRecarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarDossies();
  }, [carregarDossies]);

  // Contagens para os cards de pastas do Nextcloud
  const statsCategorias = useMemo(() => {
    let configuracao = 0;
    let tirocinio = 0;
    let fratres = 0;
    let padres = 0;
    let diaconos = 0;
    let bispos = 0;
    let emRevisao = 0;
    let aprovados = 0;
    let totalDocs = 0;

    folders.forEach(f => {
      const grau = (f.grau || '').toLowerCase();
      const etapa = (f.etapa_formativa_atual || '').toLowerCase();
      const com = (f.comunidade_atual_nome || '').toLowerCase();

      if (grau.includes('frater')) {
        fratres++;
        if (etapa.includes('tiroc') || (!etapa && com && !com.includes('conventinho'))) {
          tirocinio++;
        } else {
          configuracao++;
        }
      }
      else if (grau.includes('bispo') || grau.includes('dom')) bispos++;
      else if (grau.includes('diác') || grau.includes('diac')) diaconos++;
      else if (grau.includes('padre') || grau.includes('presb') || grau.includes('pe.')) padres++;

      const st = f.status_cadastro;
      if (st === 'Aprovado') aprovados++;
      else if (st === 'Em revisão' || st === 'Em verificação' || st === 'Aguardando complementação') emRevisao++;

      totalDocs += f.total_documentos || 0;
    });

    return {
      total: folders.length,
      configuracao,
      tirocinio,
      fratres,
      padres,
      diaconos,
      bispos,
      emRevisao,
      aprovados,
      totalDocs,
    };
  }, [folders]);

  // Filtragem e ordenação
  const filteredFolders = useMemo(() => {
    let list = folders;

    // Filtro por pasta / categoria
    if (categoriaAtiva === 'configuracao') {
      list = list.filter(f => {
        const g = (f.grau || '').toLowerCase();
        if (!g.includes('frater')) return false;
        const e = (f.etapa_formativa_atual || '').toLowerCase();
        const c = (f.comunidade_atual_nome || '').toLowerCase();
        return e.includes('configura') || (!e && (!c || c.includes('conventinho')));
      });
    } else if (categoriaAtiva === 'tirocinio') {
      list = list.filter(f => {
        const g = (f.grau || '').toLowerCase();
        if (!g.includes('frater')) return false;
        const e = (f.etapa_formativa_atual || '').toLowerCase();
        const c = (f.comunidade_atual_nome || '').toLowerCase();
        return e.includes('tiroc') || (!e && c && !c.includes('conventinho'));
      });
    } else if (categoriaAtiva === 'padres') {
      list = list.filter(f => {
        const g = (f.grau || '').toLowerCase();
        return g.includes('padre') || g.includes('presb') || g.includes('pe.');
      });
    } else if (categoriaAtiva === 'diaconos') {
      list = list.filter(f => {
        const g = (f.grau || '').toLowerCase();
        return g.includes('diác') || g.includes('diac');
      });
    } else if (categoriaAtiva === 'bispos') {
      list = list.filter(f => {
        const g = (f.grau || '').toLowerCase();
        return g.includes('bispo') || g.includes('dom');
      });
    } else if (categoriaAtiva === 'em_revisao') {
      list = list.filter(f => ['Em revisão', 'Em verificação', 'Aguardando complementação'].includes(f.status_cadastro));
    } else if (categoriaAtiva === 'aprovados') {
      list = list.filter(f => f.status_cadastro === 'Aprovado');
    }

    // Filtro por busca de texto
    const term = query.trim().toLowerCase();
    if (term) {
      list = list.filter(f => {
        const reg = formatRegistrationNumber(f.numero_cadastro, f.created_at).toLowerCase();
        const civil = (f.nome_civil || '').toLowerCase();
        const rel = (f.nome_religioso || '').toLowerCase();
        const elenco = (f.nome_elenco || '').toLowerCase();
        const grau = (f.grau || '').toLowerCase();
        const com = (f.comunidade_atual_nome || '').toLowerCase();
        const status = (f.status_cadastro || '').toLowerCase();
        const etapa = (f.etapa_formativa_atual || '').toLowerCase();
        const anoCfg = f.ano_configuracao ? `${f.ano_configuracao} ano` : '';
        const isTiroc = etapa.includes('tiroc') || (!etapa && com && !com.includes('conventinho'));

        return (
          reg.includes(term) ||
          civil.includes(term) ||
          rel.includes(term) ||
          elenco.includes(term) ||
          grau.includes(term) ||
          com.includes(term) ||
          status.includes(term) ||
          etapa.includes(term) ||
          anoCfg.includes(term) ||
          (isTiroc && 'tirocínio'.includes(term))
        );
      });
    }

    // Ordenação
    return [...list].sort((a, b) => {
      switch (ordenacao) {
        case 'numero_desc':
          return (b.numero_cadastro || 0) - (a.numero_cadastro || 0);
        case 'nome_asc': {
          const nomeA = a.nome_religioso || a.nome_civil;
          const nomeB = b.nome_religioso || b.nome_civil;
          return nomeA.localeCompare(nomeB, 'pt-BR');
        }
        case 'comunidade_asc': {
          const comA = a.comunidade_atual_nome || '';
          const comB = b.comunidade_atual_nome || '';
          return comA.localeCompare(comB, 'pt-BR');
        }
        case 'recentes':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'status':
          return (a.status_cadastro || '').localeCompare(b.status_cadastro || '', 'pt-BR');
        case 'numero_asc':
        default:
          return (a.numero_cadastro || 999999) - (b.numero_cadastro || 999999);
      }
    });
  }, [folders, categoriaAtiva, query, ordenacao]);

  const nomeCategoriaAtual = useMemo(() => {
    switch (categoriaAtiva) {
      case 'configuracao': return 'Fratres na Configuração (Teologia)';
      case 'tirocinio': return 'Fratres no Tirocínio';
      case 'padres': return 'Padres & Presbíteros';
      case 'diaconos': return 'Diáconos';
      case 'bispos': return 'Bispos & Prelados';
      case 'em_revisao': return 'Dossiês em Revisão';
      case 'aprovados': return 'Dossiês Aprovados';
      case 'all':
      default: return 'Todas as Pastas';
    }
  }, [categoriaAtiva]);

  return (
    <main className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* 1. Header do Arquivo Provincial estilo Nextcloud */}
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#11161d]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#226380] dark:text-[#A3C3C7]">
              <Archive className="h-4 w-4" />
              Chancelaria & Arquivo Provincial · Província BRM
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Dossiês Pessoais dos Religiosos
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-slate-500 dark:text-slate-400">
              Gerenciador de pastas canônicas individuais. Acesse os dossiês, certidões, trajetórias formativas e arquivos digitais.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
              <FolderClosed className="h-4 w-4 text-[#226380] dark:text-[#A3C3C7]" />
              <strong>{folders.length}</strong> pastas
            </span>

            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
              <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <strong>{statsCategorias.totalDocs}</strong> documentos
            </span>

            <button
              type="button"
              onClick={() => carregarDossies(true)}
              disabled={recarregando || loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              title="Atualizar acervo"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${recarregando ? 'animate-spin text-[#226380]' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>

        {/* 2. Breadcrumbs Bar no estilo Nextcloud */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3.5 text-xs text-slate-500 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setCategoriaAtiva('all');
              setQuery('');
            }}
            className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-[#226380] dark:text-slate-300 dark:hover:text-[#A3C3C7]"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Arquivo Geral</span>
          </button>

          <ChevronRight className="h-3 w-3 text-slate-400" />

          <button
            type="button"
            onClick={() => setCategoriaAtiva('all')}
            className={`font-semibold transition ${
              categoriaAtiva === 'all'
                ? 'text-[#226380] dark:text-[#A3C3C7]'
                : 'text-slate-700 hover:text-[#226380] dark:text-slate-300 dark:hover:text-[#A3C3C7]'
            }`}
          >
            Dossiês Pessoais
          </button>

          {categoriaAtiva !== 'all' && (
            <>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="font-bold text-[#226380] dark:text-[#A3C3C7]">
                {nomeCategoriaAtual}
              </span>
            </>
          )}

          {query && (
            <>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="italic text-slate-400">
                Busca: "{query}"
              </span>
            </>
          )}

          <span className="ml-auto text-[11px] font-medium text-slate-400">
            {filteredFolders.length} de {folders.length} pasta(s)
          </span>
        </div>
      </header>

      {/* 3. Navegação em Pastas / Pills no estilo Nextcloud */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setCategoriaAtiva('all')}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            categoriaAtiva === 'all'
              ? 'bg-[#113240] text-white shadow-sm dark:bg-[#226380]'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <FolderClosed className="h-3.5 w-3.5" />
          <span>Todas as Pastas</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            categoriaAtiva === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            {statsCategorias.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCategoriaAtiva('configuracao')}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            categoriaAtiva === 'configuracao'
              ? 'bg-[#113240] text-white shadow-sm dark:bg-[#226380]'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <FolderClosed className="h-3.5 w-3.5" />
          <span>Configuração (Teologia)</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            categoriaAtiva === 'configuracao' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            {statsCategorias.configuracao}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCategoriaAtiva('tirocinio')}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            categoriaAtiva === 'tirocinio'
              ? 'bg-[#113240] text-white shadow-sm dark:bg-[#226380]'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <FolderClosed className="h-3.5 w-3.5" />
          <span>Tirocinantes</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            categoriaAtiva === 'tirocinio' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            {statsCategorias.tirocinio}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCategoriaAtiva('padres')}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            categoriaAtiva === 'padres'
              ? 'bg-[#113240] text-white shadow-sm dark:bg-[#226380]'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <FolderClosed className="h-3.5 w-3.5" />
          <span>Padres & Presbíteros</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            categoriaAtiva === 'padres' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            {statsCategorias.padres}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCategoriaAtiva('diaconos')}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            categoriaAtiva === 'diaconos'
              ? 'bg-[#113240] text-white shadow-sm dark:bg-[#226380]'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <FolderClosed className="h-3.5 w-3.5" />
          <span>Diáconos</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            categoriaAtiva === 'diaconos' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            {statsCategorias.diaconos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCategoriaAtiva('bispos')}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            categoriaAtiva === 'bispos'
              ? 'bg-[#113240] text-white shadow-sm dark:bg-[#226380]'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <FolderClosed className="h-3.5 w-3.5" />
          <span>Bispos</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            categoriaAtiva === 'bispos' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            {statsCategorias.bispos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCategoriaAtiva('em_revisao')}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            categoriaAtiva === 'em_revisao'
              ? 'bg-amber-700 text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Em Revisão</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            categoriaAtiva === 'em_revisao' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
          }`}>
            {statsCategorias.emRevisao}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCategoriaAtiva('aprovados')}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            categoriaAtiva === 'aprovados'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Aprovados</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            categoriaAtiva === 'aprovados' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
          }`}>
            {statsCategorias.aprovados}
          </span>
        </button>
      </div>

      {/* 4. Cartões de Pastas de Acesso Rápido no topo (estilo Nextcloud) */}
      {categoriaAtiva === 'all' && !query && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Pastas Principais do Arquivo
            </h2>
            <span className="text-[11px] text-slate-400">Clique para abrir a coleção</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {/* Configuração (Teologia) */}
            <button
              type="button"
              onClick={() => setCategoriaAtiva('configuracao')}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-[#226380] hover:shadow-md dark:border-slate-800 dark:bg-[#161b22] dark:hover:border-[#A3C3C7]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 transition group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/30 dark:text-indigo-400">
                  <FolderClosed className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {statsCategorias.configuracao}
                </span>
              </div>
              <div className="mt-3">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">Configuração</p>
                <p className="text-[10px] text-slate-500">Teologia SCJ</p>
              </div>
            </button>

            {/* Tirocinantes */}
            <button
              type="button"
              onClick={() => setCategoriaAtiva('tirocinio')}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-[#226380] hover:shadow-md dark:border-slate-800 dark:bg-[#161b22] dark:hover:border-[#A3C3C7]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 transition group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white dark:bg-amber-950/30 dark:text-amber-400">
                  <FolderClosed className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {statsCategorias.tirocinio}
                </span>
              </div>
              <div className="mt-3">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">Tirocinantes</p>
                <p className="text-[10px] text-slate-500">Etapa Tirocínio</p>
              </div>
            </button>

            {/* Padres */}
            <button
              type="button"
              onClick={() => setCategoriaAtiva('padres')}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-[#226380] hover:shadow-md dark:border-slate-800 dark:bg-[#161b22] dark:hover:border-[#A3C3C7]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#226380]/10 text-[#226380] transition group-hover:scale-105 group-hover:bg-[#113240] group-hover:text-white dark:bg-[#A3C3C7]/15 dark:text-[#A3C3C7] dark:group-hover:bg-[#226380]">
                  <FolderClosed className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {statsCategorias.padres}
                </span>
              </div>
              <div className="mt-3">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">Padres</p>
                <p className="text-[10px] text-slate-500">Presbíteros SCJ</p>
              </div>
            </button>

            {/* Diáconos */}
            <button
              type="button"
              onClick={() => setCategoriaAtiva('diaconos')}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-[#226380] hover:shadow-md dark:border-slate-800 dark:bg-[#161b22] dark:hover:border-[#A3C3C7]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#226380]/10 text-[#226380] transition group-hover:scale-105 group-hover:bg-[#113240] group-hover:text-white dark:bg-[#A3C3C7]/15 dark:text-[#A3C3C7] dark:group-hover:bg-[#226380]">
                  <FolderClosed className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {statsCategorias.diaconos}
                </span>
              </div>
              <div className="mt-3">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">Diáconos</p>
                <p className="text-[10px] text-slate-500">Ordem Diaconal</p>
              </div>
            </button>

            {/* Bispos */}
            <button
              type="button"
              onClick={() => setCategoriaAtiva('bispos')}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-[#226380] hover:shadow-md dark:border-slate-800 dark:bg-[#161b22] dark:hover:border-[#A3C3C7]"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#226380]/10 text-[#226380] transition group-hover:scale-105 group-hover:bg-[#113240] group-hover:text-white dark:bg-[#A3C3C7]/15 dark:text-[#A3C3C7] dark:group-hover:bg-[#226380]">
                  <FolderClosed className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {statsCategorias.bispos}
                </span>
              </div>
              <div className="mt-3">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">Bispos</p>
                <p className="text-[10px] text-slate-500">Episcopado</p>
              </div>
            </button>

            {/* Em Revisão */}
            <button
              type="button"
              onClick={() => setCategoriaAtiva('em_revisao')}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-amber-400 hover:shadow-md dark:border-slate-800 dark:bg-[#161b22] dark:hover:border-amber-500"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 transition group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white dark:bg-amber-950/30 dark:text-amber-400">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  {statsCategorias.emRevisao}
                </span>
              </div>
              <div className="mt-3">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">Em Revisão</p>
                <p className="text-[10px] text-slate-500">Pendentes</p>
              </div>
            </button>

            {/* Aprovados */}
            <button
              type="button"
              onClick={() => setCategoriaAtiva('aprovados')}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-[#161b22] dark:hover:border-emerald-500"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950/30 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {statsCategorias.aprovados}
                </span>
              </div>
              <div className="mt-3">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">Aprovados</p>
                <p className="text-[10px] text-slate-500">Homologados</p>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* 5. Barra de Ferramentas do Explorer (Busca, Ordenação e Visualização) */}
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#11161d] sm:flex-row sm:items-center sm:justify-between">
        {/* Campo de Busca Rápida */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nome, cadastro, grau, comunidade ou status..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-xs text-slate-800 outline-none transition focus:border-[#226380] focus:bg-white focus:ring-2 focus:ring-[#226380]/15 dark:border-slate-700 dark:bg-[#161b22] dark:text-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Controles de Ordenação e Alternador Grade/Lista */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-[#161b22] dark:text-slate-300">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={ordenacao}
              onChange={e => setOrdenacao(e.target.value as Ordenacao)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none dark:text-slate-200"
            >
              <option value="numero_asc">Nº Cadastro (1 → 9)</option>
              <option value="numero_desc">Nº Cadastro (9 → 1)</option>
              <option value="nome_asc">Nome Religioso (A → Z)</option>
              <option value="comunidade_asc">Comunidade (A → Z)</option>
              <option value="recentes">Mais Recentes</option>
              <option value="status">Situação Cadastral</option>
            </select>
          </div>

          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-[#161b22]">
            <button
              type="button"
              onClick={() => setModoVisualizacao('grid')}
              className={`rounded-lg p-1.5 transition ${
                modoVisualizacao === 'grid'
                  ? 'bg-white text-[#226380] shadow-xs dark:bg-slate-800 dark:text-[#A3C3C7]'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Visualização em Grade (Nextcloud Cards)"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setModoVisualizacao('table')}
              className={`rounded-lg p-1.5 transition ${
                modoVisualizacao === 'table'
                  ? 'bg-white text-[#226380] shadow-xs dark:bg-slate-800 dark:text-[#A3C3C7]'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Visualização em Tabela (Nextcloud List)"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Conteúdo: Grade ou Tabela estilo Nextcloud */}
      {loading ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-[#11161d]">
          <Loader2 className="h-8 w-8 animate-spin text-[#226380]" />
          <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
            Carregando pastas e documentos do arquivo provincial...
          </p>
        </div>
      ) : filteredFolders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-800 dark:bg-[#11161d]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#226380]/10 text-[#226380] dark:bg-[#A3C3C7]/10 dark:text-[#A3C3C7]">
            <FolderOpen className="h-7 w-7" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">
            {query ? 'Nenhuma pasta corresponde aos critérios de pesquisa.' : 'Nenhum dossiê encontrado nesta pasta.'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {query ? 'Tente buscar por outro termo ou limpe os filtros aplicados.' : 'Selecione outra categoria ou consulte o Elenco da Secretaria.'}
          </p>
          {(query || categoriaAtiva !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategoriaAtiva('all');
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#113240] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#226380]"
            >
              <X className="h-3.5 w-3.5" />
              <span>Limpar filtros e exibir todas as pastas</span>
            </button>
          )}
        </div>
      ) : modoVisualizacao === 'grid' ? (
        /* VISÃO 1: GRADE DE PASTAS ESTILO NEXTCLOUD */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFolders.map(folder => {
            const canonicalName = folder.nome_elenco
              ? padronizarSufixoSCJ(folder.nome_elenco)
              : (atribuirNomeReligioso(folder.grau, folder.nome_civil) || padronizarSufixoSCJ(folder.nome_religioso) || folder.nome_civil);
            const regNum = formatRegistrationNumber(folder.numero_cadastro, folder.created_at);
            const statusInfo = statusConfig[folder.status_cadastro] || statusConfig.Arquivado;
            const StatusIcon = statusInfo.icon;
            const comFormatada = formatarComunidadeReligiosa(folder.comunidade_atual_nome) || 'Província BRM';

            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => navigate(`/religiosos/${folder.id}/dossie`)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-all hover:-translate-y-0.5 hover:border-[#226380] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#226380] dark:border-slate-800 dark:bg-[#161b22] dark:hover:border-[#A3C3C7]"
              >
                {/* Topo da Pasta: Ícone Nextcloud, Registro e Situação */}
                <div className="border-b border-slate-100 bg-slate-50/70 p-4 transition-colors group-hover:bg-[#226380]/5 dark:border-slate-800/80 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#226380]/20 bg-white text-[#226380] shadow-2xs transition-transform group-hover:scale-105 group-hover:border-[#226380] dark:border-slate-700 dark:bg-slate-800 dark:text-[#A3C3C7]">
                        <Folder className="h-6 w-6 fill-[#226380]/15 text-[#226380] dark:fill-[#A3C3C7]/20 dark:text-[#A3C3C7]" />
                      </div>
                      <div>
                        <span className="block font-mono text-[11px] font-bold tracking-wider text-[#226380] dark:text-[#A3C3C7]">
                          {regNum}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          Pasta Canônica Oficial
                        </span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold tracking-tight shadow-2xs ${statusInfo.badge}`}>
                      <StatusIcon className="h-3 w-3 shrink-0" />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Corpo da Pasta: Foto/Avatar, Nomes e Comunidade */}
                <div className="flex-1 p-5">
                  <div className="flex items-start gap-3.5">
                    {folder.foto_url ? (
                      <img
                        src={folder.foto_url}
                        alt={folder.nome_civil}
                        className="h-11 w-11 shrink-0 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-serif text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {folder.grau?.slice(0, 2) || 'SCJ'}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-[#226380] dark:text-white dark:group-hover:text-[#A3C3C7]">
                        {canonicalName}
                      </h3>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {folder.nome_civil} · <strong className="font-semibold text-slate-700 dark:text-slate-300">{folder.grau || 'Confrade'}</strong>
                        {folder.grau === 'Frater' && (
                          <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                            (folder.etapa_formativa_atual?.toLowerCase().includes('tiroc') || (!folder.etapa_formativa_atual && folder.comunidade_atual_nome && !folder.comunidade_atual_nome.toLowerCase().includes('conventinho')))
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                          }`}>
                            {(folder.etapa_formativa_atual?.toLowerCase().includes('tiroc') || (!folder.etapa_formativa_atual && folder.comunidade_atual_nome && !folder.comunidade_atual_nome.toLowerCase().includes('conventinho')))
                              ? 'Tirocinante'
                              : (folder.ano_configuracao ? `${folder.ano_configuracao}º Ano Teologia` : 'Configuração')}
                          </span>
                        )}
                      </p>

                      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{comFormatada}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rodapé da Pasta: Contagem de Arquivos e Ação de Abertura */}
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/20">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span>{folder.total_documentos || 0} arquivo(s) arquivado(s)</span>
                  </span>

                  <span className="inline-flex items-center gap-1 font-bold text-[#226380] transition-transform group-hover:translate-x-1 dark:text-[#A3C3C7]">
                    <span>Abrir pasta</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* VISÃO 2: TABELA DE ARQUIVOS ESTILO NEXTCLOUD */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                  <th className="py-3.5 pl-6 pr-3">Pasta / Religioso</th>
                  <th className="px-3 py-3.5">Nº de Cadastro</th>
                  <th className="px-3 py-3.5">Grau Canônico</th>
                  <th className="px-3 py-3.5">Comunidade Atual</th>
                  <th className="px-3 py-3.5 text-center">Acervo Digital</th>
                  <th className="px-3 py-3.5">Situação</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFolders.map(folder => {
                  const canonicalName = folder.nome_elenco
              ? padronizarSufixoSCJ(folder.nome_elenco)
              : (atribuirNomeReligioso(folder.grau, folder.nome_civil) || padronizarSufixoSCJ(folder.nome_religioso) || folder.nome_civil);
                  const regNum = formatRegistrationNumber(folder.numero_cadastro, folder.created_at);
                  const statusInfo = statusConfig[folder.status_cadastro] || statusConfig.Arquivado;
                  const StatusIcon = statusInfo.icon;
                  const comFormatada = formatarComunidadeReligiosa(folder.comunidade_atual_nome) || 'Província BRM';

                  return (
                    <tr
                      key={folder.id}
                      onClick={() => navigate(`/religiosos/${folder.id}/dossie`)}
                      className="group cursor-pointer transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-3.5 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#226380]/20 bg-[#226380]/5 text-[#226380] dark:border-slate-700 dark:bg-slate-800 dark:text-[#A3C3C7]">
                            <Folder className="h-5 w-5 fill-[#226380]/15" />
                          </div>
                          <div className="min-w-0">
                            <span className="block font-bold text-slate-900 transition group-hover:text-[#226380] dark:text-white dark:group-hover:text-[#A3C3C7]">
                              {canonicalName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {folder.nome_civil}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3.5 font-mono text-[11px] font-bold text-[#226380] dark:text-[#A3C3C7]">
                        {regNum}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                        <div>{folder.grau || 'Confrade'}</div>
                        {folder.grau === 'Frater' && (
                          <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                            {(folder.etapa_formativa_atual?.toLowerCase().includes('tiroc') || (!folder.etapa_formativa_atual && folder.comunidade_atual_nome && !folder.comunidade_atual_nome.toLowerCase().includes('conventinho')))
                              ? 'Tirocinante'
                              : (folder.ano_configuracao ? `${folder.ano_configuracao}º Ano Teologia` : 'Configuração')}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-slate-600 dark:text-slate-400">
                        <span className="line-clamp-1">{comFormatada}</span>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <FileText className="h-3 w-3 text-slate-400" />
                          {folder.total_documentos || 0}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-bold tracking-tight ${statusInfo.badge}`}>
                          <StatusIcon className="h-3 w-3 shrink-0" />
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="whitespace-nowrap py-3.5 pl-3 pr-6 text-right font-semibold text-[#226380] dark:text-[#A3C3C7]">
                        <span className="inline-flex items-center gap-1 transition group-hover:translate-x-1">
                          <span>Abrir</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Barra de Rodapé / Informações do Acervo */}
      <footer className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 sm:flex-row">
        <p>
          Mostrando <strong>{filteredFolders.length}</strong> de <strong>{folders.length}</strong> pastas de dossiês arquivados.
        </p>
        <p className="font-mono text-[11px] text-slate-400">
          Chancelaria Provincial · Arquivo Geral Província BRM Dehoniana
        </p>
      </footer>
    </main>
  );
};

export default ReligiososDossies;
