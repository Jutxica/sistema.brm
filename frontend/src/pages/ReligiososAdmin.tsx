import React, { useEffect, useMemo, useState } from 'react';
import { Edit, FileText, Loader2, Plus, Search, Trash2, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { confirmAction, showToast } from '../hooks/useFeedback';

interface ReligiosoResumo {
  id: string;
  nome_civil: string;
  nome_religioso: string | null;
  grau: string;
  status: string;
  status_cadastro: string;
  origem_cadastro: string;
  email_institucional: string | null;
  telefone_celular: string | null;
  created_at: string;
}

const statusClass: Record<string, string> = {
  'Em revisão': 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-mono text-[9px] uppercase font-semibold',
  Aprovado: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border border-slate-900 dark:border-white font-mono text-[9px] uppercase font-semibold',
  Arquivado: 'bg-transparent text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 font-mono text-[9px] uppercase',
};

export const ReligiososAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ReligiosoResumo[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('religiosos')
      .select('id,nome_civil,nome_religioso,grau,status,status_cadastro,origem_cadastro,email_institucional,telefone_celular,created_at')
      .order('nome_civil', { ascending: true });
    if (error) console.error('Erro ao carregar religiosos:', error);
    setItems((data || []) as ReligiosoResumo[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase();
    return items.filter(item => [item.nome_civil, item.nome_religioso || '', item.grau, item.email_institucional || ''].join(' ').toLocaleLowerCase().includes(normalized));
  }, [items, query]);

  const remove = async (item: ReligiosoResumo) => {
    const confirmed = await confirmAction({
      title: 'Excluir Cadastro de Religioso',
      badge: 'Cúria Provincial • Exclusão',
      message: `Excluir o cadastro de ${item.nome_civil}?`,
      detail: 'Todos os dados detalhados vinculados e anexos no storage também serão excluídos permanentemente.',
      confirmLabel: 'Excluir Cadastro',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      icon: 'trash'
    });
    if (!confirmed) return;

    const { data: documentos, error: documentosError } = await supabase.from('religiosos_documentos').select('caminho_storage').eq('religioso_id', item.id);
    if (documentosError) {
      showToast.error(`Não foi possível localizar os anexos: ${documentosError.message}`);
      return;
    }
    const caminhos = (documentos || []).map(documento => documento.caminho_storage).filter(Boolean);
    if (caminhos.length) {
      const { error: storageError } = await supabase.storage.from('religiosos-documentos').remove(caminhos);
      if (storageError) {
        showToast.error(`Não foi possível remover os anexos: ${storageError.message}`);
        return;
      }
    }
    const { error } = await supabase.from('religiosos').delete().eq('id', item.id);
    if (error) {
      showToast.error(`Não foi possível excluir: ${error.message}`);
      return;
    }
    showToast.success(`Cadastro de ${item.nome_civil} excluído com sucesso.`);
    load();
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header with Canonical Hierarchy */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 font-cinzel">
            Base Pessoal • Província BRM
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-cinzel mt-1">
            Religiosos
          </h1>
        </div>
        <button
          onClick={() => navigate('/religiosos/novo')}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Novo religioso</span>
        </button>
      </div>

      {/* Search Bar - Crisp & Straight */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-3 flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Pesquisar por nome civil, nome religioso, grau ou e-mail..."
          className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none font-inter"
        />
        <span className="whitespace-nowrap px-2 py-0.5 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-500 font-mono">
          {filtered.length} registro(s)
        </span>
      </div>

      {/* Table Card - Rectangular Frame */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Religioso</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Origem</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Contato</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-[11px] uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-inter">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 shrink-0">
                        <UserRound className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-xs text-slate-900 dark:text-white">
                          {item.nome_religioso || item.nome_civil}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.grau} · {item.nome_civil}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                      {item.origem_cadastro === 'publico' ? 'Site público' : 'Painel Admin'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                    <p className="text-xs text-slate-800 dark:text-slate-200">{item.email_institucional || 'Sem e-mail'}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.telefone_celular || 'Sem telefone'}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium ${statusClass[item.status_cadastro] || statusClass.Arquivado}`}>
                      {item.status_cadastro}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <button
                        title="Editar cadastro completo"
                        onClick={() => navigate(`/religiosos/editar/${item.id}`)}
                        className="border border-slate-200 dark:border-slate-700 p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Excluir religioso"
                        onClick={() => remove(item)}
                        className="border border-slate-200 dark:border-slate-700 p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <div className="flex flex-col items-center gap-2 p-12 text-center text-slate-500 dark:text-slate-400">
            <FileText className="h-8 w-8 text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-medium">Nenhum religioso encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReligiososAdmin;
