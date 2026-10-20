import React, { useEffect, useState } from 'react';
import { Sparkles, Calendar, BookOpen } from 'lucide-react';
import { liturgiaService, type InfoLiturgica } from '../services/liturgiaService';

export const LiturgiaDiaCard: React.FC = () => {
  const [liturgia, setLiturgia] = useState<InfoLiturgica | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    liturgiaService.getLiturgiaDoDia().then(dados => {
      if (ativo) {
        setLiturgia(dados);
        setCarregando(false);
      }
    });
    return () => { ativo = false; };
  }, []);

  if (carregando || !liturgia) {
    return (
      <div className="rounded-[22px] border border-[#d6d6d6]/60 dark:border-white/10 bg-white/70 dark:bg-[#161617]/70 p-4 sm:p-5 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded mb-2" />
        <div className="h-6 w-48 bg-slate-200 dark:bg-white/10 rounded" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[22px] sm:rounded-[24px] border border-[#d6d6d6]/60 dark:border-white/10 bg-gradient-to-br from-white to-[#fbfbfd] dark:from-[#161617] dark:to-[#1a1a1c] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <span 
            className="inline-block w-2.5 h-2.5 rounded-full shadow-sm"
            style={{ backgroundColor: liturgia.corHex }}
            title={`Cor Litúrgica: ${liturgia.corLiturgicaNome}`}
          />
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#707070] dark:text-[#86868b]">
            Liturgia do Dia • {liturgia.tempoLiturgico}
          </span>
        </div>

        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${liturgia.corBadgeClara}`}>
          Cor: {liturgia.corLiturgica.toUpperCase()}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5 p-2 rounded-xl bg-[#0071e3]/10 text-[#0071e3] dark:bg-[#2997ff]/15 dark:text-[#2997ff]">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm sm:text-base font-semibold text-[#1d1d1f] dark:text-white leading-snug">
            {liturgia.santoDoDia}
          </h4>
          <p className="mt-1 text-xs text-[#707070] dark:text-[#86868b] leading-relaxed italic">
            {liturgia.versiculoTexto}
          </p>
          <span className="block mt-1 text-[11px] font-medium text-[#0071e3] dark:text-[#2997ff]">
            — {liturgia.versiculoReferencia}
          </span>
        </div>
      </div>
    </div>
  );
};
