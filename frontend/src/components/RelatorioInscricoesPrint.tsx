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
      `"${r.protocolo}"`,
      `"${new Date(r.created_at).toLocaleString("pt-BR")}"`,
      `"${r.dados?.nome_completo || ""}"`,
      `"${r.dados?.nome_religioso || ""}"`,
      `"${r.dados?.grau_ordem || ""}"`,
      `"${r.dados?.comunidade_atual || ""}"`,
      `"${r.dados?.necessita_hospedagem ? "Sim" : "Não"}"`,
      `"${r.dados?.tipo_quarto || ""}"`,
      `"${r.dados?.data_chegada || ""}"`,
      `"${r.dados?.meio_transporte || ""}"`,
      `"${r.dados?.restricao_alimentar || ""}"`,
      `"${r.dados?.telefone_whatsapp || ""}"`,
      `"${r.dados?.email || ""}"`,
      `"${r.status}"`,
      `"${(r.dados?.observacoes_gerais || "").replace(/\n/g, " ")}"`
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

      {/* ÁREA DE IMPRESSÃO / FOLHA OFICIAL INSTITUCIONAL */}
      <main className={`mx-auto my-6 sm:my-8 px-4 sm:px-6 print:m-0 print:p-0 print:max-w-none transition-all ${orientacao === "horizontal" ? "max-w-7xl" : "max-w-5xl"}`}>
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
                  <p className="text-[8.5pt] font-mono text-slate-600">Secretaria Provincial · Livro de Inscrições</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-[7pt] uppercase tracking-wider text-slate-400">Documento Oficial</p>
                <p className="font-mono text-[10pt] font-bold text-slate-800">
                  REL-{new Date().getFullYear()}-{String(respostas.length).padStart(3, '0')}
                </p>
                <p className="text-[7.5pt] font-mono text-slate-500 mt-0.5">
                  {new Date().toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </header>

          {/* Identificação do Relatório */}
          <div className="flex items-end justify-between border-b border-slate-200 pb-3 mb-3">
            <div>
              <p className="font-mono text-[7.5pt] uppercase tracking-[0.16em] text-slate-500 font-semibold">
                Livro de Inscrições & Atos Participativos
              </p>
              <h2 className="text-[16pt] font-serif font-bold text-slate-900 mt-0.5">
                {tituloDocumento}
              </h2>
              {(dataEvento || localEvento) && (
                <p className="text-[8.5pt] font-mono text-slate-600 mt-0.5">
                  {[dataEvento, localEvento].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 border border-slate-900 px-2.5 py-0.5 text-[8pt] font-mono font-semibold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
              <span>{totalInscritos} Inscrições</span>
            </div>
          </div>

          {/* Faixa de Indicadores Rápidos */}
          <div className="grid grid-cols-4 border border-slate-200 bg-slate-50/60 text-center mb-4">
            <div className="p-2 border-r border-slate-200">
              <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Total Inscritos</p>
              <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5">{totalInscritos}</p>
            </div>
            <div className="p-2 border-r border-slate-200">
              <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Confirmadas</p>
              <p className="text-[9.5pt] font-medium text-emerald-700 mt-0.5">{totalConfirmadas}</p>
            </div>
            <div className="p-2 border-r border-slate-200">
              <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Com Hospedagem</p>
              <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5">{totalHospedagem}</p>
            </div>
            <div className="p-2">
              <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Sem Hospedagem</p>
              <p className="text-[9.5pt] font-medium text-slate-600 mt-0.5">{totalInscritos - totalHospedagem}</p>
            </div>
          </div>

          {/* TABELA COMPLETA DIAGRAMADA PARA IMPRESSÃO */}
          <section className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-xs font-mono border-b border-slate-200 pb-1 mb-2">
              <span className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700">
                Relação Nominal dos Confrades Inscritos ({respostas.length})
              </span>
              <span className="text-[6.5pt] text-slate-400">
                Ordenado cronologicamente por protocolo
              </span>
            </div>

            {respostas.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded text-slate-400 font-mono text-xs">
                Nenhuma inscrição protocolada para exibição neste relatório.
              </div>
            ) : (
              <div className="border border-slate-300 print:border-black rounded-[2px] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 print:bg-slate-100 border-b border-slate-300 print:border-black font-mono text-[8pt] uppercase text-slate-700 print:text-black font-bold">
                      <th className="p-1.5 border-r border-slate-200 print:border-black w-7 text-center">Nº</th>
                      <th className="p-1.5 border-r border-slate-200 print:border-black w-20">Protocolo</th>
                      <th className="p-1.5 border-r border-slate-200 print:border-black">Confrade & Grau</th>
                      <th className="p-1.5 border-r border-slate-200 print:border-black">Comunidade</th>
                      <th className="p-1.5 border-r border-slate-200 print:border-black">Hospedagem & Chegada</th>
                      <th className="p-1.5 border-r border-slate-200 print:border-black">Opções & Restrições</th>
                      <th className="p-1.5 border-r border-slate-200 print:border-black w-24">Contato</th>
                      <th className="p-1.5 w-24 text-center">Credenciamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 print:divide-slate-300 text-[8pt]">
                    {respostas.map((r, i) => (
                      <tr key={r.id || i} className="print:text-black font-sans leading-tight">
                        <td className="p-1.5 border-r border-slate-200 print:border-black text-center font-mono text-[7.5pt] text-slate-500 font-bold">
                          {i + 1}
                        </td>
                        <td className="p-1.5 border-r border-slate-200 print:border-black font-mono text-[7.5pt] font-bold text-slate-800 print:text-black">
                          {r.protocolo}
                          <span className="block text-[7pt] text-slate-400 font-normal">
                            {new Date(r.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </td>
                        <td className="p-1.5 border-r border-slate-200 print:border-black">
                          <strong className="block text-slate-900 font-semibold text-[8.5pt]">
                            {r.dados?.nome_religioso || r.dados?.nome_completo || "Sem identificação"}
                          </strong>
                          {r.dados?.nome_completo && r.dados?.nome_completo !== r.dados?.nome_religioso && (
                            <span className="block text-[7.5pt] text-slate-500">
                              {r.dados?.nome_completo}
                            </span>
                          )}
                          {r.dados?.grau_ordem && (
                            <span className="inline-block mt-0.5 font-mono text-[7pt] text-slate-600">
                              {r.dados?.grau_ordem}
                            </span>
                          )}
                        </td>
                        <td className="p-1.5 border-r border-slate-200 print:border-black text-[8pt] text-slate-700">
                          {r.dados?.comunidade_atual || "—"}
                        </td>
                        <td className="p-1.5 border-r border-slate-200 print:border-black font-mono text-[7.5pt] text-slate-700">
                          {r.dados?.necessita_hospedagem ? (
                            <div>
                              <span className="font-bold text-slate-900">SIM</span>
                              {r.dados?.tipo_quarto && (
                                <span className="block text-[7pt] text-slate-500">
                                  {r.dados?.tipo_quarto}
                                </span>
                              )}
                              {r.dados?.data_chegada && (
                                <span className="block text-[7pt] text-slate-500">
                                  {r.dados?.data_chegada}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">Não</span>
                          )}
                        </td>
                        <td className="p-1.5 border-r border-slate-200 print:border-black text-[7.5pt] text-slate-600 space-y-0.5">
                          {r.dados?.restricao_alimentar && (
                            <div>
                              <span className="font-mono text-[7pt] text-slate-800 font-semibold">Alim: </span>
                              <span>{r.dados?.restricao_alimentar}</span>
                            </div>
                          )}
                          {r.dados?.tamanho_paramento && (
                            <div>
                              <span className="font-mono text-[7pt]">Veste: </span>
                              <span>{r.dados?.tamanho_paramento}</span>
                            </div>
                          )}
                          {r.dados?.meio_transporte && (
                            <div>
                              <span className="font-mono text-[7pt]">Transp: </span>
                              <span>{r.dados?.meio_transporte}</span>
                            </div>
                          )}
                          {r.dados?.observacoes_gerais && (
                            <div className="italic text-[7pt] text-slate-500 truncate max-w-[130px]" title={r.dados?.observacoes_gerais}>
                              Obs: {r.dados?.observacoes_gerais}
                            </div>
                          )}
                          {!r.dados?.restricao_alimentar && !r.dados?.tamanho_paramento && !r.dados?.observacoes_gerais && (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-1.5 border-r border-slate-200 print:border-black font-mono text-[7.5pt] text-slate-600">
                          <div>{r.dados?.telefone_whatsapp || "—"}</div>
                          {r.dados?.email && (
                            <div className="text-[7pt] text-slate-400 truncate max-w-[100px]" title={r.dados?.email}>
                              {r.dados?.email}
                            </div>
                          )}
                        </td>
                        <td className="p-1.5 text-center align-middle">
                          <div className="w-full h-6 border-b border-dashed border-slate-400 print:border-black flex items-end justify-center pb-0.5">
                            <span className="text-[6.5pt] text-slate-400 font-mono">Visto</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Chancela e Assinatura */}
          <div className="mt-8 pt-4 grid grid-cols-2 gap-12 text-center text-[7.5pt] break-inside-avoid">
            <div>
              <div className="border-t border-slate-800 mx-auto w-48 mb-1" />
              <p className="font-semibold text-slate-800">Secretário Provincial BRM</p>
              <p className="text-[6.5pt] text-slate-400">Chancela & Conferência Documental</p>
            </div>
            <div>
              <div className="border-t border-slate-800 mx-auto w-48 mb-1" />
              <p className="font-semibold text-slate-800">Coordenador / Responsável</p>
              <p className="text-[6.5pt] text-slate-400">Recepção & Hospedagem</p>
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

export default RelatorioInscricoesPrint;
