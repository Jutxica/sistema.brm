import React, { useEffect, useMemo, useState } from 'react';
import { Edit, FileText, Loader2, Plus, Search, Trash2, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

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
  'Em revisão': 'bg-amber-500/10 text-amber-700',
  Aprovado: 'bg-emerald-500/10 text-emerald-700',
  Arquivado: 'bg-slate-500/10 text-slate-600',
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
    if (!window.confirm(`Excluir o cadastro de ${item.nome_civil}? Todos os dados detalhados vinculados também serão excluídos.`)) return;
    const { data: documentos, error: documentosError } = await supabase.from('religiosos_documentos').select('caminho_storage').eq('religioso_id', item.id);
    if (documentosError) {
      window.alert(`Não foi possível localizar os anexos: ${documentosError.message}`);
      return;
    }
    const caminhos = (documentos || []).map(documento => documento.caminho_storage).filter(Boolean);
    if (caminhos.length) {
      const { error: storageError } = await supabase.storage.from('religiosos-documentos').remove(caminhos);
      if (storageError) {
        window.alert(`Não foi possível remover os anexos: ${storageError.message}`);
        return;
      }
    }
    const { error } = await supabase.from('religiosos').delete().eq('id', item.id);
    if (error) {
      window.alert(`Não foi possível excluir: ${error.message}`);
      return;
    }
    load();
  };

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-secondary" /></div>;

  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">Religiosos</h1>
        <p className="mt-1 text-xs text-slate-500">Cadastros públicos e registros criados pela secretaria em um único painel.</p>
      </div>
      <button onClick={() => navigate('/religiosos/novo')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-white shadow-premium"><Plus className="h-4 w-4" />Novo religioso</button>
    </header>

    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-premium dark:border-slate-800 dark:bg-slate-900/70">
      <Search className="h-4 w-4 text-slate-400" />
      <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Pesquisar por nome, grau ou e-mail" className="w-full bg-transparent text-sm outline-none" />
      <span className="whitespace-nowrap text-xs text-slate-400">{filtered.length} registro(s)</span>
    </div>

    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-premium dark:border-slate-800 dark:bg-slate-900/70">
      <table className="w-full min-w-[760px] text-left text-xs">
        <thead className="border-b border-slate-100 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-900"><tr><th className="p-4">Religioso</th><th className="p-4">Origem</th><th className="p-4">Contato</th><th className="p-4">Cadastro</th><th className="p-4 text-right">Ações</th></tr></thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map(item => <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
            <td className="p-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound className="h-4 w-4" /></span><div><p className="font-bold text-slate-800 dark:text-slate-100">{item.nome_religioso || item.nome_civil}</p><p className="text-[11px] text-slate-400">{item.grau} · {item.nome_civil}</p></div></div></td>
            <td className="p-4"><span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.origem_cadastro === 'publico' ? 'Site público' : 'Painel Admin'}</span></td>
            <td className="p-4 text-slate-500"><p>{item.email_institucional || 'Sem e-mail'}</p><p className="text-[11px] text-slate-400">{item.telefone_celular || 'Sem telefone'}</p></td>
            <td className="p-4"><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${statusClass[item.status_cadastro] || statusClass.Arquivado}`}>{item.status_cadastro}</span></td>
            <td className="p-4"><div className="flex justify-end gap-2"><button title="Abrir cadastro completo" onClick={() => navigate(`/religiosos/editar/${item.id}`)} className="rounded-lg border border-slate-200 p-2 text-primary hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><Edit className="h-4 w-4" /></button><button title="Excluir religioso" onClick={() => remove(item)} className="rounded-lg border border-slate-200 p-2 text-red-500 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-950/20"><Trash2 className="h-4 w-4" /></button></div></td>
          </tr>)}
        </tbody>
      </table>
      {!filtered.length && <div className="flex flex-col items-center gap-2 p-12 text-center text-slate-400"><FileText className="h-8 w-8" /><p className="text-sm">Nenhum religioso encontrado.</p></div>}
    </div>
  </div>;
};

export default ReligiososAdmin;
