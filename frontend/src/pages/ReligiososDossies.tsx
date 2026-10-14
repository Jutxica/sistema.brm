import React, { useEffect, useMemo, useState } from 'react';
import { Archive, FileText, FolderClosed, FolderOpen, Loader2, Search, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../hooks/useFeedback';

interface DossierFolder {
  id: string;
  nome_civil: string;
  nome_religioso: string | null;
  grau: string | null;
  status_cadastro: string;
  numero_cadastro: number;
  created_at: string;
}

const registrationNumber = (number: number, createdAt: string) =>
  `BRM-${new Date(createdAt).getFullYear()}-${String(number).padStart(6, '0')}`;

const statusStyles: Record<string, string> = {
  Aprovado: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  'Em revisão': 'border-amber-200 bg-amber-50 text-amber-800',
  'Em verificação': 'border-sky-200 bg-sky-50 text-sky-800',
  'Aguardando complementação': 'border-orange-200 bg-orange-50 text-orange-800',
  Recusado: 'border-rose-200 bg-rose-50 text-rose-800',
  Arquivado: 'border-slate-200 bg-slate-100 text-slate-700',
};

export const ReligiososDossies: React.FC = () => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<DossierFolder[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFolders = async () => {
      const { data, error } = await supabase
        .from('religiosos')
        .select('id,nome_civil,nome_religioso,grau,status_cadastro,numero_cadastro,created_at')
        .not('numero_cadastro', 'is', null)
        .order('numero_cadastro', { ascending: true });

      if (error) {
        showToast.error(`Não foi possível carregar as pastas dos dossiês: ${error.message}`);
        setLoading(false);
        return;
      }

      setFolders((data || []) as DossierFolder[]);
      setLoading(false);
    };

    void loadFolders();
  }, []);

  const filteredFolders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalizedQuery) return folders;
    return folders.filter(folder => [
      registrationNumber(folder.numero_cadastro, folder.created_at),
      folder.nome_civil,
      folder.nome_religioso || '',
      folder.grau || '',
      folder.status_cadastro,
    ].some(value => value.toLocaleLowerCase('pt-BR').includes(normalizedQuery)));
  }, [folders, query]);

  return (
    <main className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#226380]">
            <Archive className="h-4 w-4" />
            Arquivo Provincial
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Dossiês pessoais</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Pastas individuais identificadas pelo número de cadastro. Abra uma pasta para consultar as fichas e os documentos enviados.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-[#161b22] dark:text-slate-300">
          <FolderClosed className="h-4 w-4 text-[#226380]" />
          {folders.length} pastas
        </span>
      </header>

      <label className="flex items-center gap-3 border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-[#161b22]">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Buscar por número de cadastro, nome, grau ou situação..."
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
        />
        <span className="whitespace-nowrap text-[11px] text-slate-500">{filteredFolders.length} resultado(s)</span>
      </label>

      {loading ? (
        <div className="flex min-h-56 items-center justify-center border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#161b22]">
          <Loader2 className="h-7 w-7 animate-spin text-[#226380]" />
        </div>
      ) : filteredFolders.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredFolders.map(folder => (
            <button
              key={folder.id}
              type="button"
              onClick={() => navigate(`/religiosos/${folder.id}/dossie`)}
              className="group flex min-h-36 items-start gap-4 border border-slate-200 bg-white p-5 text-left transition hover:border-[#226380]/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#226380] dark:border-slate-800 dark:bg-[#161b22] dark:hover:border-[#A3C3C7]/50"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#226380]/15 bg-[#226380]/5 text-[#226380] dark:border-[#A3C3C7]/20 dark:bg-[#A3C3C7]/10 dark:text-[#A3C3C7]">
                <FolderOpen className="h-6 w-6 transition-transform group-hover:scale-105" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[11px] font-semibold tracking-wide text-[#226380] dark:text-[#A3C3C7]">
                  {registrationNumber(folder.numero_cadastro, folder.created_at)}
                </span>
                <span className="mt-2 block truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {folder.nome_religioso || folder.nome_civil}
                </span>
                <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">
                  {folder.nome_religioso ? folder.nome_civil : folder.grau || 'Grau não informado'}
                  {folder.nome_religioso && folder.grau ? ` · ${folder.grau}` : ''}
                </span>
                <span className={`mt-3 inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-medium ${statusStyles[folder.status_cadastro] || statusStyles.Arquivado}`}>
                  <FileText className="h-3 w-3" />
                  {folder.status_cadastro || 'Situação não informada'}
                </span>
              </span>
              <UserRound className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-[#226380] dark:text-slate-600 dark:group-hover:text-[#A3C3C7]" />
            </button>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-[#161b22]">
          <FolderClosed className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
            {query ? 'Nenhuma pasta corresponde à busca.' : 'Ainda não há dossiês cadastrados.'}
          </p>
          {query && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Revise o nome ou o número de cadastro informado.</p>}
        </div>
      )}
    </main>
  );
};

export default ReligiososDossies;
