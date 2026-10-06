import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, GripVertical, Link2, ListChecks, MessageSquare, Paperclip, Pencil, Plus, Search, Tag, Trash2, UserRound, X } from 'lucide-react';
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

const priorityStyles: Record<TaskPriority, { label: string; card: string; badge: string }> = {
  baixa: {
    label: 'Baixa',
    card: 'border-l-4 border-l-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  media: {
    label: 'Média',
    card: 'border-l-4 border-l-sky-400',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  },
  alta: {
    label: 'Alta',
    card: 'border-l-4 border-l-amber-500',
    badge: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  },
  urgente: {
    label: 'Urgente',
    card: 'border-l-4 border-l-rose-600',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  },
};

type TaskPriority = typeof priorities[number]['value'];

type Task = {
  id: string;
  titulo: string;
  descricao: string;
  status: typeof stages[number]['value'];
  prioridade: typeof priorities[number]['value'];
  data_inicio: string | null;
  prazo: string | null;
  ordem: number;
  responsavel_auth_user_id: string | null;
  responsavel_externo: string | null;
  nota_progresso: string;
};

type TaskLink = { tarefa_id: string; tipo_ativo: string; ativo_id: string };
type Assignee = { auth_user_id: string; nome: string };
type Asset = { id: string; tipo: string; nome: string };
type Label = { id: string; nome: string; cor: string };
type ChecklistItem = { id: string; tarefa_id: string; texto: string; concluido: boolean; ordem: number };
type TaskComment = { id: string; tarefa_id: string; autor_id: string; conteudo: string; criado_em: string };
type TaskAttachment = { id: string; tarefa_id: string; storage_path: string; nome_arquivo: string; tipo_mime: string; tamanho_bytes: number; enviado_por: string };
type TaskActivity = { id: string; tarefa_id: string; ator_id: string | null; evento: string; criada_em: string };

type Draft = {
  id?: string;
  titulo: string;
  descricao: string;
  status: Task['status'];
  prioridade: Task['prioridade'];
  data_inicio: string;
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
  data_inicio: '',
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
  const [labels, setLabels] = useState<Label[]>([]);
  const [taskLabels, setTaskLabels] = useState<{ tarefa_id: string; etiqueta_id: string }[]>([]);
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [activity, setActivity] = useState<TaskActivity[]>([]);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [checklistText, setChecklistText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterLabel, setFilterLabel] = useState('');
  const [calendarMode, setCalendarMode] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [detailSaving, setDetailSaving] = useState(false);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Task['status'] | null>(null);
  const [movingTaskIds, setMovingTaskIds] = useState<Set<string>>(() => new Set());
  const [moveMessage, setMoveMessage] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: taskData, error: taskError } = await supabase
        .from('patrimonio_tarefas')
        .select('*')
        .order('ordem', { ascending: true })
        .order('prazo', { ascending: true, nullsFirst: false });
      if (taskError) throw taskError;
      setTasks((taskData || []) as Task[]);

      const [labelResult, taskLabelResult] = await Promise.all([
        supabase.from('patrimonio_tarefas_etiquetas').select('id, nome, cor').order('nome'),
        supabase.from('patrimonio_tarefas_etiquetas_vinculos').select('tarefa_id, etiqueta_id'),
      ]);
      if (labelResult.error) throw labelResult.error;
      if (taskLabelResult.error) throw taskLabelResult.error;
      setLabels((labelResult.data || []) as Label[]);
      setTaskLabels((taskLabelResult.data || []) as { tarefa_id: string; etiqueta_id: string }[]);

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

  const loadTaskDetails = useCallback(async (task: Task) => {
    setDetailTask(task);
    setError('');
    const [checklistResult, commentResult, attachmentResult, activityResult] = await Promise.all([
      supabase.from('patrimonio_tarefas_checklist').select('id, tarefa_id, texto, concluido, ordem').eq('tarefa_id', task.id).order('ordem').order('criado_em'),
      supabase.from('patrimonio_tarefas_comentarios').select('id, tarefa_id, autor_id, conteudo, criado_em').eq('tarefa_id', task.id).order('criado_em', { ascending: false }),
      supabase.from('patrimonio_tarefas_anexos').select('id, tarefa_id, storage_path, nome_arquivo, tipo_mime, tamanho_bytes, enviado_por').eq('tarefa_id', task.id).order('enviado_em', { ascending: false }),
      supabase.from('patrimonio_tarefas_atividade').select('id, tarefa_id, ator_id, evento, criada_em').eq('tarefa_id', task.id).order('criada_em', { ascending: false }),
    ]);
    const failed = [checklistResult.error, commentResult.error, attachmentResult.error, activityResult.error].find(Boolean);
    if (failed) {
      console.error('Falha ao carregar detalhes da tarefa:', failed);
      setError(failed.message);
      return;
    }
    setChecklists((checklistResult.data || []) as ChecklistItem[]);
    setComments((commentResult.data || []) as TaskComment[]);
    setAttachments((attachmentResult.data || []) as TaskAttachment[]);
    setActivity((activityResult.data || []) as TaskActivity[]);
  }, []);

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
      data_inicio: task.data_inicio || '',
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
      data_inicio: task.data_inicio || '',
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
        const { error: saveError } = await supabase.rpc('patrimonio_tarefas_salvar_workspace', {
          p_tarefa: {
            id: draft.id || null,
            titulo: draft.titulo,
            descricao: draft.descricao,
            status: draft.status,
            prioridade: draft.prioridade,
            data_inicio: draft.data_inicio || null,
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
        const { error: updateError } = await supabase.rpc('patrimonio_tarefas_atualizar_progresso_workspace', {
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

  const moveTask = async (task: Task, nextStatus: Task['status']) => {
    if (task.status === nextStatus || movingTaskIds.has(task.id)) return;
    if (!canManage && (task.responsavel_auth_user_id !== user?.id || nextStatus === 'cancelado')) return;

    const previousStatus = task.status;
    setError('');
    setMoveMessage('');
    setMovingTaskIds(current => new Set(current).add(task.id));
    setTasks(current => current.map(item => item.id === task.id ? { ...item, status: nextStatus } : item));

    try {
      if (canManage) {
        const link = linksByTask.get(task.id);
        const { error: moveError } = await supabase.rpc('patrimonio_tarefas_salvar_workspace', {
          p_tarefa: {
            id: task.id,
            titulo: task.titulo,
            descricao: task.descricao,
            status: nextStatus,
            prioridade: task.prioridade,
            data_inicio: task.data_inicio,
            prazo: task.prazo,
            responsavel_auth_user_id: task.responsavel_auth_user_id,
            responsavel_externo: task.responsavel_externo,
            nota_progresso: task.nota_progresso,
            tipo_ativo: link?.tipo_ativo || null,
            ativo_id: link?.ativo_id || null,
          },
        });
        if (moveError) throw moveError;
      } else {
        const { error: moveError } = await supabase.rpc('patrimonio_tarefas_atualizar_progresso_workspace', {
          p_tarefa_id: task.id,
          p_status: nextStatus,
          p_nota: task.nota_progresso,
        });
        if (moveError) throw moveError;
      }
      setMoveMessage(`Tarefa movida para "${stages.find(stage => stage.value === nextStatus)?.label}".`);
    } catch (cause) {
      console.error('Falha ao mudar etapa da tarefa:', cause);
      setTasks(current => current.map(item => item.id === task.id ? { ...item, status: previousStatus } : item));
      setError(cause instanceof Error ? cause.message : 'Não foi possível mudar a etapa da tarefa.');
    } finally {
      setMovingTaskIds(current => {
        const next = new Set(current);
        next.delete(task.id);
        return next;
      });
      setDraggingTaskId(null);
      setDragOverStage(null);
    }
  };

  const handleTaskDrop = (event: React.DragEvent<HTMLDivElement>, nextStatus: Task['status']) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain') || draggingTaskId;
    const task = tasks.find(item => item.id === taskId);
    setDragOverStage(null);
    if (!task) return;
    if (task.status !== nextStatus) {
      void moveTask(task, nextStatus);
      return;
    }
    if (!canManage || movingTaskIds.has(task.id)) return;
    const previousOrder = task.ordem;
    const nextOrder = Math.max(-1, ...tasks.filter(item => item.status === task.status).map(item => item.ordem)) + 1;
    setTasks(current => current.map(item => item.id === task.id ? { ...item, ordem: nextOrder } : item));
    setMovingTaskIds(current => new Set(current).add(task.id));
    void supabase.rpc('patrimonio_tarefas_reordenar', { p_tarefa_id: task.id }).then(({ error: reorderError }) => {
      if (reorderError) {
        console.error('Falha ao reordenar tarefa:', reorderError);
        setTasks(current => current.map(item => item.id === task.id ? { ...item, ordem: previousOrder } : item));
        setError(reorderError.message);
      } else {
        setMoveMessage('Cartão movido para o final da etapa.');
      }
      setMovingTaskIds(current => {
        const next = new Set(current);
        next.delete(task.id);
        return next;
      });
    });
  };

  const saveChecklistItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detailTask || !checklistText.trim()) return;
    setDetailSaving(true);
    const { error: insertError } = await supabase.from('patrimonio_tarefas_checklist').insert({
      tarefa_id: detailTask.id,
      texto: checklistText.trim(),
      ordem: checklists.length,
    });
    setDetailSaving(false);
    if (insertError) {
      console.error('Falha ao adicionar item à lista:', insertError);
      setError(insertError.message);
      return;
    }
    setChecklistText('');
    await loadTaskDetails(detailTask);
  };

  const toggleChecklistItem = async (item: ChecklistItem) => {
    const { error: updateError } = await supabase
      .from('patrimonio_tarefas_checklist')
      .update({ concluido: !item.concluido })
      .eq('id', item.id);
    if (updateError) {
      console.error('Falha ao atualizar item da lista:', updateError);
      setError(updateError.message);
      return;
    }
    setChecklists(current => current.map(entry => entry.id === item.id ? { ...entry, concluido: !entry.concluido } : entry));
  };

  const deleteChecklistItem = async (item: ChecklistItem) => {
    const { error: deleteError } = await supabase.from('patrimonio_tarefas_checklist').delete().eq('id', item.id);
    if (deleteError) {
      console.error('Falha ao excluir item da lista:', deleteError);
      setError(deleteError.message);
      return;
    }
    setChecklists(current => current.filter(entry => entry.id !== item.id));
  };

  const saveComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detailTask || !commentText.trim()) return;
    setDetailSaving(true);
    const { error: insertError } = await supabase.from('patrimonio_tarefas_comentarios').insert({
      tarefa_id: detailTask.id,
      conteudo: commentText.trim(),
    });
    setDetailSaving(false);
    if (insertError) {
      console.error('Falha ao registrar comentário:', insertError);
      setError(insertError.message);
      return;
    }
    setCommentText('');
    await loadTaskDetails(detailTask);
  };

  const toggleLabel = async (label: Label) => {
    if (!detailTask) return;
    const linked = taskLabels.some(item => item.tarefa_id === detailTask.id && item.etiqueta_id === label.id);
    const result = linked
      ? await supabase.from('patrimonio_tarefas_etiquetas_vinculos').delete().eq('tarefa_id', detailTask.id).eq('etiqueta_id', label.id)
      : await supabase.from('patrimonio_tarefas_etiquetas_vinculos').insert({ tarefa_id: detailTask.id, etiqueta_id: label.id });
    if (result.error) {
      console.error('Falha ao atualizar etiqueta da tarefa:', result.error);
      setError(result.error.message);
      return;
    }
    setTaskLabels(current => linked
      ? current.filter(item => !(item.tarefa_id === detailTask.id && item.etiqueta_id === label.id))
      : [...current, { tarefa_id: detailTask.id, etiqueta_id: label.id }]);
  };

  const createLabel = async () => {
    if (!canManage) return;
    const name = window.prompt('Nome da nova etiqueta (até 40 caracteres):')?.trim();
    if (!name) return;
    const color = window.prompt('Cor hexadecimal (por exemplo, #2563eb):', '#2563eb')?.trim() || '#2563eb';
    const { data, error: insertError } = await supabase
      .from('patrimonio_tarefas_etiquetas')
      .insert({ nome: name, cor: color })
      .select('id, nome, cor')
      .single();
    if (insertError) {
      console.error('Falha ao criar etiqueta:', insertError);
      setError(insertError.message);
      return;
    }
    setLabels(current => [...current, data as Label].sort((a, b) => a.nome.localeCompare(b.nome)));
  };

  const uploadAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !detailTask) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type) || file.size > 15 * 1024 * 1024) {
      setError('Anexe JPG, PNG, WebP, PDF, DOCX ou XLSX de até 15 MB.');
      return;
    }
    setDetailSaving(true);
    const safeName = file.name.normalize('NFKD').replace(/[^\w.-]+/g, '_').slice(-180);
    const path = `${detailTask.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from('patrimonio-tarefas').upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setDetailSaving(false);
      console.error('Falha ao enviar anexo da tarefa:', uploadError);
      setError(uploadError.message);
      return;
    }
    const { error: metadataError } = await supabase.from('patrimonio_tarefas_anexos').insert({
      tarefa_id: detailTask.id,
      storage_path: path,
      nome_arquivo: file.name.slice(0, 255),
      tipo_mime: file.type,
      tamanho_bytes: file.size,
    });
    if (metadataError) {
      const { error: cleanupError } = await supabase.storage.from('patrimonio-tarefas').remove([path]);
      if (cleanupError) console.error('Falha ao remover arquivo sem metadados:', cleanupError);
      setDetailSaving(false);
      console.error('Falha ao registrar anexo da tarefa:', metadataError);
      setError(metadataError.message);
      return;
    }
    setDetailSaving(false);
    await loadTaskDetails(detailTask);
  };

  const openAttachment = async (attachment: TaskAttachment) => {
    const { data, error: urlError } = await supabase.storage.from('patrimonio-tarefas').createSignedUrl(attachment.storage_path, 60);
    if (urlError) {
      console.error('Falha ao abrir anexo da tarefa:', urlError);
      setError(urlError.message);
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const removeAttachment = async (attachment: TaskAttachment) => {
    const { error: deleteError } = await supabase.from('patrimonio_tarefas_anexos').delete().eq('id', attachment.id);
    if (deleteError) {
      console.error('Falha ao excluir anexo da tarefa:', deleteError);
      setError(deleteError.message);
      return;
    }
    const { error: storageError } = await supabase.storage.from('patrimonio-tarefas').remove([attachment.storage_path]);
    if (storageError) {
      console.error('Falha ao excluir arquivo de anexo:', storageError);
      setError(`Metadados removidos, mas o arquivo não foi apagado: ${storageError.message}`);
      return;
    }
    setAttachments(current => current.filter(item => item.id !== attachment.id));
  };

  const filteredTasks = tasks.filter(task => {
    const owner = task.responsavel_auth_user_id ? namesById.get(task.responsavel_auth_user_id) || '' : task.responsavel_externo || '';
    return (!filterStatus || task.status === filterStatus)
      && (!filterPriority || task.prioridade === filterPriority)
      && (!filterLabel || taskLabels.some(item => item.tarefa_id === task.id && item.etiqueta_id === filterLabel))
      && (!filterAssignee || task.responsavel_auth_user_id === filterAssignee || owner.toLocaleLowerCase().includes(filterAssignee.toLocaleLowerCase()))
      && (!searchText || `${task.titulo} ${task.descricao} ${owner}`.toLocaleLowerCase().includes(searchText.toLocaleLowerCase()));
  });

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const dayCount = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: Math.ceil((firstWeekday + dayCount) / 7) * 7 }, (_, index) => {
      const day = index - firstWeekday + 1;
      return day > 0 && day <= dayCount ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
    });
  }, [calendarMonth]);

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
      {moveMessage && (
        <p role="status" className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{moveMessage}</p>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500 dark:text-slate-400" aria-label="Legenda de prioridade">
        <span className="font-semibold text-slate-600 dark:text-slate-300">Prioridade:</span>
        {priorities.map(priority => (
          <span key={priority.value} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${priority.value === 'baixa' ? 'bg-emerald-400' : priority.value === 'media' ? 'bg-sky-400' : priority.value === 'alta' ? 'bg-amber-500' : 'bg-rose-600'}`} />
            {priorityStyles[priority.value].label}
          </span>
        ))}
        <span className="ml-auto hidden sm:inline">Arraste um cartão para outra etapa para atualizar o status.</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#161b22]">
        <label className="relative min-w-44 flex-1">
          <Search aria-hidden="true" className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input aria-label="Buscar tarefas" value={searchText} onChange={event => setSearchText(event.target.value)} placeholder="Buscar tarefas..." className="w-full rounded border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <select aria-label="Filtrar por etapa" value={filterStatus} onChange={event => setFilterStatus(event.target.value)} className="rounded border border-slate-300 bg-white px-2.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option value="">Todas as etapas</option>{stages.map(stage => <option key={stage.value} value={stage.value}>{stage.label}</option>)}
        </select>
        <select aria-label="Filtrar por prioridade" value={filterPriority} onChange={event => setFilterPriority(event.target.value)} className="rounded border border-slate-300 bg-white px-2.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option value="">Todas as prioridades</option>{priorities.map(priority => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
        </select>
        <select aria-label="Filtrar por etiqueta" value={filterLabel} onChange={event => setFilterLabel(event.target.value)} className="max-w-44 rounded border border-slate-300 bg-white px-2.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option value="">Todas as etiquetas</option>{labels.map(label => <option key={label.id} value={label.id}>{label.nome}</option>)}
        </select>
        <select aria-label="Filtrar por responsável" value={filterAssignee} onChange={event => setFilterAssignee(event.target.value)} className="max-w-48 rounded border border-slate-300 bg-white px-2.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option value="">Todos os responsáveis</option>
          {assignees.map(assignee => <option key={assignee.auth_user_id} value={assignee.auth_user_id}>{assignee.nome}</option>)}
          {[...new Set(tasks.map(task => task.responsavel_externo).filter((name): name is string => Boolean(name)))].map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <div className="ml-auto flex rounded border border-slate-300 p-0.5 dark:border-slate-700">
          <button type="button" aria-pressed={!calendarMode} onClick={() => setCalendarMode(false)} className={`rounded px-3 py-1.5 text-xs font-medium ${!calendarMode ? 'bg-[#113240] text-white' : 'text-slate-600 dark:text-slate-300'}`}>Quadro</button>
          <button type="button" aria-pressed={calendarMode} onClick={() => setCalendarMode(true)} className={`rounded px-3 py-1.5 text-xs font-medium ${calendarMode ? 'bg-[#113240] text-white' : 'text-slate-600 dark:text-slate-300'}`}>Calendário</button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-[#161b22]">
          Carregando tarefas...
        </div>
      ) : calendarMode ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#10151b]">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <h2 className="font-semibold capitalize text-[#113240] dark:text-white">{calendarMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
            <div className="flex gap-1">
              <button type="button" aria-label="Mês anterior" onClick={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" aria-label="Próximo mês" onClick={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="border-b border-r border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-500 dark:border-slate-800">{day}</div>)}
            {calendarDays.map((day, index) => {
              const dayTasks = day ? filteredTasks.filter(task => {
                const start = task.data_inicio || task.prazo;
                const end = task.prazo || start;
                return start !== null && day >= start && day <= (end || start);
              }) : [];
              return <div key={`${day || 'empty'}-${index}`} className={`min-h-24 border-b border-r border-slate-200 p-1.5 dark:border-slate-800 sm:min-h-32 ${day ? '' : 'bg-slate-50/70 dark:bg-slate-900/30'}`}>
                {day && <>
                  <span className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${day === todayKey() ? 'bg-[#113240] font-bold text-white' : 'text-slate-500'}`}>{Number(day.slice(-2))}</span>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map(task => <button key={task.id} type="button" title={`${task.titulo} · ${stages.find(stage => stage.value === task.status)?.label}`} onClick={() => void loadTaskDetails(task)} className={`block w-full truncate rounded px-1.5 py-1 text-left text-[10px] font-medium ${priorityStyles[task.prioridade].badge}`}>{task.titulo}</button>)}
                    {dayTasks.length > 3 && <span className="px-1 text-[10px] text-slate-500">+{dayTasks.length - 3} mais</span>}
                  </div>
                </>}
              </div>;
            })}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-5">
          {taskColumns.map(stage => {
            const stageTasks = filteredTasks.filter(task => task.status === stage.value)
              .sort((a, b) => a.ordem - b.ordem || (a.prazo || '9999').localeCompare(b.prazo || '9999'));
            return (
              <div
                key={stage.value}
                onDragOver={event => {
                  if (canManage || draggingTaskId) {
                    event.preventDefault();
                    setDragOverStage(stage.value);
                  }
                }}
                onDragLeave={event => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setDragOverStage(null);
                  }
                }}
                onDrop={event => handleTaskDrop(event, stage.value)}
                className={`min-h-64 rounded-lg border p-3 transition-colors dark:bg-[#10151b] ${
                  dragOverStage === stage.value
                    ? 'border-[#226380] bg-[#226380]/10 ring-2 ring-[#226380]/20'
                    : 'border-slate-200 bg-slate-50/70 dark:border-slate-800'
                }`}
              >
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
                    const canMoveTask = canManage || task.responsavel_auth_user_id === user?.id;
                    const priorityStyle = priorityStyles[task.prioridade] || priorityStyles.media;
                    return (
                      <article
                        key={task.id}
                        draggable={canMoveTask && !movingTaskIds.has(task.id)}
                        onDragStart={event => {
                          if (!canMoveTask) {
                            event.preventDefault();
                            return;
                          }
                          event.dataTransfer.effectAllowed = 'move';
                          event.dataTransfer.setData('text/plain', task.id);
                          setDraggingTaskId(task.id);
                          setMoveMessage('');
                        }}
                        onDragEnd={() => {
                          setDraggingTaskId(null);
                          setDragOverStage(null);
                        }}
                        className={`rounded-md border border-slate-200 bg-white p-3 shadow-sm transition-opacity dark:border-slate-700 dark:bg-[#161b22] ${priorityStyle.card} ${
                          draggingTaskId === task.id ? 'opacity-40' : ''
                        } ${canMoveTask ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-start gap-1.5">
                            {canMoveTask && <GripVertical aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
                            <h3 className="text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100">{task.titulo}</h3>
                          </div>
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
                        <div className="mt-2 flex flex-wrap gap-1">
                          {taskLabels.filter(item => item.tarefa_id === task.id).map(item => labels.find(label => label.id === item.etiqueta_id)).filter((label): label is Label => Boolean(label)).map(label => <span key={label.id} className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: label.cor }}>{label.nome}</span>)}
                        </div>
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
                          {task.data_inicio && <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><CalendarDays className="h-3.5 w-3.5" />Início: {formatDate(task.data_inicio)}</div>}
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${priorityStyle.badge}`}>
                            {task.prioridade === 'urgente' ? '⚠ ' : ''}{priorityStyle.label}
                          </span>
                          {assetLabel && (
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                              <Link2 className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{assetLabel}</span>
                            </div>
                          )}
                          {task.nota_progresso && <p className="rounded bg-slate-50 p-2 text-slate-600 dark:bg-slate-900 dark:text-slate-300">{task.nota_progresso}</p>}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                          <button type="button" onClick={() => void loadTaskDetails(task)} className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-xs font-semibold text-[#226380] hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-slate-800">
                            <ListChecks className="h-3.5 w-3.5" />Detalhes
                          </button>
                          {canMoveTask && <select aria-label={`Alterar etapa: ${task.titulo}`} disabled={movingTaskIds.has(task.id)} value={task.status} onChange={event => void moveTask(task, event.target.value as Task['status'])} className="max-w-36 rounded border border-slate-200 bg-white px-1.5 py-1 text-[10px] dark:border-slate-700 dark:bg-slate-900">
                            {(canManage ? stages : stages.filter(item => item.value !== 'cancelado')).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                          </select>}
                          {!canManage && canMoveTask && <button type="button" onClick={() => openProgressDraft(task)} className="rounded border border-[#226380]/30 px-2 py-1 text-[10px] font-semibold text-[#226380] hover:bg-[#226380]/5 dark:text-[#A3C3C7]">Nota</button>}
                        </div>
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

      {detailTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) setDetailTask(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="task-detail-title" className="my-4 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl dark:bg-[#161b22] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#226380]">Cartão da atividade</p>
                <h2 id="task-detail-title" className="mt-1 text-xl font-bold text-[#113240] dark:text-white">{detailTask.titulo}</h2>
                <p className="mt-1 text-xs text-slate-500">{detailTask.data_inicio ? `Início ${formatDate(detailTask.data_inicio)} · ` : ''}{detailTask.prazo ? `Prazo ${formatDate(detailTask.prazo)}` : 'Sem prazo'} · {priorityStyles[detailTask.prioridade].label}</p>
              </div>
              <button type="button" onClick={() => setDetailTask(null)} aria-label="Fechar detalhes" className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </div>
            {detailTask.descricao && <p className="mb-5 whitespace-pre-wrap rounded bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">{detailTask.descricao}</p>}
            <div className="grid gap-6 lg:grid-cols-2">
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100"><Tag className="h-4 w-4" />Etiquetas</h3>
                  {canManage && <button type="button" onClick={() => void createLabel()} className="text-xs font-semibold text-[#226380] hover:underline">Criar etiqueta</button>}
                </div>
                {labels.length ? <div className="flex flex-wrap gap-2">{labels.map(label => {
                  const selected = taskLabels.some(item => item.tarefa_id === detailTask.id && item.etiqueta_id === label.id);
                  return <button key={label.id} type="button" aria-pressed={selected} onClick={() => void toggleLabel(label)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${selected ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`} style={{ backgroundColor: selected ? label.cor : 'transparent', borderColor: label.cor }}>{label.nome}</button>;
                })}</div> : <p className="text-xs text-slate-500">Nenhuma etiqueta criada. A equipe do Patrimônio pode criar a primeira.</p>}
              </section>
              <section>
                <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100"><ListChecks className="h-4 w-4" />Lista de verificação <span className="text-xs font-normal text-slate-500">{checklists.filter(item => item.concluido).length}/{checklists.length}</span></h3>
                <div className="space-y-2">
                  {checklists.map(item => <div key={item.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={item.concluido} onChange={() => void toggleChecklistItem(item)} aria-label={`Concluir: ${item.texto}`} className="h-4 w-4 accent-[#226380]" />
                    <span className={`min-w-0 flex-1 ${item.concluido ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{item.texto}</span>
                    <button type="button" onClick={() => void deleteChecklistItem(item)} aria-label={`Excluir: ${item.texto}`} className="rounded p-1 text-slate-400 hover:text-rose-600"><X className="h-3.5 w-3.5" /></button>
                  </div>)}
                </div>
                <form onSubmit={saveChecklistItem} className="mt-3 flex gap-2">
                  <input maxLength={240} value={checklistText} onChange={event => setChecklistText(event.target.value)} placeholder="Adicionar item..." className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  <button disabled={detailSaving || !checklistText.trim()} type="submit" className="rounded bg-[#113240] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Adicionar</button>
                </form>
              </section>
              <section>
                <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100"><Paperclip className="h-4 w-4" />Anexos privados</h3>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  <Paperclip className="h-3.5 w-3.5" />{detailSaving ? 'Enviando...' : 'Anexar arquivo (máx. 15 MB)'}
                  <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.xlsx" disabled={detailSaving} onChange={event => void uploadAttachment(event)} className="sr-only" />
                </label>
                <div className="mt-2 space-y-1">
                  {attachments.map(attachment => <div key={attachment.id} className="flex items-center justify-between gap-2 text-xs">
                    <button type="button" onClick={() => void openAttachment(attachment)} className="truncate text-left text-[#226380] hover:underline dark:text-sky-300">{attachment.nome_arquivo} · {(attachment.tamanho_bytes / 1024 / 1024).toFixed(1)} MB</button>
                    {(canManage || attachment.enviado_por === user?.id) && <button type="button" onClick={() => void removeAttachment(attachment)} aria-label={`Excluir ${attachment.nome_arquivo}`} className="rounded p-1 text-rose-500 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button>}
                  </div>)}
                  {!attachments.length && <p className="text-xs text-slate-500">Nenhum arquivo anexado.</p>}
                </div>
              </section>
              <section>
                <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100"><MessageSquare className="h-4 w-4" />Comentários</h3>
                <form onSubmit={saveComment} className="space-y-2">
                  <textarea maxLength={4000} rows={3} value={commentText} onChange={event => setCommentText(event.target.value)} placeholder="Escreva uma atualização para a equipe..." className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  <div className="flex justify-end"><button disabled={detailSaving || !commentText.trim()} type="submit" className="rounded bg-[#113240] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Comentar</button></div>
                </form>
                <div className="mt-3 max-h-44 space-y-3 overflow-y-auto">
                  {comments.map(comment => <article key={comment.id} className="border-l-2 border-slate-200 pl-3 dark:border-slate-700">
                    <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{comment.conteudo}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{namesById.get(comment.autor_id) || (comment.autor_id === user?.id ? user.nome : 'Membro da equipe')} · {new Date(comment.criado_em).toLocaleString('pt-BR')}</p>
                  </article>)}
                  {!comments.length && <p className="text-xs text-slate-500">Ainda não há comentários.</p>}
                </div>
              </section>
            </div>
            <section className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
              <h3 className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-100">Histórico de atividade</h3>
              <div className="space-y-2">
                {activity.map(entry => <p key={entry.id} className="text-xs text-slate-600 dark:text-slate-300">{entry.evento} <span className="text-slate-400">· {entry.ator_id ? namesById.get(entry.ator_id) || (entry.ator_id === user?.id ? user.nome : 'Membro da equipe') : 'Sistema'} · {new Date(entry.criada_em).toLocaleString('pt-BR')}</span></p>)}
                {!activity.length && <p className="text-xs text-slate-500">Nenhuma atividade registrada.</p>}
              </div>
            </section>
          </div>
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
                  <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Data de início</span>
                  <input type="date" value={draft.data_inicio} max={draft.prazo || undefined} onChange={e => setDraft({ ...draft, data_inicio: e.target.value })} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Prazo</span>
                  <input type="date" value={draft.prazo} min={draft.data_inicio || undefined} onChange={e => setDraft({ ...draft, prazo: e.target.value })} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
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
