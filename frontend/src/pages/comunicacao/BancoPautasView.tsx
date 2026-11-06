import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, ArrowRight, FolderOpen, Layers, CheckCircle } from 'lucide-react';
import type { ComunicacaoPauta, AreaPauta, FormatoConteudo } from '../../types/comunicacao';

interface BancoPautasViewProps {
  pautas: ComunicacaoPauta[];
  onCriarPauta: (pauta: Partial<ComunicacaoPauta>) => void;
  onEnviarParaProducao: (pauta: ComunicacaoPauta) => void;
}

export const BancoPautasView: React.FC<BancoPautasViewProps> = ({
  pautas,
  onCriarPauta,
  onEnviarParaProducao
}) => {
  const [novaIdeia, setNovaIdeia] = useState('');
  const [areaSelecionada, setAreaSelecionada] = useState<AreaPauta>('Institucional');
  const [formatoSelecionado, setFormatoSelecionado] = useState<FormatoConteudo>('Carrossel');
  const [secoesAbertas, setSecoesAbertas] = useState<Record<string, boolean>>({
    'Institucional': true,
    'Vocacional': true,
    'Espiritualidade': true,
    'Paróquias': true,
    'Obras Sociais': true,
    'Formação': true
  });

  const areas: AreaPauta[] = [
    'Institucional',
    'Vocacional',
    'Espiritualidade',
    'Paróquias',
    'Formação',
    'Obras Sociais'
  ];

  const handleAdicionarPauta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaIdeia.trim()) return;

    onCriarPauta({
      titulo: novaIdeia,
      area: areaSelecionada,
      formato: formatoSelecionado,
      status: 'ideia',
      prioridade: 'media',
      canais: ['Instagram']
    });

    setNovaIdeia('');
  };

  const toggleSecao = (area: string) => {
    setSecoesAbertas(prev => ({ ...prev, [area]: !prev[area] }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#113240] dark:text-white tracking-tight">
          Banco de pautas.
        </h1>
        <p className="text-sm text-[#66777b] dark:text-[#a0aeaf] mt-1">
          {pautas.length} ideias guardadas, separadas pelas áreas da Província BRM. Quando uma pauta for para produção, ela segue para o quadro de Produção.
        </p>
      </div>

      {/* Barra de Captura Rápida (Estilo Talita / FG) */}
      <form
        onSubmit={handleAdicionarPauta}
        className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
      >
        <div className="md:col-span-6">
          <label className="block text-xs font-medium text-[#66777b] dark:text-[#a0aeaf] mb-1">
            Ideia de pauta
          </label>
          <input
            type="text"
            required
            value={novaIdeia}
            onChange={e => setNovaIdeia(e.target.value)}
            placeholder="Ex.: O que o Pe. Dehon dizia sobre a juventude e discernimento..."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#226380]"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-[#66777b] dark:text-[#a0aeaf] mb-1">
            Área
          </label>
          <select
            value={areaSelecionada}
            onChange={e => setAreaSelecionada(e.target.value as AreaPauta)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#226380]"
          >
            {areas.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-[#66777b] dark:text-[#a0aeaf] mb-1">
            Formato
          </label>
          <select
            value={formatoSelecionado}
            onChange={e => setFormatoSelecionado(e.target.value as FormatoConteudo)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#226380]"
          >
            <option value="Carrossel">Carrossel</option>
            <option value="Reels">Reels</option>
            <option value="Post">Post Único</option>
            <option value="Story">Story</option>
            <option value="Site">Site Oficial</option>
            <option value="Vídeo Longo">Vídeo Longo</option>
          </select>
        </div>

        <div className="md:col-span-2 pt-4 md:pt-0">
          <button
            type="submit"
            className="w-full py-2 px-4 rounded-xl bg-[#113240] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar pauta</span>
          </button>
        </div>
      </form>

      {/* Lista de Áreas / Acordeões */}
      <div className="space-y-4">
        {areas.map(area => {
          const pautasDaArea = pautas.filter(p => p.area === area && p.status === 'ideia');
          const isAberta = secoesAbertas[area] ?? true;

          return (
            <div
              key={area}
              className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl overflow-hidden"
            >
              {/* Barra do Acordeão */}
              <button
                type="button"
                onClick={() => toggleSecao(area)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-[#113240] text-white hover:bg-[#174254] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {isAberta ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span className="text-sm font-semibold tracking-wide">{area}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                    {pautasDaArea.length}
                  </span>
                </div>
              </button>

              {/* Itens da Pauta */}
              {isAberta && (
                <div className="divide-y divide-[#dce4e2] dark:divide-[#354246]">
                  {pautasDaArea.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#86868b]">
                      Nenhuma pauta aguardando nesta área. Use a barra acima para adicionar.
                    </div>
                  ) : (
                    pautasDaArea.map(pauta => (
                      <div
                        key={pauta.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#f8faf9] dark:hover:bg-[#141a1c]/60 transition-colors"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-[#113240] dark:text-[#edf2f1]">
                            {pauta.titulo}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[#66777b] dark:text-[#a0aeaf]">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                              {pauta.formato}
                            </span>
                            <span>•</span>
                            <span>{pauta.data_prevista ? new Date(pauta.data_prevista).toLocaleDateString('pt-BR') : 'sem data'}</span>
                            {pauta.criado_por_nome && (
                              <>
                                <span>•</span>
                                <span>por {pauta.criado_por_nome}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onEnviarParaProducao(pauta)}
                            className="px-3.5 py-1.5 rounded-lg border border-[#226380] text-[#226380] dark:text-[#A3C3C7] hover:bg-[#226380] hover:text-white text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <span>Produzir</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
