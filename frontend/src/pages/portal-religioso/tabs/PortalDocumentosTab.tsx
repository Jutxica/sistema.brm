import React from 'react';
import { ArrowLeft, FileText, Search, X, Loader2, BookOpen, Download } from 'lucide-react';
import type { DocumentoProvincial, CategoriaDocumento } from '../../../types/secretaria';
import { staggerStyle } from '../../../hooks/useMotion';
import { downloadArquivo } from '../../../lib/downloadHelper';

export interface PortalDocumentosTabProps {
  documentos: DocumentoProvincial[];
  documentosFiltrados: DocumentoProvincial[];
  loadingDocumentos: boolean;
  documentosError: boolean;
  docSearch: string;
  setDocSearch: (val: string) => void;
  docCategoria: string;
  setDocCategoria: (val: string) => void;
  categoriasOficiais: CategoriaDocumento[];
  onVoltar: () => void;
  onLerDocumento: (doc: DocumentoProvincial) => void;
  formatData: (iso: string) => string;
  formatFileSize: (bytes?: number) => string;
  getCategoriaCor: () => string;
}

export const PortalDocumentosTab: React.FC<PortalDocumentosTabProps> = ({
  documentos,
  documentosFiltrados,
  loadingDocumentos,
  documentosError,
  docSearch,
  setDocSearch,
  docCategoria,
  setDocCategoria,
  categoriasOficiais,
  onVoltar,
  onLerDocumento,
  formatData,
  formatFileSize,
  getCategoriaCor
}) => {
  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={onVoltar}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#161617] border border-[#d6d6d6]/60 dark:border-white/10 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#262628] transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Painel do Confrade</span>
        </button>
      </div>

      {/* Header Apple Style */}
      <div className="bg-white dark:bg-[#161617] rounded-[24px] sm:rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-5 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#707070] dark:text-[#86868b] block mb-1">
              Secretaria Provincial • Atos Oficiais & Decretos
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7]">
              Documentos Oficiais da Província BRM
            </h2>
            <p className="text-xs sm:text-sm text-[#707070] dark:text-[#86868b] font-normal mt-1 leading-relaxed max-w-2xl">
              Consulte e baixe comunicados, diretórios, decretos de transferências, protocolos e subsídios emitidos pela Secretaria Provincial.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#707070] dark:text-[#86868b] bg-[#f5f5f7] dark:bg-[#262628] px-4 py-2 rounded-full border border-[#d6d6d6]/40 dark:border-white/5 self-start md:self-auto">
            <FileText className="w-4 h-4 text-[#226380]" />
            <span>{documentos.length} documento{documentos.length === 1 ? '' : 's'} disponível{documentos.length === 1 ? '' : 'is'}</span>
          </div>
        </div>

        {/* Categorias Pills Filter */}
        <div className="mt-5 flex snap-x snap-mandatory gap-2 overflow-x-auto border-t border-[#d6d6d6]/40 pt-4 pb-1 dark:border-white/5 sm:mt-6 sm:flex-wrap sm:overflow-visible sm:pt-6">
          <button
            type="button"
            onClick={() => setDocCategoria('Todas')}
            className={`min-h-10 shrink-0 snap-start px-3.5 py-2 rounded-full text-xs font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#226380] ${
              docCategoria === 'Todas'
                ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f]'
                : 'bg-[#f5f5f7] dark:bg-[#262628] text-[#707070] dark:text-[#86868b] hover:bg-[#e8e8ed] dark:hover:bg-[#333336]'
            }`}
          >
            Todas ({documentos.length})
          </button>
          {categoriasOficiais.map((cat) => {
            const count = documentos.filter((d) => d.categoria === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setDocCategoria(cat)}
                className={`min-h-10 shrink-0 snap-start px-3.5 py-2 rounded-full text-xs font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#226380] ${
                  docCategoria === cat
                    ? 'bg-[#226380] text-white shadow-sm'
                    : 'bg-[#f5f5f7] dark:bg-[#262628] text-[#707070] dark:text-[#86868b] hover:bg-[#e8e8ed] dark:hover:bg-[#333336]'
                }`}
              >
                {cat} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Barra de Busca de Documentos */}
        <div className="relative mt-4">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707070] dark:text-[#86868b]" />
          <input
            type="text"
            value={docSearch}
            onChange={(e) => setDocSearch(e.target.value)}
            aria-label="Buscar documentos oficiais"
            placeholder="Buscar título, assunto ou referência"
            className="min-h-12 w-full rounded-xl bg-[#f5f5f7] py-2.5 pl-10 pr-12 text-base text-[#1d1d1f] outline-none transition-all placeholder:text-[#707070] focus:border-[#226380] focus:bg-white dark:bg-[#262628] dark:text-[#f5f5f7] dark:placeholder:text-[#86868b] dark:focus:bg-[#161617] sm:rounded-full sm:text-sm"
          />
          {docSearch && (
            <button
              type="button"
              onClick={() => setDocSearch('')}
              aria-label="Limpar busca de documentos"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#707070] hover:text-[#1d1d1f] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid / Lista de Documentos */}
      {loadingDocumentos ? (
        <div className="py-16 text-center bg-white dark:bg-[#161617] rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#226380] mx-auto mb-2" />
          <span className="text-xs text-[#707070] dark:text-[#86868b]">Carregando documentos oficiais...</span>
        </div>
      ) : documentosFiltrados.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#161617] rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-8">
          <FileText className="w-10 h-10 text-[#707070]/40 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-1">
            {documentosError ? 'Documentos indisponíveis' : 'Nenhum documento encontrado'}
          </h4>
          <p className="text-xs text-[#707070] dark:text-[#86868b] max-w-sm mx-auto mb-4">
            {documentosError
              ? 'Não foi possível carregar os documentos oficiais. Tente novamente mais tarde.'
              : 'Não encontramos nenhum documento oficial correspondente à categoria ou termo de busca selecionado.'}
          </p>
          {(docSearch || docCategoria !== 'Todas') && (
            <button
              type="button"
              onClick={() => {
                setDocCategoria('Todas');
                setDocSearch('');
              }}
              className="px-4 py-2 rounded-full bg-[#f5f5f7] dark:bg-[#262628] text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e8e8ed] dark:hover:bg-[#333336] transition-all cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documentosFiltrados.map((doc, idx) => (
            <div
              key={doc.id}
              style={staggerStyle(idx)}
              className="bg-white dark:bg-[#161617] rounded-[22px] sm:rounded-[24px] border border-[#d6d6d6]/60 dark:border-white/10 p-4 sm:p-6 flex flex-col justify-between hover:border-[#226380]/40 dark:hover:border-[#A3C3C7]/40 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.02)] motion-stagger-item motion-lift"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getCategoriaCor()}`}>
                    {doc.categoria}
                  </span>
                  <span className="text-[11px] text-[#707070] dark:text-[#86868b] font-medium">
                    {formatData(doc.data_documento)}
                  </span>
                </div>

                <button
                  type="button"
                  className="w-full cursor-pointer text-left group/title focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#226380]"
                  onClick={() => onLerDocumento(doc)}
                  aria-label={`Ler ${doc.titulo}`}
                >
                  {doc.numero_referencia && (
                    <span className="text-[11px] font-mono text-[#226380] dark:text-[#64b5f6] block mb-1">
                      {doc.numero_referencia}
                    </span>
                  )}
                  <h3 className="text-[16px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] group-hover/title:text-[#226380] dark:group-hover/title:text-[#64b5f6] transition-colors leading-snug font-cinzel">
                    {doc.titulo}
                  </h3>
                </button>

                {doc.descricao && (
                  <p className="text-xs text-[#707070] dark:text-[#86868b] leading-relaxed line-clamp-2">
                    {doc.descricao}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#707070] dark:text-[#86868b] pt-1">
                  <span className="min-w-0 max-w-full truncate sm:max-w-[220px]" title={doc.arquivo_nome}>
                    {doc.arquivo_nome}
                  </span>
                  <span className="shrink-0">· {formatFileSize(doc.arquivo_tamanho_bytes)}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-[#d6d6d6]/40 pt-4 dark:border-white/5 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:pt-5">
                <span className="text-[11px] text-[#707070] dark:text-[#86868b]">
                  {doc.publicado_por || 'Secretaria Provincial'}
                </span>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <button
                    type="button"
                    onClick={() => onLerDocumento(doc)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#113240] px-3 sm:px-4 text-sm sm:text-xs font-medium text-white shadow-sm transition-all hover:bg-[#1a4a5e] active:scale-[0.99] cursor-pointer motion-press dark:bg-[#226380] dark:hover:bg-[#1b526b]"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Ler Documento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadArquivo(doc.arquivo_url, doc.arquivo_nome)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs transition-all hover:bg-slate-50 cursor-pointer motion-press dark:border-slate-700 dark:bg-[#161617] dark:text-slate-300 dark:hover:bg-[#262628]"
                    title="Baixar arquivo original"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Baixar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
