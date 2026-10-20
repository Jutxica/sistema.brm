import React, { useState } from 'react';
import { 
  X, Calendar, Download, Smartphone, Check, 
  ExternalLink, Sparkles, BookOpen, Clock, ShieldCheck 
} from 'lucide-react';
import { icalService } from '../services/icalService';
import type { EventoProvincial } from '../types/secretaria';
import { showToast } from '../hooks/useFeedback';

interface SincronizarCalendarioModalProps {
  aberto: boolean;
  onFechar: () => void;
  eventos: EventoProvincial[];
}

export const SincronizarCalendarioModal: React.FC<SincronizarCalendarioModalProps> = ({
  aberto,
  onFechar,
  eventos
}) => {
  const [baixando, setBaixando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'iphone' | 'google' | 'outlook'>('iphone');

  if (!aberto) return null;

  const handleBaixarIcs = () => {
    setBaixando(true);
    try {
      icalService.baixarArquivoIcs(eventos, 'agenda_provincia_brm_2026.ics');
      showToast.success('Arquivo .ics da Província e Liturgia gerado com sucesso!', 'Calendário Baixado');
    } catch (err) {
      showToast.error('Erro ao gerar arquivo do calendário.', 'Erro');
    } finally {
      setTimeout(() => setBaixando(false), 800);
    }
  };

  const festasLiturgicas = icalService.gerarFestasLiturgicasIgreja(new Date().getFullYear());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[24px] bg-white dark:bg-[#161617] border border-[#d6d6d6]/60 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-[#d6d6d6]/40 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] dark:bg-[#2997ff]/15 dark:text-[#2997ff]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#707070] dark:text-[#86868b] block">
                iCalendar • RFC 5545 & Romcal
              </span>
              <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-white leading-tight">
                Sincronizar com Meu Celular
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="p-2 rounded-full text-[#707070] hover:text-[#1d1d1f] dark:text-[#86868b] dark:hover:text-white hover:bg-[#f5f5f7] dark:hover:bg-[#262628] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Card Resumo da Composição */}
          <div className="rounded-[18px] bg-gradient-to-br from-[#f5f5f7] to-[#e9eef0] dark:from-[#1a1a1c] dark:to-[#222426] p-4 border border-[#d6d6d6]/40 dark:border-white/10">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#226380] dark:text-[#A3C3C7] block mb-1">
              O que será adicionado à sua agenda pessoal:
            </span>
            <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0071e3]" />
                <span className="font-medium text-[#1d1d1f] dark:text-white">
                  {eventos.length} Eventos da Província BRM
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-[#1d1d1f] dark:text-white">
                  {festasLiturgicas.length} Solenidades da Igreja
                </span>
              </div>
              <div className="flex items-center gap-2 col-span-2 text-[11px] text-[#707070] dark:text-[#86868b]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Inclui festas Dehonianas (Solenidade do Sagrado Coração, Pe. Dehon) e Quaresma/Páscoa/Natal.</span>
              </div>
            </div>
          </div>

          {/* Botão Principal de Download do Feed .ICS */}
          <div>
            <button
              type="button"
              onClick={handleBaixarIcs}
              disabled={baixando}
              className="w-full py-3.5 px-5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.99] disabled:opacity-70"
            >
              <Download className="w-4 h-4" />
              <span>{baixando ? 'Preparando Calendário...' : 'Baixar Calendário Unificado (.ICS)'}</span>
            </button>
            <p className="text-[11px] text-center text-[#707070] dark:text-[#86868b] mt-2">
              Compatível com iPhone (Apple Calendar), Android, Google Agenda e Microsoft Outlook.
            </p>
          </div>

          {/* Abas com Como Configurar em Cada Aparelho */}
          <div className="pt-2 border-t border-[#d6d6d6]/40 dark:border-white/10">
            <span className="text-xs font-semibold text-[#1d1d1f] dark:text-white block mb-2.5">
              Como adicionar no seu aparelho:
            </span>

            <div className="flex gap-2 p-1 rounded-xl bg-[#f5f5f7] dark:bg-[#262628] mb-3 text-xs">
              <button
                type="button"
                onClick={() => setAbaAtiva('iphone')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  abaAtiva === 'iphone'
                    ? 'bg-white dark:bg-[#161617] text-[#1d1d1f] dark:text-white shadow-xs'
                    : 'text-[#707070] dark:text-[#86868b]'
                }`}
              >
                iPhone / iPad
              </button>
              <button
                type="button"
                onClick={() => setAbaAtiva('google')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  abaAtiva === 'google'
                    ? 'bg-white dark:bg-[#161617] text-[#1d1d1f] dark:text-white shadow-xs'
                    : 'text-[#707070] dark:text-[#86868b]'
                }`}
              >
                Google Agenda
              </button>
              <button
                type="button"
                onClick={() => setAbaAtiva('outlook')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  abaAtiva === 'outlook'
                    ? 'bg-white dark:bg-[#161617] text-[#1d1d1f] dark:text-white shadow-xs'
                    : 'text-[#707070] dark:text-[#86868b]'
                }`}
              >
                Outlook / PC
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fbfbfd] dark:bg-[#1c1c1e] border border-[#d6d6d6]/40 dark:border-white/5 text-xs text-[#707070] dark:text-[#a1a1a6] space-y-2">
              {abaAtiva === 'iphone' && (
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>Clique no botão azul <strong>"Baixar Calendário Unificado (.ICS)"</strong> acima pelo Safari do seu iPhone.</li>
                  <li>O iOS perguntará se deseja <em>"Adicionar todos os eventos ao Calendário"</em>.</li>
                  <li>Confirme tocando em <strong>Adicionar Todos</strong>. Pronto! Os retiros e festas já estarão no seu app nativo com alertas.</li>
                </ol>
              )}

              {abaAtiva === 'google' && (
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>Baixe o arquivo <strong>.ics</strong> no seu computador ou celular.</li>
                  <li>Acesse o <strong>Google Agenda</strong> (calendar.google.com).</li>
                  <li>No menu lateral esquerdo, clique em <strong>Outras agendas (+) → Importar</strong>.</li>
                  <li>Selecione o arquivo baixado e confirme. Todos os compromissos aparecerão na sua conta Google!</li>
                </ol>
              )}

              {abaAtiva === 'outlook' && (
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>Abra o arquivo <strong>.ics</strong> com dois cliques após o download.</li>
                  <li>O Microsoft Outlook abrirá perguntando se deseja abrir como um novo calendário ou mesclar.</li>
                  <li>Clique em <strong>Importar</strong> para ter os eventos sempre à mão no seu computador.</li>
                </ol>
              )}
            </div>
          </div>

        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end p-4 bg-[#f5f5f7] dark:bg-[#1a1a1c] border-t border-[#d6d6d6]/40 dark:border-white/10">
          <button
            type="button"
            onClick={onFechar}
            className="px-5 py-2 rounded-full text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e8e8ed] dark:hover:bg-[#262628] transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
