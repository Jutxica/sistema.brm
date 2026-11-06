import React, { useState } from 'react';
import { Eye, CheckCircle, Clock, ShieldCheck, Bookmark } from 'lucide-react';
import type { ComunicacaoPost } from '../../types/comunicacao';

interface PreviaFeedViewProps {
  posts: ComunicacaoPost[];
  onAbrirPost: (post: ComunicacaoPost) => void;
}

export const PreviaFeedView: React.FC<PreviaFeedViewProps> = ({
  posts,
  onAbrirPost
}) => {
  const [mesSelecionado, setMesSelecionado] = useState('Novembro 2026');

  // Posts ordenados para o feed (do mais recente ao mais antigo)
  const postsFeed = [...posts].sort((a, b) => {
    const dataA = a.data_cronograma ? new Date(a.data_cronograma).getTime() : 0;
    const dataB = b.data_cronograma ? new Date(b.data_cronograma).getTime() : 0;
    return dataB - dataA;
  });

  const previasAnteriores = [
    'Novembro 2026',
    'Outubro 2026',
    'Setembro 2026',
    'Agosto 2026',
    'Julho 2026'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#113240] dark:text-white tracking-tight">
          Prévia do feed de {mesSelecionado}.
        </h1>
        <p className="text-sm text-[#66777b] dark:text-[#a0aeaf] mt-1">
          A grade com todos os conteúdos do mês, do mais recente ao mais antigo, exatamente como vai aparecer no perfil.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Simulador do Perfil Instagram (Grade 3x3) - 7 cols */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 space-y-6">
          {/* Header do Perfil Instagram */}
          <div className="flex items-center gap-4 pb-5 border-b border-[#dce4e2] dark:border-[#354246]">
            <div className="w-16 h-16 rounded-full border-2 border-[#226380] p-0.5 shrink-0">
              <div className="w-full h-full rounded-full bg-white dark:bg-[#1c2427] p-1 flex items-center justify-center">
                <img
                  src="/logo-branco.png"
                  alt="Dehonianos BRM"
                  className="w-10 h-10 object-contain rounded-full"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#113240] dark:text-white">
                  @dehonianosbrm
                </h2>
                <span className="w-2 h-2 rounded-full bg-[#226380]" title="Canal Oficial" />
              </div>

              <div className="flex items-center gap-4 text-xs text-[#113240] dark:text-white">
                <span><strong>{posts.length}</strong> no mês</span>
                <span><strong>12,4 mil</strong> seguidores</span>
                <span><strong>182</strong> seguindo</span>
              </div>

              <p className="text-xs text-[#66777b] dark:text-[#a0aeaf] leading-tight pt-1">
                Província Brasileira Meridional · Congregação dos Padres do Sagrado Coração de Jesus (SCJ) · Evangelização e Cuidado.
              </p>
            </div>
          </div>

          {/* Grade 3x3 do Feed */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {postsFeed.map((post) => {
              const primeiraArte = post.arquivos_arte[0]?.url;
              return (
                <div
                  key={post.id}
                  onClick={() => onAbrirPost(post)}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-[#dce4e2] dark:border-[#354246] cursor-pointer"
                >
                  {primeiraArte ? (
                    <img
                      src={primeiraArte}
                      alt={post.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3 text-center bg-slate-800 text-white text-xs font-medium">
                      {post.titulo}
                    </div>
                  )}

                  {/* Ribbon de Status no Topo do Post */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      post.status === 'aprovado'
                        ? 'bg-emerald-700 text-white'
                        : post.status === 'aprovacao'
                          ? 'bg-amber-700 text-white'
                          : post.status === 'postado'
                            ? 'bg-neutral-800 text-white'
                            : 'bg-[#226380] text-white'
                    }`}>
                      {post.status === 'aprovado' ? 'Aprovado' : post.status === 'aprovacao' ? 'Em Aprovação' : post.status === 'postado' ? 'Publicado' : 'Produção'}
                    </span>
                  </div>

                  {/* Overlay ao Passar o Mouse */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center text-white text-xs">
                    <p className="font-semibold line-clamp-2">{post.titulo}</p>
                    <span className="text-xs text-white/80 mt-1">Ver detalhes</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lado Direito: Prévias Guardadas & Linha Editorial (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Prévias Guardadas */}
          <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#113240] dark:text-white">
              Prévias guardadas
            </h2>
            <div className="flex flex-wrap gap-2">
              {previasAnteriores.map(mes => (
                <button
                  key={mes}
                  type="button"
                  onClick={() => setMesSelecionado(mes)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    mesSelecionado === mes
                      ? 'bg-[#113240] border-[#113240] text-white'
                      : 'border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#52636a] dark:text-[#a0aeaf]'
                  }`}
                >
                  {mes}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#86868b]">
              Cada mês que passa fica guardado aqui com a grade completa daquele período.
            </p>
          </div>

          {/* Diretrizes da Linha Editorial */}
          <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#226380]" />
              <h2 className="text-sm font-semibold text-[#113240] dark:text-white">
                Linha editorial da Província BRM
              </h2>
            </div>

            <div className="space-y-2 text-xs text-[#52636a] dark:text-[#a0aeaf] leading-relaxed">
              <p>
                <strong>Tom de Voz:</strong> Institucional, acolhedor, inspirador e sóbrio. Comunicar o calor do Sagrado Coração de Jesus sem afetação ou superficialidade.
              </p>
              <p>
                <strong>Estética Visual:</strong> Fotografias reais dos religiosos, comunidades e eventos pastorais. Evitar banco de imagens genérico ou artes poluídas.
              </p>
              <p>
                <strong>Carisma Dehoniano:</strong> Sempre vincular as mensagens à espiritualidade da reparação, amor e presença nas periferias existenciais.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
