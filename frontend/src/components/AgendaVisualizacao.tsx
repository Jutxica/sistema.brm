import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

export interface EventoVisualizacao {
  id: string;
  titulo: string;
  data_inicio: string;
  data_fim?: string | null;
  horario?: string | null;
  local?: string | null;
  tipo?: string | null;
  status?: string | null;
  publico_alvo?: string | null;
  exige_inscricao?: boolean;
  formulario_id?: string | null;
}

interface AgendaVisualizacaoProps<T extends EventoVisualizacao> {
  modo: 'calendario' | 'quadro';
  eventos: T[];
  renderAcoes?: (evento: T) => React.ReactNode;
}

const ESTADOS_QUADRO = ['Previsto', 'Confirmado', 'Concluído', 'Cancelado'];
const NOMES_DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const dataLocal = (isoDate: string) => {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
};

const classeStatus = (status?: string | null) => {
  if (status === 'Concluído') return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  if (status === 'Cancelado') return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
  if (status === 'Previsto') return 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
  return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
};

export function AgendaVisualizacao<T extends EventoVisualizacao>({
  modo,
  eventos,
  renderAcoes,
}: AgendaVisualizacaoProps<T>) {
  const [mesVisivel, setMesVisivel] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });

  const diasDoMes = useMemo(() => {
    const inicio = new Date(mesVisivel.getFullYear(), mesVisivel.getMonth(), 1);
    const domingoInicial = new Date(inicio);
    domingoInicial.setDate(inicio.getDate() - inicio.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const dia = new Date(domingoInicial);
      dia.setDate(domingoInicial.getDate() + index);
      return dia;
    });
  }, [mesVisivel]);

  const labelMes = mesVisivel.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const renderCartao = (evento: T, compacto = false) => (
    <article
      key={evento.id}
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${
        compacto ? 'text-[11px]' : 'text-xs'
      }`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {evento.tipo && (
          <span className="rounded bg-[#226380]/10 px-1.5 py-0.5 font-medium text-[#226380] dark:text-[#A3C3C7]">
            {evento.tipo}
          </span>
        )}
        {evento.status && (
          <span className={`rounded px-1.5 py-0.5 font-medium ${classeStatus(evento.status)}`}>
            {evento.status}
          </span>
        )}
      </div>
      <h3 className="mt-1.5 font-semibold leading-snug text-[#113240] dark:text-white">{evento.titulo}</h3>
      {compacto && evento.exige_inscricao && evento.formulario_id && (
        <a
          href={`/formularios/${encodeURIComponent(evento.formulario_id)}`}
          className="mt-1 inline-flex rounded bg-[#113240] px-1.5 py-1 font-semibold text-white hover:bg-[#226380]"
        >
          Formulário
        </a>
      )}
      {compacto && renderAcoes && <div className="mt-1 flex flex-wrap gap-1">{renderAcoes(evento)}</div>}
      {!compacto && (
        <>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {dataLocal(evento.data_inicio).toLocaleDateString('pt-BR')}
            {evento.horario ? ` • ${evento.horario}` : ''}
          </p>
          {evento.local && (
            <p className="mt-1 flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{evento.local}</span>
            </p>
          )}
          {evento.publico_alvo && <p className="mt-1 text-slate-500 dark:text-slate-400">{evento.publico_alvo}</p>}
          {evento.exige_inscricao && evento.formulario_id && (
            <a
              href={`/formularios/${encodeURIComponent(evento.formulario_id)}`}
              className="mt-2 inline-flex rounded-md bg-[#113240] px-2.5 py-1.5 font-semibold text-white hover:bg-[#226380]"
            >
              Abrir formulário
            </a>
          )}
          {renderAcoes && <div className="mt-2 flex flex-wrap gap-1.5">{renderAcoes(evento)}</div>}
        </>
      )}
    </article>
  );

  if (modo === 'quadro') {
    return (
      <div className="grid gap-4 xl:grid-cols-4">
        {ESTADOS_QUADRO.map((status) => {
          const eventosColuna = eventos.filter((evento) => evento.status === status);
          return (
            <section
              key={status}
              className="min-h-40 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/30"
            >
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  {status}
                </h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  {eventosColuna.length}
                </span>
              </header>
              <div className="space-y-2">
                {eventosColuna.map((evento) => renderCartao(evento))}
                {eventosColuna.length === 0 && (
                  <p className="py-4 text-center text-[11px] text-slate-400">Nenhum evento</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
        <button
          type="button"
          onClick={() => setMesVisivel((mes) => new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}
          className="rounded-md p-2 text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-semibold capitalize text-[#113240] dark:text-white">{labelMes}</h3>
        <button
          type="button"
          onClick={() => setMesVisivel((mes) => new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}
          className="rounded-md p-2 text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </header>
      <div className="grid grid-cols-7">
        {NOMES_DIAS.map((dia) => (
          <div key={dia} className="border-b border-r border-slate-200 px-1 py-2 text-center text-[10px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {dia}
          </div>
        ))}
        {diasDoMes.map((dia) => {
          const chaveDia = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
          const eventosDia = eventos.filter((evento) => evento.data_inicio <= chaveDia && (evento.data_fim || evento.data_inicio) >= chaveDia);
          const pertenceMes = dia.getMonth() === mesVisivel.getMonth();
          return (
            <div
              key={chaveDia}
              className={`min-h-24 border-b border-r border-slate-200 p-1 dark:border-slate-800 sm:min-h-32 sm:p-2 ${
                pertenceMes ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-950/50'
              }`}
            >
              <span className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                pertenceMes ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'
              }`}>
                {dia.getDate()}
              </span>
              <div className="space-y-1">
                {eventosDia.slice(0, 2).map((evento) => (
                  <div key={evento.id} title={evento.titulo}>{renderCartao(evento, true)}</div>
                ))}
                {eventosDia.length > 2 && (
                  <p className="px-1 text-[10px] text-slate-500">+{eventosDia.length - 2} eventos</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
