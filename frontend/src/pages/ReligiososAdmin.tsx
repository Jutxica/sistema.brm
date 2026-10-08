import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Ban,
  Check,
  Edit,
  FileText,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { confirmAction, showToast } from '../hooks/useFeedback';

interface ReligiosoResumo {
  id: string;
  nome_civil: string;
  nome_religioso: string | null;
  grau: string | null;
  status: string;
  status_cadastro: string;
  origem_cadastro: string;
  email_institucional: string | null;
  telefone_celular: string | null;
  created_at: string;
  auth_user_id: string | null;
}

interface ContaAcesso {
  id: string;
  email: string | null;
  created_at: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  banned_until: string | null;
  linked_religioso_id: string | null;
  linked_religioso_nome: string | null;
  ledger: {
    origin: string | null;
    created_by: string | null;
    created_by_name: string | null;
    created_at: string | null;
    state: string | null;
  } | null;
}

type AccountAction = 'invite' | 'block' | 'unblock' | 'delete';

interface AccountDialog {
  action: AccountAction;
  account?: ContaAcesso;
  name: string;
  email: string;
  reason: string;
}

const statusClass: Record<string, string> = {
  'Em revisão': 'border border-slate-300 bg-slate-100 font-mono text-[9px] font-semibold uppercase text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
  'Em verificação': 'border border-amber-200 bg-amber-100 font-mono text-[9px] font-semibold uppercase text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
  'Aguardando complementação': 'border border-orange-200 bg-orange-100 font-mono text-[9px] font-semibold uppercase text-orange-900 dark:border-orange-700 dark:bg-orange-950/40 dark:text-orange-200',
  Aprovado: 'border border-slate-900 bg-slate-900 font-mono text-[9px] font-semibold uppercase text-white dark:border-white dark:bg-white dark:text-slate-900',
  Recusado: 'border border-rose-200 bg-rose-100 font-mono text-[9px] font-semibold uppercase text-rose-900 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-200',
  Arquivado: 'border border-slate-200 bg-transparent font-mono text-[9px] uppercase text-slate-400 dark:border-slate-800 dark:text-slate-500',
};

const reviewOptions = ['Em revisão', 'Em verificação', 'Aguardando complementação', 'Aprovado', 'Recusado', 'Arquivado'];

export const ReligiososAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ReligiosoResumo[]>([]);
  const [accounts, setAccounts] = useState<ContaAcesso[]>([]);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'fichas' | 'contas'>('fichas');
  const [accountDialog, setAccountDialog] = useState<AccountDialog | null>(null);
  const [accountActionLoading, setAccountActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [religiososResult, accountsResult] = await Promise.all([
      supabase
        .from('religiosos')
        .select('id,nome_civil,nome_religioso,grau,status,status_cadastro,origem_cadastro,email_institucional,telefone_celular,created_at,auth_user_id')
        .order('nome_civil', { ascending: true }),
      supabase.functions.invoke<{ accounts: ContaAcesso[] }>('secretaria-contas', { body: { action: 'list' } }),
    ]);

    if (religiososResult.error) {
      console.error('Erro ao carregar religiosos:', religiososResult.error);
      showToast.error(`Não foi possível carregar a base de religiosos: ${religiososResult.error.message}`);
    }
    setItems((religiososResult.data || []) as ReligiosoResumo[]);

    if (accountsResult.error) {
      console.error('Erro ao carregar contas de acesso:', accountsResult.error);
      setAccountsError(`Não foi possível consultar as contas. Confirme se a migração da Secretaria foi aplicada e se a Edge Function "secretaria-contas" está implantada. ${accountsResult.error.message}`);
      setAccounts([]);
    } else {
      setAccountsError(null);
      setAccounts(accountsResult.data?.accounts || []);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return items.filter(item => [
      item.nome_civil,
      item.nome_religioso || '',
      item.grau || '',
      item.email_institucional || '',
      item.status_cadastro || '',
    ].join(' ').toLocaleLowerCase().includes(normalized));
  }, [items, query]);

  const filteredAccounts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return accounts.filter(account => [
      account.email || '',
      account.linked_religioso_nome || '',
      account.ledger?.origin || '',
      account.ledger?.created_by_name || '',
      accountState(account),
    ].join(' ').toLocaleLowerCase().includes(normalized));
  }, [accounts, query]);

  const isBlocked = (account: ContaAcesso) => Boolean(
    account.banned_until && new Date(account.banned_until).getTime() > Date.now(),
  );

  const accountState = (account: ContaAcesso) => {
    if (isBlocked(account)) return 'Bloqueada';
    if (account.ledger?.state === 'convite_enviado' && !account.email_confirmed_at) return 'Convite pendente';
    return 'Ativa';
  };

  const totals = useMemo(() => ({
    created: accounts.length,
    approved: items.filter(item => item.status_cadastro === 'Aprovado').length,
    inReview: items.filter(item => ['Em revisão', 'Em verificação', 'Aguardando complementação'].includes(item.status_cadastro)).length,
    blocked: accounts.filter(isBlocked).length,
  }), [accounts, items]);

  const refreshAccounts = async () => {
    setAccountsLoading(true);
    const { data, error } = await supabase.functions.invoke<{ accounts: ContaAcesso[] }>('secretaria-contas', { body: { action: 'list' } });
    if (error) {
      console.error('Erro ao atualizar contas de acesso:', error);
      setAccountsError(`Não foi possível consultar as contas. Confirme se a migração da Secretaria foi aplicada e se a Edge Function "secretaria-contas" está implantada. ${error.message}`);
      showToast.error(`Não foi possível atualizar as contas: ${error.message}`);
    } else {
      setAccountsError(null);
      setAccounts(data?.accounts || []);
    }
    setAccountsLoading(false);
  };

  const updateStatus = async (religiosoId: string, status: string) => {
    const reason = status === 'Aprovado'
      ? 'Aprovado pela Secretaria Provincial.'
      : status === 'Recusado'
        ? 'Ficha recusada pela Secretaria Provincial.'
        : status === 'Arquivado'
          ? 'Cadastro arquivado pela Secretaria Provincial.'
          : 'Status atualizado pela Secretaria Provincial.';

    const { error } = await supabase.rpc('secretaria_revisar_ficha', {
      p_religioso_id: religiosoId,
      p_status: status,
      p_observacao: reason,
    });
    if (error) {
      showToast.error(`Não foi possível atualizar o status: ${error.message}`);
      return;
    }
    showToast.success(`Status atualizado para ${status}.`);
    await load();
  };

  const removeReligiousRecord = async (item: ReligiosoResumo) => {
    const confirmed = await confirmAction({
      title: 'Excluir Cadastro de Religioso',
      badge: 'Sede Provincial • Exclusão',
      message: `Excluir o cadastro de ${item.nome_civil}?`,
      detail: 'Todos os dados detalhados vinculados e anexos no storage também serão excluídos permanentemente.',
      confirmLabel: 'Excluir Cadastro',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      icon: 'trash',
    });
    if (!confirmed) return;

    const { data: documentos, error: documentosError } = await supabase
      .from('religiosos_documentos')
      .select('caminho_storage')
      .eq('religioso_id', item.id);
    if (documentosError) {
      showToast.error(`Não foi possível localizar os anexos: ${documentosError.message}`);
      return;
    }
    const paths = (documentos || []).map(documento => documento.caminho_storage).filter(Boolean);
    if (paths.length) {
      const { error: storageError } = await supabase.storage.from('religiosos-documentos').remove(paths);
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
    await load();
  };

  const openAccountDialog = (action: AccountAction, account?: ContaAcesso) => {
    setAccountDialog({ action, account, name: '', email: '', reason: '' });
  };

  const submitAccountAction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accountDialog) return;
    setAccountActionLoading(true);

    const { action, account, email, name, reason } = accountDialog;
    const body = action === 'invite'
      ? { action, email: email.trim(), nome: name.trim() }
      : { action, user_id: account?.id, reason: reason.trim() };
    const { error } = await supabase.functions.invoke('secretaria-contas', { body });
    if (error) {
      console.error(`Falha na ação de conta "${action}":`, error);
      showToast.error(`Não foi possível concluir a operação: ${error.message}`);
      setAccountActionLoading(false);
      return;
    }

    const messages: Record<AccountAction, string> = {
      invite: `Convite enviado para ${email.trim()}.`,
      block: 'Conta bloqueada.',
      unblock: 'Bloqueio removido.',
      delete: 'Conta de acesso excluída. A ficha religiosa e os documentos foram preservados.',
    };
    showToast.success(messages[action]);
    setAccountDialog(null);
    setAccountActionLoading(false);
    await load();
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
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="font-cinzel text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            Base Pessoal • Província BRM
          </span>
          <h1 className="mt-1 font-cinzel text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Religiosos
          </h1>
        </div>
        {activeTab === 'fichas' && (
          <button
            type="button"
            onClick={() => navigate('/religiosos/novo')}
            className="inline-flex items-center gap-2 border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 dark:border-white dark:bg-white dark:text-slate-900"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo religioso
          </button>
        )}
      </header>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800">
        <button type="button" onClick={() => setActiveTab('fichas')} className={`border-b-2 px-3 py-2 text-xs font-semibold ${activeTab === 'fichas' ? 'border-[#113240] text-[#113240] dark:border-white dark:text-white' : 'border-transparent text-slate-500 dark:text-slate-400'}`}>
          Fichas canônicas ({items.length})
        </button>
        <button type="button" onClick={() => { setActiveTab('contas'); void refreshAccounts(); }} className={`border-b-2 px-3 py-2 text-xs font-semibold ${activeTab === 'contas' ? 'border-[#113240] text-[#113240] dark:border-white dark:text-white' : 'border-transparent text-slate-500 dark:text-slate-400'}`}>
          Contas de acesso ({accounts.length})
        </button>
      </div>

      {activeTab === 'fichas' ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Aprovados" value={totals.approved} />
          <Metric label="Em revisão" value={totals.inReview} />
          <Metric label="Contas cadastradas" value={totals.created} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Contas cadastradas" value={totals.created} />
          <Metric label="Contas bloqueadas" value={totals.blocked} />
          <div className="flex items-center justify-between gap-3 border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#161b22]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Gerenciamento</p>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Convide, bloqueie ou remova acessos sem apagar fichas canônicas.</p>
            </div>
            <button type="button" onClick={() => openAccountDialog('invite')} className="inline-flex shrink-0 items-center gap-2 border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-medium text-white dark:border-white dark:bg-white dark:text-slate-900">
              <UserPlus className="h-3.5 w-3.5" />
              Convidar
            </button>
          </div>
        </div>
      )}

      {activeTab === 'contas' && accountsError && (
        <div role="alert" className="border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          {accountsError}
        </div>
      )}

      <div className="flex items-center gap-3 border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#161b22]">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={activeTab === 'contas' ? 'Pesquisar por e-mail, religioso vinculado, origem ou criador...' : 'Pesquisar por nome civil, nome religioso, grau, e-mail ou status...'}
          className="w-full bg-transparent font-inter text-xs text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
        />
        <span className="whitespace-nowrap border border-slate-200 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500 dark:border-slate-700">
          {activeTab === 'contas' ? filteredAccounts.length : filtered.length} registro(s)
        </span>
      </div>

      {activeTab === 'fichas' ? (
        <div className="border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#161b22]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-white/[0.02] dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">Religioso</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">Conta</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">Origem</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-inter dark:divide-slate-800/60">
                {filtered.map(item => {
                  const account = accounts.find(candidate => candidate.id === item.auth_user_id);
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-white/5 dark:text-slate-300"><UserRound className="h-4 w-4" /></span>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{item.nome_religioso || item.nome_civil}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.grau || 'Grau pendente'} · {item.nome_civil}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{account?.email || item.email_institucional || 'Conta sem e-mail'}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{account ? accountState(account) : 'Sem conta vinculada'} · {account?.ledger?.origin || item.origem_cadastro || 'manual'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:text-slate-400">
                          {item.origem_cadastro === 'publico' ? 'Site público' : 'Painel Admin'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-2">
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium ${statusClass[item.status_cadastro] || statusClass.Arquivado}`}>{item.status_cadastro}</span>
                          <select value={item.status_cadastro} onChange={event => void updateStatus(item.id, event.target.value)} className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                            {reviewOptions.map(option => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <IconButton title="Abrir dossiê" onClick={() => navigate(`/religiosos/${item.id}/dossie`)}><Archive className="h-3.5 w-3.5" /></IconButton>
                          <IconButton title="Editar cadastro completo" onClick={() => navigate(`/religiosos/editar/${item.id}`)}><Edit className="h-3.5 w-3.5" /></IconButton>
                          <IconButton title="Excluir ficha canônica" danger onClick={() => void removeReligiousRecord(item)}><Trash2 className="h-3.5 w-3.5" /></IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!filtered.length && <EmptyState icon={<FileText className="h-8 w-8" />} message="Nenhum religioso encontrado." />}
        </div>
      ) : (
        <div className="border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#161b22]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Contas de autenticação</h2>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">A exclusão remove o acesso e preserva a ficha e os documentos.</p>
            </div>
            <button type="button" onClick={() => void refreshAccounts()} disabled={accountsLoading} aria-label="Atualizar contas" className="inline-flex h-9 w-9 items-center justify-center border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <RefreshCw className={`h-4 w-4 ${accountsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-white/[0.02] dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider">Conta / vínculo</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider">Criada por</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider">Origem / data</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider">Acesso</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-inter dark:divide-slate-800/60">
                {filteredAccounts.map(account => {
                  const blocked = isBlocked(account);
                  const pendingInvite = account.ledger?.state === 'convite_enviado' && !account.email_confirmed_at;
                  const createdBy = account.ledger?.created_by_name || (account.ledger?.origin === 'anterior' ? 'Anterior ao registro de auditoria' : 'Não identificado');
                  return (
                    <tr key={account.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-900 dark:text-white">{account.email || 'Conta sem e-mail'}</p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{account.linked_religioso_nome ? `Vinculada a ${account.linked_religioso_nome}` : 'Sem ficha religiosa vinculada'}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">{createdBy}</td>
                      <td className="px-4 py-3.5">
                        <p className="text-slate-700 dark:text-slate-300">{account.ledger?.origin || 'Sem origem registrada'}</p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{account.ledger?.created_at ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(account.ledger.created_at)) : 'Data indisponível'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-semibold uppercase ${blocked ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200' : pendingInvite ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200' : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'}`}>
                          {blocked ? <Ban className="h-3 w-3" /> : pendingInvite ? <KeyRound className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                          {accountState(account)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <IconButton title={blocked ? 'Remover bloqueio' : 'Bloquear acesso'} onClick={() => openAccountDialog(blocked ? 'unblock' : 'block', account)}>
                            {blocked ? <Check className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                          </IconButton>
                          <IconButton title="Excluir conta de acesso" danger onClick={() => openAccountDialog('delete', account)}><Trash2 className="h-3.5 w-3.5" /></IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!filteredAccounts.length && <EmptyState icon={<KeyRound className="h-7 w-7" />} message={accountsLoading ? 'Atualizando contas...' : 'Nenhuma conta encontrada.'} />}
        </div>
      )}

      {accountDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <form onSubmit={event => void submitAccountAction(event)} className="w-full max-w-lg space-y-4 border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-[#161b22]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Gestão de identidade</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {accountDialog.action === 'invite' ? 'Convidar usuário' : accountDialog.action === 'block' ? 'Bloquear conta' : accountDialog.action === 'unblock' ? 'Remover bloqueio' : 'Excluir conta de acesso'}
                </h2>
              </div>
              <button type="button" onClick={() => setAccountDialog(null)} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white" aria-label="Fechar"><X className="h-4 w-4" /></button>
            </div>

            {accountDialog.action === 'invite' ? (
              <>
                <Field label="Nome da pessoa">
                  <input required maxLength={160} value={accountDialog.name} onChange={event => setAccountDialog({ ...accountDialog, name: event.target.value })} className="w-full border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#226380] dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </Field>
                <Field label="E-mail">
                  <input required type="email" maxLength={254} value={accountDialog.email} onChange={event => setAccountDialog({ ...accountDialog, email: event.target.value })} className="w-full border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#226380] dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </Field>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">A pessoa receberá um convite para definir a senha. As permissões de acesso ao sistema continuam sendo geridas em Usuários.</p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {accountDialog.action === 'delete'
                    ? <>A conta <strong>{accountDialog.account?.email}</strong> será removida; a ficha religiosa e os documentos serão preservados.</>
                    : <>{accountDialog.action === 'block' ? 'Bloquear' : 'Desbloquear'} o acesso de <strong>{accountDialog.account?.email}</strong>?</>}
                </p>
                <Field label="Motivo para o histórico">
                  <textarea required maxLength={1000} rows={3} value={accountDialog.reason} onChange={event => setAccountDialog({ ...accountDialog, reason: event.target.value })} className="w-full resize-y border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#226380] dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </Field>
              </>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button type="button" onClick={() => setAccountDialog(null)} disabled={accountActionLoading} className="border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancelar</button>
              <button type="submit" disabled={accountActionLoading} className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 ${accountDialog.action === 'delete' || accountDialog.action === 'block' ? 'bg-rose-700 hover:bg-rose-800' : 'bg-[#113240] hover:bg-[#194b5d]'}`}>
                {accountActionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {accountDialog.action === 'invite' ? 'Enviar convite' : accountDialog.action === 'block' ? 'Bloquear conta' : accountDialog.action === 'unblock' ? 'Remover bloqueio' : 'Excluir conta'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#161b22]">
    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
  </div>
);

const IconButton: React.FC<{
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ title, onClick, danger = false, children }) => (
  <button type="button" title={title} aria-label={title} onClick={onClick} className={`border border-slate-200 p-1.5 transition dark:border-slate-700 ${danger ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`}>
    {children}
  </button>
);

const EmptyState: React.FC<{ icon: React.ReactNode; message: string }> = ({ icon, message }) => (
  <div className="flex flex-col items-center gap-2 p-10 text-center text-slate-500 dark:text-slate-400">
    {icon}
    <p className="text-xs font-medium">{message}</p>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block space-y-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
    {label}
    {children}
  </label>
);

export default ReligiososAdmin;
