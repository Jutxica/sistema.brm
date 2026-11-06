import React from 'react';
import { Gift, Calendar as CalendarIcon, Heart, Sparkles, Plus, Award } from 'lucide-react';

interface AniversariantesViewProps {
  aniversariantes: Array<{
    id: string;
    nome: string;
    dia: number;
    mes: number;
    tipo: 'natalicio' | 'ordenacao' | 'votos';
    anos?: number;
    comunidade?: string;
  }>;
  onCriarStory: (religiosoNome: string, motivo: string) => void;
}

export const AniversariantesView: React.FC<AniversariantesViewProps> = ({
  aniversariantes,
  onCriarStory
}) => {
  const natalicios = aniversariantes.filter(a => a.tipo === 'natalicio');
  const jubileus = aniversariantes.filter(a => a.tipo === 'ordenacao' || a.tipo === 'votos');

  const mesesAno = [
    { mes: 'Janeiro', count: 6, nomes: 'Pe. André, Ir. João...' },
    { mes: 'Fevereiro', count: 4, nomes: 'Pe. Lucas, Pe. Carlos...' },
    { mes: 'Março', count: 8, nomes: 'Pe. Gustavo, Pe. Mário...' },
    { mes: 'Abril', count: 5, nomes: 'Pe. Roberto, Ir. Paulo...' },
    { mes: 'Maio', count: 7, nomes: 'Pe. Daniel, Pe. Tiago...' },
    { mes: 'Junho', count: 9, nomes: 'Pe. Rafael, Ir. Bruno...' },
    { mes: 'Julho', count: 3, nomes: 'Pe. Marcos, Pe. José...' },
    { mes: 'Agosto', count: 8, nomes: 'Pe. Cláudio, Pe. Sérgio...' },
    { mes: 'Setembro', count: 5, nomes: 'Pe. Luís, Ir. Antônio...' },
    { mes: 'Outubro', count: 6, nomes: 'Pe. Rodrigo, Pe. Marcelo...' },
    { mes: 'Novembro', count: natalicios.length + jubileus.length, nomes: 'Pe. André, Pe. Marcos, Ir. Francisco...' },
    { mes: 'Dezembro', count: 7, nomes: 'Pe. Gabriel, Ir. Mateus...' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#113240] dark:text-white tracking-tight">
          Aniversariantes de novembro.
        </h1>
        <p className="text-sm text-[#66777b] dark:text-[#a0aeaf] mt-1">
          {natalicios.length} natalícios e {jubileus.length} de ordenação/votos neste mês. Use "Criar story" para já colocar o story no cronograma.
        </p>
      </div>

      {/* Grid Principal: Natalícios e Jubileus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Bloco Natalícios */}
        <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-semibold text-[#113240] dark:text-white">
                Aniversários Natalícios
              </h2>
            </div>
            <span className="text-xs font-medium text-[#66777b] dark:text-[#a0aeaf]">
              Novembro
            </span>
          </div>

          <div className="space-y-3">
            {natalicios.length === 0 ? (
              <p className="text-xs text-[#86868b] text-center py-4">Nenhum aniversário natalício neste mês.</p>
            ) : (
              natalicios.map(rel => (
                <div
                  key={rel.id}
                  className="p-3.5 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 flex flex-col items-center justify-center">
                      <span className="text-sm font-bold">{rel.dia}</span>
                      <span className="text-xs font-medium">dia</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-[#113240] dark:text-white">{rel.nome}</h3>
                      <p className="text-xs text-[#66777b] dark:text-[#a0aeaf]">{rel.comunidade || 'Província BRM'}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCriarStory(rel.nome, 'Aniversário Natalício')}
                    className="px-3 py-1.5 rounded-lg bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
                  >
                    + Criar story
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bloco Jubileus & Tempo de Casa */}
        <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-[#113240] dark:text-white">
                Jubileus e ordenação presbiteral
              </h2>
            </div>
            <span className="text-xs font-medium text-[#66777b] dark:text-[#a0aeaf]">
              Pela data de ordenação
            </span>
          </div>

          <div className="space-y-3">
            {jubileus.length === 0 ? (
              <p className="text-xs text-[#86868b] text-center py-4">Nenhum jubileu registrado neste mês.</p>
            ) : (
              jubileus.map(rel => (
                <div
                  key={rel.id}
                  className="p-3.5 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 flex flex-col items-center justify-center">
                      <span className="text-sm font-bold">{rel.dia}</span>
                      <span className="text-xs font-medium">dia</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-[#113240] dark:text-white">{rel.nome}</h3>
                      <p className="text-xs text-[#66777b] dark:text-[#a0aeaf]">
                        {rel.anos ? `${rel.anos} anos de sacerdócio` : 'Ordenação'} · {rel.comunidade || 'Província BRM'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCriarStory(rel.nome, `Jubileu de ${rel.anos || ''} anos de sacerdócio`)}
                    className="px-3 py-1.5 rounded-lg bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
                  >
                    + Criar story
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Visão 2026 Mês a Mês */}
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#113240] dark:text-white">
          2026 Mês a Mês (Planejamento Anual)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {mesesAno.map((m, idx) => (
            <div
              key={m.mes}
              className={`p-3 rounded-xl border text-center transition-colors ${
                idx === 10
                  ? 'bg-[#113240] text-white border-[#113240]'
                  : 'bg-[#f8faf9] dark:bg-[#141a1c] border-[#dce4e2] dark:border-[#354246] text-[#52636a] dark:text-[#edf2f1]'
              }`}
            >
              <span className="text-xs font-semibold block">{m.mes}</span>
              <span className="text-xl font-bold block my-1">{m.count}</span>
              <span className="text-xs text-[#86868b] dark:text-white/60 block truncate">{m.nomes}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
