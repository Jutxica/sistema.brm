import React, { useEffect, useMemo, useState } from 'react';
import { 
  ArrowLeft, ArrowRightLeft, Archive, Check, CheckCircle2, ChevronRight, Download, ExternalLink, 
  Eye, FileImage, FileText, FolderClosed, FolderOpen, Globe, History, LayoutGrid, List, Loader2, 
  Printer, Search, ShieldCheck, Sparkles, Upload, UserRound, X 
} from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../hooks/useFeedback';
import { useAuth } from '../contexts/AuthContext';
import { siteSyncService, type SiteReligiosoItem, type SiteLocalItem } from '../services/siteSyncService';
import { parseAddressString } from '../utils/addressParser';
import { gotenbergService } from '../services/gotenbergService';
import { obterFotoReligiosoBase64 } from '../services/religiosoFotoService';
import { LOGO_TIMBRADO_DATA_URI } from '../assets/logoTimbradoBase64';
import { atribuirNomeReligioso, formatarComunidadeReligiosa, padronizarSufixoSCJ } from '../lib/religiosoNome';
import { extrairAno } from '../utils/dateUtils';

import type { 
  ReligiosoDossieData, 
  ContaAcesso, 
  EventoFicha, 
  DocumentoFicha 
} from '../types/religioso';

const reviewOptions = ['Em revisão', 'Em verificação', 'Aguardando complementação', 'Aprovado', 'Recusado', 'Arquivado'];
const archiveCategories = [
  'Certidão de nascimento',
  'Documentos civis (RG / CNH / CPF)',
  'Sacramentos e ordens',
  'Formação e votos',
  'Transferência',
  'Provisões e decretos',
  'Cartas e correspondências',
  'Certificados e diplomas',
  'Saúde',
  'Fotografia',
  'Outro',
];
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
  const str = String(value).trim();
  if (!str) return '—';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;

  // Formato de data YYYY-MM-DD (com ou sem sufixos de tempo UTC / ISO)
  // Preserva dia/mês/ano exatos para que a data de nascimento e ordenações nunca sofram recuo de 1 dia pelo fuso UTC-3
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, ano, mes, dia] = match;
    return `${dia}/${mes}/${ano}`;
  }

  // Fallback para timestamps com horários específicos
  const date = new Date(str);
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
    contatosFamiliares: any[];
    votos: any[];
    ordens: any[];
    sacramentos: any[];
    formacao: any[];
    designacoes: any[];
    historicoComunidades: any[];
    missoesServicos: any[];
    residencia: any | null;
    saude: any | null;
    academica: any[];
    idiomas: any[];
    origemVocacional: any | null;
  }>({
    familiares: [],
    contatosFamiliares: [],
    votos: [],
    ordens: [],
    sacramentos: [],
    formacao: [],
    designacoes: [],
    historicoComunidades: [],
    missoesServicos: [],
    residencia: null,
    saude: null,
    academica: [],
    idiomas: [],
    origemVocacional: null,
  });
  const [loading, setLoading] = useState(true);
  const [exportandoGotenberg, setExportandoGotenberg] = useState(false);
  const [archiveCategory, setArchiveCategory] = useState(archiveCategories[0]);
  const [archiveTitle, setArchiveTitle] = useState('');
  const [archiveNote, setArchiveNote] = useState('');
  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [archiveSaving, setArchiveSaving] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(new Set());
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  // Estados do Gestor de Arquivos e Documentos (Nextcloud / Explorer)
  const [currentFolder, setCurrentFolder] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchDocTerm, setSearchDocTerm] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean;
    title: string;
    url: string | null;
    mimeType: string;
    fileName: string;
    documento: DocumentoFicha | null;
    loading: boolean;
  }>({
    isOpen: false,
    title: '',
    url: null,
    mimeType: '',
    fileName: '',
    documento: null,
    loading: false,
  });

  // Estados da Publicação no Site Oficial
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [preparingPublish, setPreparingPublish] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishPayload, setPublishPayload] = useState<SiteReligiosoItem | null>(null);
  const [siteLocais, setSiteLocais] = useState<SiteLocalItem[]>([]);
  const [selectedLocalId, setSelectedLocalId] = useState<string>('');
  const [sitePublicUrl, setSitePublicUrl] = useState<string>('https://scj-brm.onrender.com');

  const handleOpenPublishModal = async () => {
    if (!id) return;
    setPreparingPublish(true);
    try {
      const [cfg, payloadData, locais] = await Promise.all([
        siteSyncService.getConfig(),
        siteSyncService.buildSitePayload(id),
        siteSyncService.fetchSiteLocais(),
      ]);
      setSitePublicUrl(cfg.site_url || 'https://scj-brm.onrender.com');
      setPublishPayload(payloadData.item);
      setSiteLocais(locais);

      // Tenta correlacionar a comunidade atual com um local do site
      const found = locais.find(l => 
        (l.nome || '').toLowerCase().includes((payloadData.comunidadeNome || '').toLowerCase()) ||
        (payloadData.comunidadeNome || '').toLowerCase().includes((l.nome || '').toLowerCase())
      );
      if (found) {
        setSelectedLocalId(found.id);
      } else if (locais.length > 0) {
        setSelectedLocalId(locais[0].id);
      }
      setShowPublishModal(true);
    } catch (err: any) {
      showToast.error(`Não foi possível carregar os dados para publicação: ${err.message}`);
    } finally {
      setPreparingPublish(false);
    }
  };

  const handleConfirmPublish = async () => {
    if (!id || !publishPayload) return;
    setPublishing(true);
    try {
      const result = await siteSyncService.publishToSite(
        id,
        publishPayload,
        selectedLocalId,
        user?.email || 'Secretaria Provincial'
      );
      showToast.success(result.message);
      setShowPublishModal(false);
      await load();
    } catch (err: any) {
      showToast.error(`Erro ao publicar no site oficial: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

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
      { data: saudeData },
      { data: academicaData },
      { data: idiomasData },
      { data: origemVocacionalData },
      { data: contatosFamiliaresData },
      { data: historicoComunidadesData },
      { data: missoesServicosData },
    ] = await Promise.all([
      supabase.from('religiosos').select('*').eq('id', id).maybeSingle(),
      supabase.from('religiosos_documentos').select('id,categoria,nome_arquivo,caminho_storage,mime_type,tamanho_bytes,data_cadastro,quem_cadastrou,status').eq('religioso_id', id).order('data_cadastro', { ascending: false }),
      supabase.from('secretaria_dossie_documentos').select('id,categoria,titulo,nome_arquivo,caminho_storage,mime_type,tamanho_bytes,enviado_por_nome,criado_em').eq('religioso_id', id).order('criado_em', { ascending: false }),
      supabase.from('secretaria_ficha_eventos').select('*').eq('religioso_id', id).order('criado_em', { ascending: false }),
      supabase.functions.invoke<{ accounts: ContaAcesso[] }>('secretaria-contas', { body: { action: 'list' } }),
      supabase.from('religiosos_familiares').select('*').eq('religioso_id', id),
      supabase.from('religiosos_profissoes_votos').select('*').eq('religioso_id', id).order('data', { ascending: true }),
      supabase.from('religiosos_ministerios_ordens').select('*').eq('religioso_id', id).order('data', { ascending: true }),
      supabase.from('religiosos_sacramentos').select('*').eq('religioso_id', id).order('data', { ascending: true }),
      supabase.from('religiosos_formacao_religiosa').select('*').eq('religioso_id', id).order('data_ingresso', { ascending: true }),
      supabase.from('religiosos_designacoes').select('*, comunidades(nome, cidade, estado), religiosos_obras_referencia(nome, cidade, localidade)').eq('religioso_id', id).order('vigencia_inicio', { ascending: false }),
      supabase.from('religiosos_enderecos_contatos').select('*').eq('religioso_id', id).limit(1).maybeSingle(),
      supabase.from('religiosos_saude').select('*').eq('religioso_id', id).limit(1).maybeSingle(),
      supabase.from('religiosos_formacao_academica').select('*').eq('religioso_id', id).order('created_at', { ascending: true }),
      supabase.from('religiosos_idiomas').select('*').eq('religioso_id', id),
      supabase.from('religiosos_origem_vocacional').select('*').eq('religioso_id', id).limit(1).maybeSingle(),
      supabase.from('religiosos_contatos_familiares').select('*').eq('religioso_id', id),
      supabase.from('religiosos_historico_comunidades').select('*').eq('religioso_id', id).order('periodo_inicio', { ascending: true }),
      supabase.from('religiosos_missoes_servicos').select('*').eq('religioso_id', id).order('created_at', { ascending: true }),
    ]);

    let resolvedFotoUrl: string | null = null;
    const targetFotoPath = religiosoData?.foto_path || (religiosoData as any)?.foto_url;

    const resolveStorageUrl = async (path: string): Promise<string | null> => {
      if (!path) return null;
      if (path.startsWith('http://') || path.startsWith('https://')) return path;

      try {
        const { data: sDoc } = await supabase.storage
          .from('religiosos-documentos')
          .createSignedUrl(path, 86400);
        if (sDoc?.signedUrl) return sDoc.signedUrl;
      } catch {}

      try {
        const { data: sPerfil } = await supabase.storage
          .from('religiosos-perfil')
          .createSignedUrl(path, 86400);
        if (sPerfil?.signedUrl) return sPerfil.signedUrl;
      } catch {}

      try {
        const { data: pDoc } = supabase.storage
          .from('religiosos-documentos')
          .getPublicUrl(path);
        if (pDoc?.publicUrl) return pDoc.publicUrl;
      } catch {}

      return null;
    };

    if (targetFotoPath) {
      resolvedFotoUrl = await resolveStorageUrl(targetFotoPath);
    }

    // Se ainda não encontrou via foto_path, busca fallback nos documentos anexos
    if (!resolvedFotoUrl) {
      const allDocs = (documentosAntigos || []) as Array<{ categoria?: string; nome_arquivo?: string; caminho_storage?: string; status?: string }>;
      const fotoDoc = allDocs.find(d =>
        d.status !== 'Excluido' && (
          d.categoria?.toLowerCase().includes('foto') ||
          d.categoria?.toLowerCase().includes('perfil') ||
          /.(jpe?g|png|webp)$/i.test(d.nome_arquivo || '')
        )
      );
      if (fotoDoc?.caminho_storage) {
        resolvedFotoUrl = await resolveStorageUrl(fotoDoc.caminho_storage);
      }
    }

    setFotoUrl(resolvedFotoUrl);

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
      console.warn('Contas de acesso não disponíveis via Edge Function:', contasError.message);
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
      contatosFamiliares: contatosFamiliaresData || [],
      votos: votosData || [],
      ordens: ordensData || [],
      sacramentos: sacramentosData || [],
      formacao: formacaoData || [],
      designacoes: designacoesData || [],
      historicoComunidades: historicoComunidadesData || [],
      missoesServicos: missoesServicosData || [],
      residencia: residenciaData || null,
      saude: saudeData || null,
      academica: academicaData || [],
      idiomas: idiomasData || [],
      origemVocacional: origemVocacionalData || null,
    });
    const contas = contasResult?.accounts || [];
    setAllAccounts(contas);
    const contaEncontrada = contas.find(item => item.id === religiosoData.auth_user_id);
    if (contaEncontrada) {
      setConta(contaEncontrada);
    } else if (religiosoData.auth_user_id) {
      setConta({
        id: religiosoData.auth_user_id,
        email: religiosoData.email_institucional || (religiosoData as any).email_pessoal || 'Conta vinculada',
        created_at: (religiosoData as any).created_at || null,
        email_confirmed_at: null,
        last_sign_in_at: null,
        banned_until: null,
        linked_religioso_id: religiosoData.id,
        linked_religioso_nome: (religiosoData as any).nome_elenco || religiosoData.nome_religioso || religiosoData.nome_civil || null,
        ledger: {
          origin: 'portal',
          created_by: null,
          created_by_name: 'Conta do Portal vinculada',
          created_at: (religiosoData as any).created_at || null,
          state: 'ativo',
        },
      });
    } else {
      setConta(null);
    }
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
    setShowUploadModal(false);
    await load();
  };

  const getFileMeta = (fileName: string, mime?: string | null) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const isPdf = ext === 'pdf' || (mime ? mime.includes('pdf') : false);
    const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'tif', 'tiff'].includes(ext) || (mime ? mime.startsWith('image/') : false);
    const isDoc = ['doc', 'docx', 'odt', 'rtf'].includes(ext) || (mime ? (mime.includes('word') || mime.includes('officedocument')) : false);
    const isSheet = ['xls', 'xlsx', 'csv'].includes(ext) || (mime ? (mime.includes('excel') || mime.includes('spreadsheet')) : false);
    return { ext, isPdf, isImg, isDoc, isSheet };
  };

  const handleOpenPreview = async (documento: DocumentoFicha) => {
    setPreviewDoc({
      isOpen: true,
      title: documento.titulo || documento.nome_arquivo,
      url: null,
      mimeType: documento.mime_type || '',
      fileName: documento.nome_arquivo,
      documento,
      loading: true,
    });

    try {
      const { data, error } = await supabase.storage.from(documento.storage_bucket).download(documento.caminho_storage);
      if (error) throw error;
      const objectUrl = window.URL.createObjectURL(data);
      setPreviewDoc(prev => ({
        ...prev,
        url: objectUrl,
        loading: false,
      }));
    } catch (err: any) {
      showToast.error(`Não foi possível abrir o arquivo: ${err.message}`);
      setPreviewDoc(prev => ({ ...prev, loading: false, isOpen: false }));
    }
  };

  const handleClosePreview = () => {
    if (previewDoc.url) {
      window.URL.revokeObjectURL(previewDoc.url);
    }
    setPreviewDoc({
      isOpen: false,
      title: '',
      url: null,
      mimeType: '',
      fileName: '',
      documento: null,
      loading: false,
    });
  };

  const handleBatchDownload = async () => {
    const toDownload = documentos.filter(d => selectedDocumentIds.has(d.id));
    if (toDownload.length === 0) {
      showToast.warning('Selecione ao menos um documento para baixar.');
      return;
    }
    showToast.info(`Iniciando download de ${toDownload.length} documento(s)...`);
    for (const doc of toDownload) {
      await handleDownload(doc);
      await new Promise(res => setTimeout(res, 350));
    }
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

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    archiveCategories.forEach(c => set.add(c));
    documentos.forEach(d => {
      if (d.categoria) set.add(d.categoria);
    });
    return Array.from(set);
  }, [documentos]);

  const foldersWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    documentos.forEach(d => {
      const cat = d.categoria || 'Outro';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));
  }, [documentos]);

  const filteredDocuments = useMemo(() => {
    let list = documentos;
    if (currentFolder !== 'all') {
      list = list.filter(d => (d.categoria || 'Outro') === currentFolder);
    }
    if (searchDocTerm.trim()) {
      const term = searchDocTerm.toLowerCase().trim();
      list = list.filter(d => 
        (d.titulo && d.titulo.toLowerCase().includes(term)) ||
        (d.nome_arquivo && d.nome_arquivo.toLowerCase().includes(term)) ||
        (d.categoria && d.categoria.toLowerCase().includes(term)) ||
        (d.enviado_por_nome && d.enviado_por_nome.toLowerCase().includes(term)) ||
        (d.quem_cadastrou && d.quem_cadastrou.toLowerCase().includes(term))
      );
    }
    return list;
  }, [documentos, currentFolder, searchDocTerm]);

  const handleSelectAllFiltered = () => {
    const allIds = filteredDocuments.map(d => d.id);
    const allSelected = allIds.length > 0 && allIds.every(id => selectedDocumentIds.has(id));
    setSelectedDocumentIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        allIds.forEach(id => next.delete(id));
      } else {
        allIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const totalContas = allAccounts.length;
  const selectedDocuments = documentos.filter(documento => selectedDocumentIds.has(documento.id));

  const paiNome = religioso?.pai_nome || canonicalData.familiares.find(f => f.tipo === 'Pai')?.nome || '—';
  const maeNome = religioso?.mae_nome || canonicalData.familiares.find(f => f.tipo === 'Mãe')?.nome || '—';
  const paisTexto = [paiNome !== '—' ? paiNome : null, maeNome !== '—' ? maeNome : null].filter(Boolean).join(' e ') || '—';

  const naturalidadeTexto = [
    religioso?.municipio_nascimento,
    religioso?.estado_nascimento,
    religioso?.pais_nascimento && religioso.pais_nascimento !== 'Brasil' ? religioso.pais_nascimento : null
  ].filter(Boolean).join('/') || '—';

  // Data oficial de aprovação no sistema (sem exibir tabela de histórico na ficha impressa)
  const eventoAprovado = historico.find(e =>
    e.status_novo === 'Aprovado' || (e.observacao || '').toLowerCase().includes('aprovado')
  );
  const dataAprovacaoRaw = eventoAprovado?.criado_em || (religioso?.status_cadastro === 'Aprovado' ? (religioso.updated_at || religioso.created_at) : null);
  const dataAprovacaoFormatada = dataAprovacaoRaw ? formatDate(dataAprovacaoRaw) : null;

  // Grau Canônico normalizado
  const grauNormalizado = (religioso?.grau || '').toLowerCase();
  const isFrater = grauNormalizado.includes('frater');
  const isIrmao = grauNormalizado.includes('irmão') || grauNormalizado.includes('irmao');
  const isDiacono = grauNormalizado.includes('diácono') || grauNormalizado.includes('diacono');
  const isPadre = grauNormalizado.includes('padre') || grauNormalizado.includes('sacerd');
  const isBispo = grauNormalizado.includes('bispo');

  // Sacramentos
  const batismo = canonicalData.sacramentos.find(s => (s.tipo || '').toLowerCase().includes('batis'));
  const primeiraEucaristia = canonicalData.sacramentos.find(s => (s.tipo || '').toLowerCase().includes('eucar'));
  const crisma = canonicalData.sacramentos.find(s => (s.tipo || '').toLowerCase().includes('crism'));

  // Votos
  const primVotos = canonicalData.votos.find(v => (v.tipo || '').toLowerCase().includes('primeir') || (v.tipo || '').toLowerCase().includes('tempor'));
  const perpVotos = canonicalData.votos.find(v => (v.tipo || '').toLowerCase().includes('perp'));

  // Ministérios Instituídos (Leitorado, Acolitado)
  const ministeriosList = canonicalData.ordens.filter(o => {
    const t = (o.tipo || '').toLowerCase();
    return t.includes('leitor') || t.includes('acolit') || t.includes('palavra') || t.includes('altar') || t.includes('minist');
  });

  // Ordens Sacras
  const ordenacaoDiaconal = canonicalData.ordens.find(o => (o.tipo || '').toLowerCase().includes('diacon'));
  const ordenacaoPresbiteral = canonicalData.ordens.find(o => (o.tipo || '').toLowerCase().includes('presb') || (o.tipo || '').toLowerCase().includes('sacerd'));
  const ordenacaoEpiscopal = canonicalData.ordens.find(o => (o.tipo || '').toLowerCase().includes('episcop') || (o.tipo || '').toLowerCase().includes('bispo'));

  // Apenas Diácono, Padre ou Bispo exibem card de ordenação (NUNCA Frater nem Irmão)
  const podeTerOrdenacao = !isFrater && !isIrmao && (isDiacono || isPadre || isBispo || Boolean(ordenacaoPresbiteral || ordenacaoDiaconal || ordenacaoEpiscopal));
  const ordenacaoExibida = isDiacono
    ? {
        titulo: 'ORDENAÇÃO DIACONAL',
        data: ordenacaoDiaconal?.data,
        cidade: ordenacaoDiaconal?.cidade,
        local: ordenacaoDiaconal?.local || ordenacaoDiaconal?.bispo_ordenante || '—'
      }
    : isBispo
      ? {
          titulo: 'ORDENAÇÃO EPISCOPAL',
          data: ordenacaoEpiscopal?.data || ordenacaoPresbiteral?.data,
          cidade: ordenacaoEpiscopal?.cidade || ordenacaoPresbiteral?.cidade,
          local: ordenacaoEpiscopal?.local || '—'
        }
      : {
          titulo: 'ORDENAÇÃO PRESBITERAL',
          data: ordenacaoPresbiteral?.data,
          cidade: ordenacaoPresbiteral?.cidade,
          local: ordenacaoPresbiteral?.local || ordenacaoPresbiteral?.bispo_ordenante || '—'
        };

  // Contato de emergência formatado
  const contatoEmergenciaTexto = canonicalData.saude?.contato_emergencia || (
    canonicalData.contatosFamiliares.length > 0
      ? `${canonicalData.contatosFamiliares[0].nome} (${canonicalData.contatosFamiliares[0].parentesco || 'Contato'})${canonicalData.contatosFamiliares[0].contato_1 ? ` - ${canonicalData.contatosFamiliares[0].contato_1}` : ''}`
      : '—'
  );

  const { etapasFormacaoInicial, etapasTirocinio } = useMemo(() => {
    const iniciais: any[] = [];
    const tirocinio: any[] = [];
    (canonicalData.formacao || []).forEach((f: any) => {
      const etapaNome = f.etapa || '';
      if (etapaNome.toLowerCase().includes('tirocín') || etapaNome.toLowerCase().includes('tirocin')) {
        tirocinio.push(f);
      } else {
        iniciais.push(f);
      }
    });
    return { etapasFormacaoInicial: iniciais, etapasTirocinio: tirocinio };
  }, [canonicalData.formacao]);

  const anoIngresso = canonicalData.formacao[0]?.data_ingresso
    ? extrairAno(canonicalData.formacao[0].data_ingresso)
    : (religioso?.created_at ? extrairAno(religioso.created_at) : '2026');

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

  const handleExportarGotenberg = async () => {
    if (!religioso) return;
    setExportandoGotenberg(true);
    try {
      // 1. Mapeia etapas formativas, designações e histórico em trajetória de trabalhos completa
      const trabalhos: Array<{
        periodo: string;
        comunidade?: string;
        obra?: string;
        faseGrau?: string;
        funcao: string;
        local?: string;
        observacoes?: string;
        ordenacaoAno?: number;
      }> = [];

      // A. Separa etapas de Formação Inicial (cards) vs Trajetória de Trabalhos (a partir do Tirocínio)
      const etapasIniciaisParaPdf: Array<{
        etapa: string;
        periodo?: string;
        instituicao?: string;
        cidade?: string;
        local?: string;
        formador?: string;
        observacoes?: string;
        isFaseAtual?: boolean;
        anoTeologia?: number;
      }> = [];

      const grauNorm = (religioso.grau || '').toLowerCase();
      const isFraterOuDiacono = grauNorm.includes('frater') || grauNorm.includes('diác') || grauNorm.includes('diac');
      const anoAtual = new Date().getFullYear();

      (canonicalData.formacao || []).forEach(f => {
        const pIni = f.data_ingresso ? extrairAno(f.data_ingresso) : '';
        const pFim = f.data_conclusao ? extrairAno(f.data_conclusao) : '';
        const etapaNome = f.etapa || 'Formação Inicial';
        const isTirocinio = etapaNome.toLowerCase().includes('tirocín') || etapaNome.toLowerCase().includes('tirocin');
        const isConfiguracao = etapaNome.toLowerCase().includes('configur');
        const isConventinho = (f.instituicao || f.local || '').toLowerCase().includes('conventinho') ||
                              (f.cidade || '').toLowerCase().includes('taubat') ||
                              (religioso.comunidade_atual_nome || '').toLowerCase().includes('conventinho');

        const anoIniNum = pIni && !Number.isNaN(Number(pIni)) ? Number(pIni) : anoAtual;
        const anoNum = anoIniNum;

        // Se for diácono ou fráter no Conventinho (fase da Configuração / 4 anos de Teologia)
        const isConventinhoAtivo = isFraterOuDiacono && (isConfiguracao || isConventinho) && (!pFim || Number(pFim) >= anoAtual);

        let periodoStr: string;
        let anoTeologia: number | undefined;

        if (isConventinhoAtivo) {
          // No Conventinho são 4 anos de Teologia (fase da configuração)
          anoTeologia = Math.max(1, Math.min(4, anoAtual - anoIniNum + 1));
          periodoStr = `${anoIniNum} - Fase Atual (${anoTeologia}º Ano)`;
        } else if (pIni && pFim) {
          periodoStr = pIni === pFim ? pIni : `${pIni} - ${pFim}`;
        } else if (pIni) {
          periodoStr = `${pIni} - Concluído`;
        } else {
          periodoStr = 'Período Formativo';
        }

        if (isTirocinio) {
          trabalhos.push({
            periodo: periodoStr,
            comunidade: f.instituicao || f.local || 'Comunidade do Tirocínio',
            obra: f.instituicao || 'Tirocínio Pastoral',
            faseGrau: 'Tirocínio',
            funcao: 'Tirocinante / Atuação Pastoral',
            local: [f.cidade, f.local].filter(Boolean).join(' • ') || 'Província BRM',
            observacoes: [f.formador ? `Superior da Comunidade: ${f.formador}` : (f.superior ? `Superior da Comunidade: ${f.superior}` : null), f.observacoes].filter(Boolean).join(' • ') || undefined,
            ordenacaoAno: anoNum
          });
        } else {
          etapasIniciaisParaPdf.push({
            etapa: etapaNome,
            periodo: periodoStr,
            instituicao: f.instituicao || f.local || 'Casa de Formação SCJ',
            cidade: f.cidade || f.local || undefined,
            local: f.local || undefined,
            formador: f.formador || undefined,
            observacoes: f.observacoes || undefined,
            isFaseAtual: isConventinhoAtivo,
            anoTeologia: anoTeologia,
          });
        }
      });

      // B. Inclui histórico de comunidades
      (canonicalData.historicoComunidades || []).forEach(h => {
        const pIni = h.periodo_inicio ? extrairAno(h.periodo_inicio) : '';
        const pFim = h.periodo_fim ? extrairAno(h.periodo_fim) : '';
        const periodoStr = pIni && pFim ? (pIni === pFim ? pIni : `${pIni} - ${pFim}`) : (pIni ? `${pIni} - Atual` : '—');
        const anoNum = pIni && !Number.isNaN(Number(pIni)) ? Number(pIni) : 2010;

        trabalhos.push({
          periodo: periodoStr,
          comunidade: h.instituicao || 'Comunidade SCJ',
          obra: h.instituicao || 'Paróquia / Obra',
          faseGrau: religioso.grau || 'Religioso SCJ',
          funcao: h.funcao || 'Atuação Pastoral e Fraterna',
          local: h.local || undefined,
          observacoes: h.observacoes || undefined,
          ordenacaoAno: anoNum
        });
      });

      // C. Inclui designações canônicas (atuais e anteriores)
      (canonicalData.designacoes || []).forEach(d => {
        const comNome = formatarComunidadeReligiosa(d.comunidades?.nome) || 'Comunidade Provincial';
        const obraNome = d.religiosos_obras_referencia?.nome || 'Atuação Pastoral';
        const ano = d.ano_referencia || (d.vigencia_inicio ? extrairAno(d.vigencia_inicio) : '');
        const fim = d.vigencia_fim ? extrairAno(d.vigencia_fim) : 'Atual';
        const periodoStr = ano ? (ano === fim ? String(ano) : `${ano} - ${fim}`) : 'Vigente';
        const localidade = [d.comunidades?.cidade, d.religiosos_obras_referencia?.cidade].filter(Boolean)[0] || 'Província BRM';
        const anoNum = ano && !Number.isNaN(Number(ano)) ? Number(ano) : 2026;

        trabalhos.push({
          periodo: periodoStr,
          comunidade: comNome,
          obra: obraNome,
          faseGrau: religioso.grau || 'Religioso',
          funcao: d.funcao || d.tipo_vinculo || 'Membro da Comunidade',
          local: localidade,
          observacoes: [d.tipo_vinculo ? `Vínculo: ${d.tipo_vinculo}` : null, d.observacoes].filter(Boolean).join(' • ') || undefined,
          ordenacaoAno: anoNum
        });
      });

      // D. Se não houver designação ativa listada, adiciona a comunidade/obra atual
      const temAtual = trabalhos.some(t => t.periodo.includes('Atual') || t.periodo.includes('Vigente'));
      if (!temAtual && (religioso.comunidade_atual_nome || religioso.obra_atual_nome)) {
        trabalhos.push({
          periodo: 'Atual',
          comunidade: formatarComunidadeReligiosa(religioso.comunidade_atual_nome) || 'Comunidade Provincial',
          obra: religioso.obra_atual_nome || 'Residência Canônica',
          faseGrau: religioso.grau || 'Confrade',
          funcao: canonicalData.designacoes[0]?.funcao || 'Membro Ativo',
          local: canonicalData.residencia?.cidade || 'Província BRM',
          ordenacaoAno: 9999
        });
      }

      // Ordena cronologicamente: do início da formação até a atualidade
      trabalhos.sort((a, b) => (a.ordenacaoAno || 0) - (b.ordenacaoAno || 0));

      // 2. Mapeia missões e serviços
      const missoes = (canonicalData.missoesServicos || []).map(m => ({
        tipo: m.tipo || 'Missão',
        instituicao: m.instituicao,
        funcao: m.funcao,
        periodo: m.periodo,
        local: m.local
      }));

      // 3. Mapeia formações acadêmicas
      const formacoes = (canonicalData.academica || []).map(a => ({
        curso: a.categoria || 'Curso',
        instituicao: a.instituicao || 'Instituição',
        anoOuPeriodo: a.periodo || ''
      }));

      // 4. Mapeia idiomas
      const idiomas = (canonicalData.idiomas || []).map(i => `${i.idioma} (${i.nivel || i.fala || 'Fluente'})`);

      // 5. Mapeia documentos cadastrados (legados + arquivo confidencial)
      const documentosParaPdf = (documentos || [])
        .filter(d => d.status !== 'Excluido')
        .map(d => ({
          categoria: d.categoria || 'Documento Geral',
          nomeArquivo: d.nome_arquivo || (d as any).titulo || 'Registro Digital',
          data: d.data_cadastro ? formatDate(d.data_cadastro) : (d.criado_em ? formatDate(d.criado_em) : undefined),
          status: d.status || 'Arquivo Digital Provincial'
        }));

      // 6. Mapeia lemas vocacionais
      const lemasParaPdf: Array<{ fase: string; texto: string; destacado?: boolean }> = (religioso.lemas || []).map(l => ({
        fase: l.fase,
        texto: l.texto,
        destacado: l.destacado
      }));
      if (lemasParaPdf.length === 0 && (religioso.lema_destacado || (religioso as any).lema)) {
        lemasParaPdf.push({
          fase: (religioso.lema_destacado_fase as string) || 'Lema Canônico',
          texto: String(religioso.lema_destacado || (religioso as any).lema).replace(/^[“"']|[”"']$/g, '').trim(),
          destacado: true
        });
      }

      // 7. Mapeia origem vocacional
      const origemVocacionalParaPdf = {
        paroquiaOrigem: canonicalData.origemVocacional?.paroquia_origem || batismo?.paroquia || undefined,
        cidade: [canonicalData.origemVocacional?.cidade_origem, canonicalData.origemVocacional?.estado_origem].filter(Boolean).join(' / ') || undefined,
        diocese: canonicalData.origemVocacional?.diocese_origem || undefined,
        promotorVocacional: canonicalData.origemVocacional?.promotor_vocacional || undefined
      };

      // 8. Obtém a foto oficial em Base64 para garantir renderização no Gotenberg
      const fotoBase64 = await obterFotoReligiosoBase64(religioso);

      const blob = await gotenbergService.gerarFichaReligiosoPdf({
        nomeCivil: religioso.nome_civil,
        nomeReligioso: atribuirNomeReligioso(religioso.grau, religioso.nome_civil) || padronizarSufixoSCJ(religioso.nome_religioso) || undefined,
        grau: religioso.grau || undefined,
        numeroCadastro: religioso.numero_cadastro || undefined,
        statusCadastro: religioso.status_cadastro || 'Aprovado',
        dataNascimento: formatDate(religioso.data_nascimento),
        naturalidade: naturalidadeTexto,
        nacionalidade: religioso.nacionalidade || 'Brasileira',
        cpf: formatCpfMask(religioso.cpf),
        rg: religioso.rg || undefined,
        rgOrgao: religioso.rg_orgao_expedidor || undefined,
        tituloEleitor: religioso.titulo_eleitor || undefined,
        pis: religioso.pis || undefined,
        cnh: religioso.cnh || undefined,
        cnhCategoria: religioso.cnh_categoria || undefined,
        filiacaoPai: paiNome !== '—' ? paiNome : undefined,
        filiacaoMae: maeNome !== '—' ? maeNome : undefined,
        fotoUrl: fotoBase64 || fotoUrl || undefined,
        lemaPrincipal: religioso.lema_destacado || (religioso as any).lema || undefined,
        lemaPrincipalFase: religioso.lema_destacado_fase || undefined,
        lemasVocacionais: lemasParaPdf,
        origemVocacional: origemVocacionalParaPdf,
        documentosCadastrados: documentosParaPdf,

        comunidadeAtualNome: formatarComunidadeReligiosa(religioso.comunidade_atual_nome) || undefined,
        obraAtualNome: religioso.obra_atual_nome || undefined,
        oficioAtual: canonicalData.designacoes[0]?.funcao || undefined,
        enderecoResidencial: (() => {
          const res = canonicalData.residencia;
          if (!res) return undefined;
          const p = res.logradouro?.includes('|') ? parseAddressString(res.logradouro) : null;
          const logr = p?.logradouro || res.logradouro || '';
          const num = res.numero || p?.numero || '';
          const cid = res.cidade || p?.cidade || '';
          const est = res.estado || p?.uf || '';
          return [logr ? `${logr}, ${num}` : null, cid, est].filter(Boolean).join(' - ');
        })(),
        telefoneCelular: religioso.telefone_celular || undefined,
        whatsapp: religioso.whatsapp || undefined,
        emailInstitucional: religioso.email_institucional || undefined,
        emailPessoal: religioso.email_pessoal || undefined,
        tipoSanguineo: canonicalData.saude?.tipo_sanguineo ? `${canonicalData.saude.tipo_sanguineo} ${canonicalData.saude.fator_rh || ''}` : undefined,
        planoSaude: canonicalData.saude?.plano_saude || undefined,
        contatoEmergencia: contatoEmergenciaTexto !== '—' ? contatoEmergenciaTexto : undefined,

        dataBatismo: batismo?.data ? formatDate(batismo.data) : undefined,
        paroquiaBatismo: batismo?.paroquia || undefined,
        dataPrimeiraEucaristia: primeiraEucaristia?.data ? formatDate(primeiraEucaristia.data) : undefined,
        dataCrisma: crisma?.data ? formatDate(crisma.data) : undefined,
        dataIngresso: canonicalData.formacao[0]?.data_ingresso ? formatDate(canonicalData.formacao[0].data_ingresso) : undefined,
        dataPrimeirosVotos: primVotos?.data ? formatDate(primVotos.data) : undefined,
        localPrimeirosVotos: primVotos?.local || primVotos?.cidade || undefined,
        dataVotosPerpetuos: perpVotos?.data ? formatDate(perpVotos.data) : undefined,
        localVotosPerpetuos: perpVotos?.local || perpVotos?.cidade || undefined,
        dataDiaconato: ordenacaoDiaconal?.data ? formatDate(ordenacaoDiaconal.data) : undefined,
        localDiaconato: [ordenacaoDiaconal?.cidade, ordenacaoDiaconal?.local].filter(Boolean).join(' - ') || undefined,
        dataPresbiterato: ordenacaoPresbiteral?.data ? formatDate(ordenacaoPresbiteral.data) : undefined,
        localPresbiterato: [ordenacaoPresbiteral?.cidade, ordenacaoPresbiteral?.local].filter(Boolean).join(' - ') || undefined,
        bispoOrdenante: ordenacaoPresbiteral?.bispo_ordenante || ordenacaoDiaconal?.bispo_ordenante || undefined,

        etapasFormacaoInicial: etapasIniciaisParaPdf,
        historicoTrabalhos: trabalhos,
        missoesServicos: missoes,
        formacoesAcademicas: formacoes,
        idiomas: idiomas,
        dataEmissao: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      });

      const nomeLimpo = (religioso.nome_religioso || religioso.nome_civil).replace(/[^a-zA-Z0-9]/g, '_');
      gotenbergService.baixarBlob(blob, `Ficha_Canonica_${nomeLimpo}.pdf`);
      showToast.success('Ficha Canônica com Trajetória e Brasão Oficial gerada com sucesso!', 'Gotenberg PDF');
    } catch (err: any) {
      showToast.error(`Erro ao gerar PDF no Gotenberg: ${err.message || 'Verifique o serviço Gotenberg.'}`, 'Erro Gotenberg');
    } finally {
      setExportandoGotenberg(false);
    }
  };

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 15mm 12mm 15mm;
          }
          html, body, #root, .institutional-app, .institutional-content, main, .dossie-print-only {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #111111 !important;
          }
          .dossie-no-print { display: none !important; }
          .dossie-print-only {
            display: block !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
          }
          body { background: #ffffff !important; background-color: #ffffff !important; color: #111 !important; font-size: 10pt; }
        }
        .dossie-print-only { display: none; }
      `}</style>

      {/* DOCUMENTO IMPRESSO INSTITUCIONAL OFICIAL (A4 - PADRÃO PROVÍNCIA BRM) */}
      <div className="dossie-print-only bg-white text-slate-900 font-sans leading-tight">
        {/* Cabeçalho Oficial */}
        <header className="border-b-2 border-slate-900 pb-3 mb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img src={LOGO_TIMBRADO_DATA_URI} alt="Província BRM" className="h-14 w-auto object-contain" />
              <div>
                <p className="font-mono text-[7.5pt] uppercase tracking-[0.16em] text-slate-500 font-semibold">
                  Congregação dos Sacerdotes do Sagrado Coração de Jesus
                </p>
                <h1 className="text-[13.5pt] font-serif font-bold text-slate-900 tracking-tight mt-0.5">
                  Província Brasileira Meridional · Arquivo Provincial
                </h1>
                <p className="text-[8pt] font-mono text-slate-600">Ficha Canônica Cadastral Oficial</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-[6.5pt] uppercase tracking-wider text-slate-400">Registro Provincial</p>
              <p className="font-mono text-[10pt] font-bold text-slate-900">
                {formatRegistrationNumber(religioso?.numero_cadastro || 0, religioso?.created_at || null)}
              </p>
              <p className="text-[6.5pt] font-mono text-slate-500 mt-0.5">Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </header>

        {/* Identificação do Religioso e Foto 4x4 */}
        <div className="flex items-center justify-between border-b border-slate-300 pb-3 mb-3">
          <div className="flex items-center gap-4">
            {fotoUrl ? (
              <div className="w-20 h-20 aspect-square border-2 border-slate-900 overflow-hidden bg-slate-100 shrink-0 shadow-sm">
                <img
                  src={fotoUrl}
                  alt={religioso?.nome_religioso || religioso?.nome_civil}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 aspect-square border-2 border-dashed border-slate-400 flex flex-col items-center justify-center bg-slate-50 text-[7pt] font-mono text-slate-400 uppercase text-center p-1 shrink-0">
                <span>Foto Oficial</span>
                <span className="font-bold text-slate-600">4x4</span>
              </div>
            )}
            <div>
              <p className="font-mono text-[7pt] uppercase tracking-[0.16em] text-[#226380] font-bold">
                {religioso?.grau || 'Confrade'} Dehoniano
              </p>
              <h2 className="text-[16pt] font-serif font-bold text-slate-900 mt-0.5">
                {atribuirNomeReligioso(religioso?.grau, religioso?.nome_civil) || religioso?.nome_religioso || religioso?.nome_civil}
              </h2>
              {religioso?.lema_destacado && (
                <p className="text-[9pt] font-serif italic text-[#226380] dark:text-[#68a9c7] mt-0.5 font-medium">
                  {religioso.lema_destacado}
                  {religioso.lema_destacado_fase && (
                    <span className="not-italic text-[7.5pt] font-sans font-semibold text-slate-500 ml-1.5 uppercase tracking-wide">
                      ({religioso.lema_destacado_fase})
                    </span>
                  )}
                </p>
              )}
              <p className="text-[8.5pt] font-mono text-slate-700 mt-0.5">
                Nome civil: <span className="font-semibold">{religioso?.nome_civil}</span>
              </p>
              <p className="text-[7.5pt] text-slate-600 mt-0.5">
                Comunidade atual: <span className="font-medium text-slate-900">{formatarComunidadeReligiosa(religioso?.comunidade_atual_nome) || 'A designar'}</span>
                {religioso?.obra_atual_nome && (
                  <> · Obra/Residência: <span className="font-medium text-slate-900">{religioso.obra_atual_nome}</span></>
                )}
                {canonicalData.designacoes[0]?.funcao ? ` · Ofício: ${canonicalData.designacoes[0].funcao}` : ''}
              </p>
            </div>
          </div>

          <div className="text-right space-y-1.5">
            <div className="inline-flex items-center gap-1.5 border-2 border-slate-900 px-3 py-1 text-[7.5pt] font-mono font-bold uppercase bg-slate-50">
              <span className={`w-2 h-2 rounded-full ${religioso?.status_cadastro === 'Aprovado' ? 'bg-emerald-600' : 'bg-amber-500'}`} />
              <span>
                {dataAprovacaoFormatada
                  ? `Aprovado no Sistema em ${dataAprovacaoFormatada}`
                  : `Situação: ${religioso?.status_cadastro || 'Em revisão'}`}
              </span>
            </div>

            <div className="print:hidden">
              <Link
                to={`/secretaria/transferir/${id}`}
                className="inline-flex items-center gap-1 rounded border border-[#226380]/40 bg-[#226380]/10 px-2 py-0.5 text-[7pt] font-bold text-[#226380] hover:bg-[#226380] hover:text-white transition-colors"
                title="Abrir página de transferência e nomeação para este confrade"
              >
                <ArrowRightLeft className="h-3 w-3" /> Registrar Transferência
              </Link>
            </div>
          </div>
        </div>

        {/* Faixa de Indicadores Rápidos */}
        <div className="grid grid-cols-4 border border-slate-300 bg-slate-50/50 text-center mb-3">
          <div className="p-1.5 border-r border-slate-300">
            <p className="text-[6pt] font-mono uppercase tracking-wider text-slate-500">Grau Canônico</p>
            <p className="text-[9pt] font-bold text-slate-900">{religioso?.grau || 'Pendente'}</p>
          </div>
          <div className="p-1.5 border-r border-slate-300">
            <p className="text-[6pt] font-mono uppercase tracking-wider text-slate-500">Ingresso na Formação</p>
            <p className="text-[9pt] font-bold text-slate-900">{anoIngresso}</p>
          </div>
          <div className="p-1.5 border-r border-slate-300">
            <p className="text-[6pt] font-mono uppercase tracking-wider text-slate-500">Data de Aprovação</p>
            <p className="text-[9pt] font-bold text-slate-900">{dataAprovacaoFormatada || 'Pendente'}</p>
          </div>
          <div className="p-1.5">
            <p className="text-[6pt] font-mono uppercase tracking-wider text-slate-500">Documentos Arquivados</p>
            <p className="text-[9pt] font-bold text-slate-900">{docsCount} de 10</p>
          </div>
        </div>

        {/* Bloco 1: Dados Pessoais & Documentação Civil Completa */}
        <div className="mb-3">
          <p className="text-[7pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-800 border-b border-slate-300 pb-0.5 mb-1.5">
            1. Dados Pessoais e Documentação Civil
          </p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-[8pt]">
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">Data de Nascimento</p>
              <p className="font-medium text-slate-900">{formatDate(religioso?.data_nascimento)}</p>
            </div>
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">Naturalidade</p>
              <p className="font-medium text-slate-900">{naturalidadeTexto}</p>
            </div>
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">Nacionalidade</p>
              <p className="font-medium text-slate-900">{religioso?.nacionalidade || 'Brasileira'}</p>
            </div>
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">CPF</p>
              <p className="font-mono font-medium text-slate-900">{formatCpfMask(religioso?.cpf)}</p>
            </div>
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">RG</p>
              <p className="font-mono font-medium text-slate-900">
                {religioso?.rg || '—'}{religioso?.rg_orgao_expedidor ? ` (${religioso.rg_orgao_expedidor})` : ''}
                {religioso?.rg_data_emissao ? ` · Emissão: ${formatDate(religioso.rg_data_emissao)}` : ''}
              </p>
            </div>
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">Título de Eleitor / PIS</p>
              <p className="font-mono font-medium text-slate-900">
                {religioso?.titulo_eleitor || '—'} {religioso?.pis ? `· PIS: ${religioso.pis}` : ''}
              </p>
            </div>
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">CNH / Passaporte</p>
              <p className="font-mono font-medium text-slate-900">
                {religioso?.cnh ? `CNH ${religioso.cnh}${religioso?.cnh_categoria ? ` (${religioso.cnh_categoria})` : ''}` : '—'}
                {religioso?.passaporte ? ` · Pass: ${religioso.passaporte}` : ''}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[6pt] font-mono uppercase text-slate-500">Filiação (Pai e Mãe)</p>
              <p className="font-medium text-slate-900">
                Pai: <span className="font-semibold">{paiNome}</span> · Mãe: <span className="font-semibold">{maeNome}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bloco de Lemas Vocacionais e Ministeriais */}
        {((Array.isArray(religioso?.lemas) && religioso.lemas.length > 0) || religioso?.lema_destacado) && (
          <div className="mb-3 border border-[#226380]/20 bg-[#226380]/5 p-2.5 rounded-sm">
            <p className="text-[7pt] font-mono uppercase tracking-[0.14em] font-bold text-[#226380] border-b border-[#226380]/20 pb-0.5 mb-1.5 flex items-center justify-between">
              <span>Lemas Vocacionais e Ministeriais</span>
              <span className="text-[6.5pt] font-normal normal-case text-slate-500">Província BRM</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {Array.isArray(religioso?.lemas) && religioso.lemas.length > 0 ? (
                religioso.lemas.map((lema: any, idx: number) => (
                  <div key={lema.id || idx} className={`p-1.5 rounded border text-[7.5pt] ${lema.destacado ? 'border-[#226380] bg-white shadow-xs font-semibold' : 'border-slate-200 bg-white/70'}`}>
                    <div className="flex items-center justify-between text-[6pt] font-mono uppercase text-slate-500 mb-0.5">
                      <span>{lema.fase}</span>
                      {lema.destacado && <span className="text-[#226380] font-bold">★ Principal</span>}
                    </div>
                    <p className="italic text-slate-800 font-serif">“{lema.texto}”</p>
                    {lema.referencia && <p className="text-[6.5pt] font-sans text-slate-500 mt-0.5 font-normal">Ref: {lema.referencia}</p>}
                  </div>
                ))
              ) : (
                <div className="p-1.5 rounded border border-[#226380] bg-white text-[7.5pt]">
                  <div className="flex items-center justify-between text-[6pt] font-mono uppercase text-slate-500 mb-0.5">
                    <span>{religioso?.lema_destacado_fase || 'Lema de Consagração'}</span>
                    <span className="text-[#226380] font-bold">★ Principal</span>
                  </div>
                  <p className="italic text-slate-800 font-serif">{religioso?.lema_destacado}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bloco 2: Saúde, Emergência & Contatos */}
        <div className="mb-3">
          <p className="text-[7pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-800 border-b border-slate-300 pb-0.5 mb-1.5">
            2. Saúde, Emergência e Contatos
          </p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-[8pt]">
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">Tipo Sanguíneo / Fator RH</p>
              <p className="font-mono font-bold text-slate-900">
                {canonicalData.saude?.tipo_sanguineo || 'Não informado'} {canonicalData.saude?.fator_rh || ''}
              </p>
            </div>
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">Plano de Saúde / SUS</p>
              <p className="font-medium text-slate-900">
                {canonicalData.saude?.plano_saude ? `${canonicalData.saude.plano_saude} (${canonicalData.saude.numero_plano_saude || 's/n'})` : 'SUS'}
                {canonicalData.saude?.sus ? ` · SUS: ${canonicalData.saude.sus}` : ''}
              </p>
            </div>
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">Contato de Emergência</p>
              <p className="font-medium text-slate-900 truncate">{contatoEmergenciaTexto}</p>
            </div>
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">Telefones (Celular / WhatsApp)</p>
              <p className="font-medium text-slate-900">
                {religioso?.telefone_celular || '—'} {religioso?.whatsapp && religioso.whatsapp !== religioso.telefone_celular ? `· Zap: ${religioso.whatsapp}` : ''}
              </p>
            </div>
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">E-mail Institucional</p>
              <p className="font-medium text-slate-900 truncate">{religioso?.email_institucional || '—'}</p>
            </div>
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">E-mail Pessoal</p>
              <p className="font-medium text-slate-900 truncate">{religioso?.email_pessoal || '—'}</p>
            </div>
            <div className="col-span-3">
              <p className="text-[6pt] font-mono uppercase text-slate-500">Endereço Residencial / Comunidade</p>
              <p className="font-medium text-slate-900">
                {(() => {
                  const res = canonicalData.residencia;
                  if (!res) return `Comunidade: ${religioso?.comunidade_atual_nome || 'Sede Provincial BRM'}`;
                  const p = res.logradouro?.includes('|') ? parseAddressString(res.logradouro) : null;
                  const logr = p?.logradouro || res.logradouro || '';
                  const num = res.numero || p?.numero || '';
                  const comp = res.complemento || p?.complemento || '';
                  const bair = res.bairro || p?.bairro || '';
                  const cid = res.cidade || p?.cidade || '';
                  const est = res.estado || p?.uf || '';
                  const cep = res.cep || p?.cep || '';
                  const parts: string[] = [];
                  if (logr) parts.push(logr + (num ? `, ${num}` : ''));
                  if (comp) parts.push(`(${comp})`);
                  if (bair) parts.push(bair);
                  if (cid || est) parts.push(`${cid}${est ? `/${est}` : ''}`);
                  if (cep) parts.push(`CEP: ${cep}`);
                  return parts.length > 0 ? parts.join(' - ') : `Comunidade: ${religioso?.comunidade_atual_nome || 'Sede Provincial BRM'}`;
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* Bloco 3: Trajetória Canônica (Linha do Tempo Visual Inteligente) */}
        <div className="mb-3">
          <p className="text-[7pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-800 border-b border-slate-300 pb-0.5 mb-1.5">
            3. Trajetória Canônica
          </p>
          <div className={`grid ${podeTerOrdenacao ? 'grid-cols-5' : 'grid-cols-4'} gap-2 text-center pt-1`}>
            {/* Card 1: Batismo */}
            <div className="border border-slate-300 p-1.5 bg-white shadow-xs">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-slate-800 mb-0.5" />
              <p className="text-[6pt] font-mono uppercase font-bold text-slate-600">Batismo</p>
              <p className="text-[7.5pt] font-bold text-slate-900 mt-0.5">{batismo?.data ? formatDate(batismo.data) : '—'}</p>
              {batismo?.paroquia && <p className="text-[6pt] text-slate-500 truncate">{batismo.paroquia}</p>}
            </div>

            {/* Card 2: Primeira Profissão */}
            <div className="border border-slate-300 p-1.5 bg-white shadow-xs">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-slate-800 mb-0.5" />
              <p className="text-[6pt] font-mono uppercase font-bold text-slate-600">Primeira Profissão</p>
              <p className="text-[7.5pt] font-bold text-slate-900 mt-0.5">{primVotos?.data ? formatDate(primVotos.data) : '—'}</p>
              {(primVotos?.cidade || primVotos?.local) && (
                <p className="text-[6pt] text-slate-500 truncate">
                  {[primVotos.cidade, primVotos.local].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            {/* Card 3: Profissão Perpétua */}
            <div className="border border-slate-300 p-1.5 bg-white shadow-xs">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-slate-800 mb-0.5" />
              <p className="text-[6pt] font-mono uppercase font-bold text-slate-600">Profissão Perpétua</p>
              <p className="text-[7.5pt] font-bold text-slate-900 mt-0.5">{perpVotos?.data ? formatDate(perpVotos.data) : '—'}</p>
              {(perpVotos?.cidade || perpVotos?.local) && (
                <p className="text-[6pt] text-slate-500 truncate">
                  {[perpVotos.cidade, perpVotos.local].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            {/* Card 4: Ministérios (Leitorado / Acolitado) */}
            <div className="border border-slate-300 p-1.5 bg-white shadow-xs">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-[#226380] mb-0.5" />
              <p className="text-[6pt] font-mono uppercase font-bold text-[#226380]">Ministérios</p>
              {ministeriosList.length > 0 ? (
                <div className="mt-0.5 space-y-0.5">
                  {ministeriosList.map((m, idx) => (
                    <div key={idx} className="text-[6.5pt] text-slate-800">
                      <span className="font-semibold">{m.tipo}:</span> {formatDate(m.data)}
                      {(m.cidade || m.local) && (
                        <span className="text-slate-500 text-[6pt]"> · {[m.cidade, m.local].filter(Boolean).join(', ')}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[7.5pt] font-medium text-slate-400 mt-0.5">—</p>
              )}
            </div>

            {/* Card 5: Ordenação (Apenas se Padre, Diácono ou Bispo - NUNCA Frater nem Irmão) */}
            {podeTerOrdenacao && (
              <div className="border border-slate-300 p-1.5 bg-white shadow-xs">
                <span className="inline-block w-3 h-3 rounded-full border-2 border-amber-600 mb-0.5" />
                <p className="text-[6pt] font-mono uppercase font-bold text-amber-700">{ordenacaoExibida.titulo}</p>
                <p className="text-[7.5pt] font-bold text-slate-900 mt-0.5">{ordenacaoExibida.data ? formatDate(ordenacaoExibida.data) : '—'}</p>
                {(ordenacaoExibida.cidade || ordenacaoExibida.local) && (
                  <p className="text-[6pt] text-slate-500 truncate">
                    {[ordenacaoExibida.cidade, ordenacaoExibida.local].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bloco 4: Iniciação Cristã e Origem Vocacional */}
        <div className="mb-3">
          <p className="text-[7pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-800 border-b border-slate-300 pb-0.5 mb-1.5">
            4. Iniciação Cristã e Origem Vocacional
          </p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-[8pt]">
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">Paróquia / Cidade / Diocese de Origem</p>
              <p className="font-medium text-slate-900">
                {canonicalData.origemVocacional?.paroquia_origem || '—'}
                {canonicalData.origemVocacional?.cidade ? ` · ${canonicalData.origemVocacional.cidade}` : ''}
                {canonicalData.origemVocacional?.diocese ? ` (${canonicalData.origemVocacional.diocese})` : ''}
              </p>
            </div>
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">Promotor Vocacional</p>
              <p className="font-medium text-slate-900">{canonicalData.origemVocacional?.promotor_vocacional || '—'}</p>
            </div>
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">Registro de Batismo (Livro / Folha / Nº)</p>
              <p className="font-mono text-slate-900">
                {batismo?.livro ? `Lv. ${batismo.livro}` : ''} {batismo?.folha ? `Fl. ${batismo.folha}` : ''} {batismo?.numero_registro ? `Nº ${batismo.numero_registro}` : (batismo ? 'Certidão anexada' : '—')}
              </p>
            </div>
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">Primeira Eucaristia</p>
              <p className="font-medium text-slate-900">
                {primeiraEucaristia?.data ? `${formatDate(primeiraEucaristia.data)} · ${primeiraEucaristia.paroquia || ''}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">Crisma</p>
              <p className="font-medium text-slate-900">
                {crisma?.data ? `${formatDate(crisma.data)} · ${crisma.paroquia || ''}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500">Ordenação Diaconal (se aplicável)</p>
              <p className="font-medium text-slate-900">
                {ordenacaoDiaconal?.data ? `${formatDate(ordenacaoDiaconal.data)} (${[ordenacaoDiaconal.cidade, ordenacaoDiaconal.local].filter(Boolean).join(' · ') || '—'})` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Bloco 5: Formação Inicial (Trajetória Formativa Vocacional em Cartões) */}
        {etapasFormacaoInicial.length > 0 && (
          <div className="mb-3">
            <p className="text-[7pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-800 border-b border-slate-300 pb-0.5 mb-1.5">
              5. Formação Inicial (Trajetória Formativa Vocacional)
            </p>
            <div className={`grid grid-cols-${Math.min(etapasFormacaoInicial.length, 5)} gap-2 text-center pt-1`}>
              {etapasFormacaoInicial.map((f: any, idx: number) => {
                const pIni = f.data_ingresso ? extrairAno(f.data_ingresso) : '';
                const pFim = f.data_conclusao ? extrairAno(f.data_conclusao) : '';
                const etapaNome = f.etapa || 'Etapa';
                const isConfiguracao = etapaNome.toLowerCase().includes('configur');
                const isConventinho = (f.instituicao || f.local || '').toLowerCase().includes('conventinho') ||
                                      (f.cidade || '').toLowerCase().includes('taubat') ||
                                      (religioso?.comunidade_atual_nome || '').toLowerCase().includes('conventinho');
                const grauNorm = (religioso?.grau || '').toLowerCase();
                const isFraterOuDiacono = grauNorm.includes('frater') || grauNorm.includes('diác') || grauNorm.includes('diac');
                const anoAtual = new Date().getFullYear();
                const anoIniNum = pIni && !Number.isNaN(Number(pIni)) ? Number(pIni) : anoAtual;
                const isConventinhoAtivo = isFraterOuDiacono && (isConfiguracao || isConventinho) && (!pFim || Number(pFim) >= anoAtual);
                const anoTeologia = isConventinhoAtivo ? Math.max(1, Math.min(4, anoAtual - anoIniNum + 1)) : undefined;

                const periodoStr = isConventinhoAtivo
                  ? `${anoIniNum} - Fase Atual (${anoTeologia}º Ano)`
                  : (pIni && pFim ? (pIni === pFim ? pIni : `${pIni} - ${pFim}`) : (pIni ? `${pIni} - Concluído` : 'Formativo'));

                return (
                  <div key={`form-card-${idx}`} className={`border p-1.5 shadow-xs flex flex-col justify-between ${isConventinhoAtivo ? 'border-sky-400 bg-sky-50/40' : 'border-slate-300 bg-white'}`}>
                    <div>
                      <span className={`inline-block px-1 py-0.5 font-mono text-[6pt] font-bold uppercase rounded mb-0.5 ${isConventinhoAtivo ? 'bg-sky-100 text-sky-900 border border-sky-300' : 'bg-sky-50 text-sky-800 border border-sky-200'}`}>
                        {f.etapa || 'Etapa'} {isConventinhoAtivo ? '• Fase Atual' : ''}
                      </span>
                      <p className={`text-[7.5pt] font-bold mt-0.5 ${isConventinhoAtivo ? 'text-sky-900' : 'text-slate-900'}`}>{periodoStr}</p>
                      <p className="text-[6.5pt] font-semibold text-slate-800 line-clamp-1">{f.instituicao || f.local || 'Casa Formativa'}</p>
                      {anoTeologia && <p className="text-[6pt] font-bold text-sky-700 mt-0.5">{anoTeologia}º Ano de Teologia</p>}
                    </div>
                    <div className="mt-1 border-t border-slate-100 pt-0.5 text-[6pt] text-slate-500">
                      <p className="truncate">{f.cidade || '—'}</p>
                      {f.formador && <p className="italic text-slate-600 truncate">Formador: {f.formador}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bloco 6: Trajetória de Comunidades e Trabalhos */}
        <div className="mb-3">
          <p className="text-[7pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-800 border-b border-slate-300 pb-0.5 mb-1.5">
            6. Trajetória de Comunidades e Trabalhos (Obras, Comunidades e Ofícios a partir do Tirocínio)
          </p>
          <div className="space-y-1 text-[7.5pt]">
            {(etapasTirocinio.length > 0) || (canonicalData.historicoComunidades && canonicalData.historicoComunidades.length > 0) || (canonicalData.designacoes && canonicalData.designacoes.length > 0) ? (
              <table className="w-full border-collapse text-[7.5pt]">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 font-mono text-[6.5pt] uppercase">
                    <th className="text-left py-1 w-24">Período</th>
                    <th className="text-left py-1">Comunidade</th>
                    <th className="text-left py-1">Obra / Atividade</th>
                    <th className="text-left py-1">Fase / Grau</th>
                    <th className="text-left py-1">Ofício / Função</th>
                    <th className="text-left py-1">Localidade & Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {etapasTirocinio.map((f: any, idx: number) => {
                    const pIni = f.data_ingresso ? extrairAno(f.data_ingresso) : '';
                    const pFim = f.data_conclusao ? extrairAno(f.data_conclusao) : '';
                    const periodoStr = pIni && pFim ? (pIni === pFim ? pIni : `${pIni} - ${pFim}`) : (pIni ? `${pIni} - Concluído` : 'Formativo');
                    return (
                      <tr key={`tiroc-${idx}`} className="py-0.5">
                        <td className="font-mono text-slate-500 py-0.5">{periodoStr}</td>
                        <td className="font-semibold text-slate-900 py-0.5">{f.instituicao || f.local || 'Comunidade do Tirocínio'}</td>
                        <td className="text-slate-700 py-0.5">{f.instituicao || 'Tirocínio Pastoral'}</td>
                        <td className="py-0.5">
                          <span className="font-mono text-[6.5pt] bg-sky-50 text-sky-800 border border-sky-200 px-1 py-0.2 rounded">
                            Tirocínio
                          </span>
                        </td>
                        <td className="text-[#226380] font-medium py-0.5">Tirocinante / Pastoral</td>
                        <td className="text-slate-600 py-0.5">{[f.cidade, f.formador ? `Superior da Comunidade: ${f.formador}` : (f.superior ? `Superior da Comunidade: ${f.superior}` : null)].filter(Boolean).join(' • ') || 'Província BRM'}</td>
                      </tr>
                    );
                  })}
                  {canonicalData.historicoComunidades.map((h: any, idx: number) => {
                    const pIni = h.periodo_inicio ? extrairAno(h.periodo_inicio) : '';
                    const pFim = h.periodo_fim ? extrairAno(h.periodo_fim) : '';
                    const periodoStr = pIni && pFim ? (pIni === pFim ? pIni : `${pIni} - ${pFim}`) : (pIni ? `${pIni} - Atual` : '—');
                    return (
                      <tr key={`hist-${idx}`} className="py-0.5">
                        <td className="font-mono text-slate-500 py-0.5">{periodoStr}</td>
                        <td className="font-semibold text-slate-900 py-0.5">{h.instituicao}</td>
                        <td className="text-slate-700 py-0.5">{h.instituicao}</td>
                        <td className="py-0.5">
                          <span className="font-mono text-[6.5pt] bg-slate-50 text-slate-700 border border-slate-200 px-1 py-0.2 rounded">
                            {religioso?.grau || 'Religioso'}
                          </span>
                        </td>
                        <td className="text-[#226380] font-medium py-0.5">{h.funcao || 'Atuação Pastoral'}</td>
                        <td className="text-slate-600 py-0.5">{[h.cidade || h.local, h.observacoes].filter(Boolean).join(' • ') || '—'}</td>
                      </tr>
                    );
                  })}
                  {canonicalData.designacoes.map((d: any, idx: number) => {
                    const pInicio = d.vigencia_inicio ? extrairAno(d.vigencia_inicio) : d.ano_referencia;
                    const pFim = d.vigencia_fim ? extrairAno(d.vigencia_fim) : 'Atual';
                    const localidade = [d.comunidades?.cidade, d.religiosos_obras_referencia?.cidade].filter(Boolean)[0] || 'Província BRM';
                    return (
                      <tr key={`desig-${idx}`} className="py-0.5">
                        <td className="font-mono text-slate-500 py-0.5">
                          {pInicio ? (pInicio === pFim ? String(pInicio) : `${pInicio} - ${pFim}`) : (d.ano_referencia || 'Vigente')}
                        </td>
                        <td className="font-semibold text-slate-900 py-0.5">
                          {formatarComunidadeReligiosa(d.comunidades?.nome) || 'Comunidade Provincial'}
                        </td>
                        <td className="text-slate-700 py-0.5">
                          {d.religiosos_obras_referencia?.nome || 'Atuação Pastoral / Paróquia'}
                        </td>
                        <td className="py-0.5">
                          <span className="font-mono text-[6.5pt] bg-slate-50 text-slate-700 border border-slate-200 px-1 py-0.2 rounded">
                            {religioso?.grau || 'Consagrado'}
                          </span>
                        </td>
                        <td className="text-[#226380] font-medium py-0.5">{d.funcao || d.tipo_vinculo || 'Membro'}</td>
                        <td className="text-slate-600 py-0.5">{[localidade, d.numero_decreto ? `Dec. ${d.numero_decreto}` : null].filter(Boolean).join(' • ')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500 italic py-2 text-center text-[7pt]">
                Religioso em etapa formativa inicial. As designações de comunidades e trabalhos têm início a partir do Tirocínio.
              </p>
            )}
          </div>
        </div>

        {/* Bloco 6: Formação Acadêmica e Idiomas */}
        <div className="mb-3">
          <p className="text-[7pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-800 border-b border-slate-300 pb-0.5 mb-1.5">
            6. Formação Acadêmica, Formativa e Idiomas
          </p>
          <div className="grid grid-cols-2 gap-x-6 text-[8pt]">
            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500 mb-0.5">Estudos Acadêmicos e Formações</p>
              {canonicalData.academica.length > 0 ? (
                <ul className="space-y-0.5">
                  {canonicalData.academica.slice(0, 4).map((c, idx) => (
                    <li key={idx} className="text-slate-900">
                      <span className="font-semibold">{c.categoria}:</span> {c.instituicao} {c.periodo ? `(${c.periodo})` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic">Filosofia e Teologia nos centros provinciais.</p>
              )}
            </div>

            <div>
              <p className="text-[6pt] font-mono uppercase text-slate-500 mb-0.5">Idiomas Declarados</p>
              {canonicalData.idiomas.length > 0 ? (
                <div className="flex flex-wrap gap-2 text-slate-900">
                  {canonicalData.idiomas.map((i, idx) => (
                    <span key={idx} className="inline-block border border-slate-200 px-1.5 py-0.5 text-[7pt] bg-slate-50">
                      <strong>{i.idioma}</strong>: {i.nivel || i.fala || 'Básico'}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic">Português (nativo).</p>
              )}
            </div>
          </div>
        </div>

        {/* Bloco 7: Documentos do Arquivo (Checklist Canônico Oficial) */}
        <div className="mb-4">
          <div className="flex items-center justify-between border-b border-slate-300 pb-0.5 mb-1.5">
            <p className="text-[7pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-800">
              7. Checklist de Documentos Canônicos Arquivados
            </p>
            <span className="text-[6pt] font-mono text-slate-500">✓ = arquivado no Arquivo Provincial</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-[7.5pt]">
            {docCategories.map((doc, idx) => {
              const checked = hasDoc(doc.match);
              return (
                <div key={idx} className="flex items-center gap-1.5 py-0.5">
                  <span className={`w-3 h-3 flex items-center justify-center border text-[7.5pt] font-bold ${
                    checked ? 'border-slate-900 bg-white text-slate-900' : 'border-slate-400 text-transparent'
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

        {/* Assinaturas Institucionais com espaço amplo para caneta */}
        <div className="mt-12 pt-6 grid grid-cols-2 gap-12 text-center text-[7.5pt]">
          <div className="pt-8">
            <div className="border-t border-slate-900 mx-auto w-52 mb-1.5" />
            <p className="font-semibold text-slate-900">{atribuirNomeReligioso(religioso?.grau, religioso?.nome_civil) || religioso?.nome_religioso || religioso?.nome_civil}</p>
            <p className="text-[6pt] text-slate-500 uppercase tracking-wider">Assinatura do Religioso</p>
          </div>
          <div className="pt-8">
            <div className="border-t border-slate-900 mx-auto w-52 mb-1.5" />
            <p className="font-semibold text-slate-900">Chancelaria · Arquivo Provincial</p>
            <p className="text-[6pt] text-slate-500 uppercase tracking-wider">Assinatura e carimbo oficial</p>
          </div>
        </div>

        {/* Rodapé de autenticação */}
        <footer className="mt-5 pt-2 border-t border-slate-300 flex justify-between text-[6.5pt] font-mono text-slate-500">
          <span>Emitido eletronicamente pelo Sistema BRM em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · Província Brasileira Meridional</span>
          <span>Documento reservado canônico · Protegido pela LGPD</span>
        </footer>
      </div>

      <div className="space-y-5 pb-8 dossie-no-print print:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/religiosos')}
            className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenPublishModal}
              disabled={preparingPublish}
              className="inline-flex items-center gap-2 border border-[#226380] bg-[#226380] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1b4f66] shadow-sm cursor-pointer disabled:opacity-50"
            >
              {preparingPublish ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
              <span>Publicar no Site Oficial</span>
            </button>

            <button
              type="button"
              onClick={handleExportarGotenberg}
              disabled={exportandoGotenberg}
              className="inline-flex items-center gap-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 transition hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm cursor-pointer disabled:opacity-50"
              title="Emitir PDF canônico com Brasão Dehoniano e trajetória completa via microserviço Gotenberg"
            >
              {exportandoGotenberg ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#226380]" /> : <Download className="h-3.5 w-3.5 text-[#226380]" />}
              <span>Emitir Ficha Oficial (Gotenberg PDF)</span>
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
        </div>

        {loading || !religioso ? (
          <div className="flex min-h-[40vh] items-center justify-center border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#161b22]">
            <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
          </div>
        ) : (
          <div className="dossie-sheet space-y-5 rounded-none border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt={religioso.nome_religioso || religioso.nome_civil}
                    className="h-14 w-14 aspect-square rounded-lg border-2 border-[#226380] object-cover shadow-sm shrink-0"
                  />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-white/5 dark:text-slate-200 shrink-0">
                    <UserRound className="h-6 w-6" />
                  </span>
                )}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Arquivo Provincial</p>
                  <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{atribuirNomeReligioso(religioso?.grau, religioso?.nome_civil) || religioso.nome_religioso || religioso.nome_civil}</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{religioso.nome_civil} • {religioso.grau || 'Grau pendente'}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="inline-flex border border-[#226380]/20 bg-[#226380]/5 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-[#226380] dark:border-[#A3C3C7]/20 dark:bg-[#A3C3C7]/10 dark:text-[#A3C3C7]">
                      Cadastro {formatRegistrationNumber(religioso.numero_cadastro, religioso.created_at)}
                    </p>
                    {religioso.publicado_site_em && (
                      <span className="inline-flex items-center gap-1.5 border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        No site: {formatDate(religioso.publicado_site_em)}
                      </span>
                    )}
                    {religioso.publicado_site_id && (
                      <a
                        href={`${sitePublicUrl.replace(/\/$/, '')}/institucional/religioso?id=${religioso.publicado_site_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#226380] hover:underline dark:text-[#A3C3C7]"
                      >
                        <span>Ver no site</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className={`inline-flex px-2.5 py-1 text-[10px] font-medium ${statusClass[religioso.status_cadastro] || statusClass.Arquivado}`}>
                    {religioso.status_cadastro}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHistoricoModal(true)}
                    className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    title="Ver histórico de revisões e auditoria"
                  >
                    <History className="h-3 w-3 text-[#113240] dark:text-[#b58a55]" />
                    <span>Histórico ({historico.length})</span>
                  </button>
                </div>
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
              <div
                onClick={() => setShowHistoricoModal(true)}
                className="group cursor-pointer border border-slate-200 bg-slate-50 p-4 transition hover:border-[#113240]/40 dark:border-slate-800 dark:bg-white/[0.02] dark:hover:border-[#b58a55]/40"
                title="Clique para ver o histórico completo"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Última revisão</p>
                  <History className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#113240] dark:group-hover:text-[#b58a55]" />
                </div>
                <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{historico[0] ? formatDate(historico[0].criado_em) : '—'}</p>
                <p className="mt-1 text-[11px] font-medium text-[#226380] dark:text-[#A3C3C7]">Ver histórico ({historico.length}) →</p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-white/[0.02]">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Origem</p>
                <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{religioso.origem_cadastro || '—'}</p>
              </div>
            </div>

            {/* FICHA GERAL E CONTA DE ACESSO LADO A LADO */}
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="border border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#113240] dark:text-[#b58a55]" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-200">Ficha geral</h2>
                </div>

                <dl className="grid gap-3 sm:grid-cols-2">
                  <div><dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Nome civil</dt><dd className="mt-1 text-sm text-slate-900 dark:text-white">{religioso.nome_civil || '—'}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Nome religioso (atribuído)</dt><dd className="mt-1 text-sm text-slate-900 dark:text-white">{atribuirNomeReligioso(religioso?.grau, religioso?.nome_civil) || padronizarSufixoSCJ(religioso.nome_religioso) || '—'}</dd></div>
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

            {/* GESTOR DE DOCUMENTOS E PASTAS DO ARQUIVO (ESTILO NEXTCLOUD / EXPLORER) */}
            <section className="border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
              {/* Barra Superior do Explorer */}
              <div className="dossie-no-print border-b border-slate-200 p-4 dark:border-slate-800">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  {/* Breadcrumbs de Navegação */}
                  <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <button
                      type="button"
                      onClick={() => setCurrentFolder('all')}
                      className="flex items-center gap-1 font-semibold hover:text-[#113240] dark:hover:text-[#b58a55]"
                      title="Ir para a raiz do arquivo"
                    >
                      <Archive className="h-3.5 w-3.5 text-[#113240] dark:text-[#b58a55]" />
                      <span>Arquivo Provincial</span>
                    </button>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-medium text-slate-500 dark:text-slate-400">
                      {religioso.nome_civil}
                    </span>
                    {currentFolder !== 'all' && (
                      <>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {currentFolder}
                        </span>
                      </>
                    )}
                  </nav>

                  {/* Ações e Filtro de Busca */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar arquivo..."
                        value={searchDocTerm}
                        onChange={e => setSearchDocTerm(e.target.value)}
                        className="h-8 w-44 rounded border border-slate-200 bg-slate-50 pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 focus:border-[#113240] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-[#b58a55] sm:w-56"
                      />
                      {searchDocTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchDocTerm('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Alternador de Visualização (Grade / Lista) */}
                    <div className="flex items-center rounded border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
                      <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        className={`rounded p-1.5 transition ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
                        title="Visão em Grade (Explorer)"
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`rounded p-1.5 transition ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
                        title="Visão em Lista Detalhada"
                      >
                        <List className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Download em lote */}
                    {selectedDocumentIds.size > 0 && (
                      <button
                        type="button"
                        onClick={() => void handleBatchDownload()}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        title="Baixar documentos marcados"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Baixar ({selectedDocumentIds.size})</span>
                      </button>
                    )}

                    {/* Botão Novo Documento */}
                    <button
                      type="button"
                      onClick={() => {
                        if (currentFolder !== 'all') {
                          setArchiveCategory(currentFolder);
                        }
                        setShowUploadModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded bg-[#113240] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#194b5d] dark:bg-[#226380] dark:hover:bg-[#1b4f66]"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Novo Documento</span>
                    </button>
                  </div>
                </div>

                {/* Chips de Pastas / Categorias */}
                <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setCurrentFolder('all')}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-medium transition ${
                      currentFolder === 'all'
                        ? 'bg-[#113240] text-white shadow-xs dark:bg-[#226380]'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FolderClosed className="h-3.5 w-3.5" />
                    <span>Todas as Pastas</span>
                    <span className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] ${currentFolder === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                      {documentos.length}
                    </span>
                  </button>

                  {foldersWithCounts.map(([folderName, count]) => (
                    <button
                      key={folderName}
                      type="button"
                      onClick={() => setCurrentFolder(folderName)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-medium transition ${
                        currentFolder === folderName
                          ? 'bg-[#113240] text-white shadow-xs dark:bg-[#226380]'
                          : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <FolderClosed className="h-3.5 w-3.5" />
                      <span>{folderName}</span>
                      <span className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] ${currentFolder === folderName ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Relação de documentos para checklist na impressão oficial */}
              <div className="dossie-print-only border-b border-slate-300 p-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide">Relação de documentos selecionados</h2>
                <p className="mt-1 text-xs">Religioso: {religioso.nome_religioso || religioso.nome_civil} · {selectedDocuments.length} documento(s)</p>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs">
                  {selectedDocuments.map(documento => (
                    <li key={documento.id}>{documento.categoria} — {documento.titulo || documento.nome_arquivo} ({documento.nome_arquivo})</li>
                  ))}
                </ol>
              </div>

              {/* Área de Conteúdo do Explorer */}
              <div className="dossie-no-print p-4">
                {/* Visualização de Cartões de Pastas no topo (estilo Nextcloud / Drive) quando em Todas as Pastas */}
                {currentFolder === 'all' && !searchDocTerm && foldersWithCounts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Pastas do Arquivo ({foldersWithCounts.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {foldersWithCounts.map(([folderName, count]) => (
                        <button
                          key={folderName}
                          type="button"
                          onClick={() => setCurrentFolder(folderName)}
                          className="group flex flex-col items-start rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-left transition hover:border-[#113240]/40 hover:bg-white hover:shadow-xs dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-[#b58a55]/40 dark:hover:bg-slate-800"
                        >
                          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-[#226380]/10 text-[#226380] transition group-hover:scale-105 group-hover:bg-[#113240] group-hover:text-white dark:bg-[#A3C3C7]/10 dark:text-[#A3C3C7] dark:group-hover:bg-[#b58a55] dark:group-hover:text-slate-900">
                            <FolderClosed className="h-4 w-4" />
                          </div>
                          <p className="w-full truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{folderName}</p>
                          <p className="mt-0.5 text-[10px] text-slate-500">{count} documento(s)</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cabeçalho da Lista / Ações de Seleção */}
                <div className="mb-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {currentFolder === 'all' ? 'Todos os Arquivos' : currentFolder}
                    </span>
                    <span>•</span>
                    <span>{filteredDocuments.length} documento(s)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-[11px] font-medium text-[#226380] hover:underline dark:text-[#A3C3C7]"
                    >
                      {filteredDocuments.length > 0 && filteredDocuments.every(d => selectedDocumentIds.has(d.id))
                        ? 'Desmarcar todos'
                        : 'Selecionar todos'}
                    </button>
                  </div>
                </div>

                {/* Grade ou Tabela de Documentos */}
                {filteredDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                      <FolderOpen className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {searchDocTerm ? 'Nenhum documento encontrado para a busca.' : 'Esta pasta está vazia.'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Clique em "Novo Documento" para arquivar novos comprovantes, cartas ou certidões.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentFolder !== 'all') setArchiveCategory(currentFolder);
                        setShowUploadModal(true);
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 rounded bg-[#113240] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#194b5d]"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Enviar Documento</span>
                    </button>
                  </div>
                ) : viewMode === 'grid' ? (
                  /* VISÃO EM GRADE (NEXTCLOUD CARDS) */
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {filteredDocuments.map(doc => {
                      const meta = getFileMeta(doc.nome_arquivo, doc.mime_type);
                      const isChecked = selectedDocumentIds.has(doc.id);

                      return (
                        <div
                          key={doc.id}
                          className={`group relative flex flex-col justify-between rounded-lg border transition hover:shadow-md ${
                            isChecked
                              ? 'border-[#226380] bg-[#226380]/5 dark:border-[#A3C3C7] dark:bg-[#A3C3C7]/5'
                              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
                          }`}
                        >
                          {/* Barra superior do card */}
                          <div className="flex items-center justify-between border-b border-slate-100 p-2.5 dark:border-slate-800">
                            <label className="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleDocumentSelection(doc.id)}
                                aria-label={`Incluir ${doc.nome_arquivo} no checklist`}
                                className="h-4 w-4 rounded border-slate-300 text-[#113240] focus:ring-[#113240]"
                              />
                              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                                {doc.storage_bucket === 'religiosos-documentos' ? 'Portal' : 'Secretaria'}
                              </span>
                            </label>
                            <span className="truncate max-w-[120px] rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300" title={doc.categoria || 'Arquivo'}>
                              {doc.categoria || 'Arquivo'}
                            </span>
                          </div>

                          {/* Centro com Ícone / Tipo de Arquivo */}
                          <div
                            onClick={() => void handleOpenPreview(doc)}
                            className="flex cursor-pointer flex-col items-center justify-center py-6 px-3 transition group-hover:scale-102"
                            title="Clique para pré-visualizar"
                          >
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800">
                              {meta.isPdf ? (
                                <div className="flex flex-col items-center text-rose-600 dark:text-rose-400">
                                  <FileText className="h-8 w-8" />
                                  <span className="absolute -bottom-1 rounded bg-rose-600 px-1 text-[8px] font-bold text-white uppercase">PDF</span>
                                </div>
                              ) : meta.isImg ? (
                                <div className="flex flex-col items-center text-emerald-600 dark:text-emerald-400">
                                  <FileImage className="h-8 w-8" />
                                  <span className="absolute -bottom-1 rounded bg-emerald-600 px-1 text-[8px] font-bold text-white uppercase">IMG</span>
                                </div>
                              ) : meta.isDoc ? (
                                <div className="flex flex-col items-center text-blue-600 dark:text-blue-400">
                                  <FileText className="h-8 w-8" />
                                  <span className="absolute -bottom-1 rounded bg-blue-600 px-1 text-[8px] font-bold text-white uppercase">DOC</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center text-slate-600 dark:text-slate-400">
                                  <FileText className="h-8 w-8" />
                                  <span className="absolute -bottom-1 rounded bg-slate-600 px-1 text-[8px] font-bold text-white uppercase">{meta.ext || 'ARQ'}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Detalhes do Documento */}
                          <div className="border-t border-slate-100 p-3 dark:border-slate-800">
                            <p
                              className="truncate text-xs font-semibold text-slate-900 dark:text-white"
                              title={doc.titulo || doc.nome_arquivo}
                            >
                              {doc.titulo || doc.nome_arquivo}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500" title={doc.nome_arquivo}>
                              {doc.nome_arquivo}
                            </p>
                            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                              <span>{formatBytes(doc.tamanho_bytes)}</span>
                              <span>{formatDate(doc.data_cadastro || doc.criado_em)}</span>
                            </div>

                            {/* Botões de Ação Rápida */}
                            <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <button
                                type="button"
                                onClick={() => void handleOpenPreview(doc)}
                                className="flex flex-1 items-center justify-center gap-1 rounded border border-slate-200 bg-white py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Visualizar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDownload(doc)}
                                className="flex flex-1 items-center justify-center gap-1 rounded border border-slate-200 bg-white py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                title="Baixar arquivo"
                              >
                                <Download className="h-3 w-3" />
                                <span>Baixar</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* VISÃO EM TABELA / LISTA DETALHADA */
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
                        <tr>
                          <th className="w-10 px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={filteredDocuments.length > 0 && filteredDocuments.every(d => selectedDocumentIds.has(d.id))}
                              onChange={handleSelectAllFiltered}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-[#113240] focus:ring-[#113240]"
                            />
                          </th>
                          <th className="px-3 py-2.5">Documento</th>
                          <th className="px-3 py-2.5">Pasta / Categoria</th>
                          <th className="px-3 py-2.5">Tamanho</th>
                          <th className="px-3 py-2.5">Data</th>
                          <th className="px-3 py-2.5">Enviado por</th>
                          <th className="px-3 py-2.5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredDocuments.map(doc => {
                          const meta = getFileMeta(doc.nome_arquivo, doc.mime_type);
                          const isChecked = selectedDocumentIds.has(doc.id);

                          return (
                            <tr
                              key={doc.id}
                              className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition ${isChecked ? 'bg-[#226380]/5 dark:bg-[#A3C3C7]/5' : ''}`}
                            >
                              <td className="px-3 py-2.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleDocumentSelection(doc.id)}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#113240] focus:ring-[#113240]"
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-100 dark:bg-slate-800">
                                    {meta.isPdf ? (
                                      <FileText className="h-4 w-4 text-rose-500" />
                                    ) : meta.isImg ? (
                                      <FileImage className="h-4 w-4 text-emerald-500" />
                                    ) : meta.isDoc ? (
                                      <FileText className="h-4 w-4 text-blue-500" />
                                    ) : (
                                      <FileText className="h-4 w-4 text-slate-500" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold text-slate-900 dark:text-white" title={doc.titulo || doc.nome_arquivo}>
                                      {doc.titulo || doc.nome_arquivo}
                                    </p>
                                    <p className="truncate text-[10px] text-slate-400" title={doc.nome_arquivo}>
                                      {doc.nome_arquivo}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {doc.categoria || 'Geral'}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-slate-500">
                                {formatBytes(doc.tamanho_bytes)}
                              </td>
                              <td className="px-3 py-2.5 text-slate-500">
                                {formatDate(doc.data_cadastro || doc.criado_em)}
                              </td>
                              <td className="px-3 py-2.5 text-slate-500">
                                {doc.enviado_por_nome || doc.quem_cadastrou || (doc.storage_bucket === 'religiosos-documentos' ? 'Portal' : 'Secretaria')}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => void handleOpenPreview(doc)}
                                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                                    title="Visualizar"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDownload(doc)}
                                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                                    title="Baixar"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Indicação de checklist para impressão */}
                {selectedDocuments.length > 0 && (
                  <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                    ✓ {selectedDocuments.length} documento(s) selecionado(s) para o checklist da ficha canônica impressa.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* MODAL DE UPLOAD DE DOCUMENTO (NEXTCLOUD STYLE) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in dossie-no-print">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#161b22]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#226380]/10 text-[#226380] dark:bg-[#226380]/20">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Arquivar Documento no Dossiê
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    O documento será armazenado com segurança no arquivo provincial.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={(e) => void uploadArchiveDocument(e)} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pasta / Categoria
                </label>
                <select
                  value={archiveCategory}
                  onChange={e => setArchiveCategory(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#113240] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Título do Documento *
                </label>
                <input
                  required
                  maxLength={200}
                  placeholder="ex: Certidão de Batismo, Provisão 2026..."
                  value={archiveTitle}
                  onChange={e => setArchiveTitle(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#113240] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Arquivo (PDF, Imagem, DOC ou DOCX; até 50 MB) *
                </label>
                <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6 transition hover:border-[#113240] dark:border-slate-700 dark:hover:border-[#b58a55]">
                  <Upload className="h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {archiveFile ? archiveFile.name : 'Clique para selecionar um arquivo do seu computador'}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {archiveFile ? `${formatBytes(archiveFile.size)} selecionado` : 'PDF, JPEG, PNG, TIFF, DOC, DOCX até 50 MB'}
                  </p>
                  <input
                    type="file"
                    required={!archiveFile}
                    accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff,.doc,.docx"
                    onChange={handleArchiveFile}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Observação interna (opcional)
                </label>
                <input
                  maxLength={1000}
                  placeholder="Notas adicionais sobre este arquivo..."
                  value={archiveNote}
                  onChange={e => setArchiveNote(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#113240] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={archiveSaving || !archiveFile || !archiveTitle.trim()}
                  className="inline-flex items-center gap-1.5 rounded bg-[#113240] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#194b5d] disabled:opacity-50"
                >
                  {archiveSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  <span>Arquivar Documento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE HISTÓRICO DE REVISÃO E AUDITORIA */}
      {showHistoricoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in dossie-no-print">
          <div className="flex flex-col w-full max-w-xl max-h-[85vh] rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#161b22]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#226380]/10 text-[#226380] dark:bg-[#226380]/20">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Histórico de Revisão e Auditoria
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Registro cronológico de aprovações e tramitações da ficha.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoricoModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {historico.length ? (
                historico.map(evento => (
                  <div key={evento.id} className="rounded-lg border border-slate-200 p-3.5 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`inline-flex px-2 py-0.5 text-[9px] font-medium rounded ${statusClass[evento.status_novo] || statusClass.Arquivado}`}>
                        {evento.status_novo}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDate(evento.criado_em)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {evento.ator_nome}
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {evento.observacao || 'Sem observação registrada.'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  Ainda não há histórico de revisão registrado para este religioso.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end border-t border-slate-200 p-3.5 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowHistoricoModal(false)}
                className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PRÉ-VISUALIZAÇÃO DE ARQUIVO */}
      {previewDoc.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-sm animate-fade-in dossie-no-print">
          <div className="flex flex-col w-full max-w-4xl max-h-[90vh] rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#161b22]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="h-5 w-5 text-[#226380] dark:text-[#A3C3C7] shrink-0" />
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {previewDoc.title}
                  </h3>
                  <p className="truncate text-[10px] text-slate-500">
                    {previewDoc.fileName} {previewDoc.documento ? `• ${formatBytes(previewDoc.documento.tamanho_bytes)}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {previewDoc.documento && (
                  <button
                    type="button"
                    onClick={() => previewDoc.documento && void handleDownload(previewDoc.documento)}
                    className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Baixar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Conteúdo da Visualização */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/70 dark:bg-slate-950/50 min-h-[400px]">
              {previewDoc.loading ? (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin text-[#113240] dark:text-[#b58a55]" />
                  <p className="text-xs">Carregando arquivo...</p>
                </div>
              ) : previewDoc.url ? (
                previewDoc.mimeType.includes('pdf') || previewDoc.fileName.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewDoc.url}
                    title={previewDoc.title}
                    className="w-full h-[70vh] rounded border border-slate-200 bg-white dark:border-slate-800"
                  />
                ) : previewDoc.mimeType.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)$/i.test(previewDoc.fileName) ? (
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.title}
                    className="max-h-[70vh] max-w-full rounded object-contain shadow-md"
                  />
                ) : (
                  <div className="text-center p-6">
                    <FileText className="mx-auto h-12 w-12 text-slate-400" />
                    <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                      Visualização direta não disponível para este formato no navegador.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Você pode baixar o arquivo para abri-lo em seu dispositivo.
                    </p>
                    {previewDoc.documento && (
                      <button
                        type="button"
                        onClick={() => previewDoc.documento && void handleDownload(previewDoc.documento)}
                        className="mt-4 inline-flex items-center gap-2 rounded bg-[#113240] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#194b5d]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Baixar {previewDoc.fileName}</span>
                      </button>
                    )}
                  </div>
                )
              ) : (
                <p className="text-xs text-slate-500">Arquivo indisponível para pré-visualização.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE REVISÃO E CONFIRMAÇÃO: PUBLICAR NO SITE OFICIAL */}
      {showPublishModal && publishPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in dossie-no-print">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#161b22]">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#226380]/10 text-[#226380] dark:bg-[#226380]/20">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Publicar Religioso no Site Oficial
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sincronização com o portal público ({sitePublicUrl})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corpo do Modal com Scroll */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
              {/* Card de Resumo do Religioso com Foto 4x4 */}
              <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                {publishPayload.foto ? (
                  <img
                    src={publishPayload.foto}
                    alt={publishPayload.nome}
                    className="h-20 w-20 aspect-square rounded-lg border-2 border-[#226380] object-cover shadow-sm shrink-0"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800 shrink-0">
                    <UserRound className="h-8 w-8" />
                  </div>
                )}
                <div className="space-y-1 min-w-0">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded bg-[#226380]/10 text-[#226380] dark:bg-[#A3C3C7]/10 dark:text-[#A3C3C7]">
                    Categoria: {publishPayload.categoria}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {publishPayload.nome}
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    ID / Slug no site: <code className="text-[#226380] dark:text-[#A3C3C7]">{publishPayload.id}</code>
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                    "{publishPayload.lema}"
                  </p>
                </div>
              </div>

              {/* Campos Editáveis antes da Publicação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Nome Oficial no Site
                  </label>
                  <input
                    type="text"
                    value={publishPayload.nome}
                    onChange={(e) => setPublishPayload({ ...publishPayload, nome: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#226380] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Cargo / Função na Comunidade
                  </label>
                  <input
                    type="text"
                    value={publishPayload.cargo}
                    onChange={(e) => setPublishPayload({ ...publishPayload, cargo: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#226380] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Comunidade / Local no Site (Equipe)
                  </label>
                  {siteLocais.length > 0 ? (
                    <select
                      value={selectedLocalId}
                      onChange={(e) => {
                        setSelectedLocalId(e.target.value);
                        const sel = siteLocais.find(l => l.id === e.target.value);
                        if (sel) {
                          setPublishPayload({ ...publishPayload, comunidade: sel.nome });
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#226380] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      {siteLocais.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.nome} {loc.cidade ? `(${loc.cidade}/${loc.estado || ''})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={publishPayload.comunidade}
                      onChange={(e) => setPublishPayload({ ...publishPayload, comunidade: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#226380] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  )}
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Atualiza o religioso na equipe desta paróquia/comunidade no site e desvincula da anterior em caso de transferência.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Cidade / Região
                  </label>
                  <input
                    type="text"
                    value={publishPayload.cidade}
                    onChange={(e) => setPublishPayload({ ...publishPayload, cidade: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#226380] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Data de 1ª Profissão
                  </label>
                  <input
                    type="text"
                    value={publishPayload.profissao || ''}
                    placeholder="DD/MM/AAAA"
                    onChange={(e) => setPublishPayload({ ...publishPayload, profissao: e.target.value, primeiraProfissao: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#226380] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Data de Ordenação Presbiteral
                  </label>
                  <input
                    type="text"
                    value={publishPayload.ordenacao || ''}
                    placeholder="DD/MM/AAAA"
                    onChange={(e) => setPublishPayload({ ...publishPayload, ordenacao: e.target.value, ordenacaopresbiteral: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#226380] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Lema Sacerdotal / Consagrado
                  </label>
                  <input
                    type="text"
                    value={publishPayload.lema || ''}
                    onChange={(e) => setPublishPayload({ ...publishPayload, lema: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#226380] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Biografia Resumida
                </label>
                <textarea
                  rows={3}
                  value={publishPayload.bio || ''}
                  onChange={(e) => setPublishPayload({ ...publishPayload, bio: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#226380] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              {/* Informação sobre atualização e transferência */}
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3 border border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <Globe className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Ao confirmar, o site oficial atualizará imediatamente o perfil biográfico individual e o card com foto e cargo na equipe da comunidade selecionada.
                </span>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                disabled={publishing}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmPublish}
                disabled={publishing}
                className="inline-flex items-center gap-2 rounded-lg bg-[#226380] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1b4f66] shadow-sm cursor-pointer disabled:opacity-50"
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                <span>{publishing ? 'Publicando no site...' : 'Confirmar e Publicar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReligiosoDossie;
