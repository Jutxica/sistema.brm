import React, { useState } from 'react';
import { 
  Palette, Type, Layers, Image as ImageIcon, Copy, Check, 
  Download, PenTool
} from 'lucide-react';
import type { ComunicacaoBrandAsset } from '../../types/comunicacao';

interface EstudioArteViewProps {
  assets: ComunicacaoBrandAsset[];
  onAbrirPhotoCraft: () => void;
  onAbrirVectorCraft: () => void;
}

export const EstudioArteView: React.FC<EstudioArteViewProps> = ({
  assets,
  onAbrirPhotoCraft,
  onAbrirVectorCraft
}) => {
  const [copiadoHex, setCopiadoHex] = useState<string | null>(null);

  const cores = assets.filter(a => a.tipo === 'cor');
  const logos = assets.filter(a => a.tipo === 'logo');
  const tipografias = assets.filter(a => a.tipo === 'tipografia');

  const copiarHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiadoHex(hex);
    setTimeout(() => setCopiadoHex(null), 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#113240] dark:text-white tracking-tight">
          Estúdio de arte e Brand Hub
        </h1>
        <p className="text-xs text-[#52636a] dark:text-[#a0aeaf] mt-1">
          Identidade visual oficial da Província BRM e ferramentas criativas para edição no navegador via ArtCraft Suite.
        </p>
      </div>

      {/* Painel ArtCraft Suite (PhotoCraft & VectorCraft) em cor plana */}
      <div className="bg-[#113240] rounded-xl p-6 text-white border border-[#1a3452] grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        <div className="md:col-span-8 space-y-1.5">
          <span className="text-xs font-semibold text-[#A3C3C7] block">
            Edição gráfica no navegador
          </span>
          <h2 className="text-lg font-bold">
            Edite arquivos PSD e Vetores diretamente no sistema
          </h2>
          <p className="text-xs text-white/80 leading-relaxed max-w-xl">
            Abra arquivos <code>.psd</code> com camadas no <strong>PhotoCraft</strong> ou edite ilustrações vetoriais e brasões no <strong>VectorCraft</strong>. Faça ajustes em tipografia, cores e fotos de qualquer dispositivo.
          </p>
        </div>

        <div className="md:col-span-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onAbrirPhotoCraft}
            className="w-full py-2 px-3.5 rounded-lg bg-white text-[#113240] hover:bg-slate-100 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <ImageIcon className="w-4 h-4 text-[#226380]" />
            <span>Abrir no PhotoCraft (PSD)</span>
          </button>

          <button
            type="button"
            onClick={onAbrirVectorCraft}
            className="w-full py-2 px-3.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/20 transition-colors flex items-center justify-center gap-2"
          >
            <PenTool className="w-4 h-4 text-[#A3C3C7]" />
            <span>Abrir no VectorCraft (Vetores)</span>
          </button>
        </div>
      </div>

      {/* 1. Cores Oficiais */}
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#226380]" />
            <h3 className="text-xs font-semibold text-[#113240] dark:text-white">
              Cores Institucionais e Litúrgicas
            </h3>
          </div>
          <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
            Clique para copiar o código
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {cores.map(cor => (
            <div
              key={cor.id}
              onClick={() => copiarHex(cor.valor)}
              className="cursor-pointer rounded-lg border border-[#dce4e2] dark:border-[#354246] p-2.5 bg-[#f8faf9] dark:bg-[#141a1c] hover:border-[#226380] transition-colors space-y-2"
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
                <p className="text-xs font-semibold text-[#113240] dark:text-white truncate">
                  {cor.nome}
                </p>
                <div className="flex items-center justify-between mt-0.5 text-xs text-[#52636a] dark:text-[#a0aeaf]">
                  <span>{cor.valor}</span>
                  <Copy className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Logotipos */}
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#226380]" />
            <h3 className="text-xs font-semibold text-[#113240] dark:text-white">
              Logotipos e Brasões Oficiais
            </h3>
          </div>
          <span className="text-xs text-[#52636a] dark:text-[#a0aeaf]">
            Arquivos em alta definição
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {logos.map(logo => (
            <div
              key={logo.id}
              className="p-3.5 rounded-lg border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-white dark:bg-black/30 border border-[#dce4e2] dark:border-[#354246] flex items-center justify-center p-1.5">
                  <img src={logo.valor} alt={logo.nome} className="max-h-full max-w-full object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#113240] dark:text-white">{logo.nome}</h4>
                  <p className="text-xs text-[#52636a] dark:text-[#a0aeaf]">{logo.descricao}</p>
                </div>
              </div>

              <a
                href={logo.valor}
                download
                className="p-1.5 rounded-lg border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-200 dark:hover:bg-slate-700 text-[#113240] dark:text-white transition-colors"
                title="Download do arquivo"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Tipografias */}
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
          <Type className="w-4 h-4 text-[#226380]" />
          <h3 className="text-xs font-semibold text-[#113240] dark:text-white">
            Tipografias Institucionais
          </h3>
        </div>

        <div className="space-y-2.5">
          {tipografias.map(t => (
            <div
              key={t.id}
              className="p-3.5 rounded-lg bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] flex flex-col sm:flex-row sm:items-center justify-between gap-1"
            >
              <div>
                <h4 className="text-xs font-semibold text-[#113240] dark:text-white">{t.nome}</h4>
                <p className="text-xs text-[#52636a] dark:text-[#a0aeaf]">{t.descricao}</p>
              </div>
              <div>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[#52636a] dark:text-[#a0aeaf]">
                  {t.valor}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
