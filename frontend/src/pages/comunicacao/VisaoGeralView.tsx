import React from 'react';
import { 
  Plus, Video, CheckCircle2, Clock, Calendar as CalendarIcon, 
  ArrowRight, CheckSquare, Square, Gift, UploadCloud, 
  Layers, AlertCircle, FileText, ChevronRight, UserCheck
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

  // Filtrar aniversariantes dos próximos 15 dias
  const aniversariantesProximos = aniversariantes.filter(a => {
    if (a.mes === mesHoje) {
      return a.dia >= diaHoje && a.dia <= diaHoje + 15;
    }
    return false;
  }).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Topo: Cockpit de Produtividade & Ações Rápidas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#dce4e2] dark:border-[#354246]">
        <div>
          <h1 className="text-2xl font-bold text-[#113240] dark:text-white tracking-tight">
            Central de Produtividade · {usuarioNome.split(' ')[0]}
          </h1>
          <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] mt-0.5">
            Painel diário da equipe de comunicação da Província BRM. Ações práticas e prioridades do dia.
          </p>
        </div>

        {/* Barra de Alimentação Rápida */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onAbrirNovoConteudo('pauta')}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-50 text-[#113240] dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#226380]" />
            <span>Nova pauta</span>
          </button>

          <button
            type="button"
            onClick={() => onAbrirNovoConteudo('post')}
            className="px-3 py-1.5 rounded-lg bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo post</span>
          </button>

          <button
            type="button"
            onClick={() => onNavegarTab('captacao')}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-50 text-[#113240] dark:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Video className="w-3.5 h-3.5 text-amber-600" />
            <span>Agendar gravação</span>
          </button>

          <button
            type="button"
            onClick={() => onNavegarTab('estudio_arte')}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-50 text-[#113240] dark:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#226380]" />
            <span>Subir PSD / Mídia</span>
          </button>
        </div>
      </div>

      {/* Bloco 1: Fila de Conteúdos Travados em Aprovação */}
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-semibold text-[#113240] dark:text-white">
              Fila de aprovação urgente
            </h2>
            <span className="text-xs px-2 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-800">
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
          <div className="p-6 text-center text-xs text-[#52636a] dark:text-[#a0aeaf] bg-[#f8faf9] dark:bg-[#141a1c] border border-dashed border-[#dce4e2] dark:border-[#354246] rounded-lg">
            Nenhum conteúdo travado. Todas as artes e legendas submetidas estão aprovadas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {postsEmAprovacao.map(post => (
              <div
                key={post.id}
                className="p-3.5 rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-0.2 rounded bg-[#113240] text-white">
                      {post.formato}
                    </span>
                    <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
                      {post.area}
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

                <div className="pt-2 border-t border-[#dce4e2] dark:border-[#354246] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onAprovarPost(post.id)}
                    className="flex-1 py-1 px-2.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aprovar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPedirAjustes(post.id)}
                    className="py-1 px-2.5 rounded border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#1c2427] hover:bg-slate-100 text-[#52636a] dark:text-[#a0aeaf] text-xs font-medium transition-colors"
                  >
                    Pedir ajustes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid Duplo: Próximas Publicações & Gravações Agendadas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Próximas Publicações (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#226380]" />
              <h2 className="text-xs font-semibold text-[#113240] dark:text-white">
                Próximas publicações programadas
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavegarTab('cronograma')}
              className="text-xs text-[#226380] dark:text-[#A3C3C7] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Ver cronograma</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {postsProgramados.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#52636a] dark:text-[#a0aeaf] bg-[#f8faf9] dark:bg-[#141a1c] border border-dashed border-[#dce4e2] dark:border-[#354246] rounded-lg">
              Nenhuma postagem programada para os próximos dias.
            </div>
          ) : (
            <div className="space-y-2.5">
              {postsProgramados.slice(0, 4).map(post => (
                <div
                  key={post.id}
                  className="p-3 rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#113240] dark:text-white truncate">
                        {post.titulo}
                      </span>
                      <span className="text-xs px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-[#52636a] dark:text-[#a0aeaf]">
                        {post.formato}
                      </span>
                    </div>
                    <span className="text-xs text-[#52636a] dark:text-[#a0aeaf] block">
                      Programado para: <strong>{post.data_cronograma ? new Date(post.data_cronograma).toLocaleDateString('pt-BR') : 'Esta semana'}</strong>
                    </span>
                  </div>

                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium shrink-0">
                    Pronto
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gravações & Captações Agendadas (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-semibold text-[#113240] dark:text-white">
                Captações de vídeo da semana
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavegarTab('captacao')}
              className="text-xs text-[#226380] dark:text-[#A3C3C7] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Ver captações</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {captacoesProximas.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#52636a] dark:text-[#a0aeaf] bg-[#f8faf9] dark:bg-[#141a1c] border border-dashed border-[#dce4e2] dark:border-[#354246] rounded-lg">
              Nenhuma gravação agendada. Clique em "Agendar gravação" para marcar.
            </div>
          ) : (
            <div className="space-y-2.5">
              {captacoesProximas.slice(0, 3).map(cap => (
                <div
                  key={cap.id}
                  className="p-3 rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-semibold text-[#113240] dark:text-white block truncate">
                      {cap.titulo}
                    </span>
                    <span className="text-xs text-[#52636a] dark:text-[#a0aeaf] block">
                      Entrevistado: <strong>{cap.entrevistado_nome}</strong> · {cap.local}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-[#113240] dark:text-white block">
                      {new Date(cap.data_gravacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
                      {cap.duracao}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bloco 3: Tarefas Prioritárias & Radar de Confrades do Banco */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Tarefas Prioritárias (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#226380]" />
              <h2 className="text-xs font-semibold text-[#113240] dark:text-white">
                Tarefas prioritárias da equipe
              </h2>
              <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
                ({tarefasPendentes.length} pendentes)
              </span>
            </div>

            <button
              type="button"
              onClick={() => onNavegarTab('tarefas')}
              className="text-xs text-[#226380] dark:text-[#A3C3C7] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Abrir tarefas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {tarefasPendentes.slice(0, 4).map(tar => (
              <div
                key={tar.id}
                className="p-2.5 rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleTarefa(tar.id, true)}
                    className="text-slate-400 hover:text-[#226380] shrink-0"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium text-[#113240] dark:text-white truncate">
                    {tar.titulo}
                  </span>
                </div>

                {tar.responsavel_nome && (
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[#52636a] dark:text-[#a0aeaf] shrink-0">
                    {tar.responsavel_nome}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Radar de Confrades Aniversariantes do Banco Real (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#226380]" />
              <h2 className="text-xs font-semibold text-[#113240] dark:text-white">
                Radar de datas solenes da Província
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavegarTab('religiosos_conteudo')}
              className="text-xs text-[#226380] dark:text-[#A3C3C7] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Ver todos os confrades</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {aniversariantesProximos.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#52636a] dark:text-[#a0aeaf] bg-[#f8faf9] dark:bg-[#141a1c] border border-dashed border-[#dce4e2] dark:border-[#354246] rounded-lg">
              Nenhuma data solene nos próximos 15 dias.
            </div>
          ) : (
            <div className="space-y-2.5">
              {aniversariantesProximos.map(aniv => {
                const relCorrespondente = religiosos.find(r => r.id === aniv.religioso_id || r.nome_religioso === aniv.nome);

                return (
                  <div
                    key={aniv.id}
                    className="p-3 rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#113240] dark:text-white truncate">
                          {aniv.nome}
                        </span>
                        <span className="text-xs px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-800">
                          {aniv.tipo === 'ordenacao' ? `Jubileu ${aniv.anos} anos` : 'Aniversário'}
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
                      className="py-1 px-2.5 rounded bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
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
