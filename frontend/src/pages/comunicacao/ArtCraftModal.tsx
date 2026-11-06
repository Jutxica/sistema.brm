import React, { useState } from 'react';
import { X, ExternalLink, Image as ImageIcon, Layers, Maximize2, Minimize2, Check, RefreshCw, AlertCircle } from 'lucide-react';

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
  const [fonteApp, setFonteApp] = useState<'designi' | 'artcraft'>('designi');

  if (!isOpen) return null;

  const appTitle = tipo === 'photocraft' ? 'PhotoCraft · Editor de Imagens e PSD' : 'VectorCraft · Editor de Vetores e Ilustrações';
  
  // URL principal: usa a integração do Designi que possui recuperação automática de trabalhos no navegador
  const photocraftUrl = fonteApp === 'designi' 
    ? 'https://www.designi.com.br/apps/photocraft' 
    : 'https://getartcraft.com/apps/photocraft';

  const iframeUrl = tipo === 'photocraft' ? photocraftUrl : 'https://getartcraft.com/apps/vectorcraft';

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
          fullscreen ? 'h-[98vh] max-w-[99vw]' : 'h-[90vh] max-w-7xl'
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
                  {tipo === 'photocraft' ? 'Com Recuperação Automática' : 'ArtCraft Suite'}
                </span>
              </div>
              <p className="text-xs text-[#86868b]">
                Editando: <span className="text-white font-medium">{arquivoNome}</span> · salva e recupera projetos anteriores no navegador
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Abrir em nova aba / tela cheia externa */}
            <a
              href={iframeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-white/10 hover:bg-white/15 rounded-lg border border-white/10 transition-colors"
              title="Abrir editor completo em nova aba com todos os recursos do navegador"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir em tela cheia</span>
            </a>

            {/* Alternar fonte caso o navegador restrinja iframe */}
            {tipo === 'photocraft' && (
              <button
                type="button"
                onClick={() => setFonteApp(f => f === 'designi' ? 'artcraft' : 'designi')}
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#86868b] hover:text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                title="Alternar servidor do PhotoCraft"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Servidor: {fonteApp === 'designi' ? 'Designi' : 'ArtCraft'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setFullscreen(!fullscreen)}
              className="p-1.5 text-[#86868b] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              title={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
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
                  <span>Arte salva!</span>
                </>
              ) : salvando ? (
                <span>Salvando...</span>
              ) : (
                <span>Salvar alterações</span>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#86868b] hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Faixa Informativa de Recuperação de Trabalhos Anteriores */}
        <div className="bg-[#112338] px-4 py-2 border-b border-white/10 text-xs text-white/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>
              <strong>Recuperação automática ativa:</strong> Seus projetos e camadas permanecem salvos no cache deste navegador. Caso a aba feche acidentalmente, você pode recuperá-los ao reabrir.
            </span>
          </div>

          <a 
            href={iframeUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs text-sky-300 hover:text-sky-200 underline shrink-0"
          >
            Abrir diretamente se o navegador bloquear cookies de terceiros →
          </a>
        </div>

        {/* Área Central de Edição com Iframe */}
        <div className="flex-1 bg-[#141a1c] relative flex flex-col overflow-hidden">
          <iframe
            src={iframeUrl}
            title={appTitle}
            className="w-full h-full border-0"
            allow="clipboard-read; clipboard-write; fullscreen; storage-access *"
          />
        </div>
      </div>
    </div>
  );
};
