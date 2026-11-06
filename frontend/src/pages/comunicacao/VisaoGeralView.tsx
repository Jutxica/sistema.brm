import React from 'react';
import { 
  Plus, Video, CheckCircle2, Clock, Calendar as CalendarIcon, 
  ArrowRight, CheckSquare, Square, Gift, UploadCloud, 
  Layers, AlertCircle, FileText, ChevronRight, Sparkles, Send, Kanban
} from 'lucide-react';
import type { 
  ComunicacaoPost, 
  ComunicacaoTarefa, 
  ComunicacaoCaptacao, 
  AniversarianteProvincia,
  ReligiosoConteudo 
} from '../../types/comunicacao';

interface VisaoGeralViewProps {
  usuarioNome: string;
  posts: ComunicacaoPost[];
  tarefas: ComunicacaoTarefa[];
  captacoes: ComunicacaoCaptacao[];
  aniversariantes: AniversarianteProvincia[];
  religiosos: ReligiosoConteudo[];
  onNavegarTab: (tabId: string) => void;
  onAbrirNovoConteudo: (tipo?: 'pauta' | 'post', dataIso?: string) => void;
  onAprovarPost: (postId: string) => void;
  onPedirAjustes: (postId: string) => void;
  onToggleTarefa: (tarefaId: string, concluida: boolean) => void;
  onCriarHomenagemReligioso: (religioso: ReligiosoConteudo) => void;
}

export const VisaoGeralView: React.FC<VisaoGeralViewProps> = ({
  usuarioNome,
  posts,
  tarefas,
  captacoes,
  aniversariantes,
  religiosos,
  onNavegarTab,
  onAbrirNovoConteudo,
  onAprovarPost,
  onPedirAjustes,
  onToggleTarefa,
  onCriarHomenagemReligioso
}) => {
  const postsEmAprovacao = posts.filter(p => p.status === 'aprovacao');
  const postsProgramados = posts.filter(p => p.status === 'programado' || p.status === 'aprovado');
  const captacoesProximas = captacoes.filter(c => c.situacao === 'agendada');
  const tarefasPendentes = tarefas.filter(t => !t.concluida);

  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const mesHoje = hoje.getMonth() + 1;
  const hora = hoje.getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  // Filtrar aniversariantes dos próximos 15 dias
  const aniversariantesProximos = aniversariantes.filter(a => {
    if (a.mes === mesHoje) {
      return a.dia >= diaHoje && a.dia <= diaHoje + 15;
    }
    return false;
  }).slice(0, 4);

  const statusText = postsEmAprovacao.length > 0 
    ? `${postsEmAprovacao.length} ${postsEmAprovacao.length === 1 ? 'conteúdo aguardando aprovação na fila' : 'conteúdos aguardando aprovação na fila'}.` 
    : 'Tudo em dia e nenhum conteúdo travado na aprovação.';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Card Nobre de Saudação com Cockpit & Ações Rápidas em Ordem Lógica */}
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 sm:p-7 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-[#52636a] dark:text-[#a0aeaf]">
                Central de Comunicação · Província BRM
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#113240] dark:text-white tracking-tight">
              {saudacao}, Comunicação BRM.
            </h1>
            <p className="text-xs sm:text-sm text-[#66777b] dark:text-[#a0aeaf]">
              {statusText}
            </p>
          </div>

          {/* Botões de Ação Rápida Estruturados em Ordem Lógica de Produção */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Criar Post (Ação Primária) */}
            <button
              type="button"
              onClick={() => onAbrirNovoConteudo('post')}
              className="px-4 py-2.5 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo post</span>
            </button>

            {/* 2. Nova Pauta (Planejamento) */}
            <button
              type="button"
              onClick={() => onAbrirNovoConteudo('pauta')}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-50 text-[#113240] dark:text-white text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4 text-[#226380]" />
              <span>Nova pauta</span>
            </button>

            {/* 3. Agendar Gravação (Captação) */}
            <button
              type="button"
              onClick={() => onNavegarTab('captacao')}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-50 text-[#113240] dark:text-white text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Video className="w-4 h-4 text-amber-600" />
              <span>Agendar gravação</span>
            </button>

            {/* 4. Subir PSD / Mídia (Assets) */}
            <button
              type="button"
              onClick={() => onNavegarTab('estudio_arte')}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-50 text-[#113240] dark:text-white text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-[#226380]" />
              <span>Subir PSD / mídia</span>
            </button>
          </div>
        </div>

        {/* 4 Indicadores Rápidos do Cockpit Operacional */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#dce4e2] dark:border-[#354246]">
          <div 
            onClick={() => onNavegarTab('aprovacao')}
            className="p-3.5 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] cursor-pointer hover:border-[#226380] transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-[#52636a] dark:text-[#a0aeaf]">
              <span>Em aprovação</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="block text-2xl font-bold text-[#113240] dark:text-white mt-1">
              {postsEmAprovacao.length}
            </span>
            <span className="block text-xs text-[#86868b] mt-0.5">
              {postsEmAprovacao.length === 0 ? 'Fila limpa' : 'Aguardando validação'}
            </span>
          </div>

          <div 
            onClick={() => onNavegarTab('programar')}
            className="p-3.5 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] cursor-pointer hover:border-[#226380] transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-[#52636a] dark:text-[#a0aeaf]">
              <span>Programados</span>
              <Send className="w-3.5 h-3.5 text-[#226380]" />
            </div>
            <span className="block text-2xl font-bold text-[#113240] dark:text-white mt-1">
              {postsProgramados.length}
            </span>
            <span className="block text-xs text-[#86868b] mt-0.5">Prontos para postagem</span>
          </div>

          <div 
            onClick={() => onNavegarTab('captacao')}
            className="p-3.5 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] cursor-pointer hover:border-[#226380] transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-[#52636a] dark:text-[#a0aeaf]">
              <span>Gravações</span>
              <Video className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="block text-2xl font-bold text-[#113240] dark:text-white mt-1">
              {captacoesProximas.length}
            </span>
            <span className="block text-xs text-[#86868b] mt-0.5">Captações agendadas</span>
          </div>

          <div 
            onClick={() => onNavegarTab('tarefas')}
            className="p-3.5 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] cursor-pointer hover:border-[#226380] transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-[#52636a] dark:text-[#a0aeaf]">
              <span>Tarefas da equipe</span>
              <CheckSquare className="w-3.5 h-3.5 text-[#226380]" />
            </div>
            <span className="block text-2xl font-bold text-[#113240] dark:text-white mt-1">
              {tarefasPendentes.length}
            </span>
            <span className="block text-xs text-[#86868b] mt-0.5">Pendentes no checklist</span>
          </div>
        </div>
      </div>

      {/* Bloco 1: Fila de Conteúdos em Aprovação */}
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-semibold text-[#113240] dark:text-white">
              Fila de aprovação urgente
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-800">
              {postsEmAprovacao.length} aguardando liberação
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavegarTab('aprovacao')}
            className="text-xs text-[#226380] dark:text-[#A3C3C7] font-semibold hover:underline flex items-center gap-1"
          >
            <span>Abrir tela de aprovação</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {postsEmAprovacao.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#52636a] dark:text-[#a0aeaf] bg-[#f8faf9] dark:bg-[#141a1c] border border-dashed border-[#dce4e2] dark:border-[#354246] rounded-xl">
            Nenhum conteúdo travado. Todas as artes e legendas submetidas estão aprovadas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {postsEmAprovacao.slice(0, 3).map(post => (
              <div
                key={post.id}
                className="p-4 rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[#113240] dark:text-white font-medium">
                      {post.formato}
                    </span>
                    <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
                      {post.horario_agendado || '15:00'}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-[#113240] dark:text-white line-clamp-2">
                    {post.titulo}
                  </h3>

                  {post.legenda && (
                    <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] line-clamp-2">
                      {post.legenda}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#dce4e2] dark:border-[#354246] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onPedirAjustes(post.id)}
                    className="flex-1 py-1.5 px-2.5 rounded bg-white dark:bg-[#253034] hover:bg-slate-100 text-[#52636a] dark:text-[#a0aeaf] text-xs font-medium border border-[#dce4e2] dark:border-[#354246] transition-colors"
                  >
                    Ajustes
                  </button>

                  <button
                    type="button"
                    onClick={() => onAprovarPost(post.id)}
                    className="flex-1 py-1.5 px-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aprovar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid de 2 Colunas: Tarefas Prioritárias & Radar da Província */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Minhas Prioridades do Dia */}
        <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#226380]" />
              <h2 className="text-xs font-semibold text-[#113240] dark:text-white">
                Prioridades da equipe de comunicação
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavegarTab('tarefas')}
              className="text-xs text-[#226380] dark:text-[#A3C3C7] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Ver todas ({tarefasPendentes.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {tarefasPendentes.length === 0 ? (
              <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] text-center py-4">
                Nenhuma tarefa pendente para hoje. Tudo concluído!
              </p>
            ) : (
              tarefasPendentes.slice(0, 5).map(tarefa => (
                <div
                  key={tarefa.id}
                  className="p-3 rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] flex items-center justify-between gap-3 hover:border-[#226380] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleTarefa(tarefa.id, true)}
                      className="text-slate-400 hover:text-emerald-500 transition-colors shrink-0"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-[#113240] dark:text-white truncate">
                      {tarefa.titulo}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {tarefa.responsavel_nome && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[#52636a] dark:text-[#a0aeaf]">
                        {tarefa.responsavel_nome}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Coluna 2: Radar da Província (Aniversários e Jubileus) */}
        <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-rose-600" />
              <h2 className="text-xs font-semibold text-[#113240] dark:text-white">
                Radar da Província · Próximos 15 dias
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavegarTab('aniversariantes')}
              className="text-xs text-[#226380] dark:text-[#A3C3C7] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Ver calendário completo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {aniversariantesProximos.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#52636a] dark:text-[#a0aeaf] bg-[#f8faf9] dark:bg-[#141a1c] border border-dashed border-[#dce4e2] dark:border-[#354246] rounded-xl">
              Nenhuma data solene ou jubileu nos próximos 15 dias.
            </div>
          ) : (
            <div className="space-y-2.5">
              {aniversariantesProximos.map(aniv => {
                const relCorrespondente = religiosos.find(r => r.id === aniv.religioso_id || r.nome_religioso === aniv.nome);

                return (
                  <div
                    key={aniv.id}
                    className="p-3 rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#113240] dark:text-white truncate">
                          {aniv.nome}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-900/40">
                          {aniv.tipo === 'ordenacao' ? `Jubileu ${aniv.anos} anos` : 'Natalício'}
                        </span>
                      </div>
                      <span className="text-xs text-[#52636a] dark:text-[#a0aeaf] block truncate">
                        Dia {aniv.dia}/{aniv.mes} · {aniv.comunidade || 'Província BRM'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (relCorrespondente) {
                          onCriarHomenagemReligioso(relCorrespondente);
                        } else {
                          onAbrirNovoConteudo('post');
                        }
                      }}
                      className="py-1 px-2.5 rounded-lg bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Homenagem</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
