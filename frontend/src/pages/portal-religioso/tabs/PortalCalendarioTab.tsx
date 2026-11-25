import React, { useMemo, useState } from 'react';
import { SincronizarCalendarioModal } from '../../../components/SincronizarCalendarioModal';
import {
  ArrowLeft, Calendar, CalendarDays, CalendarPlus, Search, X, Loader2,
  Smartphone, FileText, MapPin, Clock, CheckCircle2, Users, List, LayoutGrid, Sparkles
} from 'lucide-react';
import type { EventoProvincial, FormularioSecretaria, RespostaFormulario } from '../../../types/secretaria';
import type { ReligiosoPortalData } from '../../../types/religioso';
import { AgendaVisualizacao } from '../../../components/AgendaVisualizacao';
import { staggerStyle } from '../../../hooks/useMotion';
import { showToast } from '../../../hooks/useFeedback';
import { icalService } from '../../../services/icalService';
import { dataHojeSaoPaulo } from '../../../utils/dateUtils';

export interface PortalCalendarioTabProps {
  eventos: EventoProvincial[];
  eventosFiltrados: EventoProvincial[];
  loadingEventos: boolean;
  eventosError: boolean;
  eventoVisualizacao: 'lista' | 'calendario' | 'quadro';
  setEventoVisualizacao: (modo: 'lista' | 'calendario' | 'quadro') => void;
  eventoFiltroTipo: string;
  setEventoFiltroTipo: (tipo: string) => void;
  eventoSearch: string;
  setEventoSearch: (val: string) => void;
  onVoltar: () => void;
  formatPeriodo: (inicio: string, fim?: string | null) => string;
  getTipoCor: () => string;
  respostasInscricoes: RespostaFormulario[];
  formulariosSecretaria: FormularioSecretaria[];
  formulariosError: boolean;
  religiosoData: ReligiosoPortalData | null;
  userEmail?: string;
  onAbrirInscricao: (evt: EventoProvincial, form: FormularioSecretaria) => void;
}

const MESES_EXTENSO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const DIAS_SEMANA_ABREV = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

const TIPOS_AGENDA = [
  'Todos',
  'Assembleia',
  'Retiro',
  'Reunião',
  'Encontro',
  'Celebração / Solenidade',
  'Visita Canônica',
  'Formação',
  'Outro',
] as const;

interface TipoVisualStyle {
  accentBar: string;
  badge: string;
  dot: string;
}

const getTipoVisual = (tipo: string): TipoVisualStyle => {
  switch (tipo) {
    case 'Assembleia':
      return {
        accentBar: 'bg-[#B58A55]',
        badge: 'bg-[#B58A55]/12 text-[#7c5a2c] dark:text-[#e6c391] border-[#B58A55]/30',
        dot: 'bg-[#B58A55]',
      };
    case 'Retiro':
      return {
        accentBar: 'bg-[#226380]',
        badge: 'bg-[#226380]/10 text-[#1b5068] dark:text-[#A3C3C7] border-[#226380]/25',
        dot: 'bg-[#226380]',
      };
    case 'Reunião':
      return {
        accentBar: 'bg-[#113240] dark:bg-[#7fa8b8]',
        badge: 'bg-[#113240]/8 text-[#113240] dark:bg-white/10 dark:text-slate-200 border-[#113240]/20 dark:border-white/15',
        dot: 'bg-[#113240] dark:bg-[#A3C3C7]',
      };
    case 'Encontro':
      return {
        accentBar: 'bg-[#2e7d8a]',
        badge: 'bg-[#A3C3C7]/25 text-[#174657] dark:text-[#A3C3C7] border-[#2e7d8a]/25',
        dot: 'bg-[#2e7d8a]',
      };
    case 'Celebração / Solenidade':
      return {
        accentBar: 'bg-[#9b2c3e]',
        badge: 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/25',
        dot: 'bg-[#9b2c3e]',
      };
    case 'Visita Canônica':
      return {
        accentBar: 'bg-indigo-600',
        badge: 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border-indigo-500/25',
        dot: 'bg-indigo-500',
      };
    case 'Formação':
      return {
        accentBar: 'bg-emerald-600',
        badge: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/25',
        dot: 'bg-emerald-500',
      };
    default:
      return {
        accentBar: 'bg-slate-400',
        badge: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 border-slate-200 dark:border-white/15',
        dot: 'bg-slate-400',
      };
  }
};

const parseIsoLocalDate = (iso: string): Date | null => {
  const match = iso?.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

const calcularDiasDiferenca = (deIso: string, paraIso: string): number | null => {
  const de = parseIsoLocalDate(deIso);
  const para = parseIsoLocalDate(paraIso);
  if (!de || !para) return null;
  return Math.round((para.getTime() - de.getTime()) / (1000 * 60 * 60 * 24));
};

const obterSeloProximidade = (
  evt: EventoProvincial,
  hojeIso: string,
): { label: string; className: string } | null => {
  const inicio = evt.data_inicio?.slice(0, 10);
  const fim = (evt.data_fim && evt.data_fim >= evt.data_inicio ? evt.data_fim : evt.data_inicio)?.slice(0, 10);
  if (!inicio || !fim) return null;

  if (hojeIso >= inicio && hojeIso <= fim) {
    return {
      label: inicio === fim ? 'Hoje' : 'Em andamento',
      className: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    };
  }

  const diffInicio = calcularDiasDiferenca(hojeIso, inicio);
  if (diffInicio === 1) {
    return {
      label: 'Amanhã',
      className: 'bg-[#B58A55]/15 text-[#7c5a2c] dark:text-[#e6c391] border-[#B58A55]/35',
    };
  }
  if (diffInicio !== null && diffInicio > 1 && diffInicio <= 14) {
    return {
      label: `Em ${diffInicio} dias`,
      className: 'bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] border-[#226380]/20',
    };
  }

  const diffFim = calcularDiasDiferenca(fim, hojeIso);
  if (diffFim !== null && diffFim >= 1) {
    return {
      label: 'Encerrado recentemente',
      className: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 border-slate-200 dark:border-white/10',
    };
  }

  return null;
};

const extrairBlocoData = (inicioIso: string, fimIso?: string | null) => {
  const dtInicio = parseIsoLocalDate(inicioIso);
  if (!dtInicio) {
    return { mes: '—', diaTexto: '—', semana: '' };
  }
  const mesIdx = dtInicio.getMonth();
  const diaI = String(dtInicio.getDate()).padStart(2, '0');
  const semI = DIAS_SEMANA_ABREV[dtInicio.getDay()];

  if (!fimIso || fimIso.slice(0, 10) === inicioIso.slice(0, 10)) {
    return { mes: MESES_ABREV[mesIdx], diaTexto: diaI, semana: semI };
  }

  const dtFim = parseIsoLocalDate(fimIso);
  if (dtFim && dtFim.getMonth() === dtInicio.getMonth() && dtFim.getFullYear() === dtInicio.getFullYear()) {
    const diaF = String(dtFim.getDate()).padStart(2, '0');
    const semF = DIAS_SEMANA_ABREV[dtFim.getDay()];
    return { mes: MESES_ABREV[mesIdx], diaTexto: `${diaI}–${diaF}`, semana: `${semI}–${semF}` };
  }

  return { mes: MESES_ABREV[mesIdx], diaTexto: `${diaI}+`, semana: semI };
};

export const PortalCalendarioTab: React.FC<PortalCalendarioTabProps> = ({
  eventos,
  eventosFiltrados,
  loadingEventos,
  eventosError,
  eventoVisualizacao,
  setEventoVisualizacao,
  eventoFiltroTipo,
  setEventoFiltroTipo,
  eventoSearch,
  setEventoSearch,
  onVoltar,
  formatPeriodo,
  respostasInscricoes,
  formulariosSecretaria,
  formulariosError,
  religiosoData,
  userEmail,
  onAbrirInscricao,
}) => {
  const [modalSyncAberto, setModalSyncAberto] = useState(false);

  const hojeIso = dataHojeSaoPaulo();
  const mesAtualPrefixo = hojeIso.slice(0, 7);
  const anoExibicao = useMemo(() => {
    const anos = eventos
      .map((e) => Number(e.data_inicio?.slice(0, 4)))
      .filter((n) => Number.isFinite(n) && n > 2000);
    if (anos.length === 0) return Number(hojeIso.slice(0, 4));
    const anoAtual = Number(hojeIso.slice(0, 4));
    return anos.includes(anoAtual) ? anoAtual : anos[0];
  }, [eventos, hojeIso]);

  const proximoEvento = useMemo(() => {
    return [...eventos]
      .filter((evt) => {
        const fim = (evt.data_fim && evt.data_fim >= evt.data_inicio ? evt.data_fim : evt.data_inicio)?.slice(0, 10);
        return evt.status !== 'Concluído' && evt.status !== 'Cancelado' && fim >= hojeIso;
      })
      .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio))[0];
  }, [eventos, hojeIso]);

  const eventosNoMes = useMemo(
    () => eventos.filter((evt) => evt.data_inicio?.slice(0, 7) === mesAtualPrefixo).length,
    [eventos, mesAtualPrefixo],
  );

  const eventosComInscricao = useMemo(
    () => eventos.filter((evt) => evt.exige_inscricao).length,
    [eventos],
  );

  const gruposPorMes = useMemo(() => {
    const mapa = new Map<string, { chave: string; titulo: string; itens: EventoProvincial[] }>();
    const ordenados = [...eventosFiltrados].sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));

    ordenados.forEach((evt) => {
      const chave = evt.data_inicio?.slice(0, 7) || 'sem-data';
      if (!mapa.has(chave)) {
        const [anoStr, mesStr] = chave.split('-');
        const mesIdx = Number(mesStr) - 1;
        const titulo =
          mesIdx >= 0 && mesIdx < 12 && anoStr
            ? `${MESES_EXTENSO[mesIdx]} de ${anoStr}`
            : 'Próximos compromissos';
        mapa.set(chave, { chave, titulo, itens: [] });
      }
      mapa.get(chave)!.itens.push(evt);
    });

    return Array.from(mapa.values());
  }, [eventosFiltrados]);

  const hasActiveFilters = eventoFiltroTipo !== 'Todos' || eventoSearch.trim().length > 0;
  const seloProximo = proximoEvento ? obterSeloProximidade(proximoEvento, hojeIso) : null;

  return (
    <div className="space-y-5">
      {/* Voltar */}
      <div>
        <button
          type="button"
          onClick={onVoltar}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#161617] border border-[#dce4e2] dark:border-white/10 text-xs font-medium text-[#113240] dark:text-[#f5f5f7] hover:bg-[#f4f6f5] dark:hover:bg-[#262628] transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Painel do Religioso</span>
        </button>
      </div>

      {/* Hero Institucional da Agenda */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#113240] via-[#164154] to-[#205a73] p-6 sm:p-8 text-white shadow-[0_14px_36px_rgba(17,50,64,0.16)]">
        {/* Elementos arquitetônicos sutis */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/[0.08]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-12 h-44 w-44 rounded-full border border-[#B58A55]/20"
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-px w-5 bg-[#B58A55]" aria-hidden="true" />
              <span className="font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#A3C3C7]">
                Província BRM • Calendário Litúrgico e Provincial
              </span>
            </div>
            <h2 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-white leading-tight">
              Agenda Provincial {anoExibicao}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-white/75 leading-relaxed">
              Acompanhe os retiros, assembleias, celebrações patronais e encontros oficiais da Província Brasileira Meridional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setModalSyncAberto(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-medium text-white backdrop-blur-xs transition-all hover:bg-white/20 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#A3C3C7]" />
              <span>Sincronizar no Celular</span>
            </button>
          </div>
        </div>

        {/* Faixa de Destaque: Próximo Compromisso + Resumo */}
        <div className="relative mt-6 pt-5 border-t border-white/12 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-8">
            {proximoEvento ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 rounded-xl bg-white/[0.08] border border-white/12 px-4 py-3 backdrop-blur-xs">
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#B58A55]/20 border border-[#B58A55]/40 text-[#f3d4a7]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="sm:hidden">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f3d4a7]">
                      Próximo compromisso
                    </span>
                    {seloProximo && (
                      <span className="text-[11px] font-medium text-white/85">{seloProximo.label}</span>
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="hidden sm:flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f3d4a7]">
                      Próximo compromisso
                    </span>
                    {seloProximo && (
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white">
                        {seloProximo.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white truncate">
                    {proximoEvento.titulo}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/75">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#A3C3C7]" />
                      {formatPeriodo(proximoEvento.data_inicio, proximoEvento.data_fim)}
                    </span>
                    {proximoEvento.horario && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#A3C3C7]" />
                        {proximoEvento.horario}
                      </span>
                    )}
                    {proximoEvento.local && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-[#A3C3C7] shrink-0" />
                        <span className="truncate">{proximoEvento.local}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 text-xs text-white/75">
                Não há próximos compromissos programados no momento.
              </div>
            )}
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-white/[0.07] border border-white/10 px-3.5 py-2.5">
              <span className="block text-[10px] font-medium uppercase tracking-wider text-white/65">
                Na agenda
              </span>
              <span className="mt-0.5 block text-lg font-semibold text-white tabular-nums">
                {eventos.length}{' '}
                <span className="text-[11px] font-normal text-white/70">
                  {eventos.length === 1 ? 'evento' : 'eventos'}
                </span>
              </span>
            </div>
            <div className="rounded-xl bg-white/[0.07] border border-white/10 px-3.5 py-2.5">
              <span className="block text-[10px] font-medium uppercase tracking-wider text-white/65">
                {eventosComInscricao > 0 ? 'Com inscrição' : 'Neste mês'}
              </span>
              <span className="mt-0.5 block text-lg font-semibold text-white tabular-nums">
                {eventosComInscricao > 0 ? eventosComInscricao : eventosNoMes}{' '}
                <span className="text-[11px] font-normal text-white/70">
                  {(eventosComInscricao > 0 ? eventosComInscricao : eventosNoMes) === 1 ? 'ativo' : 'ativos'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Barra Unificada de Busca, Visualização e Filtros */}
      <section className="rounded-2xl border border-[#dce4e2] dark:border-white/10 bg-white dark:bg-[#161617] p-4 sm:p-5 shadow-[0_2px_14px_rgba(17,50,64,0.03)] space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Busca */}
          <div className="relative flex-1 min-w-0">
            <Search
              className="w-4 h-4 pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            />
            <input
              type="text"
              value={eventoSearch}
              onChange={(e) => setEventoSearch(e.target.value)}
              aria-label="Buscar evento, local ou cidade"
              placeholder="Buscar por evento, local, cidade ou público..."
              className="h-10 w-full rounded-xl bg-[#f4f6f5] dark:bg-[#222225] pl-10 pr-9 text-xs sm:text-sm text-[#113240] dark:text-[#f5f5f7] border border-transparent focus:border-[#226380] focus:bg-white dark:focus:bg-[#161617] focus:ring-2 focus:ring-[#226380]/15 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all outline-none"
            />
            {eventoSearch && (
              <button
                type="button"
                onClick={() => setEventoSearch('')}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-[#113240] dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Seletor de Modo de Visualização */}
          <div className="inline-flex items-center p-1 rounded-xl bg-[#f4f6f5] dark:bg-[#222225] border border-[#dce4e2]/70 dark:border-white/5 self-start sm:self-auto shrink-0">
            {([
              ['lista', 'Lista', List],
              ['calendario', 'Calendário', CalendarDays],
              ['quadro', 'Quadro', LayoutGrid],
            ] as const).map(([modo, label, Icon]) => {
              const ativo = eventoVisualizacao === modo;
              return (
                <button
                  key={modo}
                  type="button"
                  onClick={() => setEventoVisualizacao(modo)}
                  aria-pressed={ativo}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    ativo
                      ? 'bg-white text-[#113240] shadow-xs dark:bg-[#161617] dark:text-white'
                      : 'text-slate-500 hover:text-[#113240] dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtros por Tipo */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
          <div className="flex flex-wrap items-center gap-1.5">
            {TIPOS_AGENDA.map((tipo) => {
              const count = tipo === 'Todos' ? eventos.length : eventos.filter((e) => e.tipo === tipo).length;
              const ativo = eventoFiltroTipo === tipo;
              const visual = tipo !== 'Todos' ? getTipoVisual(tipo) : null;
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setEventoFiltroTipo(tipo)}
                  aria-pressed={ativo}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                    ativo
                      ? 'bg-[#113240] text-white shadow-xs dark:bg-[#226380] dark:text-white'
                      : count === 0 && tipo !== 'Todos'
                        ? 'bg-[#f4f6f5]/70 text-slate-400 hover:bg-[#e8eeed] hover:text-slate-600 dark:bg-white/[0.03] dark:text-slate-500 dark:hover:bg-white/10'
                        : 'bg-[#f4f6f5] text-slate-600 hover:bg-[#e6eded] hover:text-[#113240] dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                  }`}
                >
                  {visual && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${ativo ? 'bg-white/90' : visual.dot}`}
                      aria-hidden="true"
                    />
                  )}
                  <span>{tipo}</span>
                  {count > 0 && (
                    <span className={`text-[10px] tabular-nums ${ativo ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setEventoFiltroTipo('Todos');
                setEventoSearch('');
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#226380] dark:text-[#A3C3C7] hover:underline cursor-pointer shrink-0"
            >
              <X className="w-3 h-3" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>
      </section>

      {/* Conteúdo Principal: Lista Editorial / Calendário / Quadro */}
      {loadingEventos ? (
        <div className="rounded-2xl border border-[#dce4e2] dark:border-white/10 bg-white dark:bg-[#161617] py-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#226380] mb-2.5" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Carregando agenda provincial...
          </span>
        </div>
      ) : eventosFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#dce4e2] dark:border-white/15 bg-white dark:bg-[#161617] py-14 px-6 text-center space-y-2">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#f4f6f5] dark:bg-white/5 text-[#226380] dark:text-[#A3C3C7]">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-[#113240] dark:text-white">
            {eventosError
              ? 'Não foi possível carregar a agenda provincial'
              : 'Nenhum evento encontrado'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {eventosError
              ? 'Verifique sua conexão e tente novamente em alguns instantes.'
              : hasActiveFilters
                ? 'Nenhum compromisso corresponde à busca ou ao filtro selecionado.'
                : 'Não há eventos ativos publicados no portal neste momento.'}
          </p>
          {hasActiveFilters && !eventosError && (
            <button
              type="button"
              onClick={() => {
                setEventoFiltroTipo('Todos');
                setEventoSearch('');
              }}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#113240] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#226380] transition-colors cursor-pointer"
            >
              Mostrar todos os eventos
            </button>
          )}
        </div>
      ) : eventoVisualizacao === 'lista' ? (
        <div className="space-y-6">
          {gruposPorMes.map((grupo) => (
            <section key={grupo.chave} className="space-y-3">
              {/* Cabeçalho do Mês */}
              <div className="flex items-center gap-3 px-1">
                <span className="h-2 w-2 rounded-full bg-[#B58A55] shrink-0" aria-hidden="true" />
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#113240] dark:text-[#A3C3C7] whitespace-nowrap">
                  {grupo.titulo}
                </h3>
                <div className="h-px flex-1 bg-[#dce4e2] dark:bg-white/10" aria-hidden="true" />
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                  {grupo.itens.length} {grupo.itens.length === 1 ? 'evento' : 'eventos'}
                </span>
              </div>

              {/* Cards de Evento do Mês */}
              <div className="space-y-3">
                {grupo.itens.map((evt, idx) => {
                  const visual = getTipoVisual(evt.tipo);
                  const blocoData = extrairBlocoData(evt.data_inicio, evt.data_fim);
                  const proximidade = obterSeloProximidade(evt, hojeIso);
                  const linkGoogle = icalService.gerarLinkGoogleCalendar(evt);

                  return (
                    <article
                      key={evt.id}
                      style={staggerStyle(idx)}
                      className="motion-stagger-item group relative overflow-hidden rounded-2xl border border-[#dce4e2] dark:border-white/10 bg-white dark:bg-[#161617] p-4 sm:p-5 pl-5 sm:pl-6 shadow-[0_2px_10px_rgba(17,50,64,0.02)] hover:border-[#226380]/45 hover:shadow-[0_10px_28px_rgba(17,50,64,0.07)] transition-all"
                    >
                      {/* Faixa lateral semântica */}
                      <span
                        aria-hidden="true"
                        className={`absolute inset-y-0 left-0 w-1 ${visual.accentBar}`}
                      />

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Bloco Arquitetural de Data */}
                        <div className="flex sm:flex-col items-center justify-between sm:justify-center sm:w-[78px] shrink-0 rounded-xl bg-[#f4f6f5] dark:bg-[#1f2428] border border-[#dce4e2]/80 dark:border-white/10 px-3.5 py-2 sm:px-2 sm:py-2.5 text-center">
                          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#226380] dark:text-[#A3C3C7]">
                            {blocoData.mes}
                          </span>
                          <span className="text-base sm:text-xl font-bold leading-tight text-[#113240] dark:text-white tabular-nums sm:mt-0.5">
                            {blocoData.diaTexto}
                          </span>
                          {blocoData.semana && (
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:mt-0.5">
                              {blocoData.semana}
                            </span>
                          )}
                        </div>

                        {/* Corpo do Evento */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Selos */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${visual.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${visual.dot}`} aria-hidden="true" />
                              {evt.tipo}
                            </span>

                            {evt.publico_alvo && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-[#f4f6f5] dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-[#dce4e2]/70 dark:border-white/10">
                                <Users className="w-2.5 h-2.5 text-slate-400" />
                                {evt.publico_alvo}
                              </span>
                            )}

                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  evt.status === 'Confirmado'
                                    ? 'bg-emerald-500'
                                    : evt.status === 'Previsto'
                                      ? 'bg-amber-500'
                                      : 'bg-slate-400'
                                }`}
                                aria-hidden="true"
                              />
                              {evt.status}
                            </span>

                            {proximidade && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${proximidade.className}`}>
                                {proximidade.label}
                              </span>
                            )}

                            {evt.exige_inscricao && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#113240]/10 text-[#113240] dark:bg-[#A3C3C7]/15 dark:text-[#A3C3C7] border border-[#113240]/15 dark:border-[#A3C3C7]/25">
                                <FileText className="w-2.5 h-2.5" />
                                Inscrição aberta
                              </span>
                            )}
                          </div>

                          {/* Título */}
                          <h4 className="text-[15px] sm:text-base font-semibold tracking-[-0.015em] text-[#113240] dark:text-white leading-snug group-hover:text-[#226380] dark:group-hover:text-[#A3C3C7] transition-colors">
                            {evt.titulo}
                          </h4>

                          {/* Descrição */}
                          {evt.descricao && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 max-w-2xl">
                              {evt.descricao}
                            </p>
                          )}

                          {/* Metadados: Data completa, Horário, Local */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1.5 font-medium text-[#113240]/85 dark:text-slate-200">
                              <Calendar className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7] shrink-0" />
                              {formatPeriodo(evt.data_inicio, evt.data_fim)}
                            </span>

                            {evt.horario && (
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {evt.horario}
                              </span>
                            )}

                            {evt.local && (
                              <span className="inline-flex items-center gap-1.5 min-w-0">
                                <MapPin className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7] shrink-0" />
                                <span className="truncate">
                                  {evt.local}
                                  {evt.cidade ? ` • ${evt.cidade}${evt.uf ? `/${evt.uf}` : ''}` : ''}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ações à Direita */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5 shrink-0">
                          {evt.exige_inscricao && (() => {
                            const jaInscrito = respostasInscricoes.find(
                              (r) =>
                                (r.evento_id === evt.id || (evt.formulario_id && r.formulario_id === evt.formulario_id)) &&
                                (r.dados?.email === (religiosoData?.email_institucional || userEmail) ||
                                  r.dados?.nome_religioso === religiosoData?.nome_religioso ||
                                  r.dados?.nome_completo === religiosoData?.nome_civil),
                            );

                            const formVinculado = formulariosSecretaria.find((f) => f.id === evt.formulario_id);

                            if (jaInscrito) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (formVinculado) {
                                      onAbrirInscricao(evt, formVinculado);
                                    }
                                  }}
                                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Inscrito ({jaInscrito.protocolo})</span>
                                </button>
                              );
                            }

                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  if (formVinculado) {
                                    onAbrirInscricao(evt, formVinculado);
                                  } else if (formulariosError) {
                                    showToast.error('Não foi possível carregar os formulários de inscrição. Tente novamente mais tarde.');
                                  } else {
                                    showToast.info('O formulário para este evento ainda não foi publicado pela Secretaria.');
                                  }
                                }}
                                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold bg-[#113240] text-white hover:bg-[#226380] whitespace-nowrap shadow-xs cursor-pointer transition-all active:scale-95"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Inscrever-se</span>
                              </button>
                            );
                          })()}

                          <a
                            href={linkGoogle}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Adicionar este evento ao Google Agenda"
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#dce4e2] dark:border-white/10 bg-[#f4f6f5] dark:bg-white/5 px-3 py-1.5 text-[11px] font-medium text-[#113240] dark:text-slate-200 hover:border-[#226380]/40 hover:bg-[#226380]/10 hover:text-[#226380] dark:hover:text-[#A3C3C7] whitespace-nowrap transition-colors"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span>Salvar na agenda</span>
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#dce4e2] dark:border-white/10 bg-white dark:bg-[#161617] p-4 sm:p-5 shadow-[0_2px_14px_rgba(17,50,64,0.03)]">
          <AgendaVisualizacao modo={eventoVisualizacao} eventos={eventosFiltrados} />
        </div>
      )}

      <SincronizarCalendarioModal
        aberto={modalSyncAberto}
        onFechar={() => setModalSyncAberto(false)}
        eventos={eventos}
      />
    </div>
  );
};
