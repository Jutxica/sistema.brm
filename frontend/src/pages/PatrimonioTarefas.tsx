import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Clock3, Link2, Pencil, Plus, Trash2, UserRound, X } from 'lucide-react';
import { useAuth, hasModuleAccess } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const stages = [
  { value: 'a_fazer', label: 'A fazer' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'aguardando', label: 'Aguardando' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
] as const;

const priorities = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
] as const;

type Task = {
  id: string;
  titulo: string;
  descricao: string;
  status: typeof stages[number]['value'];
  prioridade: typeof priorities[number]['value'];
  prazo: string | null;
  responsavel_auth_user_id: string | null;
  responsavel_externo: string | null;
  nota_progresso: string;
};

type TaskLink = { tarefa_id: string; tipo_ativo: string; ativo_id: string };
type Assignee = { auth_user_id: string; nome: string };
type Asset = { id: string; tipo: string; nome: string };

type Draft = {
  id?: string;
  titulo: string;
  descricao: string;
  status: Task['status'];
  prioridade: Task['prioridade'];
  prazo: string;
  responsavel_auth_user_id: string;
  responsavel_externo: string;
  nota_progresso: string;
  asset: string;
};

const emptyDraft: Draft = {
  titulo: '',
  descricao: '',
  status: 'a_fazer',
  prioridade: 'media',
  prazo: '',
  responsavel_auth_user_id: '',
  responsavel_externo: '',
  nota_progresso: '',
  asset: '',
};

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const formatDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR');

const dueLabel = (date: string | null, status: Task['status']) => {
  if (!date) return 'Sem prazo';
  if (status === 'concluido' || status === 'cancelado') return formatDate(date);
  const remaining = Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${todayKey()}T00:00:00Z`)) / 86_400_000,
  );
  if (remaining < 0) return `Atrasada há ${Math.abs(remaining)} ${Math.abs(remaining) === 1 ? 'dia' : 'dias'}`;
  if (remaining === 0) return 'Vence hoje';
  return `Faltam ${remaining} ${remaining === 1 ? 'dia' : 'dias'}`;
};

const PatrimonioTarefas: React.FC = () => {
  const { user } = useAuth();
  const canManage = hasModuleAccess(user, 'patrimonio');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [links, setLinks] = useState<TaskLink[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: taskData, error: taskError } = await supabase
        .from('patrimonio_tarefas')
        .select('*')
        .order('prazo', { ascending: true, nullsFirst: false });
      if (taskError) throw taskError;
      setTasks((taskData || []) as Task[]);

      if (canManage) {
        const [linkResult, assigneeResult, assetResult] = await Promise.all([
          supabase.from('patrimonio_tarefas_vinculos').select('tarefa_id, tipo_ativo, ativo_id'),
          supabase.rpc('patrimonio_tarefas_responsaveis'),
          supabase.rpc('patrimonio_tarefas_ativos'),
        ]);
        if (linkResult.error) throw linkResult.error;
        if (assigneeResult.error) throw assigneeResult.error;
        if (assetResult.error) throw assetResult.error;
        setLinks((linkResult.data || []) as TaskLink[]);
        setAssignees((assigneeResult.data || []) as Assignee[]);
        setAssets((assetResult.data || []) as Asset[]);
      } else {
        setLinks([]);
        setAssignees([]);
        setAssets([]);
      }
    } catch (cause) {
      console.error('Falha ao carregar o quadro de tarefas:', cause);
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as tarefas.');
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadData]);

  const namesById = useMemo(
    () => new Map(assignees.map(assignee => [assignee.auth_user_id, assignee.nome])),
    [assignees],
  );
  const assetsByKey = useMemo(
    () => new Map(assets.map(asset => [`${asset.tipo}:${asset.id}`, asset.nome])),
    [assets],
  );
  const linksByTask = useMemo(
    () => new Map(links.map(link => [link.tarefa_id, link])),
    [links],
  );

  const openManagerDraft = (task?: Task) => {
    if (!task) {
      setDraft({ ...emptyDraft });
      return;
    }
    const link = linksByTask.get(task.id);
    setDraft({
      id: task.id,
      titulo: task.titulo,
      descricao: task.descricao,
      status: task.status,
      prioridade: task.prioridade,
      prazo: task.prazo || '',
      responsavel_auth_user_id: task.responsavel_auth_user_id || '',
      responsavel_externo: task.responsavel_externo || '',
      nota_progresso: task.nota_progresso || '',
      asset: link ? `${link.tipo_ativo}|${link.ativo_id}` : '',
    });
  };

  const openProgressDraft = (task: Task) => {
    setDraft({
      id: task.id,
      titulo: task.titulo,
      descricao: task.descricao,
      status: task.status,
      prioridade: task.prioridade,
      prazo: task.prazo || '',
      responsavel_auth_user_id: task.responsavel_auth_user_id || '',
      responsavel_externo: '',
      nota_progresso: task.nota_progresso || '',
      asset: '',
    });
  };

  const saveTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError('');
    try {
      if (canManage) {
        const [tipo_ativo, ativo_id] = draft.asset ? draft.asset.split('|') : ['', ''];
        const { error: saveError } = await supabase.rpc('patrimonio_tarefas_salvar', {
          p_tarefa: {
            id: draft.id || null,
            titulo: draft.titulo,
            descricao: draft.descricao,
            status: draft.status,
            prioridade: draft.prioridade,
            prazo: draft.prazo || null,
            responsavel_auth_user_id: draft.responsavel_auth_user_id || null,
            responsavel_externo: draft.responsavel_externo.trim() || null,
            nota_progresso: draft.nota_progresso,
            tipo_ativo: tipo_ativo || null,
            ativo_id: ativo_id || null,
          },
        });
        if (saveError) throw saveError;
      } else {
        if (!draft.id) throw new Error('Tarefa inválida.');
        const { error: updateError } = await supabase.rpc('patrimonio_tarefas_atualizar_progresso', {
          p_tarefa_id: draft.id,
          p_status: draft.status,
          p_nota: draft.nota_progresso,
        });
        if (updateError) throw updateError;
      }
      setDraft(null);
      await loadData();
    } catch (cause) {
      console.error('Falha ao salvar tarefa:', cause);
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a tarefa.');
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (task: Task) => {
    if (!window.confirm(`Excluir a tarefa "${task.titulo}"?`)) return;
    setError('');
    const { error: deleteError } = await supabase.rpc('patrimonio_tarefas_excluir', {
      p_tarefa_id: task.id,
    });
    if (deleteError) {
      console.error('Falha ao excluir tarefa:', deleteError);
      setError(deleteError.message);
      return;
    }
    await loadData();
  };

  const taskColumns = canManage
    ? stages
    : stages.filter(stage => stage.value !== 'cancelado');

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#226380]">Organização do trabalho</p>
          <h1 className="mt-1 text-2xl font-bold text-[#113240] dark:text-white">Agenda de atividades</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {canManage ? 'Acompanhe tarefas, responsáveis e prazos do Patrimônio.' : 'Estas são as tarefas atribuídas a você.'}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => openManagerDraft()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#113240] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#226380]"
          >
            <Plus className="h-4 w-4" /> Nova tarefa
          </button>
        )}
      </header>

      {error && (
        <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-[#161b22]">
          Carregando tarefas...
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-5">
          {taskColumns.map(stage => {
            const stageTasks = tasks.filter(task => task.status === stage.value);
            return (
              <div key={stage.value} className="min-h-64 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-[#10151b]">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-[#113240] dark:text-white">{stage.label}</h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">{stageTasks.length}</span>
                </div>
                <div className="space-y-3">
                  {stageTasks.map(task => {
                    const owner = task.responsavel_auth_user_id
                      ? namesById.get(task.responsavel_auth_user_id) || (task.responsavel_auth_user_id === user?.id ? user.nome : 'Usuário designado')
                      : task.responsavel_externo || 'Sem responsável';
                    const link = canManage ? linksByTask.get(task.id) : undefined;
                    const assetLabel = link ? assetsByKey.get(`${link.tipo_ativo}:${link.ativo_id}`) || 'Bem vinculado' : '';
                    const remaining = task.prazo ? dueLabel(task.prazo, task.status) : '';
                    const overdue = remaining.startsWith('Atrasada');
                    return (
                      <article key={task.id} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-[#161b22]">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100">{task.titulo}</h3>
                          {canManage && (
                            <div className="flex shrink-0 items-center gap-1">
                              <button type="button" title="Editar tarefa" onClick={() => openManagerDraft(task)} className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" title="Excluir tarefa" onClick={() => void deleteTask(task)} className="rounded p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        {task.descricao && <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-500 dark:text-slate-400">{task.descricao}</p>}
                        <div className="mt-3 space-y-2 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <UserRound className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{owner}</span>
                          </div>
                          {task.prazo && (
                            <div className={`flex items-center gap-1.5 ${overdue ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                              <Clock3 className="h-3.5 w-3.5 shrink-0" />
                              <span>{remaining} · {formatDate(task.prazo)}</span>
                            </div>
                          )}
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            task.prioridade === 'urgente' || task.prioridade === 'alta'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}>{priorities.find(priority => priority.value === task.prioridade)?.label}</span>
                          {assetLabel && (
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                              <Link2 className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{assetLabel}</span>
                            </div>
                          )}
                          {task.nota_progresso && <p className="rounded bg-slate-50 p-2 text-slate-600 dark:bg-slate-900 dark:text-slate-300">{task.nota_progresso}</p>}
                        </div>
                        {!canManage && (
                          <button
                            type="button"
                            onClick={() => openProgressDraft(task)}
                            className="mt-3 w-full rounded border border-[#226380]/30 px-2 py-1.5 text-xs font-semibold text-[#226380] hover:bg-[#226380]/5 dark:text-[#A3C3C7]"
                          >
                            Atualizar tarefa
                          </button>
                        )}
                      </article>
                    );
                  })}
                  {stageTasks.length === 0 && <p className="px-1 py-4 text-center text-xs text-slate-400">Nenhuma tarefa</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <form onSubmit={saveTask} className="my-6 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl dark:bg-[#161b22] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#113240] dark:text-white">
                  {canManage ? (draft.id ? 'Editar tarefa' : 'Nova tarefa') : 'Atualizar tarefa'}
                </h2>
                {!canManage && <p className="mt-1 text-xs text-slate-500">Você pode alterar a etapa e deixar uma nota de progresso.</p>}
              </div>
              <button type="button" onClick={() => setDraft(null)} aria-label="Fechar" className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </div>

            {canManage ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Tarefa</span>
                  <input required minLength={3} maxLength={160} value={draft.titulo} onChange={e => setDraft({ ...draft, titulo: e.target.value })} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Descrição</span>
                  <textarea maxLength={5000} rows={4} value={draft.descricao} onChange={e => setDraft({ ...draft, descricao: e.target.value })} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Responsável interno</span>
                  <select value={draft.responsavel_auth_user_id} onChange={e => setDraft({ ...draft, responsavel_auth_user_id: e.target.value, responsavel_externo: '' })} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                    <option value="">Nenhum</option>
                    {assignees.map(assignee => <option key={assignee.auth_user_id} value={assignee.auth_user_id}>{assignee.nome}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Responsável externo</span>
                  <input maxLength={160} value={draft.responsavel_externo} onChange={e => setDraft({ ...draft, responsavel_externo: e.target.value, responsavel_auth_user_id: '' })} placeholder="Nome (sem conta no sistema)" className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Prazo</span>
                  <input type="date" value={draft.prazo} onChange={e => setDraft({ ...draft, prazo: e.target.value })} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Prioridade</span>
                  <select value={draft.prioridade} onChange={e => setDraft({ ...draft, prioridade: e.target.value as Draft['prioridade'] })} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                    {priorities.map(priority => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Etapa</span>
                  <select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as Task['status'] })} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                    {stages.map(stage => <option key={stage.value} value={stage.value}>{stage.label}</option>)}
                  </select>
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Vincular bem, imóvel, veículo ou contrato (opcional)</span>
                  <select value={draft.asset} onChange={e => setDraft({ ...draft, asset: e.target.value })} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                    <option value="">Sem vínculo</option>
                    {assets.map(asset => <option key={`${asset.tipo}:${asset.id}`} value={`${asset.tipo}|${asset.id}`}>{asset.nome} · {asset.tipo}</option>)}
                  </select>
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Nota de progresso</span>
                  <textarea maxLength={2000} rows={2} value={draft.nota_progresso} onChange={e => setDraft({ ...draft, nota_progresso: e.target.value })} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{draft.titulo}</p>
                  {draft.descricao && <p className="mt-1 whitespace-pre-wrap text-slate-600 dark:text-slate-300">{draft.descricao}</p>}
                  {draft.prazo && <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />Prazo: {formatDate(draft.prazo)}</p>}
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Etapa</span>
                  <select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as Task['status'] })} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                    {stages.filter(stage => stage.value !== 'cancelado').map(stage => <option key={stage.value} value={stage.value}>{stage.label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Nota de progresso</span>
                  <textarea maxLength={2000} rows={4} value={draft.nota_progresso} onChange={e => setDraft({ ...draft, nota_progresso: e.target.value })} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                </label>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setDraft(null)} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
              <button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded bg-[#113240] px-4 py-2 text-sm font-semibold text-white hover:bg-[#226380] disabled:opacity-60">
                <Check className="h-4 w-4" />{saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

export default PatrimonioTarefas;
