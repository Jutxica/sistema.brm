import React, { useCallback, useMemo, useState } from 'react';
import { SincronizarCalendarioModal } from '../../../components/SincronizarCalendarioModal';
import {
  ArrowLeft, Calendar, CalendarDays, CalendarPlus, Search, X,
  Smartphone, FileText, MapPin, Clock, CheckCircle2, Users, List, LayoutGrid
} from 'lucide-react';
import type { EventoProvincial, FormularioSecretaria, RespostaFormulario } from '../../../types/secretaria';
import type { ReligiosoPortalData } from '../../../types/religioso';
import { AgendaVisualizacao } from '../../../components/AgendaVisualizacao';
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
const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DIAS_SEMANA_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

const obterProximidade = (
  evt: EventoProvincial,
  hojeIso: string,
): { label: string; emAndamento: boolean; urgente: boolean } | null => {
  const inicio = evt.data_inicio?.slice(0, 10);
  const fim = (evt.data_fim && evt.data_fim >= evt.data_inicio ? evt.data_fim : evt.data_inicio)?.slice(0, 10);
  if (!inicio || !fim) return null;

  if (hojeIso >= inicio && hojeIso <= fim) {
    return {
      label: inicio === fim ? 'Hoje' : 'Em andamento',
      emAndamento: true,
      urgente: true,
    };
  }

  const diffInicio = calcularDiasDiferenca(hojeIso, inicio);
  if (diffInicio === 1) {
    return { label: 'Amanhã', emAndamento: false, urgente: true };
  }
  if (diffInicio !== null && diffInicio > 1 && diffInicio <= 14) {
    return { label: `Em ${diffInicio} dias`, emAndamento: false, urgente: false };
  }

  const diffFim = calcularDiasDiferenca(fim, hojeIso);
  if (diffFim !== null && diffFim >= 1) {
    return { label: 'Encerrado ontem', emAndamento: false, urgente: false };
  }

  return null;
};

const extrairColunaData = (inicioIso: string, fimIso?: string | null) => {
  const dtInicio = parseIsoLocalDate(inicioIso);
  if (!dtInicio) {
    return { diaTexto: '—', legenda: '' };
  }
  const diaI = String(dtInicio.getDate());
  const mesNome = MESES_ABREV[dtInicio.getMonth()];
  const semI = DIAS_SEMANA_ABREV[dtInicio.getDay()];

  if (!fimIso || fimIso.slice(0, 10) === inicioIso.slice(0, 10)) {
    return { diaTexto: diaI, legenda: `${semI}, ${mesNome}` };
  }

  const dtFim = parseIsoLocalDate(fimIso);
  if (dtFim && dtFim.getMonth() === dtInicio.getMonth() && dtFim.getFullYear() === dtInicio.getFullYear()) {
    const diaF = String(dtFim.getDate());
    return { diaTexto: `${diaI}–${diaF}`, legenda: mesNome };
  }

  if (dtFim) {
    return { diaTexto: `${diaI}`, legenda: `${mesNome}–${MESES_ABREV[dtFim.getMonth()]}` };
  }

  return { diaTexto: diaI, legenda: `${semI}, ${mesNome}` };
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

  const encontrarInscricaoUsuario = useCallback(
    (evt: EventoProvincial) =>
      respostasInscricoes.find(
        (r) =>
          (r.evento_id === evt.id || (evt.formulario_id && r.formulario_id === evt.formulario_id)) &&
          (r.dados?.email === (religiosoData?.email_institucional || userEmail) ||
            r.dados?.nome_religioso === religiosoData?.nome_religioso ||
            r.dados?.nome_completo === religiosoData?.nome_civil),
      ),
    [respostasInscricoes, religiosoData, userEmail],
  );

  const eventosNoMes = useMemo(
    () => eventos.filter((evt) => evt.data_inicio?.slice(0, 7) === mesAtualPrefixo).length,
    [eventos, mesAtualPrefixo],
  );

  const eventosComInscricao = useMemo(
    () => eventos.filter((evt) => evt.exige_inscricao),
    [eventos],
  );

  const inscricoesConfirmadasUsuario = useMemo(
    () => eventosComInscricao.filter((evt) => Boolean(encontrarInscricaoUsuario(evt))).length,
    [eventosComInscricao, encontrarInscricaoUsuario],
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
            : 'Compromissos';
        mapa.set(chave, { chave, titulo, itens: [] });
      }
      mapa.get(chave)!.itens.push(evt);
    });

    return Array.from(mapa.values());
  }, [eventosFiltrados]);

  const tiposVisiveis = useMemo(() => {
    return TIPOS_AGENDA.filter(
      (tipo) => tipo === 'Todos' || tipo === eventoFiltroTipo || eventos.some((e) => e.tipo === tipo),
    );
  }, [eventos, eventoFiltroTipo]);

  const hasActiveFilters = eventoFiltroTipo !== 'Todos' || eventoSearch.trim().length > 0;
  const proximidadeProximo = proximoEvento ? obterProximidade(proximoEvento, hojeIso) : null;
  const inscricaoProximo = proximoEvento ? encontrarInscricaoUsuario(proximoEvento) : undefined;
  const formProximo = proximoEvento
    ? formulariosSecretaria.find((f) => f.id === proximoEvento.formulario_id)
    : undefined;

  const abrirInscricaoEvento = (evt: EventoProvincial, formVinculado?: FormularioSecretaria) => {
    if (formVinculado) {
      onAbrirInscricao(evt, formVinculado);
    } else if (formulariosError) {
      showToast.error('Não foi possível carregar os formulários de inscrição. Tente novamente mais tarde.');
    } else {
      showToast.info('O formulário para este evento ainda não foi publicado pela Secretaria.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Linha de retorno e cabeçalho direto (sem hero banner, sem gradiente) */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={onVoltar}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4f5f66] dark:text-[#a8b3b8] hover:text-[#113240] dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Painel do Religioso</span>
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#113240] dark:text-white leading-tight">
              Agenda Provincial {anoExibicao}
            </h1>
            <p className="mt-1 text-sm text-[#4f5f66] dark:text-[#a8b3b8]">
              {proximoEvento
                ? `Próximo compromisso: ${proximoEvento.titulo} em ${formatPeriodo(proximoEvento.data_inicio, proximoEvento.data_fim)}${proximidadeProximo ? ` (${proximidadeProximo.label.toLowerCase()})` : ''}.`
                : 'Compromissos, retiros, assembleias e celebrações oficiais da Província BRM.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalSyncAberto(true)}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-[#cad5d3] dark:border-[#343b3f] bg-white dark:bg-[#161617] px-3.5 text-xs font-medium text-[#113240] dark:text-[#edf2f1] hover:border-[#226380] hover:text-[#226380] dark:hover:border-[#A3C3C7] dark:hover:text-[#A3C3C7] transition-colors cursor-pointer sm:self-auto"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#55646b] dark:text-[#9ea9ae]" aria-hidden="true" />
            <span>Sincronizar no celular (.ics)</span>
          </button>
        </div>
      </div>

      {/* Faixa Única de Resumo (dividida por linhas de 1px, sem ícones em caixas, sem sombras) */}
      <section
        aria-label="Resumo da agenda"
        className="rounded-xl border border-[#dce4e2] dark:border-[#2a2f32] bg-white dark:bg-[#161617] grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#e8eeec] dark:divide-[#262b2e]"
      >
        {/* Bloco principal: Próximo compromisso */}
        <div className="lg:col-span-6 p-4 sm:p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[#4f5f66] dark:text-[#9ea9ae]">
              Próximo compromisso
            </span>
            {proximidadeProximo && (
              <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-[#e8f1f4] text-[#17485c] dark:bg-[#226380]/25 dark:text-[#A3C3C7]">
                {proximidadeProximo.label}
              </span>
            )}
          </div>

          {proximoEvento ? (
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-[#113240] dark:text-white leading-snug">
                {proximoEvento.titulo}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4f5f66] dark:text-[#a8b3b8]">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#113240] dark:text-[#edf2f1] tabular-nums">
                  <Calendar className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7]" aria-hidden="true" />
                  {formatPeriodo(proximoEvento.data_inicio, proximoEvento.data_fim)}
                  {proximoEvento.horario ? ` às ${proximoEvento.horario}` : ''}
                </span>
                {proximoEvento.local && (
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-[#55646b] dark:text-[#9ea9ae] shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {proximoEvento.local}
                      {proximoEvento.cidade ? `, ${proximoEvento.cidade}/${proximoEvento.uf}` : ''}
                    </span>
                  </span>
                )}
              </div>
              {proximoEvento.exige_inscricao && (
                <div className="pt-1">
                  {inscricaoProximo ? (
                    <button
                      type="button"
                      onClick={() => abrirInscricaoEvento(proximoEvento, formProximo)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#e6f4ec] dark:bg-[#172a1d] px-3 text-xs font-medium text-[#155134] dark:text-[#6fd39b] hover:bg-[#d8eee1] transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Inscrito · {inscricaoProximo.protocolo}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => abrirInscricaoEvento(proximoEvento, formProximo)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#113240] dark:bg-white px-3 text-xs font-medium text-white dark:text-[#113240] hover:bg-[#1b4a5e] dark:hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Inscrever-se agora</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#4f5f66] dark:text-[#a8b3b8]">
              Nenhum evento futuro publicado — aguarde novas datas da Secretaria.
            </p>
          )}
        </div>

        {/* Métricas reais somadas dos eventos exibidos */}
        <div className="lg:col-span-3 p-4 sm:p-5 flex flex-col justify-between gap-1">
          <span className="text-xs font-medium text-[#4f5f66] dark:text-[#9ea9ae]">
            Eventos ativos
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-medium text-[#113240] dark:text-white tabular-nums">
              {eventos.length}
            </span>
            <span className="text-xs text-[#4f5f66] dark:text-[#9ea9ae] tabular-nums">
              {eventosNoMes} neste mês
            </span>
          </div>
          <span className="text-xs text-[#55646b] dark:text-[#9ea9ae]">
            {hasActiveFilters
              ? `${eventosFiltrados.length} exibido${eventosFiltrados.length === 1 ? '' : 's'} no filtro atual`
              : 'Calendário oficial da Província'}
          </span>
        </div>

        <div className="lg:col-span-3 p-4 sm:p-5 flex flex-col justify-between gap-1">
          <span className="text-xs font-medium text-[#4f5f66] dark:text-[#9ea9ae]">
            Inscrições abertas
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-medium text-[#113240] dark:text-white tabular-nums">
              {eventosComInscricao.length}
            </span>
            <span className="text-xs text-[#4f5f66] dark:text-[#9ea9ae]">
              {eventosComInscricao.length === 1 ? 'evento' : 'eventos'}
            </span>
          </div>
          <span className="text-xs text-[#55646b] dark:text-[#9ea9ae] tabular-nums">
            {eventosComInscricao.length === 0
              ? 'Nenhuma inscrição exigida no momento'
              : `${inscricoesConfirmadasUsuario} de ${eventosComInscricao.length} confirmada${inscricoesConfirmadasUsuario === 1 ? '' : 's'} por você`}
          </span>
        </div>
      </section>

      {/* Folha Principal da Agenda: Controles + Lista/Calendário/Quadro */}
      <section className="rounded-xl border border-[#dce4e2] dark:border-[#2a2f32] bg-white dark:bg-[#161617] overflow-hidden">
        {/* Barra de Controles */}
        <div className="p-4 border-b border-[#e8eeec] dark:border-[#262b2e] space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Busca */}
            <div className="relative flex-1 min-w-0">
              <Search
                className="w-3.5 h-3.5 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#55646b] dark:text-[#9ea9ae]"
                aria-hidden="true"
              />
              <input
                type="text"
                value={eventoSearch}
                onChange={(e) => setEventoSearch(e.target.value)}
                aria-label="Buscar evento, local ou cidade"
                placeholder="Buscar por evento, local, cidade ou público"
                className="h-9 w-full rounded-lg border border-[#cad5d3] dark:border-[#343b3f] bg-white dark:bg-[#111416] pl-9 pr-8 text-sm text-[#113240] dark:text-[#edf2f1] placeholder:text-[#5c6c73] dark:placeholder:text-[#94a0a5] focus:border-[#226380] focus:outline-none transition-colors"
              />
              {eventoSearch && (
                <button
                  type="button"
                  onClick={() => setEventoSearch('')}
                  aria-label="Limpar busca"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#55646b] hover:text-[#113240] dark:text-[#9ea9ae] dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Seletor de Modo (largura ajustada às opções) */}
            <div
              role="group"
              aria-label="Modo de visualização da agenda"
              className="inline-flex h-9 items-center self-start rounded-lg bg-[#eef2f1] dark:bg-[#222629] p-0.5 sm:self-auto shrink-0"
            >
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
                    className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer ${
                      ativo
                        ? 'bg-white dark:bg-[#161617] text-[#113240] dark:text-white border border-[#dce4e2] dark:border-[#343b3f]'
                        : 'text-[#4f5f66] dark:text-[#a8b3b8] hover:text-[#113240] dark:hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtros por Tipo (neutros, sem arco-íris, exibindo tipos presentes na agenda) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {tiposVisiveis.map((tipo) => {
                const count = tipo === 'Todos' ? eventos.length : eventos.filter((e) => e.tipo === tipo).length;
                const ativo = eventoFiltroTipo === tipo;
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setEventoFiltroTipo(tipo)}
                    aria-pressed={ativo}
                    className={`inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                      ativo
                        ? 'bg-[#113240] text-white dark:bg-white dark:text-[#113240]'
                        : 'bg-[#f4f6f5] dark:bg-[#222629] text-[#4f5f66] dark:text-[#b4bfc4] hover:bg-[#e7eded] hover:text-[#113240] dark:hover:bg-[#2c3135] dark:hover:text-white'
                    }`}
                  >
                    <span>{tipo}</span>
                    <span
                      className={`text-[11px] tabular-nums ${
                        ativo ? 'text-white/80 dark:text-[#113240]/75' : 'text-[#5c6c73] dark:text-[#94a0a5]'
                      }`}
                    >
                      {count}
                    </span>
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
                className="inline-flex items-center gap-1 text-xs font-medium text-[#226380] dark:text-[#A3C3C7] hover:underline cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Limpar filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* Corpo da Agenda */}
        {loadingEventos ? (
          <div className="divide-y divide-[#eef2f1] dark:divide-[#24292c]" aria-busy="true" aria-label="Carregando agenda provincial">
            {[0, 1, 2].map((item) => (
              <div key={item} className="px-4 sm:px-5 py-4 flex items-center gap-5">
                <div className="w-16 space-y-1.5 shrink-0">
                  <div className="h-5 w-10 rounded bg-[#eef2f1] dark:bg-[#24292c]" />
                  <div className="h-3 w-14 rounded bg-[#f4f6f5] dark:bg-[#1e2225]" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-56 max-w-full rounded bg-[#eef2f1] dark:bg-[#24292c]" />
                  <div className="h-3 w-80 max-w-full rounded bg-[#f4f6f5] dark:bg-[#1e2225]" />
                </div>
              </div>
            ))}
          </div>
        ) : eventosError ? (
          <div className="p-6 text-sm text-[#4f5f66] dark:text-[#a8b3b8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p>Não foi possível carregar a agenda provincial. Tente recarregar a página em instantes.</p>
          </div>
        ) : eventosFiltrados.length === 0 ? (
          <div className="p-6">
            <div className="rounded-lg border border-dashed border-[#cad5d3] dark:border-[#343b3f] px-4 py-8 text-center space-y-2">
              <p className="text-sm font-medium text-[#113240] dark:text-white">
                {hasActiveFilters
                  ? 'Nenhum evento encontrado para o filtro selecionado.'
                  : 'Nenhum evento publicado na agenda provincial no momento.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setEventoFiltroTipo('Todos');
                    setEventoSearch('');
                  }}
                  className="inline-flex h-8 items-center rounded-lg border border-[#cad5d3] dark:border-[#343b3f] bg-white dark:bg-[#161617] px-3 text-xs font-medium text-[#113240] dark:text-white hover:border-[#226380] transition-colors cursor-pointer"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        ) : eventoVisualizacao === 'lista' ? (
          <div>
            {gruposPorMes.map((grupo, grupoIdx) => (
              <div key={grupo.chave} className={grupoIdx > 0 ? 'border-t border-[#e8eeec] dark:border-[#262b2e]' : ''}>
                {/* Cabeçalho do Mês — faixa tonal plana, sentence case */}
                <div className="flex items-center justify-between bg-[#f7f9f8] dark:bg-[#1c2023] px-4 sm:px-5 py-2 border-b border-[#e8eeec] dark:border-[#262b2e]">
                  <h2 className="text-xs font-semibold text-[#4f5f66] dark:text-[#b4bfc4]">
                    {grupo.titulo}
                  </h2>
                  <span className="text-xs text-[#55646b] dark:text-[#9ea9ae] tabular-nums">
                    {grupo.itens.length} {grupo.itens.length === 1 ? 'evento' : 'eventos'}
                  </span>
                </div>

                {/* Linhas Cronológicas da Pauta */}
                <div className="divide-y divide-[#eef2f1] dark:divide-[#24292c]">
                  {grupo.itens.map((evt) => {
                    const colData = extrairColunaData(evt.data_inicio, evt.data_fim);
                    const proximidade = obterProximidade(evt, hojeIso);
                    const jaInscrito = evt.exige_inscricao ? encontrarInscricaoUsuario(evt) : undefined;
                    const formVinculado = evt.exige_inscricao
                      ? formulariosSecretaria.find((f) => f.id === evt.formulario_id)
                      : undefined;
                    const linkGoogle = icalService.gerarLinkGoogleCalendar(evt);

                    return (
                      <article
                        key={evt.id}
                        className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-5 hover:bg-[#f9fbfa] dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Coluna Fixa de Data (alinhamento vertical consistente) */}
                        <div
                          className={`flex sm:flex-col items-baseline sm:items-start gap-2 sm:gap-0.5 sm:w-[92px] shrink-0 ${
                            proximidade?.emAndamento
                              ? 'sm:border-l-2 sm:border-[#226380] dark:sm:border-[#A3C3C7] sm:pl-3'
                              : ''
                          }`}
                        >
                          <span className="text-lg font-semibold text-[#113240] dark:text-white tabular-nums leading-none">
                            {colData.diaTexto}
                          </span>
                          <span className="text-xs text-[#55646b] dark:text-[#9ea9ae]">
                            {colData.legenda}
                          </span>
                        </div>

                        {/* Conteúdo do Evento */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-[#113240] dark:text-white leading-snug">
                              {evt.titulo}
                            </h3>

                            <span className="inline-flex h-5 items-center rounded bg-[#f1f4f3] dark:bg-[#24292c] px-2 text-[11px] font-medium text-[#3b4d54] dark:text-[#c7d1d5]">
                              {evt.tipo}
                            </span>

                            {proximidade && (
                              <span className="inline-flex h-5 items-center rounded bg-[#e8f1f4] dark:bg-[#226380]/25 px-2 text-[11px] font-medium text-[#17485c] dark:text-[#A3C3C7]">
                                {proximidade.label}
                              </span>
                            )}

                            {evt.status === 'Previsto' && (
                              <span className="inline-flex h-5 items-center rounded bg-[#fef6e4] dark:bg-[#332712] border border-[#f5dfa8] dark:border-[#5c451d] px-2 text-[11px] font-medium text-[#7c4d0f] dark:text-[#f0c674]">
                                Previsto
                              </span>
                            )}
                          </div>

                          {evt.descricao && (
                            <p className="text-xs text-[#4f5f66] dark:text-[#a8b3b8] leading-relaxed line-clamp-2 max-w-2xl">
                              {evt.descricao}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#55646b] dark:text-[#9ea9ae]">
                            <span className="inline-flex items-center gap-1.5 tabular-nums">
                              <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              {formatPeriodo(evt.data_inicio, evt.data_fim)}
                            </span>

                            {evt.horario && (
                              <span className="inline-flex items-center gap-1.5 tabular-nums">
                                <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                {evt.horario}
                              </span>
                            )}

                            {evt.local && (
                              <span className="inline-flex items-center gap-1.5 min-w-0">
                                <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                <span className="truncate">
                                  {evt.local}
                                  {evt.cidade ? `, ${evt.cidade}${evt.uf ? `/${evt.uf}` : ''}` : ''}
                                </span>
                              </span>
                            )}

                            {evt.publico_alvo && (
                              <span className="inline-flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                {evt.publico_alvo}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ações à Direita */}
                        <div className="flex items-center gap-2 shrink-0 sm:self-center pt-1 sm:pt-0">
                          {evt.exige_inscricao && (
                            jaInscrito ? (
                              <button
                                type="button"
                                onClick={() => abrirInscricaoEvento(evt, formVinculado)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#e6f4ec] dark:bg-[#172a1d] px-3 text-xs font-medium text-[#155134] dark:text-[#6fd39b] hover:bg-[#d8eee1] transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Inscrito · {jaInscrito.protocolo}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => abrirInscricaoEvento(evt, formVinculado)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#113240] dark:bg-white px-3.5 text-xs font-medium text-white dark:text-[#113240] hover:bg-[#1b4a5e] dark:hover:bg-slate-200 transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Inscrever-se</span>
                              </button>
                            )
                          )}

                          <a
                            href={linkGoogle}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Adicionar este evento ao Google Agenda"
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#cad5d3] dark:border-[#343b3f] bg-white dark:bg-[#161617] px-2.5 text-xs font-medium text-[#4f5f66] dark:text-[#b4bfc4] hover:border-[#226380] hover:text-[#113240] dark:hover:border-[#A3C3C7] dark:hover:text-white transition-colors whitespace-nowrap"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Google Agenda</span>
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <AgendaVisualizacao modo={eventoVisualizacao} eventos={eventosFiltrados} />
          </div>
        )}
      </section>

      <SincronizarCalendarioModal
        aberto={modalSyncAberto}
        onFechar={() => setModalSyncAberto(false)}
        eventos={eventos}
      />
    </div>
  );
};
