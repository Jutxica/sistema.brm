import React, { useState } from "react";
import { Printer, ArrowLeft, CheckCircle2, Clock, XCircle, Shield, Calendar, MapPin, User, Mail, Phone, Home, RotateCw } from "lucide-react";
import type { RespostaFormulario, FormularioSecretaria } from "../pages/SecretariaConfiguracoes";
import { CabecalhoTimbradoBRM, RodapeTimbradoBRM, type OrientacaoDocumento } from "./PapelTimbradoBRM";

interface FichaInscricaoIndividualPrintProps {
  resposta: RespostaFormulario;
  formulario?: FormularioSecretaria | null;
  onVoltar: () => void;
  onAtualizarStatus?: (id: string, novoStatus: "Confirmada" | "Pendente" | "Cancelada") => void;
  cabecalho?: {
    congregacao?: string;
    provincia?: string;
    orgao?: string;
    lema?: string;
  };
}

export const FichaInscricaoIndividualPrint: React.FC<FichaInscricaoIndividualPrintProps> = ({
  resposta,
  formulario,
  onVoltar,
  onAtualizarStatus,
  cabecalho
}) => {
  const [orientacao, setOrientacao] = useState<OrientacaoDocumento>("vertical");
  const orgao = cabecalho?.orgao || "SECRETARIA PROVINCIAL • PROTOCOLO GERAL";
  const lema = cabecalho?.lema || "ADVENIAT REGNUM TUUM";

  const dados = resposta.dados || {};

  const handlePrint = () => {
    window.print();
  };

  const alternarOrientacao = () => {
    setOrientacao(prev => (prev === "vertical" ? "horizontal" : "vertical"));
  };

  // Montar lista de campos conhecidos e extras
  const camposMapeados = formulario?.campos || [];

  const formatCpfMask = (cpf?: string | null) => {
    if (!cpf) return null;
    const clean = cpf.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#090d16] text-slate-900 dark:text-white print:bg-white print:text-black">
      {/* BARRA SUPERIOR DE CONTROLE (Oculta na Impressão) */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#0d1117]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onVoltar}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase font-semibold text-slate-700 dark:text-slate-300 hover:text-[#113240] dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[6px] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar à Lista</span>
          </button>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />
          <div>
            <span className="font-mono text-[10px] uppercase font-bold text-[#226380] dark:text-[#A3C3C7] tracking-wider block">
              Ficha Individual de Inscrição Canônica
            </span>
            <h1 className="text-sm sm:text-base font-serif font-bold text-[#113240] dark:text-white">
              {dados.nome_religioso || dados.nome_completo || "Confrade Inscrito"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor rápido de Status */}
          {onAtualizarStatus && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-[6px] text-xs font-mono">
              <span className="text-[10px] text-slate-400 px-1 uppercase">Status:</span>
              <button
                type="button"
                onClick={() => onAtualizarStatus(resposta.id, "Confirmada")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                  resposta.status === "Confirmada"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                Confirmada
              </button>
              <button
                type="button"
                onClick={() => onAtualizarStatus(resposta.id, "Pendente")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                  resposta.status === "Pendente"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                Pendente
              </button>
              <button
                type="button"
                onClick={() => onAtualizarStatus(resposta.id, "Cancelada")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                  resposta.status === "Cancelada"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                Cancelada
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={alternarOrientacao}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[6px] transition-colors cursor-pointer"
            title="Alternar orientação entre Vertical (Retrato) e Horizontal (Paisagem)"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#226380]" />
            <span>{orientacao === "horizontal" ? "Modo Vertical" : "Modo Horizontal"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-mono uppercase font-semibold text-white bg-[#113240] hover:bg-[#226380] rounded-[6px] transition-colors cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Ficha</span>
          </button>
        </div>
      </div>

      {/* Injeção de regras @page para orientação dinâmica */}
      <style>
        {`
          @media print {
            @page {
              size: A4 ${orientacao === "horizontal" ? "landscape" : "portrait"};
              margin: ${orientacao === "horizontal" ? "10mm 15mm 12mm 15mm" : "12mm 16mm 14mm 16mm"};
            }
          }
        `}
      </style>

      {/* DOCUMENTO IMPRESSO NO PADRÃO OFICIAL TIMBRADO BRM */}
      <main className={`mx-auto my-6 sm:my-8 px-4 sm:px-6 print:m-0 print:p-0 print:max-w-none transition-all ${orientacao === "horizontal" ? "max-w-6xl" : "max-w-4xl"}`}>
        <div className="bg-white dark:bg-[#12161f] print:bg-white text-slate-900 print:text-black border border-slate-200 dark:border-slate-800 print:border-none shadow-sm print:shadow-none rounded-[6px] print:rounded-none overflow-hidden p-8 sm:p-12 font-sans leading-tight">
          
          {/* Cabeçalho Oficial */}
          <header className="border-b border-slate-300 pb-3 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo-timbrado-brm.png" alt="Província BRM" className="h-14 w-auto object-contain" />
                <div>
                  <p className="font-mono text-[8pt] uppercase tracking-[0.15em] text-slate-500 font-semibold">
                    Congregação dos Sacerdotes do Sagrado Coração de Jesus
                  </p>
                  <h1 className="text-[14pt] font-serif font-bold text-slate-900 tracking-tight mt-0.5">
                    Província Brasil Meridional
                  </h1>
                  <p className="text-[8.5pt] font-mono text-slate-600">Secretaria Provincial · Atos Oficiais</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-[7pt] uppercase tracking-wider text-slate-400">Protocolo</p>
                <p className="font-mono text-[10pt] font-bold text-slate-800">
                  {resposta.protocolo}
                </p>
                <p className="text-[7.5pt] font-mono text-slate-500 mt-0.5">
                  {new Date(resposta.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </header>

          {/* Identificação da Ficha */}
          <div className="flex items-end justify-between border-b border-slate-200 pb-3 mb-3">
            <div>
              <p className="font-mono text-[7.5pt] uppercase tracking-[0.16em] text-slate-500 font-semibold">
                Ficha Individual de Inscrição Canônica
              </p>
              <h2 className="text-[16pt] font-serif font-bold text-slate-900 mt-0.5">
                {formulario?.titulo || "Evento / Reunião Provincial"}
              </h2>
              {formulario?.descricao && (
                <p className="text-[8.5pt] text-slate-600 mt-0.5 max-w-xl">
                  {formulario.descricao}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 border border-slate-900 px-2.5 py-0.5 text-[8pt] font-mono font-semibold uppercase">
              <span className={`w-1.5 h-1.5 rounded-full ${
                resposta.status === "Confirmada" ? "bg-emerald-600" :
                resposta.status === "Cancelada" ? "bg-rose-600" : "bg-amber-600"
              }`} />
              <span>Inscrição {resposta.status || "Confirmada"}</span>
            </div>
          </div>

          {/* Faixa de Indicadores Rápidos */}
          <div className="grid grid-cols-4 border border-slate-200 bg-white text-center mb-4">
            <div className="p-2 border-r border-slate-200">
              <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Confrade</p>
              <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5 truncate px-1">
                {dados.nome_religioso || dados.nome_completo || "—"}
              </p>
            </div>
            <div className="p-2 border-r border-slate-200">
              <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Grau / Vínculo</p>
              <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5">{dados.grau_ordem || "Confrade"}</p>
            </div>
            <div className="p-2 border-r border-slate-200">
              <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Hospedagem</p>
              <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5">
                {dados.necessita_hospedagem ? "Solicitada" : "Não Necessita"}
              </p>
            </div>
            <div className="p-2">
              <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Data de Submissão</p>
              <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5">
                {new Date(resposta.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          {/* SEÇÕES DE DADOS PREENCHIDOS */}
          <div className="space-y-4">
            
            {/* 1. IDENTIFICAÇÃO DO CONFRADE */}
            <div>
              <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
                01. Identificação do Confrade
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[8.5pt]">
                <div>
                  <p className="text-[6.5pt] font-mono uppercase text-slate-500">Nome Religioso</p>
                  <p className="font-medium text-slate-900">{dados.nome_religioso || "—"}</p>
                </div>
                <div>
                  <p className="text-[6.5pt] font-mono uppercase text-slate-500">Nome Civil Completo</p>
                  <p className="font-medium text-slate-900">{dados.nome_completo || "—"}</p>
                </div>
                <div>
                  <p className="text-[6.5pt] font-mono uppercase text-slate-500">Grau de Ordem</p>
                  <p className="font-medium text-slate-900">{dados.grau_ordem || "—"}</p>
                </div>
                <div>
                  <p className="text-[6.5pt] font-mono uppercase text-slate-500">Comunidade Atual</p>
                  <p className="font-medium text-slate-900">{dados.comunidade_atual || "—"}</p>
                </div>
                <div>
                  <p className="text-[6.5pt] font-mono uppercase text-slate-500">Celular / WhatsApp</p>
                  <p className="font-medium text-slate-900">{dados.telefone_whatsapp || "—"}</p>
                </div>
                <div>
                  <p className="text-[6.5pt] font-mono uppercase text-slate-500">E-mail</p>
                  <p className="font-medium text-slate-900">{dados.email || "—"}</p>
                </div>
                {dados.cpf && (
                  <div>
                    <p className="text-[6.5pt] font-mono uppercase text-slate-500">CPF</p>
                    <p className="font-mono font-medium text-slate-900">{formatCpfMask(dados.cpf)}</p>
                  </div>
                )}
                {dados.cargo_funcao && (
                  <div>
                    <p className="text-[6.5pt] font-mono uppercase text-slate-500">Ofício / Função</p>
                    <p className="font-medium text-slate-900">{dados.cargo_funcao}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. LOGÍSTICA & HOSPEDAGEM */}
            <div>
              <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
                02. Logística, Hospedagem & Transporte
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[8.5pt]">
                <div>
                  <p className="text-[6.5pt] font-mono uppercase text-slate-500">Necessita Hospedagem</p>
                  <p className="font-medium text-slate-900">{dados.necessita_hospedagem ? "Sim" : "Não"}</p>
                </div>
                <div>
                  <p className="text-[6.5pt] font-mono uppercase text-slate-500">Tipo de Quarto Preferido</p>
                  <p className="font-medium text-slate-900">{dados.tipo_quarto || "Indiferente / Padrão"}</p>
                </div>
                <div>
                  <p className="text-[6.5pt] font-mono uppercase text-slate-500">Previsão de Chegada</p>
                  <p className="font-medium text-slate-900">{dados.data_chegada || "—"}</p>
                </div>
                <div>
                  <p className="text-[6.5pt] font-mono uppercase text-slate-500">Meio de Transporte</p>
                  <p className="font-medium text-slate-900">{dados.meio_transporte || "Próprio / Terrestre"}</p>
                </div>
              </div>
            </div>

            {/* 3. ALIMENTAÇÃO & PARAMENTO */}
            <div>
              <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
                03. Alimentação, Paramento & Observações
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[8.5pt]">
                <div>
                  <p className="text-[6.5pt] font-mono uppercase text-slate-500">Restrições Alimentares</p>
                  <p className="font-medium text-slate-900">{dados.restricao_alimentar || "Nenhuma declarada"}</p>
                </div>
                <div>
                  <p className="text-[6.5pt] font-mono uppercase text-slate-500">Tamanho de Veste / Paramento</p>
                  <p className="font-medium text-slate-900">{dados.tamanho_paramento || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[6.5pt] font-mono uppercase text-slate-500">Observações Gerais do Confrade</p>
                  <p className="font-medium text-slate-900 whitespace-pre-line mt-0.5">
                    {dados.observacoes_gerais || "Nenhuma observação informada."}
                  </p>
                </div>
              </div>
            </div>

            {/* 4. CAMPOS ADICIONAIS ESPECÍFICOS DO FORMULÁRIO */}
            {(() => {
              const camposPadroesIds = [
                "nome_completo", "nome_religioso", "grau_ordem", "comunidade_atual", 
                "telefone_whatsapp", "email", "cpf", "cargo_funcao", "necessita_hospedagem", 
                "tipo_quarto", "data_chegada", "meio_transporte", "restricao_alimentar", 
                "tamanho_paramento", "observacoes_gerais"
              ];
              const camposExtras = Object.entries(dados).filter(([k]) => !camposPadroesIds.includes(k));

              if (camposExtras.length === 0) return null;

              return (
                <div>
                  <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
                    04. Informações Complementares
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[8.5pt]">
                    {camposExtras.map(([chave, valor]) => {
                      const campoDef = camposMapeados.find(c => c.id === chave);
                      const label = campoDef ? campoDef.label : chave.replace(/_/g, " ").toUpperCase();
                      return (
                        <div key={chave}>
                          <p className="text-[6.5pt] font-mono uppercase text-slate-500">{label}</p>
                          <p className="font-medium text-slate-900">
                            {typeof valor === "boolean" ? (valor ? "Sim" : "Não") : String(valor || "—")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          </div>

          {/* Assinaturas Institucionais */}
          <div className="mt-8 pt-4 grid grid-cols-2 gap-12 text-center text-[7.5pt] break-inside-avoid">
            <div>
              <div className="border-t border-slate-800 mx-auto w-48 mb-1" />
              <p className="font-semibold text-slate-800">{dados.nome_religioso || dados.nome_completo || "Confrade Inscrito"}</p>
              <p className="text-[6.5pt] text-slate-400">Assinatura do Confrade</p>
            </div>
            <div>
              <div className="border-t border-slate-800 mx-auto w-48 mb-1" />
              <p className="font-semibold text-slate-800">Secretaria Provincial BRM</p>
              <p className="text-[6.5pt] text-slate-400">Visto de Recebimento & Protocolo</p>
            </div>
          </div>

          {/* Linha Canônica da Sede e Rodapé */}
          <div className="mt-8 pt-2 border-t border-[#a0a0a0] text-center select-none">
            <p className="font-serif text-[8.5pt] text-slate-700 leading-snug">
              Rua Padre Gabriel Lux, 900 – Caixa Postal 21 – Corupá/SC | CEP 89278-000
            </p>
            <p className="font-serif text-[8pt] text-slate-600 mt-0.5 leading-snug">
              Telefone: +55 (47) 3375-1194 | E-mail: secretaria@brm.org.br | Site: scj.org.br
            </p>
          </div>

          <footer className="mt-3 pt-2 border-t border-slate-200 flex justify-between text-[6.5pt] font-mono text-slate-400">
            <span>Emitido eletronicamente em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · sistema.brm.org.br</span>
            <span>Documento reservado · Dados pessoais protegidos pela LGPD</span>
          </footer>

        </div>
      </main>
    </div>
  );
};

export default FichaInscricaoIndividualPrint;
