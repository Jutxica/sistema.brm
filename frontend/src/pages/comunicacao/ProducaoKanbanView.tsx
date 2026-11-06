import React, { useState } from 'react';
import { 
  ArrowRight, CheckCircle2, Clock, Image as ImageIcon, FileText, 
  Filter, Eye, MoreHorizontal, Sparkles 
} from 'lucide-react';
import type { ComunicacaoPost, AreaPauta, FormatoConteudo } from '../../types/comunicacao';

interface ProducaoKanbanViewProps {
  posts: ComunicacaoPost[];
  onAvancarStatus: (post: ComunicacaoPost) => void;
  onAbrirPost: (post: ComunicacaoPost) => void;
}

export const ProducaoKanbanView: React.FC<ProducaoKanbanViewProps> = ({
  posts,
  onAvancarStatus,
  onAbrirPost
}) => {
  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [filtroFormato, setFiltroFormato] = useState<string>('todos');

  const colunas = [
    { id: 'em_producao', label: 'Em produção', dotColor: 'bg-blue-500' },
    { id: 'aprovacao', label: 'Aprovação', dotColor: 'bg-amber-500' },
    { id: 'aprovado', label: 'Aprovado', dotColor: 'bg-emerald-500' },
    { id: 'postado', label: 'Postado', dotColor: 'bg-slate-500' }
  ];

  const postsFiltrados = posts.filter(p => {
    if (filtroArea !== 'todas' && p.area !== filtroArea) return false;
    if (filtroFormato !== 'todos' && p.formato !== filtroFormato) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#113240] dark:text-white tracking-tight">
          Produção.
        </h1>
        <p className="text-sm text-[#66777b] dark:text-[#a0aeaf] mt-1">
          Cada conteúdo anda da pauta até o post publicado. Use a seta para avançar. Na etapa Aprovação, o post entra na fila de revisão dos religiosos e coordenadores.
        </p>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filtroArea}
          onChange={e => setFiltroArea(e.target.value)}
          className="px-3.5 py-1.5 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#1c2427] text-[#113240] dark:text-white focus:outline-none"
        >
          <option value="todas">Todas as áreas</option>
          <option value="Institucional">Institucional</option>
          <option value="Vocacional">Vocacional</option>
          <option value="Espiritualidade">Espiritualidade</option>
          <option value="Paróquias">Paróquias</option>
          <option value="Formação">Formação</option>
          <option value="Obras Sociais">Obras Sociais</option>
        </select>

        <select
          value={filtroFormato}
          onChange={e => setFiltroFormato(e.target.value)}
          className="px-3.5 py-1.5 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#1c2427] text-[#113240] dark:text-white focus:outline-none"
        >
          <option value="todos">Todos os formatos</option>
          <option value="Carrossel">Carrossel</option>
          <option value="Reels">Reels</option>
          <option value="Post">Post Único</option>
          <option value="Story">Story</option>
          <option value="Site">Site Oficial</option>
        </select>
      </div>

      {/* Grid Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {colunas.map(col => {
          const postsDaColuna = postsFiltrados.filter(p => p.status === col.id);

          return (
            <div
              key={col.id}
              className="bg-[#f0f4f3] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-3 flex flex-col min-h-[480px]"
            >
              {/* Header da Coluna */}
              <div className="flex items-center justify-between px-2 py-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <h2 className="text-xs font-semibold text-[#113240] dark:text-white">
                    {col.label}
                  </h2>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white dark:bg-white/10 text-[#66777b] dark:text-[#a0aeaf]">
                  {postsDaColuna.length}
                </span>
              </div>

              {/* Lista de Cards da Coluna */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {postsDaColuna.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-xs text-[#86868b] border border-dashed border-[#dce4e2] dark:border-[#354246] rounded-xl">
                    Nenhum card aqui.
                  </div>
                ) : (
                  postsDaColuna.map(post => (
                    <div
                      key={post.id}
                      className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-4 hover:border-[#226380] transition-colors space-y-3"
                    >
                      <div>
                        <h3 className="text-xs font-semibold text-[#113240] dark:text-white line-clamp-2">
                          {post.titulo}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#52636a] dark:text-[#a0aeaf] font-medium">
                            {post.area}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#52636a] dark:text-[#a0aeaf] font-medium">
                            {post.formato}
                          </span>
                        </div>
                      </div>

                      {/* Miniatura ou data */}
                      <div className="text-xs text-[#66777b] dark:text-[#a0aeaf] space-y-1 pt-1 border-t border-[#dce4e2] dark:border-[#354246]">
                        {post.data_cronograma && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {new Date(post.data_cronograma).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                              {post.horario_agendado && ` · ${post.horario_agendado}`}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs">
                          <span className={post.arte_entregue ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                            Arte: {post.arte_entregue ? 'entregue' : 'pendente'}
                          </span>
                          <span>•</span>
                          <span className={post.texto_entregue ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                            Texto: {post.texto_entregue ? 'pronto' : 'pendente'}
                          </span>
                        </div>
                      </div>

                      {/* Botões do Card */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => onAbrirPost(post)}
                          className="px-3 py-1 rounded-lg border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold text-[#113240] dark:text-white transition-colors"
                        >
                          Abrir
                        </button>

                        {col.id !== 'postado' && (
                          <button
                            type="button"
                            onClick={() => onAvancarStatus(post)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-[#226380] dark:text-[#A3C3C7] transition-colors"
                            title="Avançar para a próxima coluna"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
