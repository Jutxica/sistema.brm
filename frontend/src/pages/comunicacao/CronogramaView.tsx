import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, 
  Video, Sparkles, Church, Heart, Gift, Clock, Flame
} from 'lucide-react';
import type { ComunicacaoPost, ComunicacaoCaptacao } from '../../types/comunicacao';

interface AniversarianteItem {
  id: string;
  nome: string;
  dia: number;
  mes: number;
  tipo: 'natalicio' | 'ordenacao' | 'votos';
  anos?: number;
  comunidade?: string;
}

interface CronogramaViewProps {
  posts: ComunicacaoPost[];
  captacoes: ComunicacaoCaptacao[];
  aniversariantes: AniversarianteItem[];
  onAbrirNovoConteudo: (dataIso?: string) => void;
  onAbrirPost: (post: ComunicacaoPost) => void;
}

interface DataEspecial {
  nome: string;
  tipo: 'liturgica' | 'dehoniana' | 'sazonal';
}

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DIAS_SEMANA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

// Datas Litúrgicas, Dehonianas e Cívicas por Mês (1-12) e Dia
const DATAS_LITURGICAS_ANO: Record<number, Record<number, DataEspecial[]>> = {
  1: {
    1: [{ nome: 'Santa Maria Mãe de Deus', tipo: 'liturgica' }],
    6: [{ nome: 'Epifania do Senhor', tipo: 'liturgica' }],
    25: [{ nome: 'Conversão de São Paulo', tipo: 'liturgica' }]
  },
  2: {
    2: [{ nome: 'Apresentação do Senhor', tipo: 'liturgica' }],
    14: [{ nome: 'Santos Cirilo e Metódio', tipo: 'liturgica' }]
  },
  3: {
    14: [{ nome: 'Natalício do Pe. Leão Dehon (1843)', tipo: 'dehoniana' }],
    19: [{ nome: 'São José, Patrono da Igreja', tipo: 'liturgica' }],
    25: [{ nome: 'Anunciação do Senhor', tipo: 'liturgica' }]
  },
  4: {
    1: [{ nome: 'Tempo Pascal', tipo: 'liturgica' }],
    25: [{ nome: 'São Marcos Evangelista', tipo: 'liturgica' }]
  },
  5: {
    1: [{ nome: 'São José Operário', tipo: 'liturgica' }],
    13: [{ nome: 'N. Sra. de Fátima', tipo: 'liturgica' }],
    31: [{ nome: 'Visitação de N. Senhora', tipo: 'liturgica' }]
  },
  6: {
    13: [{ nome: 'Santo Antônio de Pádua', tipo: 'liturgica' }],
    24: [{ nome: 'Natividade de São João Batista', tipo: 'liturgica' }],
    28: [{ nome: 'Solenidade do Sagrado Coração de Jesus (SCJ)', tipo: 'dehoniana' }],
    29: [{ nome: 'Santos Pedro e Paulo', tipo: 'liturgica' }]
  },
  7: {
    3: [{ nome: 'São Tomé Apóstolo', tipo: 'liturgica' }],
    26: [{ nome: 'São Joaquim e Sant’Ana', tipo: 'liturgica' }]
  },
  8: {
    12: [{ nome: 'Páscoa do Pe. Leão Dehon (1925) - Memória SCJ', tipo: 'dehoniana' }],
    15: [{ nome: 'Assunção de Nossa Senhora', tipo: 'liturgica' }],
    28: [{ nome: 'Santo Agostinho', tipo: 'liturgica' }]
  },
  9: {
    1: [{ nome: 'Início do Mês da Bíblia', tipo: 'liturgica' }],
    8: [{ nome: 'Natividade de Nossa Senhora', tipo: 'liturgica' }],
    29: [{ nome: 'Santos Arcanjos Miguel, Gabriel e Rafael', tipo: 'liturgica' }],
    30: [{ nome: 'São Jerônimo', tipo: 'liturgica' }]
  },
  10: {
    1: [{ nome: 'Santa Teresinha do Menino Jesus', tipo: 'liturgica' }],
    4: [{ nome: 'São Francisco de Assis', tipo: 'liturgica' }],
    12: [{ nome: 'Nossa Senhora Aparecida (Padroeira do Brasil)', tipo: 'liturgica' }],
    28: [{ nome: 'São Simão e São Judas Tadeu', tipo: 'liturgica' }]
  },
  11: {
    1: [{ nome: 'Todos os Santos', tipo: 'liturgica' }],
    2: [{ nome: 'Comemoração dos Fiéis Defuntos', tipo: 'liturgica' }],
    4: [{ nome: 'São Carlos Borromeu', tipo: 'liturgica' }],
    10: [{ nome: 'São Leão Magno', tipo: 'liturgica' }],
    11: [{ nome: 'São Martinho de Tours', tipo: 'liturgica' }],
    14: [{ nome: 'Pe. Leão Dehon (Memória Vocacional SCJ)', tipo: 'dehoniana' }],
    15: [{ nome: 'Proclamação da República', tipo: 'sazonal' }, { nome: 'Santo Alberto Magno', tipo: 'liturgica' }],
    20: [{ nome: 'Dia Nacional de Zumbi e Consciência Negra', tipo: 'sazonal' }],
    22: [{ nome: 'Cristo Rei do Universo (Solenidade)', tipo: 'liturgica' }, { nome: 'Santa Cecília', tipo: 'liturgica' }],
    27: [{ nome: 'N. Sra. das Graças', tipo: 'liturgica' }],
    30: [{ nome: 'Santo André Apóstolo', tipo: 'liturgica' }]
  },
  12: {
    8: [{ nome: 'Imaculada Conceição de N. Senhora', tipo: 'liturgica' }],
    12: [{ nome: 'Nossa Senhora de Guadalupe', tipo: 'liturgica' }],
    25: [{ nome: 'Natal do Senhor Nosso Jesus Cristo', tipo: 'liturgica' }],
    31: [{ nome: 'Véspera de Ano Novo / Ação de Graças', tipo: 'sazonal' }]
  }
};

export const CronogramaView: React.FC<CronogramaViewProps> = ({
  posts,
  captacoes,
  aniversariantes,
  onAbrirNovoConteudo,
  onAbrirPost
}) => {
  // Inicializa no mês atual ou Novembro de 2026 de acordo com a data do sistema
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState<number>(hoje.getMonth()); // 0 a 11
  const [anoAtual, setAnoAtual] = useState<number>(hoje.getFullYear());

  const mesAnterior = () => {
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual(prev => prev - 1);
    } else {
      setMesAtual(prev => prev - 1);
    }
  };

  const proximoMes = () => {
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual(prev => prev + 1);
    } else {
      setMesAtual(prev => prev + 1);
    }
  };

  const irParaHoje = () => {
    setMesAtual(hoje.getMonth());
    setAnoAtual(hoje.getFullYear());
  };

  // Cálculos do Calendário Dinâmico
  const totalDiasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay(); // 0 = DOM, 1 = SEG ...
  const diasMesAnteriorTotal = new Date(anoAtual, mesAtual, 0).getDate();

  const mesNum1a12 = mesAtual + 1;
  const mesFormatado = String(mesNum1a12).padStart(2, '0');
  const datasLiturgicasDoMes = DATAS_LITURGICAS_ANO[mesNum1a12] || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header com Navegação Funcional de Mês */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#113240] dark:text-white tracking-tight">
            Cronograma editorial.
          </h1>
          <p className="text-sm text-[#66777b] dark:text-[#a0aeaf] mt-1">
            Planejamento integrado: posts agendados, captações de vídeo, datas litúrgicas e aniversários dos religiosos da Província BRM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-xl p-1">
            <button 
              type="button"
              onClick={mesAnterior}
              className="p-1.5 text-[#66777b] hover:text-[#113240] dark:text-[#a0aeaf] dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-[#141a1c] transition-colors"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs font-bold text-[#113240] dark:text-white min-w-[130px] text-center">
              {NOMES_MESES[mesAtual]} de {anoAtual}
            </span>

            <button 
              type="button"
              onClick={proximoMes}
              className="p-1.5 text-[#66777b] hover:text-[#113240] dark:text-[#a0aeaf] dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-[#141a1c] transition-colors"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={irParaHoje}
            className="px-3 py-2 rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#1c2427] hover:bg-slate-50 dark:hover:bg-[#141a1c] text-[#113240] dark:text-white text-xs font-semibold transition-colors"
          >
            Hoje
          </button>

          <button
            type="button"
            onClick={() => onAbrirNovoConteudo()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova pauta</span>
          </button>
        </div>
      </div>

      {/* Faixa de Campanhas & Destaques do Mês */}
      <div className="p-3.5 rounded-xl bg-[#113240] text-white flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>
            <strong>{NOMES_MESES[mesAtual]} na BRM:</strong>{' '}
            {mesAtual === 10
              ? 'Consciência Negra · Novembro Azul · Memória Vocacional Dehoniana (14/11) · Solenidade de Cristo Rei'
              : mesAtual === 11
                ? 'Tempo do Advento e Natal · Festas de Fim de Ano · Jubileus de Fim de Ano'
                : mesAtual === 2
                  ? 'Quaresma e Fraternidade · Aniversário Natalício do Pe. Leão Dehon (14/03)'
                  : mesAtual === 5
                    ? 'Mês Vocacional Dehoniano e Solenidade do Sagrado Coração de Jesus'
                    : mesAtual === 7
                      ? 'Mês das Vocações · Memória de Páscoa do Pe. Dehon (12/08)'
                      : `Acompanhamento das atividades pastorais e comunitárias de ${NOMES_MESES[mesAtual]}`}
          </span>
        </div>
        <span className="text-xs text-white/70 shrink-0">
          Clique no botão (+) de qualquer dia para agendar pauta
        </span>
      </div>

      {/* Grade Mensal Completa */}
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl overflow-hidden">
        {/* Cabeçalho dos Dias da Semana */}
        <div className="grid grid-cols-7 border-b border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-center text-xs font-bold text-[#66777b] dark:text-[#a0aeaf] py-2.5">
          {DIAS_SEMANA.map(d => (
            <span key={d}>{d}</span>
          ))}
        </div>

        {/* Células dos Dias */}
        <div className="grid grid-cols-7 divide-x divide-y divide-[#dce4e2] dark:divide-[#354246]">
          {/* Dias de preenchimento do mês anterior */}
          {Array.from({ length: primeiroDiaSemana }, (_, i) => {
            const diaPrev = diasMesAnteriorTotal - primeiroDiaSemana + i + 1;
            return (
              <div
                key={`prev-${diaPrev}`}
                className="min-h-[140px] p-2 bg-[#fbfcfc] dark:bg-[#141a1c]/20 opacity-40 select-none"
              >
                <span className="text-xs font-medium text-[#86868b]">
                  {diaPrev}
                </span>
              </div>
            );
          })}

          {/* Dias do mês atual */}
          {Array.from({ length: totalDiasNoMes }, (_, i) => i + 1).map(dia => {
            const diaFormatado = String(dia).padStart(2, '0');
            const dataIso = `${anoAtual}-${mesFormatado}-${diaFormatado}`;
            
            const datasEspeciais = datasLiturgicasDoMes[dia] || [];
            
            // Aniversariantes do dia e mês
            const aniversariantesDoDia = aniversariantes.filter(
              a => a.dia === dia && a.mes === mesNum1a12
            );

            // Posts do dia
            const postsDoDia = posts.filter(p => {
              if (!p.data_cronograma) return false;
              // Aceita YYYY-MM-DD ou ISO com T
              return p.data_cronograma.startsWith(dataIso);
            });

            // Captações do dia
            const captacoesDoDia = captacoes.filter(c => {
              if (!c.data_gravacao) return false;
              return c.data_gravacao.startsWith(dataIso);
            });

            const isHoje = 
              hoje.getDate() === dia && 
              hoje.getMonth() === mesAtual && 
              hoje.getFullYear() === anoAtual;

            return (
              <div
                key={dia}
                className="min-h-[140px] p-2 flex flex-col justify-between hover:bg-[#fafbfb] dark:hover:bg-[#141a1c]/40 transition-colors group relative"
              >
                {/* Linha do Número do Dia + Botão de Nova Pauta */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-bold ${
                      isHoje
                        ? 'w-6 h-6 rounded-full bg-[#226380] text-white flex items-center justify-center font-extrabold'
                        : 'text-[#113240] dark:text-[#edf2f1]'
                    }`}
                  >
                    {dia}
                  </span>

                  <button
                    type="button"
                    onClick={() => onAbrirNovoConteudo(dataIso)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-[#226380] dark:text-[#A3C3C7] transition-opacity"
                    title={`Adicionar pauta para ${diaFormatado}/${mesFormatado}/${anoAtual}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Conteúdo do Dia */}
                <div className="space-y-1 flex-1 overflow-hidden">
                  {/* Datas Litúrgicas & Dehonianas */}
                  {datasEspeciais.slice(0, 2).map((dat, idx) => (
                    <div
                      key={idx}
                      className="text-xs leading-tight font-medium text-[#52636a] dark:text-[#a0aeaf] truncate flex items-center gap-1"
                      title={dat.nome}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          dat.tipo === 'dehoniana'
                            ? 'bg-red-500'
                            : dat.tipo === 'liturgica'
                              ? 'bg-[#226380]'
                              : 'bg-slate-400'
                        }`}
                      />
                      <span className="truncate">{dat.nome}</span>
                    </div>
                  ))}

                  {/* Aniversariantes da Província BRM */}
                  {aniversariantesDoDia.map(aniv => (
                    <div
                      key={aniv.id}
                      className="text-xs px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 font-medium truncate flex items-center gap-1"
                      title={`${aniv.nome} (${
                        aniv.tipo === 'ordenacao'
                          ? `Jubileu de Ordenação (${aniv.anos || ''} anos)`
                          : 'Aniversário Natalício'
                      })`}
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
                      title={`Gravação: ${cap.entrevistado_nome} - ${cap.titulo}`}
                    >
                      <Video className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                      <span className="truncate">{cap.entrevistado_nome}</span>
                    </div>
                  ))}

                  {/* Posts Agendados / Aprovados */}
                  {postsDoDia.map(post => (
                    <div
                      key={post.id}
                      onClick={() => onAbrirPost(post)}
                      className={`text-xs p-1 rounded font-medium truncate cursor-pointer transition-colors ${
                        post.status === 'aprovado' || post.status === 'programado'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
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
