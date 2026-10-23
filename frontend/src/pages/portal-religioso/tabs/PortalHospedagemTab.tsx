import React from 'react';
import { ArrowLeft, ExternalLink, Loader2, MapPin, Phone, Mail, ArrowRight } from 'lucide-react';
import { ClimaCasaCard } from '../../../components/ClimaCasaCard';
import type { CasaAcolhida } from '../../../types/obra';
import { staggerStyle } from '../../../hooks/useMotion';

export interface PortalHospedagemTabProps {
  casasAcolhida: CasaAcolhida[];
  loadingCasas: boolean;
  onVoltar: () => void;
}

export const PortalHospedagemTab: React.FC<PortalHospedagemTabProps> = ({
  casasAcolhida,
  loadingCasas,
  onVoltar
}) => {
  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={onVoltar}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#161617] border border-[#d6d6d6]/60 dark:border-white/10 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#262628] transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Painel do Confrade</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#161617] rounded-[24px] sm:rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-5 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#707070] dark:text-[#86868b] block mb-1">
            Acolhida Fraterna • Província BRM
          </span>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7]">
            Hospedagem & Acolhida Fraterna
          </h2>
          <p className="text-xs sm:text-sm text-[#707070] dark:text-[#86868b] font-normal mt-1 leading-relaxed max-w-2xl">
            Solicite estadia para períodos de descanso, estudos, retiros ou passagem pastoral nas Casas e Obras oficiais da Província BRM.
          </p>
        </div>

        <a
          href="/inscricao"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 w-full sm:w-auto justify-center px-5 sm:px-6 py-3 rounded-full bg-[#226380] hover:bg-[#0077ed] text-sm font-semibold transition-all items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0 shadow-sm active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#226380]"
        >
          <span>Ficha Geral de Inscrição</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Grid das Casas e Obras da Província BRM para Hospedagem */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-[17px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
              Casas e Obras de Acolhida da Província BRM
            </h3>
            <p className="text-xs text-[#707070] dark:text-[#86868b] mt-0.5">
              Selecione uma das casas da província abaixo para abrir a solicitação de estadia com o destino pré-definido.
            </p>
          </div>
          {loadingCasas && <Loader2 className="w-4 h-4 animate-spin text-[#226380]" />}
        </div>

        {casasAcolhida.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {casasAcolhida.map((casa, idx) => {
              const loc = `${casa.cidade || casa.localidade || ''}${casa.uf ? `/${casa.uf}` : ''}`;
              return (
                <div
                  key={casa.id}
                  style={staggerStyle(idx)}
                  className="bg-white dark:bg-[#161617] rounded-[22px] sm:rounded-[24px] border border-[#d6d6d6]/60 dark:border-white/10 p-4 sm:p-6 flex flex-col justify-between hover:border-[#226380]/40 dark:hover:border-[#A3C3C7]/40 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.02)] motion-stagger-item motion-lift"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#f5f5f7] dark:bg-[#262628] text-[#1d1d1f] dark:text-[#f5f5f7] border border-[#d6d6d6]/60 dark:border-white/10">
                        {casa.tipo || 'Casa / Obra'}
                      </span>
                      <span className="max-w-full text-xs text-[#707070] dark:text-[#86868b] font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#226380]" />
                        {loc}
                      </span>
                    </div>

                    <h4 className="text-[15px] sm:text-[16px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight mb-2">
                      {casa.nome}
                    </h4>

                    {casa.endereco && (
                      <p className="text-[12px] text-[#707070] dark:text-[#86868b] line-clamp-2 mb-3 leading-relaxed">
                        {casa.endereco}
                      </p>
                    )}

                    <div className="space-y-1 text-[11px] text-[#707070] dark:text-[#86868b]">
                      {casa.telefone && (
                        <a href={`tel:${casa.telefone.replace(/[^\d+]/g, '')}`} className="flex min-h-10 items-center gap-2 break-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#226380]">
                          <Phone className="w-3 h-3 text-[#707070]" />
                          <span>{casa.telefone}</span>
                        </a>
                      )}
                      {casa.email && (
                        <a href={`mailto:${casa.email}`} className="flex min-h-10 min-w-0 items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#226380]">
                          <Mail className="w-3 h-3 text-[#707070] shrink-0" />
                          <span className="truncate">{casa.email}</span>
                        </a>
                      )}
                    </div>
                  </div>

                    <ClimaCasaCard cidade={casa.cidade || casa.localidade} />

                  <div className="pt-4 mt-4 border-t border-[#d6d6d6]/40 dark:border-white/5">
                    <a
                      href={`/inscricao?casa=${encodeURIComponent(casa.nome)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-12 py-3 px-3 sm:px-4 rounded-full bg-[#f5f5f7] dark:bg-[#262628] hover:bg-[#226380] hover:text-white dark:hover:bg-[#226380] text-[#1d1d1f] dark:text-[#f5f5f7] text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#d6d6d6]/60 dark:border-white/10 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#226380]"
                    >
                      <span>Solicitar Estadia Nesta Casa</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-[#707070] dark:text-[#86868b] bg-white dark:bg-[#161617] rounded-[24px] border border-[#d6d6d6]/60 dark:border-white/10 p-6">
            {loadingCasas ? 'Carregando casas da Província BRM...' : 'Nenhuma casa ou obra listada no momento.'}
          </div>
        )}
      </div>
    </div>
  );
};
