import React, { useState } from 'react';
import { Printer, ArrowLeft, RotateCw, Shield, FileText, Check } from 'lucide-react';

export type OrientacaoDocumento = 'vertical' | 'horizontal';

export interface PapelTimbradoBRMProps {
  children: React.ReactNode;
  orientacao?: OrientacaoDocumento;
  permitirTrocaOrientacao?: boolean;
  tituloDocumento?: string;
  subtituloDocumento?: string;
  orgaoEmissor?: string;
  protocolo?: string;
  dataEmissao?: string;
  mostrarControles?: boolean;
  modoFormulario?: boolean;
  onVoltar?: () => void;
  className?: string;
  marcaDagua?: boolean;
  rodapeComplementar?: React.ReactNode;
}

/**
 * Cabeçalho Oficial do Papel Timbrado BRM
 * Reproduz fielmente a matriz gráfica do documento oficial docx da Província.
 */
export const CabecalhoTimbradoBRM: React.FC<{
  orgaoEmissor?: string;
  protocolo?: string;
  dataEmissao?: string;
  subtituloDocumento?: string;
}> = ({ orgaoEmissor, protocolo, dataEmissao, subtituloDocumento }) => {
  return (
    <header className="brm-letterhead-header relative w-full pt-4 pb-6 text-center select-none print:pt-0 print:pb-5">
      {/* Identificador Institucional no Canto Superior Direito (Paleta Cinza Discreta) */}
      <div className="brm-letterhead-system absolute top-0 right-0 text-right text-[7pt] sm:text-[7.5pt] print:text-[6.5pt] font-mono text-slate-400 dark:text-slate-500 print:text-slate-400 opacity-60 tracking-wider pointer-events-none select-none">
        Secretaria Provincial
      </div>

      {/* Brasão / Emblema Dehoniano Oficial Centralizado */}
      <div className="brm-letterhead-emblem flex justify-center items-center mb-3">
        <img
          src="/logo-timbrado-brm.png"
          alt="Emblema Oficial Dehoniano - Província BRM"
          className="h-[68px] sm:h-[72px] w-auto object-contain print:h-[65px]"
        />
      </div>

      {/* 1ª Linha: Congregação (Cormorant Garamond 13pt Regular) */}
      <h1 className="brm-letterhead-congregation font-timbrado text-[16px] sm:text-[18px] print:text-[13pt] font-normal uppercase tracking-[0.04em] text-[#113240] dark:text-slate-100 print:text-black leading-tight">
        CONGREGAÇÃO DOS SACERDOTES DO SAGRADO CORAÇÃO DE JESUS
      </h1>

      {/* 2ª Linha: Província (Cormorant Garamond 14pt SemiBold) */}
      <h2 className="brm-letterhead-province font-timbrado text-[18px] sm:text-[20px] print:text-[14pt] font-semibold text-[#113240] dark:text-white print:text-black mt-1 leading-tight">
        Província Brasileira Meridional
      </h2>

      {/* Faixa de Protocolo / Data se fornecido */}
      {(protocolo || dataEmissao || subtituloDocumento) && (
        <div className="brm-letterhead-meta mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800 print:border-slate-300 flex flex-wrap items-center justify-between text-[11px] sm:text-[12px] print:text-[9pt] font-mono text-slate-500 dark:text-slate-400 print:text-slate-700 px-2">
          <div>
            {subtituloDocumento && <span className="font-semibold text-slate-700 dark:text-slate-200 print:text-black">{subtituloDocumento}</span>}
          </div>
          <div className="flex items-center gap-4">
            {protocolo && (
              <span>
                <strong>Protocolo:</strong> {protocolo}
              </span>
            )}
            {dataEmissao && (
              <span>
                <strong>Emissão:</strong> {dataEmissao}
              </span>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

/**
 * Rodapé Oficial do Papel Timbrado BRM
 * Reproduz fielmente a linha divisória e o endereço canônico da sede provincial em Corupá/SC.
 */
export const RodapeTimbradoBRM: React.FC<{
  conteudoAdicional?: React.ReactNode;
}> = ({ conteudoAdicional }) => {
  return (
    <footer className="brm-letterhead-footer mt-8 pt-4 pb-2 w-full text-center select-none print:mt-6 print:pt-3 print-no-break">
      {conteudoAdicional && (
        <div className="mb-4">
          {conteudoAdicional}
        </div>
      )}

      {/* Linha Divisória Fina (#a0a0a0) */}
      <div className="w-full border-t border-[#a0a0a0] dark:border-slate-700 print:border-[#94a3b8] mb-2.5" />

      {/* 1ª Linha: Endereço Canônico da Sede */}
      <p className="font-timbrado text-[12px] sm:text-[13.5px] print:text-[10pt] text-slate-700 dark:text-slate-300 print:text-black leading-snug">
        Rua Padre Gabriel Lux, 900 – Caixa Postal 21 – Corupá/SC | CEP 89278-000
      </p>

      {/* 2ª Linha: Contatos Oficiais */}
      <p className="font-timbrado text-[11px] sm:text-[12.5px] print:text-[9.5pt] text-slate-600 dark:text-slate-400 print:text-black mt-0.5 leading-snug">
        Telefone: +55 (47) 3375-1194 | E-mail: secretaria@brm.org.br | Site: scj.org.br
      </p>
    </footer>
  );
};

/**
 * Componente Master de Papel Timbrado BRM
 * Oferece suporte completo a modo Retrato (Vertical) e Paisagem (Horizontal),
 * botões de controle de impressão e fidelidade ao padrão tipográfico oficial.
 */
export const PapelTimbradoBRM: React.FC<PapelTimbradoBRMProps> = ({
  children,
  orientacao = 'vertical',
  permitirTrocaOrientacao = true,
  tituloDocumento,
  subtituloDocumento,
  orgaoEmissor,
  protocolo,
  dataEmissao,
  mostrarControles = true,
  modoFormulario = false,
  onVoltar,
  className = '',
  marcaDagua = true,
  rodapeComplementar
}) => {
  const [orientacaoAtual, setOrientacaoAtual] = useState<OrientacaoDocumento>(orientacao);

  const alternarOrientacao = () => {
    setOrientacaoAtual(prev => (prev === 'vertical' ? 'horizontal' : 'vertical'));
  };

  const handleImprimir = () => {
    window.print();
  };

  const isPaisagem = orientacaoAtual === 'horizontal';

  return (
    <div className={`brm-letterhead-shell w-full py-2 sm:py-6 print:p-0 print:m-0 ${modoFormulario ? 'brm-form-shell' : ''}`}>
      {/* Injeção dinâmica de CSS @page para respeitar a orientação selecionada no diálogo de impressão do navegador */}
      <style>
        {`
          ${modoFormulario ? `
            .brm-form-shell {
              min-height: 100vh;
              padding: 2rem 1rem 4rem !important;
              background:
                radial-gradient(ellipse at 12% 5%, rgba(193, 217, 207, .48), transparent 36rem),
                radial-gradient(ellipse at 92% 18%, rgba(220, 233, 229, .78), transparent 32rem),
                linear-gradient(145deg, #f2f6f4, #f8faf9 50%, #edf3f1);
            }
            .brm-form-shell .brm-letterhead-document {
              max-width: 900px !important;
              padding: 2rem 2.5rem !important;
              border: 1px solid rgba(214, 228, 223, .9) !important;
              border-radius: 1.75rem !important;
              background: rgba(255, 255, 255, .96) !important;
              box-shadow: 0 28px 90px rgba(17, 50, 64, .12) !important;
              overflow: visible !important;
            }
            .brm-form-shell .brm-letterhead-header {
              padding: .25rem 0 1.5rem !important;
              border-bottom: 1px solid #e3ece9;
            }
            .brm-form-shell .brm-letterhead-system { display: none; }
            .brm-form-shell .brm-letterhead-emblem { margin-bottom: .8rem !important; }
            .brm-form-shell .brm-letterhead-emblem img { height: 56px !important; }
            .brm-form-shell .brm-letterhead-congregation {
              font-family: Arial, sans-serif !important;
              font-size: .68rem !important;
              font-weight: 700 !important;
              letter-spacing: .13em !important;
              color: #648087 !important;
            }
            .brm-form-shell .brm-letterhead-province {
              margin-top: .35rem !important;
              font-size: 1.35rem !important;
              color: #163642 !important;
            }
            .brm-form-shell .brm-letterhead-meta {
              justify-content: center !important;
              margin-top: 1rem !important;
              padding: .7rem 0 0 !important;
              border-top: 1px solid #e3ece9 !important;
              font-family: Arial, sans-serif !important;
            }
            .brm-form-shell .brm-letterhead-title {
              margin: 1.75rem 0 !important;
            }
            .brm-form-shell .brm-letterhead-title h3 {
              font-size: clamp(1.5rem, 3vw, 2rem) !important;
              color: #163642 !important;
            }
            .brm-form-shell .brm-letterhead-content {
              min-height: 0 !important;
              font-family: Arial, sans-serif !important;
            }
            .brm-form-shell .brm-letterhead-footer {
              margin-top: 2.5rem !important;
              color: #73858a !important;
            }
            .brm-form-shell .brm-letterhead-footer p {
              font-family: Arial, sans-serif !important;
              font-size: .7rem !important;
            }
            .brm-form-shell .brm-letterhead-watermark { display: none; }
            @media (max-width: 640px) {
              .brm-form-shell { padding: 1rem .75rem 2rem !important; }
              .brm-form-shell .brm-letterhead-document {
                padding: 1.25rem !important;
                border-radius: 1.25rem !important;
              }
              .brm-form-shell .brm-letterhead-footer { margin-top: 1.5rem !important; }
            }
          ` : ''}
          @media print {
            @page {
              size: A4 ${isPaisagem ? 'landscape' : 'portrait'};
              margin: ${isPaisagem ? '10mm 14mm 12mm 14mm' : '12mm 16mm 14mm 16mm'};
            }
            html, body, #root {
              width: auto !important;
              min-width: 0 !important;
              height: auto !important;
              min-height: 0 !important;
              background: #fff !important;
            }
            #root, .institutional-app {
              display: block !important;
            }
            .institutional-content {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            body {
              margin: 0 !important;
              color: #202a2e !important;
              font-family: Georgia, 'Times New Roman', serif !important;
              font-size: 10.5pt !important;
              line-height: 1.55 !important;
            }
            .brm-letterhead-shell {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .brm-letterhead-document {
              display: flex !important;
              flex-direction: column !important;
              width: 100% !important;
              max-width: none !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              border: 0 !important;
              border-radius: 0 !important;
              background: #fff !important;
              color: #202a2e !important;
              box-shadow: none !important;
              font-family: Georgia, 'Times New Roman', serif !important;
              font-size: 10.5pt !important;
              line-height: 1.55 !important;
            }
            .brm-letterhead-document > .brm-letterhead-watermark {
              display: none !important;
            }
            .brm-letterhead-header {
              position: relative !important;
              display: grid !important;
              grid-template-columns: 22mm minmax(0, 1fr) !important;
              grid-template-rows: auto auto auto !important;
              align-items: center !important;
              column-gap: 6mm !important;
              width: 100% !important;
              margin: 0 0 8mm !important;
              padding: 0 0 5mm !important;
              border-bottom: 1.2pt solid #113240 !important;
              text-align: left !important;
              color: #113240 !important;
            }
            .brm-letterhead-system {
              top: 0 !important;
              right: 0 !important;
              color: #68777d !important;
              font-family: Arial, sans-serif !important;
              font-size: 7pt !important;
              opacity: 1 !important;
            }
            .brm-letterhead-emblem {
              grid-column: 1 !important;
              grid-row: 1 / span 2 !important;
              align-self: center !important;
              margin: 0 !important;
            }
            .brm-letterhead-emblem img {
              width: 20mm !important;
              height: 20mm !important;
              max-height: 20mm !important;
              object-fit: contain !important;
            }
            .brm-letterhead-congregation,
            .brm-letterhead-province {
              grid-column: 2 !important;
              margin: 0 !important;
              color: #113240 !important;
              text-align: left !important;
            }
            .brm-letterhead-congregation {
              align-self: end !important;
              padding-top: 4mm !important;
              font-size: 12pt !important;
              line-height: 1.25 !important;
            }
            .brm-letterhead-province {
              align-self: start !important;
              margin-top: 1mm !important;
              font-size: 14pt !important;
              line-height: 1.2 !important;
            }
            .brm-letterhead-meta {
              grid-column: 1 / -1 !important;
              width: 100% !important;
              margin-top: 4mm !important;
              padding: 2mm 0 0 !important;
              border-top: .5pt solid #c5d0d2 !important;
              color: #46565b !important;
              font-family: Arial, sans-serif !important;
              font-size: 8.5pt !important;
            }
            .brm-letterhead-meta strong {
              color: #24383e !important;
            }
            .brm-letterhead-title {
              margin: 0 0 6mm !important;
              color: #113240 !important;
              font-family: Georgia, 'Times New Roman', serif !important;
              font-size: 15pt !important;
              line-height: 1.25 !important;
              text-align: center !important;
              break-after: avoid-page;
            }
            .brm-letterhead-content {
              min-height: 0 !important;
              width: 100% !important;
              color: #202a2e !important;
              font-family: Georgia, 'Times New Roman', serif !important;
              font-size: 10.5pt !important;
              line-height: 1.55 !important;
            }
            .brm-letterhead-content h1,
            .brm-letterhead-content h2,
            .brm-letterhead-content h3 {
              color: #113240 !important;
              break-after: avoid-page;
            }
            .brm-letterhead-content p {
              orphans: 3;
              widows: 3;
            }
            .brm-letterhead-content table {
              width: 100% !important;
              border-collapse: collapse !important;
              font-size: 9pt !important;
              break-inside: auto;
            }
            .brm-letterhead-content th,
            .brm-letterhead-content td {
              padding: 2mm !important;
              border: .5pt solid #b8c4c7 !important;
              color: #202a2e !important;
              background: transparent !important;
            }
            .brm-letterhead-content tr {
              break-inside: avoid;
            }
            .brm-letterhead-form {
              font-family: Georgia, 'Times New Roman', serif !important;
            }
            .brm-letterhead-form section {
              break-inside: avoid-page;
            }
            .brm-letterhead-form section > div:first-child span {
              border-radius: 0 !important;
              background: transparent !important;
              color: #113240 !important;
              font-family: Arial, sans-serif !important;
              font-size: 8pt !important;
            }
            .brm-letterhead-form input:not([type="radio"]):not([type="checkbox"]),
            .brm-letterhead-form select,
            .brm-letterhead-form textarea {
              min-height: 7mm !important;
              padding: 1.5mm 0 !important;
              border: 0 !important;
              border-bottom: .5pt solid #9cabad !important;
              border-radius: 0 !important;
              background: transparent !important;
              color: #202a2e !important;
              font-family: Georgia, 'Times New Roman', serif !important;
              font-size: 10pt !important;
              box-shadow: none !important;
              appearance: none !important;
            }
            .brm-letterhead-form textarea {
              min-height: 16mm !important;
              resize: none !important;
            }
            .brm-letterhead-footer {
              margin-top: 10mm !important;
              padding-top: 3mm !important;
              border-top: .5pt solid #b8c4c7 !important;
              color: #46565b !important;
              font-family: Arial, sans-serif !important;
              line-height: 1.4 !important;
            }
            .brm-letterhead-footer p {
              color: #46565b !important;
              font-family: Arial, sans-serif !important;
              font-size: 8pt !important;
            }
          }
        `}
      </style>

      {/* Barra de Controles Superiores (Oculta na Impressão) */}
      {mostrarControles && (
        <div className={`mx-auto mb-4 print:hidden px-4 ${modoFormulario ? 'max-w-[900px]' : 'max-w-5xl'}`}>
          <div className={`flex flex-wrap items-center justify-between gap-3 border p-3 shadow-xs ${modoFormulario ? 'rounded-2xl border-white/70 bg-white/75 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-[#121d24]/80' : 'rounded-[8px] border-slate-200 bg-white dark:border-slate-800 dark:bg-[#161b22]'}`}>
            <div className="flex items-center gap-3">
              {onVoltar && (
                <button
                  type="button"
                  onClick={onVoltar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>
              )}
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf2ef] text-[#226380] dark:bg-white/10">
                  <Shield className="h-4 w-4" />
                </span>
                <span className="text-xs font-semibold text-[#113240] dark:text-white">
                  {modoFormulario ? 'Formulário oficial · Província BRM' : 'Papel Timbrado Oficial · Província BRM'}
                </span>
                <span className="text-[11px] font-mono text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  {isPaisagem ? 'Horizontal (Paisagem)' : 'Vertical (Retrato)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {permitirTrocaOrientacao && !modoFormulario && (
                <button
                  type="button"
                  onClick={alternarOrientacao}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Alternar entre modo Vertical (A4 Retrato) e Horizontal (A4 Paisagem)"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#226380]" />
                  <span>{isPaisagem ? 'Mudar para Vertical' : 'Mudar para Horizontal'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleImprimir}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[6px] bg-[#113240] text-white hover:bg-[#226380] text-xs font-semibold shadow-sm transition-all cursor-pointer motion-press"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / Salvar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folha do Documento (Simula A4 na tela e se ajusta à folha na impressão) */}
      <main
        className={`brm-letterhead-document mx-auto bg-white dark:bg-[#161b22] print:bg-white text-slate-900 dark:text-slate-100 print:text-black border border-slate-200 dark:border-slate-800 print:border-none shadow-md print:shadow-none print:m-0 print:p-0 transition-all duration-200 relative overflow-hidden ${
          isPaisagem
            ? 'max-w-[1140px] px-8 sm:px-14 py-8 sm:py-10 rounded-[6px] print:max-w-none'
            : 'max-w-[850px] px-6 sm:px-12 py-8 sm:py-12 rounded-[6px] print:max-w-none'
        } ${className}`}
      >
        {/* Marca d'água sutil Dehoniana centralizada (3% de opacidade) */}
        {marcaDagua && (
          <div
            aria-hidden="true"
            className="brm-letterhead-watermark pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.025] dark:opacity-[0.04] print:hidden select-none"
          >
            <img
              src="/logo-timbrado-brm.png"
              alt=""
              className="w-[320px] h-[320px] object-contain filter grayscale"
            />
          </div>
        )}

        {/* Cabeçalho Oficial BRM */}
        <CabecalhoTimbradoBRM
          orgaoEmissor={orgaoEmissor}
          protocolo={protocolo}
          dataEmissao={dataEmissao}
          subtituloDocumento={subtituloDocumento}
        />

        {/* Título Principal do Documento (se informado) */}
        {tituloDocumento && (
          <div className="brm-letterhead-title mt-2 mb-6 text-center">
            <h3 className="font-timbrado text-xl sm:text-2xl print:text-[16pt] font-bold text-[#113240] dark:text-white print:text-black tracking-tight">
              {tituloDocumento}
            </h3>
          </div>
        )}

        {/* Conteúdo do Documento */}
        <div className="brm-letterhead-content relative z-10 w-full min-h-[300px]">
          {children}
        </div>

        {/* Rodapé Oficial com Linha e Dados Canônicos de Corupá */}
        <RodapeTimbradoBRM conteudoAdicional={rodapeComplementar} />
      </main>
    </div>
  );
};

/**
 * Função utilitária para gerar código HTML completo no padrão Papel Timbrado BRM.
 * Ideal para exportação via window.open, impressão de Livro de Tombo, relatórios e popups.
 */
export function gerarHtmlTimbradoBRM(options: {
  titulo: string;
  subtitulo?: string;
  orgao?: string;
  orientacao?: OrientacaoDocumento;
  conteudoHtml: string;
  dataEmissao?: string;
  protocolo?: string;
  assinaturas?: Array<{ cargo: string; nome?: string; detalhe?: string }>;
  notaCertidao?: string;
  autenticidade?: {
    codigo: string;
    qrCodeDataUrl?: string;
  };
}): string {
  const isLandscape = options.orientacao === 'horizontal';
  const dataHoje = options.dataEmissao || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const assinaturasHtml = options.assinaturas && options.assinaturas.length > 0
    ? `
      <div class="footer-signatures">
        ${options.assinaturas.map(a => `
          <div>
            <div class="sig-line">${a.nome ? a.nome + '<br>' : ''}${a.cargo}</div>
            ${a.detalhe ? `<div class="sig-title">${a.detalhe}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${options.titulo} - Província Brasil Meridional</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    
    @page {
      size: A4 ${isLandscape ? 'landscape' : 'portrait'};
      margin: ${isLandscape ? '10mm 15mm 12mm 15mm' : '14mm 16mm 14mm 16mm'};
    }

    * { box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      font-size: 11px;
      color: #1a1a1a;
      background: #ffffff;
      margin: 0;
      padding: 15px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .timbrado-header {
      text-align: center;
      margin-bottom: 18px;
      padding-bottom: 10px;
    }

    .timbrado-logo {
      height: 65px;
      width: auto;
      margin: 0 auto 8px auto;
      display: block;
    }

    .timbrado-congregacao {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 13pt;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #113240;
      margin: 0;
      line-height: 1.2;
    }

    .timbrado-provincia {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 14pt;
      font-weight: 600;
      color: #113240;
      margin: 3px 0 0 0;
      line-height: 1.2;
    }

    .timbrado-orgao {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 10pt;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #555555;
      margin: 4px 0 0 0;
    }

    .timbrado-meta {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #d1d5db;
      padding-top: 6px;
      margin-top: 8px;
      font-size: 9pt;
      font-family: monospace;
      color: #64748b;
    }

    .doc-title {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 16pt;
      font-weight: 700;
      color: #113240;
      text-align: center;
      margin: 16px 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .timbrado-footer {
      margin-top: 30px;
      padding-top: 8px;
      text-align: center;
      page-break-inside: avoid;
    }

    .timbrado-divider {
      border-top: 1px solid #a0a0a0;
      margin-bottom: 8px;
      width: 100%;
    }

    .timbrado-footer-line1 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 10.5pt;
      color: #333333;
      margin: 0;
      line-height: 1.3;
    }

    .timbrado-footer-line2 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 9.5pt;
      color: #555555;
      margin: 2px 0 0 0;
      line-height: 1.3;
    }

    .footer-signatures {
      margin-top: 36px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-around;
      text-align: center;
      page-break-inside: avoid;
    }

    .sig-line {
      width: 240px;
      border-top: 1px solid #1a1a1a;
      padding-top: 4px;
      font-size: 9.5pt;
      font-weight: 600;
    }

    .sig-title {
      font-size: 8.5pt;
      color: #555555;
      margin-top: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 16px;
      font-size: 9.5pt;
    }

    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 600;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      font-size: 9pt;
      text-transform: uppercase;
    }

    td {
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }

    tr:nth-child(even) {
      background: #fafafa;
    }

    .canonico-box {
      background: transparent;
      border: none;
      padding: 0;
      font-style: italic;
      font-size: 8.5pt;
      color: #555555;
      text-align: center;
      margin: 16px auto 6px auto;
      max-width: 90%;
      line-height: 1.45;
    }

    .timbrado-certidao-livre {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 8.5pt;
      font-style: italic;
      color: #555555;
      text-align: center;
      line-height: 1.45;
      max-width: 85%;
      margin: 24px auto 8px auto;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="timbrado-header" style="position: relative;">
    <div style="position: absolute; top: -6px; right: 0; font-family: monospace; font-size: 6.5pt; color: #94a3b8; letter-spacing: 0.04em;">
      Província BRM - Sistema de Gestão Institucional
    </div>
    <img src="/logo-timbrado-brm.png" alt="Emblema Dehoniano" class="timbrado-logo" />
    <h1 class="timbrado-congregacao">CONGREGAÇÃO DOS SACERDOTES DO SAGRADO CORAÇÃO DE JESUS</h1>
    <h2 class="timbrado-provincia">Província Brasileira Meridional</h2>
    
    ${(options.protocolo || options.subtitulo) ? `
      <div class="timbrado-meta">
        <div>${options.subtitulo || ''}</div>
        <div>
          ${options.protocolo ? `<strong>Protocolo:</strong> ${options.protocolo}` : ''}
          ${options.protocolo ? ' &nbsp;|&nbsp; ' : ''}
          <strong>Emissão:</strong> ${dataHoje}
        </div>
      </div>
    ` : ''}
  </div>

  <div class="doc-title">${options.titulo}</div>

  <div class="doc-content">
    ${options.conteudoHtml}
  </div>

  ${assinaturasHtml}

  ${options.notaCertidao ? `
    <p class="timbrado-certidao-livre">
      ${options.notaCertidao}
    </p>
  ` : ''}

  ${options.autenticidade ? `
    <div style="margin-top: 22px; padding: 6px 12px; border: 1px solid #94a3b8; border-radius: 4px; display: flex; align-items: center; gap: 12px; font-size: 8pt; background: #ffffff; page-break-inside: avoid;">
      ${options.autenticidade.qrCodeDataUrl ? `<img src="${options.autenticidade.qrCodeDataUrl}" style="width: 56px; height: 56px; object-fit: contain; border: 1px solid #cbd5e1; padding: 2px;" alt="QR Code" />` : ''}
      <div style="text-align: left;">
        <div style="font-weight: 700; text-transform: uppercase; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 7.5pt; color: #0f172a;">
          Chancela de Autenticidade & Fé Pública Digital
        </div>
        <div style="margin: 2px 0; font-family: monospace; font-size: 8.5pt; color: #113240;">
          Código Verificador: <strong>${options.autenticidade.codigo}</strong>
        </div>
        <div style="font-size: 7pt; color: #64748b; line-height: 1.3;">
          Documento expedido pela Sede Provincial BRM (Corupá/SC). A autenticidade deste instrumento pode ser conferida publicamente em <strong>sistema.brm.org.br/validar</strong> informando o código acima.
        </div>
      </div>
    </div>
  ` : ''}

  <div class="timbrado-footer">
    <div class="timbrado-divider"></div>
    <p class="timbrado-footer-line1">Rua Padre Gabriel Lux, 900 – Caixa Postal 21 – Corupá/SC | CEP 89278-000</p>
    <p class="timbrado-footer-line2">Telefone: +55 (47) 3375-1194 | E-mail: secretaria@brm.org.br | Site: scj.org.br</p>
  </div>
</body>
</html>`;
}

export default PapelTimbradoBRM;
