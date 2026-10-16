import React from 'react';
import { 
  ArrowLeft, Calendar, Search, X, Loader2, 
  FileText, MapPin, Clock, CheckCircle2 
} from 'lucide-react';
import type { EventoProvincial, FormularioSecretaria, RespostaFormulario } from '../../../types/secretaria';
import type { ReligiosoPortalData } from '../../../types/religioso';
import { AgendaVisualizacao } from '../../../components/AgendaVisualizacao';
import { staggerStyle } from '../../../hooks/useMotion';
import { showToast } from '../../../hooks/useFeedback';

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
  getTipoCor,
  respostasInscricoes,
  formulariosSecretaria,
  formulariosError,
  religiosoData,
  userEmail,
  onAbrirInscricao
}) => {
  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={onVoltar}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#161617] border border-[#d6d6d6]/60 dark:border-white/10 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#262628] transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Painel do Confrade</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#161617] rounded-[24px] sm:rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-5 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#707070] dark:text-[#86868b] block mb-1">
              Província BRM • Calendário Litúrgico e Provincial
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7]">
              Agenda Provincial 2026
            </h2>
            <p className="text-xs sm:text-sm text-[#707070] dark:text-[#86868b] font-normal mt-1 leading-relaxed max-w-2xl">
              Acompanhe os retiros, assembleias, celebrações patronais e encontros oficiais da Província Brasil Meridional.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#707070] dark:text-[#86868b] bg-[#f5f5f7] dark:bg-[#262628] px-4 py-2 rounded-full border border-[#d6d6d6]/40 dark:border-white/5 self-start md:self-auto">
            <Calendar className="w-4 h-4 text-[#0071e3]" />
            <span>{eventos.length} evento{eventos.length === 1 ? '' : 's'} na agenda</span>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-end">
          <div className="flex items-center gap-1 rounded-full bg-[#f5f5f7] p-1 dark:bg-[#262628]">
            {([
              ['lista', 'Lista'],
              ['calendario', 'Calendário'],
              ['quadro', 'Quadro'],
            ] as const).map(([modo, label]) => (
              <button
                key={modo}
                type="button"
                onClick={() => setEventoVisualizacao(modo)}
                aria-pressed={eventoVisualizacao === modo}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  eventoVisualizacao === modo
                    ? 'bg-white text-[#113240] shadow-sm dark:bg-[#161617] dark:text-white'
                    : 'text-[#707070] hover:text-[#113240] dark:text-[#86868b] dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros por Tipo de Evento */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-[#d6d6d6]/40 dark:border-white/5 mb-4">
          {['Todos', 'Assembleia', 'Retiro', 'Reunião', 'Encontro', 'Celebração / Solenidade', 'Visita Canônica', 'Outro'].map((tipo) => {
            const count = tipo === 'Todos' ? eventos.length : eventos.filter(e => e.tipo === tipo).length;
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => setEventoFiltroTipo(tipo)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  eventoFiltroTipo === tipo
                    ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f]'
                    : 'bg-[#f5f5f7] dark:bg-[#262628] text-[#707070] dark:text-[#86868b] hover:bg-[#e8e8ed] dark:hover:bg-[#333336]'
                }`}
              >
                {tipo} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Barra de Busca de Eventos */}
        <div className="relative mb-5 mt-4 sm:mt-0 sm:mb-6">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707070] dark:text-[#86868b]" />
          <input
            type="text"
            value={eventoSearch}
            onChange={(e) => setEventoSearch(e.target.value)}
            placeholder="Buscar evento, local ou cidade"
            className="min-h-12 w-full pl-10 pr-10 py-2.5 bg-[#f5f5f7] dark:bg-[#262628] border border-transparent focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#161617] rounded-xl sm:rounded-full text-base sm:text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#707070] dark:placeholder-[#86868b] transition-all outline-none"
          />
          {eventoSearch && (
            <button
              type="button"
              onClick={() => setEventoSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#707070] hover:text-[#1d1d1f] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Lista de Eventos */}
        {loadingEventos ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#0071e3] mb-2" />
            <span className="text-xs text-[#707070] dark:text-[#86868b]">Carregando agenda provincial...</span>
          </div>
        ) : eventosFiltrados.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#707070] dark:text-[#86868b] bg-[#f5f5f7]/60 dark:bg-[#262628]/40 rounded-[20px] p-6">
            {eventosError
              ? 'Não foi possível carregar a agenda provincial. Tente novamente mais tarde.'
              : 'Nenhum evento encontrado para o filtro selecionado.'}
          </div>
        ) : eventoVisualizacao === 'lista' ? (
          <div className="divide-y divide-[#d6d6d6]/40 dark:divide-white/5">
            {eventosFiltrados.map((evt, idx) => (
              <div key={evt.id} style={staggerStyle(idx)} className="my-2 rounded-[20px] border border-[#d6d6d6]/50 bg-white p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 hover:bg-[#f5f5f7] dark:border-white/10 dark:bg-[#1f1f21] dark:hover:bg-[#262628] transition-colors motion-stagger-item sm:border-0 sm:bg-transparent sm:px-3 sm:py-5 sm:dark:bg-transparent">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getTipoCor()}`}>
                      {evt.tipo}
                    </span>
                    {evt.publico_alvo && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f5f5f7] dark:bg-[#1d1d1f] text-[#707070] dark:text-[#86868b] border border-[#d6d6d6]/50 dark:border-white/10">
                        {evt.publico_alvo}
                      </span>
                    )}
                    {evt.exige_inscricao && (
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-[4px] bg-[#113240]/10 text-[#113240] dark:text-[#A3C3C7] border border-[#113240]/20 flex items-center gap-1">
                        <FileText className="w-2.5 h-2.5" />
                        Inscrição Aberta
                      </span>
                    )}
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-[4px] ${
                      evt.status === 'Confirmado'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {evt.status}
                    </span>
                  </div>

                  <h3 className="text-[16px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                    {evt.titulo}
                  </h3>

                  {evt.descricao && (
                    <p className="text-xs text-[#707070] dark:text-[#86868b] leading-relaxed max-w-2xl">
                      {evt.descricao}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#707070] dark:text-[#86868b] pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#226380]" />
                      <span>{evt.local}{evt.cidade ? ` • ${evt.cidade}/${evt.uf}` : ''}</span>
                    </span>
                    {evt.horario && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#707070]" />
                        <span>{evt.horario}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:w-auto">
                  <span className="inline-flex min-h-10 items-center gap-1.5 self-start rounded-[6px] px-3.5 py-1.5 text-xs font-semibold bg-[#f5f5f7] dark:bg-[#1d1d1f] text-[#1d1d1f] dark:text-[#f5f5f7] border border-[#d6d6d6]/60 dark:border-white/10 whitespace-nowrap shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-[#226380]" />
                    {formatPeriodo(evt.data_inicio, evt.data_fim)}
                  </span>

                  {evt.exige_inscricao && (() => {
                    const jaInscrito = respostasInscricoes.find(
                      r => (r.evento_id === evt.id || (evt.formulario_id && r.formulario_id === evt.formulario_id)) &&
                           (r.dados?.email === (religiosoData?.email_institucional || userEmail) || 
                            r.dados?.nome_religioso === religiosoData?.nome_religioso || 
                            r.dados?.nome_completo === religiosoData?.nome_civil)
                    );

                    const formVinculado = formulariosSecretaria.find(f => f.id === evt.formulario_id);

                    if (jaInscrito) {
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (formVinculado) {
                              onAbrirInscricao(evt, formVinculado);
                            }
                          }}
                          className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-1.5 rounded-[6px] px-4 py-2 text-sm sm:text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-[#113240] dark:text-white border border-slate-300 dark:border-slate-700 sm:whitespace-nowrap cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#226380]" />
                          <span>Inscrição ({jaInscrito.protocolo})</span>
                        </button>
                      );
                    }

                    return (
                      <button
                        type="button"
                        onClick={() => {
                          if (formVinculado) {
                            onAbrirInscricao(evt, formVinculado);
                          } else {
                            if (formulariosError) {
                              showToast.error('Não foi possível carregar os formulários de inscrição. Tente novamente mais tarde.');
                            } else {
                              showToast.info('O formulário para este evento ainda não foi publicado pela Secretaria.');
                            }
                          }
                        }}
                        className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-1.5 rounded-[6px] px-4 py-2 text-sm sm:text-xs font-semibold bg-[#113240] text-white hover:bg-[#226380] sm:whitespace-nowrap shadow-sm cursor-pointer transition-all active:scale-95"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Inscrever-se no Evento</span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AgendaVisualizacao modo={eventoVisualizacao} eventos={eventosFiltrados} />
        )}
      </div>
    </div>
  );
};
