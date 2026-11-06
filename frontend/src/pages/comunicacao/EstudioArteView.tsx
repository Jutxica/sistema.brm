import React, { useState, useRef } from 'react';
import {
  Palette, Type, Layers, Image as ImageIcon, Copy, Check,
  Download, PenTool, UploadCloud, Plus, Search, Trash2,
  FileCode, Sparkles, FolderOpen, AlertCircle
} from 'lucide-react';
import type { ComunicacaoBrandAsset } from '../../types/comunicacao';

interface EstudioArteViewProps {
  assets: ComunicacaoBrandAsset[];
  onAbrirPhotoCraft: (arquivoUrl?: string, arquivoNome?: string) => void;
  onAbrirVectorCraft: (arquivoUrl?: string, arquivoNome?: string) => void;
  onAdicionarAsset: (novoAsset: Partial<ComunicacaoBrandAsset>) => Promise<ComunicacaoBrandAsset | null>;
  onExcluirAsset: (id: string) => Promise<boolean>;
}

type CategoriaFiltro = 'todos' | 'logo' | 'psd' | 'vetor' | 'tipografia' | 'cor';

export const EstudioArteView: React.FC<EstudioArteViewProps> = ({
  assets,
  onAbrirPhotoCraft,
  onAbrirVectorCraft,
  onAdicionarAsset,
  onExcluirAsset
}) => {
  const [filtroAtivo, setFiltroAtivo] = useState<CategoriaFiltro>('todos');
  const [busca, setBusca] = useState('');
  const [copiadoHex, setCopiadoHex] = useState<string | null>(null);
  const [estaArrastando, setEstaArrastando] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState<string | null>(null);
  const [modalNovaCor, setModalNovaCor] = useState(false);
  const [novaCorNome, setNovaCorNome] = useState('');
  const [novaCorHex, setNovaCorHex] = useState('#226380');
  const [novaCorCategoria, setNovaCorCategoria] = useState('Liturgia');
  const [novaCorDescricao, setNovaCorDescricao] = useState('');

  const inputArquivoRef = useRef<HTMLInputElement>(null);

  const copiarHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiadoHex(hex);
    setTimeout(() => setCopiadoHex(null), 1500);
  };

  const baixarArquivo = (url: string, nome: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatarTamanho = (bytes: number): string => {
    if (bytes >= 1048576) {
      return (bytes / 1048576).toFixed(1) + ' MB';
    }
    return Math.round(bytes / 1024) + ' KB';
  };

  const processarArquivos = async (arquivos: FileList | File[]) => {
    const lista = Array.from(arquivos);
    if (lista.length === 0) return;

    let totalAdicionados = 0;

    for (const file of lista) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const tamanhoFormatado = formatarTamanho(file.size);
      const urlCriada = URL.createObjectURL(file);

      let tipo: ComunicacaoBrandAsset['tipo'] = 'logo';
      let categoria = 'Arquivos Gerais';
      let descricao = `Arquivo enviado em ${new Date().toLocaleDateString('pt-BR')}`;

      if (ext === 'psd') {
        tipo = 'psd';
        categoria = 'Projetos PSD';
        descricao = 'Arquivo Photoshop com camadas editável no PhotoCraft';
      } else if (['svg', 'ai', 'eps'].includes(ext)) {
        tipo = 'vetor';
        categoria = 'Vetores & Ilustrações';
        descricao = 'Ilustração vetorial editável no VectorCraft';
      } else if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) {
        tipo = 'tipografia';
        categoria = 'Tipografia & Fontes';
        descricao = 'Arquivo de fonte institucional para peças gráficas';
      } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        tipo = 'logo';
        categoria = 'Logotipos & Brasões';
        descricao = 'Imagem institucional em alta definição';
      }

      await onAdicionarAsset({
        nome: file.name,
        tipo,
        valor: urlCriada,
        arquivo_url: urlCriada,
        categoria,
        descricao,
        extensao: ext,
        tamanho: tamanhoFormatado,
        psd_ou_vetor_url: tipo === 'psd' ? '/photocraft/index.html' : undefined
      });

      totalAdicionados++;
    }

    setMensagemStatus(`${totalAdicionados} arquivo(s) adicionado(s) com sucesso à biblioteca.`);
    setTimeout(() => setMensagemStatus(null), 4000);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setEstaArrastando(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processarArquivos(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setEstaArrastando(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setEstaArrastando(false);
  };

  const handleSalvarNovaCor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCorNome.trim()) return;

    await onAdicionarAsset({
      nome: novaCorNome.trim(),
      tipo: 'cor',
      valor: novaCorHex,
      categoria: novaCorCategoria,
      descricao: novaCorDescricao.trim() || 'Cor oficial adicionada à paleta'
    });

    setNovaCorNome('');
    setNovaCorDescricao('');
    setModalNovaCor(false);
    setMensagemStatus(`Cor "${novaCorNome}" adicionada à paleta oficial.`);
    setTimeout(() => setMensagemStatus(null), 4000);
  };

  // Contagens
  const cores = assets.filter(a => a.tipo === 'cor');
  const logos = assets.filter(a => a.tipo === 'logo');
  const psds = assets.filter(a => a.tipo === 'psd');
  const vetores = assets.filter(a => a.tipo === 'vetor');
  const tipografias = assets.filter(a => a.tipo === 'tipografia');

  const assetsFiltrados = assets.filter(asset => {
    const atendeFiltro = filtroAtivo === 'todos' || asset.tipo === filtroAtivo;
    const termo = busca.toLowerCase().trim();
    const atendeBusca = !termo ||
      asset.nome.toLowerCase().includes(termo) ||
      (asset.descricao && asset.descricao.toLowerCase().includes(termo)) ||
      (asset.extensao && asset.extensao.toLowerCase().includes(termo)) ||
      (asset.categoria && asset.categoria.toLowerCase().includes(termo));
    return atendeFiltro && atendeBusca;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#113240] dark:text-white tracking-tight">
            Estúdio de arte e Brand Hub
          </h1>
          <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] mt-1">
            Repositório oficial de logotipos, brasões, arquivos PSD, vetores e tipografias da Província BRM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputArquivoRef.current?.click()}
            className="px-3.5 py-2 rounded-lg bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Subir arquivo ou mídia</span>
          </button>

          <button
            type="button"
            onClick={() => setModalNovaCor(true)}
            className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-50 dark:hover:bg-[#253034] text-[#113240] dark:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#226380]" />
            <span>Nova cor</span>
          </button>

          <input
            ref={inputArquivoRef}
            type="file"
            multiple
            accept=".psd,.svg,.ai,.eps,.png,.jpg,.jpeg,.webp,.ttf,.otf,.woff,.woff2"
            className="hidden"
            onChange={e => {
              if (e.target.files) {
                processarArquivos(e.target.files);
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>

      {/* Alerta de Feedback de Upload */}
      {mensagemStatus && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{mensagemStatus}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensagemStatus(null)}
            className="text-xs hover:underline ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Banner de Edição no Navegador (PhotoCraft e VectorCraft) */}
      <div className="bg-[#113240] rounded-xl p-6 text-white border border-[#1a3452] grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        <div className="md:col-span-8 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#A3C3C7]">
              ArtCraft Suite integrada
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/90">
              Edição sem sair do navegador
            </span>
          </div>
          <h2 className="text-lg font-bold">
            Edite PSDs com camadas e vetores diretamente no sistema
          </h2>
          <p className="text-xs text-white/80 leading-relaxed max-w-xl">
            Clique em <strong>Editar no PhotoCraft</strong> em qualquer projeto PSD para ajustar textos, fotos e camadas, ou use o <strong>VectorCraft</strong> para ilustrações e brasões escaláveis.
          </p>
        </div>

        <div className="md:col-span-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onAbrirPhotoCraft()}
            className="w-full py-2.5 px-3.5 rounded-lg bg-white text-[#113240] hover:bg-slate-100 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <ImageIcon className="w-4 h-4 text-[#226380]" />
            <span>Abrir PhotoCraft (Editor PSD)</span>
          </button>

          <button
            type="button"
            onClick={() => onAbrirVectorCraft()}
            className="w-full py-2.5 px-3.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/20 transition-colors flex items-center justify-center gap-2"
          >
            <PenTool className="w-4 h-4 text-[#A3C3C7]" />
            <span>Abrir VectorCraft (Vetores)</span>
          </button>
        </div>
      </div>

      {/* Área de Upload e Dropzone Interativa */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputArquivoRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 sm:p-8 text-center transition-colors ${
          estaArrastando
            ? 'border-[#226380] bg-[#226380]/10 dark:bg-[#226380]/20'
            : 'border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#1c2427] hover:border-[#226380] dark:hover:border-[#226380]'
        }`}
      >
        <div className="max-w-md mx-auto space-y-2 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-[#f0f4f4] dark:bg-[#253034] text-[#226380] dark:text-[#A3C3C7] mx-auto flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#113240] dark:text-white">
            Arraste arquivos aqui ou clique para selecionar do computador
          </h3>
          <p className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
            Suporta projetos Photoshop (<code>.psd</code>), vetores (<code>.svg</code>, <code>.ai</code>), logotipos (<code>.png</code>, <code>.jpg</code>, <code>.webp</code>) e fontes (<code>.ttf</code>, <code>.otf</code>).
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-[#52636a] dark:text-[#a0aeaf]">
            <span className="px-2 py-0.5 rounded bg-[#f4f6f5] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246]">
              Photoshop .PSD
            </span>
            <span className="px-2 py-0.5 rounded bg-[#f4f6f5] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246]">
              Vetores .SVG
            </span>
            <span className="px-2 py-0.5 rounded bg-[#f4f6f5] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246]">
              Fontes .TTF / .OTF
            </span>
            <span className="px-2 py-0.5 rounded bg-[#f4f6f5] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246]">
              Logos PNG Alta Resolução
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca de Pastas */}
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFiltroAtivo('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroAtivo === 'todos'
                ? 'bg-[#113240] text-white'
                : 'text-[#52636a] dark:text-[#a0aeaf] hover:bg-slate-100 dark:hover:bg-[#253034]'
            }`}
          >
            Todos ({assets.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltroAtivo('logo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroAtivo === 'logo'
                ? 'bg-[#113240] text-white'
                : 'text-[#52636a] dark:text-[#a0aeaf] hover:bg-slate-100 dark:hover:bg-[#253034]'
            }`}
          >
            Logotipos & brasões ({logos.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltroAtivo('psd')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroAtivo === 'psd'
                ? 'bg-[#113240] text-white'
                : 'text-[#52636a] dark:text-[#a0aeaf] hover:bg-slate-100 dark:hover:bg-[#253034]'
            }`}
          >
            Projetos PSD ({psds.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltroAtivo('vetor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroAtivo === 'vetor'
                ? 'bg-[#113240] text-white'
                : 'text-[#52636a] dark:text-[#a0aeaf] hover:bg-slate-100 dark:hover:bg-[#253034]'
            }`}
          >
            Vetores & ilustrações ({vetores.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltroAtivo('tipografia')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroAtivo === 'tipografia'
                ? 'bg-[#113240] text-white'
                : 'text-[#52636a] dark:text-[#a0aeaf] hover:bg-slate-100 dark:hover:bg-[#253034]'
            }`}
          >
            Fontes & tipografias ({tipografias.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltroAtivo('cor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroAtivo === 'cor'
                ? 'bg-[#113240] text-white'
                : 'text-[#52636a] dark:text-[#a0aeaf] hover:bg-slate-100 dark:hover:bg-[#253034]'
            }`}
          >
            Cores oficiais ({cores.length})
          </button>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou formato..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:border-[#226380]"
          />
        </div>
      </div>

      {/* Seção 1: Projetos Photoshop (PSD) */}
      {(filtroAtivo === 'todos' || filtroAtivo === 'psd') && (
        <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#226380]" />
              <h3 className="text-xs font-semibold text-[#113240] dark:text-white">
                Projetos Photoshop com camadas (.PSD)
              </h3>
            </div>
            <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
              Edição direta no PhotoCraft
            </span>
          </div>

          {psds.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#52636a] dark:text-[#a0aeaf] border border-dashed border-[#dce4e2] dark:border-[#354246] rounded-lg">
              Nenhum arquivo .psd na pasta. Arraste arquivos .psd para a área de upload acima.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {psds.map(psd => (
                <div
                  key={psd.id}
                  className="p-3.5 rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] flex flex-col justify-between gap-3 hover:border-[#226380] transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#113240] text-white">
                        PSD
                      </span>
                      <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
                        {psd.tamanho || '18 MB'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-[#113240] dark:text-white truncate" title={psd.nome}>
                        {psd.nome}
                      </h4>
                      <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] line-clamp-2 mt-0.5">
                        {psd.descricao || 'Template de post para redes sociais com camadas editáveis.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#dce4e2] dark:border-[#354246] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onAbrirPhotoCraft(psd.arquivo_url || psd.valor, psd.nome)}
                      className="flex-1 py-1.5 px-2.5 rounded bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      title="Editar camadas no PhotoCraft"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Editar no PhotoCraft</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => baixarArquivo(psd.arquivo_url || psd.valor, psd.nome)}
                      className="p-1.5 rounded border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-200 dark:hover:bg-slate-700 text-[#113240] dark:text-white transition-colors"
                      title="Baixar arquivo PSD"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja remover "${psd.nome}" da biblioteca?`)) {
                          onExcluirAsset(psd.id);
                        }
                      }}
                      className="p-1.5 rounded border border-transparent hover:border-red-300 dark:hover:border-red-800 text-slate-400 hover:text-red-600 transition-colors"
                      title="Excluir arquivo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Seção 2: Vetores e Ilustrações (.SVG / .AI) */}
      {(filtroAtivo === 'todos' || filtroAtivo === 'vetor') && (
        <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-[#226380]" />
              <h3 className="text-xs font-semibold text-[#113240] dark:text-white">
                Vetores e ilustrações escaláveis (.SVG / .AI)
              </h3>
            </div>
            <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
              Edição direta no VectorCraft
            </span>
          </div>

          {vetores.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#52636a] dark:text-[#a0aeaf] border border-dashed border-[#dce4e2] dark:border-[#354246] rounded-lg">
              Nenhum vetor na pasta. Suba arquivos .svg ou .ai para disponibilizar nesta seção.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {vetores.map(vetor => (
                <div
                  key={vetor.id}
                  className="p-3.5 rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] flex flex-col justify-between gap-3 hover:border-[#226380] transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#226380] text-white">
                        {vetor.extensao ? vetor.extensao.toUpperCase() : 'SVG'}
                      </span>
                      <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
                        {vetor.tamanho || '240 KB'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-white dark:bg-black/30 border border-[#dce4e2] dark:border-[#354246] flex items-center justify-center p-1.5 shrink-0">
                        {vetor.arquivo_url || vetor.valor ? (
                          <img
                            src={vetor.arquivo_url || vetor.valor}
                            alt={vetor.nome}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <PenTool className="w-5 h-5 text-[#226380]" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-[#113240] dark:text-white truncate" title={vetor.nome}>
                          {vetor.nome}
                        </h4>
                        <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] line-clamp-2 mt-0.5">
                          {vetor.descricao || 'Insígnia vetorial escalável para impressos e mídias digitais.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#dce4e2] dark:border-[#354246] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onAbrirVectorCraft(vetor.arquivo_url || vetor.valor, vetor.nome)}
                      className="flex-1 py-1.5 px-2.5 rounded bg-white dark:bg-[#253034] hover:bg-slate-100 dark:hover:bg-[#354246] border border-[#dce4e2] dark:border-[#354246] text-[#113240] dark:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      title="Editar vetor no VectorCraft"
                    >
                      <PenTool className="w-3.5 h-3.5 text-[#226380]" />
                      <span>Editar no VectorCraft</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => baixarArquivo(vetor.arquivo_url || vetor.valor, vetor.nome)}
                      className="p-1.5 rounded border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-200 dark:hover:bg-slate-700 text-[#113240] dark:text-white transition-colors"
                      title="Baixar arquivo vetor"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja remover "${vetor.nome}" da biblioteca?`)) {
                          onExcluirAsset(vetor.id);
                        }
                      }}
                      className="p-1.5 rounded border border-transparent hover:border-red-300 dark:hover:border-red-800 text-slate-400 hover:text-red-600 transition-colors"
                      title="Excluir arquivo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Seção 3: Logotipos & Brasões Oficiais */}
      {(filtroAtivo === 'todos' || filtroAtivo === 'logo') && (
        <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#226380]" />
              <h3 className="text-xs font-semibold text-[#113240] dark:text-white">
                Logotipos e brasões oficiais
              </h3>
            </div>
            <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
              Formatos PNG e transparência de alta definição
            </span>
          </div>

          {logos.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#52636a] dark:text-[#a0aeaf] border border-dashed border-[#dce4e2] dark:border-[#354246] rounded-lg">
              Nenhum logotipo cadastrado. Use o botão acima para subir novos logos.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {logos.map(logo => (
                <div
                  key={logo.id}
                  className="p-3.5 rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] flex flex-col justify-between gap-3 hover:border-[#226380] transition-colors"
                >
                  <div className="space-y-2">
                    <div className="w-full h-24 rounded bg-slate-100 dark:bg-black/30 border border-[#dce4e2] dark:border-[#354246] flex items-center justify-center p-3 relative overflow-hidden">
                      <img
                        src={logo.arquivo_url || logo.valor}
                        alt={logo.nome}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-[#113240] dark:text-white truncate" title={logo.nome}>
                          {logo.nome}
                        </h4>
                        <span className="text-xs text-[#52636a] dark:text-[#a0aeaf] shrink-0 ml-2">
                          {logo.tamanho || 'PNG'}
                        </span>
                      </div>
                      <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] line-clamp-2 mt-0.5">
                        {logo.descricao || 'Logotipo oficial da Província BRM.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#dce4e2] dark:border-[#354246] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => baixarArquivo(logo.arquivo_url || logo.valor, logo.nome)}
                      className="flex-1 py-1.5 px-2.5 rounded bg-white dark:bg-[#253034] hover:bg-slate-100 dark:hover:bg-[#354246] border border-[#dce4e2] dark:border-[#354246] text-[#113240] dark:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      title="Download do arquivo"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar arquivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onAbrirPhotoCraft(logo.arquivo_url || logo.valor, logo.nome)}
                      className="p-1.5 rounded border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-200 dark:hover:bg-slate-700 text-[#113240] dark:text-white transition-colors"
                      title="Editar ou recortar no PhotoCraft"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja remover "${logo.nome}" da biblioteca?`)) {
                          onExcluirAsset(logo.id);
                        }
                      }}
                      className="p-1.5 rounded border border-transparent hover:border-red-300 dark:hover:border-red-800 text-slate-400 hover:text-red-600 transition-colors"
                      title="Excluir logotipo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Seção 4: Tipografias e Fontes Oficiais */}
      {(filtroAtivo === 'todos' || filtroAtivo === 'tipografia') && (
        <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-[#226380]" />
              <h3 className="text-xs font-semibold text-[#113240] dark:text-white">
                Tipografias institucionais e arquivos de fonte
              </h3>
            </div>
            <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
              Instruções de uso editorial
            </span>
          </div>

          {tipografias.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#52636a] dark:text-[#a0aeaf] border border-dashed border-[#dce4e2] dark:border-[#354246] rounded-lg">
              Nenhuma tipografia cadastrada. Suba arquivos de fonte (.ttf ou .otf) acima.
            </div>
          ) : (
            <div className="space-y-3">
              {tipografias.map(t => (
                <div
                  key={t.id}
                  className="p-4 rounded-lg bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-[#113240] dark:text-white">
                        {t.nome}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[#52636a] dark:text-[#a0aeaf]">
                        {t.extensao ? t.extensao.toUpperCase() : 'TTF'}
                      </span>
                      {t.tamanho && (
                        <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
                          {t.tamanho}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
                      {t.descricao}
                    </p>
                    <div
                      className="p-2.5 rounded bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] text-[#113240] dark:text-white text-base"
                      style={{ fontFamily: t.valor }}
                    >
                      Província Brasil Meridional · Padres do Sagrado Coração de Jesus
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {t.arquivo_url && t.arquivo_url.startsWith('http') ? (
                      <a
                        href={t.arquivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-3 rounded bg-white dark:bg-[#253034] border border-[#dce4e2] dark:border-[#354246] text-xs font-medium text-[#113240] dark:text-white hover:bg-slate-100 transition-colors"
                      >
                        Acessar no Google Fonts
                      </a>
                    ) : t.arquivo_url ? (
                      <button
                        type="button"
                        onClick={() => baixarArquivo(t.arquivo_url || t.valor, t.nome)}
                        className="py-1.5 px-3 rounded bg-white dark:bg-[#253034] border border-[#dce4e2] dark:border-[#354246] text-xs font-medium text-[#113240] dark:text-white hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar fonte</span>
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja remover "${t.nome}" da biblioteca?`)) {
                          onExcluirAsset(t.id);
                        }
                      }}
                      className="p-1.5 rounded border border-transparent hover:border-red-300 dark:hover:border-red-800 text-slate-400 hover:text-red-600 transition-colors"
                      title="Excluir tipografia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Seção 5: Cores Institucionais e Litúrgicas */}
      {(filtroAtivo === 'todos' || filtroAtivo === 'cor') && (
        <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#226380]" />
              <h3 className="text-xs font-semibold text-[#113240] dark:text-white">
                Cores institucionais e litúrgicas
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
                Clique para copiar o código HEX
              </span>
              <button
                type="button"
                onClick={() => setModalNovaCor(true)}
                className="text-xs font-semibold text-[#226380] hover:underline"
              >
                + Adicionar cor
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {cores.map(cor => (
              <div
                key={cor.id}
                onClick={() => copiarHex(cor.valor)}
                className="cursor-pointer rounded-lg border border-[#dce4e2] dark:border-[#354246] p-2.5 bg-[#f8faf9] dark:bg-[#141a1c] hover:border-[#226380] transition-colors space-y-2 relative group"
              >
                <div
                  className="w-full h-14 rounded flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: cor.valor }}
                >
                  {copiadoHex === cor.valor && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-semibold">
                      <Check className="w-3.5 h-3.5 mr-1" /> Copiado
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#113240] dark:text-white truncate" title={cor.nome}>
                    {cor.nome}
                  </p>
                  <div className="flex items-center justify-between mt-0.5 text-xs text-[#52636a] dark:text-[#a0aeaf]">
                    <span>{cor.valor}</span>
                    <Copy className="w-3 h-3 text-slate-400 group-hover:text-[#226380]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para Adicionar Nova Cor */}
      {modalNovaCor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#dce4e2] dark:border-[#354246] pb-3">
              <h3 className="text-sm font-semibold text-[#113240] dark:text-white">
                Adicionar nova cor à paleta oficial
              </h3>
              <button
                type="button"
                onClick={() => setModalNovaCor(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSalvarNovaCor} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-[#113240] dark:text-white block mb-1">
                  Nome da cor
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Roxo Quaresmal ou Dourado Centenário"
                  value={novaCorNome}
                  onChange={e => setNovaCorNome(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:border-[#226380]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#113240] dark:text-white block mb-1">
                    Código HEX
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={novaCorHex}
                      onChange={e => setNovaCorHex(e.target.value)}
                      className="w-8 h-8 rounded border-0 p-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      required
                      value={novaCorHex}
                      onChange={e => setNovaCorHex(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:border-[#226380]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#113240] dark:text-white block mb-1">
                    Categoria
                  </label>
                  <select
                    value={novaCorCategoria}
                    onChange={e => setNovaCorCategoria(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:border-[#226380]"
                  >
                    <option value="Paleta Oficial">Paleta Oficial</option>
                    <option value="Liturgia">Liturgia</option>
                    <option value="Campanha">Campanha Pastoral</option>
                    <option value="Eventos">Eventos e Jubileus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#113240] dark:text-white block mb-1">
                  Uso recomendado ou descrição
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Tempo litúrgico do Advento e Quaresma em capas de carrosséis."
                  value={novaCorDescricao}
                  onChange={e => setNovaCorDescricao(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:border-[#226380]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovaCor(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#52636a] dark:text-[#a0aeaf] hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold"
                >
                  Salvar cor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
