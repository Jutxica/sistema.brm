import React, { useState } from 'react';
import { 
  Video, Calendar as CalendarIcon, Clock, MapPin, CheckSquare, 
  Square, Plus, CheckCircle2, User, Play, X, ExternalLink,
  MessageSquare, Hash, AtSign, Send, ChevronDown, ChevronUp,
  Tag, Filter
} from 'lucide-react';
import type { 
  ComunicacaoCaptacao, 
  ReligiosoConteudo, 
  ObraResumoComunicacao, 
  ComunicacaoEmailEquipe,
  ComentarioCaptacao
} from '../../types/comunicacao';

interface CaptacaoViewProps {
  captacoes: ComunicacaoCaptacao[];
  religiosos?: ReligiosoConteudo[];
  obras?: ObraResumoComunicacao[];
  equipe?: ComunicacaoEmailEquipe[];
  usuarioNome?: string;
  onCriarCaptacao: (captacao: Partial<ComunicacaoCaptacao>) => void;
  onAtualizarChecklist: (captacaoId: string, itemIdx: number, checado: boolean) => void;
  onMarcarComoGravada: (captacaoId: string) => void;
  onAdicionarComentario?: (captacaoId: string, texto: string) => void;
  onAtualizarRoteiro?: (captacaoId: string, roteiro: string, tags?: string[], mencoes?: string[]) => void;
}

const TAGS_SUGERIDAS = [
  'vocacional',
  'jubileu',
  'historia',
  'espiritualidade',
  'paroquia',
  'juventude',
  'testemunho',
  'dehoniano'
];

export const CaptacaoView: React.FC<CaptacaoViewProps> = ({
  captacoes,
  religiosos = [],
  obras = [],
  equipe = [],
  usuarioNome = 'Equipe',
  onCriarCaptacao,
  onAtualizarChecklist,
  onMarcarComoGravada,
  onAdicionarComentario,
  onAtualizarRoteiro
}) => {
  const [modalNovaAberta, setModalNovaAberta] = useState(false);
  const [teleprompterRoteiro, setTeleprompterRoteiro] = useState<string | null>(null);
  const [filtroTag, setFiltroTag] = useState<string | null>(null);
  const [filtroSituacao, setFiltroSituacao] = useState<'todas' | 'agendada' | 'gravada'>('todas');
  const [comentariosAbertos, setComentariosAbertos] = useState<Record<string, boolean>>({});
  const [novoComentarioTexto, setNovoComentarioTexto] = useState<Record<string, string>>({});

  // Form states do modal
  const [titulo, setTitulo] = useState('');
  const [religiosoSelecionadoId, setReligiosoSelecionadoId] = useState('');
  const [entrevistadoNome, setEntrevistadoNome] = useState('');
  const [dataGravacao, setDataGravacao] = useState('');
  const [horario, setHorario] = useState('14:00');
  const [duracao, setDuracao] = useState('45 min');
  const [local, setLocal] = useState('Cúria Provincial - Sala de Gravações');
  const [roteiro, setRoteiro] = useState('');

  // Ao selecionar um confrade da lista, auto-preenche o nome e sugere tags
  const handleSelecionarReligioso = (religiosoId: string) => {
    setReligiosoSelecionadoId(religiosoId);
    const rel = religiosos.find(r => r.id === religiosoId);
    if (rel) {
      setEntrevistadoNome(rel.nome_religioso || rel.nome_civil);
      if (rel.comunidade_atual_nome || rel.obra_atual_nome) {
        setLocal(`${rel.comunidade_atual_nome || rel.obra_atual_nome} - Sala de gravações`);
      }
    }
  };

  // Helper para inserir @menção ou #tag no roteiro
  const inserirNoRoteiro = (token: string) => {
    setRoteiro(prev => {
      const espaco = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
      return `${prev}${espaco}${token} `;
    });
  };

  // Extrai tags e menções do texto
  const extrairTagsEMencoes = (texto: string) => {
    const tagsMatches = texto.match(/#([\wÀ-ÿ]+)/g) || [];
    const mencoesMatches = texto.match(/@([\wÀ-ÿ\.\-]+)/g) || [];
    const tags = Array.from(new Set(tagsMatches.map(t => t.replace('#', '').toLowerCase())));
    const mencoes = Array.from(new Set(mencoesMatches.map(m => m.replace('@', ''))));
    return { tags, mencoes };
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !entrevistadoNome.trim() || !dataGravacao) return;

    const { tags, mencoes } = extrairTagsEMencoes(roteiro);

    onCriarCaptacao({
      titulo: titulo.trim(),
      entrevistado_nome: entrevistadoNome.trim(),
      religioso_id: religiosoSelecionadoId || undefined,
      data_gravacao: `${dataGravacao}T${horario}:00Z`,
      duracao,
      local,
      situacao: 'agendada',
      roteiro,
      tags,
      mencoes,
      checklist_equipamentos: [
        { item: 'Microfones de lapela sem fio carregados', checado: false },
        { item: 'Câmera principal e cartão SD formatado', checado: false },
        { item: 'Luz principal (softbox) e luz de recorte', checado: false },
        { item: 'Tripés e bateria extra', checado: false },
        { item: 'Roteiro impresso ou teleprompter configurado', checado: false }
      ]
    });

    setModalNovaAberta(false);
    setTitulo('');
    setReligiosoSelecionadoId('');
    setEntrevistadoNome('');
    setRoteiro('');
  };

  // Envio de comentário
  const handleEnviarComentario = (captacaoId: string) => {
    const texto = novoComentarioTexto[captacaoId]?.trim();
    if (!texto) return;

    if (onAdicionarComentario) {
      onAdicionarComentario(captacaoId, texto);
    }
    setNovoComentarioTexto(prev => ({ ...prev, [captacaoId]: '' }));
  };

  // Toggle do painel de comentários por gravação
  const toggleComentarios = (capId: string) => {
    setComentariosAbertos(prev => ({ ...prev, [capId]: !prev[capId] }));
  };

  // Coleta todas as tags existentes nas gravações para a barra de filtro
  const todasTagsPresentes = Array.from(
    new Set(
      captacoes.flatMap(c => {
        const doRoteiro = extrairTagsEMencoes(c.roteiro || '').tags;
        const cadastradas = c.tags || [];
        return [...doRoteiro, ...cadastradas];
      })
    )
  );

  // Filtragem
  const captacoesFiltradas = captacoes.filter(c => {
    if (filtroSituacao !== 'todas' && c.situacao !== filtroSituacao) return false;
    if (filtroTag) {
      const { tags } = extrairTagsEMencoes(c.roteiro || '');
      const todas = [...tags, ...(c.tags || [])].map(t => t.toLowerCase());
      if (!todas.includes(filtroTag.toLowerCase())) return false;
    }
    return true;
  });

  // Renderizador formatado de texto com @menções e #tags
  const renderizarTextoFormatado = (texto: string) => {
    const tokens = texto.split(/(\s+)/);
    return tokens.map((tok, idx) => {
      if (tok.startsWith('@') && tok.length > 1) {
        return (
          <span 
            key={idx} 
            className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] font-semibold border border-[#226380]/20"
          >
            {tok}
          </span>
        );
      }
      if (tok.startsWith('#') && tok.length > 1) {
        const tagLimpa = tok.replace('#', '').toLowerCase();
        return (
          <button
            key={idx}
            type="button"
            onClick={() => setFiltroTag(tagLimpa === filtroTag ? null : tagLimpa)}
            className="inline-flex items-center px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-[#226380] dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-900/40 hover:underline mx-0.5"
            title={`Filtrar por #${tagLimpa}`}
          >
            {tok}
          </button>
        );
      }
      return tok;
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#113240] dark:text-white tracking-tight">
            Captação de vídeo.
          </h1>
          <p className="text-sm text-[#66777b] dark:text-[#a0aeaf] mt-1">
            Planejamento de gravações com os religiosos: roteiros colaborativos com @menções, temas por #tags, comentários da equipe e checklist técnico.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalNovaAberta(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar captação</span>
        </button>
      </div>

      {/* Barra de Filtros: Situação + Temas #tags */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Abas de Situação */}
          <div className="flex items-center gap-1.5 p-1 bg-[#f0f4f3] dark:bg-[#141a1c] rounded-xl border border-[#dce4e2] dark:border-[#354246]">
            {[
              { id: 'todas', label: 'Todas' },
              { id: 'agendada', label: 'Agendadas' },
              { id: 'gravada', label: 'Gravadas' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltroSituacao(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  filtroSituacao === tab.id
                    ? 'bg-[#113240] text-white'
                    : 'text-[#66777b] dark:text-[#a0aeaf] hover:text-[#113240]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contador */}
          <span className="text-[#66777b] dark:text-[#a0aeaf] font-medium">
            {captacoesFiltradas.length} captações encontradas
          </span>
        </div>

        {/* Linha de Filtro por #Tags */}
        {(todasTagsPresentes.length > 0 || TAGS_SUGERIDAS.length > 0) && (
          <div className="flex items-center gap-2 pt-2 border-t border-[#dce4e2] dark:border-[#354246] overflow-x-auto text-xs">
            <span className="text-[#66777b] dark:text-[#a0aeaf] font-semibold flex items-center gap-1 shrink-0">
              <Hash className="w-3.5 h-3.5 text-[#226380]" />
              Filtrar por tema:
            </span>

            {filtroTag && (
              <button
                type="button"
                onClick={() => setFiltroTag(null)}
                className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 font-semibold flex items-center gap-1 shrink-0"
              >
                <span>Limpar filtro (#{filtroTag})</span>
                <X className="w-3 h-3" />
              </button>
            )}

            {Array.from(new Set([...todasTagsPresentes, ...TAGS_SUGERIDAS])).map(tag => {
              const ativo = filtroTag === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFiltroTag(ativo ? null : tag.toLowerCase())}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors border ${
                    ativo
                      ? 'bg-[#226380] text-white border-[#226380]'
                      : 'bg-[#f8faf9] dark:bg-[#141a1c] text-[#52636a] dark:text-[#a0aeaf] border-[#dce4e2] dark:border-[#354246] hover:border-[#226380]'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de Próximas Captações */}
      <div className="space-y-4">
        {captacoesFiltradas.length === 0 ? (
          <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-12 text-center text-xs text-[#86868b]">
            Nenhuma gravação agendada com os filtros atuais. Clique no botão acima para agendar.
          </div>
        ) : (
          captacoesFiltradas.map(cap => {
            const dataObj = new Date(cap.data_gravacao);
            const checklist = cap.checklist_equipamentos || [];
            const checadosCount = checklist.filter(i => i.checado).length;
            const totalEquip = checklist.length;
            const comentarios = cap.comentarios || [];
            const isOpenComentarios = comentariosAbertos[cap.id] ?? false;

            return (
              <div
                key={cap.id}
                className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 flex flex-col md:flex-row md:items-start justify-between gap-6"
              >
                {/* Lado Esquerdo: Dados, Roteiro e Comentários */}
                <div className="space-y-4 flex-1">
                  <div className="flex items-start gap-4">
                    {/* Badge de Data */}
                    <div className="bg-[#f0f4f3] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-3 text-center min-w-[70px]">
                      <span className="block text-xl font-black text-[#113240] dark:text-white">
                        {dataObj.getUTCDate()}
                      </span>
                      <span className="block text-xs font-semibold text-[#66777b] dark:text-[#a0aeaf]">
                        {dataObj.toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-[#113240] dark:text-white">
                          {cap.entrevistado_nome}
                        </h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          cap.situacao === 'gravada'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40'
                            : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/40'
                        }`}>
                          {cap.situacao === 'gravada' ? 'Gravada' : 'Agendada'}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-[#226380] dark:text-[#A3C3C7]">
                        {cap.titulo}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#66777b] dark:text-[#a0aeaf] pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({cap.duracao || '45 min'})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {cap.local}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Roteiro & Botão de Teleprompter */}
                  {cap.roteiro && (
                    <div className="p-4 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#66777b] dark:text-[#a0aeaf] flex items-center gap-1.5">
                          <span>Roteiro e pontos de fala</span>
                          <span className="text-xs text-[#86868b]">(estilo Notion com @menções e #tags)</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => setTeleprompterRoteiro(cap.roteiro || '')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-medium transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Teleprompter</span>
                        </button>
                      </div>

                      <div className="text-xs text-[#113240] dark:text-[#edf2f1] whitespace-pre-line leading-relaxed font-sans">
                        {renderizarTextoFormatado(cap.roteiro)}
                      </div>
                    </div>
                  )}

                  {/* Seção de Comentários Colaborativos da Equipe */}
                  <div className="border border-[#dce4e2] dark:border-[#354246] rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleComentarios(cap.id)}
                      className="w-full px-4 py-2.5 bg-[#f8faf9] dark:bg-[#141a1c] hover:bg-slate-100 dark:hover:bg-[#1c2427] flex items-center justify-between text-xs font-semibold text-[#113240] dark:text-white transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-[#226380]" />
                        <span>Comentários da equipe ({comentarios.length})</span>
                      </div>
                      {isOpenComentarios ? (
                        <ChevronUp className="w-4 h-4 text-[#86868b]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#86868b]" />
                      )}
                    </button>

                    {isOpenComentarios && (
                      <div className="p-4 space-y-3 bg-white dark:bg-[#1c2427] border-t border-[#dce4e2] dark:border-[#354246]">
                        {comentarios.length === 0 ? (
                          <p className="text-xs text-[#86868b]">
                            Nenhum comentário registrado ainda. Deixe observações de gravação, perguntas a fazer ou lembretes de equipamento abaixo.
                          </p>
                        ) : (
                          <div className="space-y-2.5 max-h-56 overflow-y-auto">
                            {comentarios.map(com => (
                              <div
                                key={com.id}
                                className="p-2.5 rounded-lg bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[#113240] dark:text-white">
                                    {com.autor_nome}
                                  </span>
                                  <span className="text-xs text-[#86868b]">
                                    {new Date(com.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[#52636a] dark:text-[#a0aeaf] leading-relaxed">
                                  {com.mensagem}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Input para novo comentário */}
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="text"
                            value={novoComentarioTexto[cap.id] || ''}
                            onChange={e => setNovoComentarioTexto({ ...novoComentarioTexto, [cap.id]: e.target.value })}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleEnviarComentario(cap.id);
                              }
                            }}
                            placeholder="Escrever observação para a equipe (Enter para enviar)..."
                            className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#226380]"
                          />
                          <button
                            type="button"
                            onClick={() => handleEnviarComentario(cap.id)}
                            className="px-3 py-2 rounded-lg bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Comentar</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lado Direito: Checklist de Equipamentos */}
                <div className="w-full md:w-72 bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-4 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-[#113240] dark:text-white">
                        Checklist técnico
                      </span>
                      <span className="text-xs font-semibold text-[#66777b] dark:text-[#a0aeaf]">
                        {checadosCount}/{totalEquip}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-3">
                      <div
                        className="bg-emerald-500 h-full transition-[width] duration-300"
                        style={{ width: `${(checadosCount / (totalEquip || 1)) * 100}%` }}
                      />
                    </div>

                    <div className="space-y-2 text-xs">
                      {checklist.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => onAtualizarChecklist(cap.id, idx, !item.checado)}
                          className="flex items-center gap-2 cursor-pointer text-[#113240] dark:text-[#edf2f1] hover:text-[#226380] select-none"
                        >
                          {item.checado ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className={item.checado ? 'line-through text-[#86868b]' : ''}>
                            {item.item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#dce4e2] dark:border-[#354246]">
                    {cap.situacao !== 'gravada' ? (
                      <button
                        type="button"
                        onClick={() => onMarcarComoGravada(cap.id)}
                        className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Marcar como gravada</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Gravação concluída</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Agendamento com Roteiro Notion-Style */}
      {modalNovaAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
              <div>
                <h2 className="text-base font-bold text-[#113240] dark:text-white">
                  Agendar captação & roteiro
                </h2>
                <p className="text-xs text-[#86868b] mt-0.5">
                  Preencha os detalhes e escreva o roteiro com suporte a @menções e #temas
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setModalNovaAberta(false)} 
                className="text-[#86868b] hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#113240] dark:text-white">
                  Título da gravação *
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex: Depoimento sobre 50 Anos de Ordenação Sacerdotal"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#226380]"
                />
              </div>

              {/* Seletor de Religioso da Província */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#113240] dark:text-white">
                  Religioso a ser entrevistado *
                </label>
                {religiosos.length > 0 ? (
                  <select
                    value={religiosoSelecionadoId}
                    onChange={e => handleSelecionarReligioso(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#226380]"
                  >
                    <option value="">Selecione um confrade cadastrado no banco...</option>
                    {religiosos.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.nome_religioso} {r.comunidade_atual_nome ? `(${r.comunidade_atual_nome})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={entrevistadoNome}
                    onChange={e => setEntrevistadoNome(e.target.value)}
                    placeholder="Ex: Pe. João Silva, scj"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white"
                  />
                )}

                {religiosoSelecionadoId && (
                  <p className="text-xs text-[#226380] dark:text-[#A3C3C7] mt-1 font-medium">
                    Confrade selecionado: {entrevistadoNome}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#113240] dark:text-white">
                    Data da gravação *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataGravacao}
                    onChange={e => setDataGravacao(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#113240] dark:text-white">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={horario}
                    onChange={e => setHorario(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#113240] dark:text-white">
                    Duração estimada
                  </label>
                  <input
                    type="text"
                    value={duracao}
                    onChange={e => setDuracao(e.target.value)}
                    placeholder="Ex: 45 min"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white"
                  />
                </div>
              </div>

              {/* Local com sugestão de obras */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#113240] dark:text-white">
                  Local da gravação
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={local}
                    onChange={e => setLocal(e.target.value)}
                    placeholder="Ex: Santuário N. Sra. do Sagrado Coração - Nave Central"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white"
                  />
                  {obras.length > 0 && (
                    <select
                      onChange={e => {
                        if (e.target.value) setLocal(e.target.value);
                      }}
                      className="px-2.5 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white"
                    >
                      <option value="">Obras BRM...</option>
                      {obras.map(o => (
                        <option key={o.id} value={`${o.nome} (${o.cidade || ''})`}>
                          {o.nome}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Editor de Roteiro Notion-Style */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#113240] dark:text-white">
                    Roteiro e pontos de fala (estilo Notion)
                  </label>
                  <span className="text-xs text-[#86868b]">
                    Use @ para mencionar e # para categorizar
                  </span>
                </div>

                {/* Barra de atalhos rápidos para @ e # */}
                <div className="p-2 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[#66777b] dark:text-[#a0aeaf] font-semibold text-xs flex items-center gap-1">
                    <AtSign className="w-3 h-3 text-[#226380]" /> Menções:
                  </span>
                  {entrevistadoNome && (
                    <button
                      type="button"
                      onClick={() => inserirNoRoteiro(`@${entrevistadoNome.split(' ')[0]}`)}
                      className="px-2 py-0.5 rounded bg-[#226380]/10 text-[#226380] hover:bg-[#226380]/20 font-semibold"
                    >
                      @{entrevistadoNome.split(' ')[0]}
                    </button>
                  )}
                  {equipe.slice(0, 3).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => inserirNoRoteiro(`@${m.nome.split(' ')[0]}`)}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[#113240] dark:text-white hover:bg-slate-300 font-semibold"
                    >
                      @{m.nome.split(' ')[0]}
                    </button>
                  ))}

                  <span className="text-[#66777b] dark:text-[#a0aeaf] font-semibold text-xs flex items-center gap-1 ml-2">
                    <Hash className="w-3 h-3 text-[#226380]" /> Tags:
                  </span>
                  {TAGS_SUGERIDAS.slice(0, 5).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => inserirNoRoteiro(`#${tag}`)}
                      className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-[#226380] dark:text-sky-300 hover:bg-sky-100 font-semibold"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={5}
                  value={roteiro}
                  onChange={e => setRoteiro(e.target.value)}
                  placeholder="Ex: 
1. Apresentação inicial e acolhida com @Pe. João
2. Relato da trajetória vocacional e primeiras missões #vocacional #historia
3. Mensagem para as juventudes dehonianas e benção final #juventude"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white font-sans leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#dce4e2] dark:border-[#354246]">
                <button
                  type="button"
                  onClick={() => setModalNovaAberta(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#66777b] hover:text-[#113240] dark:text-[#a0aeaf]"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
                >
                  Agendar captação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Teleprompter em Tela Cheia */}
      {teleprompterRoteiro && (
        <div className="fixed inset-0 z-50 bg-black text-white p-8 flex flex-col justify-between animate-in fade-in select-none">
          <div className="flex items-center justify-between pb-4 border-b border-white/20">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-bold tracking-widest uppercase text-white/80">
                Modo Teleprompter · Província BRM
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTeleprompterRoteiro(null)}
              className="px-4 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold"
            >
              Fechar (ESC)
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-8 max-w-4xl mx-auto overflow-y-auto">
            <p className="text-2xl sm:text-4xl font-semibold leading-relaxed text-center text-white/95 whitespace-pre-line tracking-wide">
              {teleprompterRoteiro}
            </p>
          </div>

          <div className="text-center text-xs text-white/50 pt-4 border-t border-white/20">
            Dica: Role suavemente o texto na tela para guiar o religioso durante a gravação.
          </div>
        </div>
      )}
    </div>
  );
};
