import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, Trash2, Calendar as CalendarIcon, User as UserIcon, 
  Plus, Check, Lightbulb, ListTodo
} from 'lucide-react';
import type { ComunicacaoTarefa } from '../../types/comunicacao';

interface TarefasViewProps {
  tarefas: ComunicacaoTarefa[];
  filtroResponsavel?: string;
  onCriarTarefa: (tarefa: Partial<ComunicacaoTarefa>) => void;
  onToggleTarefa: (id: string, concluida: boolean) => void;
  onDeletarTarefa: (id: string) => void;
}

export const TarefasView: React.FC<TarefasViewProps> = ({
  tarefas,
  filtroResponsavel,
  onCriarTarefa,
  onToggleTarefa,
  onDeletarTarefa
}) => {
  const [novoTexto, setNovoTexto] = useState('');
  const [novaIdeiaTexto, setNovaIdeiaTexto] = useState('');
  const [responsavelSelecionado, setResponsavelSelecionado] = useState(filtroResponsavel || 'Geral');
  const [dataSelecionada, setDataSelecionada] = useState('');

  const membros = ['Geral', 'Talita', 'Kath', 'Pe. Coordenador', 'Designer'];

  const tarefasFiltradas = tarefas.filter(t => {
    if (filtroResponsavel && t.responsavel_nome !== filtroResponsavel) return false;
    return true;
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

  const tituloPagina = filtroResponsavel ? `Checklist de ${filtroResponsavel}` : 'Tarefas e anotações.';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#113240] dark:text-white tracking-tight">
          {tituloPagina}
        </h1>
        <p className="text-sm text-[#66777b] dark:text-[#a0aeaf] mt-1">
          {tarefasParaFazer.length} para fazer · {tarefasFeitas.length} concluídas. Enter adiciona e já abre a próxima linha.
        </p>
      </div>

      {/* Bloco "Para Fazer" */}
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#dce4e2] dark:border-[#354246]">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-[#226380]" />
            <h2 className="text-sm font-semibold text-[#113240] dark:text-white">Para Fazer</h2>
          </div>
          <span className="text-xs text-[#66777b] dark:text-[#a0aeaf] font-medium">
            {tarefasParaFazer.length} ativas
          </span>
        </div>

        {/* Campo de Entrada Rápida estilo Notion */}
        <form onSubmit={handleCriarTarefa} className="flex items-center gap-2">
          <input
            type="text"
            value={novoTexto}
            onChange={e => setNovoTexto(e.target.value)}
            placeholder="Nova tarefa... (pressione Enter para salvar)"
            className="flex-1 px-4 py-2 text-xs sm:text-sm rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#226380]"
          />

          <select
            value={responsavelSelecionado}
            onChange={e => setResponsavelSelecionado(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none"
          >
            {membros.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <input
            type="date"
            value={dataSelecionada}
            onChange={e => setDataSelecionada(e.target.value)}
            className="hidden sm:block px-2.5 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none"
          />

          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {/* Lista de Tarefas Ativas */}
        <div className="space-y-2 pt-2">
          {tarefasParaFazer.length === 0 ? (
            <p className="text-xs text-[#86868b] py-3 text-center">
              Nenhuma tarefa pendente. Tudo feito por aqui!
            </p>
          ) : (
            tarefasParaFazer.map(tarefa => (
              <div
                key={tarefa.id}
                className="group flex items-center justify-between p-3 rounded-xl border border-[#dce4e2] dark:border-[#354246] hover:bg-[#f8faf9] dark:hover:bg-[#141a1c] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleTarefa(tarefa.id, true)}
                    className="text-slate-400 hover:text-emerald-500 transition-colors"
                  >
                    <Circle className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium text-[#113240] dark:text-[#edf2f1]">
                    {tarefa.titulo}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {tarefa.responsavel_nome && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#52636a] dark:text-[#a0aeaf] font-medium">
                      {tarefa.responsavel_nome}
                    </span>
                  )}
                  {tarefa.data_limite && (
                    <span className="text-xs text-[#86868b] flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {new Date(tarefa.data_limite).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeletarTarefa(tarefa.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bloco "Feitos" */}
      {tarefasFeitas.length > 0 && (
        <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#dce4e2] dark:border-[#354246]">
            <Check className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-[#113240] dark:text-white">
              Feitos ({tarefasFeitas.length})
            </h2>
          </div>

          <div className="space-y-2">
            {tarefasFeitas.map(tarefa => (
              <div
                key={tarefa.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c]/40 text-xs text-[#86868b]"
              >
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onToggleTarefa(tarefa.id, false)}
                    className="text-emerald-500 hover:text-slate-400 transition-colors"
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
                    className="text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bloco "Ideias e Anotações" */}
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#dce4e2] dark:border-[#354246]">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-[#113240] dark:text-white">
            Ideias e Anotações Livres
          </h2>
        </div>

        <form onSubmit={handleCriarIdeia} className="flex gap-2">
          <input
            type="text"
            value={novaIdeiaTexto}
            onChange={e => setNovaIdeiaTexto(e.target.value)}
            placeholder="Nova ideia rápida de pauta ou lembrete..."
            className="flex-1 px-4 py-2 text-xs sm:text-sm rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#226380]"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#113240] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
          >
            Anotar
          </button>
        </form>

        <div className="space-y-2">
          {anotacoesIdeias.map(ideia => (
            <div
              key={ideia.id}
              className="flex items-center justify-between p-3 rounded-xl border border-dashed border-[#dce4e2] dark:border-[#354246] text-xs"
            >
              <span className="text-[#113240] dark:text-[#edf2f1]">{ideia.titulo}</span>
              <button
                type="button"
                onClick={() => onDeletarTarefa(ideia.id)}
                className="text-slate-400 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
