import React, { useState, useRef } from 'react';
import { 
  UploadCloud, FileText, Image as ImageIcon, Download, Eye, 
  Trash2, Plus, X, Check, AlertCircle, File, Loader2, Maximize2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../hooks/useFeedback';
import { downloadArquivo } from '../lib/downloadHelper';
import type { 
  PatrimonioAnexo, 
  TipoDocumentoPatrimonio, 
  TipoPatrimonio 
} from '../types/patrimonio';

interface PatrimonioAnexosManagerProps {
  anexos: PatrimonioAnexo[];
  onChange: (novosAnexos: PatrimonioAnexo[]) => void;
  tipoPatrimonio: TipoPatrimonio;
  readOnly?: boolean;
}

const TIPOS_POR_PATRIMONIO: Record<TipoPatrimonio, TipoDocumentoPatrimonio[]> = {
  imovel: [
    'Escritura Pública',
    'Matrícula RGI',
    'Certidão de Ônus / Negativa',
    'Habite-se / Alvará',
    'AVCB Bombeiros',
    'Apólice de Seguro',
    'Planta / Projeto Arquitetônico',
    'Foto do Bem / Fachada',
    'Foto Interna / Detalhe',
    'Contrato / Termo Aditivo',
    'Outro Documento'
  ],
  veiculo: [
    'CRLV / Documento do Veículo',
    'Apólice de Seguro',
    'Comprovante IPVA / Taxa',
    'Nota Fiscal / Recibo',
    'Foto do Bem / Fachada',
    'Foto Interna / Detalhe',
    'Laudo de Vistoria / Laudo Técnico',
    'Outro Documento'
  ],
  bem: [
    'Termo de Tombamento / Certificado',
    'Laudo de Vistoria / Laudo Técnico',
    'Foto do Bem / Fachada',
    'Foto Interna / Detalhe',
    'Nota Fiscal / Recibo',
    'Contrato / Termo Aditivo',
    'Outro Documento'
  ],
  contrato: [
    'Contrato / Termo Aditivo',
    'Apólice de Seguro',
    'Certidão de Ônus / Negativa',
    'Nota Fiscal / Recibo',
    'Comprovante IPVA / Taxa',
    'Outro Documento'
  ],
  vistoria: [
    'Laudo de Vistoria / Laudo Técnico',
    'Foto do Bem / Fachada',
    'Foto Interna / Detalhe',
    'Nota Fiscal / Recibo',
    'Contrato / Termo Aditivo',
    'Outro Documento'
  ]
};

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const PatrimonioAnexosManager: React.FC<PatrimonioAnexosManagerProps> = ({
  anexos = [],
  onChange,
  tipoPatrimonio,
  readOnly = false
}) => {
  const [modalVisualizar, setModalVisualizar] = useState<PatrimonioAnexo | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Estado do formulário de novo anexo
  const [novoArquivo, setNovoArquivo] = useState<File | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [novoTipo, setNovoTipo] = useState<TipoDocumentoPatrimonio>(() => {
    return TIPOS_POR_PATRIMONIO[tipoPatrimonio]?.[0] || 'Outro Documento';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tiposDisponiveis = TIPOS_POR_PATRIMONIO[tipoPatrimonio] || [
    'Outro Documento',
    'Foto do Bem / Fachada',
    'Contrato / Termo Aditivo'
  ];

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNovoArquivo(file);
      if (!novoNome) {
        // Sugere o nome sem extensão
        const nomeLimpo = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setNovoNome(nomeLimpo);
      }
      // Se for imagem, pré-seleciona "Foto do Bem / Fachada"
      if (file.type.startsWith('image/') && !novoTipo.includes('Foto')) {
        const tipoFoto = tiposDisponiveis.find(t => t.includes('Foto'));
        if (tipoFoto) setNovoTipo(tipoFoto);
      }
    }
  };

  const handleAdicionarAnexo = async () => {
    if (!novoArquivo) {
      showToast.error('Selecione um arquivo para anexar.', 'Arquivo Necessário');
      return;
    }

    if (!novoNome.trim()) {
      showToast.error('Informe um nome descritivo para o documento.', 'Nome Obrigatório');
      return;
    }

    setUploading(true);

    try {
      const id = crypto.randomUUID();
      const extensao = novoArquivo.name.split('.').pop() || '';
      const nomeSanitizado = novoArquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `patrimonio/${id}_${nomeSanitizado}`;

      let urlFinal = '';
      let salvoNoStorage = false;

      // 1. Tenta upload no Supabase Storage
      try {
        const { error: err1 } = await supabase.storage
          .from('patrimonio-documentos')
          .upload(storagePath, novoArquivo, { upsert: true });

        if (!err1) {
          const { data: pub } = supabase.storage
            .from('patrimonio-documentos')
            .getPublicUrl(storagePath);
          urlFinal = pub.publicUrl;
          salvoNoStorage = true;
        } else {
          // Tentativa secundária
          const { error: err2 } = await supabase.storage
            .from('documentos-provincia')
            .upload(storagePath, novoArquivo, { upsert: true });

          if (!err2) {
            const { data: pub } = supabase.storage
              .from('documentos-provincia')
              .getPublicUrl(storagePath);
            urlFinal = pub.publicUrl;
            salvoNoStorage = true;
          }
        }
      } catch (errStorage) {
        console.warn('Supabase storage indisponível, recorrendo ao armazenamento resiliente:', errStorage);
      }

      // 2. Se falhar ou estiver offline, converte em Data URL
      if (!salvoNoStorage) {
        urlFinal = await fileToDataUrl(novoArquivo);
      }

      const novoAnexo: PatrimonioAnexo = {
        id,
        nome: novoNome.trim(),
        tipo: novoTipo,
        arquivo_url: urlFinal,
        arquivo_nome: novoArquivo.name,
        tamanho_bytes: novoArquivo.size,
        formato: novoArquivo.type.startsWith('image/') ? 'image' : (extensao.toLowerCase() === 'pdf' ? 'pdf' : 'document'),
        created_at: new Date().toISOString(),
        enviado_por: 'Gestão de Patrimônio'
      };

      onChange([novoAnexo, ...anexos]);
      showToast.success(`Documento "${novoAnexo.nome}" anexado com sucesso.`, 'Arquivo Anexado');

      // Limpar campos
      setNovoArquivo(null);
      setNovoNome('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      showToast.error(`Erro ao anexar arquivo: ${err.message || 'Falha inesperada'}`, 'Erro');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoverAnexo = (id: string, nome: string) => {
    if (window.confirm(`Deseja remover o anexo "${nome}"?`)) {
      const atualizados = anexos.filter(a => a.id !== id);
      onChange(atualizados);
      showToast.success('Documento removido da ficha.', 'Anexo Removido');
    }
  };

  const handleDownload = async (anexo: PatrimonioAnexo) => {
    try {
      showToast.info(`Iniciando download de "${anexo.nome}"...`, 'Download');
      const nomeDownload = anexo.arquivo_nome || `${anexo.nome.replace(/\s+/g, '_')}.${anexo.formato === 'image' ? 'jpg' : 'pdf'}`;
      await downloadArquivo(anexo.arquivo_url, nomeDownload);
      showToast.success('Download concluído.', 'Sucesso');
    } catch (err: any) {
      showToast.error(`Não foi possível baixar o arquivo: ${err.message}`, 'Erro no Download');
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Adicionar Anexo (Protocolo Notarial e Canônico) */}
      {!readOnly && (
        <div className="bg-slate-50/70 dark:bg-[#12161c] border border-slate-200/90 dark:border-slate-800 rounded-[10px] p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-200/70 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-[#113240] dark:text-[#A3C3C7] uppercase tracking-wider flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#226380]" />
                <span>Protocolo de Documento & Acervo Digital</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Vincule escrituras públicas, certidões RGI, apólices, laudos periciais ou registros fotográficos oficiais.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 self-start sm:self-auto">
              PDF · JPEG · PNG · DOCX
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Seletor de Arquivo com Área de Arraste / Botão Limpo */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Arquivo Digital <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx"
                  onChange={handleSelectFile}
                  className="hidden"
                  id="patrimonio-file-picker"
                />
                <label
                  htmlFor="patrimonio-file-picker"
                  className={`w-full min-h-[76px] flex flex-col items-center justify-center p-3 rounded-[8px] border-2 border-dashed transition-all cursor-pointer ${
                    novoArquivo
                      ? 'border-[#226380] bg-[#226380]/5 text-[#113240] dark:text-[#A3C3C7]'
                      : 'border-slate-300 dark:border-slate-700 hover:border-[#226380] bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {novoArquivo ? (
                    <div className="flex items-center gap-2 text-left w-full min-w-0">
                      <div className="p-2 rounded-[6px] bg-[#113240] text-white shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {novoArquivo.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {formatBytes(novoArquivo.size)} · Pronto para protocolar
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-5 h-5 text-[#226380] mb-1" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Clique para selecionar arquivo do dispositivo
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Armazenamento com persistência e download integrado
                      </span>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Metadados: Nome e Tipo Documental */}
            <div className="md:col-span-7 flex flex-col justify-between gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Título / Designação <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex: Escritura Pública 1º Ofício, CRLV 2026..."
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Classificação Canônica / Notarial
                  </label>
                  <select
                    value={novoTipo}
                    onChange={(e) => setNovoTipo(e.target.value as TipoDocumentoPatrimonio)}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  >
                    {tiposDisponiveis.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botão de Protocolar */}
              <div className="flex items-center justify-end gap-3 pt-1">
                {novoArquivo && (
                  <button
                    type="button"
                    onClick={() => {
                      setNovoArquivo(null);
                      setNovoNome('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-3 py-2 text-xs text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAdicionarAnexo}
                  disabled={uploading || !novoArquivo}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#113240] text-white hover:bg-[#226380] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-semibold cursor-pointer shadow-sm motion-press"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Protocolando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Protocolar Documento</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Documentos Anexados (Estilo Cartório Digital e Acervo) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Documentos & Registros Arquivados
            </span>
            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold bg-[#113240]/10 text-[#113240] dark:bg-[#A3C3C7]/15 dark:text-[#A3C3C7]">
              {anexos.length}
            </span>
          </div>
          {anexos.length === 0 && (
            <span className="text-xs text-slate-400 italic">
              Nenhum documento ou foto vinculado até o momento.
            </span>
          )}
        </div>

        {anexos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {anexos.map((anexo) => {
              const isImage = anexo.formato === 'image' || 
                anexo.arquivo_url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ||
                anexo.arquivo_url.startsWith('data:image/');

              return (
                <div
                  key={anexo.id}
                  className="bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 rounded-[8px] p-4 flex flex-col justify-between hover:border-[#226380]/70 transition-all shadow-xs group"
                >
                  <div className="flex items-start gap-3">
                    {/* Miniatura ou Ícone Notarial */}
                    <div className="w-14 h-14 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {isImage ? (
                        <img
                          src={anexo.arquivo_url}
                          alt={anexo.nome}
                          className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => setModalVisualizar(anexo)}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-1">
                          <FileText className="w-5 h-5 text-[#226380]" />
                          <span className="text-[8px] font-mono font-bold text-slate-400 uppercase mt-0.5">
                            {anexo.formato === 'pdf' ? 'PDF' : 'DOC'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dados do Documento */}
                    <div className="flex-1 min-w-0">
                      <h5 
                        className="text-xs font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-[#226380] dark:hover:text-[#A3C3C7]"
                        title={anexo.nome}
                        onClick={() => setModalVisualizar(anexo)}
                      >
                        {anexo.nome}
                      </h5>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                        {anexo.tipo}
                      </span>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                        {anexo.tamanho_bytes ? <span>{formatBytes(anexo.tamanho_bytes)}</span> : null}
                        {anexo.created_at && (
                          <span>· {new Date(anexo.created_at).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações Rápidas Elegantes */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setModalVisualizar(anexo)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#113240] dark:text-[#A3C3C7] hover:text-[#226380] transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visualizar</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDownload(anexo)}
                        className="p-1.5 rounded-[4px] text-slate-400 hover:text-[#226380] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Download do Arquivo"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => handleRemoverAnexo(anexo.id, anexo.nome)}
                          className="p-1.5 rounded-[4px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                          title="Remover Documento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE VISUALIZAÇÃO DE DOCUMENTO / FOTO */}
      {modalVisualizar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[10px] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header do Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900">
              <div className="min-w-0 pr-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#226380] dark:text-[#A3C3C7] block">
                  Livro de Tombo · Acervo Provincial
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                  {modalVisualizar.nome}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {modalVisualizar.tipo} {modalVisualizar.tamanho_bytes ? `· ${formatBytes(modalVisualizar.tamanho_bytes)}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(modalVisualizar)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-[6px] bg-[#113240] text-white hover:bg-[#226380] transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalVisualizar(null)}
                  className="p-2 rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conteúdo do Visualizador */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100 dark:bg-[#0d1117] min-h-[420px]">
              {modalVisualizar.formato === 'image' || modalVisualizar.arquivo_url.startsWith('data:image/') || modalVisualizar.arquivo_url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                <img
                  src={modalVisualizar.arquivo_url}
                  alt={modalVisualizar.nome}
                  className="max-h-[78vh] max-w-full object-contain rounded-[6px] shadow-sm"
                />
              ) : (
                <iframe
                  src={modalVisualizar.arquivo_url}
                  title={modalVisualizar.nome}
                  className="w-full h-[72vh] border-0 rounded-[6px] bg-white shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
