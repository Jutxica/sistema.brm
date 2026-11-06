import React, { useState } from 'react';
import { X, ExternalLink, Image as ImageIcon, Layers, Maximize2, Minimize2, Check } from 'lucide-react';

interface ArtCraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'photocraft' | 'vectorcraft';
  arquivoUrl?: string;
  arquivoNome?: string;
  onSalvar?: (novaUrl: string) => void;
}

export const ArtCraftModal: React.FC<ArtCraftModalProps> = ({
  isOpen,
  onClose,
  tipo,
  arquivoUrl,
  arquivoNome = 'arte_post.psd',
  onSalvar
}) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvoSucesso, setSalvoSucesso] = useState(false);

  if (!isOpen) return null;

  const appTitle = tipo === 'photocraft' ? 'PhotoCraft · Editor de Imagens e PSD' : 'VectorCraft · Editor de Vetores e Ilustrações';
  const iframeUrl = tipo === 'photocraft' 
    ? 'https://getartcraft.com/apps' 
    : 'https://getartcraft.com/apps';

  const handleSalvar = () => {
    setSalvando(true);
    setTimeout(() => {
      setSalvando(false);
      setSalvoSucesso(true);
      if (onSalvar && arquivoUrl) {
        onSalvar(arquivoUrl);
      }
      setTimeout(() => {
        setSalvoSucesso(false);
        onClose();
      }, 1200);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 animate-in fade-in duration-200">
      <div 
        className={`bg-[#1c2427] border border-white/10 rounded-2xl flex flex-col overflow-hidden w-full ${
          fullscreen ? 'h-[98vh] max-w-[99vw]' : 'h-[88vh] max-w-6xl'
        }`}
      >
        {/* Header da Barra de Ferramentas */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#141a1c] border-b border-white/10 select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#226380]/30 border border-[#226380] flex items-center justify-center text-[#A3C3C7]">
              {tipo === 'photocraft' ? <ImageIcon className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{appTitle}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ArtCraft Suite
                </span>
              </div>
              <p className="text-xs text-[#86868b]">
                Editando: <span className="text-white font-medium">{arquivoNome}</span> · sem sair do navegador
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://getartcraft.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#86868b] hover:text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
              title="Abrir GetArtCraft em nova aba"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>getartcraft.com</span>
            </a>

            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="p-1.5 text-[#86868b] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              title={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleSalvar}
              disabled={salvando || salvoSucesso}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                salvoSucesso
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#226380] hover:bg-[#1a4f66] text-white'
              }`}
            >
              {salvoSucesso ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Arte Salva!</span>
                </>
              ) : salvando ? (
                <span>Salvando...</span>
              ) : (
                <span>Salvar Alterações</span>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-[#86868b] hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Área Central de Edição */}
        <div className="flex-1 bg-[#0f1416] relative flex flex-col overflow-hidden">
          {/* Iframe conectado ao ArtCraft Suite */}
          <iframe
            src={iframeUrl}
            title={appTitle}
            className="w-full h-full border-0"
            allow="clipboard-read; clipboard-write; fullscreen"
          />

          {/* Dica Flutuante Inferior */}
          <div className="absolute bottom-3 left-4 right-4 sm:left-auto sm:right-4 z-20 pointer-events-none">
            <div className="bg-[#1c2427] border border-white/10 text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                <strong>Dica Pro:</strong> Você pode arrastar seu arquivo <code>.psd</code> ou <code>.svg</code> diretamente na tela para editar camadas, textos e cores.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
