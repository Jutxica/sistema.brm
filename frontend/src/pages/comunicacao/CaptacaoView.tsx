import React, { useState, useMemo } from 'react';
import { 
  Video, Calendar as CalendarIcon, Clock, MapPin, CheckSquare, 
  Square, Plus, CheckCircle2, User, Play, X, ExternalLink,
  MessageSquare, Hash, AtSign, Send, ChevronDown, ChevronUp,
  Tag, Filter, FileText, PenTool, Bold, Italic, Heading1, Heading2,
  List, ListOrdered, Quote, Link2, Sparkles, BookOpen,
  ArrowLeft, Copy, Check, Eye, Columns, Printer
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

/**
 * Formatador inline rico para renderizar **negrito**, *itálico*, @menções e #tags
 */
const formatarLinhaInline = (texto: string, onTagClick?: (tag: string) => void) => {
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|@[A-Za-zÀ-ÿ0-9._-]+|#[A-Za-zÀ-ÿ0-9_-]+)/g;
  const parts = texto.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const boldContent = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-[#113240] dark:text-white">
          {boldContent}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      const italicContent = part.slice(1, -1);
      return (
        <em key={index} className="italic text-[#226380] dark:text-[#A3C3C7]">
          {italicContent}
        </em>
      );
    }

    if (part.startsWith('@') && part.length > 1) {
      return (
        <span
          key={index}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#226380]/15 text-[#226380] dark:text-[#A3C3C7] font-semibold text-xs border border-[#226380]/20 mx-0.5 align-middle"
        >
          <AtSign className="w-3 h-3 inline shrink-0" />
          <span>{part.slice(1)}</span>
        </span>
      );
    }

    if (part.startsWith('#') && part.length > 1) {
      const tagLimpa = part.replace('#', '').toLowerCase();
      return (
        <button
          key={index}
          type="button"
          onClick={() => onTagClick?.(tagLimpa)}
          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-[#226380] dark:text-sky-300 font-semibold text-xs border border-sky-200 dark:border-sky-900/40 hover:underline mx-0.5 align-middle"
          title={`Filtrar por #${tagLimpa}`}
        >
          <Hash className="w-3 h-3 inline shrink-0" />
          <span>{tagLimpa}</span>
        </button>
      );
    }

    return <span key={index}>{part}</span>;
  });
};

/**
 * Componente de Visualização Formatada do Roteiro
 * Converte marcações Markdown (H1, H2, citações, listas, negrito, menções e tags)
 * em tipografia editorial nobre da Província BRM.
 */
interface RoteiroRenderizadoProps {
  texto: string;
  onTagClick?: (tag: string) => void;
  className?: string;
}

const RoteiroRenderizado: React.FC<RoteiroRenderizadoProps> = ({ texto, onTagClick, className = '' }) => {
  if (!texto || !texto.trim()) {
    return (
      <div className="p-8 text-center text-xs text-[#86868b] italic bg-[#f8faf9] dark:bg-[#141a1c] rounded-2xl border border-dashed border-[#dce4e2] dark:border-[#354246]">
        Nenhum texto inserido no roteiro ainda.
      </div>
    );
  }

  const linhas = texto.split('\n');

  return (
    <div className={`space-y-3 text-sm sm:text-base leading-relaxed ${className}`}>
      {linhas.map((linha, idx) => {
        const trimmed = linha.trim();

        // Linha em branco
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // Heading 1 (# ...)
        if (linha.startsWith('# ')) {
          return (
            <h1
              key={idx}
              className="text-xl sm:text-2xl font-bold text-[#113240] dark:text-white pt-4 pb-1.5 border-b border-[#dce4e2] dark:border-[#354246] first:pt-0 font-serif"
            >
              {formatarLinhaInline(linha.slice(2).trim(), onTagClick)}
            </h1>
          );
        }

        // Heading 2 (## ...)
        if (linha.startsWith('## ')) {
          return (
            <h2
              key={idx}
              className="text-lg sm:text-xl font-bold text-[#226380] dark:text-[#A3C3C7] pt-3 pb-1"
            >
              {formatarLinhaInline(linha.slice(3).trim(), onTagClick)}
            </h2>
          );
        }

        // Heading 3 (### ...)
        if (linha.startsWith('### ')) {
          return (
            <h3
              key={idx}
              className="text-base font-semibold text-[#113240] dark:text-white pt-2 pb-0.5"
            >
              {formatarLinhaInline(linha.slice(4).trim(), onTagClick)}
            </h3>
          );
        }

        // Citação / Ponto de fala / Pergunta (> ...)
        if (linha.startsWith('> ')) {
          return (
            <div
              key={idx}
              className="pl-4 py-2.5 my-2 border-l-4 border-[#226380] bg-[#f0f4f3]/70 dark:bg-[#141a1c] rounded-r-xl text-[#113240] dark:text-[#edf2f1] font-medium italic text-sm sm:text-base"
            >
              {formatarLinhaInline(linha.slice(2).trim(), onTagClick)}
            </div>
          );
        }

        // Lista com marcadores (• ou - ou *)
        if (linha.startsWith('• ') || linha.startsWith('- ') || (linha.startsWith('* ') && !linha.endsWith('*'))) {
          const conteudo = linha.replace(/^([•\-\*]\s+)/, '');
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-2 my-1 text-[#334155] dark:text-[#cbd5e1]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#226380] mt-2.5 shrink-0" />
              <div className="flex-1">
                {formatarLinhaInline(conteudo, onTagClick)}
              </div>
            </div>
          );
        }

        // Lista numerada (1. 2. etc.)
        const matchNumerada = linha.match(/^(\d+)\.\s+(.*)$/);
        if (matchNumerada) {
          const [, num, conteudo] = matchNumerada;
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-2 my-1 text-[#334155] dark:text-[#cbd5e1]">
              <span className="font-bold text-[#226380] text-xs mt-0.5 min-w-[1.2rem] shrink-0">
                {num}.
              </span>
              <div className="flex-1">
                {formatarLinhaInline(conteudo, onTagClick)}
              </div>
            </div>
          );
        }

        // Parágrafo padrão
        return (
          <p key={idx} className="text-[#334155] dark:text-[#cbd5e1]">
            {formatarLinhaInline(linha, onTagClick)}
          </p>
        );
      })}
    </div>
  );
};

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
  
  // Estados de Controle de Interface
  const [modalAgendarAberta, setModalAgendarAberta] = useState(false);
  const [modoRoteiroAberto, setModoRoteiroAberto] = useState(false);
  const [abaEditor, setAbaEditor] = useState<'visualizar' | 'editar' | 'split'>('visualizar');
  const [salvoFeedback, setSalvoFeedback] = useState(false);
  const [copiadoFeedback, setCopiadoFeedback] = useState(false);
  const [teleprompterRoteiro, setTeleprompterRoteiro] = useState<string | null>(null);

  // Estados do Modal: 1. Agendar Captação
  const [agendaTitulo, setAgendaTitulo] = useState('');
  const [agendaReligiosoId, setAgendaReligiosoId] = useState('');
  const [agendaEntrevistadoNome, setAgendaEntrevistadoNome] = useState('');
  const [agendaData, setAgendaData] = useState('');
  const [agendaHorario, setAgendaHorario] = useState('14:00');
  const [agendaDuracao, setAgendaDuracao] = useState('45 min');
  const [agendaLocal, setAgendaLocal] = useState('Cúria Provincial - Sala de Gravações');

  // Estados do Roteiro (Página Inteira: Visualizar / Editar / Dividir Tela)
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

  // Abrir Roteiro para uma Captação Específica (com opção de modo inicial)
  const handleAbrirRoteiroParaCaptacao = (cap: ComunicacaoCaptacao, modoInicial?: 'visualizar' | 'editar' | 'split') => {
    setRoteiroCaptacaoId(cap.id);
    setRoteiroTitulo(cap.titulo);
    setRoteiroReligiosoNome(cap.entrevistado_nome);
    setRoteiroTexto(cap.roteiro || '');
    setRoteiroComentarios(cap.comentarios || []);
    setAbaEditor(modoInicial || (cap.roteiro?.trim() ? 'visualizar' : 'split'));
    setModoRoteiroAberto(true);
  };

  // Abrir Editor de Novo Roteiro em Página Inteira (Em Branco com Split Preview ao vivo)
  const handleAbrirNovoRoteiro = () => {
    setRoteiroCaptacaoId('avulso');
    setRoteiroTitulo('');
    setRoteiroReligiosoNome('');
    setRoteiroTexto('');
    setRoteiroComentarios([]);
    setAbaEditor('split');
    setModoRoteiroAberto(true);
  };

  // Ferramentas Inteligentes de Formatação do Bloco de Notas
  const aplicarFormatacao = (prefixo: string, sufixo: string = '') => {
    const textarea = document.getElementById('textarea-roteiro') as HTMLTextAreaElement;
    if (!textarea) return;

    const inicio = textarea.selectionStart;
    const fim = textarea.selectionEnd;
    const textoSel = roteiroTexto.substring(inicio, fim);

    let novoTexto = '';
    let novoInicioCursor = inicio;
    let novoFimCursor = fim;

    // Se é prefixo de linha (ex: # , ## , • , 1. , > )
    if (prefixo.endsWith(' ') && !sufixo) {
      const ultimaQuebra = roteiroTexto.lastIndexOf('\n', inicio - 1);
      const inicioLinha = ultimaQuebra === -1 ? 0 : ultimaQuebra + 1;

      // Se há seleção multilinhas, prefixa cada linha
      if (inicio !== fim && textoSel.includes('\n')) {
        const linhasSel = textoSel.split('\n').map(l => (l.trim() ? `${prefixo}${l}` : l)).join('\n');
        novoTexto = roteiroTexto.substring(0, inicio) + linhasSel + roteiroTexto.substring(fim);
        novoInicioCursor = inicio;
        novoFimCursor = inicio + linhasSel.length;
      } else {
        novoTexto = roteiroTexto.substring(0, inicioLinha) + prefixo + roteiroTexto.substring(inicioLinha);
        novoInicioCursor = inicio + prefixo.length;
        novoFimCursor = fim + prefixo.length;
      }
    } else {
      // Formatação inline (**negrito**, *itálico*)
      const miolo = textoSel || (prefixo === '**' ? 'negrito' : prefixo === '*' ? 'itálico' : 'texto');
      novoTexto = roteiroTexto.substring(0, inicio) + prefixo + miolo + sufixo + roteiroTexto.substring(fim);
      novoInicioCursor = inicio + prefixo.length;
      novoFimCursor = novoInicioCursor + miolo.length;
    }

    setRoteiroTexto(novoTexto);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(novoInicioCursor, novoFimCursor);
    }, 30);
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

  // Salvar Roteiro com opção de permanecer ou voltar à lista
  const handleSalvarRoteiro = (fecharAposSalvar: boolean = false) => {
    if (!roteiroTitulo.trim()) {
      setRoteiroTitulo(roteiroReligiosoNome ? `Roteiro — ${roteiroReligiosoNome}` : 'Roteiro de Gravação');
    }

    const { tags, mencoes } = extrairTagsEMencoes(roteiroTexto);

    if (roteiroCaptacaoId !== 'avulso') {
      // Atualiza a captação agendada existente
      if (onAtualizarRoteiro) {
        onAtualizarRoteiro(roteiroCaptacaoId, roteiroTexto, tags, mencoes);
      }
    } else {
      // Cria uma nova captação ou roteiro avulso
      onCriarCaptacao({
        titulo: (roteiroTitulo.trim() || 'Roteiro de Gravação'),
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

    setSalvoFeedback(true);
    setTimeout(() => setSalvoFeedback(false), 2500);

    if (fecharAposSalvar) {
      setModoRoteiroAberto(false);
    } else {
      // Transiciona imediatamente para o modo de visualização formatada sem edição!
      setAbaEditor('visualizar');
    }
  };

  // Métricas do Roteiro (Palavras e Duração Estimada de Gravação)
  const contagemPalavras = useMemo(() => {
    const limpo = roteiroTexto.trim();
    if (!limpo) return 0;
    return limpo.split(/\s+/).length;
  }, [roteiroTexto]);

  const tempoEstimadoMinutos = useMemo(() => {
    if (contagemPalavras === 0) return '0.0';
    return (contagemPalavras / 130).toFixed(1);
  }, [contagemPalavras]);

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
    return <RoteiroRenderizado texto={texto} onTagClick={tag => setFiltroTag(tag)} />;
  };

  // =========================================================================
  // VIEW FULL PAGE: Roteiro em Página Inteira (Visualizar / Editar / Dividir Tela)
  // =========================================================================
  if (modoRoteiroAberto) {
    const { tags: tagsDetectadas, mencoes: mencoesDetectadas } = extrairTagsEMencoes(roteiroTexto);

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Barra Superior de Ações & Alternador de Modos */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#dce4e2] dark:border-[#354246]">
          {/* Navegação & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setModoRoteiroAberto(false)}
              className="flex items-center gap-2 text-xs font-semibold text-[#226380] dark:text-[#A3C3C7] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para captações & roteiros</span>
            </button>
            <span className="text-[#dce4e2] dark:text-[#354246]">|</span>
            <span className="text-xs text-[#66777b] dark:text-[#a0aeaf] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#226380]" />
              <span>{roteiroTitulo || 'Roteiro de Gravação'}</span>
            </span>
          </div>

          {/* Abas Centrais: Alternador de Modos (Edição / Dividir Tela / Visualizar) */}
          <div className="flex items-center p-1 bg-[#f0f4f3] dark:bg-[#141a1c] rounded-xl border border-[#dce4e2] dark:border-[#354246] self-start md:self-auto">
            <button
              type="button"
              onClick={() => setAbaEditor('editar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                abaEditor === 'editar'
                  ? 'bg-[#113240] text-white'
                  : 'text-[#66777b] dark:text-[#a0aeaf] hover:text-[#113240]'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Modo Edição</span>
            </button>

            <button
              type="button"
              onClick={() => setAbaEditor('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                abaEditor === 'split'
                  ? 'bg-[#113240] text-white'
                  : 'text-[#66777b] dark:text-[#a0aeaf] hover:text-[#113240]'
              }`}
              title="Editor e visualização formatada lado a lado"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Dividir tela (Ao vivo)</span>
            </button>

            <button
              type="button"
              onClick={() => setAbaEditor('visualizar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                abaEditor === 'visualizar'
                  ? 'bg-[#113240] text-white'
                  : 'text-[#66777b] dark:text-[#a0aeaf] hover:text-[#113240]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visualizar roteiro</span>
            </button>
          </div>

          {/* Botões de Ação na Direita */}
          <div className="flex flex-wrap items-center gap-2">
            {salvoFeedback && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Salvo com sucesso!</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(roteiroTexto);
                setCopiadoFeedback(true);
                setTimeout(() => setCopiadoFeedback(false), 2000);
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-50 text-[#113240] dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copiadoFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#52636a]" />
                  <span>Copiar texto</span>
                </>
              )}
            </button>

            {roteiroTexto.trim() && (
              <>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-50 text-[#113240] dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Imprimir roteiro ou exportar PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-[#52636a]" />
                  <span>Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTeleprompterRoteiro(roteiroTexto)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-50 text-[#113240] dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Abrir em tela preta para leitura durante gravação"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Teleprompter</span>
                </button>
              </>
            )}

            {abaEditor === 'visualizar' ? (
              <button
                type="button"
                onClick={() => setAbaEditor('editar')}
                className="px-4 py-1.5 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Editar roteiro</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSalvarRoteiro(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#1c2427] border border-[#226380] text-[#226380] hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Salvar e visualizar o roteiro formatado"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar rascunho</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSalvarRoteiro(true)}
                  className="px-4 py-1.5 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar e concluir</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* CASO 1: ABA VISUALIZAR ROTEIRO (Leitura Limpa & Diagramada Sem Edição) */}
        {/* ================================================================= */}
        {abaEditor === 'visualizar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Folha Principal do Roteiro (Formatação Nobre Dehoniana) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-3xl p-6 sm:p-10 space-y-6">
                {/* Cabeçalho do Roteiro */}
                <div className="border-b border-[#dce4e2] dark:border-[#354246] pb-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] text-xs font-semibold">
                      {roteiroReligiosoNome ? `Entrevistado: ${roteiroReligiosoNome}` : 'Roteiro de Gravação'}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-[#86868b]">
                      <span><strong>{contagemPalavras}</strong> palavras</span>
                      <span>·</span>
                      <span>Tempo estimado: <strong>~{tempoEstimadoMinutos} min</strong></span>
                    </div>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#113240] dark:text-white font-serif tracking-tight">
                    {roteiroTitulo || 'Roteiro de Gravação Sem Título'}
                  </h1>

                  {roteiroCaptacaoId !== 'avulso' && (
                    <p className="text-xs text-[#66777b] dark:text-[#a0aeaf] flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#226380]" />
                      <span>Vinculado à gravação agendada na Província BRM</span>
                    </p>
                  )}
                </div>

                {/* Conteúdo Renderizado com Formatações */}
                <div className="py-2 min-h-[350px]">
                  <RoteiroRenderizado texto={roteiroTexto} onTagClick={t => setFiltroTag(t)} />
                </div>

                {/* Rodapé do Roteiro com Ações Rápidas */}
                <div className="pt-6 border-t border-[#dce4e2] dark:border-[#354246] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#86868b]">
                  <span>Província dos Padres Dehonianos — BRM · Setor de Comunicação</span>
                  <button
                    type="button"
                    onClick={() => setAbaEditor('editar')}
                    className="flex items-center gap-1.5 text-[#226380] dark:text-[#A3C3C7] font-semibold hover:underline"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Editar este roteiro</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Painel Lateral: Comentários e Elementos Detectados */}
            <div className="lg:col-span-4 space-y-4">
              {/* Box de Comentários da Equipe */}
              <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#226380]" />
                    <h3 className="text-xs font-bold text-[#113240] dark:text-white">
                      Comentários da equipe ({roteiroComentarios.length})
                    </h3>
                  </div>
                  <span className="text-xs text-[#86868b]">Bastidores</span>
                </div>

                <div className="space-y-2.5 max-h-[350px] overflow-y-auto">
                  {roteiroComentarios.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] text-center text-xs text-[#86868b]">
                      Nenhum comentário registrado ainda. Use o campo abaixo para alinhar pontos com a equipe.
                    </div>
                  ) : (
                    roteiroComentarios.map(com => (
                      <div
                        key={com.id}
                        className="p-3 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] space-y-1 text-xs"
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
                    ))
                  )}
                </div>

                {/* Envio de Comentário */}
                <div className="space-y-2 pt-2 border-t border-[#dce4e2] dark:border-[#354246]">
                  <textarea
                    rows={2}
                    value={novoComentarioNoRoteiro}
                    onChange={e => setNovoComentarioNoRoteiro(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAdicionarComentarioRoteiro();
                      }
                    }}
                    placeholder="Escreva uma nota para a equipe (Enter para enviar)..."
                    className="w-full p-2.5 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#226380]"
                  />
                  <button
                    type="button"
                    onClick={handleAdicionarComentarioRoteiro}
                    className="w-full py-2 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar comentário</span>
                  </button>
                </div>
              </div>

              {/* Box de Tags e Menções Detectadas */}
              <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-[#113240] dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#226380]" />
                  <span>Elementos detectados no roteiro</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[#86868b] block mb-1">Tags temáticas (#):</span>
                    {tagsDetectadas.length === 0 ? (
                      <span className="text-[#86868b] italic">Nenhuma hashtag inserida ainda.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {tagsDetectadas.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-[#226380] dark:text-sky-300 font-semibold">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[#86868b] block mb-1">Confrades / Equipe (@):</span>
                    {mencoesDetectadas.length === 0 ? (
                      <span className="text-[#86868b] italic">Nenhuma menção inserida ainda.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {mencoesDetectadas.map(m => (
                          <span key={m} className="px-2 py-0.5 rounded bg-[#226380]/10 text-[#226380] font-semibold">
                            @{m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* CASO 2: ABA DIVIDIR TELA (EDITOR + PREVIEW AO VIVO LADO A LADO) */}
        {/* ================================================================= */}
        {abaEditor === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUNA ESQUERDA (6 COLUNAS): Editor com Barra de Ferramentas */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-5 space-y-4">
                {/* Vínculo & Confrade */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
                  <div className="sm:col-span-7">
                    <label className="block text-xs font-semibold text-[#66777b] dark:text-[#a0aeaf] mb-1">
                      Vínculo com captação agendada
                    </label>
                    <select
                      value={roteiroCaptacaoId}
                      onChange={e => {
                        const id = e.target.value;
                        setRoteiroCaptacaoId(id);
                        if (id !== 'avulso') {
                          const cap = captacoes.find(c => c.id === id);
                          if (cap) {
                            if (!roteiroTitulo) setRoteiroTitulo(cap.titulo);
                            setRoteiroReligiosoNome(cap.entrevistado_nome);
                            if (cap.roteiro && !roteiroTexto) setRoteiroTexto(cap.roteiro);
                            if (cap.comentarios) setRoteiroComentarios(cap.comentarios);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white"
                    >
                      <option value="avulso">Roteiro independente / Projeto avulso</option>
                      {captacoes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.entrevistado_nome} — {c.titulo} ({new Date(c.data_gravacao).toLocaleDateString('pt-BR')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-xs font-semibold text-[#66777b] dark:text-[#a0aeaf] mb-1">
                      Confrade / Entrevistado
                    </label>
                    <input
                      type="text"
                      value={roteiroReligiosoNome}
                      onChange={e => setRoteiroReligiosoNome(e.target.value)}
                      placeholder="Ex: Pe. Anderson Carlos, scj"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white"
                    />
                  </div>
                </div>

                {/* Título Principal */}
                <div>
                  <input
                    type="text"
                    value={roteiroTitulo}
                    onChange={e => setRoteiroTitulo(e.target.value)}
                    placeholder="Título do roteiro ou pauta de gravação..."
                    className="w-full text-lg sm:text-xl font-bold text-[#113240] dark:text-white placeholder-[#86868b] border-none bg-transparent focus:outline-none focus:ring-0 p-0"
                  />
                </div>

                {/* Barra de Ferramentas de Formatação */}
                <div className="p-2 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] flex flex-wrap items-center gap-1.5 text-xs select-none">
                  <button
                    type="button"
                    onClick={() => aplicarFormatacao('# ')}
                    className="px-2.5 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-bold flex items-center gap-1 text-[#113240] dark:text-white"
                    title="Título Principal (H1)"
                  >
                    <Heading1 className="w-3.5 h-3.5" />
                    <span>H1</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => aplicarFormatacao('## ')}
                    className="px-2.5 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-bold flex items-center gap-1 text-[#113240] dark:text-white"
                    title="Subtítulo (H2)"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                    <span>H2</span>
                  </button>

                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />

                  <button
                    type="button"
                    onClick={() => aplicarFormatacao('**', '**')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-[#113240] dark:text-white"
                    title="Negrito"
                  >
                    <Bold className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => aplicarFormatacao('*', '*')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 italic text-[#113240] dark:text-white"
                    title="Itálico"
                  >
                    <Italic className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => aplicarFormatacao('• ')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-[#113240] dark:text-white"
                    title="Lista com marcadores"
                  >
                    <List className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => aplicarFormatacao('1. ')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-[#113240] dark:text-white"
                    title="Lista numerada"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => aplicarFormatacao('> ')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-[#113240] dark:text-white"
                    title="Citação / Ponto de fala"
                  >
                    <Quote className="w-4 h-4" />
                  </button>

                  {/* Atalhos Rápidos de Menções @ */}
                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />
                  <span className="text-[#86868b] text-xs font-semibold flex items-center gap-0.5">
                    <AtSign className="w-3.5 h-3.5 text-[#226380]" />
                  </span>
                  {roteiroReligiosoNome && (
                    <button
                      type="button"
                      onClick={() => inserirToken(`@${roteiroReligiosoNome.split(' ')[0]}`)}
                      className="px-2 py-0.5 rounded-md bg-[#226380]/10 text-[#226380] hover:bg-[#226380]/20 font-semibold"
                    >
                      @{roteiroReligiosoNome.split(' ')[0]}
                    </button>
                  )}

                  {/* Atalhos Rápidos de Tags # */}
                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />
                  <span className="text-[#86868b] text-xs font-semibold flex items-center gap-0.5">
                    <Hash className="w-3.5 h-3.5 text-[#226380]" />
                  </span>
                  {TAGS_SUGERIDAS.slice(0, 3).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => inserirToken(`#${tag}`)}
                      className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-[#226380] dark:text-sky-300 hover:bg-sky-100 font-semibold"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>

                {/* Textarea de Edição */}
                <div>
                  <textarea
                    id="textarea-roteiro"
                    rows={20}
                    value={roteiroTexto}
                    onChange={e => setRoteiroTexto(e.target.value)}
                    placeholder="Escreva os tópicos, introdução, perguntas e ordem dos assuntos...

# Abertura
• Acolhida e apresentação com @Pe. João
• Contextualização da data festiva #vocacional

## Bloco 1: História Vocacional
> Como surgiu a vocação ao sacerdócio no Sagrado Coração?
• Primeiros passos e entrada no seminário

## Bloco 2: Mensagem para a Província BRM
• Benção e palavra final às famílias e juventudes #dehoniano"
                    className="w-full p-4 text-sm font-normal rounded-2xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#226380] min-h-[480px]"
                  />
                </div>

                {/* Métricas */}
                <div className="flex items-center justify-between text-xs text-[#86868b] pt-1">
                  <span><strong>{contagemPalavras}</strong> palavras</span>
                  <span>Tempo estimado: <strong>~{tempoEstimadoMinutos} min</strong></span>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA (6 COLUNAS): Visualização em Tempo Real (Preview Ao Vivo) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 space-y-4 min-h-[580px]">
                <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#226380]" />
                    <span className="text-xs font-bold text-[#113240] dark:text-white">
                      Visualização em tempo real (Ao vivo)
                    </span>
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Formatado</span>
                  </span>
                </div>

                <div className="overflow-y-auto max-h-[500px] pr-2">
                  <RoteiroRenderizado texto={roteiroTexto} onTagClick={t => setFiltroTag(t)} />
                </div>
              </div>

              {/* Box de Comentários da Equipe no Modo Split */}
              <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#113240] dark:text-white flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#226380]" />
                    <span>Comentários da equipe ({roteiroComentarios.length})</span>
                  </span>
                </div>
                <div className="flex gap-2">
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
                    placeholder="Nota rápida para a equipe..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAdicionarComentarioRoteiro}
                    className="px-3 py-1.5 rounded-xl bg-[#226380] text-white text-xs font-semibold"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* CASO 3: ABA MODO EDIÇÃO (FOCO TOTAL NA ESCRITA + PAINEL LATERAL) */}
        {/* ================================================================= */}
        {abaEditor === 'editar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUNA ESQUERDA (8 COLUNAS): Área de Escrita Ampla e Confortável */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 sm:p-8 space-y-6">
                {/* Vínculo & Confrade */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-4 border-b border-[#dce4e2] dark:border-[#354246]">
                  <div className="sm:col-span-7">
                    <label className="block text-xs font-semibold text-[#66777b] dark:text-[#a0aeaf] mb-1">
                      Vínculo com captação agendada
                    </label>
                    <select
                      value={roteiroCaptacaoId}
                      onChange={e => {
                        const id = e.target.value;
                        setRoteiroCaptacaoId(id);
                        if (id !== 'avulso') {
                          const cap = captacoes.find(c => c.id === id);
                          if (cap) {
                            if (!roteiroTitulo) setRoteiroTitulo(cap.titulo);
                            setRoteiroReligiosoNome(cap.entrevistado_nome);
                            if (cap.roteiro && !roteiroTexto) setRoteiroTexto(cap.roteiro);
                            if (cap.comentarios) setRoteiroComentarios(cap.comentarios);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white"
                    >
                      <option value="avulso">Roteiro independente / Projeto avulso</option>
                      {captacoes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.entrevistado_nome} — {c.titulo} ({new Date(c.data_gravacao).toLocaleDateString('pt-BR')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-xs font-semibold text-[#66777b] dark:text-[#a0aeaf] mb-1">
                      Confrade / Entrevistado
                    </label>
                    <input
                      type="text"
                      value={roteiroReligiosoNome}
                      onChange={e => setRoteiroReligiosoNome(e.target.value)}
                      placeholder="Ex: Pe. Anderson Carlos S Viana, scj"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white"
                    />
                  </div>
                </div>

                {/* Título Principal do Roteiro */}
                <div>
                  <input
                    type="text"
                    value={roteiroTitulo}
                    onChange={e => setRoteiroTitulo(e.target.value)}
                    placeholder="Título do roteiro ou pauta de gravação..."
                    className="w-full text-xl sm:text-2xl font-bold text-[#113240] dark:text-white placeholder-[#86868b] border-none bg-transparent focus:outline-none focus:ring-0 p-0"
                  />
                </div>

                {/* Barra de Ferramentas de Formatação */}
                <div className="p-2 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] flex flex-wrap items-center gap-1.5 text-xs select-none">
                  <button
                    type="button"
                    onClick={() => aplicarFormatacao('# ')}
                    className="px-2.5 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-bold flex items-center gap-1 text-[#113240] dark:text-white"
                    title="Título Principal (H1)"
                  >
                    <Heading1 className="w-3.5 h-3.5" />
                    <span>H1</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => aplicarFormatacao('## ')}
                    className="px-2.5 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-bold flex items-center gap-1 text-[#113240] dark:text-white"
                    title="Subtítulo (H2)"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                    <span>H2</span>
                  </button>

                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />

                  <button
                    type="button"
                    onClick={() => aplicarFormatacao('**', '**')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-[#113240] dark:text-white"
                    title="Negrito"
                  >
                    <Bold className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => aplicarFormatacao('*', '*')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 italic text-[#113240] dark:text-white"
                    title="Itálico"
                  >
                    <Italic className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => aplicarFormatacao('• ')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-[#113240] dark:text-white"
                    title="Lista com marcadores"
                  >
                    <List className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => aplicarFormatacao('1. ')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-[#113240] dark:text-white"
                    title="Lista numerada"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => aplicarFormatacao('> ')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-[#113240] dark:text-white"
                    title="Citação / Ponto de fala"
                  >
                    <Quote className="w-4 h-4" />
                  </button>

                  {/* Atalhos Rápidos de Menções @ */}
                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />
                  <span className="text-[#86868b] text-xs font-semibold flex items-center gap-0.5">
                    <AtSign className="w-3.5 h-3.5 text-[#226380]" />
                  </span>
                  {roteiroReligiosoNome && (
                    <button
                      type="button"
                      onClick={() => inserirToken(`@${roteiroReligiosoNome.split(' ')[0]}`)}
                      className="px-2 py-0.5 rounded-md bg-[#226380]/10 text-[#226380] hover:bg-[#226380]/20 font-semibold"
                    >
                      @{roteiroReligiosoNome.split(' ')[0]}
                    </button>
                  )}
                  {equipe.slice(0, 3).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => inserirToken(`@${m.nome.split(' ')[0]}`)}
                      className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[#113240] dark:text-white hover:bg-slate-300 font-semibold"
                    >
                      @{m.nome.split(' ')[0]}
                    </button>
                  ))}

                  {/* Atalhos Rápidos de Tags # */}
                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />
                  <span className="text-[#86868b] text-xs font-semibold flex items-center gap-0.5">
                    <Hash className="w-3.5 h-3.5 text-[#226380]" />
                  </span>
                  {TAGS_SUGERIDAS.slice(0, 4).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => inserirToken(`#${tag}`)}
                      className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-[#226380] dark:text-sky-300 hover:bg-sky-100 font-semibold"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>

                {/* Área Ampla do Bloco de Notas */}
                <div>
                  <textarea
                    id="textarea-roteiro"
                    rows={22}
                    value={roteiroTexto}
                    onChange={e => setRoteiroTexto(e.target.value)}
                    placeholder="Escreva os tópicos, introdução, perguntas e ordem dos assuntos...

# Abertura
• Acolhida e apresentação com @Pe. João
• Contextualização da data festiva #vocacional

## Bloco 1: História Vocacional
> Como surgiu a vocação ao sacerdócio no Sagrado Coração?
• Primeiros passos e entrada no seminário de Corupá

## Bloco 2: Mensagem para a Província BRM
• Benção e palavra final às famílias e juventudes #dehoniano"
                    className="w-full p-4 sm:p-5 text-sm sm:text-base font-normal rounded-2xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#226380] min-h-[500px]"
                  />
                </div>

                {/* Barra de Contagem & Duração Estimada */}
                <div className="flex flex-wrap items-center justify-between text-xs text-[#86868b] pt-2 border-t border-[#dce4e2] dark:border-[#354246]">
                  <div className="flex items-center gap-4">
                    <span><strong>{contagemPalavras}</strong> palavras</span>
                    <span>·</span>
                    <span>Tempo de gravação estimado: <strong>~{tempoEstimadoMinutos} min</strong></span>
                  </div>
                  <span>Dica: Use <strong>@</strong> para mencionar confrades e <strong>#</strong> para categorias temáticas.</span>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA (4 COLUNAS): Painel Colaborativo da Equipe & Bastidores */}
            <div className="lg:col-span-4 space-y-4">
              {/* Box de Comentários da Equipe */}
              <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#226380]" />
                    <h3 className="text-xs font-bold text-[#113240] dark:text-white">
                      Comentários da equipe ({roteiroComentarios.length})
                    </h3>
                  </div>
                  <span className="text-xs text-[#86868b]">Bastidores</span>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
                  {roteiroComentarios.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] text-center text-xs text-[#86868b]">
                      Nenhum comentário registrado ainda. Use o campo abaixo para alinhar pontos com a equipe.
                    </div>
                  ) : (
                    roteiroComentarios.map(com => (
                      <div
                        key={com.id}
                        className="p-3 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] space-y-1 text-xs"
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
                    ))
                  )}
                </div>

                {/* Envio de Comentário */}
                <div className="space-y-2 pt-2 border-t border-[#dce4e2] dark:border-[#354246]">
                  <textarea
                    rows={2}
                    value={novoComentarioNoRoteiro}
                    onChange={e => setNovoComentarioNoRoteiro(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAdicionarComentarioRoteiro();
                      }
                    }}
                    placeholder="Escreva uma nota para a equipe (Enter para enviar)..."
                    className="w-full p-2.5 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#226380]"
                  />
                  <button
                    type="button"
                    onClick={handleAdicionarComentarioRoteiro}
                    className="w-full py-2 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar comentário</span>
                  </button>
                </div>
              </div>

              {/* Box de Tags e Menções Detectadas */}
              <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-[#113240] dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#226380]" />
                  <span>Elementos detectados no roteiro</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[#86868b] block mb-1">Tags temáticas (#):</span>
                    {tagsDetectadas.length === 0 ? (
                      <span className="text-[#86868b] italic">Nenhuma hashtag inserida ainda.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {tagsDetectadas.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-[#226380] dark:text-sky-300 font-semibold">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[#86868b] block mb-1">Confrades / Equipe (@):</span>
                    {mencoesDetectadas.length === 0 ? (
                      <span className="text-[#86868b] italic">Nenhuma menção inserida ainda.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {mencoesDetectadas.map(m => (
                          <span key={m} className="px-2 py-0.5 rounded bg-[#226380]/10 text-[#226380] font-semibold">
                            @{m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Checklist Rápido de Gravação */}
              <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-5 space-y-2.5 text-xs text-[#52636a] dark:text-[#a0aeaf]">
                <span className="font-bold text-[#113240] dark:text-white block flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-[#226380]" />
                  <span>Checklist de gravação</span>
                </span>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>Bateria de câmera e lapela 100% cheias.</li>
                  <li>Ambiente silencioso (desligar ar condicionado se fizer eco).</li>
                  <li>Fazer perguntas de coração e incentivar o confrade a falar com calma.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Modal Teleprompter em Tela Cheia no Modo Roteiro */}
        {teleprompterRoteiro && (
          <div className="fixed inset-0 z-50 bg-black text-white p-8 flex flex-col justify-between animate-in fade-in select-none">
            <div className="flex items-center justify-between pb-4 border-b border-white/20">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-bold text-white/90">
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
  }

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
                              onClick={() => handleAbrirRoteiroParaCaptacao(cap, 'visualizar')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1c2427] hover:bg-slate-100 dark:hover:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] text-[#113240] dark:text-white text-xs font-semibold transition-colors"
                              title="Visualizar roteiro diagramado e formatado sem editar"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#226380]" />
                              <span>Visualizar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAbrirRoteiroParaCaptacao(cap, 'editar')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1c2427] hover:bg-slate-100 dark:hover:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] text-[#113240] dark:text-white text-xs font-semibold transition-colors"
                            >
                              <PenTool className="w-3.5 h-3.5 text-[#226380]" />
                              <span>Editar</span>
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
                            onClick={() => handleAbrirRoteiroParaCaptacao(cap, 'split')}
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

              <div className="pt-2 border-t border-[#dce4e2] dark:border-[#354246] flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-[#86868b] flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-[#226380]" />
                  <span>{cap.comentarios?.length || 0} comentários da equipe</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAbrirRoteiroParaCaptacao(cap, 'visualizar')}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1c2427] hover:bg-slate-50 dark:hover:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] text-[#113240] dark:text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                    title="Visualizar roteiro diagramado e limpo"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#226380]" />
                    <span>Visualizar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAbrirRoteiroParaCaptacao(cap, 'editar')}
                    className="px-3 py-1.5 rounded-lg bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Editar roteiro</span>
                  </button>
                </div>
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

      {/* Modal Teleprompter em Tela Cheia */}
      {teleprompterRoteiro && (
        <div className="fixed inset-0 z-50 bg-black text-white p-8 flex flex-col justify-between animate-in fade-in select-none">
          <div className="flex items-center justify-between pb-4 border-b border-white/20">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-bold text-white/90">
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
