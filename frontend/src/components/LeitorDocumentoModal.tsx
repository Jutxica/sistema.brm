import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Download, Printer, ExternalLink, Maximize2, Minimize2, 
  FileText, Calendar, Tag, AlertCircle, Copy, Check, Loader2, BookOpen
} from 'lucide-react';
import type { DocumentoProvincial } from '../pages/DocumentosAdmin';
import { showToast } from '../hooks/useFeedback';
import { downloadArquivo, dataURLtoBlob } from '../lib/downloadHelper';

interface LeitorDocumentoModalProps {
  documento: DocumentoProvincial | null;
  onClose: () => void;
}

export const LeitorDocumentoModal: React.FC<LeitorDocumentoModalProps> = ({
  documento,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fechar com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onClose]);

  // Verificar disponibilidade do arquivo e tratar erros como NoSuchBucket
  useEffect(() => {
    if (!documento) return;
    
    setLoading(true);
    setHasError(false);
    setErrorMessage('');

    let createdBlobUrl: string | null = null;

    // Se for URL de dados local Base64, converte para Blob URL para suporte nativo e performático no iframe
    if (documento.arquivo_url.startsWith('data:')) {
      try {
        const blob = dataURLtoBlob(documento.arquivo_url);
        createdBlobUrl = URL.createObjectURL(blob);
        setPreviewUrl(createdBlobUrl);
      } catch (err) {
        console.warn('Erro ao converter data URL em blob:', err);
        setPreviewUrl(documento.arquivo_url);
      }
      setLoading(false);
      return () => {
        if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
      };
    }

    if (documento.arquivo_url.startsWith('blob:')) {
      setPreviewUrl(documento.arquivo_url);
      setLoading(false);
      return;
    }

    // Se for URL remota (ex: Supabase Storage), definir previewUrl e testar integridade
    setPreviewUrl(documento.arquivo_url);
    let cancel = false;

    const checkFile = async () => {
      try {
        const res = await fetch(documento.arquivo_url);
        if (!cancel) {
          if (!res.ok) {
            let isBucketError = res.status === 404 || res.status === 400;
            try {
              const bodyJson = await res.json();
              if (
                bodyJson.code === 'NoSuchBucket' || 
                bodyJson.error?.toLowerCase().includes('bucket') || 
                bodyJson.message?.toLowerCase().includes('bucket')
              ) {
                isBucketError = true;
              }
            } catch (_) {}

            setHasError(true);
            if (isBucketError) {
              setErrorMessage('O bucket de armazenamento "documentos-provincia" ainda não foi criado ou configurado como público no Supabase.');
            } else {
              setErrorMessage(`Erro ao carregar documento do servidor (Código HTTP ${res.status}).`);
            }
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancel) {
          // Em caso de CORS no fetch, permitimos que o iframe nativo tente carregar diretamente
          setLoading(false);
        }
      }
    };

    checkFile();
    return () => {
      cancel = true;
      if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
    };
  }, [documento]);

  if (!documento) return null;

  const isPDF = documento.mime_type?.includes('pdf') || 
                documento.arquivo_nome?.toLowerCase().endsWith('.pdf') || 
                documento.arquivo_url?.toLowerCase().includes('.pdf');

  const isImage = documento.mime_type?.startsWith('image/') || 
                  /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(documento.arquivo_nome || '');

  // Formatação de data
  const formatData = (iso: string) => {
    try {
      const [ano, mes, dia] = iso.split('-');
      return `${dia}/${mes}/${ano}`;
    } catch {
      return iso;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Tamanho desconhecido';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        return;
      } catch (e) {
        console.warn('Iframe print bloqueado por política do navegador, abrindo janela auxiliar:', e);
      }
    }
    const printWin = window.open(previewUrl || documento.arquivo_url, '_blank');
    if (printWin) {
      printWin.focus();
    }
  };

  const copyBucketSql = () => {
    const sql = `-- Script Oficial para Criar Buckets e Permissões no Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('documentos-provincia', 'documentos-provincia', true),
  ('religiosos-documentos', 'religiosos-documentos', true),
  ('obras-fotos', 'obras-fotos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas para documentos-provincia
DROP POLICY IF EXISTS "documentos_provincia_public_read" ON storage.objects;
CREATE POLICY "documentos_provincia_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'documentos-provincia');

DROP POLICY IF EXISTS "documentos_provincia_anon_insert" ON storage.objects;
CREATE POLICY "documentos_provincia_anon_insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'documentos-provincia');

DROP POLICY IF EXISTS "documentos_provincia_anon_update" ON storage.objects;
CREATE POLICY "documentos_provincia_anon_update" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'documentos-provincia') WITH CHECK (bucket_id = 'documentos-provincia');

DROP POLICY IF EXISTS "documentos_provincia_anon_delete" ON storage.objects;
CREATE POLICY "documentos_provincia_anon_delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'documentos-provincia');

-- Políticas para religiosos-documentos
DROP POLICY IF EXISTS "religiosos_docs_public_read" ON storage.objects;
CREATE POLICY "religiosos_docs_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'religiosos-documentos');

DROP POLICY IF EXISTS "religiosos_docs_anon_insert" ON storage.objects;
CREATE POLICY "religiosos_docs_anon_insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'religiosos-documentos');`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    showToast.success('Cole no Editor SQL do Supabase para criar e liberar o bucket.', 'SQL Copiado com Sucesso');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm transition-all motion-backdrop">
      <div 
        className={`bg-white dark:bg-[#161b22] rounded-[10px] border border-slate-300 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 border-t-2 border-t-[#226380] motion-modal ${
          isFullscreen 
            ? 'w-full h-full rounded-none border-0' 
            : 'w-full max-w-5xl h-[90vh] max-h-[96vh]'
        }`}
      >
        {/* Top Header Institucional */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#226380] dark:text-[#64b5f6] font-semibold">
                Secretaria Provincial • Província BRM
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Tag className="w-2.5 h-2.5 text-[#226380]" />
                {documento.categoria}
              </span>
              {documento.numero_referencia && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#226380]/10 text-[#113240] dark:text-[#64b5f6]">
                  {documento.numero_referencia}
                </span>
              )}
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5 text-slate-400" />
                {formatData(documento.data_documento)}
              </span>
            </div>

            <h2 className="text-sm sm:text-base font-bold text-[#113240] dark:text-white font-cinzel truncate leading-snug" title={documento.titulo}>
              {documento.titulo}
            </h2>
          </div>

          {/* Botões de Ação na Barra Superior */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Imprimir */}
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer motion-press"
              title="Imprimir documento"
            >
              <Printer className="w-3.5 h-3.5 text-[#226380]" />
              <span>Imprimir</span>
            </button>

            {/* Baixar Arquivo */}
            <button
              type="button"
              onClick={() => downloadArquivo(documento.arquivo_url, documento.arquivo_nome)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer motion-press"
              title="Baixar arquivo original"
            >
              <Download className="w-3.5 h-3.5 text-[#226380]" />
              <span className="hidden sm:inline">Baixar</span>
            </button>

            {/* Abrir Externamente */}
            <a
              href={documento.arquivo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-[#113240] transition-colors motion-press"
              title="Abrir em nova aba"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Alternar Tela Cheia */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:flex p-1.5 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-[#113240] transition-colors cursor-pointer motion-press"
              title={isFullscreen ? 'Reduzir janela' : 'Maximizar leitor'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Fechar */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer motion-press ml-1"
              title="Fechar leitor (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visualizador Central */}
        <div className="flex-1 relative bg-slate-100 dark:bg-slate-900/60 overflow-hidden flex flex-col">
          {/* Loading indicator */}
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-[#161b22]/80 backdrop-blur-xs">
              <Loader2 className="w-8 h-8 text-[#226380] animate-spin mb-2" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 font-mono">
                Preparando leitura do documento oficial...
              </p>
            </div>
          )}

          {/* Erro de Bucket ou Arquivo Inacessível */}
          {hasError ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-lg w-full bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-700 rounded-[8px] p-6 text-center shadow-lg space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#113240] dark:text-white font-cinzel">
                    Arquivo Indisponível no Servidor
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {errorMessage}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/80 rounded-[6px] border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider font-mono">
                    Como resolver no Supabase:
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    O bucket <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[#226380]">documentos-provincia</code> precisa existir com permissão pública de leitura.
                  </p>
                  <button
                    type="button"
                    onClick={copyBucketSql}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#226380] hover:bg-[#1a4f66] text-white text-[11px] font-medium rounded transition-colors cursor-pointer motion-press mt-1"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'SQL Copiado!' : 'Copiar Script SQL do Bucket'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <a
                    href={documento.arquivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Tentar link direto</span>
                  </a>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-[6px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          ) : isPDF ? (
            /* Visualizador Nativo de PDF com suporte a barra de navegação e busca */
            <div className="w-full h-full flex-1">
              <iframe
                ref={iframeRef}
                src={`${previewUrl || documento.arquivo_url}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full border-0 bg-slate-200 dark:bg-slate-900"
                title={documento.titulo}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setHasError(true);
                  setErrorMessage('O visualizador do navegador não pôde carregar o arquivo PDF.');
                }}
              />
            </div>
          ) : isImage ? (
            /* Visualizador de Imagens (PNG, JPG, etc.) */
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <img
                src={previewUrl || documento.arquivo_url}
                alt={documento.titulo}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setHasError(true);
                  setErrorMessage('Não foi possível exibir a imagem.');
                }}
                className="max-h-full max-w-full object-contain rounded-[6px] shadow-md border border-slate-200 dark:border-slate-700"
              />
            </div>
          ) : (
            /* Outros formatos (.docx, planilhas, etc.) */
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div className="max-w-md bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-700 rounded-[8px] p-6 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#226380]/10 border border-[#226380]/20 text-[#226380] flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#113240] dark:text-white font-cinzel">
                    Visualização Direta Indisponível
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Documentos no formato original (DOCX / Office) não possuem suporte nativo para leitura no navegador.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => downloadArquivo(documento.arquivo_url, documento.arquivo_nome)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#113240] hover:bg-[#1a4a5e] text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Arquivo ({formatFileSize(documento.arquivo_tamanho_bytes)})</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-mono">
          <div className="flex items-center gap-3 truncate">
            <span className="truncate">
              📄 {documento.arquivo_nome}
            </span>
            <span>•</span>
            <span>{formatFileSize(documento.arquivo_tamanho_bytes)}</span>
            <span>•</span>
            <span className="text-[#226380] dark:text-[#64b5f6] font-medium">
              {documento.publicado_por || 'Secretaria Provincial'}
            </span>
          </div>

          {documento.descricao && (
            <div className="text-[11px] text-slate-600 dark:text-slate-300 font-sans truncate max-w-md sm:text-right" title={documento.descricao}>
              {documento.descricao}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
