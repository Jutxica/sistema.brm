import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Search, MapPin, Clock, Users, Edit3, Trash2, 
  CheckCircle2, AlertCircle, X, ChevronRight, Filter, Building2, Tag
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { staggerStyle } from '../hooks/useMotion';

export type TipoEvento = 
  | 'Assembleia'
  | 'Retiro'
  | 'Reunião'
  | 'Encontro'
  | 'Celebração / Solenidade'
  | 'Visita Canônica'
  | 'Formação'
  | 'Outro';

export type StatusEvento = 'Confirmado' | 'Previsto' | 'Concluído' | 'Cancelado';

export interface EventoProvincial {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  data_inicio: string;
  data_fim?: string | null;
  horario?: string | null;
  local: string;
  cidade?: string | null;
  uf?: string | null;
  descricao?: string | null;
  publico_alvo?: string | null;
  status: StatusEvento;
  created_at: string;
}

interface CasaReferencia {
  id: string;
  nome: string;
  tipo: string;
  cidade?: string | null;
  localidade?: string | null;
  uf?: string | null;
}

const TIPOS_EVENTOS: TipoEvento[] = [
  'Assembleia',
  'Retiro',
  'Reunião',
  'Encontro',
  'Celebração / Solenidade',
  'Visita Canônica',
  'Formação',
  'Outro'
];

const LOCAL_STORAGE_KEY = 'brm_eventos_provinciais_v1';

const SEED_EVENTOS: EventoProvincial[] = [
  {
    id: 'evt-1',
    titulo: 'Retiro Provincial dos Presbíteros (Turma I)',
    tipo: 'Retiro',
    data_inicio: '2026-03-14',
    data_fim: '2026-03-18',
    horario: '08:00',
    local: 'Casa Padre Dehon',
    cidade: 'Brusque',
    uf: 'SC',
    descricao: 'Retiro anual de espiritualidade dehoniana para a primeira turma de presbíteros da Província BRM.',
    publico_alvo: 'Presbíteros',
    status: 'Confirmado',
    created_at: new Date('2026-01-10').toISOString()
  },
  {
    id: 'evt-2',
    titulo: 'Reunião Ordinária do Conselho Provincial',
    tipo: 'Reunião',
    data_inicio: '2026-04-15',
    data_fim: null,
    horario: '09:00',
    local: 'Sede Provincial',
    cidade: 'Curitiba',
    uf: 'PR',
    descricao: 'Sessão com o Superior Provincial e Conselheiros para avaliação pastoral e atos canônicos.',
    publico_alvo: 'Governo Provincial',
    status: 'Confirmado',
    created_at: new Date('2026-01-10').toISOString()
  },
  {
    id: 'evt-3',
    titulo: 'Encontro dos Fratres da Etapa de Configuração (Teologia)',
    tipo: 'Encontro',
    data_inicio: '2026-05-22',
    data_fim: '2026-05-24',
    horario: '14:00',
    local: 'Seminário SCJ',
    cidade: 'Corupá',
    uf: 'SC',
    descricao: 'Convivência vocacional, partilha pastoral e aprofundamento do carisma do Pe. Dehon.',
    publico_alvo: 'Fratres',
    status: 'Confirmado',
    created_at: new Date('2026-01-10').toISOString()
  },
  {
    id: 'evt-4',
    titulo: 'Solenidade do Sagrado Coração de Jesus (Festa Patronal SCJ)',
    tipo: 'Celebração / Solenidade',
    data_inicio: '2026-06-19',
    data_fim: null,
    horario: '19:00',
    local: 'Todas as Comunidades da Província',
    cidade: 'Curitiba',
    uf: 'PR',
    descricao: 'Festa titular da Congregação com renovação comunitária dos votos e adoração reparadora.',
    publico_alvo: 'Toda a Província',
    status: 'Confirmado',
    created_at: new Date('2026-01-10').toISOString()
  },
  {
    id: 'evt-5',
    titulo: 'Memória do Venerável Pe. Leão João Dehon',
    tipo: 'Celebração / Solenidade',
    data_inicio: '2026-08-12',
    data_fim: null,
    horario: '19:30',
    local: 'Todas as Paróquias e Casas da Província',
    cidade: 'Curitiba',
    uf: 'PR',
    descricao: 'Celebração eucarística em honra ao nosso fundador com súplica pela beatificação.',
    publico_alvo: 'Toda a Província',
    status: 'Confirmado',
    created_at: new Date('2026-01-10').toISOString()
  },
  {
    id: 'evt-6',
    titulo: 'Assembleia Provincial Ordinária 2026',
    tipo: 'Assembleia',
    data_inicio: '2026-10-05',
    data_fim: '2026-10-09',
    horario: '08:30',
    local: 'Seminário São José',
    cidade: 'Rio Negrinho',
    uf: 'SC',
    descricao: 'Assembleia anual com a presença de todos os confrades perpétuos e temporários para planejamento e avaliação pastoral.',
    publico_alvo: 'Toda a Província',
    status: 'Confirmado',
    created_at: new Date('2026-01-10').toISOString()
  }
];

export const AgendaAdmin: React.FC = () => {
  const [eventos, setEventos] = useState<EventoProvincial[]>([]);
  const [casas, setCasas] = useState<CasaReferencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<string>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<EventoProvincial | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formTitulo, setFormTitulo] = useState('');
  const [formTipo, setFormTipo] = useState<TipoEvento>('Assembleia');
  const [formDataInicio, setFormDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [formDataFim, setFormDataFim] = useState('');
  const [formHorario, setFormHorario] = useState('');
  const [formLocal, setFormLocal] = useState('');
  const [formCidade, setFormCidade] = useState('');
  const [formUf, setFormUf] = useState('SC');
  const [formDescricao, setFormDescricao] = useState('');
  const [formPublico, setFormPublico] = useState('Toda a Província');
  const [formStatus, setFormStatus] = useState<StatusEvento>('Confirmado');

  // Carregar Dados
  const carregarDados = async () => {
    setLoading(true);
    try {
      // 1. Carregar Casas & Obras do banco de dados para o dropdown dinâmico
      const { data: casasData } = await supabase
        .from('religiosos_obras_referencia')
        .select('id, nome, tipo, cidade, localidade, uf')
        .eq('status', 'Ativa')
        .order('nome');
      
      if (casasData) {
        setCasas(casasData as CasaReferencia[]);
      }

      // 2. Carregar Eventos
      const { data: eventosData, error } = await supabase
        .from('eventos_provinciais')
        .select('*')
        .order('data_inicio', { ascending: true });

      if (error || !eventosData) {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          setEventos(JSON.parse(saved));
        } else {
          setEventos(SEED_EVENTOS);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_EVENTOS));
        }
      } else {
        setEventos(eventosData as EventoProvincial[]);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(eventosData));
      }
    } catch (e) {
      console.warn('Erro ao conectar ao Supabase, utilizando dados locais resilientes:', e);
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      setEventos(saved ? JSON.parse(saved) : SEED_EVENTOS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const persistirEventos = (novos: EventoProvincial[]) => {
    setEventos(novos);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(novos));
  };

  // Abrir Modal para Criar
  const handleOpenCreate = () => {
    setEditingEvento(null);
    setFormTitulo('');
    setFormTipo('Assembleia');
    setFormDataInicio(new Date().toISOString().split('T')[0]);
    setFormDataFim('');
    setFormHorario('');
    setFormLocal('');
    setFormCidade('');
    setFormUf('SC');
    setFormDescricao('');
    setFormPublico('Toda a Província');
    setFormStatus('Confirmado');
    setFormError('');
    setIsModalOpen(true);
  };

  // Abrir Modal para Editar
  const handleOpenEdit = (evt: EventoProvincial) => {
    setEditingEvento(evt);
    setFormTitulo(evt.titulo);
    setFormTipo(evt.tipo);
    setFormDataInicio(evt.data_inicio);
    setFormDataFim(evt.data_fim || '');
    setFormHorario(evt.horario || '');
    setFormLocal(evt.local);
    setFormCidade(evt.cidade || '');
    setFormUf(evt.uf || 'SC');
    setFormDescricao(evt.descricao || '');
    setFormPublico(evt.publico_alvo || 'Toda a Província');
    setFormStatus(evt.status);
    setFormError('');
    setIsModalOpen(true);
  };

  // Selecionar Casa da Província BRM
  const handleSelectCasa = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const casaId = e.target.value;
    if (!casaId) return;
    const casa = casas.find(c => c.id === casaId);
    if (casa) {
      setFormLocal(casa.nome);
      setFormCidade(casa.cidade || casa.localidade || '');
      setFormUf(casa.uf || 'SC');
    }
  };

  // Salvar Evento
  const handleSaveEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitulo.trim()) {
      setFormError('Informe o título do evento.');
      return;
    }
    if (!formDataInicio) {
      setFormError('Informe a data de início do evento.');
      return;
    }
    if (!formLocal.trim()) {
      setFormError('Informe o local do evento.');
      return;
    }

    setSaving(true);
    try {
      if (editingEvento) {
        // Atualizar
        const atualizado: EventoProvincial = {
          ...editingEvento,
          titulo: formTitulo.trim(),
          tipo: formTipo,
          data_inicio: formDataInicio,
          data_fim: formDataFim || null,
          horario: formHorario.trim() || null,
          local: formLocal.trim(),
          cidade: formCidade.trim() || null,
          uf: formUf.trim() || null,
          descricao: formDescricao.trim() || null,
          publico_alvo: formPublico.trim() || null,
          status: formStatus
        };

        try {
          await supabase
            .from('eventos_provinciais')
            .update(atualizado)
            .eq('id', editingEvento.id);
        } catch (dbErr) {
          console.warn('Atualizando evento localmente:', dbErr);
        }

        const lista = eventos.map(ev => ev.id === editingEvento.id ? atualizado : ev);
        persistirEventos(lista);
      } else {
        // Inserir Novo
        const novoId = crypto.randomUUID();
        const novoEvento: EventoProvincial = {
          id: novoId,
          titulo: formTitulo.trim(),
          tipo: formTipo,
          data_inicio: formDataInicio,
          data_fim: formDataFim || null,
          horario: formHorario.trim() || null,
          local: formLocal.trim(),
          cidade: formCidade.trim() || null,
          uf: formUf.trim() || null,
          descricao: formDescricao.trim() || null,
          publico_alvo: formPublico.trim() || null,
          status: formStatus,
          created_at: new Date().toISOString()
        };

        try {
          await supabase
            .from('eventos_provinciais')
            .insert([novoEvento]);
        } catch (dbErr) {
          console.warn('Inserindo evento localmente:', dbErr);
        }

        const lista = [...eventos, novoEvento].sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
        persistirEventos(lista);
      }

      setIsModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar evento.');
    } finally {
      setSaving(false);
    }
  };

  // Excluir Evento
  const handleDelete = async (evt: EventoProvincial) => {
    if (!window.confirm(`Deseja realmente remover o evento "${evt.titulo}" da agenda provincial?`)) return;

    try {
      await supabase.from('eventos_provinciais').delete().eq('id', evt.id);
    } catch (e) {
      console.warn('Removendo evento localmente:', e);
    }

    const lista = eventos.filter(ev => ev.id !== evt.id);
    persistirEventos(lista);
  };

  // Filtros
  const eventosFiltrados = eventos.filter(evt => {
    const matchTipo = selectedTipo === 'Todos' || evt.tipo === selectedTipo;
    const matchStatus = selectedStatus === 'Todos' || evt.status === selectedStatus;
    const q = search.toLowerCase();
    const matchSearch = !search ||
      evt.titulo.toLowerCase().includes(q) ||
      evt.local.toLowerCase().includes(q) ||
      (evt.cidade && evt.cidade.toLowerCase().includes(q)) ||
      (evt.descricao && evt.descricao.toLowerCase().includes(q));

    return matchTipo && matchStatus && matchSearch;
  });

  const formatPeriodo = (inicio: string, fim?: string | null) => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    try {
      const [anoI, mesI, diaI] = inicio.split('-');
      const mesNome = meses[parseInt(mesI, 10) - 1];

      if (!fim || fim === inicio) {
        return `${diaI} de ${mesNome}, ${anoI}`;
      }

      const [anoF, mesF, diaF] = fim.split('-');
      if (mesI === mesF) {
        return `${diaI} a ${diaF} de ${mesNome}, ${anoI}`;
      }

      const mesFNome = meses[parseInt(mesF, 10) - 1];
      return `${diaI} de ${mesNome} a ${diaF} de ${mesFNome}, ${anoI}`;
    } catch {
      return inicio;
    }
  };

  const getTipoCor = (tipo: TipoEvento) => {
    switch (tipo) {
      case 'Assembleia':
        return 'bg-[#F2C894]/25 text-[#113240] dark:text-[#F2C894] border-[#F2C894]/50';
      case 'Retiro':
        return 'bg-[#226380]/15 text-[#113240] dark:text-[#A3C3C7] border-[#226380]/40';
      case 'Reunião':
        return 'bg-[#113240]/10 text-[#113240] dark:text-white border-[#113240]/30';
      case 'Encontro':
        return 'bg-[#A3C3C7]/25 text-[#113240] dark:text-[#A3C3C7] border-[#A3C3C7]/60';
      case 'Celebração / Solenidade':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
      case 'Visita Canônica':
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20';
      case 'Formação':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
      default:
        return 'bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200';
    }
  };

  const getStatusCor = (status: StatusEvento) => {
    switch (status) {
      case 'Confirmado':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
      case 'Previsto':
        return 'bg-[#F2C894]/25 text-[#113240] dark:text-[#F2C894]';
      case 'Concluído':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
      case 'Cancelado':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 line-through';
    }
  };

  return (
    <div className="space-y-6">
      {/* Masthead Secretaria Provincial — Modernismo Corporativo Editorial */}
      <div className="bg-white dark:bg-[#161b22] rounded-[6px] border border-slate-200 dark:border-slate-800 border-t-2 border-t-[#226380] p-6 md:p-8 shadow-[0_1px_3px_rgba(17,50,64,0.03)] transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#226380] font-cinzel block">
              Secretaria Provincial • Província Brasil Meridional
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#113240] dark:text-white font-cinzel">
              Agenda & Eventos Provinciais
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-sans max-w-2xl leading-relaxed">
              Cadastro e governança das assembleias, retiros espirituais, encontros vocacionais e reuniões de conselho que compõem o calendário e são visualizados no Portal do Confrade.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold border border-[#113240] bg-[#113240] text-white hover:bg-[#226380] hover:border-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Evento Provincial</span>
            </button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar evento por nome, local ou cidade..."
                className="w-full pl-9 pr-8 py-2 rounded-[6px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 font-mono"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Selector */}
            <div className="flex items-center gap-1 p-1 rounded-[6px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs self-start md:self-auto font-mono">
              {['Todos', 'Confirmado', 'Previsto', 'Concluído'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1 rounded-[4px] text-[11px] uppercase tracking-wider font-medium transition-all cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-[#113240] text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#113240] dark:hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Segmented Type Selectors — Rectangular Ledger */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs font-mono">
            <button
              type="button"
              onClick={() => setSelectedTipo('Todos')}
              className={`px-3 py-1 rounded-[6px] transition-all shrink-0 text-[11px] uppercase tracking-wider border cursor-pointer ${
                selectedTipo === 'Todos'
                  ? 'border-[#113240] bg-[#113240] text-white font-semibold shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-[#226380]'
              }`}
            >
              Todos os Tipos ({eventos.length})
            </button>
            {TIPOS_EVENTOS.map((tp) => {
              const count = eventos.filter(ev => ev.tipo === tp).length;
              return (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setSelectedTipo(tp)}
                  className={`px-3 py-1 rounded-[6px] transition-all shrink-0 text-[11px] uppercase tracking-wider border cursor-pointer ${
                    selectedTipo === tp
                      ? 'border-[#226380] bg-[#226380] text-white font-semibold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-[#226380]'
                  }`}
                >
                  {tp} {count > 0 && <span className="opacity-80 text-[10px] ml-1">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid de Eventos — Continuous Ledger */}
      <div className="bg-white dark:bg-[#161b22] rounded-[6px] border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-[0_1px_3px_rgba(17,50,64,0.03)]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 font-semibold">
            Eventos da Província ({eventosFiltrados.length})
          </span>
          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
            SINCRONIZADOS EM TEMPO REAL COM O PORTAL DO CONFRADE
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#113240]/20 border-t-[#113240] animate-spin mx-auto mb-3" />
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Carregando agenda...</span>
          </div>
        ) : eventosFiltrados.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-[6px]">
            <Calendar className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-3 stroke-[1.5]" />
            <h3 className="text-base font-semibold text-[#113240] dark:text-white font-cinzel">
              Nenhum evento registrado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto font-sans">
              Nenhum evento corresponde aos filtros. Clique em "+ Novo Evento Provincial" para cadastrar.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {eventosFiltrados.map((evt, idx) => {
              const [ano, mes, dia] = evt.data_inicio.split('-');
              const mesesAbrev = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
              const mesNome = mesesAbrev[parseInt(mes, 10) - 1];

              return (
                <div
                  key={evt.id}
                  style={staggerStyle(idx)}
                  className="py-4 px-3 rounded-[6px] hover:bg-[#F2F2F2]/60 dark:hover:bg-slate-900/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 motion-stagger-item"
                >
                  <div className="flex items-start gap-4">
                    {/* Bloco de Data Lapidado */}
                    <div className="w-12 h-12 rounded-[6px] bg-[#113240]/5 dark:bg-[#226380]/20 border border-[#A3C3C7]/40 dark:border-slate-700 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] font-mono font-bold tracking-wider text-[#226380] uppercase">
                        {mesNome}
                      </span>
                      <span className="text-base font-bold text-[#113240] dark:text-white leading-none mt-0.5 font-mono">
                        {dia}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-mono uppercase font-semibold border ${getTipoCor(evt.tipo)}`}>
                          {evt.tipo}
                        </span>
                        <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-mono uppercase font-medium border border-current ${getStatusCor(evt.status)}`}>
                          {evt.status}
                        </span>
                        {evt.publico_alvo && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" />
                            {evt.publico_alvo}
                          </span>
                        )}
                      </div>

                      <h4 className="text-[14px] font-semibold text-[#113240] dark:text-white leading-snug">
                        {evt.titulo}
                      </h4>

                      {evt.descricao && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 max-w-2xl leading-relaxed">
                          {evt.descricao}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-mono">
                        <span className="flex items-center gap-1 font-medium text-[#113240] dark:text-slate-200">
                          <Calendar className="w-3 h-3 text-[#226380]" />
                          {formatPeriodo(evt.data_inicio, evt.data_fim)}
                        </span>
                        {evt.horario && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {evt.horario}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#226380]" />
                          {evt.local} {evt.cidade && `(${evt.cidade}${evt.uf ? `/${evt.uf}` : ''})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1.5 self-start md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(evt)}
                      className="p-2 rounded-[6px] border border-slate-200 dark:border-slate-800 hover:bg-[#226380]/10 hover:border-[#226380] text-slate-600 hover:text-[#113240] transition-colors cursor-pointer"
                      title="Editar evento"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(evt)}
                      className="p-2 rounded-[6px] border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Excluir da agenda"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Secretaria Provincial de Cadastro e Edição — Modernismo Corporativo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm motion-backdrop">
          <div className="bg-white dark:bg-[#161b22] rounded-[8px] border border-slate-300 dark:border-slate-700 shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col border-t-2 border-t-[#226380] motion-modal">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#226380] font-semibold block">
                  Secretaria Provincial
                </span>
                <h3 className="text-lg font-bold text-[#113240] dark:text-white font-cinzel">
                  {editingEvento ? 'Editar Evento Provincial' : 'Novo Evento Provincial'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-[6px] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer motion-press"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEvento} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="p-3.5 rounded-[6px] bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Título */}
              <div>
                <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                  Título do Evento *
                </label>
                <input
                  type="text"
                  required
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ex: Retiro Provincial dos Presbíteros"
                  className="w-full px-3.5 py-2 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none text-slate-900 dark:text-white font-sans"
                />
              </div>

              {/* Tipo & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                    Tipo de Evento *
                  </label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as TipoEvento)}
                    className="w-full px-3.5 py-2 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none text-slate-900 dark:text-white font-sans"
                  >
                    {TIPOS_EVENTOS.map((tp) => (
                      <option key={tp} value={tp}>{tp}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                    Situação / Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as StatusEvento)}
                    className="w-full px-3.5 py-2 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none text-slate-900 dark:text-white font-sans"
                  >
                    <option value="Confirmado">Confirmado</option>
                    <option value="Previsto">Previsto</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Datas: Início, Fim e Horário */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDataInicio}
                    onChange={(e) => setFormDataInicio(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                    Data de Término
                  </label>
                  <input
                    type="date"
                    value={formDataFim}
                    onChange={(e) => setFormDataFim(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                    Horário de Início
                  </label>
                  <input
                    type="time"
                    value={formHorario}
                    onChange={(e) => setFormHorario(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Seleção Rápida de Casas da Província BRM */}
              {casas.length > 0 && (
                <div className="p-3 rounded-[6px] bg-[#226380]/5 dark:bg-[#226380]/20 border border-[#226380]/20 dark:border-[#226380]/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-[#226380] dark:text-[#A3C3C7] font-semibold text-[11px] font-mono">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Selecionar Casa / Obra Oficial da Província BRM</span>
                  </div>
                  <select
                    onChange={handleSelectCasa}
                    defaultValue=""
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white text-xs font-mono"
                  >
                    <option value="">-- Preencher com dados de uma Casa ou Obra da BRM --</option>
                    {casas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} • {c.cidade || c.localidade}/{c.uf} ({c.tipo})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Local, Cidade e UF */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                    Nome do Local / Comunidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={formLocal}
                    onChange={(e) => setFormLocal(e.target.value)}
                    placeholder="Ex: Casa Padre Dehon ou Seminário São José"
                    className="w-full px-3.5 py-2 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                    Cidade / UF
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formCidade}
                      onChange={(e) => setFormCidade(e.target.value)}
                      placeholder="Brusque"
                      className="w-full px-3.5 py-2 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      maxLength={2}
                      value={formUf}
                      onChange={(e) => setFormUf(e.target.value.toUpperCase())}
                      placeholder="SC"
                      className="w-14 px-2 py-2 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none text-center font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Público Alvo */}
              <div>
                <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                  Público-Alvo
                </label>
                <input
                  type="text"
                  value={formPublico}
                  onChange={(e) => setFormPublico(e.target.value)}
                  placeholder="Ex: Toda a Província, Presbíteros, Fratres, Conselho Provincial..."
                  className="w-full px-3.5 py-2 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none text-slate-900 dark:text-white"
                />
              </div>

              {/* Descrição / Pauta */}
              <div>
                <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                  Descrição e Orientações (opcional)
                </label>
                <textarea
                  rows={3}
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Informações adicionais, pauta, inscrições ou horários para os confrades..."
                  className="w-full px-3.5 py-2 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-[6px] text-xs font-mono uppercase font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-300 dark:border-slate-700 motion-press"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono uppercase tracking-wider font-semibold border border-[#113240] bg-[#113240] text-white hover:bg-[#226380] hover:border-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm disabled:opacity-60 motion-press"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{editingEvento ? 'Atualizar Evento' : 'Cadastrar na Agenda'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaAdmin;
