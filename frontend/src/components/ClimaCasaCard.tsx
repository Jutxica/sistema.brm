import React, { useEffect, useState } from 'react';
import { CloudSun, Sun, Cloud, CloudRain, CloudLightning, Loader2 } from 'lucide-react';
import { climaService, type PrevisaoClima } from '../services/climaService';

interface ClimaCasaCardProps {
  cidade?: string;
}

export const ClimaCasaCard: React.FC<ClimaCasaCardProps> = ({ cidade }) => {
  const [clima, setClima] = useState<PrevisaoClima | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    climaService.obterPrevisaoPorCidade(cidade).then(dados => {
      if (ativo) {
        setClima(dados);
        setCarregando(false);
      }
    });
    return () => { ativo = false; };
  }, [cidade]);

  if (carregando) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-[#707070] dark:text-[#86868b] mt-2 py-1">
        <Loader2 className="w-3 h-3 animate-spin text-[#0071e3]" />
        <span>Consultando clima local...</span>
      </div>
    );
  }

  if (!clima) return null;

  const renderIcone = () => {
    switch (clima.icone) {
      case 'sol':
        return <Sun className="w-3.5 h-3.5 text-amber-500" />;
      case 'sol-nuvem':
        return <CloudSun className="w-3.5 h-3.5 text-amber-500" />;
      case 'chuva':
        return <CloudRain className="w-3.5 h-3.5 text-blue-500" />;
      case 'trovoada':
        return <CloudLightning className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <Cloud className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="mt-2.5 pt-2.5 border-t border-[#d6d6d6]/40 dark:border-white/10 flex items-center justify-between text-xs text-[#707070] dark:text-[#86868b]">
      <div className="flex items-center gap-1.5">
        {renderIcone()}
        <span className="font-medium text-[#1d1d1f] dark:text-white">
          {clima.temperaturaAtual}°C
        </span>
        <span className="text-[11px] text-[#86868b]">
          ({clima.temperaturaMin}° / {clima.temperaturaMax}°)
        </span>
      </div>
      <span className="text-[11px] truncate max-w-[120px] text-right font-normal">
        {clima.descricaoCondicao}
      </span>
    </div>
  );
};
