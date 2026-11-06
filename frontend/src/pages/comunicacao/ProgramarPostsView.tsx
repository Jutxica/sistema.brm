import React, { useState } from 'react';
import { 
  Send, Clock, Download, Copy, Check, Sparkles, CheckCircle2, 
  Calendar as CalendarIcon, ExternalLink
} from 'lucide-react';
import type { ComunicacaoPost } from '../../types/comunicacao';

interface ProgramarPostsViewProps {
  posts: ComunicacaoPost[];
  onProgramarPost: (postId: string, dataHora: string) => void;
}

export const ProgramarPostsView: React.FC<ProgramarPostsViewProps> = ({
  posts,
  onProgramarPost
}) => {
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const postsParaProgramar = posts.filter(p => p.status === 'aprovado');
  const postsProgramados = posts.filter(p => p.status === 'programado');

  const copiarLegenda = (post: ComunicacaoPost) => {
    const textoCompleto = `${post.legenda || ''}\n\n${post.hashtags || ''}`;
    navigator.clipboard.writeText(textoCompleto);
    setCopiadoId(post.id);
    setTimeout(() => setCopiadoId(null), 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#113240] dark:text-white tracking-tight">
          Programar posts.
        </h1>
        <p className="text-sm text-[#66777b] dark:text-[#a0aeaf] mt-1">
          Fila de publicações aprovadas. Escolha a data e o horário e clique em Programar.
        </p>
      </div>

      {/* Banner de Dica de Horário Inteligente (Estilo Talita / FG) */}
      <div className="p-4 rounded-2xl bg-[#e8f1f5] dark:bg-[#226380]/20 border border-[#226380]/30 text-[#113240] dark:text-white flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-[#226380] dark:text-[#A3C3C7] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold">
            Melhor horário de audiência na Província BRM: nossos posts com maior alcance saíram entre <strong>15h e 18h</strong>.
          </p>
          <p className="text-[#52636a] dark:text-[#a0aeaf]">
            O Meta indica pico de seguidores mais ativos às <strong>17:00</strong> e <strong>21:00</strong> nas quartas e domingos.
          </p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246]">
          <span className="text-xs font-medium text-[#66777b] dark:text-[#a0aeaf]">
            Para Programar
          </span>
          <span className="block text-2xl font-black text-[#113240] dark:text-white mt-1">
            {postsParaProgramar.length}
          </span>
          <span className="text-xs text-[#66777b] dark:text-[#a0aeaf]">
            {postsParaProgramar.length === 0 ? 'tudo em dia' : 'aguardando dia e hora'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246]">
          <span className="text-xs font-medium text-[#66777b] dark:text-[#a0aeaf]">
            Programados
          </span>
          <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {postsProgramados.length}
          </span>
          <span className="text-xs text-[#66777b] dark:text-[#a0aeaf]">
            na fila do calendário
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246]">
          <span className="text-xs font-medium text-[#66777b] dark:text-[#a0aeaf]">
            Canais Sincronizados
          </span>
          <span className="block text-2xl font-black text-[#226380] dark:text-[#A3C3C7] mt-1">
            4
          </span>
          <span className="text-xs text-[#66777b] dark:text-[#a0aeaf]">
            Instagram, Facebook, YouTube, Site
          </span>
        </div>
      </div>

      {/* Seção "Para Programar" */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#113240] dark:text-white">
            Para Programar (Aprovados)
          </h2>
          <span className="text-xs text-[#86868b]">
            aprovados e ainda sem disparo definitivo
          </span>
        </div>

        {postsParaProgramar.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] text-center text-xs text-[#86868b]">
            Nenhum post aguardando programação.
          </div>
        ) : (
          postsParaProgramar.map(post => (
            <div
              key={post.id}
              className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="flex items-start gap-4">
                {post.arquivos_arte[0]?.url ? (
                  <img
                    src={post.arquivos_arte[0].url}
                    alt={post.titulo}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <CalendarIcon className="w-6 h-6 text-slate-400" />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Aprovado</span>
                    </span>
                    <span className="text-xs text-[#86868b]">
                      Data prevista: {post.data_cronograma ? new Date(post.data_cronograma).toLocaleDateString('pt-BR') : 'A definir'}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#113240] dark:text-white">
                    {post.titulo}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-[#66777b] dark:text-[#a0aeaf] pt-1">
                    <span>{post.arquivos_arte.length} artes</span>
                    <span>•</span>
                    <span>Legenda pronta</span>
                    <span>•</span>
                    <span>{post.canais.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Botões Operacionais & Ação de Programar */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => copiarLegenda(post)}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold text-[#113240] dark:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  {copiadoId === post.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar legenda</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onProgramarPost(post.id, post.data_cronograma || new Date().toISOString())}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Programar</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Seção "Programados" */}
      {postsProgramados.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-[#dce4e2] dark:border-[#354246]">
          <h2 className="text-sm font-semibold text-[#113240] dark:text-white">
            Programados na Fila ({postsProgramados.length})
          </h2>

          <div className="space-y-3">
            {postsProgramados.map(post => (
              <div
                key={post.id}
                className="p-4 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h3 className="text-xs font-semibold text-[#113240] dark:text-white">{post.titulo}</h3>
                    <p className="text-xs text-[#66777b] dark:text-[#a0aeaf]">
                      Agendado para {post.data_cronograma ? new Date(post.data_cronograma).toLocaleDateString('pt-BR') : ''} às {post.horario_agendado || '15:00'}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200">
                  Pronto para publicação
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
