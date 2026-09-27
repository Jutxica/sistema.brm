import React, { useEffect, useMemo, useState } from 'react';
import { 
  BarChart3, Users, Award, HeartPulse, Building, Calendar, 
  Printer, RefreshCw, BookOpen, UserCheck, ShieldAlert,
  GraduationCap, ChevronRight, Activity, MapPin, Church
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAnimatedNumber } from '../hooks/useMotion';

const AnimatedStat: React.FC<{ value: number }> = ({ value }) => {
  const animated = useAnimatedNumber(value);
  return <>{animated}</>;
};

interface RawReligioso {
  id: string;
  grau: string;
  nome_civil: string;
  nome_religioso: string | null;
  data_nascimento: string | null;
  comunidade_atual_nome: string | null;
  obra_atual_id: string | null;
  status: string;
  status_cadastro: string;
  estado_nascimento: string | null;
  municipio_nascimento: string | null;
  created_at: string;
}

interface RawOrdem {
  id: string;
  religioso_id: string;
  ministerio: string;
  data: string | null;
}

interface RawVoto {
  id: string;
  religioso_id: string;
  voto_tipo: string;
  data: string | null;
}

interface RawSaude {
  id: string;
  religioso_id: string;
  plano_saude: string | null;
  tipo_sanguineo: string | null;
  medicamentos_continuos: string | null;
}

interface RawFormacao {
  id: string;
  religioso_id: string;
  etapa: string | null;
  instituicao: string | null;
}

// Canonical categorization helper
function categorizeGrau(grauRaw: string, etapaFormacao?: string, comunidadeNome?: string): string {
  const g = (grauRaw || '').trim().toLowerCase();
  const e = (etapaFormacao || '').trim().toLowerCase();
  const c = (comunidadeNome || '').trim().toLowerCase();

  if (g.includes('bispo')) return 'Bispo';
  if (g.includes('padre') || g.includes('presbítero')) return 'Padre';
  if (g.includes('diácono') || g.includes('diacono')) return 'Diácono Transitório';
  if (g.includes('irmão') || g.includes('irmao')) return 'Irmão';

  if (g.includes('tirocinante') || e.includes('tirocínio') || e.includes('tirocinio')) {
    return 'Frater (Tirocinante)';
  }
  if (g.includes('configuração') || g.includes('configuracao') || g.includes('teologia') || e.includes('teologia')) {
    return 'Frater (Configuração)';
  }
  if (g.includes('frater')) {
    if (e.includes('teologia')) {
      return 'Frater (Configuração)';
    }
    return 'Frater (Configuração)';
  }

  return grauRaw || 'Outro';
}

function calculateAge(birthDateStr: string | null): number | null {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 && age < 125 ? age : null;
}

export const EstatisticaBRM: React.FC = () => {
  const [religiosos, setReligiosos] = useState<RawReligioso[]>([]);
  const [ordens, setOrdens] = useState<RawOrdem[]>([]);
  const [votos, setVotos] = useState<RawVoto[]>([]);
  const [saude, setSaude] = useState<RawSaude[]>([]);
  const [formacoes, setFormacoes] = useState<RawFormacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<'Todos' | 'Ativos' | 'Formacao' | 'Missoes' | 'CasaSaoJoao'>('Todos');

  const loadData = async () => {
    setLoading(true);
    try {
      const [religiososRes, ordensRes, votosRes, saudeRes, formacoesRes] = await Promise.all([
        supabase.from('religiosos').select('id, grau, nome_civil, nome_religioso, data_nascimento, comunidade_atual_nome, obra_atual_id, status, status_cadastro, estado_nascimento, municipio_nascimento, created_at'),
        supabase.from('religiosos_ministerios_ordens').select('id, religioso_id, ministerio, data'),
        supabase.from('religiosos_profissoes_votos').select('id, religioso_id, voto_tipo, data'),
        supabase.from('religiosos_saude').select('id, religioso_id, plano_saude, tipo_sanguineo, medicamentos_continuos'),
        supabase.from('religiosos_formacao_religiosa').select('id, religioso_id, etapa, instituicao'),
      ]);

      setReligiosos((religiososRes.data || []) as RawReligioso[]);
      setOrdens((ordensRes.data || []) as RawOrdem[]);
      setVotos((votosRes.data || []) as RawVoto[]);
      setSaude((saudeRes.data || []) as RawSaude[]);
      setFormacoes((formacoesRes.data || []) as RawFormacao[]);
    } catch (err) {
      console.error('Erro ao carregar dados para Estatística BRM:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Formações map by religioso_id
  const formacoesMap = useMemo(() => {
    const map = new Map<string, string>();
    formacoes.forEach(f => {
      if (f.religioso_id && f.etapa) {
        map.set(f.religioso_id, f.etapa);
      }
    });
    return map;
  }, [formacoes]);

  // Enriched list with canonical calculations
  const enrichedList = useMemo(() => {
    return religiosos.map(item => {
      const etapa = formacoesMap.get(item.id);
      const canonicalGrau = categorizeGrau(item.grau, etapa, item.comunidade_atual_nome || undefined);
      const age = calculateAge(item.data_nascimento);
      const isCasaSaoJoao = (item.comunidade_atual_nome || '').toLowerCase().includes('são joão') || 
                            (item.comunidade_atual_nome || '').toLowerCase().includes('sao joao') ||
                            (item.status || '').toLowerCase().includes('são joão') ||
                            (item.status || '').toLowerCase().includes('sao joao') ||
                            item.status === 'Emérito';

      return {
        ...item,
        canonicalGrau,
        age,
        isCasaSaoJoao,
      };
    });
  }, [religiosos, formacoesMap]);

  // Filtered by selected category
  const filteredList = useMemo(() => {
    return enrichedList.filter(item => {
      if (filtroStatus === 'Ativos') {
        return item.status === 'Ativo' && !item.isCasaSaoJoao;
      }
      if (filtroStatus === 'Formacao') {
        return item.canonicalGrau.startsWith('Frater');
      }
      if (filtroStatus === 'Missoes') {
        return (item.status || '').toLowerCase().includes('missão') || (item.status || '').toLowerCase().includes('missoes');
      }
      if (filtroStatus === 'CasaSaoJoao') {
        return item.isCasaSaoJoao;
      }
      return true;
    });
  }, [enrichedList, filtroStatus]);

  // 1. KPI Counts
  const totalGeral = enrichedList.length;
  const totalPadres = enrichedList.filter(r => r.canonicalGrau === 'Padre').length;
  const totalDiaconos = enrichedList.filter(r => r.canonicalGrau === 'Diácono Transitório').length;
  const totalFratresConfig = enrichedList.filter(r => r.canonicalGrau === 'Frater (Configuração)').length;
  const totalFratresTiroc = enrichedList.filter(r => r.canonicalGrau === 'Frater (Tirocinante)').length;
  const totalIrmaos = enrichedList.filter(r => r.canonicalGrau === 'Irmão').length;
  const totalBispos = enrichedList.filter(r => r.canonicalGrau === 'Bispo').length;
  const totalCasaSaoJoao = enrichedList.filter(r => r.isCasaSaoJoao).length;

  // Ages statistics
  const ages = enrichedList.map(r => r.age).filter((a): a is number => a !== null);
  const mediaIdadeGeral = ages.length > 0 ? Math.round(ages.reduce((sum, val) => sum + val, 0) / ages.length) : 0;

  const agesPadres = enrichedList.filter(r => r.canonicalGrau === 'Padre').map(r => r.age).filter((a): a is number => a !== null);
  const mediaIdadePadres = agesPadres.length > 0 ? Math.round(agesPadres.reduce((sum, val) => sum + val, 0) / agesPadres.length) : 0;

  const agesFratres = enrichedList.filter(r => r.canonicalGrau.startsWith('Frater')).map(r => r.age).filter((a): a is number => a !== null);
  const mediaIdadeFratres = agesFratres.length > 0 ? Math.round(agesFratres.reduce((sum, val) => sum + val, 0) / agesFratres.length) : 0;

  const agesIrmaos = enrichedList.filter(r => r.canonicalGrau === 'Irmão').map(r => r.age).filter((a): a is number => a !== null);
  const mediaIdadeIrmaos = agesIrmaos.length > 0 ? Math.round(agesIrmaos.reduce((sum, val) => sum + val, 0) / agesIrmaos.length) : 0;

  // 2. Pirâmide Etária Brackets
  const faixaMenor30 = enrichedList.filter(r => r.age !== null && r.age < 30).length;
  const faixa30a45 = enrichedList.filter(r => r.age !== null && r.age >= 30 && r.age <= 45).length;
  const faixa46a60 = enrichedList.filter(r => r.age !== null && r.age >= 46 && r.age <= 60).length;
  const faixa61a75 = enrichedList.filter(r => r.age !== null && r.age >= 61 && r.age <= 75).length;
  const faixaMaior75 = enrichedList.filter(r => r.age !== null && r.age > 75).length;

  // Índice de Renovação: Formandos (Fratres) vs Confrades > 70 anos
  const totalFormacao = totalFratresConfig + totalFratresTiroc;
  const totalMais70 = enrichedList.filter(r => r.age !== null && r.age >= 70).length;
  const indiceRenovacao = totalMais70 > 0 ? ((totalFormacao / totalMais70) * 100).toFixed(0) : '100';

  // 3. Jubilandos Calculation (25 Prata, 50 Ouro, 60 Diamante)
  const currentYear = new Date().getFullYear();
  const jubileusList = useMemo(() => {
    const list: Array<{
      religiosoId: string;
      nome: string;
      grau: string;
      tipo: 'Presbiteral' | 'Vida Religiosa';
      marco: '25 Anos (Prata)' | '50 Anos (Ouro)' | '60 Anos (Diamante)' | 'Outro';
      anoMarco: number;
      dataExata: string;
    }> = [];

    const religiosoMap = new Map(religiosos.map(r => [r.id, r]));

    // Ordens (Sacerdócio / Presbiterado)
    ordens.forEach(ordem => {
      const isPresb = (ordem.ministerio || '').toLowerCase().includes('presb') || 
                      (ordem.ministerio || '').toLowerCase().includes('padre') ||
                      (ordem.ministerio || '').toLowerCase().includes('sacerd');
      if (isPresb && ordem.data) {
        const year = new Date(ordem.data).getFullYear();
        if (!isNaN(year)) {
          const anos = currentYear - year;
          if (anos === 25 || anos === 50 || anos === 60) {
            const rel = religiosoMap.get(ordem.religioso_id);
            if (rel) {
              list.push({
                religiosoId: rel.id,
                nome: rel.nome_religioso || rel.nome_civil,
                grau: rel.grau,
                tipo: 'Presbiteral',
                marco: anos === 25 ? '25 Anos (Prata)' : anos === 50 ? '50 Anos (Ouro)' : '60 Anos (Diamante)',
                anoMarco: year,
                dataExata: ordem.data,
              });
            }
          }
        }
      }
    });

    // Votos (Vida Religiosa)
    votos.forEach(voto => {
      const isVoto = (voto.voto_tipo || '').toLowerCase().includes('primeir') || 
                     (voto.voto_tipo || '').toLowerCase().includes('perpétuo') ||
                     (voto.voto_tipo || '').toLowerCase().includes('perpetuo');
      if (isVoto && voto.data) {
        const year = new Date(voto.data).getFullYear();
        if (!isNaN(year)) {
          const anos = currentYear - year;
          if (anos === 25 || anos === 50 || anos === 60) {
            const rel = religiosoMap.get(voto.religioso_id);
            if (rel && !list.some(item => item.religiosoId === rel.id && item.tipo === 'Vida Religiosa')) {
              list.push({
                religiosoId: rel.id,
                nome: rel.nome_religioso || rel.nome_civil,
                grau: rel.grau,
                tipo: 'Vida Religiosa',
                marco: anos === 25 ? '25 Anos (Prata)' : anos === 50 ? '50 Anos (Ouro)' : '60 Anos (Diamante)',
                anoMarco: year,
                dataExata: voto.data,
              });
            }
          }
        }
      }
    });

    return list;
  }, [ordens, votos, religiosos, currentYear]);

  // 4. Comunidades aggregation
  const comunidadesCount = useMemo(() => {
    const counts: Record<string, number> = {};
    enrichedList.forEach(r => {
      const com = (r.comunidade_atual_nome || 'Sem Comunidade Alocada').trim();
      counts[com] = (counts[com] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [enrichedList]);

  // 5. Saúde e Assistência
  const saudeStats = useMemo(() => {
    const totalRegistros = saude.length;
    const comPlano = saude.filter(s => s.plano_saude && s.plano_saude.trim().length > 0 && !s.plano_saude.toLowerCase().includes('sus')).length;
    const apenasSus = saude.filter(s => !s.plano_saude || s.plano_saude.toLowerCase().includes('sus')).length;
    const comMedicamentos = saude.filter(s => s.medicamentos_continuos && s.medicamentos_continuos.trim().length > 0).length;

    return {
      totalRegistros,
      comPlano,
      apenasSus,
      comMedicamentos,
      percentPlano: totalRegistros > 0 ? Math.round((comPlano / totalRegistros) * 100) : 0,
    };
  }, [saude]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 print:space-y-6">
      {/* 1. Header Oficial da Secretaria Provincial */}
      <header className="rounded-[6px] card-editorial-masthead bg-white dark:bg-[#161b22] p-6 md:p-8 border border-slate-200 dark:border-slate-800 transition-all shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center shrink-0">
              <img src="/logo-sistema.png" alt="Brasão BRM" className="h-14 w-auto object-contain dark:hidden" />
              <img src="/logo-branco.png" alt="Brasão BRM" className="h-14 w-auto object-contain hidden dark:block" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-cinzel text-xs font-bold tracking-[0.2em] text-[#226380] uppercase">
                  Província BRM
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-xs text-[#707070] dark:text-[#86868b] font-mono uppercase tracking-wider">
                  Secretaria Provincial
                </span>
              </div>
              <h1 className="font-cinzel text-2xl md:text-3xl font-bold tracking-tight text-[#113240] dark:text-white mt-1">
                Estatística BRM
              </h1>
              <p className="text-xs text-[#707070] dark:text-[#86868b] mt-1 font-sans">
                Quadro demográfico e ministerial dos Padres Dehonianos (SCJ) — Província Brasil Meridional.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-[#113240] dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer motion-press"
              title="Recarregar estatísticas da base"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#113240] text-white hover:bg-[#0c242e] text-xs font-semibold transition-all cursor-pointer shadow-sm motion-press"
              title="Exportar documento oficial para Capítulo ou Conselho Provincial"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Relatório</span>
            </button>
          </div>
        </div>

        {/* Filtros de Visualização Oficial */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono uppercase text-[#707070] dark:text-[#86868b] mr-2">Filtrar:</span>
            {[
              { id: 'Todos', label: `Todos (${totalGeral})` },
              { id: 'Ativos', label: `Ativos (${enrichedList.filter(r => r.status === 'Ativo' && !r.isCasaSaoJoao).length})` },
              { id: 'Formacao', label: `Formação (${totalFormacao})` },
              { id: 'CasaSaoJoao', label: `Casa São João (${totalCasaSaoJoao})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFiltroStatus(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-[6px] border transition-all cursor-pointer motion-press ${
                  filtroStatus === tab.id
                    ? 'border-[#113240] bg-[#113240] text-white dark:border-white dark:bg-white dark:text-slate-900'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-[#226380]/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Ano: {currentYear}
          </span>
        </div>
      </header>

      {/* 2. Resumo da Secretaria Provincial: Indicadores Primordiais de Governo (Architectural Ledger Strip) */}
      <section className="rounded-[6px] overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 shadow-sm">
        <div className="p-5 sm:p-6 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 font-sans">
            Total Província
          </span>
          <div className="mt-3">
            <span className="font-serif text-3xl sm:text-4xl font-light text-slate-950 dark:text-white tabular-nums">
              <AnimatedStat value={totalGeral} />
            </span>
            <span className="block text-[11px] text-slate-400 mt-1 font-sans">Religiosos</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 font-sans">
            Média Etária
          </span>
          <div className="mt-3">
            <span className="font-serif text-3xl sm:text-4xl font-light text-slate-950 dark:text-white tabular-nums">
              <AnimatedStat value={mediaIdadeGeral} />
            </span>
            <span className="text-sm font-sans text-slate-400 font-normal ml-1">anos</span>
            <span className="block text-[11px] text-slate-400 mt-1 font-sans">Geral</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 font-sans">
            Padres
          </span>
          <div className="mt-3">
            <span className="font-serif text-3xl sm:text-4xl font-light text-slate-950 dark:text-white tabular-nums">
              <AnimatedStat value={totalPadres} />
            </span>
            <span className="block text-[11px] text-slate-400 mt-1 font-sans">Presbíteros</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 font-sans">
            Diáconos
          </span>
          <div className="mt-3">
            <span className="font-serif text-3xl sm:text-4xl font-light text-slate-950 dark:text-white tabular-nums">
              <AnimatedStat value={totalDiaconos} />
            </span>
            <span className="block text-[11px] text-slate-400 mt-1 font-sans">Transitórios</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 font-sans">
            Fratres Teol.
          </span>
          <div className="mt-3">
            <span className="font-serif text-3xl sm:text-4xl font-light text-slate-950 dark:text-white tabular-nums">
              <AnimatedStat value={totalFratresConfig} />
            </span>
            <span className="block text-[11px] text-slate-400 mt-1 font-sans">Configuração</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 font-sans">
            Tirocinantes
          </span>
          <div className="mt-3">
            <span className="font-serif text-3xl sm:text-4xl font-light text-slate-950 dark:text-white tabular-nums">
              <AnimatedStat value={totalFratresTiroc} />
            </span>
            <span className="block text-[11px] text-slate-400 mt-1 font-sans">Tirocínio</span>
          </div>
        </div>
      </section>

      {/* 3. Seções Principais: Pirâmide Etária & Composição Canônica */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Esquerdo: Pirâmide Etária e Demografia */}
        <div className="lg:col-span-7 rounded-[6px] bg-white dark:bg-[#161b22] p-6 md:p-7 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="font-cinzel text-lg font-bold text-[#113240] dark:text-white">Pirâmide Etária Provincial</h2>
            <div className="text-right font-mono text-xs text-slate-500">
              Taxa de Renovação: <span className="font-bold text-[#113240] dark:text-white">{indiceRenovacao}%</span>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Até 30 anos', count: faixaMenor30, color: 'bg-[#113240]' },
              { label: '31 a 45 anos', count: faixa30a45, color: 'bg-[#226380]' },
              { label: '46 a 60 anos', count: faixa46a60, color: 'bg-[#226380]/80' },
              { label: '61 a 75 anos', count: faixa61a75, color: 'bg-[#A3C3C7]' },
              { label: 'Mais de 75 anos', count: faixaMaior75, color: 'bg-slate-400' },
            ].map(row => {
              const pct = totalGeral > 0 ? Math.round((row.count / totalGeral) * 100) : 0;
              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-sans">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{row.label}</span>
                    <span className="font-mono text-slate-500">
                      <strong className="text-slate-900 dark:text-white">{row.count}</strong> religiosos ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-slate-800 p-0 rounded-[4px] overflow-hidden">
                    <div
                      className={`h-full ${row.color} rounded-[4px] transition-all duration-700`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-sans">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Médias de Idade</span>
            <div className="flex items-center gap-6 font-mono text-slate-700 dark:text-slate-300 text-xs">
              <span>Padres: <strong className="font-serif text-sm font-bold text-[#113240] dark:text-white">{mediaIdadePadres}</strong> anos</span>
              <span>Fratres: <strong className="font-serif text-sm font-bold text-[#113240] dark:text-white">{mediaIdadeFratres}</strong> anos</span>
              <span>Irmãos: <strong className="font-serif text-sm font-bold text-[#113240] dark:text-white">{mediaIdadeIrmaos}</strong> anos</span>
            </div>
          </div>
        </div>

        {/* Painel Direito: Distribuição de Graus e Vocação */}
        <div className="lg:col-span-5 rounded-[6px] bg-white dark:bg-[#161b22] p-6 md:p-7 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="font-cinzel text-lg font-bold text-[#113240] dark:text-white">Composição Canônica</h2>
            <span className="text-xs text-slate-500 font-mono">SCJ Dehonianos</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[
              { label: 'Padres (Presbíteros)', count: totalPadres },
              { label: 'Diáconos Transitórios', count: totalDiaconos },
              { label: 'Fratres (Configuração)', count: totalFratresConfig },
              { label: 'Fratres (Tirocinantes)', count: totalFratresTiroc },
              { label: 'Irmãos', count: totalIrmaos },
              { label: 'Bispos', count: totalBispos },
            ].map(item => {
              const pct = totalGeral > 0 ? Math.round((item.count / totalGeral) * 100) : 0;
              return (
                <div key={item.label} className="py-3 flex items-center justify-between gap-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{item.label}</p>
                  <div className="text-right">
                    <span className="font-serif text-lg font-normal text-slate-950 dark:text-white tabular-nums">{item.count}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Jubileus & Efemérides da Província */}
      <section className="rounded-[6px] bg-white dark:bg-[#161b22] p-6 md:p-7 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="font-cinzel text-lg font-bold text-[#113240] dark:text-white">
            Jubileus em {currentYear} (Prata, Ouro e Diamante)
          </h2>
          <span className="text-xs font-mono text-slate-500">
            {jubileusList.length} jubileu(s) calculado(s)
          </span>
        </div>

        {jubileusList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jubileusList.map((jubileu, idx) => (
              <div key={`${jubileu.religiosoId}-${idx}`} className="rounded-[6px] p-5 border-l-4 border-l-[#226380] border-t border-r border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#113240] dark:text-white">
                    {jubileu.marco}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{jubileu.tipo}</span>
                </div>
                <h3 className="font-serif text-sm font-bold text-slate-900 dark:text-white truncate">
                  {jubileu.nome}
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  {jubileu.grau} · Data celebrativa: <span className="font-mono text-slate-700 dark:text-slate-300">{new Date(jubileu.dataExata).toLocaleDateString('pt-BR')}</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 px-4 text-center border-t border-b border-slate-100 dark:border-slate-800/80">
            <p className="font-serif text-sm text-slate-700 dark:text-slate-300">
              Nenhum jubilando de 25, 50 ou 60 anos identificado nos registros para o ano de {currentYear}.
            </p>
          </div>
        )}
      </section>

      {/* 5. Seção Integrada: Comunidades & Saúde */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alocação por Casas Religiosas & Comunidades */}
        <div className="lg:col-span-7 rounded-[6px] bg-white dark:bg-[#161b22] p-6 md:p-7 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="font-cinzel text-lg font-bold text-[#113240] dark:text-white">Alocação por Comunidade</h2>
            <span className="text-xs font-mono text-slate-500">{comunidadesCount.length} locais</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto pr-1">
            {comunidadesCount.length > 0 ? (
              comunidadesCount.map(([comunidade, count]) => {
                const isCasaSaoJoao = comunidade.toLowerCase().includes('são joão') || comunidade.toLowerCase().includes('sao joao');
                return (
                  <div key={comunidade} className="py-3 flex items-center justify-between text-xs transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                    <div className="flex items-center gap-2.5 min-w-0 pr-4">
                      <MapPin className="w-3.5 h-3.5 text-[#226380] shrink-0" />
                      <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                        {comunidade}
                      </span>
                      {isCasaSaoJoao && (
                        <span className="shrink-0 px-2 py-0.5 text-[9px] font-mono rounded-[4px] border border-[#F2C894] bg-[#F2C894]/20 text-[#113240]">
                          Repouso
                        </span>
                      )}
                    </div>
                    <span className="font-serif text-sm font-bold text-slate-900 dark:text-white shrink-0 tabular-nums">
                      {count} {count === 1 ? 'confrade' : 'confrades'}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-sans">
                Nenhuma alocação comunitária registrada até o momento.
              </div>
            )}
          </div>
        </div>

        {/* Observatório de Saúde & Assistência */}
        <div className="lg:col-span-5 rounded-[6px] bg-white dark:bg-[#161b22] p-6 md:p-7 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="font-cinzel text-lg font-bold text-[#113240] dark:text-white">Assistência à Saúde & Cuidado Fraterno</h2>
          </div>

          {/* Dados Médicos em Tipografia Editorial Limpa */}
          <div className="grid grid-cols-2 gap-6 py-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 font-sans block">
                Plano de Saúde Privado
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif text-3xl font-light text-slate-950 dark:text-white tabular-nums">
                  {saudeStats.comPlano}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  ({saudeStats.percentPlano}% cobertura)
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 font-sans block">
                Uso Contínuo
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif text-3xl font-light text-slate-950 dark:text-white tabular-nums">
                  {saudeStats.comMedicamentos}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  confrades
                </span>
              </div>
            </div>
          </div>

          {/* Comunidades de Acolhimento Canônico */}
          <div className="space-y-3">
            <div className="border-l-2 border-[#113240] dark:border-[#A3C3C7] pl-4 py-2">
              <div className="flex items-center justify-between">
                <h3 className="font-cinzel text-xs font-bold tracking-wide text-[#113240] dark:text-white uppercase">
                  Casa São João · Repouso Provincial
                </h3>
                <span className="font-serif text-base font-bold text-[#113240] dark:text-white tabular-nums">
                  {totalCasaSaoJoao} <span className="font-sans text-xs font-normal text-slate-500">confrades</span>
                </span>
              </div>
            </div>

            <div className="border-l-2 border-[#226380] dark:border-[#226380]/60 pl-4 py-2">
              <div className="flex items-center justify-between">
                <h3 className="font-cinzel text-xs font-bold tracking-wide text-[#113240] dark:text-white uppercase">
                  Etapa da Configuração (Teologia)
                </h3>
                <span className="font-serif text-base font-bold text-[#113240] dark:text-white tabular-nums">
                  {totalFratresConfig} <span className="font-sans text-xs font-normal text-slate-500">fratres</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Tabela Analítica de Religiosos Filtrados */}
      <section className="rounded-[6px] bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <div>
            <h3 className="font-cinzel text-sm font-bold text-[#113240] dark:text-white">
              Listagem Analítica ({filteredList.length} registros)
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">Filtro aplicado: {filtroStatus}</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filtroStatus === 'Todos' ? 'Base completa' : `Segmentação: ${filtroStatus}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 font-mono text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="p-3.5">Religioso</th>
                <th className="p-3.5">Grau Canônico</th>
                <th className="p-3.5">Idade</th>
                <th className="p-3.5">Comunidade Atual</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredList.length > 0 ? (
                filteredList.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">
                      <div>
                        <span>{r.nome_civil}</span>
                        {r.nome_religioso && (
                          <span className="text-slate-500 font-normal block text-[11px]">
                            ({r.nome_religioso})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-mono rounded-[4px] border ${
                        r.canonicalGrau === 'Padre'
                          ? 'border-[#226380]/30 bg-[#226380]/10 text-[#113240] dark:text-[#A3C3C7]'
                          : r.canonicalGrau.includes('Diácono')
                            ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300'
                            : r.canonicalGrau.includes('Configuração')
                              ? 'border-[#226380]/40 bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7]'
                              : r.canonicalGrau.includes('Tirocinante')
                                ? 'border-[#F2C894] bg-[#F2C894]/20 text-[#113240]'
                                : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {r.canonicalGrau}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                      {r.age !== null ? `${r.age} anos` : '—'}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      {r.comunidade_atual_nome || '—'}
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono rounded-[4px] border ${
                        r.status === 'Ativo'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : r.isCasaSaoJoao
                            ? 'border-[#F2C894] bg-[#F2C894]/20 text-[#113240]'
                            : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono text-[11px] text-slate-500">
                      {r.status_cadastro}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    Nenhum religioso encontrado para o filtro selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. Rodapé Oficial para Impressão */}
      <footer className="hidden print:block pt-6 border-t border-slate-300 text-center text-[10px] font-mono text-slate-500 space-y-1">
        <p>Província Brasileira Meridional dos Padres do Sagrado Coração de Jesus (SCJ)</p>
        <p>Documento gerado pelo Sistema BRM em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
      </footer>
    </div>
  );
};

export default EstatisticaBRM;
