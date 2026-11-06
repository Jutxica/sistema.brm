import React, { useState } from 'react';
import { 
  Users, TrendingUp, Calendar as CalendarIcon, ArrowRight, Plus, 
  Video, CheckCircle2, Clock, Eye, MessageCircle, Heart, Share2, Sparkles
} from 'lucide-react';
import type { ComunicacaoMetrica, ComunicacaoPost, ComunicacaoTarefa } from '../../types/comunicacao';

interface VisaoGeralViewProps {
  usuarioNome: string;
  metricas: ComunicacaoMetrica;
  posts: ComunicacaoPost[];
  tarefas: ComunicacaoTarefa[];
  onNavegarTab: (tabId: string) => void;
  onAbrirNovoConteudo: (tipo?: 'pauta' | 'post') => void;
}

export const VisaoGeralView: React.FC<VisaoGeralViewProps> = ({
  usuarioNome,
  metricas,
  posts,
  tarefas,
  onNavegarTab,
  onAbrirNovoConteudo
}) => {
  const [periodoSeguidores, setPeriodoSeguidores] = useState<'7' | '14' | '30'>('7');
  const [periodoAlcance, setPeriodoAlcance] = useState<'7' | '14' | '30'>('7');

  const postsEmAprovacao = posts.filter(p => p.status === 'aprovacao');
  const postsEmProducao = posts.filter(p => p.status === 'em_producao');
  const postsAprovados = posts.filter(p => p.status === 'aprovado');
  const postsPublicados = posts.filter(p => p.status === 'postado');
  const tarefasPendentes = tarefas.filter(t => !t.concluida);

  const statusText = postsEmAprovacao.length > 0 
    ? `${postsEmAprovacao.length} ${postsEmAprovacao.length === 1 ? 'conteúdo esperando aprovação' : 'conteúdos esperando aprovação'}.` 
    : 'Tudo em dia e nenhum conteúdo travado.';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header com Saudação Pessoal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#113240] dark:text-white tracking-tight">
            Boa tarde, {usuarioNome.split(' ')[0]}.
          </h1>
          <p className="text-sm text-[#66777b] dark:text-[#a0aeaf] mt-1">
            {statusText}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAbrirNovoConteudo('post')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo conteúdo</span>
          </button>
        </div>
      </div>

      {/* Grid Principal do Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 1. Card de Seguidores (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-[#113240] dark:text-white">Seguidores</span>
              <div className="flex bg-[#f4f6f5] dark:bg-white/5 rounded-lg p-0.5 text-xs font-medium">
                {(['7', '14', '30'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriodoSeguidores(p)}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      periodoSeguidores === p 
                        ? 'bg-white dark:bg-[#226380] text-[#113240] dark:text-white' 
                        : 'text-[#66777b] dark:text-[#a0aeaf]'
                    }`}
                  >
                    {p} dias
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-3xl font-extrabold text-[#113240] dark:text-white">
                {metricas.seguidores_total.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                +{metricas.seguidores_novos} novos
              </span>
            </div>
            <p className="text-xs text-[#66777b] dark:text-[#a0aeaf] mb-4">
              Total hoje · {metricas.seguidores_deixaram} deixaram de seguir no período
            </p>
          </div>

          {/* Gráfico Simulado de Barras */}
          <div className="pt-4 border-t border-[#dce4e2] dark:border-[#354246]">
            <span className="text-xs font-medium text-[#66777b] dark:text-[#a0aeaf] block mb-2">
              Novos seguidores por dia
            </span>
            <div className="flex items-end justify-between h-20 gap-1.5 px-1">
              {[18, 24, 15, 32, 28, 45, 38].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                  <div 
                    className="w-full bg-[#226380]/70 group-hover:bg-[#226380] rounded-t transition-colors"
                    style={{ height: `${(val / 45) * 100}%` }}
                    title={`${val} seguidores`}
                  />
                  <span className="text-xs text-[#86868b]">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Card de Alcance & Engajamento (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-[#113240] dark:text-white">Alcance e Audiência</span>
              <div className="flex bg-[#f4f6f5] dark:bg-white/5 rounded-lg p-0.5 text-xs font-medium">
                {(['7', '14', '30'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriodoAlcance(p)}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      periodoAlcance === p 
                        ? 'bg-white dark:bg-[#226380] text-[#113240] dark:text-white' 
                        : 'text-[#66777b] dark:text-[#a0aeaf]'
                    }`}
                  >
                    {p} dias
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <span className="text-xs font-medium text-[#66777b] dark:text-[#a0aeaf]">Contas</span>
                <p className="text-lg font-bold text-[#113240] dark:text-white mt-0.5">
                  {(metricas.contas_alcancadas / 1000).toFixed(1)}k
                </p>
                <span className="text-xs text-emerald-600 font-medium">▲ +{metricas.alcance_variacao_pct}%</span>
              </div>
              <div>
                <span className="text-xs font-medium text-[#66777b] dark:text-[#a0aeaf]">Engajamento</span>
                <p className="text-lg font-bold text-[#113240] dark:text-white mt-0.5">
                  {metricas.engajamento_pct}%
                </p>
                <span className="text-xs text-[#66777b]">▲ 1.4 p.p.</span>
              </div>
              <div>
                <span className="text-xs font-medium text-[#66777b] dark:text-[#a0aeaf]">Interações</span>
                <p className="text-lg font-bold text-[#113240] dark:text-white mt-0.5">
                  {metricas.interacoes_total.toLocaleString('pt-BR')}
                </p>
                <span className="text-xs text-emerald-600 font-medium">▲ +28,5%</span>
              </div>
            </div>

            <div className="mb-2">
              <span className="text-xs font-medium text-[#113240] dark:text-white">
                {(metricas.visualizacoes_total / 1000).toFixed(0)} mil visualizações totais
              </span>
            </div>
          </div>

          {/* Gráfico Simulado de Linha Suave */}
          <div className="pt-3 border-t border-[#dce4e2] dark:border-[#354246]">
            <div className="h-16 flex items-center justify-center relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 60" preserveAspectRatio="none">
                <path
                  d="M0,50 Q40,45 80,30 T160,20 T240,35 T300,10"
                  fill="none"
                  stroke="#226380"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="300" cy="10" r="4" fill="#226380" />
              </svg>
            </div>
            <div className="flex items-center justify-between text-xs text-[#86868b] mt-1">
              <span>Semana Anterior</span>
              <button 
                onClick={() => onNavegarTab('analise_instagram')}
                className="text-[#226380] dark:text-[#A3C3C7] font-semibold hover:underline"
              >
                Ver métricas completas →
              </button>
            </div>
          </div>
        </div>

        {/* 3. Card Mini-Calendário & Pautas Rápidas (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#113240] dark:text-white">
                Novembro 2026
              </span>
              <button
                onClick={() => onNavegarTab('cronograma')}
                className="text-xs text-[#226380] dark:text-[#A3C3C7] font-semibold hover:underline"
              >
                Ver mês →
              </button>
            </div>

            {/* Mini Grid de Dias */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-3">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                <span key={d} className="font-medium text-[#86868b]">{d}</span>
              ))}
              {Array.from({ length: 31 }, (_, i) => i + 1).slice(0, 21).map(day => {
                const temPost = [3, 10, 14, 16, 24, 28].includes(day);
                const isHoje = day === 6;
                return (
                  <div
                    key={day}
                    className={`h-6 rounded-md flex flex-col items-center justify-center font-medium ${
                      isHoje 
                        ? 'bg-[#226380] text-white font-bold' 
                        : 'text-[#113240] dark:text-[#edf2f1] hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{day}</span>
                    {temPost && (
                      <span className={`w-1 h-1 rounded-full ${isHoje ? 'bg-white' : 'bg-[#226380]'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#dce4e2] dark:border-[#354246]">
            <button
              onClick={() => onAbrirNovoConteudo('pauta')}
              className="w-full py-2 px-3 rounded-xl bg-[#e8f1f5] dark:bg-white/10 hover:bg-[#d8e8ee] dark:hover:bg-white/15 text-[#226380] dark:text-[#A3C3C7] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova pauta</span>
            </button>
            <button
              onClick={() => onNavegarTab('captacao')}
              className="w-full py-2 px-3 rounded-xl border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-50 dark:hover:bg-white/5 text-[#52636a] dark:text-[#edf2f1] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Video className="w-3.5 h-3.5 text-amber-500" />
              <span>Agendar Captação</span>
            </button>
          </div>
        </div>
      </div>

      {/* Linha Inferior: Tarefas Pendentes & Fluxo do Mês */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bloco "Para Fazer" (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#113240] dark:text-white">Para Fazer</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {tarefasPendentes.length} pendentes
              </span>
            </div>
            <button
              onClick={() => onNavegarTab('tarefas')}
              className="text-xs text-[#226380] dark:text-[#A3C3C7] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Abrir tarefas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {tarefasPendentes.slice(0, 3).map(tarefa => (
              <div
                key={tarefa.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                  <span className="text-xs font-medium text-[#113240] dark:text-[#edf2f1]">
                    {tarefa.titulo}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {tarefa.responsavel_nome && (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[#52636a] dark:text-[#a0aeaf] font-medium">
                      {tarefa.responsavel_nome}
                    </span>
                  )}
                  {tarefa.data_limite && (
                    <span className="text-xs text-[#86868b]">
                      até {new Date(tarefa.data_limite).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bloco "Fluxo do Mês & Produção" (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-[#113240] dark:text-white">Fluxo do Mês</span>
            <button
              onClick={() => onNavegarTab('producao')}
              className="text-xs text-[#226380] dark:text-[#A3C3C7] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Abrir produção</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246]">
              <span className="text-2xl font-bold text-[#113240] dark:text-white">
                {postsEmProducao.length}
              </span>
              <span className="block text-xs text-[#66777b] dark:text-[#a0aeaf] mt-1 font-medium">
                Em Produção
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
              <span className="text-2xl font-bold">
                {postsEmAprovacao.length}
              </span>
              <span className="block text-xs mt-1 font-semibold">
                Em Aprovação
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <span className="text-2xl font-bold">
                {postsAprovados.length}
              </span>
              <span className="block text-xs mt-1 font-semibold">
                Aprovados
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246]">
              <span className="text-2xl font-bold text-[#113240] dark:text-white">
                {postsPublicados.length}
              </span>
              <span className="block text-xs text-[#66777b] dark:text-[#a0aeaf] mt-1 font-medium">
                Publicados
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#dce4e2] dark:border-[#354246] flex items-center justify-between text-xs text-[#66777b] dark:text-[#a0aeaf]">
            <span>Mês no Feed: <strong>{postsPublicados.length + postsAprovados.length} programados</strong></span>
            <button
              onClick={() => onNavegarTab('previa_feed')}
              className="text-[#226380] dark:text-[#A3C3C7] font-semibold hover:underline"
            >
              Ver prévia do feed →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
