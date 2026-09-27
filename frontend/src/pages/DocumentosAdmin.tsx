import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Upload, Plus, Search, Filter, Download, Trash2, Edit3, 
  ExternalLink, CheckCircle2, AlertCircle, X, FileCheck, Calendar, 
  Eye, Archive, RotateCcw, Copy, Check, HardDrive
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { staggerStyle } from '../hooks/useMotion';

export type CategoriaDocumento = 
  | 'Transferências'
  | 'Diretórios'
  | 'Comunicados'
  | 'Protocolos'
  | 'Decretos'
  | 'Formação & Subsídios'
  | 'Outros';

export interface DocumentoProvincial {
  id: string;
  titulo: string;
  categoria: CategoriaDocumento;
  subtitulo?: string;
  numero_referencia?: string;
  data_documento: string;
  arquivo_nome: string;
  arquivo_url: string;
  arquivo_path?: string;
  arquivo_tamanho_bytes?: number;
  mime_type?: string;
  descricao?: string;
  publicado_por: string;
  status: 'Ativo' | 'Arquivado';
  created_at: string;
}

const CATEGORIAS_OFICIAIS: CategoriaDocumento[] = [
  'Transferências',
  'Diretórios',
  'Comunicados',
  'Protocolos',
  'Decretos',
  'Formação & Subsídios',
  'Outros'
];

const LOCAL_STORAGE_KEY = 'brm_documentos_provinciais_v1';

// Dados inaugurais caso a tabela ainda esteja sendo criada no Supabase
const SEED_DOCUMENTOS: DocumentoProvincial[] = [
  {
    id: 'doc-seed-1',
    titulo: 'Diretório Provincial da Província Brasil Meridional - Edição Atualizada',
    categoria: 'Diretórios',
    numero_referencia: 'Dir. BRM 2026',
    data_documento: '2026-01-15',
    arquivo_nome: 'Diretorio_Provincial_BRM_2026.pdf',
    arquivo_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    arquivo_tamanho_bytes: 2450000,
    mime_type: 'application/pdf',
    descricao: 'Texto oficial com normas canônicas de vida comunitária, administração e governo da Província BRM.',
    publicado_por: 'Secretaria Provincial',
    status: 'Ativo',
    created_at: new Date('2026-01-15').toISOString()
  },
  {
    id: 'doc-seed-2',
    titulo: 'Nomeações e Transferências Canônicas para o Triênio 2026-2028',
    categoria: 'Transferências',
    numero_referencia: 'Prot. 03/2026',
    data_documento: '2026-02-01',
    arquivo_nome: 'Nomeacoes_Transferencias_BRM_2026.pdf',
    arquivo_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    arquivo_tamanho_bytes: 1150000,
    mime_type: 'application/pdf',
    descricao: 'Decreto do Superior Provincial com o remanejamento e novos encargos dos confrades nas comunidades e paróquias.',
    publicado_por: 'Secretaria Provincial',
    status: 'Ativo',
    created_at: new Date('2026-02-01').toISOString()
  },
  {
    id: 'doc-seed-3',
    titulo: 'Circular nº 01/2026: Orientações para a Quaresma e Ano Jubilar',
    categoria: 'Comunicados',
    numero_referencia: 'Circ. 01/2026',
    data_documento: '2026-02-18',
    arquivo_nome: 'Circular_01_2026_Quaresma_Jubileu.pdf',
    arquivo_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    arquivo_tamanho_bytes: 890000,
    mime_type: 'application/pdf',
    descricao: 'Mensagem do Governo Provincial a todas as comunidades sobre vivência fraterna e oração.',
    publicado_por: 'Secretaria Provincial',
    status: 'Ativo',
    created_at: new Date('2026-02-18').toISOString()
  },
  {
    id: 'doc-seed-4',
    titulo: 'Protocolo de Gestão Documental e Arquivística Paroquial',
    categoria: 'Protocolos',
    numero_referencia: 'Prot. 07/2026',
    data_documento: '2026-03-02',
    arquivo_nome: 'Protocolo_Gestao_Documental_BRM.pdf',
    arquivo_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    arquivo_tamanho_bytes: 1450000,
    mime_type: 'application/pdf',
    descricao: 'Diretrizes canônicas para organização dos livros de tombo, batismos e arquivos patrimoniais.',
    publicado_por: 'Secretaria Provincial',
    status: 'Ativo',
    created_at: new Date('2026-03-02').toISOString()
  },
  {
    id: 'doc-seed-5',
    titulo: 'Subsídio de Oração e Hora Santa Dehoniana - Mês do Sagrado Coração',
    categoria: 'Formação & Subsídios',
    numero_referencia: 'Subs. 02/2026',
    data_documento: '2026-03-10',
    arquivo_nome: 'Subsidio_Hora_Santa_Dehoniana_2026.pdf',
    arquivo_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    arquivo_tamanho_bytes: 1820000,
    mime_type: 'application/pdf',
    descricao: 'Roteiro litúrgico para a Hora Santa semanal nas comunidades formativas e religiosas da BRM.',
    publicado_por: 'Secretaria Provincial',
    status: 'Ativo',
    created_at: new Date('2026-03-10').toISOString()
  }
];

export const DocumentosAdmin: React.FC = () => {
  const [documentos, setDocumentos] = useState<DocumentoProvincial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todas');
  const [selectedStatus, setSelectedStatus] = useState<'Todos' | 'Ativo' | 'Arquivado'>('Ativo');
  
  // Modal de Publicação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  // Form State
  const [formTitulo, setFormTitulo] = useState('');
  const [formCategoria, setFormCategoria] = useState<CategoriaDocumento>('Comunicados');
  const [formReferencia, setFormReferencia] = useState('');
  const [formDataDoc, setFormDataDoc] = useState(new Date().toISOString().split('T')[0]);
  const [formDescricao, setFormDescricao] = useState('');
  const [formArquivo, setFormArquivo] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar Documentos
  const carregarDocumentos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documentos_provinciais')
        .select('*')
        .order('data_documento', { ascending: false });

      if (error || !data) {
        // Fallback local caso tabela esteja pendente de migração
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          setDocumentos(JSON.parse(saved));
        } else {
          setDocumentos(SEED_DOCUMENTOS);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_DOCUMENTOS));
        }
      } else {
        setDocumentos(data as DocumentoProvincial[]);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Erro ao carregar do Supabase, usando armazenamento local resiliente:', e);
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      setDocumentos(saved ? JSON.parse(saved) : SEED_DOCUMENTOS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDocumentos();
  }, []);

  // Salvar no estado local resiliente e atualizar
  const persistirDocumentosLocais = (novosDocs: DocumentoProvincial[]) => {
    setDocumentos(novosDocs);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(novosDocs));
  };

  // Manipulação de Arquivo
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFormArquivo(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormArquivo(e.target.files[0]);
    }
  };

  // Enviar / Publicar Documento
  const handleSubmitDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitulo.trim()) {
      setFormError('Por favor, informe o título do documento.');
      return;
    }
    if (!formArquivo) {
      setFormError('Por favor, selecione um arquivo (PDF, DOCX, etc.) para upload.');
      return;
    }

    setUploading(true);
    try {
      const docId = crypto.randomUUID();
      const sanitizado = formArquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `documentos/${docId}_${sanitizado}`;

      let fileUrl = '';
      let storagePathSalvo = storagePath;

      // 1. Tentar upload no Supabase Storage
      try {
        const { error: uploadError } = await supabase.storage
          .from('documentos-provincia')
          .upload(storagePath, formArquivo, {
            cacheControl: '3600',
            upsert: true
          });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from('documentos-provincia')
            .getPublicUrl(storagePath);
          fileUrl = publicData.publicUrl;
        } else {
          // Tentativa no bucket alternativo religiosos-documentos
          const { error: altError } = await supabase.storage
            .from('religiosos-documentos')
            .upload(storagePath, formArquivo, { upsert: true });

          if (!altError) {
            const { data: publicData } = supabase.storage
              .from('religiosos-documentos')
              .getPublicUrl(storagePath);
            fileUrl = publicData.publicUrl;
          } else {
            // Fallback: criar ObjectURL local / data URL para não impedir o fluxo
            fileUrl = URL.createObjectURL(formArquivo);
          }
        }
      } catch (uploadCatch) {
        console.warn('Fallback para visualização local de arquivo:', uploadCatch);
        fileUrl = URL.createObjectURL(formArquivo);
      }

      const novoDocumento: DocumentoProvincial = {
        id: docId,
        titulo: formTitulo.trim(),
        categoria: formCategoria,
        numero_referencia: formReferencia.trim() || undefined,
        data_documento: formDataDoc,
        arquivo_nome: formArquivo.name,
        arquivo_url: fileUrl,
        arquivo_path: storagePathSalvo,
        arquivo_tamanho_bytes: formArquivo.size,
        mime_type: formArquivo.type || 'application/pdf',
        descricao: formDescricao.trim() || undefined,
        publicado_por: 'Secretaria Provincial',
        status: 'Ativo',
        created_at: new Date().toISOString()
      };

      // 2. Tentar inserir no Supabase
      try {
        const { error: dbError } = await supabase
          .from('documentos_provinciais')
          .insert([novoDocumento]);

        if (dbError) {
          console.warn('Tabela documentos_provinciais pendente no Supabase, salvando localmente:', dbError.message);
        }
      } catch (err) {
        console.warn('Erro ao inserir no Supabase:', err);
      }

      // 3. Atualizar estado local
      const atualizados = [novoDocumento, ...documentos];
      persistirDocumentosLocais(atualizados);

      // Limpar formulário e fechar modal
      setFormTitulo('');
      setFormReferencia('');
      setFormDescricao('');
      setFormArquivo(null);
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao publicar documento.');
    } finally {
      setUploading(false);
    }
  };

  // Alternar Status (Ativo / Arquivado)
  const handleToggleStatus = async (doc: DocumentoProvincial) => {
    const novoStatus = doc.status === 'Ativo' ? 'Arquivado' : 'Ativo';
    try {
      await supabase
        .from('documentos_provinciais')
        .update({ status: novoStatus })
        .eq('id', doc.id);
    } catch (e) {
      console.warn('Atualizando status localmente:', e);
    }
    const atualizados = documentos.map(d => d.id === doc.id ? { ...d, status: novoStatus } : d);
    persistirDocumentosLocais(atualizados);
  };

  // Excluir Documento
  const handleDelete = async (doc: DocumentoProvincial) => {
    if (!window.confirm(`Deseja realmente remover o documento "${doc.titulo}"?`)) return;

    try {
      await supabase.from('documentos_provinciais').delete().eq('id', doc.id);
      if (doc.arquivo_path) {
        await supabase.storage.from('documentos-provincia').remove([doc.arquivo_path]);
      }
    } catch (e) {
      console.warn('Removendo localmente:', e);
    }

    const atualizados = documentos.filter(d => d.id !== doc.id);
    persistirDocumentosLocais(atualizados);
  };

  // Filtros
  const documentosFiltrados = documentos.filter(doc => {
    const matchCategoria = selectedCategoria === 'Todas' || doc.categoria === selectedCategoria;
    const matchStatus = selectedStatus === 'Todos' || doc.status === selectedStatus;
    const q = search.toLowerCase();
    const matchSearch = !search || 
      doc.titulo.toLowerCase().includes(q) ||
      (doc.numero_referencia && doc.numero_referencia.toLowerCase().includes(q)) ||
      (doc.descricao && doc.descricao.toLowerCase().includes(q)) ||
      doc.categoria.toLowerCase().includes(q);
    
    return matchCategoria && matchStatus && matchSearch;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatData = (iso: string) => {
    try {
      const [ano, mes, dia] = iso.split('-');
      return `${dia}/${mes}/${ano}`;
    } catch {
      return iso;
    }
  };

  const getCategoriaCor = (cat: CategoriaDocumento) => {
    switch (cat) {
      case 'Transferências':
        return 'bg-[#F2C894]/25 text-[#113240] dark:text-[#F2C894] border-[#F2C894]/50';
      case 'Diretórios':
        return 'bg-[#226380]/15 text-[#113240] dark:text-[#A3C3C7] border-[#226380]/40';
      case 'Comunicados':
        return 'bg-[#A3C3C7]/25 text-[#113240] dark:text-[#A3C3C7] border-[#A3C3C7]/60';
      case 'Protocolos':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25';
      case 'Decretos':
        return 'bg-[#113240]/10 text-[#113240] dark:text-white border-[#113240]/30';
      case 'Formação & Subsídios':
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25';
      default:
        return 'bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Masthead Secretaria Provincial — Modernismo Corporativo Editorial */}
      <div className="bg-white dark:bg-[#161b22] rounded-[6px] border border-slate-200 dark:border-slate-800 border-t-2 border-t-[#226380] p-6 md:p-8 shadow-[0_1px_3px_rgba(17,50,64,0.03)] transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#226380] font-cinzel block">
              Secretaria Provincial • Província Brasil Meridional
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#113240] dark:text-white font-cinzel">
              Documentos Oficiais
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-sans max-w-2xl leading-relaxed">
              Upload e governança de diretórios, decretos de transferências, comunicados, protocolos e subsídios disponibilizados para consulta e download no Portal do Religioso.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold border border-[#113240] bg-[#113240] text-white hover:bg-[#226380] hover:border-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publicar Documento</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título, protocolo ou termo..."
                className="w-full pl-9 pr-8 py-2 rounded-[6px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 font-mono"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 p-1 rounded-[6px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs self-start md:self-auto font-mono">
              {(['Ativo', 'Arquivado', 'Todos'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1 rounded-[4px] text-[11px] uppercase tracking-wider font-medium transition-all cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-[#113240] text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#113240] dark:hover:text-white'
                  }`}
                >
                  {st === 'Ativo' ? 'Ativos no Portal' : st === 'Arquivado' ? 'Arquivados' : 'Todos'}
                </button>
              ))}
            </div>
          </div>

          {/* Categorias Pills — Rectangular Ledger Selectors */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs font-mono">
            <button
              type="button"
              onClick={() => setSelectedCategoria('Todas')}
              className={`px-3 py-1 rounded-[6px] transition-all shrink-0 text-[11px] uppercase tracking-wider border cursor-pointer ${
                selectedCategoria === 'Todas'
                  ? 'border-[#113240] bg-[#113240] text-white font-semibold shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-[#226380]'
              }`}
            >
              Todas as Categorias ({documentos.length})
            </button>
            {CATEGORIAS_OFICIAIS.map((cat) => {
              const count = documentos.filter(d => d.categoria === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoria(cat)}
                  className={`px-3 py-1 rounded-[6px] transition-all shrink-0 text-[11px] uppercase tracking-wider border cursor-pointer ${
                    selectedCategoria === cat
                      ? 'border-[#226380] bg-[#226380] text-white font-semibold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-[#226380]'
                  }`}
                >
                  {cat} {count > 0 && <span className="opacity-80 text-[10px] ml-1">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lista de Documentos — Continuous Architectural Ledger */}
      <div className="bg-white dark:bg-[#161b22] rounded-[6px] border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-[0_1px_3px_rgba(17,50,64,0.03)]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 font-semibold">
            Documentos Cadastrados ({documentosFiltrados.length})
          </span>
          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
            ORDENADO PELOS MAIS RECENTES
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#113240]/20 border-t-[#113240] dark:border-white/20 dark:border-t-white animate-spin mx-auto mb-3" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Carregando acervo de documentos...</span>
          </div>
        ) : documentosFiltrados.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-[6px] bg-slate-50/50 dark:bg-white/[0.02]">
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#113240] dark:text-white font-cinzel">
              Nenhum documento encontrado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Nenhum arquivo corresponde aos filtros aplicados. Clique no botão acima para publicar o primeiro documento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {documentosFiltrados.map((doc, idx) => (
              <div
                key={doc.id}
                style={staggerStyle(idx)}
                className="py-4 px-3 hover:bg-[#F2F2F2]/60 dark:hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[6px] motion-stagger-item"
              >
                <div className="flex items-start gap-4">
                  {/* Ícone de Arquivo Lapidado Sóbrio */}
                  <div className="w-10 h-10 rounded-[6px] bg-[#113240]/5 dark:bg-[#226380]/20 text-[#113240] dark:text-[#A3C3C7] flex items-center justify-center shrink-0 border border-[#A3C3C7]/40 dark:border-white/10">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-mono uppercase font-semibold border ${getCategoriaCor(doc.categoria)}`}>
                        {doc.categoria}
                      </span>
                      {doc.numero_referencia && (
                        <span className="font-mono text-[9px] px-2 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {doc.numero_referencia}
                        </span>
                      )}
                      {doc.status === 'Arquivado' && (
                        <span className="px-2 py-0.5 rounded-[4px] text-[9px] font-mono uppercase font-medium bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Arquivado
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-[#113240] dark:text-white leading-snug">
                      {doc.titulo}
                    </h4>

                    {doc.descricao && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 max-w-2xl leading-relaxed">
                        {doc.descricao}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 pt-0.5 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#226380]" />
                        {formatData(doc.data_documento)}
                      </span>
                      <span>•</span>
                      <span className="truncate max-w-xs">{doc.arquivo_nome}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.arquivo_tamanho_bytes)}</span>
                      <span>•</span>
                      <span className="text-[#226380] font-medium">Portal do Religioso</span>
                    </div>
                  </div>
                </div>

                {/* Ações Lapidadas */}
                <div className="flex items-center gap-1.5 self-start md:self-center shrink-0">
                  <a
                    href={doc.arquivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#226380] hover:bg-[#226380]/10 hover:border-[#226380] transition-colors"
                    title="Baixar ou abrir documento"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(doc)}
                    className="p-2 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-[#113240] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={doc.status === 'Ativo' ? "Arquivar documento" : "Reativar no Portal"}
                  >
                    {doc.status === 'Ativo' ? <Archive className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(doc)}
                    className="p-2 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Excluir documento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Secretaria Provincial de Upload & Publicação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm motion-backdrop">
          <div className="bg-white dark:bg-[#161b22] rounded-[8px] border border-slate-300 dark:border-slate-700 shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col border-t-2 border-t-[#226380] motion-modal">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.16em] text-[#226380] block">
                  Secretaria Provincial
                </span>
                <h3 className="text-base font-bold text-[#113240] dark:text-white font-cinzel">
                  Publicar Documento Oficial
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-[6px] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer motion-press"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitDocumento} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="p-3 rounded-[6px] bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Upload Drag & Drop Box */}
              <div>
                <label className="block text-xs font-semibold text-[#113240] dark:text-slate-200 mb-1.5 font-mono uppercase tracking-wider text-[11px]">
                  Arquivo do Documento (PDF, DOCX, etc.) *
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[6px] p-6 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-[#226380] bg-[#226380]/5'
                      : formArquivo
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-slate-300 dark:border-slate-700 hover:border-[#226380] dark:hover:border-white bg-slate-50/50 dark:bg-slate-900/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {formArquivo ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                      <div className="text-left font-mono">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate max-w-xs">
                          {formArquivo.name}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {formatFileSize(formArquivo.size)} • Clique para substituir
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-6 h-6 text-[#226380] dark:text-slate-300 mx-auto mb-2" />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
                        Arraste o arquivo aqui ou <span className="text-[#226380] underline font-semibold">escolha no computador</span>
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block font-mono">
                        Formatos aceitos: PDF, DOCX, XLSX (até 50MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Título do Documento */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-[#113240] dark:text-slate-200 mb-1">
                  Título do Documento *
                </label>
                <input
                  type="text"
                  required
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ex: Nomeações e Transferências Canônicas 2026"
                  className="w-full px-3 py-2 rounded-[6px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none text-slate-900 dark:text-white text-xs font-sans"
                />
              </div>

              {/* Grid: Categoria & Número de Referência */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-[#113240] dark:text-slate-200 mb-1">
                    Categoria Oficial *
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value as CategoriaDocumento)}
                    className="w-full px-3 py-2 rounded-[6px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none text-slate-900 dark:text-white text-xs font-sans"
                  >
                    {CATEGORIAS_OFICIAIS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-[#113240] dark:text-slate-200 mb-1">
                    Nº de Referência / Protocolo
                  </label>
                  <input
                    type="text"
                    value={formReferencia}
                    onChange={(e) => setFormReferencia(e.target.value)}
                    placeholder="Ex: Prot. 04/2026, Dec. 01/2026"
                    className="w-full px-3 py-2 rounded-[6px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Data do Documento */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-[#113240] dark:text-slate-200 mb-1">
                  Data do Documento
                </label>
                <input
                  type="date"
                  value={formDataDoc}
                  onChange={(e) => setFormDataDoc(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              {/* Breve Descrição */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-[#113240] dark:text-slate-200 mb-1">
                  Resumo / Observações (opcional)
                </label>
                <textarea
                  rows={3}
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Instruções breves sobre o conteúdo do documento para os confrades..."
                  className="w-full px-3 py-2 rounded-[6px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] outline-none text-slate-900 dark:text-white text-xs resize-none font-sans"
                />
              </div>

              {/* Footer do Modal */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer motion-press"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono uppercase tracking-wider font-semibold border border-[#113240] bg-[#113240] text-white hover:bg-[#226380] hover:border-[#226380] transition-all disabled:opacity-50 cursor-pointer rounded-[6px] shadow-sm motion-press"
                >
                  {uploading ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Publicar no Portal</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentosAdmin;
