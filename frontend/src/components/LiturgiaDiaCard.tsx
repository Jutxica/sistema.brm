import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
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
      <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#161b22] p-4 sm:p-5 animate-pulse">
        <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
        <div className="h-6 w-56 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#161b22] p-4 sm:p-5 shadow-xs">
      {/* Top liturgical hairline indicator */}
      <div 
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: liturgia.corHex }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 pt-0.5">
        <div className="flex items-center gap-2">
          <span 
            className="inline-block w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10"
            style={{ backgroundColor: liturgia.corHex }}
            title={`Cor Litúrgica: ${liturgia.corLiturgicaNome}`}
          />
          <span className="font-cinzel text-[11px] font-semibold uppercase tracking-[0.16em] text-[#61767e] dark:text-[#a0aeaf]">
            Liturgia da Igreja · {liturgia.tempoLiturgico}
          </span>
        </div>

        <span className={`inline-flex items-center font-cinzel text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-[4px] border ${liturgia.corBadgeClara}`}>
          {liturgia.corLiturgicaNome.toUpperCase()}
        </span>
      </div>

      <div className="flex items-start gap-3.5">
        <div className="shrink-0 mt-0.5 p-2 rounded-md bg-[#113240]/5 text-[#113240] dark:bg-[#A3C3C7]/10 dark:text-[#A3C3C7] border border-black/5 dark:border-white/10">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-cinzel text-sm sm:text-base font-bold text-[#113240] dark:text-white leading-snug tracking-wide">
            {liturgia.santoDoDia}
          </h4>
          <p className="mt-1.5 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-serif italic">
            "{liturgia.versiculoTexto}"
          </p>
          <span className="block mt-1 font-cinzel text-[11px] font-semibold tracking-wider text-[#226380] dark:text-[#A3C3C7]">
            — {liturgia.versiculoReferencia}
          </span>
        </div>
      </div>
    </div>
  );
};
