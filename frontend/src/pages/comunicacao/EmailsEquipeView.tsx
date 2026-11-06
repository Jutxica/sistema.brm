import React, { useState } from 'react';
import { Mail, Phone, UserCheck, Shield, Plus, Copy, Check } from 'lucide-react';
import type { ComunicacaoEmailEquipe } from '../../types/comunicacao';

interface EmailsEquipeViewProps {
  emails: ComunicacaoEmailEquipe[];
}

export const EmailsEquipeView: React.FC<EmailsEquipeViewProps> = ({
  emails
}) => {
  const [copiadoEmail, setCopiadoEmail] = useState<string | null>(null);

  const copiar = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiadoEmail(email);
    setTimeout(() => setCopiadoEmail(null), 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#113240] dark:text-white tracking-tight">
          E-mails da equipe.
        </h1>
        <p className="text-sm text-[#66777b] dark:text-[#a0aeaf] mt-1">
          Diretório e mailing oficial dos responsáveis pela produção, revisão e estratégia da Província BRM.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {emails.map(membro => (
          <div
            key={membro.id}
            className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-5 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                  membro.papel === 'coordenador'
                    ? 'bg-[#113240]/10 text-[#113240] border-[#113240]/20 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40'
                    : membro.papel === 'operador'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                }`}>
                  {membro.papel === 'coordenador' ? 'Coordenação' : membro.papel === 'operador' ? 'Interno' : 'Externo / Designer'}
                </span>

                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Ativo</span>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-[#113240] dark:text-white">
                  {membro.nome}
                </h2>
                <p className="text-xs text-[#66777b] dark:text-[#a0aeaf]">
                  {membro.cargo}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#dce4e2] dark:border-[#354246] text-xs">
                <div 
                  onClick={() => copiar(membro.email)}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#f8faf9] dark:bg-[#141a1c] cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
                >
                  <span className="text-[#113240] dark:text-[#edf2f1] text-xs font-medium truncate">
                    {membro.email}
                  </span>
                  {copiadoEmail === membro.email ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>

                {membro.telefone && (
                  <div className="flex items-center gap-2 text-[#66777b] dark:text-[#a0aeaf] px-1 text-xs">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{membro.telefone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
