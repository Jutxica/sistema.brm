import React from 'react';
import { 
  MapPin, ArrowRight, Calendar, FileText, Hotel, 
  User, Printer, BookOpen, Download 
} from 'lucide-react';
import type { PortalSection } from '../PortalReligioso';
import type { ReligiosoPortalData } from '../../../types/religioso';
import type { DocumentoProvincial, EventoProvincial } from '../../../types/secretaria';
import { staggerStyle } from '../../../hooks/useMotion';
import { downloadArquivo } from '../../../lib/downloadHelper';
import { AniversariosJubileusCard } from '../../../components/AniversariosJubileusCard';

export interface PortalInicioTabProps {
  religiosoData: ReligiosoPortalData | null;
  displayName: string;
  hasCompletedRegistration: boolean;
  registrationMenuLabel: string;
  displayGrau: string;
  userEmail?: string;
  proximoEvento?: EventoProvincial;
  documentoRecente?: DocumentoProvincial;
  documentos: DocumentoProvincial[];
  eventos: EventoProvincial[];
  navigateToSection: (section: PortalSection) => void;
  openRegistration: () => void | Promise<void>;
  formatPeriodo: (inicio: string, fim?: string | null) => string;
  getCategoriaCor: () => string;
  getTipoCor: () => string;
  onLerDocumento: (doc: DocumentoProvincial) => void;
}

export const PortalInicioTab: React.FC<PortalInicioTabProps> = ({
  religiosoData,
  displayName,
  hasCompletedRegistration,
  registrationMenuLabel,
  displayGrau,
  userEmail,
  proximoEvento,
  documentoRecente,
  documentos,
  eventos,
  navigateToSection,
  openRegistration,
  formatPeriodo,
  getCategoriaCor,
  getTipoCor,
  onLerDocumento
}) => {
  return (
    <>
      <div className="space-y-4 md:hidden">
        <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#16485a] to-[#113240] p-4 text-white shadow-[0_8px_24px_rgba(17,50,64,0.16)]">
          <div className="pointer-events-none absolute -right-10 -top-16 h-36 w-36 rounded-full border border-white/[0.08]" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/65">
                Portal do Confrade
              </span>
              {religiosoData?.comunidade_atual_nome && (
                <span className="flex min-w-0 items-center gap-1 text-[10px] text-white/70">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="max-w-[145px] truncate">{religiosoData.comunidade_atual_nome}</span>
                </span>
              )}
            </div>

            <h2 className="mt-1.5 text-[20px] font-semibold leading-tight tracking-[-0.03em]">
              Olá, {displayName}
            </h2>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/15 pt-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-[11px] text-white/65">Cadastro</span>
                <span className="truncate rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-semibold">
                  {religiosoData?.status_cadastro || 'Em revisão'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigateToSection('inscricao')}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-semibold text-[#113240] transition-colors hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span>{hasCompletedRegistration ? 'Revisar dados' : 'Completar cadastro'}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        <section aria-labelledby="mobile-next-event-title" className="rounded-[24px] border border-[#d6d6d6]/60 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:border-white/10 dark:bg-[#161617]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#226380] dark:text-[#A3C3C7]">
                Fique por dentro
              </span>
              <h3 id="mobile-next-event-title" className="mt-1 text-base font-semibold text-[#1d1d1f] dark:text-white">
                Próximo compromisso
              </h3>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7]">
              <Calendar className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          {proximoEvento ? (
            <>
              <p className="mt-4 text-sm font-semibold leading-snug text-[#1d1d1f] dark:text-white">
                {proximoEvento.titulo}
              </p>
              <p className="mt-1 text-xs text-[#707070] dark:text-[#a1a1a6]">
                {formatPeriodo(proximoEvento.data_inicio, proximoEvento.data_fim)}
                {proximoEvento.horario ? ` · ${proximoEvento.horario}` : ''}
              </p>
              {proximoEvento.local && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[#707070] dark:text-[#a1a1a6]">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{[proximoEvento.local, proximoEvento.cidade, proximoEvento.uf].filter(Boolean).join(' · ')}</span>
                </p>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-[#707070] dark:text-[#a1a1a6]">
              Não há próximos compromissos publicados. Quando houver novidades, elas aparecerão aqui.
            </p>
          )}
          <button
            type="button"
            onClick={() => navigateToSection('calendario')}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-between rounded-xl bg-[#f5f5f7] px-4 text-sm font-semibold text-[#226380] transition-colors hover:bg-[#e9eef0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#226380] dark:bg-[#262628] dark:text-[#A3C3C7] dark:hover:bg-[#303033]"
          >
            <span>Ver agenda completa</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </section>

        {documentoRecente && (
          <section aria-labelledby="mobile-recent-document-title" className="rounded-[24px] border border-[#d6d6d6]/60 bg-white p-5 dark:border-white/10 dark:bg-[#161617]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#707070] dark:text-[#a1a1a6]">
                  Publicação recente
                </span>
                <h3 id="mobile-recent-document-title" className="mt-1 text-base font-semibold text-[#1d1d1f] dark:text-white">
                  Documento oficial
                </h3>
              </div>
              <FileText className="h-5 w-5 shrink-0 text-[#226380] dark:text-[#A3C3C7]" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-medium leading-snug text-[#1d1d1f] dark:text-white">
              {documentoRecente.titulo}
            </p>
            <button
              type="button"
              onClick={() => navigateToSection('documentos')}
              className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#226380] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#226380] dark:text-[#A3C3C7]"
            >
              Explorar documentos
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </section>
        )}

        <section aria-labelledby="mobile-services-title" className="space-y-3 pb-1">
          <div className="px-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#707070] dark:text-[#a1a1a6]">
              Para você
            </span>
            <h3 id="mobile-services-title" className="mt-1 text-lg font-semibold text-[#1d1d1f] dark:text-white">
              Acessos rápidos
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: 'documentos', label: 'Documentos', detail: `${documentos.length} publicações`, icon: FileText },
              { id: 'hospedagem', label: 'Hospedagem', detail: 'Casas da Província', icon: Hotel },
            ] as const).map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateToSection(item.id)}
                  className="flex min-h-32 flex-col items-start justify-between rounded-[22px] border border-[#d6d6d6]/60 bg-white p-4 text-left transition-colors hover:border-[#226380]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#226380] dark:border-white/10 dark:bg-[#161617]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[#1d1d1f] dark:text-white">{item.label}</span>
                    <span className="mt-0.5 block text-[11px] text-[#707070] dark:text-[#a1a1a6]">{item.detail}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <AniversariosJubileusCard variant="portal" />
      </div>

      <div className="hidden space-y-4 sm:space-y-6 md:block">
        
        {/* Masthead Arquitetural do Confrade (Apple Showcase Card) */}
        <div className="portal-masthead bg-white dark:bg-[#161617] rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-7 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#707070] dark:text-[#86868b] block mb-1">
                Sint Unum • Padres Dehonianos
              </span>
              <h2 className="text-xl sm:text-[30px] font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7]">
                Saudação fraterna, {displayName}
              </h2>
              <p className="text-xs sm:text-sm text-[#707070] dark:text-[#86868b] font-normal mt-1 leading-relaxed">
                Bem-vindo ao espaço digital de comunhão, serviços e acompanhamento canônico da Província BRM.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 self-start md:self-auto shrink-0">
              <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#f5f5f7] dark:bg-[#262628] text-[#1d1d1f] dark:text-[#f5f5f7] border border-[#d6d6d6]/60 dark:border-white/10">
                Status: {religiosoData?.status_cadastro || 'Vínculo pendente'}
              </span>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-[#d6d6d6]/40 dark:border-white/5 pt-4 sm:hidden">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[#707070] dark:text-[#86868b]">Situação do cadastro</span>
              <span className="rounded-full bg-[#f5f5f7] dark:bg-[#262628] px-3 py-1 text-[11px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                {religiosoData?.status_cadastro || 'Em revisão'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigateToSection('inscricao')}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#226380] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#113240] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#226380]"
            >
              <FileText className="h-4 w-4" />
              <span>{hasCompletedRegistration ? 'Revisar meus dados' : 'Completar meu cadastro'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-[11px] leading-relaxed text-[#707070] dark:text-[#86868b]">
              Confira seus dados e envie correções à Secretaria Provincial. Comunidade e designações oficiais são mantidas pela Secretaria.
            </p>
          </div>
        </div>

        {/* 5 Cards de Acesso Rápido (Apple Showcase Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          
          {/* 01 / Meu Perfil */}
          <div 
            onClick={() => navigateToSection('perfil')}
            style={staggerStyle(0)}
            className="rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#161617] p-4 sm:p-5 border border-[#d6d6d6]/60 dark:border-white/10 hover:border-[#0071e3]/40 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] cursor-pointer group flex flex-col justify-between motion-lift motion-press motion-stagger-item"
          >
            <div>
              <div className="w-10 h-10 rounded-[14px] bg-[#f5f5f7] dark:bg-[#262628] flex items-center justify-center text-[#0071e3] mb-3 group-hover:scale-105 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-[#707070] dark:text-[#86868b] block mb-1">
                01 / CONTA SAAS
              </span>
              <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                Meu Perfil
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-[#d6d6d6]/40 dark:border-white/5 flex items-center justify-between text-xs font-medium text-[#0066cc] dark:text-[#2997ff]">
              <span>Foto e contatos</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* 02 / Cadastro BRM ou Atualizar Dados */}
          <button
            type="button"
            data-testid="card-item-inscricao"
            onClick={() => void openRegistration()}
            style={staggerStyle(1)}
            className="w-full text-left rounded-[24px] bg-white dark:bg-[#161617] p-5 border border-[#d6d6d6]/60 dark:border-white/10 hover:border-[#0071e3]/40 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] cursor-pointer group flex flex-col justify-between motion-lift motion-press motion-stagger-item"
          >
            <div>
              <div className="w-10 h-10 rounded-[14px] bg-[#f5f5f7] dark:bg-[#262628] flex items-center justify-center text-[#0071e3] mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-[#707070] dark:text-[#86868b] block mb-1">
                02 / CANÔNICO
              </span>
              <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                {registrationMenuLabel}
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-[#d6d6d6]/40 dark:border-white/5 flex items-center justify-between text-xs font-medium text-[#0066cc] dark:text-[#2997ff]">
              <span>6 etapas • revisar dados</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          {/* 03 / Documentos Oficiais */}
          <div 
            onClick={() => navigateToSection('documentos')}
            style={staggerStyle(2)}
            className="rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#161617] p-4 sm:p-5 border border-[#d6d6d6]/60 dark:border-white/10 hover:border-[#0071e3]/40 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] cursor-pointer group flex flex-col justify-between motion-lift motion-press motion-stagger-item"
          >
            <div>
              <div className="w-10 h-10 rounded-[14px] bg-[#f5f5f7] dark:bg-[#262628] flex items-center justify-center text-[#0071e3] mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-[#707070] dark:text-[#86868b] block mb-1">
                03 / DOCUMENTOS
              </span>
              <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                Documentos Oficiais
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-[#d6d6d6]/40 dark:border-white/5 flex items-center justify-between text-xs font-medium text-[#0066cc] dark:text-[#2997ff]">
              <span>{documentos.length} disponíveis</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* 04 / Minha Ficha Completa (PDF) */}
          <div 
            onClick={() => navigateToSection('ficha-pdf')}
            style={staggerStyle(3)}
            className="rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#161617] p-4 sm:p-5 border border-[#d6d6d6]/60 dark:border-white/10 hover:border-[#0071e3]/40 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] cursor-pointer group flex flex-col justify-between motion-lift motion-press motion-stagger-item"
          >
            <div>
              <div className="w-10 h-10 rounded-[14px] bg-[#f5f5f7] dark:bg-[#262628] flex items-center justify-center text-[#0071e3] mb-3 group-hover:scale-105 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-[#707070] dark:text-[#86868b] block mb-1">
                04 / IMPRESSÃO
              </span>
              <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                Minha Ficha
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-[#d6d6d6]/40 dark:border-white/5 flex items-center justify-between text-xs font-medium text-[#0066cc] dark:text-[#2997ff]">
              <span>PDF e cópia</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* 05 / Anuário dos Confrades */}
          <div 
            onClick={() => navigateToSection('anuario')}
            style={staggerStyle(4)}
            className="rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#161617] p-4 sm:p-5 border border-[#d6d6d6]/60 dark:border-white/10 hover:border-[#0071e3]/40 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] cursor-pointer group flex flex-col justify-between motion-lift motion-press motion-stagger-item"
          >
            <div>
              <div className="w-10 h-10 rounded-[14px] bg-[#f5f5f7] dark:bg-[#262628] flex items-center justify-center text-[#0071e3] mb-3 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-[#707070] dark:text-[#86868b] block mb-1">
                05 / DIRETÓRIO
              </span>
              <h3 className="text-[13px] sm:text-[15px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                Anuário BRM
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-[#d6d6d6]/40 dark:border-white/5 flex items-center justify-between text-xs font-medium text-[#0066cc] dark:text-[#2997ff]">
              <span>Diretório</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

        </div>

        {/* Informações Canônicas & Destaques da Província */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Minha Situação Canônica */}
          <div className="bg-white dark:bg-[#161617] rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-7 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="mb-5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#707070] dark:text-[#86868b] block mb-1">
                Registro Diocesano & Provincial
              </span>
              <h3 className="text-[18px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                Minha Situação Canônica
              </h3>
            </div>

            <div className="divide-y divide-[#d6d6d6]/40 dark:divide-white/5 text-[13px]">
              <div className="flex justify-between py-3">
                <span className="text-[#707070] dark:text-[#86868b]">Grau Eclesiástico</span>
                <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{displayGrau}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-[#707070] dark:text-[#86868b]">Comunidade Atual</span>
                <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{religiosoData?.comunidade_atual_nome || 'A definir'}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-[#707070] dark:text-[#86868b]">E-mail Institucional</span>
                <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">{religiosoData?.email_institucional || userEmail}</span>
              </div>
              <div className="flex justify-between py-3 items-center">
                <span className="text-[#707070] dark:text-[#86868b]">Validação da Secretaria</span>
                <span className={`rounded-full px-3 py-0.5 text-[11px] font-medium ${
                  religiosoData?.status_cadastro === 'Aprovado'
                    ? 'bg-[#e8f5e9] text-[#2e7d32] dark:bg-[#152a1b] dark:text-[#81c784]'
                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
                }`}>
                  {religiosoData?.status_cadastro || 'Aguardando vínculo'}
                </span>
              </div>
            </div>
          </div>

          {/* Publicações & Comunicados Recentes */}
          <div className="bg-white dark:bg-[#161617] rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-7 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#707070] dark:text-[#86868b] block mb-1">
                    Secretaria Provincial
                  </span>
                  <h3 className="text-[18px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                    Documentos Recentes
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigateToSection('documentos')}
                  className="text-xs font-medium text-[#0066cc] dark:text-[#2997ff] hover:underline cursor-pointer"
                >
                  Ver todos ({documentos.length})
                </button>
              </div>

              <div className="divide-y divide-[#d6d6d6]/40 dark:divide-white/5 text-[13px]">
                {documentos.slice(0, 3).map((doc, idx) => (
                  <div key={doc.id} style={staggerStyle(idx)} className="py-3 flex items-start justify-between gap-3 motion-stagger-item">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${getCategoriaCor()}`}>
                          {doc.categoria}
                        </span>
                        {doc.numero_referencia && (
                          <span className="font-mono text-[9px] text-[#707070] dark:text-[#86868b]">
                            {doc.numero_referencia}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onLerDocumento(doc)}
                        className="text-left w-full group/title cursor-pointer"
                        title="Clique para ler este documento"
                      >
                        <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7] block line-clamp-1 group-hover/title:text-[#226380] dark:group-hover/title:text-[#64b5f6] transition-colors">
                          {doc.titulo}
                        </span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onLerDocumento(doc)}
                        className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#226380] dark:text-[#64b5f6] transition-colors motion-press cursor-pointer"
                        title="Ler documento na tela"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadArquivo(doc.arquivo_url, doc.arquivo_nome);
                        }}
                        className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#707070] hover:text-[#113240] dark:hover:text-white transition-colors motion-press cursor-pointer"
                        title="Baixar arquivo"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigateToSection('documentos')}
              className="mt-4 pt-3 border-t border-[#d6d6d6]/40 dark:border-white/5 flex items-center justify-between text-xs text-[#0066cc] dark:text-[#2997ff] font-medium cursor-pointer motion-press"
            >
              <span>Consultar acervo de documentos oficiais</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Jubileus & Aniversários do Mês */}
        <AniversariosJubileusCard variant="portal" />

        {/* Próximos Eventos da Agenda Provincial */}
        <div className="bg-white dark:bg-[#161617] rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-7 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#707070] dark:text-[#86868b] block mb-1">
                Comunhão & Agenda
              </span>
              <h3 className="text-[18px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                Próximos Eventos da Província BRM
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigateToSection('calendario')}
              className="text-xs font-medium text-[#0066cc] dark:text-[#2997ff] hover:underline self-start sm:self-auto cursor-pointer"
            >
              Ver calendário completo ({eventos.length})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {eventos.slice(0, 3).map((evt, idx) => (
              <div
                key={evt.id}
                style={staggerStyle(idx)}
                className="p-4 rounded-[20px] bg-[#fbfbfd] dark:bg-[#1f1f21] border border-[#d6d6d6]/60 dark:border-white/10 flex flex-col justify-between gap-3 motion-lift motion-press motion-stagger-item"
              >
                <div className="space-y-1.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getTipoCor()}`}>
                    {evt.tipo}
                  </span>
                  <h4 className="text-[14px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] leading-snug">
                    {evt.titulo}
                  </h4>
                  <span className="text-xs text-[#707070] dark:text-[#86868b] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                    <span className="truncate">{evt.local}</span>
                  </span>
                </div>
                <div className="pt-2 border-t border-[#d6d6d6]/40 dark:border-white/5 text-[11px] font-medium text-[#0071e3] dark:text-[#2997ff]">
                  {formatPeriodo(evt.data_inicio, evt.data_fim)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
};
