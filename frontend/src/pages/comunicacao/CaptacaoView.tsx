import React, { useState } from 'react';
import { 
  Video, Calendar as CalendarIcon, Clock, MapPin, CheckSquare, 
  Square, Plus, CheckCircle2, User, Play, X, ExternalLink,
  MessageSquare, Hash, AtSign, Send, ChevronDown, ChevronUp,
  Tag, Filter, FileText, PenTool, Bold, Italic, Heading1, Heading2,
  List, ListOrdered, Quote, Link2, Sparkles, BookOpen
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
  usuarioNome = 'Comunicação BRM',
  onCriarCaptacao,
  onAtualizarChecklist,
  onMarcarComoGravada,
  onAdicionarComentario,
  onAtualizarRoteiro
}) => {
  // Controle de Visualização
  const [abaAtiva, setAbaAtiva] = useState<'gravacoes' | 'roteiros'>('gravacoes');
  const [filtroTag, setFiltroTag] = useState<string | null>(null);
  const [filtroSituacao, setFiltroSituacao] = useState<'todas' | 'agendada' | 'gravada'>('todas');
  
  // Modais Distintos Solicitados pelo Usuário
  const [modalAgendarAberta, setModalAgendarAberta] = useState(false);
  const [modalRoteiroAberta, setModalRoteiroAberta] = useState(false);
  const [teleprompterRoteiro, setTeleprompterRoteiro] = useState<string | null>(null);

  // Estados do Modal: 1. Agendar Captação
  const [agendaTitulo, setAgendaTitulo] = useState('');
  const [agendaReligiosoId, setAgendaReligiosoId] = useState('');
  const [agendaEntrevistadoNome, setAgendaEntrevistadoNome] = useState('');
  const [agendaData, setAgendaData] = useState('');
  const [agendaHorario, setAgendaHorario] = useState('14:00');
  const [agendaDuracao, setAgendaDuracao] = useState('45 min');
  const [agendaLocal, setAgendaLocal] = useState('Cúria Provincial - Sala de Gravações');

  // Estados do Modal: 2. Escrever / Editar Roteiro (Bloco de Notas)
  const [roteiroCaptacaoId, setRoteiroCaptacaoId] = useState<string>('avulso');
  const [roteiroTitulo, setRoteiroTitulo] = useState('');
  const [roteiroReligiosoNome, setRoteiroReligiosoNome] = useState('');
  const [roteiroTexto, setRoteiroTexto] = useState('');
  const [roteiroComentarios, setRoteiroComentarios] = useState<ComentarioCaptacao[]>([]);
  const [novoComentarioNoRoteiro, setNovoComentarioNoRoteiro] = useState('');

  // Ao selecionar um religioso no agendamento
  const handleSelecionarReligiosoAgenda = (religiosoId: string) => {
    setAgendaReligiosoId(religiosoId);
    const rel = religiosos.find(r => r.id === religiosoId);
    if (rel) {
      setAgendaEntrevistadoNome(rel.nome_religioso || rel.nome_civil);
      if (rel.obra_atual_nome || rel.comunidade_atual_nome) {
        setAgendaLocal(`${rel.obra_atual_nome || rel.comunidade_atual_nome} - Sala de gravações`);
      }
    }
  };

  // Salvar Agendamento de Captação
  const handleSalvarAgendamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agendaTitulo.trim() || !agendaEntrevistadoNome.trim() || !agendaData) return;

    onCriarCaptacao({
      titulo: agendaTitulo.trim(),
      entrevistado_nome: agendaEntrevistadoNome.trim(),
      religioso_id: agendaReligiosoId || undefined,
      data_gravacao: `${agendaData}T${agendaHorario}:00Z`,
      duracao: agendaDuracao,
      local: agendaLocal,
      situacao: 'agendada',
      checklist_equipamentos: [
        { item: 'Microfones de lapela sem fio carregados', checado: false },
        { item: 'Câmera principal 4K e cartão SD formatado', checado: false },
        { item: 'Iluminação frontal (softbox) e luz de recorte ligadas', checado: false },
        { item: 'Tripé com cabeça fluida regulado', checado: false },
        { item: 'Teleprompter configurado no tablet/celular', checado: false }
      ]
    });

    setModalAgendarAberta(false);
    setAgendaTitulo('');
    setAgendaReligiosoId('');
    setAgendaEntrevistadoNome('');
    setAgendaData('');
  };

  // Abrir Modal de Roteiro para uma Captação Específica
  const handleAbrirRoteiroParaCaptacao = (cap: ComunicacaoCaptacao) => {
    setRoteiroCaptacaoId(cap.id);
    setRoteiroTitulo(cap.titulo);
    setRoteiroReligiosoNome(cap.entrevistado_nome);
    setRoteiroTexto(cap.roteiro || '');
    setRoteiroComentarios(cap.comentarios || []);
    setModalRoteiroAberta(true);
  };

  // Abrir Modal de Novo Roteiro em Branco
  const handleAbrirNovoRoteiro = () => {
    setRoteiroCaptacaoId('avulso');
    setRoteiroTitulo('');
    setRoteiroReligiosoNome('');
    setRoteiroTexto('');
    setRoteiroComentarios([]);
    setModalRoteiroAberta(true);
  };

  // Ferramentas de Formatação do Bloco de Notas
  const aplicarFormatacao = (prefixo: string, sufixo: string = '') => {
    const textarea = document.getElementById('textarea-roteiro') as HTMLTextAreaElement;
    if (!textarea) return;

    const inicio = textarea.selectionStart;
    const fim = textarea.selectionEnd;
    const textoSel = roteiroTexto.substring(inicio, fim) || 'texto';
    const novoTexto = roteiroTexto.substring(0, inicio) + prefixo + textoSel + sufixo + roteiroTexto.substring(fim);

    setRoteiroTexto(novoTexto);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(inicio + prefixo.length, fim + prefixo.length);
    }, 50);
  };

  const inserirToken = (token: string) => {
    setRoteiroTexto(prev => {
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

  // Salvar Roteiro
  const handleSalvarRoteiro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roteiroTitulo.trim()) return;

    const { tags, mencoes } = extrairTagsEMencoes(roteiroTexto);

    if (roteiroCaptacaoId !== 'avulso') {
      // Atualiza a captação agendada existente
      if (onAtualizarRoteiro) {
        onAtualizarRoteiro(roteiroCaptacaoId, roteiroTexto, tags, mencoes);
      }
    } else {
      // Cria uma nova captação ou roteiro avulso
      onCriarCaptacao({
        titulo: roteiroTitulo.trim(),
        entrevistado_nome: roteiroReligiosoNome || 'Religioso da Província',
        data_gravacao: new Date().toISOString(),
        duracao: '30 min',
        local: 'Cúria Provincial BRM',
        situacao: 'agendada',
        roteiro: roteiroTexto,
        tags,
        mencoes,
        comentarios: roteiroComentarios
      });
    }

    setModalRoteiroAberta(false);
  };

  // Adicionar Comentário da Equipe ao Roteiro
  const handleAdicionarComentarioRoteiro = () => {
    const texto = novoComentarioNoRoteiro.trim();
    if (!texto) return;

    const novoCom: ComentarioCaptacao = {
      id: `com-${Date.now()}`,
      autor_nome: usuarioNome,
      mensagem: texto,
      created_at: new Date().toISOString()
    };

    setRoteiroComentarios(prev => [...prev, novoCom]);

    if (roteiroCaptacaoId !== 'avulso' && onAdicionarComentario) {
      onAdicionarComentario(roteiroCaptacaoId, texto);
    }

    setNovoComentarioNoRoteiro('');
  };

  // Coleta todas as tags existentes
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

  // Renderizador de Roteiro formatado com @menções e #tags
  const renderizarTextoFormatado = (texto: string) => {
    const tokens = texto.split(/(\s+)/);
    return tokens.map((tok, idx) => {
      if (tok.startsWith('@') && tok.length > 1) {
        return (
          <span 
            key={idx} 
            className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#226380]/15 text-[#226380] dark:text-[#A3C3C7] font-semibold border border-[#226380]/20"
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
      {/* Top Header com os 2 Botões Distintos Solicitados pelo Usuário */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#113240] dark:text-white tracking-tight">
            Captação de vídeo & roteiros.
          </h1>
          <p className="text-sm text-[#66777b] dark:text-[#a0aeaf] mt-1">
            Planejamento prático: agende a gravação da entrevista ou crie o roteiro estruturado em bloco de notas com comentários da equipe.
          </p>
        </div>

        {/* 2 Botões Distintos: Agendar Captação vs Escrever Roteiro */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleAbrirNovoRoteiro}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#1c2427] hover:bg-slate-50 dark:hover:bg-[#141a1c] text-[#113240] dark:text-white text-xs font-semibold transition-colors"
          >
            <FileText className="w-4 h-4 text-[#226380]" />
            <span>Escrever roteiro</span>
          </button>

          <button
            type="button"
            onClick={() => setModalAgendarAberta(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Agendar captação</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros & Abas de Visualização */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Alternador de Modo: Captações vs Roteiros */}
          <div className="flex items-center gap-1.5 p-1 bg-[#f0f4f3] dark:bg-[#141a1c] rounded-xl border border-[#dce4e2] dark:border-[#354246]">
            <button
              type="button"
              onClick={() => setAbaAtiva('gravacoes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                abaAtiva === 'gravacoes'
                  ? 'bg-[#113240] text-white'
                  : 'text-[#66777b] dark:text-[#a0aeaf] hover:text-[#113240]'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Captações agendadas ({captacoes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setAbaAtiva('roteiros')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                abaAtiva === 'roteiros'
                  ? 'bg-[#113240] text-white'
                  : 'text-[#66777b] dark:text-[#a0aeaf] hover:text-[#113240]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Banco de roteiros ({captacoes.filter(c => Boolean(c.roteiro)).length})</span>
            </button>
          </div>

          {/* Filtro de Situação */}
          <div className="flex items-center gap-2">
            <span className="text-[#66777b] dark:text-[#a0aeaf] font-medium">Situação:</span>
            <select
              value={filtroSituacao}
              onChange={e => setFiltroSituacao(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white"
            >
              <option value="todas">Todas as situações</option>
              <option value="agendada">Apenas agendadas</option>
              <option value="gravada">Apenas concluídas</option>
            </select>
          </div>
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

      {/* LISTA: 1. Modo Captações Agendadas */}
      {abaAtiva === 'gravacoes' && (
        <div className="space-y-4">
          {captacoesFiltradas.length === 0 ? (
            <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-12 text-center text-xs text-[#86868b]">
              Nenhuma gravação agendada com os filtros atuais. Use o botão <strong>"Agendar captação"</strong> acima.
            </div>
          ) : (
            captacoesFiltradas.map(cap => {
              const dataObj = new Date(cap.data_gravacao);
              const checklist = cap.checklist_equipamentos || [];
              const checadosCount = checklist.filter(i => i.checado).length;
              const totalEquip = checklist.length;
              const temRoteiro = Boolean(cap.roteiro && cap.roteiro.trim().length > 0);

              return (
                <div
                  key={cap.id}
                  className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 flex flex-col md:flex-row md:items-start justify-between gap-6"
                >
                  {/* Lado Esquerdo: Identificação & Acesso ao Roteiro */}
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
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200'
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

                    {/* Bloco de Roteiro Vinculado */}
                    <div className="p-4 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold text-[#113240] dark:text-white block">
                          Roteiro da gravação:
                        </span>
                        <p className="text-xs text-[#66777b] dark:text-[#a0aeaf] mt-0.5">
                          {temRoteiro
                            ? `${cap.roteiro?.slice(0, 100)}...`
                            : 'Nenhum roteiro escrito para esta captação ainda.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {temRoteiro ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAbrirRoteiroParaCaptacao(cap)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1c2427] hover:bg-slate-100 dark:hover:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] text-[#113240] dark:text-white text-xs font-semibold transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#226380]" />
                              <span>Ver / Editar roteiro</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setTeleprompterRoteiro(cap.roteiro || '')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Teleprompter</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAbrirRoteiroParaCaptacao(cap)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Escrever roteiro</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lado Direito: Checklist de Equipamentos */}
                  <div className="w-full md:w-72 bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-4 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-[#113240] dark:text-white">
                          Checklist de equipamento
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
      )}

      {/* LISTA: 2. Modo Banco de Roteiros */}
      {abaAtiva === 'roteiros' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {captacoes.filter(c => Boolean(c.roteiro)).map(cap => (
            <div
              key={cap.id}
              className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#52636a] dark:text-[#a0aeaf] font-semibold border border-[#dce4e2] dark:border-[#354246]">
                    {cap.entrevistado_nome}
                  </span>
                  <span className="text-xs text-[#86868b]">
                    {new Date(cap.data_gravacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#113240] dark:text-white">
                  {cap.titulo}
                </h3>

                <div className="p-3 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] text-xs text-[#52636a] dark:text-[#a0aeaf] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                  {renderizarTextoFormatado(cap.roteiro || '')}
                </div>
              </div>

              <div className="pt-2 border-t border-[#dce4e2] dark:border-[#354246] flex items-center justify-between">
                <span className="text-xs text-[#86868b] flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-[#226380]" />
                  <span>{cap.comentarios?.length || 0} comentários da equipe</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleAbrirRoteiroParaCaptacao(cap)}
                  className="px-3 py-1.5 rounded-lg bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Editar roteiro</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Agendar Captação (Apenas Agenda e Equipamentos) */}
      {modalAgendarAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
              <div>
                <h2 className="text-base font-bold text-[#113240] dark:text-white">
                  Agendar captação de gravação
                </h2>
                <p className="text-xs text-[#86868b] mt-0.5">
                  Defina o religioso, data, horário e local da produção
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setModalAgendarAberta(false)} 
                className="text-[#86868b] hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarAgendamento} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#113240] dark:text-white">
                  Título da gravação *
                </label>
                <input
                  type="text"
                  required
                  value={agendaTitulo}
                  onChange={e => setAgendaTitulo(e.target.value)}
                  placeholder="Ex: Mensagem Vocacional para o Mês Vocacional Dehoniano"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#226380]"
                />
              </div>

              {/* Seletor de Confrades do Banco de Dados */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#113240] dark:text-white">
                  Religioso a ser entrevistado *
                </label>
                {religiosos.length > 0 ? (
                  <select
                    value={agendaReligiosoId}
                    onChange={e => handleSelecionarReligiosoAgenda(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#226380]"
                  >
                    <option value="">Selecione um confrade do banco de dados...</option>
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
                    value={agendaEntrevistadoNome}
                    onChange={e => setAgendaEntrevistadoNome(e.target.value)}
                    placeholder="Ex: Pe. João Silva, scj"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white"
                  />
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
                    value={agendaData}
                    onChange={e => setAgendaData(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#113240] dark:text-white">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={agendaHorario}
                    onChange={e => setAgendaHorario(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#113240] dark:text-white">
                    Duração estimada
                  </label>
                  <input
                    type="text"
                    value={agendaDuracao}
                    onChange={e => setAgendaDuracao(e.target.value)}
                    placeholder="Ex: 45 min"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white"
                  />
                </div>
              </div>

              {/* Local com Seleção de Obras da Província BRM */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#113240] dark:text-white">
                  Local da gravação (Obras da Província BRM)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={agendaLocal}
                    onChange={e => setAgendaLocal(e.target.value)}
                    placeholder="Ex: Cúria Provincial - Sala de Gravações"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white"
                  />
                  {obras.length > 0 && (
                    <select
                      onChange={e => {
                        if (e.target.value) setAgendaLocal(e.target.value);
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#dce4e2] dark:border-[#354246]">
                <button
                  type="button"
                  onClick={() => setModalAgendarAberta(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#66777b] hover:text-[#113240] dark:text-[#a0aeaf]"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
                >
                  Salvar agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Escrever Roteiro (Bloco de Notas com Ferramentas & Comentários da Equipe) */}
      {modalRoteiroAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header do Roteiro */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#226380]/15 text-[#226380] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#113240] dark:text-white">
                    Bloco de notas de roteiro
                  </h2>
                  <p className="text-xs text-[#86868b]">
                    Estruture tópicos, perguntas, pontos de fala e receba comentários da equipe
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setModalRoteiroAberta(false)} 
                className="text-[#86868b] hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Bloco de Notas */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Vínculo: Captação Agendada ou Roteiro Avulso */}
              <div className="p-3.5 rounded-xl bg-[#f0f4f3] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] space-y-2">
                <span className="text-xs font-semibold text-[#113240] dark:text-white block">
                  Vincular a uma captação agendada:
                </span>
                <select
                  value={roteiroCaptacaoId}
                  onChange={e => {
                    const id = e.target.value;
                    setRoteiroCaptacaoId(id);
                    if (id !== 'avulso') {
                      const cap = captacoes.find(c => c.id === id);
                      if (cap) {
                        setRoteiroTitulo(cap.titulo);
                        setRoteiroReligiosoNome(cap.entrevistado_nome);
                        if (cap.roteiro) setRoteiroTexto(cap.roteiro);
                        if (cap.comentarios) setRoteiroComentarios(cap.comentarios);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#1c2427] text-[#113240] dark:text-white"
                >
                  <option value="avulso">Roteiro independente / Projeto avulso</option>
                  {captacoes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.entrevistado_nome} — {c.titulo} ({new Date(c.data_gravacao).toLocaleDateString('pt-BR')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Título & Entrevistado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#113240] dark:text-white">
                    Título do roteiro *
                  </label>
                  <input
                    type="text"
                    required
                    value={roteiroTitulo}
                    onChange={e => setRoteiroTitulo(e.target.value)}
                    placeholder="Ex: Entrevista sobre a Vocação e Missão Dehoniana"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#113240] dark:text-white">
                    Confrade / Entrevistado
                  </label>
                  <input
                    type="text"
                    value={roteiroReligiosoNome}
                    onChange={e => setRoteiroReligiosoNome(e.target.value)}
                    placeholder="Ex: Pe. Anderson Carlos S Viana, scj"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white"
                  />
                </div>
              </div>

              {/* Barra de Ferramentas de Texto do Bloco de Notas */}
              <div className="p-2 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] flex flex-wrap items-center gap-1.5 text-xs select-none">
                <button
                  type="button"
                  onClick={() => aplicarFormatacao('# ')}
                  className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-bold flex items-center gap-1 text-[#113240] dark:text-white"
                  title="Título Principal (H1)"
                >
                  <Heading1 className="w-3.5 h-3.5" />
                  <span>H1</span>
                </button>

                <button
                  type="button"
                  onClick={() => aplicarFormatacao('## ')}
                  className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-bold flex items-center gap-1 text-[#113240] dark:text-white"
                  title="Subtítulo (H2)"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                  <span>H2</span>
                </button>

                <button
                  type="button"
                  onClick={() => aplicarFormatacao('**', '**')}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-[#113240] dark:text-white"
                  title="Negrito"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => aplicarFormatacao('*', '*')}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 italic text-[#113240] dark:text-white"
                  title="Itálico"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => aplicarFormatacao('• ')}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-[#113240] dark:text-white"
                  title="Lista com marcadores"
                >
                  <List className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => aplicarFormatacao('1. ')}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-[#113240] dark:text-white"
                  title="Lista numerada"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => aplicarFormatacao('> ')}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-[#113240] dark:text-white"
                  title="Citação / Ponto de fala"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>

                {/* Atalhos Rápidos de Menções @ */}
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />
                <span className="text-[#86868b] text-xs font-semibold flex items-center gap-0.5">
                  <AtSign className="w-3 h-3 text-[#226380]" /> @
                </span>
                {roteiroReligiosoNome && (
                  <button
                    type="button"
                    onClick={() => inserirToken(`@${roteiroReligiosoNome.split(' ')[0]}`)}
                    className="px-2 py-0.5 rounded bg-[#226380]/10 text-[#226380] hover:bg-[#226380]/20 font-semibold"
                  >
                    @{roteiroReligiosoNome.split(' ')[0]}
                  </button>
                )}
                {equipe.slice(0, 3).map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => inserirToken(`@${m.nome.split(' ')[0]}`)}
                    className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[#113240] dark:text-white hover:bg-slate-300 font-semibold"
                  >
                    @{m.nome.split(' ')[0]}
                  </button>
                ))}

                {/* Atalhos Rápidos de Tags # */}
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />
                <span className="text-[#86868b] text-xs font-semibold flex items-center gap-0.5">
                  <Hash className="w-3 h-3 text-[#226380]" /> #
                </span>
                {TAGS_SUGERIDAS.slice(0, 4).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => inserirToken(`#${tag}`)}
                    className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-[#226380] dark:text-sky-300 hover:bg-sky-100 font-semibold"
                  >
                    #{tag}
                  </button>
                ))}
              </div>

              {/* Área do Bloco de Notas */}
              <textarea
                id="textarea-roteiro"
                rows={10}
                value={roteiroTexto}
                onChange={e => setRoteiroTexto(e.target.value)}
                placeholder="Escreva os pontos de fala, introdução, perguntas e ordem dos assuntos...

# Abertura
• Acolhida e apresentação com @Pe. João
• Contextualização da data festiva #vocacional

## Bloco 1: História Vocacional
> Como surgiu a vocação ao sacerdócio no Sagrado Coração?
• Primeiros passos e entrada no seminário de Corupá

## Bloco 2: Mensagem para a Província BRM
• Benção e palavra final às famílias e juventudes"
                className="w-full p-4 text-xs sm:text-sm rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#226380]"
              />

              {/* Seção de Comentários da Equipe no Roteiro */}
              <div className="p-4 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#113240] dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#226380]" />
                    <span>Comentários & notas da equipe ({roteiroComentarios.length})</span>
                  </span>
                  <span className="text-xs text-[#86868b]">
                    Observações de bastidores, perguntas sugeridas ou notas técnicas
                  </span>
                </div>

                {roteiroComentarios.length === 0 ? (
                  <p className="text-xs text-[#86868b] py-1">
                    Nenhum comentário registrado para este roteiro. Deixe uma observação abaixo.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {roteiroComentarios.map(com => (
                      <div
                        key={com.id}
                        className="p-2.5 rounded-lg bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] text-xs space-y-1"
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

                {/* Input para adicionar comentário */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={novoComentarioNoRoteiro}
                    onChange={e => setNovoComentarioNoRoteiro(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdicionarComentarioRoteiro();
                      }
                    }}
                    placeholder="Adicionar nota para a equipe (Enter para enviar)..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#1c2427] text-[#113240] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#226380]"
                  />
                  <button
                    type="button"
                    onClick={handleAdicionarComentarioRoteiro}
                    className="px-3.5 py-2 rounded-lg bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Comentar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="px-6 py-3.5 border-t border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalRoteiroAberta(false)}
                className="px-4 py-2 text-xs font-semibold text-[#66777b] hover:text-[#113240] dark:text-[#a0aeaf]"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={handleSalvarRoteiro}
                className="px-5 py-2 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar roteiro</span>
              </button>
            </div>
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
