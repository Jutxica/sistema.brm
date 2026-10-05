import React, { useState } from "react";
import { Printer, ArrowLeft, Download, Shield, Calendar, MapPin, Users, CheckCircle2, RotateCw } from "lucide-react";
import type { RespostaFormulario, FormularioSecretaria } from "../pages/SecretariaConfiguracoes";
import { CabecalhoTimbradoBRM, RodapeTimbradoBRM, type OrientacaoDocumento } from "./PapelTimbradoBRM";

interface RelatorioInscricoesPrintProps {
  formulario?: FormularioSecretaria | null;
  tituloDocumento: string;
  subtitulo?: string;
  nomeEvento?: string;
  dataEvento?: string;
  localEvento?: string;
  respostas: RespostaFormulario[];
  onVoltar: () => void;
  cabecalho?: {
    congregacao?: string;
    provincia?: string;
    orgao?: string;
    lema?: string;
  };
}

export const RelatorioInscricoesPrint: React.FC<RelatorioInscricoesPrintProps> = ({
  formulario,
  tituloDocumento,
  subtitulo,
  nomeEvento,
  dataEvento,
  localEvento,
  respostas,
  onVoltar,
  cabecalho
}) => {
  const [orientacao, setOrientacao] = useState<OrientacaoDocumento>("horizontal");
  const orgao = cabecalho?.orgao || "SEDE PROVINCIAL • SECRETARIA PROVINCIAL & ATOS OFICIAIS";
  const lema = cabecalho?.lema || "ADVENIAT REGNUM TUUM";

  const totalInscritos = respostas.length;
  const totalHospedagem = respostas.filter(r => r.dados?.necessita_hospedagem === true || r.dados?.necessita_hospedagem === "Sim").length;
  const totalConfirmadas = respostas.filter(r => r.status === "Confirmada").length;

  const alternarOrientacao = () => {
    setOrientacao(prev => (prev === "horizontal" ? "vertical" : "horizontal"));
  };

  const handlePrint = () => {
    window.print();
  };

  const exportarCSV = () => {
    if (respostas.length === 0) return;
    const colunas = [
      "Ordem",
      "Protocolo",
      "Data Submissão",
      "Nome Completo",
      "Nome Religioso",
      "Grau de Ordem",
      "Comunidade / Cidade",
      "Hospedagem",
      "Tipo de Quarto",
      "Data de Chegada",
      "Meio de Transporte",
      "Restrições Alimentares",
      "Telefone / WhatsApp",
      "E-mail",
      "Status",
      "Observações"
    ];

    const linhas = respostas.map((r, idx) => [
      idx + 1,
      `\"${r.protocolo}\"`,
      `\"${new Date(r.created_at).toLocaleString("pt-BR")}\"`,
      `\"${r.dados?.nome_completo || ""}\"`,
      `\"${r.dados?.nome_religioso || ""}\"`,
      `\"${r.dados?.grau_ordem || ""}\"`,
      `\"${r.dados?.comunidade_atual || ""}\"`,
      `\"${r.dados?.necessita_hospedagem ? "Sim" : "Não"}\"`,
      `\"${r.dados?.tipo_quarto || ""}\"`,
      `\"${r.dados?.data_chegada || ""}\"`,
      `\"${r.dados?.meio_transporte || ""}\"`,
      `\"${r.dados?.restricao_alimentar || ""}\"`,
      `\"${r.dados?.telefone_whatsapp || ""}\"`,
      `\"${r.dados?.email || ""}\"`,
      `\"${r.status}\"`,
      `\"${(r.dados?.observacoes_gerais || "").replace(/\n/g, " ")}\"`
    ].join(","));

    const csvContent = "\uFEFF" + [colunas.join(","), ...linhas].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_inscricoes_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#090d16] text-slate-900 dark:text-white print:bg-white print:text-black">
      {/* BARRA SUPERIOR DE AÇÕES (Oculta na Impressão) */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#0d1117]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onVoltar}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase font-semibold text-slate-700 dark:text-slate-300 hover:text-[#113240] dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[6px] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar</span>
          </button>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />
          <div>
            <span className="font-mono text-[10px] uppercase font-bold text-[#226380] dark:text-[#A3C3C7] tracking-wider block">
              Relatório Oficial de Inscrições
            </span>
            <h1 className="text-sm sm:text-base font-cinzel font-bold text-[#113240] dark:text-white truncate max-w-md">
              {tituloDocumento}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={alternarOrientacao}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-[6px] transition-colors cursor-pointer shadow-2xs"
            title="Alternar orientação entre Paisagem (Horizontal) e Retrato (Vertical)"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#226380]" />
            <span>{orientacao === "horizontal" ? "Modo Vertical" : "Modo Horizontal"}</span>
          </button>

          <button
            type="button"
            onClick={exportarCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-[6px] transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-mono uppercase font-semibold text-white bg-[#113240] hover:bg-[#226380] rounded-[6px] transition-colors cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Lista Completa</span>
          </button>
        </div>
      </div>

      {/* Injeção de regras @page para orientação dinâmica */}
      <style>
        {`
          @media print {
            @page {
              size: A4 ${orientacao === "horizontal" ? "landscape" : "portrait"};
              margin: ${orientacao === "horizontal" ? "10mm 14mm 12mm 14mm" : "12mm 16mm 14mm 16mm"};
            }
          }
        `}
      </style>

      {/* ÁREA DE IMPRESSÃO / FOLHA OFICIAL */}
      <main className={`mx-auto my-6 sm:my-8 px-4 sm:px-6 print:m-0 print:p-0 print:max-w-none transition-all ${orientacao === "horizontal" ? "max-w-7xl" : "max-w-5xl"}`}>
        <div className="bg-white dark:bg-[#12161f] print:bg-white text-slate-900 print:text-black border border-slate-200 dark:border-slate-800 print:border-none shadow-sm print:shadow-none rounded-[8px] print:rounded-none overflow-hidden p-6 sm:p-10 space-y-6">
          
          {/* CABEÇALHO OFICIAL DO PAPEL TIMBRADO BRM */}
          <CabecalhoTimbradoBRM
            subtituloDocumento={tituloDocumento}
            dataEmissao={new Date().toLocaleDateString("pt-BR")}
          />

          {/* IDENTIFICAÇÃO DO EVENTO / FORMULÁRIO */}
          <div className="bg-slate-50 dark:bg-slate-900/40 print:bg-slate-50 p-4 rounded-[6px] border border-slate-200 dark:border-slate-800 print:border-slate-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-[#226380] tracking-wider block">
                  Livro de Inscrições & Atos Participativos
                </span>
                <h2 className="font-cinzel text-lg sm:text-xl font-bold text-[#113240] dark:text-white print:text-black">
                  {tituloDocumento}
                </h2>
                {nomeEvento && nomeEvento !== tituloDocumento && (
                  <p className="text-xs font-sans text-slate-600 dark:text-slate-400 print:text-slate-700 mt-0.5">
                    Evento Vinculado: <strong>{nomeEvento}</strong>
                  </p>
                )}
              </div>

              {(dataEvento || localEvento) && (
                <div className="font-mono text-xs text-slate-600 dark:text-slate-400 print:text-slate-700 space-y-1 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 md:pl-4">
                  {dataEvento && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dataEvento}</span>
                    </div>
                  )}
                  {localEvento && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{localEvento}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* QUADRO DE RESUMO ESTATÍSTICO */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-white dark:bg-[#161b22] print:bg-white rounded border border-slate-200 dark:border-slate-800 print:border-slate-300">
                <span className="font-mono text-[10px] uppercase text-slate-400 block">Total Inscritos</span>
                <span className="font-mono text-base font-bold text-[#113240] dark:text-white print:text-black">{totalInscritos}</span>
              </div>
              <div className="p-2 bg-white dark:bg-[#161b22] print:bg-white rounded border border-slate-200 dark:border-slate-800 print:border-slate-300">
                <span className="font-mono text-[10px] uppercase text-slate-400 block">Confirmadas</span>
                <span className="font-mono text-base font-bold text-emerald-600">{totalConfirmadas}</span>
              </div>
              <div className="p-2 bg-white dark:bg-[#161b22] print:bg-white rounded border border-slate-200 dark:border-slate-800 print:border-slate-300">
                <span className="font-mono text-[10px] uppercase text-slate-400 block">Com Hospedagem</span>
                <span className="font-mono text-base font-bold text-[#226380]">{totalHospedagem}</span>
              </div>
              <div className="p-2 bg-white dark:bg-[#161b22] print:bg-white rounded border border-slate-200 dark:border-slate-800 print:border-slate-300">
                <span className="font-mono text-[10px] uppercase text-slate-400 block">Sem Hospedagem</span>
                <span className="font-mono text-base font-bold text-slate-600">{totalInscritos - totalHospedagem}</span>
              </div>
            </div>
          </div>

          {/* TABELA COMPLETA DIAGRAMADA PARA IMPRESSÃO */}
          <section className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#113240] dark:text-white print:text-black uppercase">
                Relação Nominal dos Confrades Inscritos ({respostas.length})
              </span>
              <span className="text-[10px] text-slate-400">
                Ordenado cronologicamente por protocolo
              </span>
            </div>

            {respostas.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded text-slate-400 font-mono text-xs">
                Nenhuma inscrição protocolada para exibição neste relatório.
              </div>
            ) : (
              <div className="border border-slate-300 dark:border-slate-700 print:border-black rounded-[4px] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 border-b border-slate-300 dark:border-slate-700 print:border-black font-mono text-[10px] uppercase text-slate-700 print:text-black font-bold">
                      <th className="p-2 border-r border-slate-200 print:border-black w-8 text-center">Nº</th>
                      <th className="p-2 border-r border-slate-200 print:border-black w-24">Protocolo</th>
                      <th className="p-2 border-r border-slate-200 print:border-black">Confrade & Grau</th>
                      <th className="p-2 border-r border-slate-200 print:border-black">Comunidade</th>
                      <th className="p-2 border-r border-slate-200 print:border-black">Hospedagem & Chegada</th>
                      <th className="p-2 border-r border-slate-200 print:border-black">Opções & Restrições</th>
                      <th className="p-2 border-r border-slate-200 print:border-black w-28">Contato</th>
                      <th className="p-2 w-28 text-center">Credenciamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-black">
                    {respostas.map((r, i) => (
                      <tr key={r.id || i} className="print:text-black font-sans leading-tight">
                        <td className="p-2 border-r border-slate-200 print:border-black text-center font-mono text-[10px] text-slate-500 font-bold">
                          {i + 1}
                        </td>
                        <td className="p-2 border-r border-slate-200 print:border-black font-mono text-[10px] font-bold text-[#226380] print:text-black">
                          {r.protocolo}
                          <span className="block text-[8px] text-slate-400 font-normal">
                            {new Date(r.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </td>
                        <td className="p-2 border-r border-slate-200 print:border-black">
                          <strong className="block text-slate-900 dark:text-white print:text-black font-semibold">
                            {r.dados?.nome_religioso || r.dados?.nome_completo || "Sem identificação"}
                          </strong>
                          {r.dados?.nome_completo && r.dados?.nome_completo !== r.dados?.nome_religioso && (
                            <span className="block text-[10px] text-slate-500 print:text-slate-700">
                              {r.dados?.nome_completo}
                            </span>
                          )}
                          {r.dados?.grau_ordem && (
                            <span className="inline-block mt-0.5 px-1 py-0.2 bg-slate-100 print:bg-transparent font-mono text-[9px] text-[#226380] print:text-black border border-slate-200 print:border-none rounded">
                              {r.dados?.grau_ordem}
                            </span>
                          )}
                        </td>
                        <td className="p-2 border-r border-slate-200 print:border-black text-[11px] text-slate-700 dark:text-slate-300 print:text-black">
                          {r.dados?.comunidade_atual || "-"}
                        </td>
                        <td className="p-2 border-r border-slate-200 print:border-black font-mono text-[10px] text-slate-700 dark:text-slate-300 print:text-black">
                          {r.dados?.necessita_hospedagem ? (
                            <div>
                              <span className="font-bold text-[#226380] print:text-black">SIM</span>
                              {r.dados?.tipo_quarto && (
                                <span className="block text-[9px] text-slate-500">
                                  {r.dados?.tipo_quarto}
                                </span>
                              )}
                              {r.dados?.data_chegada && (
                                <span className="block text-[9px] text-slate-500">
                                  Chegada: {r.dados?.data_chegada}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">Não necessita</span>
                          )}
                        </td>
                        <td className="p-2 border-r border-slate-200 print:border-black text-[10px] text-slate-600 dark:text-slate-400 print:text-black space-y-0.5">
                          {r.dados?.restricao_alimentar && (
                            <div>
                              <strong className="font-mono text-[9px] text-amber-700 print:text-black">Alimentação: </strong>
                              <span>{r.dados?.restricao_alimentar}</span>
                            </div>
                          )}
                          {r.dados?.tamanho_paramento && (
                            <div>
                              <strong className="font-mono text-[9px]">Paramento: </strong>
                              <span>{r.dados?.tamanho_paramento}</span>
                            </div>
                          )}
                          {r.dados?.meio_transporte && (
                            <div>
                              <strong className="font-mono text-[9px]">Transporte: </strong>
                              <span>{r.dados?.meio_transporte}</span>
                            </div>
                          )}
                          {r.dados?.observacoes_gerais && (
                            <div className="italic text-[9px] text-slate-500 print:text-black">
                              Obs: {r.dados?.observacoes_gerais}
                            </div>
                          )}
                          {!r.dados?.restricao_alimentar && !r.dados?.tamanho_paramento && !r.dados?.observacoes_gerais && (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-2 border-r border-slate-200 print:border-black font-mono text-[10px] text-slate-600 dark:text-slate-400 print:text-black">
                          <div>{r.dados?.telefone_whatsapp || "-"}</div>
                          {r.dados?.email && (
                            <div className="text-[9px] text-slate-400 print:text-black truncate max-w-[110px]" title={r.dados?.email}>
                              {r.dados?.email}
                            </div>
                          )}
                        </td>
                        <td className="p-2 text-center align-middle">
                          <div className="w-full h-7 border-b border-dashed border-slate-400 print:border-black flex items-end justify-center pb-0.5">
                            <span className="text-[8px] text-slate-300 print:text-slate-500 font-mono">Visto / Presença</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* CHANCELA E ASSINATURA DA SECRETARIA PROVINCIAL */}
          <div className="pt-6 border-t border-slate-300 dark:border-slate-700 print:border-slate-400 space-y-6 break-inside-avoid">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center">
              <div className="w-64">
                <div className="border-b border-slate-400 print:border-black pb-1 mb-1" />
                <p className="font-mono text-[10px] uppercase font-bold text-slate-700 print:text-black">
                  Secretário Provincial BRM
                </p>
                <p className="text-[9px] text-slate-400 font-sans">
                  Chancela & Conferência Documental
                </p>
              </div>

              <div className="w-64">
                <div className="border-b border-slate-400 print:border-black pb-1 mb-1" />
                <p className="font-mono text-[10px] uppercase font-bold text-slate-700 print:text-black">
                  Coordenador / Responsável
                </p>
                <p className="text-[9px] text-slate-400 font-sans">
                  Recepção & Hospedagem
                </p>
              </div>
            </div>
          </div>

          {/* RODAPÉ OFICIAL PAPEL TIMBRADO BRM */}
          <RodapeTimbradoBRM />

        </div>
      </main>
    </div>
  );
};

export default RelatorioInscricoesPrint;
