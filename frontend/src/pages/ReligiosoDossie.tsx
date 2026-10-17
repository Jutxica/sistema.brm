import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Archive, CheckCircle2, Download, FileText, FolderClosed, FolderOpen, Loader2, Printer, ShieldCheck, Upload, UserRound } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../hooks/useFeedback';
import { useAuth } from '../contexts/AuthContext';

import type { 
  ReligiosoDossieData, 
  ContaAcesso, 
  EventoFicha, 
  DocumentoFicha 
} from '../types/religioso';

const reviewOptions = ['Em revisão', 'Em verificação', 'Aguardando complementação', 'Aprovado', 'Recusado', 'Arquivado'];
const archiveCategories = ['Transferência', 'Advertência', 'Carta', 'Identidade', 'Saúde', 'Canônico', 'Outro'];
const allowedArchiveMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const archiveBucket = 'arquivo-religiosos-confidencial';
const maxArchiveFileSize = 50 * 1024 * 1024;

const statusClass: Record<string, string> = {
  'Em revisão': 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-mono text-[9px] uppercase font-semibold',
  'Em verificação': 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-200 dark:border-amber-700 font-mono text-[9px] uppercase font-semibold',
  'Aguardando complementação': 'bg-orange-100 text-orange-900 dark:bg-orange-950/40 dark:text-orange-200 border border-orange-200 dark:border-orange-700 font-mono text-[9px] uppercase font-semibold',
  Aprovado: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border border-slate-900 dark:border-white font-mono text-[9px] uppercase font-semibold',
  Recusado: 'bg-rose-100 text-rose-900 dark:bg-rose-950/30 dark:text-rose-200 border border-rose-200 dark:border-rose-700 font-mono text-[9px] uppercase font-semibold',
  Arquivado: 'bg-transparent text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 font-mono text-[9px] uppercase',
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const formatBytes = (bytes?: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatRegistrationNumber = (number: number, createdAt: string | null) =>
  `BRM-${createdAt ? new Date(createdAt).getFullYear() : '—'}-${String(number).padStart(6, '0')}`;

const formatCpfMask = (value?: string | null) => {
  if (!value) return '—';
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) return value;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const ReligiosoDossie: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [religioso, setReligioso] = useState<ReligiosoDossieData | null>(null);
  const [conta, setConta] = useState<ContaAcesso | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoFicha[]>([]);
  const [historico, setHistorico] = useState<EventoFicha[]>([]);
  const [allAccounts, setAllAccounts] = useState<ContaAcesso[]>([]);
  const [canonicalData, setCanonicalData] = useState<{
    familiares: any[];
    votos: any[];
    ordens: any[];
    sacramentos: any[];
    formacao: any[];
    designacoes: any[];
    residencia: any | null;
  }>({
    familiares: [],
    votos: [],
    ordens: [],
    sacramentos: [],
    formacao: [],
    designacoes: [],
    residencia: null,
  });
  const [loading, setLoading] = useState(true);
  const [archiveCategory, setArchiveCategory] = useState(archiveCategories[0]);
  const [archiveTitle, setArchiveTitle] = useState('');
  const [archiveNote, setArchiveNote] = useState('');
  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [archiveSaving, setArchiveSaving] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(new Set());

  const load = async () => {
    if (!id) return;
    setLoading(true);

    const [
      { data: religiosoData, error: religiosoError },
      { data: documentosAntigos, error: documentosAntigosError },
      { data: documentosArquivo, error: documentosArquivoError },
      { data: historicoData, error: historicoError },
      { data: contasResult, error: contasError },
      { data: familiaresData },
      { data: votosData },
      { data: ordensData },
      { data: sacramentosData },
      { data: formacaoData },
      { data: designacoesData },
      { data: residenciaData },
    ] = await Promise.all([
      supabase.from('religiosos').select('*').eq('id', id).maybeSingle(),
      supabase.from('religiosos_documentos').select('id,categoria,nome_arquivo,caminho_storage,mime_type,tamanho_bytes,data_cadastro,quem_cadastrou').eq('religioso_id', id).eq('status', 'Ativo').order('data_cadastro', { ascending: false }),
      supabase.from('secretaria_dossie_documentos').select('id,categoria,titulo,nome_arquivo,caminho_storage,mime_type,tamanho_bytes,enviado_por_nome,criado_em').eq('religioso_id', id).order('criado_em', { ascending: false }),
      supabase.from('secretaria_ficha_eventos').select('*').eq('religioso_id', id).order('criado_em', { ascending: false }),
      supabase.functions.invoke<{ accounts: ContaAcesso[] }>('secretaria-contas', { body: { action: 'list' } }),
      supabase.from('religiosos_familiares').select('*').eq('religioso_id', id),
      supabase.from('religiosos_profissoes_votos').select('*').eq('religioso_id', id).order('data', { ascending: true }),
      supabase.from('religiosos_ministerios_ordens').select('*').eq('religioso_id', id).order('data', { ascending: true }),
      supabase.from('religiosos_sacramentos').select('*').eq('religioso_id', id).order('data', { ascending: true }),
      supabase.from('religiosos_formacao_religiosa').select('*').eq('religioso_id', id).order('data_ingresso', { ascending: true }),
      supabase.from('religiosos_designacoes').select('*, comunidades(nome), religiosos_obras_referencia(nome)').eq('religioso_id', id),
      supabase.from('religiosos_enderecos_contatos').select('*').eq('religioso_id', id).limit(1).maybeSingle(),
    ]);

    if (religiosoError) {
      showToast.error(`Não foi possível carregar o religioso: ${religiosoError.message}`);
      setLoading(false);
      return;
    }

    if (documentosAntigosError) {
      showToast.error(`Não foi possível carregar os documentos enviados na ficha: ${documentosAntigosError.message}`);
    }

    if (documentosArquivoError) {
      showToast.error(`Não foi possível carregar os documentos do arquivo provincial: ${documentosArquivoError.message}`);
    }

    if (historicoError) {
      showToast.error(`Não foi possível carregar o histórico: ${historicoError.message}`);
    }

    if (contasError) {
      showToast.error(`Não foi possível carregar as contas: ${contasError.message}`);
    }

    if (!religiosoData) {
      showToast.error('Religioso não encontrado.');
      setLoading(false);
      return;
    }

    const legacyDocuments = (documentosAntigos || []).map(documento => ({
      ...documento,
      storage_bucket: 'religiosos-documentos' as const,
    })) as DocumentoFicha[];
    const archiveDocuments = (documentosArquivo || []).map(documento => ({
      ...documento,
      data_cadastro: documento.criado_em,
      quem_cadastrou: documento.enviado_por_nome,
      storage_bucket: 'arquivo-religiosos-confidencial' as const,
    })) as DocumentoFicha[];

    setReligioso(religiosoData as ReligiosoDossieData);
    setDocumentos([...legacyDocuments, ...archiveDocuments]);
    setSelectedDocumentIds(new Set([...legacyDocuments, ...archiveDocuments].map(documento => documento.id)));
    setHistorico((historicoData || []) as EventoFicha[]);
    setCanonicalData({
      familiares: familiaresData || [],
      votos: votosData || [],
      ordens: ordensData || [],
      sacramentos: sacramentosData || [],
      formacao: formacaoData || [],
      designacoes: designacoesData || [],
      residencia: residenciaData || null,
    });
    const contas = contasResult?.accounts || [];
    setAllAccounts(contas);
    setConta(contas.find(item => item.id === religiosoData.auth_user_id) || null);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [id]);

  const updateStatus = async (nextStatus: string) => {
    if (!religioso) return;
    const { error } = await supabase.rpc('secretaria_revisar_ficha', {
      p_religioso_id: religioso.id,
      p_status: nextStatus,
      p_observacao: `Atualização administrativa do dossiê para ${nextStatus}.`,
    });

    if (error) {
      showToast.error(`Não foi possível atualizar o status: ${error.message}`);
      return;
    }

    showToast.success(`Status atualizado para ${nextStatus}.`);
    await load();
  };

  const handleDownload = async (documento: DocumentoFicha) => {
    const { data, error } = await supabase.storage.from(documento.storage_bucket).download(documento.caminho_storage);
    if (error) {
      showToast.error(`Não foi possível baixar o documento: ${error.message}`);
      return;
    }

    const url = window.URL.createObjectURL(data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = documento.nome_arquivo;
    anchor.click();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  };

  const handleArchiveFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setArchiveFile(null);
      return;
    }
    if (!allowedArchiveMimeTypes.includes(file.type)) {
      showToast.error('Formato não permitido. Envie PDF, JPEG, PNG, TIFF, DOC ou DOCX.');
      event.target.value = '';
      setArchiveFile(null);
      return;
    }
    if (file.size > maxArchiveFileSize) {
      showToast.error('O arquivo deve ter no máximo 50 MB.');
      event.target.value = '';
      setArchiveFile(null);
      return;
    }
    setArchiveFile(file);
    if (!archiveTitle.trim()) setArchiveTitle(file.name.replace(/\.[^.]+$/, '').slice(0, 200));
  };

  const uploadArchiveDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || !user?.id || !archiveFile || !archiveTitle.trim()) {
      showToast.warning('Informe o título e selecione um documento antes de enviar.');
      return;
    }

    setArchiveSaving(true);
    const extension = archiveFile.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
    const storagePath = `${id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(archiveBucket)
      .upload(storagePath, archiveFile, { contentType: archiveFile.type, upsert: false });

    if (uploadError) {
      showToast.error(`Não foi possível enviar o arquivo: ${uploadError.message}`);
      setArchiveSaving(false);
      return;
    }

    const { error: metadataError } = await supabase.from('secretaria_dossie_documentos').insert({
      religioso_id: id,
      categoria: archiveCategory,
      titulo: archiveTitle.trim(),
      nome_arquivo: archiveFile.name,
      caminho_storage: storagePath,
      mime_type: archiveFile.type,
      tamanho_bytes: archiveFile.size,
      observacao: archiveNote.trim() || null,
      enviado_por: user.id,
      enviado_por_nome: user.nome,
    });

    if (metadataError) {
      const { error: cleanupError } = await supabase.storage.from(archiveBucket).remove([storagePath]);
      const cleanupMessage = cleanupError ? ` O arquivo enviado também não pôde ser removido: ${cleanupError.message}` : '';
      showToast.error(`Não foi possível registrar o documento no dossiê: ${metadataError.message}.${cleanupMessage}`);
      setArchiveSaving(false);
      return;
    }

    showToast.success('Documento arquivado no dossiê provincial.');
    setArchiveTitle('');
    setArchiveNote('');
    setArchiveFile(null);
    setArchiveSaving(false);
    await load();
  };

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocumentIds(current => {
      const next = new Set(current);
      if (next.has(documentId)) next.delete(documentId);
      else next.add(documentId);
      return next;
    });
  };

  const documentoSummary = useMemo(() => {
    const grouped: Record<string, number> = {};
    documentos.forEach(documento => {
      const key = documento.categoria || 'Outro';
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return grouped;
  }, [documentos]);

  const documentFolders = useMemo(() => {
    const grouped: Record<string, DocumentoFicha[]> = {};
    documentos.forEach(documento => {
      const category = documento.categoria || 'Outro';
      grouped[category] = [...(grouped[category] || []), documento];
    });
    return Object.entries(grouped).sort(([left], [right]) => left.localeCompare(right, 'pt-BR'));
  }, [documentos]);

  const totalContas = allAccounts.length;
  const selectedDocuments = documentos.filter(documento => selectedDocumentIds.has(documento.id));

  const paisTexto = [
    religioso?.familiares_pai || canonicalData.familiares.find(f => f.tipo === 'Pai')?.nome,
    religioso?.familiares_mae || canonicalData.familiares.find(f => f.tipo === 'Mãe')?.nome
  ].filter(Boolean).join(' e ') || '—';

  const naturalidadeTexto = [religioso?.municipio_nascimento, religioso?.estado_nascimento].filter(Boolean).join('/') || '—';

  const batismo = canonicalData.sacramentos.find(s => (s.tipo || '').toLowerCase().includes('batis'));
  const primVotos = canonicalData.votos.find(v => (v.tipo || '').toLowerCase().includes('primeir') || (v.tipo || '').toLowerCase().includes('tempor'));
  const perpVotos = canonicalData.votos.find(v => (v.tipo || '').toLowerCase().includes('perp'));
  const ordenacao = canonicalData.ordens.find(o => (o.tipo || '').toLowerCase().includes('presb') || (o.tipo || '').toLowerCase().includes('sacerd')) || canonicalData.ordens[0];

  const anoIngresso = canonicalData.formacao[0]?.data_ingresso
    ? new Date(canonicalData.formacao[0].data_ingresso).getFullYear()
    : (religioso?.created_at ? new Date(religioso.created_at).getFullYear() : '2026');

  const docCategories = [
    { label: 'RG e CPF', match: ['rg', 'cpf', 'identidade', 'cnh'] },
    { label: 'Certidão de nascimento', match: ['nascimento', 'certidão de nascimento'] },
    { label: 'Certidão de batismo', match: ['batismo'] },
    { label: 'Certidão de crisma', match: ['crisma'] },
    { label: 'Termo de admissão', match: ['admissão', 'postulantado', 'noviciado'] },
    { label: 'Profissão religiosa temporária', match: ['voto temporário', 'primeira profissão', 'renovação'] },
    { label: 'Profissão perpétua', match: ['voto perpétuo', 'perpétua', 'perpétuo'] },
    { label: 'Ordenação diaconal / presbiteral', match: ['ordem', 'diaconato', 'presbiterato', 'ordenação'] },
    { label: 'Decretos e nomeações', match: ['decreto', 'nomeação', 'transferência', 'carta'] },
    { label: 'Termo de consentimento (LGPD)', match: ['lgpd', 'consentimento', 'termo'] },
  ];

  const hasDoc = (matchArr: string[]) => {
    return documentos.some(d => {
      const target = `${d.categoria || ''} ${d.nome_arquivo || ''} ${d.titulo || ''}`.toLowerCase();
      return matchArr.some(m => target.includes(m));
    });
  };

  const docsCount = docCategories.filter(c => hasDoc(c.match)).length;

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
          }
          .dossie-no-print { display: none !important; }
          .dossie-print-only { display: block !important; }
          .dossie-sheet { box-shadow: none !important; border: none !important; padding: 0 !important; }
          body { background: #fff !important; color: #111 !important; font-size: 10pt; }
        }
        .dossie-print-only { display: none; }
      `}</style>

      {/* DOCUMENTO IMPRESSO INSTITUCIONAL OFICIAL (A4 - PADRÃO PROVÍNCIA BRM) */}
      <div className="dossie-print-only text-slate-900 font-sans leading-tight">
        {/* Cabeçalho Oficial */}
        <header className="border-b border-slate-300 pb-3 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo-timbrado-brm.png" alt="Província BRM" className="h-14 w-auto object-contain" />
              <div>
                <p className="font-mono text-[8pt] uppercase tracking-[0.15em] text-slate-500 font-semibold">
                  Congregação dos Sacerdotes do Sagrado Coração de Jesus
                </p>
                <h1 className="text-[14pt] font-serif font-bold text-slate-900 tracking-tight mt-0.5">
                  Província Brasil Meridional
                </h1>
                <p className="text-[8.5pt] font-mono text-slate-600">Arquivo Provincial</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-[7pt] uppercase tracking-wider text-slate-400">Cadastro</p>
              <p className="font-mono text-[10pt] font-bold text-slate-800">
                {formatRegistrationNumber(religioso?.numero_cadastro || 0, religioso?.created_at || null)}
              </p>
            </div>
          </div>
        </header>

        {/* Identificação do Religioso */}
        <div className="flex items-end justify-between border-b border-slate-200 pb-3 mb-3">
          <div>
            <p className="font-mono text-[7.5pt] uppercase tracking-[0.16em] text-slate-500 font-semibold">
              Dossiê do Religioso
            </p>
            <h2 className="text-[17pt] font-serif font-bold text-slate-900 mt-0.5">
              {religioso?.nome_religioso || religioso?.nome_civil}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 border border-slate-900 px-2.5 py-0.5 text-[8pt] font-mono font-semibold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            <span>Cadastro {religioso?.status_cadastro || 'Aprovado'}</span>
          </div>
        </div>

        {/* Faixa de Indicadores Rápidos */}
        <div className="grid grid-cols-4 border border-slate-200 bg-slate-50/60 text-center mb-4">
          <div className="p-2 border-r border-slate-200">
            <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Grau</p>
            <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5">{religioso?.grau || 'Pendente'}</p>
          </div>
          <div className="p-2 border-r border-slate-200">
            <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Ingresso</p>
            <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5">{anoIngresso}</p>
          </div>
          <div className="p-2 border-r border-slate-200">
            <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Última Revisão</p>
            <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5">{historico[0] ? formatDate(historico[0].criado_em) : '—'}</p>
          </div>
          <div className="p-2">
            <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Documentos Anexados</p>
            <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5">{docsCount} de 10</p>
          </div>
        </div>

        {/* Bloco 1: Ficha Geral */}
        <div className="mb-4">
          <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
            Ficha Geral
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[8.5pt]">
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Nome Civil</p>
              <p className="font-medium text-slate-900">{religioso?.nome_civil || '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Nome Religioso</p>
              <p className="font-medium text-slate-900">{religioso?.nome_religioso || '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Data de Nascimento</p>
              <p className="font-medium text-slate-900">{formatDate(religioso?.data_nascimento)}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">CPF</p>
              <p className="font-mono font-medium text-slate-900">{formatCpfMask(religioso?.cpf)}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Naturalidade</p>
              <p className="font-medium text-slate-900">{naturalidadeTexto}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Nacionalidade</p>
              <p className="font-medium text-slate-900">{religioso?.nacionalidade || 'Brasileira'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">E-mail Institucional</p>
              <p className="font-medium text-slate-900">{religioso?.email_institucional || '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Celular / WhatsApp</p>
              <p className="font-medium text-slate-900">{religioso?.telefone_celular || '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Filiação</p>
              <p className="font-medium text-slate-900">{paisTexto}</p>
            </div>
          </div>
        </div>

        {/* Bloco 2: Vínculo Provincial */}
        <div className="mb-4">
          <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
            Vínculo Provincial
          </p>
          <div className="grid grid-cols-3 gap-x-4 text-[8.5pt]">
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Comunidade Atual</p>
              <p className="font-medium text-slate-900">{religioso?.comunidade_atual_nome || '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Ofício / Função</p>
              <p className="font-medium text-slate-900">{canonicalData.designacoes[0]?.funcao || '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Superior Imediato</p>
              <p className="font-medium text-slate-900">—</p>
            </div>
          </div>
        </div>

        {/* Bloco 3: Trajetória Canônica (Linha do Tempo Visual) */}
        <div className="mb-4">
          <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
            Trajetória Canônica
          </p>
          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <div className="border border-slate-200 p-2">
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-slate-800 mb-1" />
              <p className="text-[6.5pt] font-mono uppercase font-bold text-slate-600">Batismo</p>
              <p className="text-[8pt] font-medium text-slate-900 mt-0.5">{batismo?.data ? formatDate(batismo.data) : '—'}</p>
              {batismo?.paroquia && <p className="text-[6.5pt] text-slate-500 truncate">{batismo.paroquia}</p>}
            </div>
            <div className="border border-slate-200 p-2">
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-slate-800 mb-1" />
              <p className="text-[6.5pt] font-mono uppercase font-bold text-slate-600">Primeira Profissão</p>
              <p className="text-[8pt] font-medium text-slate-900 mt-0.5">{primVotos?.data ? formatDate(primVotos.data) : '—'}</p>
              {primVotos?.local && <p className="text-[6.5pt] text-slate-500 truncate">{primVotos.local}</p>}
            </div>
            <div className="border border-slate-200 p-2">
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-slate-800 mb-1" />
              <p className="text-[6.5pt] font-mono uppercase font-bold text-slate-600">Profissão Perpétua</p>
              <p className="text-[8pt] font-medium text-slate-900 mt-0.5">{perpVotos?.data ? formatDate(perpVotos.data) : '—'}</p>
              {perpVotos?.local && <p className="text-[6.5pt] text-slate-500 truncate">{perpVotos.local}</p>}
            </div>
            <div className="border border-slate-200 p-2">
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-slate-800 mb-1" />
              <p className="text-[6.5pt] font-mono uppercase font-bold text-slate-600">Ordenação</p>
              <p className="text-[8pt] font-medium text-slate-900 mt-0.5">{ordenacao?.data ? formatDate(ordenacao.data) : '—'}</p>
              {ordenacao?.tipo && <p className="text-[6.5pt] text-slate-500 truncate">{ordenacao.tipo}</p>}
            </div>
          </div>
        </div>

        {/* Bloco 4: Documentos do Arquivo (Checklist Canônico Oficial) */}
        <div className="mb-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
            <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700">
              Documentos do Arquivo
            </p>
            <span className="text-[6.5pt] font-mono text-slate-400">✓ = anexado no sistema</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[8pt]">
            {docCategories.map((doc, idx) => {
              const checked = hasDoc(doc.match);
              return (
                <div key={idx} className="flex items-center gap-2 py-0.5">
                  <span className={`w-3 h-3 flex items-center justify-center border text-[8pt] font-bold ${
                    checked ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-400 text-transparent'
                  }`}>
                    {checked ? '✓' : ''}
                  </span>
                  <span className={checked ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                    {doc.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bloco 5: Histórico de Revisão */}
        <div className="mb-6">
          <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-1.5">
            Histórico de Revisão
          </p>
          <table className="w-full text-left text-[7.5pt] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono text-[6.5pt] uppercase">
                <th className="py-1">Data</th>
                <th className="py-1">Situação</th>
                <th className="py-1">Responsável</th>
                <th className="py-1">Registro</th>
              </tr>
            </thead>
            <tbody>
              {historico.slice(0, 3).map(evento => (
                <tr key={evento.id} className="border-b border-slate-100">
                  <td className="py-1 font-mono">{formatDate(evento.criado_em)}</td>
                  <td className="py-1 font-semibold text-slate-900">{evento.status_novo}</td>
                  <td className="py-1 text-slate-600">{evento.ator_nome}</td>
                  <td className="py-1 text-slate-600">{evento.observacao || 'Atualização administrativa do dossiê.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Assinaturas Institucionais */}
        <div className="mt-8 pt-4 grid grid-cols-2 gap-12 text-center text-[7.5pt]">
          <div>
            <div className="border-t border-slate-800 mx-auto w-48 mb-1" />
            <p className="font-semibold text-slate-800">Secretaria Provincial</p>
            <p className="text-[6.5pt] text-slate-400">Assinatura e carimbo</p>
          </div>
          <div>
            <div className="border-t border-slate-800 mx-auto w-48 mb-1" />
            <p className="font-semibold text-slate-800">Chancelaria · Arquivo Provincial</p>
            <p className="text-[6.5pt] text-slate-400">Assinatura e carimbo</p>
          </div>
        </div>

        {/* Rodapé de autenticação */}
        <footer className="mt-6 pt-3 border-t border-slate-200 flex justify-between text-[6.5pt] font-mono text-slate-400">
          <span>Emitido eletronicamente em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · sistema.brm.org.br</span>
          <span>Documento reservado · Dados pessoais protegidos pela LGPD</span>
        </footer>
      </div>

      <div className="space-y-5 pb-8">
        <div className="dossie-no-print flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/religiosos')}
            className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 dark:border-white dark:bg-white dark:text-slate-900"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir ficha e checklist
          </button>
        </div>

        {loading || !religioso ? (
          <div className="flex min-h-[40vh] items-center justify-center border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#161b22]">
            <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
          </div>
        ) : (
          <div className="dossie-sheet space-y-5 rounded-none border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
            <div className="dossie-print-only border-b border-slate-300 pb-4 text-center">
              <img src="/logo-impresso.png" alt="Província BRM" className="mx-auto mb-2 h-12 w-auto object-contain" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Província Brasil Meridional</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em]">Arquivo Provincial • Dossiê do religioso</p>
            </div>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 items-center justify-center border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-white/5 dark:text-slate-200">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Arquivo Provincial</p>
                  <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{religioso.nome_religioso || religioso.nome_civil}</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{religioso.nome_civil} • {religioso.grau || 'Grau pendente'}</p>
                  <p className="mt-2 inline-flex border border-[#226380]/20 bg-[#226380]/5 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-[#226380] dark:border-[#A3C3C7]/20 dark:bg-[#A3C3C7]/10 dark:text-[#A3C3C7]">
                    Cadastro {formatRegistrationNumber(religioso.numero_cadastro, religioso.created_at)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className={`inline-flex px-2.5 py-1 text-[10px] font-medium ${statusClass[religioso.status_cadastro] || statusClass.Arquivado}`}>
                  {religioso.status_cadastro}
                </span>
                <select
                  value={religioso.status_cadastro}
                  onChange={(event) => void updateStatus(event.target.value)}
                  className="w-full border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-medium text-slate-700 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {reviewOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-white/[0.02]">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Contas criadas</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{totalContas}</p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-white/[0.02]">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Documentos</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{documentos.length}</p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-white/[0.02]">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Última revisão</p>
                <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{historico[0] ? formatDate(historico[0].criado_em) : '—'}</p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-white/[0.02]">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Origem</p>
                <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{religioso.origem_cadastro || '—'}</p>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
              <div className="space-y-5">
                <section className="border border-slate-200 p-4 dark:border-slate-800">
                  <div className="mb-3 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#113240] dark:text-[#b58a55]" />
                    <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-200">Ficha geral</h2>
                  </div>

                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div><dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Nome civil</dt><dd className="mt-1 text-sm text-slate-900 dark:text-white">{religioso.nome_civil || '—'}</dd></div>
                    <div><dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Nome religioso</dt><dd className="mt-1 text-sm text-slate-900 dark:text-white">{religioso.nome_religioso || '—'}</dd></div>
                    <div><dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Data de nascimento</dt><dd className="mt-1 text-sm text-slate-900 dark:text-white">{formatDate(religioso.data_nascimento)}</dd></div>
                    <div><dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">CPF</dt><dd className="mt-1 text-sm text-slate-900 dark:text-white">{religioso.cpf || '—'}</dd></div>
                    <div><dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">E-mail institucional</dt><dd className="mt-1 text-sm text-slate-900 dark:text-white">{religioso.email_institucional || '—'}</dd></div>
                    <div><dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Celular</dt><dd className="mt-1 text-sm text-slate-900 dark:text-white">{religioso.telefone_celular || '—'}</dd></div>
                  </dl>
                </section>

                <section className="border border-slate-200 p-4 dark:border-slate-800">
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#113240] dark:text-[#b58a55]" />
                    <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-200">Conta de acesso</h2>
                  </div>

                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div><dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">E-mail</dt><dd className="mt-1 text-sm text-slate-900 dark:text-white">{conta?.email || 'Sem conta vinculada'}</dd></div>
                    <div><dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Estado</dt><dd className="mt-1 text-sm text-slate-900 dark:text-white">{conta ? (conta.banned_until && new Date(conta.banned_until).getTime() > Date.now() ? 'Bloqueada' : 'Ativa') : '—'}</dd></div>
                    <div><dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Origem</dt><dd className="mt-1 text-sm text-slate-900 dark:text-white">{conta?.ledger?.origin || '—'}</dd></div>
                    <div><dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Criado por</dt><dd className="mt-1 text-sm text-slate-900 dark:text-white">{conta?.ledger?.created_by_name || 'Não identificado'}</dd></div>
                  </dl>
                </section>
              </div>

              <div className="space-y-5">
                <section className="border border-slate-200 p-4 dark:border-slate-800">
                  <div className="mb-3 flex items-center gap-2">
                    <Archive className="h-4 w-4 text-[#113240] dark:text-[#b58a55]" />
                    <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-200">Arquivo provincial</h2>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(documentoSummary).length ? Object.entries(documentoSummary).map(([categoria, quantidade]) => (
                      <div key={categoria} className="border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-white/[0.02]">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{categoria}</p>
                        <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{quantidade}</p>
                      </div>
                    )) : (
                      <div className="sm:col-span-2 border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        Nenhum documento classificado na pasta provincial.
                      </div>
                    )}
                  </div>
                </section>

                <section className="border border-slate-200 p-4 dark:border-slate-800">
                  <div className="mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#113240] dark:text-[#b58a55]" />
                    <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-200">Histórico de revisão</h2>
                  </div>

                  <div className="space-y-3">
                    {historico.length ? historico.map(evento => (
                      <div key={evento.id} className="border border-slate-200 p-3 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-3">
                          <span className={`inline-flex px-2 py-0.5 text-[9px] font-medium ${statusClass[evento.status_novo] || statusClass.Arquivado}`}>
                            {evento.status_novo}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{formatDate(evento.criado_em)}</span>
                        </div>
                        <p className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-200">{evento.ator_nome}</p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{evento.observacao || 'Sem observação registrada.'}</p>
                      </div>
                    )) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">Ainda não há histórico de revisão para este religioso.</p>
                    )}
                  </div>
                </section>
              </div>
            </div>

            <section className="border border-slate-200 p-4 dark:border-slate-800">
              <div className="dossie-no-print mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-[#113240] dark:text-[#b58a55]" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-200">Documentos e pastas do arquivo</h2>
                </div>
                <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{documentos.length} arquivo(s)</span>
              </div>

              <form onSubmit={(event) => void uploadArchiveDocument(event)} className="dossie-no-print mb-5 grid gap-3 border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-white/[0.02] md:grid-cols-2">
                <div className="flex items-center gap-2 md:col-span-2">
                  <FolderOpen className="h-4 w-4 text-[#113240] dark:text-[#b58a55]" />
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-200">Adicionar à pasta provincial</h3>
                </div>
                <label className="space-y-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Categoria / pasta
                  <select value={archiveCategory} onChange={event => setArchiveCategory(event.target.value)} className="w-full border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                    {archiveCategories.map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Título do documento
                  <input required maxLength={200} value={archiveTitle} onChange={event => setArchiveTitle(event.target.value)} className="w-full border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </label>
                <label className="space-y-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Arquivo (PDF, imagem, DOC ou DOCX; até 50 MB)
                  <input required type="file" accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff,.doc,.docx" onChange={handleArchiveFile} className="w-full text-xs file:mr-3 file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-xs dark:file:bg-slate-700 dark:file:text-slate-100" />
                </label>
                <label className="space-y-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Observação (opcional)
                  <input maxLength={1000} value={archiveNote} onChange={event => setArchiveNote(event.target.value)} className="w-full border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </label>
                <div className="flex justify-end md:col-span-2">
                  <button type="submit" disabled={archiveSaving || !archiveFile} className="inline-flex items-center gap-2 bg-[#113240] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#194b5d] disabled:cursor-not-allowed disabled:opacity-50">
                    {archiveSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    Arquivar documento
                  </button>
                </div>
              </form>

              <div className="dossie-print-only mb-4 border-b border-slate-300 pb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide">Relação de documentos selecionados</h2>
                <p className="mt-1 text-xs">Religioso: {religioso.nome_religioso || religioso.nome_civil} · {selectedDocuments.length} documento(s)</p>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs">
                  {selectedDocuments.map(documento => (
                    <li key={documento.id}>{documento.categoria} — {documento.titulo || documento.nome_arquivo} ({documento.nome_arquivo})</li>
                  ))}
                </ol>
              </div>

              {documentos.length ? (
                <div className="space-y-3">
                  {documentFolders.map(([category, categoryDocuments]) => (
                    <details key={category} open className="overflow-hidden border border-slate-200 dark:border-slate-700">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-slate-50 px-4 py-3 dark:bg-white/[0.03]">
                        <span className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                          <FolderClosed className="h-4 w-4 text-[#226380] dark:text-[#A3C3C7]" />
                          {category}
                        </span>
                        <span className="text-[10px] text-slate-500">{categoryDocuments.length} documento(s)</span>
                      </summary>
                      <div className="space-y-2 p-3">
                        {categoryDocuments.map(documento => (
                          <div key={documento.id} className="flex flex-col gap-3 border border-slate-200 p-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedDocumentIds.has(documento.id)}
                                onChange={() => toggleDocumentSelection(documento.id)}
                                aria-label={`Incluir ${documento.nome_arquivo} no checklist impresso`}
                                className="dossie-no-print mt-1 h-4 w-4 accent-[#113240]"
                              />
                              <div className="min-w-0">
                                <p className="break-words text-sm font-medium text-slate-900 dark:text-white">{documento.titulo || documento.nome_arquivo}</p>
                                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                  {documento.nome_arquivo} • {formatDate(documento.data_cadastro || documento.criado_em)} • {formatBytes(documento.tamanho_bytes)}
                                </p>
                                {(documento.quem_cadastrou || documento.enviado_por_nome) && <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">Enviado por {documento.enviado_por_nome || documento.quem_cadastrou}</p>}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => void handleDownload(documento)}
                              className="dossie-no-print inline-flex shrink-0 items-center justify-center gap-2 border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Baixar
                            </button>
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">Nenhum documento anexado a este religioso até o momento.</p>
              )}
              {documentos.length > 0 && selectedDocuments.length === 0 && (
                <p className="dossie-no-print mt-3 text-[11px] text-amber-700 dark:text-amber-300">Selecione os documentos que devem constar no checklist impresso.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
};

export default ReligiosoDossie;
