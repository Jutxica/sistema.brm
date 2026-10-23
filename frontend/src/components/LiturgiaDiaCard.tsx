import React, { useEffect, useState } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';
import { liturgiaService, type InfoLiturgica } from '../services/liturgiaService';
import { CruzDehonianaIcon } from './CruzDehonianaIcon';

function formatarTextoEvangelho(texto: string): string {
  if (!texto) return '';

  // 1. Remove números de versículos inline (ex: "54Jesus" -> "Jesus", " 55Quando" -> "Quando", "59Eu te digo" -> "Eu te digo")
  let limpo = texto
    .replace(/(?:^|\s)\d{1,3}(?=[A-Za-zÀ-ÖØ-öø-ÿ“])/g, ' ')
    .replace(/\b\d{1,3}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Se o texto veio em caixa alta completa (ALL CAPS), normaliza para iniciais maiúsculas em início de frase
  if (limpo === limpo.toUpperCase() && limpo.length > 20) {
    limpo = limpo.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-zà-ÿ])/g, (_m, p1, p2) => p1 + p2.toUpperCase());
    limpo = limpo
      .replace(/\bjesus\b/g, 'Jesus')
      .replace(/\bdeus\b/g, 'Deus')
      .replace(/\bsenhor\b/g, 'Senhor')
      .replace(/\bpai\b/g, 'Pai')
      .replace(/\blucas\b/g, 'Lucas')
      .replace(/\bmateus\b/g, 'Mateus')
      .replace(/\bmarcos\b/g, 'Marcos')
      .replace(/\bjoão\b/g, 'João');
  }

  return limpo;
}

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
          <span 
            className="text-xs font-semibold text-[#61767e] dark:text-[#a0aeaf] tracking-wide"
            style={{ fontFamily: 'var(--font-jakarta), var(--font-sans), sans-serif' }}
          >
            Liturgia Diária · {liturgia.tempoLiturgico}
          </span>
        </div>

        <span 
          className={`inline-flex items-center text-[11px] font-medium capitalize px-2.5 py-0.5 rounded-[4px] border ${liturgia.corBadgeClara}`}
          style={{ fontFamily: 'var(--font-jakarta), var(--font-sans), sans-serif' }}
        >
          {liturgia.corLiturgicaNome.split(' ')[0]}
        </span>
      </div>

      {/* Conteúdo: Cruz Dehoniana livre (sem caixa/retângulo arredondado) + Santo + Trecho do Evangelho em Plus Jakarta Sans */}
      <div className="flex items-start gap-3.5">
        <CruzDehonianaIcon className="w-6 h-6 shrink-0 mt-0.5 select-none" />
        
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <div 
              role="heading"
              aria-level={4}
              className="text-sm sm:text-base font-semibold text-[#113240] dark:text-white leading-snug tracking-normal"
              style={{ fontFamily: 'var(--font-jakarta), var(--font-sans), sans-serif' }}
            >
              {liturgia.santoDoDia}
            </div>
            <span 
              className="text-[11px] font-medium text-[#226380] dark:text-[#A3C3C7] block mt-0.5"
              style={{ fontFamily: 'var(--font-jakarta), var(--font-sans), sans-serif' }}
            >
              Evangelho do dia · {liturgia.evangelhoReferencia}
            </span>
          </div>

          <div className="border-l-2 border-[#226380]/40 pl-3 py-0.5">
            <p 
              className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-normal normal-case not-italic"
              style={{ fontFamily: 'var(--font-jakarta), var(--font-sans), sans-serif' }}
            >
              “{expandido ? formatarTextoEvangelho(liturgia.evangelhoTexto) : formatarTextoEvangelho(liturgia.evangelhoTrecho)}”
            </p>
            <div className="flex items-center justify-between gap-3 mt-1.5 pt-1">
              <span 
                className="text-[11px] font-medium text-[#226380] dark:text-[#A3C3C7]"
                style={{ fontFamily: 'var(--font-jakarta), var(--font-sans), sans-serif' }}
              >
                — {liturgia.evangelhoReferencia}
              </span>

              {temMaisTexto && (
                <button
                  type="button"
                  onClick={() => setExpandido(!expandido)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#113240] dark:text-slate-400 dark:hover:text-[#A3C3C7] cursor-pointer transition-colors"
                  style={{ fontFamily: 'var(--font-jakarta), var(--font-sans), sans-serif' }}
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
