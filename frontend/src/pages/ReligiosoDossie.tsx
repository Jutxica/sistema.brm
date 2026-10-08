import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Archive, CheckCircle2, Download, FileText, FolderOpen, Loader2, Printer, ShieldCheck, Upload, UserRound } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../hooks/useFeedback';
import { useAuth } from '../contexts/AuthContext';

interface ReligiosoDossieData {
  id: string;
  nome_civil: string;
  nome_religioso: string | null;
  grau: string | null;
  data_nascimento: string | null;
  cpf: string | null;
  email_institucional: string | null;
  telefone_celular: string | null;
  status: string;
  status_cadastro: string;
  origem_cadastro: string | null;
  auth_user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ContaAcesso {
  id: string;
  email: string | null;
  banned_until: string | null;
  ledger: {
    origin: string | null;
    created_by_name: string | null;
    created_at: string | null;
  } | null;
}

interface EventoFicha {
  id: string;
  religioso_id: string;
  religioso_nome: string;
  status_anterior: string | null;
  status_novo: string;
  ator_nome: string;
  observacao: string | null;
  criado_em: string;
}

interface DocumentoFicha {
  id: string;
  categoria: string;
  titulo?: string;
  nome_arquivo: string;
  caminho_storage: string;
  mime_type: string | null;
  tamanho_bytes: number | null;
  data_cadastro: string | null;
  quem_cadastrou: string | null;
  criado_em?: string | null;
  enviado_por_nome?: string | null;
  storage_bucket: 'religiosos-documentos' | 'arquivo-religiosos-confidencial';
}

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

export const ReligiosoDossie: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [religioso, setReligioso] = useState<ReligiosoDossieData | null>(null);
  const [conta, setConta] = useState<ContaAcesso | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoFicha[]>([]);
  const [historico, setHistorico] = useState<EventoFicha[]>([]);
  const [allAccounts, setAllAccounts] = useState<ContaAcesso[]>([]);
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
    ] = await Promise.all([
      supabase.from('religiosos').select('*').eq('id', id).maybeSingle(),
      supabase.from('religiosos_documentos').select('id,categoria,nome_arquivo,caminho_storage,mime_type,tamanho_bytes,data_cadastro,quem_cadastrou').eq('religioso_id', id).eq('status', 'Ativo').order('data_cadastro', { ascending: false }),
      supabase.from('secretaria_dossie_documentos').select('id,categoria,titulo,nome_arquivo,caminho_storage,mime_type,tamanho_bytes,enviado_por_nome,criado_em').eq('religioso_id', id).order('criado_em', { ascending: false }),
      supabase.from('secretaria_ficha_eventos').select('*').eq('religioso_id', id).order('criado_em', { ascending: false }),
      supabase.functions.invoke<{ accounts: ContaAcesso[] }>('secretaria-contas', { body: { action: 'list' } }),
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

  const totalContas = allAccounts.length;
  const selectedDocuments = documentos.filter(documento => selectedDocumentIds.has(documento.id));

  return (
    <>
      <style>{`
        @media print {
          .dossie-no-print { display: none !important; }
          .dossie-print-only { display: block !important; }
          .dossie-sheet { box-shadow: none !important; border: none !important; }
          body { background: #fff !important; color: #111 !important; }
        }
        .dossie-print-only { display: none; }
      `}</style>

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
                  {documentos.map(documento => (
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
                          {documento.categoria} • {documento.nome_arquivo} • {formatDate(documento.data_cadastro || documento.criado_em)} • {formatBytes(documento.tamanho_bytes)}
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
