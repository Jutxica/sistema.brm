import React, { useEffect, useState } from 'react';
import { 
  gerarCodigoVerificador, 
  registrarDocumentoOficial, 
  gerarQrCodeDataUrl 
} from '../lib/autenticacaoDocumental';

interface SeloAutenticidadeDocumentoProps {
  tipo: string;
  id: string | number;
  titulo: string;
  identificadorOficial?: string;
  comunidadeObra?: string;
  situacao?: string;
  className?: string;
}

export const SeloAutenticidadeDocumento: React.FC<SeloAutenticidadeDocumentoProps> = ({
  tipo,
  id,
  titulo,
  identificadorOficial,
  comunidadeObra,
  situacao,
  className = ''
}) => {
  const [codigo, setCodigo] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [dataEmissaoFormatada, setDataEmissaoFormatada] = useState('');

  useEffect(() => {
    // 1. Gera e registra formalmente o documento
    const reg = registrarDocumentoOficial({
      tipo,
      id,
      titulo,
      identificador_oficial: identificadorOficial,
      comunidade_obra: comunidadeObra,
      situacao
    });

    setCodigo(reg.codigo);
    
    // Formatação da data de emissão
    const agora = new Date();
    const dataFmt = `${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    setDataEmissaoFormatada(dataFmt);

    // 2. Constrói a URL oficial de conferência pública
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sistema.brm.org.br';
    const urlValidacao = `${baseUrl}/validar?codigo=${encodeURIComponent(reg.codigo)}`;

    // 3. Gera o QR Code visual
    gerarQrCodeDataUrl(urlValidacao).then(url => {
      setQrCodeUrl(url);
    });
  }, [tipo, id, titulo, identificadorOficial, comunidadeObra, situacao]);

  if (!codigo) return null;

  return (
    <div className={`mt-6 pt-3 pb-2 px-3 border border-slate-300 dark:border-slate-700 print:border-black rounded bg-slate-50/70 dark:bg-slate-900/50 print:bg-white select-none ${className}`}>
      <div className="flex items-center gap-3">
        {/* QR Code de Autenticidade Notarial */}
        <div className="flex-shrink-0 bg-white p-1 border border-slate-200 print:border-black rounded">
          {qrCodeUrl ? (
            <img 
              src={qrCodeUrl} 
              alt={`QR Code de Autenticidade - ${codigo}`} 
              className="w-16 h-16 sm:w-18 sm:h-18 print:w-16 print:h-16 object-contain"
            />
          ) : (
            <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-[8pt] text-slate-400">
              QR Code
            </div>
          )}
        </div>

        {/* Textos Notariais e Código Verificador */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span className="font-serif font-bold uppercase tracking-wider text-[8.5pt] sm:text-[9pt] print:text-[8pt] text-slate-900 print:text-black">
              Chancela de Autenticidade & Fé Pública Digital
            </span>
            <span className="text-[7pt] sm:text-[7.5pt] print:text-[6.5pt] font-mono text-slate-500 print:text-slate-600">
              Expedido em {dataEmissaoFormatada}
            </span>
          </div>

          <div className="my-1 flex items-center gap-2 flex-wrap">
            <span className="text-[7.5pt] sm:text-[8pt] print:text-[7.5pt] text-slate-600 print:text-black font-sans">
              Código Verificador:
            </span>
            <span className="font-mono font-bold text-[9.5pt] sm:text-[10pt] print:text-[9pt] tracking-widest text-[#113240] print:text-black bg-slate-200/60 print:bg-transparent px-1.5 py-0.5 rounded">
              {codigo}
            </span>
          </div>

          <p className="text-[7pt] sm:text-[7.5pt] print:text-[6.8pt] text-slate-500 dark:text-slate-400 print:text-slate-700 leading-tight">
            Documento expedido pelos arquivos da Sede Provincial BRM (Corupá/SC). A autenticidade, integridade e conformidade deste instrumento podem ser confirmadas publicamente por qualquer autoridade civil ou eclesiástica apontando a câmera para o QR Code ao lado ou acessando <strong>sistema.brm.org.br/validar</strong> e informando o código acima.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SeloAutenticidadeDocumento;
