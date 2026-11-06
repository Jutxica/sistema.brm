import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, Trash2, Calendar as CalendarIcon, User as UserIcon, 
  Plus, Check, Lightbulb, ListTodo, Users, Filter
} from 'lucide-react';
import type { ComunicacaoTarefa, ComunicacaoEmailEquipe } from '../../types/comunicacao';

interface TarefasViewProps {
  tarefas: ComunicacaoTarefa[];
  equipe?: ComunicacaoEmailEquipe[];
  usuarioNome?: string;
  filtroResponsavel?: string;
  onCriarTarefa: (tarefa: Partial<ComunicacaoTarefa>) => void;
  onToggleTarefa: (id: string, concluida: boolean) => void;
  onDeletarTarefa: (id: string) => void;
}

export const TarefasView: React.FC<TarefasViewProps> = ({
  tarefas,
  equipe = [],
  usuarioNome = 'Comunicação BRM',
  filtroResponsavel,
  onCriarTarefa,
  onToggleTarefa,
  onDeletarTarefa
}) => {
  const [novoTexto, setNovoTexto] = useState('');
  const [novaIdeiaTexto, setNovaIdeiaTexto] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<string>(filtroResponsavel || 'todas');
  const [responsavelSelecionado, setResponsavelSelecionado] = useState(
    filtroResponsavel && filtroResponsavel !== 'todas' ? filtroResponsavel : 'Geral'
  );
  const [dataSelecionada, setDataSelecionada] = useState('');

  // Nomes dos membros da equipe dinâmica
  const membrosNomes = Array.from(
    new Set([
      'Geral',
      ...(equipe.length > 0 ? equipe.map(e => e.nome) : ['Comunicação BRM', 'Equipe de Criação', 'Secretaria'])
    ])
  );

  // Filtragem
  const tarefasFiltradas = tarefas.filter(t => {
    if (abaAtiva === 'todas') return true;
    if (abaAtiva === 'minhas') {
      const resp = (t.responsavel_nome || '').toLowerCase();
      const me = usuarioNome.toLowerCase();
      const primeiroNome = me.split(' ')[0];
      return resp.includes(primeiroNome) || resp === me;
    }
    if (abaAtiva === 'sem_responsavel') {
      return !t.responsavel_nome || t.responsavel_nome === 'Geral';
    }
    // Filtro por nome específico do membro
    const resp = (t.responsavel_nome || '').toLowerCase();
    const alvo = abaAtiva.toLowerCase();
    return resp === alvo || resp.includes(alvo.split(' ')[0]);
  });

  const tarefasParaFazer = tarefasFiltradas.filter(t => t.tipo === 'fazer' && !t.concluida);
  const tarefasFeitas = tarefasFiltradas.filter(t => t.tipo === 'fazer' && t.concluida);
  const anotacoesIdeias = tarefasFiltradas.filter(t => t.tipo === 'ideia');

  const handleCriarTarefa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTexto.trim()) return;

    onCriarTarefa({
      titulo: novoTexto.trim(),
      tipo: 'fazer',
      concluida: false,
      responsavel_nome: responsavelSelecionado === 'Geral' ? undefined : responsavelSelecionado,
      data_limite: dataSelecionada || undefined
    });

    setNovoTexto('');
  };

  const handleCriarIdeia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaIdeiaTexto.trim()) return;

    onCriarTarefa({
      titulo: novaIdeiaTexto.trim(),
      tipo: 'ideia',
      concluida: false
    });

    setNovaIdeiaTexto('');
  };

  // Contagem de pendentes por membro para as abas
  const countTarefasPorMembro = (membro: string) => {
    const alvo = membro.toLowerCase();
    return tarefas.filter(t => {
      if (t.concluida || t.tipo !== 'fazer') return false;
      const resp = (t.responsavel_nome || '').toLowerCase();
      return resp === alvo || resp.includes(alvo.split(' ')[0]);
    }).length;
  };

  const countTotalPendentes = tarefas.filter(t => !t.concluida && t.tipo === 'fazer').length;
  const countMinhasPendentes = tarefas.filter(t => {
    if (t.concluida || t.tipo !== 'fazer') return false;
    const resp = (t.responsavel_nome || '').toLowerCase();
    const me = usuarioNome.toLowerCase().split(' ')[0];
    return resp.includes(me);
  }).length;
  const countSemRespPendentes = tarefas.filter(t => !t.concluida && t.tipo === 'fazer' && (!t.responsavel_nome || t.responsavel_nome === 'Geral')).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#113240] dark:text-white tracking-tight">
          Tarefas e responsáveis.
        </h1>
        <p className="text-sm text-[#66777b] dark:text-[#a0aeaf] mt-1">
          {tarefasParaFazer.length} pendentes · {tarefasFeitas.length} concluídas na visualização ativa.
        </p>
      </div>

      {/* Abas Dinâmicas de Responsáveis */}
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-2 flex flex-wrap items-center gap-1.5 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setAbaAtiva('todas')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-colors shrink-0 ${
            abaAtiva === 'todas'
              ? 'bg-[#113240] text-white'
              : 'text-[#52636a] dark:text-[#a0aeaf] hover:bg-[#f8faf9] dark:hover:bg-[#141a1c]'
          }`}
        >
          <span>Todas as tarefas</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            abaAtiva === 'todas' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-[#52636a]'
          }`}>
            {countTotalPendentes}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('minhas')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-colors shrink-0 ${
            abaAtiva === 'minhas'
              ? 'bg-[#226380] text-white'
              : 'text-[#52636a] dark:text-[#a0aeaf] hover:bg-[#f8faf9] dark:hover:bg-[#141a1c]'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Minhas tarefas ({usuarioNome.split(' ')[0]})</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            abaAtiva === 'minhas' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-[#52636a]'
          }`}>
            {countMinhasPendentes}
          </span>
        </button>

        {/* Abas individuais para cada membro da equipe */}
        {equipe.map(membro => {
          const nomeCurto = membro.nome.split(' ')[0];
          const count = countTarefasPorMembro(membro.nome);
          const ativa = abaAtiva.toLowerCase() === membro.nome.toLowerCase() || abaAtiva.toLowerCase() === nomeCurto.toLowerCase();

          return (
            <button
              key={membro.id}
              type="button"
              onClick={() => {
                setAbaAtiva(membro.nome);
                setResponsavelSelecionado(membro.nome);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-colors shrink-0 ${
                ativa
                  ? 'bg-[#113240] text-white'
                  : 'text-[#52636a] dark:text-[#a0aeaf] hover:bg-[#f8faf9] dark:hover:bg-[#141a1c]'
              }`}
            >
              <span>{membro.nome}</span>
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  ativa ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-[#52636a]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setAbaAtiva('sem_responsavel')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-colors shrink-0 ${
            abaAtiva === 'sem_responsavel'
              ? 'bg-[#113240] text-white'
              : 'text-[#52636a] dark:text-[#a0aeaf] hover:bg-[#f8faf9] dark:hover:bg-[#141a1c]'
          }`}
        >
          <span>Sem responsável</span>
          {countSemRespPendentes > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              abaAtiva === 'sem_responsavel' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-[#52636a]'
            }`}>
              {countSemRespPendentes}
            </span>
          )}
        </button>
      </div>

      {/* Bloco "Para fazer" */}
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#dce4e2] dark:border-[#354246]">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-[#226380]" />
            <h2 className="text-sm font-semibold text-[#113240] dark:text-white">
              Para fazer
            </h2>
          </div>
          <span className="text-xs text-[#66777b] dark:text-[#a0aeaf] font-medium">
            {tarefasParaFazer.length} ativas
          </span>
        </div>

        {/* Campo de Entrada Rápida estilo Notion */}
        <form onSubmit={handleCriarTarefa} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={novoTexto}
            onChange={e => setNovoTexto(e.target.value)}
            placeholder="Nova tarefa... (pressione Enter para salvar)"
            className="flex-1 px-4 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#226380]"
          />

          <select
            value={responsavelSelecionado}
            onChange={e => setResponsavelSelecionado(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none"
          >
            {membrosNomes.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <input
            type="date"
            value={dataSelecionada}
            onChange={e => setDataSelecionada(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none"
          />

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </form>

        {/* Lista de Tarefas Ativas */}
        <div className="space-y-2 pt-2">
          {tarefasParaFazer.length === 0 ? (
            <p className="text-xs text-[#86868b] py-4 text-center">
              Nenhuma tarefa pendente neste filtro. Tudo em dia por aqui!
            </p>
          ) : (
            tarefasParaFazer.map(tarefa => {
              const temPrazo = Boolean(tarefa.data_limite);
              const dataObj = temPrazo ? new Date(tarefa.data_limite!) : null;
              const hoje = new Date();
              const atrasada = dataObj && dataObj.getTime() < hoje.setHours(0, 0, 0, 0);

              return (
                <div
                  key={tarefa.id}
                  className="group flex items-center justify-between p-3 rounded-xl border border-[#dce4e2] dark:border-[#354246] hover:bg-[#f8faf9] dark:hover:bg-[#141a1c] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onToggleTarefa(tarefa.id, true)}
                      className="text-slate-400 hover:text-emerald-500 transition-colors p-0.5"
                      title="Concluir tarefa"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium text-[#113240] dark:text-[#edf2f1]">
                      {tarefa.titulo}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {tarefa.responsavel_nome && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#52636a] dark:text-[#a0aeaf] font-medium border border-[#dce4e2] dark:border-[#354246]">
                        {tarefa.responsavel_nome}
                      </span>
                    )}

                    {tarefa.data_limite && (
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                        atrasada
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/40 font-semibold'
                          : 'bg-slate-50 text-[#86868b] border-slate-200 dark:bg-[#141a1c] dark:border-[#354246]'
                      }`}>
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(tarefa.data_limite).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeletarTarefa(tarefa.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity ml-1 rounded"
                      title="Excluir tarefa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bloco "Tarefas concluídas" */}
      {tarefasFeitas.length > 0 && (
        <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#dce4e2] dark:border-[#354246]">
            <Check className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-[#113240] dark:text-white">
              Tarefas concluídas ({tarefasFeitas.length})
            </h2>
          </div>

          <div className="space-y-2">
            {tarefasFeitas.map(tarefa => (
              <div
                key={tarefa.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c]/40 text-xs text-[#86868b] border border-[#dce4e2]/60 dark:border-[#354246]/60"
              >
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onToggleTarefa(tarefa.id, false)}
                    className="text-emerald-500 hover:text-slate-400 transition-colors p-0.5"
                    title="Reabrir tarefa"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <span className="line-through">{tarefa.titulo}</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {tarefa.responsavel_nome && <span>{tarefa.responsavel_nome}</span>}
                  <button
                    type="button"
                    onClick={() => onDeletarTarefa(tarefa.id)}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                    title="Excluir"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bloco "Ideias e anotações rápidas" */}
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#dce4e2] dark:border-[#354246]">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-[#113240] dark:text-white">
            Ideias e anotações rápidas
          </h2>
        </div>

        <form onSubmit={handleCriarIdeia} className="flex gap-2">
          <input
            type="text"
            value={novaIdeiaTexto}
            onChange={e => setNovaIdeiaTexto(e.target.value)}
            placeholder="Nova ideia rápida de pauta ou lembrete para a equipe..."
            className="flex-1 px-4 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#226380]"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#113240] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
          >
            Anotar
          </button>
        </form>

        <div className="space-y-2">
          {anotacoesIdeias.length === 0 ? (
            <p className="text-xs text-[#86868b] py-2 text-center">
              Nenhuma ideia anotada ainda. Use o campo acima para salvar insights rápidos.
            </p>
          ) : (
            anotacoesIdeias.map(ideia => (
              <div
                key={ideia.id}
                className="flex items-center justify-between p-3 rounded-xl border border-dashed border-[#dce4e2] dark:border-[#354246] text-xs bg-[#f8faf9] dark:bg-[#141a1c]/60"
              >
                <span className="text-[#113240] dark:text-[#edf2f1] font-medium">{ideia.titulo}</span>
                <button
                  type="button"
                  onClick={() => onDeletarTarefa(ideia.id)}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                  title="Excluir ideia"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
