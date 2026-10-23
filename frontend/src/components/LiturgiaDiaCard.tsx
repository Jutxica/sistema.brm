import React, { useEffect, useState } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';
import { liturgiaService, type InfoLiturgica } from '../services/liturgiaService';
import { CruzDehonianaIcon } from './CruzDehonianaIcon';

export const LiturgiaDiaCard: React.FC = () => {
  const [liturgia, setLiturgia] = useState<InfoLiturgica | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [expandido, setExpandido] = useState(false);

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

  const temMaisTexto = Boolean(liturgia.evangelhoTexto && liturgia.evangelhoTexto.length > (liturgia.evangelhoTrecho?.length || 0));

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#161b22] p-4 sm:p-5 shadow-xs transition-all">
      {/* Indicador superior com a cor litúrgica do dia */}
      <div 
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: liturgia.corHex }}
      />

      {/* Cabeçalho da Liturgia Diária */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 pt-0.5">
        <div className="flex items-center gap-2">
          <span 
            className="inline-block w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10 shrink-0"
            style={{ backgroundColor: liturgia.corHex }}
            title={`Cor Litúrgica: ${liturgia.corLiturgicaNome}`}
          />
          <span className="font-cinzel text-[11px] font-semibold uppercase tracking-[0.16em] text-[#61767e] dark:text-[#a0aeaf]">
            Liturgia Diária · {liturgia.tempoLiturgico}
          </span>
        </div>

        <span className={`inline-flex items-center font-cinzel text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-[4px] border ${liturgia.corBadgeClara}`}>
          {liturgia.corLiturgicaNome.toUpperCase()}
        </span>
      </div>

      {/* Conteúdo: Cruz Dehoniana Oficial + Santo do Dia + Trecho do Evangelho */}
      <div className="flex items-start gap-3.5">
        <div className="shrink-0 mt-0.5 p-2 rounded-md bg-[#113240]/5 dark:bg-[#A3C3C7]/10 border border-[#113240]/10 dark:border-white/10 flex items-center justify-center">
          <CruzDehonianaIcon className="w-5 h-5" />
        </div>
        
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h4 className="font-cinzel text-sm sm:text-base font-bold text-[#113240] dark:text-white leading-snug tracking-wide">
              {liturgia.santoDoDia}
            </h4>
            <span className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.14em] text-[#226380] dark:text-[#A3C3C7] block mt-0.5">
              Evangelho do Dia · {liturgia.evangelhoReferencia}
            </span>
          </div>

          <div className="border-l-2 border-[#226380]/40 pl-3 py-0.5">
            <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-serif italic">
              “{expandido ? liturgia.evangelhoTexto : liturgia.evangelhoTrecho}”
            </p>
            <div className="flex items-center justify-between gap-3 mt-1.5 pt-1">
              <span className="font-cinzel text-[11px] font-semibold tracking-wider text-[#226380] dark:text-[#A3C3C7]">
                — {liturgia.evangelhoReferencia}
              </span>

              {temMaisTexto && (
                <button
                  type="button"
                  onClick={() => setExpandido(!expandido)}
                  className="inline-flex items-center gap-1 font-cinzel text-[10px] uppercase tracking-wider text-slate-500 hover:text-[#113240] dark:text-slate-400 dark:hover:text-[#A3C3C7] cursor-pointer transition-colors"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>{expandido ? 'Recolher trecho' : 'Ler Evangelho completo'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
