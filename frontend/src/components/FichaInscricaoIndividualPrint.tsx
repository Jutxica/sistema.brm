import React from "react";
import { Printer, ArrowLeft, CheckCircle2, Clock, XCircle, Shield, Calendar, MapPin, User, Mail, Phone, Home } from "lucide-react";
import type { RespostaFormulario, FormularioSecretaria } from "../pages/SecretariaConfiguracoes";

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
  const congregacao = cabecalho?.congregacao || "CONGREGAÇÃO DOS PADRES DO SAGRADO CORAÇÃO DE JESUS";
  const provincia = cabecalho?.provincia || "PROVÍNCIA BRASIL MERIDIONAL • DEHONIANOS";
  const orgao = cabecalho?.orgao || "SECRETARIA PROVINCIAL • PROTOCOLO GERAL";
  const lema = cabecalho?.lema || "ADVENIAT REGNUM TUUM";

  const dados = resposta.dados || {};

  const handlePrint = () => {
    window.print();
  };

  // Montar lista de campos conhecidos e extras
  const camposMapeados = formulario?.campos || [];

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
            <h1 className="text-sm sm:text-base font-cinzel font-bold text-[#113240] dark:text-white">
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
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
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
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
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
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
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
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-mono uppercase font-semibold text-white bg-[#113240] hover:bg-[#226380] rounded-[6px] transition-colors cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Ficha Individual</span>
          </button>
        </div>
      </div>

      {/* DOCUMENTO IMPRESSO */}
      <main className="max-w-4xl mx-auto my-6 sm:my-8 px-4 sm:px-6 print:m-0 print:p-0 print:max-w-none">
        <div className="bg-white dark:bg-[#12161f] print:bg-white text-slate-900 print:text-black border border-slate-200 dark:border-slate-800 print:border-none shadow-sm print:shadow-none rounded-[8px] print:rounded-none overflow-hidden p-6 sm:p-10 space-y-6">
          
          {/* CABEÇALHO OFICIAL COM BRASÃO */}
          <header className="border-b-2 border-[#113240] pb-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src="/logo-sistema.png"
                alt="Brasão Província BRM"
                className="w-16 h-20 object-contain shrink-0"
              />
              <div className="space-y-0.5">
                <p className="font-cinzel text-xs sm:text-sm font-black tracking-wider text-[#113240] uppercase leading-tight">
                  {congregacao}
                </p>
                <p className="font-cinzel text-[11px] sm:text-xs font-bold text-[#226380] uppercase tracking-wide">
                  {provincia}
                </p>
                <p className="font-mono text-[10px] uppercase text-slate-500 font-semibold tracking-wider">
                  {orgao}
                </p>
                <p className="font-cinzel text-[9px] uppercase tracking-[0.2em] font-semibold text-amber-700">
                  {lema}
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-[10px] text-slate-500 shrink-0 space-y-1">
              <div className="bg-[#113240] text-white px-2.5 py-1 rounded font-bold text-xs inline-block">
                {resposta.protocolo}
              </div>
              <div>Submissão: {new Date(resposta.created_at).toLocaleDateString("pt-BR")} às {new Date(resposta.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
              <div>
                Status: <strong className={resposta.status === "Confirmada" ? "text-emerald-600" : resposta.status === "Cancelada" ? "text-rose-600" : "text-amber-600"}>{resposta.status.toUpperCase()}</strong>
              </div>
            </div>
          </header>

          {/* TÍTULO DO FORMULÁRIO / EVENTO */}
          <div className="bg-slate-50 dark:bg-slate-900/40 print:bg-slate-50 p-4 rounded-[6px] border border-slate-200 dark:border-slate-800">
            <span className="font-mono text-[10px] uppercase font-bold text-[#226380] tracking-wider block">
              Inscrição Oficial para
            </span>
            <h2 className="font-cinzel text-base sm:text-lg font-bold text-[#113240] dark:text-white print:text-black">
              {formulario?.titulo || "Evento / Reunião Provincial"}
            </h2>
            {formulario?.descricao && (
              <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-700 mt-1">
                {formulario.descricao}
              </p>
            )}
          </div>

          {/* SEÇÕES DE DADOS PREENCHIDOS */}
          <div className="space-y-6">
            
            {/* 1. DADOS PESSOAIS E ECLESIÁSTICOS */}
            <div className="border border-slate-200 dark:border-slate-800 print:border-slate-400 rounded-[6px] overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800/80 print:bg-slate-100 px-4 py-2 border-b border-slate-200 dark:border-slate-800 print:border-slate-400 font-mono text-xs uppercase font-bold text-[#113240] dark:text-white print:text-black flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-[#226380]" />
                <span>1. Identificação do Confrade</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-sans">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase block">Nome Religioso:</span>
                  <strong className="text-sm text-slate-900 dark:text-white print:text-black">
                    {dados.nome_religioso || dados.nome_completo || "-"}
                  </strong>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase block">Nome Civil:</span>
                  <span className="text-slate-800 dark:text-slate-200 print:text-black">
                    {dados.nome_completo || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase block">Grau de Ordem / Vínculo:</span>
                  <span className="font-mono font-semibold text-[#226380] print:text-black">
                    {dados.grau_ordem || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase block">Comunidade Atual:</span>
                  <span className="text-slate-800 dark:text-slate-200 print:text-black">
                    {dados.comunidade_atual || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase block">Telefone / WhatsApp:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 print:text-black">
                    {dados.telefone_whatsapp || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase block">E-mail:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 print:text-black">
                    {dados.email || "-"}
                  </span>
                </div>
                {dados.cpf && (
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase block">CPF:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 print:text-black">
                      {dados.cpf}
                    </span>
                  </div>
                )}
                {dados.cargo_funcao && (
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase block">Ofício / Função:</span>
                    <span className="text-slate-800 dark:text-slate-200 print:text-black">
                      {dados.cargo_funcao}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. HOSPEDAGEM, TRANSPORTE E LOGÍSTICA */}
            <div className="border border-slate-200 dark:border-slate-800 print:border-slate-400 rounded-[6px] overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800/80 print:bg-slate-100 px-4 py-2 border-b border-slate-200 dark:border-slate-800 print:border-slate-400 font-mono text-xs uppercase font-bold text-[#113240] dark:text-white print:text-black flex items-center gap-2">
                <Home className="w-3.5 h-3.5 text-[#226380]" />
                <span>2. Logística, Hospedagem e Chegada</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-sans">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase block">Necessita Hospedagem:</span>
                  <strong className={`font-mono ${dados.necessita_hospedagem ? "text-emerald-600" : "text-slate-600"}`}>
                    {dados.necessita_hospedagem ? "SIM" : "NÃO"}
                  </strong>
                </div>
                {dados.tipo_quarto && (
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase block">Tipo de Quarto Preferido:</span>
                    <span className="text-slate-800 dark:text-slate-200 print:text-black font-medium">
                      {dados.tipo_quarto}
                    </span>
                  </div>
                )}
                {dados.data_chegada && (
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase block">Previsão de Chegada:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 print:text-black">
                      {dados.data_chegada}
                    </span>
                  </div>
                )}
                {dados.meio_transporte && (
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase block">Meio de Transporte:</span>
                    <span className="text-slate-800 dark:text-slate-200 print:text-black">
                      {dados.meio_transporte}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. ALIMENTAÇÃO E OUTRAS PREFERÊNCIAS */}
            <div className="border border-slate-200 dark:border-slate-800 print:border-slate-400 rounded-[6px] overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800/80 print:bg-slate-100 px-4 py-2 border-b border-slate-200 dark:border-slate-800 print:border-slate-400 font-mono text-xs uppercase font-bold text-[#113240] dark:text-white print:text-black flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#226380]" />
                <span>3. Alimentação, Paramento e Observações Gerais</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase block">Restrições Alimentares:</span>
                  <span className="text-slate-800 dark:text-slate-200 print:text-black font-medium">
                    {dados.restricao_alimentar || "Nenhuma restrição declarada"}
                  </span>
                </div>
                {dados.tamanho_paramento && (
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase block">Tamanho de Veste / Paramento:</span>
                    <span className="font-mono font-bold text-[#226380] print:text-black">
                      {dados.tamanho_paramento}
                    </span>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <span className="font-mono text-[10px] text-slate-400 uppercase block">Observações do Confrade:</span>
                  <p className="text-slate-700 dark:text-slate-300 print:text-black bg-slate-50 dark:bg-slate-900/60 p-3 rounded border border-slate-200 dark:border-slate-800 mt-1 whitespace-pre-line leading-relaxed">
                    {dados.observacoes_gerais || "Nenhuma observação adicional informada."}
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
                <div className="border border-slate-200 dark:border-slate-800 print:border-slate-400 rounded-[6px] overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-800/80 print:bg-slate-100 px-4 py-2 border-b border-slate-200 dark:border-slate-800 print:border-slate-400 font-mono text-xs uppercase font-bold text-[#113240] dark:text-white print:text-black flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-[#226380]" />
                    <span>4. Informações Complementares Específicas</span>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                    {camposExtras.map(([chave, valor]) => {
                      const campoDef = camposMapeados.find(c => c.id === chave);
                      const label = campoDef ? campoDef.label : chave.replace(/_/g, " ").toUpperCase();
                      return (
                        <div key={chave}>
                          <span className="font-mono text-[10px] text-slate-400 uppercase block">{label}:</span>
                          <span className="text-slate-800 dark:text-slate-200 print:text-black font-medium">
                            {typeof valor === "boolean" ? (valor ? "Sim" : "Não") : String(valor || "-")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          </div>

          {/* TERMO E ASSINATURA INDIVIDUAL */}
          <footer className="pt-8 border-t border-slate-300 dark:border-slate-700 print:border-black space-y-8 break-inside-avoid">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 text-center">
              <div className="w-72">
                <div className="border-b border-slate-400 print:border-black pb-1 mb-1" />
                <p className="font-mono text-[10px] uppercase font-bold text-slate-700 print:text-black">
                  Assinatura do Confrade Inscrito
                </p>
                <p className="text-[9px] text-slate-400 font-sans">
                  {dados.nome_religioso || dados.nome_completo || "Confrade"}
                </p>
              </div>

              <div className="w-72">
                <div className="border-b border-slate-400 print:border-black pb-1 mb-1" />
                <p className="font-mono text-[10px] uppercase font-bold text-slate-700 print:text-black">
                  Secretaria Provincial BRM
                </p>
                <p className="text-[9px] text-slate-400 font-sans">
                  Visto de Recebimento & Protocolo
                </p>
              </div>
            </div>

            <div className="text-center font-mono text-[9px] text-slate-400 print:text-slate-600 pt-2 border-t border-dashed border-slate-200 print:border-black">
              Ficha emitida pelo Sistema Integrado da Província BRM • {lema}
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
};

export default FichaInscricaoIndividualPrint;
