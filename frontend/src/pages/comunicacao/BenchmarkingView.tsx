import React, { useState } from 'react';
import { Search, ExternalLink, Lightbulb, Bookmark, Plus, X } from 'lucide-react';
import type { ComunicacaoBenchmarking } from '../../types/comunicacao';

interface BenchmarkingViewProps {
  benchmarks: ComunicacaoBenchmarking[];
  onAdicionarBenchmark: (item: Partial<ComunicacaoBenchmarking>) => void;
}

export const BenchmarkingView: React.FC<BenchmarkingViewProps> = ({
  benchmarks,
  onAdicionarBenchmark
}) => {
  const [modalAberta, setModalAberta] = useState(false);
  const [nome, setNome] = useState('');
  const [handle, setHandle] = useState('');
  const [canal, setCanal] = useState('Instagram');
  const [url, setUrl] = useState('');
  const [pontosFortes, setPontosFortes] = useState('');
  const [ideias, setIdeias] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    onAdicionarBenchmark({
      perfil_nome: nome,
      perfil_handle: handle,
      canal,
      url,
      pontos_fortes: pontosFortes,
      ideias_inspiracao: ideias
    });

    setModalAberta(false);
    setNome('');
    setHandle('');
    setUrl('');
    setPontosFortes('');
    setIdeias('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#113240] dark:text-white tracking-tight">
            Benchmarking e referências.
          </h1>
          <p className="text-sm text-[#66777b] dark:text-[#a0aeaf] mt-1">
            Monitoramento de contas eclesiais e institucionais de referência para inspirar novos formatos na Província BRM.
          </p>
        </div>

        <button
          onClick={() => setModalAberta(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Perfil</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {benchmarks.map(item => (
          <div
            key={item.id}
            className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#113240] dark:text-white">
                    {item.perfil_nome}
                  </h2>
                  {item.perfil_handle && (
                    <span className="text-xs text-[#226380] dark:text-[#A3C3C7] font-medium">
                      {item.perfil_handle}
                    </span>
                  )}
                </div>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-[#dce4e2] dark:border-[#354246] hover:bg-slate-100 dark:hover:bg-white/5 text-[#52636a] dark:text-[#a0aeaf] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              {item.pontos_fortes && (
                <div className="p-3 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] space-y-1">
                  <span className="text-xs font-medium text-[#66777b] dark:text-[#a0aeaf]">
                    O que eles fazem bem
                  </span>
                  <p className="text-xs text-[#113240] dark:text-[#edf2f1] leading-relaxed">
                    {item.pontos_fortes}
                  </p>
                </div>
              )}

              {item.ideias_inspiracao && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-1">
                  <span className="text-xs font-medium flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-amber-500" />
                    Ideia de aplicação na BRM
                  </span>
                  <p className="text-xs leading-relaxed">
                    {item.ideias_inspiracao}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {modalAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
              <h2 className="text-sm font-semibold text-[#113240] dark:text-white">Adicionar Perfil de Referência</h2>
              <button onClick={() => setModalAberta(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Nome da Instituição / Perfil *</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Diocese de Joinville"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Arroba / Handle</label>
                <input
                  type="text"
                  value={handle}
                  onChange={e => setHandle(e.target.value)}
                  placeholder="@diocesejoinville"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Pontos Fortes</label>
                <textarea
                  rows={2}
                  value={pontosFortes}
                  onChange={e => setPontosFortes(e.target.value)}
                  placeholder="Ex: Ótimo uso de fotos dos padres sorrindo e linguagem direta..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Ideia para Província BRM</label>
                <textarea
                  rows={2}
                  value={ideias}
                  onChange={e => setIdeias(e.target.value)}
                  placeholder="Ex: Aplicar no carrossel de formação vocacional de dezembro..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberta(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#226380] text-white"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
