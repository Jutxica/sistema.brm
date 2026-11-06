import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, 
  Video, Sparkles, Church, Heart, Gift
} from 'lucide-react';
import type { ComunicacaoPost, ComunicacaoCaptacao } from '../../types/comunicacao';

interface CronogramaViewProps {
  posts: ComunicacaoPost[];
  captacoes: ComunicacaoCaptacao[];
  aniversariantes: Array<{
    id: string;
    nome: string;
    dia: number;
    mes: number;
    tipo: 'natalicio' | 'ordenacao' | 'votos';
    anos?: number;
    comunidade?: string;
  }>;
  onAbrirNovoConteudo: (dataIso?: string) => void;
  onAbrirPost: (post: ComunicacaoPost) => void;
}

// Datas Comemorativas e Litúrgicas Recorrentes de Novembro (exemplo)
const DATAS_LITURGICAS_NOVEMBRO: Record<number, Array<{ nome: string; tipo: 'liturgica' | 'dehoniana' | 'sazonal' }>> = {
  1: [{ nome: 'Todos os Santos', tipo: 'liturgica' }, { nome: 'Dia Mundial do Veganismo', tipo: 'sazonal' }],
  2: [{ nome: 'Finados', tipo: 'liturgica' }],
  3: [{ nome: 'Instituição do Direito de Voto da Mulher', tipo: 'sazonal' }],
  4: [{ nome: 'São Carlos Borromeu', tipo: 'liturgica' }],
  10: [{ nome: 'São Leão Magno', tipo: 'liturgica' }],
  11: [{ nome: 'São Martinho de Tours', tipo: 'liturgica' }],
  14: [{ nome: 'Pe. Leão Dehon (Memória Vocacional)', tipo: 'dehoniana' }],
  15: [{ nome: 'Proclamação da República', tipo: 'sazonal' }, { nome: 'Santo Alberto Magno', tipo: 'liturgica' }],
  20: [{ nome: 'Dia Nacional de Zumbi e Consciência Negra', tipo: 'sazonal' }],
  22: [{ nome: 'Cristo Rei do Universo (Solenidade)', tipo: 'liturgica' }, { nome: 'Santa Cecília', tipo: 'liturgica' }],
  27: [{ nome: 'N. Sra. das Graças', tipo: 'liturgica' }],
  30: [{ nome: 'Santo André Apóstolo', tipo: 'liturgica' }]
};

export const CronogramaView: React.FC<CronogramaViewProps> = ({
  posts,
  captacoes,
  aniversariantes,
  onAbrirNovoConteudo,
  onAbrirPost
}) => {
  const [mesAtual, setMesAtual] = useState(10); // Novembro (0-indexed = 10)
  const [anoAtual, setAnoAtual] = useState(2026);

  const diasNoMes = 30; // Novembro
  const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header com Navegação de Mês */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#113240] dark:text-white tracking-tight">
            Cronograma.
          </h1>
          <p className="text-sm text-[#66777b] dark:text-[#a0aeaf] mt-1">
            Planejamento editorial unificado. Integrado às datas litúrgicas, santos dehonianos e aniversários natalícios e de ordenação dos religiosos da Província BRM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-1">
            <button 
              onClick={() => {}}
              className="p-1.5 text-[#66777b] hover:text-[#113240] dark:text-[#a0aeaf] dark:hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-[#113240] dark:text-white">
              Novembro de 2026
            </span>
            <button 
              onClick={() => {}}
              className="p-1.5 text-[#66777b] hover:text-[#113240] dark:text-[#a0aeaf] dark:hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => onAbrirNovoConteudo()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Pauta</span>
          </button>
        </div>
      </div>

      {/* Faixa de Campanhas do Mês */}
      <div className="p-3.5 rounded-xl bg-[#113240] text-white flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>
            <strong>Campanhas de Novembro:</strong> Mês da Consciência Negra · Novembro Azul (Saúde do Homem e Cuidados) · Pré-Advento
          </span>
        </div>
        <span className="hidden sm:inline-block text-xs text-white/70">
          Província BRM
        </span>
      </div>

      {/* Grade Mensal */}
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl overflow-hidden">
        {/* Cabeçalho dos Dias da Semana */}
        <div className="grid grid-cols-7 border-b border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-center text-xs font-bold text-[#66777b] dark:text-[#a0aeaf] py-2.5">
          {diasSemana.map(d => (
            <span key={d}>{d}</span>
          ))}
        </div>

        {/* Células dos Dias */}
        <div className="grid grid-cols-7 divide-x divide-y divide-[#dce4e2] dark:divide-[#354246]">
          {Array.from({ length: diasNoMes }, (_, i) => i + 1).map(dia => {
            const datasEspeciais = DATAS_LITURGICAS_NOVEMBRO[dia] || [];
            const aniversariantesDoDia = aniversariantes.filter(a => a.dia === dia);
            const postsDoDia = posts.filter(p => {
              if (!p.data_cronograma) return false;
              const d = new Date(p.data_cronograma);
              return d.getUTCDate() === dia;
            });
            const captacoesDoDia = captacoes.filter(c => {
              const d = new Date(c.data_gravacao);
              return d.getUTCDate() === dia;
            });

            const diaStr = dia < 10 ? `0${dia}` : `${dia}`;
            const dataIso = `2026-11-${diaStr}`;

            return (
              <div
                key={dia}
                className="min-h-[140px] p-2 flex flex-col justify-between hover:bg-[#fafbfb] dark:hover:bg-[#141a1c]/40 transition-colors group relative"
              >
                {/* Linha do Número do Dia + Botão + Pauta */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${
                    dia === 6 
                      ? 'w-6 h-6 rounded-full bg-[#226380] text-white flex items-center justify-center font-extrabold' 
                      : 'text-[#113240] dark:text-[#edf2f1]'
                  }`}>
                    {dia}
                  </span>

                  <button
                    type="button"
                    onClick={() => onAbrirNovoConteudo(dataIso)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-[#226380] dark:text-[#A3C3C7] transition-opacity"
                    title={`Adicionar pauta para o dia ${dia}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Conteúdo do Dia */}
                <div className="space-y-1 flex-1 overflow-hidden">
                  {/* Datas Litúrgicas & Comemorativas */}
                  {datasEspeciais.slice(0, 2).map((dat, idx) => (
                    <div
                      key={idx}
                      className="text-xs leading-tight font-medium text-[#52636a] dark:text-[#a0aeaf] truncate flex items-center gap-1"
                      title={dat.nome}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        dat.tipo === 'dehoniana' 
                          ? 'bg-red-500' 
                          : dat.tipo === 'liturgica' 
                            ? 'bg-[#226380]' 
                            : 'bg-slate-400'
                      }`} />
                      <span className="truncate">{dat.nome}</span>
                    </div>
                  ))}

                  {/* Aniversariantes da Província BRM */}
                  {aniversariantesDoDia.map(aniv => (
                    <div
                      key={aniv.id}
                      className="text-xs px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 font-medium truncate flex items-center gap-1"
                      title={`${aniv.nome} (${aniv.tipo === 'ordenacao' ? `Jubileu de ${aniv.anos} anos` : 'Aniversário Natalício'})`}
                    >
                      <Gift className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{aniv.nome.split(',')[0]}</span>
                    </div>
                  ))}

                  {/* Captações Agendadas */}
                  {captacoesDoDia.map(cap => (
                    <div
                      key={cap.id}
                      className="text-xs px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 font-medium truncate flex items-center gap-1"
                      title={`Gravação: ${cap.entrevistado_nome}`}
                    >
                      <Video className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                      <span className="truncate">Gravação: {cap.entrevistado_nome}</span>
                    </div>
                  ))}

                  {/* Posts Agendados / Aprovados */}
                  {postsDoDia.map(post => (
                    <div
                      key={post.id}
                      onClick={() => onAbrirPost(post)}
                      className={`text-xs p-1 rounded font-medium truncate cursor-pointer transition-colors ${
                        post.status === 'aprovado'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-[#113240] dark:text-white border border-slate-200 dark:border-slate-700'
                      }`}
                      title={post.titulo}
                    >
                      <span className="font-bold mr-1">{post.horario_agendado || '15:00'}</span>
                      <span>{post.titulo}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
