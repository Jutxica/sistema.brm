import React from 'react';
import { BarChart3, TrendingUp, Clock, Calendar as CalendarIcon, Users } from 'lucide-react';
import type { ComunicacaoMetrica } from '../../types/comunicacao';

interface InstagramAnalyticsViewProps {
  metricas: ComunicacaoMetrica;
}

export const InstagramAnalyticsView: React.FC<InstagramAnalyticsViewProps> = ({
  metricas
}) => {
  const faixasHorario = [
    { faixa: '06h-09h', media: 2051, total: 7 },
    { faixa: '09h-12h', media: 2462, total: 7 },
    { faixa: '12h-15h', media: 1277, total: 28 },
    { faixa: '15h-18h', media: 2494, total: 17 },
    { faixa: '18h-21h', media: 2150, total: 6 },
    { faixa: '21h-00h', media: 0, total: 0 }
  ];

  const diasSemana = [
    { dia: 'Domingo', media: 0, posts: 0 },
    { dia: 'Segunda', media: 1662, posts: 12 },
    { dia: 'Terça', media: 2100, posts: 13 },
    { dia: 'Quarta', media: 2450, posts: 15 },
    { dia: 'Quinta', media: 1980, posts: 13 },
    { dia: 'Sexta', media: 2150, posts: 11 },
    { dia: 'Sábado', media: 1200, posts: 1 }
  ];

  const storiesHorario = [
    { faixa: '06h-09h', media: 0, posts: 0 },
    { faixa: '09h-12h', media: 316, posts: 26 },
    { faixa: '12h-15h', media: 231, posts: 28 },
    { faixa: '15h-18h', media: 579, posts: 68 },
    { faixa: '18h-21h', media: 225, posts: 11 },
    { faixa: '21h-00h', media: 0, posts: 1 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#113240] dark:text-white tracking-tight">
          Análise de Audiência e Publicações
        </h1>
        <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] mt-1">
          Métricas consolidadas de alcance e engajamento da conta oficial da Província BRM.
        </p>
      </div>

      {/* Grid com 4 Gráficos Estratégicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Posts do feed por horário */}
        <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#113240] dark:text-white">
              Visualizações de Feed por Horário
            </h3>
            <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
              Média por post
            </span>
          </div>

          <div className="h-40 flex items-end justify-between gap-3 pt-4 px-2">
            {faixasHorario.map((f, i) => {
              const maxMedia = 2500;
              const alturaPct = f.media > 0 ? (f.media / maxMedia) * 100 : 8;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-[#113240] dark:text-white">
                    {f.media > 0 ? f.media.toLocaleString('pt-BR') : '—'}
                  </span>
                  <div
                    className={`w-full rounded-t transition-colors ${
                      f.media >= 2400 ? 'bg-[#226380]' : 'bg-[#226380]/60'
                    }`}
                    style={{ height: `${alturaPct}%` }}
                    title={`${f.total} conteúdos`}
                  />
                  <span className="text-xs text-[#52636a] dark:text-[#a0aeaf] mt-0.5">
                    {f.faixa}
                  </span>
                  <span className="text-xs text-slate-400">{f.total} posts</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] text-center pt-2 border-t border-[#dce4e2] dark:border-[#354246]">
            Média de visualizações por faixa horária de publicação.
          </p>
        </div>

        {/* 2. Posts do feed por dia da semana */}
        <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#113240] dark:text-white">
              Visualizações por Dia da Semana
            </h3>
            <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
              Desempenho semanal
            </span>
          </div>

          <div className="h-40 flex items-end justify-between gap-2 pt-4 px-1">
            {diasSemana.map((d, i) => {
              const maxMedia = 2500;
              const alturaPct = d.media > 0 ? (d.media / maxMedia) * 100 : 8;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-[#113240] dark:text-white">
                    {d.media > 0 ? d.media.toLocaleString('pt-BR') : '—'}
                  </span>
                  <div
                    className={`w-full rounded-t transition-colors ${
                      d.dia === 'Quarta' ? 'bg-[#113240]' : 'bg-[#113240]/60'
                    }`}
                    style={{ height: `${alturaPct}%` }}
                    title={`${d.posts} posts publicados`}
                  />
                  <span className="text-xs text-[#52636a] dark:text-[#a0aeaf] mt-0.5">
                    {d.dia.slice(0, 3)}
                  </span>
                  <span className="text-xs text-slate-400">{d.posts}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] text-center pt-2 border-t border-[#dce4e2] dark:border-[#354246]">
            Quarta e Sexta apresentam o maior volume de interações orgânicas.
          </p>
        </div>

        {/* 3. Stories por horário */}
        <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#113240] dark:text-white">
              Alcance de Stories por Horário
            </h3>
            <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
              Média de visualizações
            </span>
          </div>

          <div className="h-40 flex items-end justify-between gap-3 pt-4 px-2">
            {storiesHorario.map((s, i) => {
              const maxMedia = 600;
              const alturaPct = s.media > 0 ? (s.media / maxMedia) * 100 : 8;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-[#113240] dark:text-white">
                    {s.media > 0 ? s.media : '—'}
                  </span>
                  <div
                    className="w-full bg-[#226380] rounded-t transition-colors"
                    style={{ height: `${alturaPct}%` }}
                    title={`${s.posts} stories`}
                  />
                  <span className="text-xs text-[#52636a] dark:text-[#a0aeaf] mt-0.5">
                    {s.faixa}
                  </span>
                  <span className="text-xs text-slate-400">{s.posts}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] text-center pt-2 border-t border-[#dce4e2] dark:border-[#354246]">
            A faixa das 15h às 18h concentra o maior alcance médio em stories.
          </p>
        </div>

        {/* 4. Horários de Pico */}
        <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-[#113240] dark:text-white mb-3">
              Pico de Seguidores Ativos
            </h3>

            <div className="space-y-2.5">
              {metricas.horarios_pico_meta.map((pico, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246]"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-[#113240] dark:text-white">
                      {pico.dia}
                    </span>
                    <p className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
                      {pico.descricao}
                    </p>
                  </div>

                  <span className="text-xs font-bold text-[#226380] dark:text-[#A3C3C7] bg-[#e8f1f5] dark:bg-white/10 px-2.5 py-1 rounded-lg">
                    {pico.horario}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] pt-3 border-t border-[#dce4e2] dark:border-[#354246]">
            Histórico registrado conforme atualizações do Meta Insights.
          </p>
        </div>
      </div>
    </div>
  );
};
