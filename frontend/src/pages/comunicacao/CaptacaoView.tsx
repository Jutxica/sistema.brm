import React, { useState } from 'react';
import { 
  Video, Calendar as CalendarIcon, Clock, MapPin, CheckSquare, 
  Square, Plus, CheckCircle2, User, Play, X, ExternalLink
} from 'lucide-react';
import type { ComunicacaoCaptacao } from '../../types/comunicacao';

interface CaptacaoViewProps {
  captacoes: ComunicacaoCaptacao[];
  onCriarCaptacao: (captacao: Partial<ComunicacaoCaptacao>) => void;
  onAtualizarChecklist: (captacaoId: string, itemIdx: number, checado: boolean) => void;
  onMarcarComoGravada: (captacaoId: string) => void;
}

export const CaptacaoView: React.FC<CaptacaoViewProps> = ({
  captacoes,
  onCriarCaptacao,
  onAtualizarChecklist,
  onMarcarComoGravada
}) => {
  const [modalNovaAberta, setModalNovaAberta] = useState(false);
  const [teleprompterRoteiro, setTeleprompterRoteiro] = useState<string | null>(null);

  // Form states
  const [titulo, setTitulo] = useState('');
  const [entrevistadoNome, setEntrevistadoNome] = useState('');
  const [dataGravacao, setDataGravacao] = useState('');
  const [horario, setHorario] = useState('14:00');
  const [local, setLocal] = useState('Cúria Provincial - Sala de Gravações');
  const [roteiro, setRoteiro] = useState('');

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !entrevistadoNome.trim() || !dataGravacao) return;

    onCriarCaptacao({
      titulo,
      entrevistado_nome: entrevistadoNome,
      data_gravacao: `${dataGravacao}T${horario}:00Z`,
      local,
      situacao: 'agendada',
      roteiro
    });

    setModalNovaAberta(false);
    setTitulo('');
    setEntrevistadoNome('');
    setRoteiro('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#113240] dark:text-white tracking-tight">
            Captação.
          </h1>
          <p className="text-sm text-[#66777b] dark:text-[#a0aeaf] mt-1">
            As gravações com os religiosos: quando, onde, o que vai ser gravado e o checklist de equipamento.
          </p>
        </div>

        <button
          onClick={() => setModalNovaAberta(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#113240] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar captação</span>
        </button>
      </div>

      {/* Lista de Próximas Captações */}
      <div className="space-y-4">
        {captacoes.length === 0 ? (
          <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-12 text-center text-xs text-[#86868b]">
            Nenhuma captação agendada. Clique no botão acima para agendar.
          </div>
        ) : (
          captacoes.map(cap => {
            const dataObj = new Date(cap.data_gravacao);
            const checadosCount = cap.checklist_equipamentos.filter(i => i.checado).length;
            const totalEquip = cap.checklist_equipamentos.length;

            return (
              <div
                key={cap.id}
                className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl p-6 flex flex-col md:flex-row md:items-start justify-between gap-6"
              >
                {/* Lado Esquerdo: Dados e Roteiro */}
                <div className="space-y-4 flex-1">
                  <div className="flex items-start gap-4">
                    {/* Badge de Data */}
                    <div className="bg-[#f0f4f3] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-3 text-center min-w-[70px]">
                      <span className="block text-xl font-black text-[#113240] dark:text-white">
                        {dataObj.getUTCDate()}
                      </span>
                      <span className="block text-xs font-semibold text-[#66777b] dark:text-[#a0aeaf]">
                        {dataObj.toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-[#113240] dark:text-white">
                          {cap.entrevistado_nome}
                        </h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          cap.situacao === 'gravada'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {cap.situacao === 'gravada' ? 'Gravada' : 'Agendada'}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-[#226380] dark:text-[#A3C3C7]">
                        {cap.titulo}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#66777b] dark:text-[#a0aeaf] pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({cap.duracao})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {cap.local}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Roteiro & Botão de Teleprompter */}
                  {cap.roteiro && (
                    <div className="p-3.5 rounded-xl bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#66777b] dark:text-[#a0aeaf]">
                          Roteiro e pontos de fala
                        </span>

                        <button
                          type="button"
                          onClick={() => setTeleprompterRoteiro(cap.roteiro || '')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-medium transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Modo Teleprompter</span>
                        </button>
                      </div>
                      <p className="text-xs text-[#113240] dark:text-[#edf2f1] whitespace-pre-line leading-relaxed">
                        {cap.roteiro}
                      </p>
                    </div>
                  )}
                </div>

                {/* Lado Direito: Checklist de Equipamentos */}
                <div className="w-full md:w-72 bg-[#f8faf9] dark:bg-[#141a1c] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-4 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-[#113240] dark:text-white">
                        Checklist de Gravação
                      </span>
                      <span className="text-xs font-semibold text-[#66777b] dark:text-[#a0aeaf]">
                        {checadosCount}/{totalEquip}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-3">
                      <div
                        className="bg-emerald-500 h-full transition-[width] duration-300"
                        style={{ width: `${(checadosCount / (totalEquip || 1)) * 100}%` }}
                      />
                    </div>

                    <div className="space-y-2 text-xs">
                      {cap.checklist_equipamentos.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => onAtualizarChecklist(cap.id, idx, !item.checado)}
                          className="flex items-center gap-2 cursor-pointer text-[#113240] dark:text-[#edf2f1] hover:text-[#226380] select-none"
                        >
                          {item.checado ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className={item.checado ? 'line-through text-[#86868b]' : ''}>
                            {item.item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#dce4e2] dark:border-[#354246]">
                    {cap.situacao !== 'gravada' ? (
                      <button
                        type="button"
                        onClick={() => onMarcarComoGravada(cap.id)}
                        className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Marcar como Gravada</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Gravação Concluída</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Agendamento */}
      {modalNovaAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#dce4e2] dark:border-[#354246]">
              <h2 className="text-base font-bold text-[#113240] dark:text-white">
                Agendar Nova Captação
              </h2>
              <button onClick={() => setModalNovaAberta(false)} className="text-[#86868b] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Título da Gravação *</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex: Mensagem do Provincial para o Mês Vocacional"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Religioso / Entrevistado *</label>
                <input
                  type="text"
                  required
                  value={entrevistadoNome}
                  onChange={e => setEntrevistadoNome(e.target.value)}
                  placeholder="Ex: Pe. Provincial"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={dataGravacao}
                    onChange={e => setDataGravacao(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Horário</label>
                  <input
                    type="time"
                    value={horario}
                    onChange={e => setHorario(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Local</label>
                <input
                  type="text"
                  value={local}
                  onChange={e => setLocal(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Roteiro / Falas-Chave</label>
                <textarea
                  rows={3}
                  value={roteiro}
                  onChange={e => setRoteiro(e.target.value)}
                  placeholder="Pontos de fala, ordem dos assuntos..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovaAberta(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#226380] text-white"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Teleprompter em Tela Cheia */}
      {teleprompterRoteiro && (
        <div className="fixed inset-0 z-50 bg-black text-white p-8 flex flex-col justify-between animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-white/20">
            <span className="text-xs font-medium text-neutral-400">Modo Teleprompter</span>
            <button
              onClick={() => setTeleprompterRoteiro(null)}
              className="px-4 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold"
            >
              Fechar Teleprompter (ESC)
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 text-center overflow-y-auto">
            <p className="text-2xl sm:text-4xl md:text-5xl font-bold leading-relaxed max-w-4xl tracking-tight text-white/95">
              {teleprompterRoteiro}
            </p>
          </div>

          <div className="text-center text-xs text-[#86868b] pt-4">
            Dica: Posicione o tablet ou celular logo abaixo ou ao lado da lente da câmera.
          </div>
        </div>
      )}
    </div>
  );
};
