import React, { useState } from 'react';
import { 
  CheckCircle2, AlertCircle, XCircle, MessageSquare, Send, Image as ImageIcon, 
  Layers, Maximize2, Clock, Check
} from 'lucide-react';
import type { ComunicacaoPost, ComunicacaoComentario } from '../../types/comunicacao';

interface AprovacaoViewProps {
  posts: ComunicacaoPost[];
  comentarios: Record<string, ComunicacaoComentario[]>;
  onAprovar: (postId: string) => void;
  onPedirAjustes: (postId: string) => void;
  onAdicionarComentario: (postId: string, mensagem: string, escopo: string, slideNum?: number) => void;
  onAbrirPhotoCraft: (arquivoUrl?: string, arquivoNome?: string) => void;
}

export const AprovacaoView: React.FC<AprovacaoViewProps> = ({
  posts,
  comentarios,
  onAprovar,
  onPedirAjustes,
  onAdicionarComentario,
  onAbrirPhotoCraft
}) => {
  const postsAguardando = posts.filter(p => p.status === 'aprovacao');
  const [postSelecionadoId, setPostSelecionadoId] = useState<string>(
    postsAguardando[0]?.id || ''
  );
  const [novoComentario, setNovoComentario] = useState('');
  const [escopoComentario, setEscopoComentario] = useState('post_todo');
  const [slideZoom, setSlideZoom] = useState<string | null>(null);

  const postAtivo = postsAguardando.find(p => p.id === postSelecionadoId) || postsAguardando[0];
  const comentariosDoPost = postAtivo ? (comentarios[postAtivo.id] || []) : [];

  const handleEnviarComentario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoComentario.trim() || !postAtivo) return;

    const slideNum = escopoComentario.startsWith('slide_') 
      ? parseInt(escopoComentario.replace('slide_', ''), 10) 
      : undefined;

    onAdicionarComentario(postAtivo.id, novoComentario, escopoComentario, slideNum);
    setNovoComentario('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#113240] dark:text-white tracking-tight">
          Aprovação
        </h1>
        <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] mt-1">
          {postsAguardando.length} {postsAguardando.length === 1 ? 'conteúdo aguardando revisão' : 'conteúdos aguardando revisão'}. Avalie a arte, registre comentários por lâmina e decida o encaminhamento.
        </p>
      </div>

      {postsAguardando.length === 0 ? (
        <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <h2 className="text-sm font-semibold text-[#113240] dark:text-white">
            Tudo revisado
          </h2>
          <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] mt-0.5">
            Não há publicações pendentes de aprovação no momento.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Seletor se houver mais de um post */}
          {postsAguardando.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {postsAguardando.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPostSelecionadoId(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                    postAtivo?.id === p.id
                      ? 'bg-[#113240] text-white border-[#113240]'
                      : 'bg-white dark:bg-[#1c2427] border-[#dce4e2] dark:border-[#354246] text-[#52636a] dark:text-[#a0aeaf]'
                  }`}
                >
                  {p.titulo}
                </button>
              ))}
            </div>
          )}

          {postAtivo && (
            <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-5">
              {/* Cabeçalho do Post em Aprovação */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#dce4e2] dark:border-[#354246]">
                <div>
                  <h2 className="text-base font-semibold text-[#113240] dark:text-white">
                    {postAtivo.titulo}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#52636a] dark:text-[#a0aeaf]">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {postAtivo.area}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {postAtivo.formato}
                    </span>
                    {postAtivo.data_cronograma && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(postAtivo.data_cronograma).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                          {postAtivo.horario_agendado && ` às ${postAtivo.horario_agendado}`}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPedirAjustes(postAtivo.id)}
                    className="px-3 py-1.5 rounded-lg border border-amber-600/30 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Solicitar ajustes</span>
                  </button>

                  <button
                    onClick={() => onAprovar(postAtivo.id)}
                    className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aprovar publicação</span>
                  </button>
                </div>
              </div>

              {/* Grid Central: Lâminas de Arte (Esquerda) + Comentários (Direita) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Lado Esquerdo: Lâminas */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#52636a] dark:text-[#a0aeaf]">
                      Lâminas da arte ({postAtivo.arquivos_arte.length})
                    </span>

                    <button
                      type="button"
                      onClick={() => onAbrirPhotoCraft(postAtivo.arquivos_arte[0]?.psd_url, `${postAtivo.titulo}.psd`)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#226380]/40 text-[#226380] dark:text-[#A3C3C7] text-xs font-medium hover:bg-[#226380]/10 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Editar no PhotoCraft</span>
                    </button>
                  </div>

                  {/* Galeria de Miniaturas */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {postAtivo.arquivos_arte.map((arte, idx) => (
                      <div
                        key={arte.id}
                        className="group relative rounded-lg border border-[#dce4e2] dark:border-[#354246] overflow-hidden bg-slate-900 aspect-square flex flex-col justify-end"
                      >
                        <img
                          src={arte.url}
                          alt={arte.nome}
                          className="absolute inset-0 w-full h-full object-cover"
                        />

                        {/* Scrim neutro com número e zoom */}
                        <div className="relative z-10 p-1.5 bg-black/60 flex items-center justify-between text-white text-xs">
                          <span>{idx + 1}/{postAtivo.arquivos_arte.length}</span>
                          <button
                            type="button"
                            onClick={() => setSlideZoom(arte.url)}
                            className="p-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
                            title="Ampliar imagem"
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bloco de Legenda */}
                  {postAtivo.legenda && (
                    <div className="p-4 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] space-y-2">
                      <span className="text-xs font-medium text-[#52636a] dark:text-[#a0aeaf]">
                        Texto e Legenda
                      </span>
                      <p className="text-xs text-[#113240] dark:text-[#edf2f1] whitespace-pre-line leading-relaxed">
                        {postAtivo.legenda}
                      </p>
                      {postAtivo.hashtags && (
                        <p className="text-xs text-[#226380] dark:text-[#A3C3C7]">
                          {postAtivo.hashtags}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Lado Direito: Comentários */}
                <div className="lg:col-span-4 bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-4 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-4 h-4 text-[#226380]" />
                      <h3 className="text-xs font-semibold text-[#113240] dark:text-white">
                        Comentários de ajustes ({comentariosDoPost.length})
                      </h3>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {comentariosDoPost.length === 0 ? (
                        <p className="text-xs text-[#86868b] py-4 text-center">
                          Nenhum comentário registrado.
                        </p>
                      ) : (
                        comentariosDoPost.map(c => (
                          <div
                            key={c.id}
                            className="p-2.5 rounded-lg bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-xs text-[#52636a] dark:text-[#a0aeaf]">
                              <span className="font-semibold text-[#113240] dark:text-white">{c.autor_nome}</span>
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800">
                                {c.escopo === 'post_todo' ? 'Post todo' : `Slide ${c.slide_numero}`}
                              </span>
                            </div>
                            <p className="text-[#113240] dark:text-[#edf2f1] leading-relaxed">
                              {c.mensagem}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Form de comentário */}
                  <form onSubmit={handleEnviarComentario} className="pt-3 border-t border-[#dce4e2] dark:border-[#354246] space-y-2">
                    <select
                      value={escopoComentario}
                      onChange={e => setEscopoComentario(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#1c2427] text-[#113240] dark:text-white focus:outline-none"
                    >
                      <option value="post_todo">Sobre o post todo</option>
                      {postAtivo.arquivos_arte.map((_, i) => (
                        <option key={i + 1} value={`slide_${i + 1}`}>
                          No slide {i + 1}
                        </option>
                      ))}
                    </select>

                    <textarea
                      rows={3}
                      required
                      value={novoComentario}
                      onChange={e => setNovoComentario(e.target.value)}
                      placeholder="Escreva a observação ou ajuste necessário..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#1c2427] text-[#113240] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#226380]"
                    />

                    <button
                      type="submit"
                      className="w-full py-1.5 rounded-lg bg-[#113240] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Registrar comentário</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Zoom */}
      {slideZoom && (
        <div 
          onClick={() => setSlideZoom(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-zoom-out"
        >
          <img
            src={slideZoom}
            alt="Ampliação"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
};
