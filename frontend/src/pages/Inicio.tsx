import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CalendarDays, CheckCircle2, ClipboardList, FileCheck2, Hotel, Loader2, Plus, Settings2, ShieldCheck, UserRound, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AppleTrendChart, AppleDonutChart, AppleOccupancyGauge } from '../components/AppleCharts';
import type { TrendPoint, DonutSegment } from '../components/AppleCharts';
import { useAnimatedNumber, staggerStyle } from '../hooks/useMotion';

interface DashboardData {
  hospedaria: { total: number; checkins: number; checkouts: number; ocupados: number; recentes: Array<{ id: string; nome: string; cidade: string; chegada: string; status: string }> };
  religiosos: { total: number; revisao: number; aprovados: number; recentes: Array<{ id: string; nome: string; grau: string; origem: string; status: string; data: string }> };
  inscricoesAbertas: boolean;
  warning: string | null;
  grausDistribution: DonutSegment[];
  trendPoints: TrendPoint[];
  totalQuartos: number;
}

const initialData: DashboardData = {
  hospedaria: { total: 0, checkins: 0, checkouts: 0, ocupados: 0, recentes: [] },
  religiosos: { total: 0, revisao: 0, aprovados: 0, recentes: [] },
  inscricoesAbertas: true,
  warning: null,
  grausDistribution: [],
  trendPoints: [],
  totalQuartos: 24,
};

const dateLabel = (value: string) => {
  if (!value) return 'Sem data';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Sem data' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export const Inicio: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      const [
        hospedagens, checkins, checkouts, quartos, hospedagensRecentes, motivos,
        religiosos, religiososRevisao, religiososAprovados, religiososRecentes, config,
        religiososGrau, totalQuartos, todasHospedagens
      ] = await Promise.all([
        supabase.from('hospedagens').select('*', { count: 'exact', head: true }),
        supabase.from('hospedagens').select('*', { count: 'exact', head: true }).is('hos_checkin', null),
        supabase.from('hospedagens').select('*', { count: 'exact', head: true }).not('hos_checkin', 'is', null).is('hos_checkout', null),
        supabase.from('hospedagens').select('hos_quarto').not('hos_checkin', 'is', null).is('hos_checkout', null).not('hos_quarto', 'is', null),
        supabase.from('hospedagens').select('idhospedagens,hos_nome,hos_cidade,hos_estado,hos_previsaochegada,hos_inscricao,hos_checkin,hos_checkout').order('hos_inscricao', { ascending: false }).limit(6),
        supabase.from('mainhospedagem').select('idmainhospedagem,main_motivo'),
        supabase.from('religiosos').select('*', { count: 'exact', head: true }),
        supabase.from('religiosos').select('*', { count: 'exact', head: true }).eq('status_cadastro', 'Em revisão'),
        supabase.from('religiosos').select('*', { count: 'exact', head: true }).eq('status_cadastro', 'Aprovado'),
        supabase.from('religiosos').select('id,nome_civil,nome_religioso,grau,origem_cadastro,status_cadastro,created_at').order('created_at', { ascending: false }).limit(6),
        supabase.from('religiosos_configuracoes').select('ativo').limit(1).maybeSingle(),
        supabase.from('religiosos').select('grau, created_at'),
        supabase.from('hos_quartos').select('*', { count: 'exact', head: true }).eq('hos_qua_status', 'Ativo'),
        supabase.from('hospedagens').select('hos_inscricao, created_at').order('hos_inscricao', { ascending: false }).limit(200),
      ]);

      const errors = [hospedagens, checkins, checkouts, quartos, hospedagensRecentes, religiosos, religiososRevisao, religiososAprovados, religiososRecentes, config].filter(result => result.error);
      const motivoMap = new Map((motivos.data || []).map(item => [String(item.idmainhospedagem), item.main_motivo || 'Hospedaria']));
      const quartosAtivos = new Set((quartos.data || []).map(item => item.hos_quarto).filter(Boolean)).size;
      const hospedariaRecentes = (hospedagensRecentes.data || []).map(item => ({
        id: String(item.idhospedagens), nome: item.hos_nome || 'Hóspede sem nome', cidade: item.hos_cidade ? `${item.hos_cidade}${item.hos_estado ? `/${item.hos_estado}` : ''}` : 'Cidade não informada', chegada: item.hos_previsaochegada || item.hos_inscricao, status: item.hos_checkout ? 'Finalizado' : item.hos_checkin ? 'Em hospedagem' : 'Pendente',
      }));
      const religiososRecentesData = (religiososRecentes.data || []).map(item => ({ id: item.id, nome: item.nome_religioso || item.nome_civil, grau: item.grau, origem: item.origem_cadastro === 'publico' ? 'Site público' : 'Painel Admin', status: item.status_cadastro, data: item.created_at }));

      // Process Grau Distribution for Apple Donut
      const grauCounts: Record<string, number> = {
        'Padre': 0, 'Frater': 0, 'Irmão': 0, 'Diácono': 0, 'Bispo': 0
      };
      (religiososGrau.data || []).forEach(r => {
        if (r.grau && grauCounts[r.grau] !== undefined) {
          grauCounts[r.grau]++;
        } else if (r.grau) {
          grauCounts[r.grau] = (grauCounts[r.grau] || 0) + 1;
        }
      });
      const rawGraus: DonutSegment[] = [
        { label: 'Padres', value: grauCounts['Padre'] || 0, color: '#0071e3' },
        { label: 'Fráteres', value: grauCounts['Frater'] || 0, color: '#34c759' },
        { label: 'Irmãos', value: grauCounts['Irmão'] || 0, color: '#ff9500' },
        { label: 'Diáconos', value: grauCounts['Diácono'] || 0, color: '#5856d6' },
        { label: 'Bispos', value: grauCounts['Bispo'] || 0, color: '#ff2d55' },
      ];
      const grausDistribution: DonutSegment[] = rawGraus;

      // Process 6-Month Trend Points for Apple Area Spline Chart (100% dados reais)
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const now = new Date();
      const last6Months: Array<{ year: number; month: number; label: string }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push({ year: d.getFullYear(), month: d.getMonth(), label: monthNames[d.getMonth()] });
      }

      const trendPoints: TrendPoint[] = last6Months.map(m => {
        const hospCount = (todasHospedagens.data || []).filter(h => {
          const dateStr = h.hos_inscricao || h.created_at;
          if (!dateStr) return false;
          const hd = new Date(dateStr);
          return hd.getFullYear() === m.year && hd.getMonth() === m.month;
        }).length;

        const religCount = (religiososGrau.data || []).filter(r => {
          if (!r.created_at) return false;
          const rd = new Date(r.created_at);
          return rd.getFullYear() === m.year && rd.getMonth() === m.month;
        }).length;

        return { label: m.label, hospedagens: hospCount, religiosos: religCount };
      });

      const safeTotalQuartos = totalQuartos.count ?? 0;

      setData({
        hospedaria: {
          total: hospedagens.count || 0,
          checkins: checkins.count || 0,
          checkouts: checkouts.count || 0,
          ocupados: quartosAtivos,
          recentes: hospedariaRecentes.map(item => ({ ...item, status: item.status === 'Pendente' ? motivoMap.get(item.id) || item.status : item.status }))
        },
        religiosos: {
          total: religiosos.count || 0,
          revisao: religiososRevisao.count || 0,
          aprovados: religiososAprovados.count || 0,
          recentes: religiososRecentesData
        },
        inscricoesAbertas: config.data?.ativo ?? true,
        warning: errors.length ? 'Alguns dados ainda não estão disponíveis. Confira se o schema mais recente foi executado no Supabase.' : null,
        grausDistribution,
        trendPoints,
        totalQuartos: safeTotalQuartos
      });
      setLoading(false);
    };
    loadDashboard();
    const channel = supabase.channel('dashboard-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'religiosos' }, loadDashboard).on('postgres_changes', { event: '*', schema: 'public', table: 'hospedagens' }, loadDashboard).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
          <span className="text-sm font-medium text-[#707070]">Carregando visão operacional...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Provincial Hero Header - Clean & Architectural */}
      <header className="rounded-[6px] bg-white dark:bg-[#161b22] p-6 md:p-8 border border-slate-200 dark:border-slate-800 border-t-2 border-t-[#226380] shadow-[0_1px_3px_rgba(17,50,64,0.03)] transition-all">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex items-center shrink-0">
              <img src="/logo-sistema.png" alt="BRM" className="h-14 w-auto object-contain dark:hidden" />
              <img src="/logo-branco.png" alt="BRM" className="h-14 w-auto object-contain hidden dark:block" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#226380] font-cinzel">
                  Província BRM
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Painel Integrado</span>
              </div>
              <h1 className="mt-1 text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-[#113240] dark:text-white font-cinzel">
                Olá, {user?.nome || 'Usuário'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/religiosos/novo"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold border border-[#113240] bg-[#113240] text-white hover:bg-[#226380] hover:border-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Novo religioso</span>
            </Link>
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
          Visão centralizada de entradas, revisões cadastrais de religiosos e movimentações da hospedaria da Província.
        </p>
      </header>

      {data.warning && (
        <div className="flex items-center gap-3 rounded-[6px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>{data.warning}</span>
        </div>
      )}

      {/* Bento Grid Metrics — utxica-tasteskill Principles */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Religiosos" value={data.religiosos.total} icon={Users} tone="blue" href="/religiosos" index={0} />
        <MetricCard label="Em revisão" value={data.religiosos.revisao} icon={FileCheck2} tone="amber" href="/religiosos" highlight={data.religiosos.revisao > 0} index={1} />
        <MetricCard label="Hospedagens" value={data.hospedaria.total} icon={Hotel} tone="indigo" href="/hospedagens-inscricoes" index={2} />
        <MetricCard label="Check-ins pendentes" value={data.hospedaria.checkins} icon={CalendarDays} tone="amber" href="/hospedagens-inscricoes" highlight={data.hospedaria.checkins > 0} index={3} />
        <MetricCard label="Check-outs pendentes" value={data.hospedaria.checkouts} icon={CheckCircle2} tone="rose" href="/hospedagens-inscricoes" index={4} />
        <MetricCard label="Quartos ocupados" value={data.hospedaria.ocupados} icon={Building2} tone="emerald" href="/hospedagens-inscricoes" index={5} />
      </section>

      {/* Apple Visual Analytics: Trend Curve & Occupancy Gauge */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <AppleTrendChart data={data.trendPoints} />
        </div>
        <div className="lg:col-span-4">
          <AppleOccupancyGauge
            totalQuartos={data.totalQuartos}
            quartosOcupados={data.hospedaria.ocupados}
            totalHospedes={data.hospedaria.total}
          />
        </div>
      </section>

      {/* Analytics Donut & Religious Activity Bento Panels */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <AppleDonutChart data={data.grausDistribution} />
        </div>
        <div className="lg:col-span-7">
          <ApplePanel 
            title="Cadastros de Religiosos" 
            subtitle="Entradas recentes do site público e do painel" 
            action="Ver todos" 
            href="/religiosos"
          >
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.religiosos.recentes.length ? (
                data.religiosos.recentes.map(item => (
                  <div className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.02] px-2 rounded-[6px]" key={item.id}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-[#A3C3C7]/40 dark:border-slate-700 bg-[#113240]/5 text-[#113240] dark:bg-white/10 dark:text-white">
                        <UserRound className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                          {item.nome}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.grau} · {item.origem}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-[4px] border px-2 py-0.5 text-[10px] font-medium ${item.status === 'Em revisão' ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                      {item.status}
                    </span>
                  </div>
                ))
              ) : (
                <EmptyState text="Nenhum cadastro de religioso encontrado." />
              )}
            </div>
          </ApplePanel>
        </div>
      </section>

      {/* Hospedaria Activity */}
      <section className="grid gap-6">
        <ApplePanel 
          title="Movimentações da Hospedaria" 
          subtitle="Inscrições e estadias recentes" 
          action="Ver todas" 
          href="/hospedagens-inscricoes"
        >
          <div className="divide-y divide-[#e5e5ea] dark:divide-white/10">
            {data.hospedaria.recentes.length ? (
              data.hospedaria.recentes.map(item => (
                <div className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] -mx-2 px-2 rounded-[6px]" key={item.id}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#113240] dark:text-white">
                      {item.nome}
                    </p>
                    <p className="text-xs text-[#707070] dark:text-[#86868b]">
                      {item.cidade} · Previsão: {dateLabel(item.chegada)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-[4px] border border-slate-200 dark:border-slate-800 bg-[#f5f5f7] dark:bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-[#474747] dark:text-[#86868b]">
                    {item.status}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState text="Nenhuma hospedagem recente registrada." />
            )}
          </div>
        </ApplePanel>
      </section>

      {/* Quick Actions & Administrative Focus */}
      <section className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <ApplePanel title="Ações Rápidas" subtitle="Atalhos frequentes da secretaria">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <QuickActionCard 
              href="/religiosos/novo" 
              icon={Plus} 
              title="Cadastrar Religioso" 
              text="Abrir ficha completa de admissão ou atualização" 
            />
            <QuickActionCard 
              href="/religiosos-configuracoes" 
              icon={Settings2} 
              title="Configurar Inscrições" 
              text="Gerenciar mensagens, termos e status público" 
            />
            <QuickActionCard 
              href="/hospedagens-inscricoes" 
              icon={ClipboardList} 
              title="Revisar Hospedagens" 
              text="Gerenciar check-ins e quartos da hospedaria" 
            />
          </div>
        </ApplePanel>

        <ApplePanel title="Atenção Operacional" subtitle="Pendências prioritárias para conferência">
          <div className="grid gap-3 sm:grid-cols-3">
            <AttentionCard 
              label="Religiosos aguardando revisão" 
              value={data.religiosos.revisao} 
              href="/religiosos" 
              tone="amber" 
            />
            <AttentionCard 
              label="Check-ins pendentes" 
              value={data.hospedaria.checkins} 
              href="/hospedagens-inscricoes" 
              tone="rose" 
            />
            <AttentionCard 
              label="Religiosos aprovados" 
              value={data.religiosos.aprovados} 
              href="/religiosos" 
              tone="emerald" 
            />
          </div>
        </ApplePanel>
      </section>
    </div>
  );
};

const MetricCard: React.FC<{ 
  label: string; 
  value: number; 
  icon: React.ElementType; 
  tone: 'blue' | 'amber' | 'rose' | 'emerald' | 'indigo'; 
  href: string;
  highlight?: boolean;
  index?: number;
}> = ({ label, value, href, highlight, index = 0 }) => {
  const animatedValue = useAnimatedNumber(value);
  return (
    <Link 
      to={href} 
      style={staggerStyle(index)}
      className={`group rounded-[6px] bg-white dark:bg-[#161b22] p-5 border flex flex-col justify-between shadow-[0_1px_3px_rgba(17,50,64,0.02)] motion-lift motion-press motion-stagger-item
        ${highlight 
          ? 'border-[#226380] dark:border-white ring-1 ring-[#226380]/20 dark:ring-white/10' 
          : 'border-slate-200 dark:border-slate-800 hover:border-[#226380] dark:hover:border-slate-600'}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 font-sans">
          {label}
        </span>
        {highlight && (
          <span className="h-1.5 w-1.5 rounded-full bg-[#226380] dark:bg-white" />
        )}
      </div>
      <p className="mt-3 font-serif text-3xl xl:text-4xl font-light text-[#113240] dark:text-white tabular-nums">
        {animatedValue}
      </p>
      <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-slate-400 group-hover:text-[#226380] dark:group-hover:text-white transition-colors">
        <span>Acessar</span>
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
};

const ApplePanel: React.FC<{ 
  title: string; 
  subtitle: string; 
  action?: string; 
  href?: string; 
  children: React.ReactNode 
}> = ({ title, subtitle, action, href, children }) => (
  <section className="rounded-[6px] bg-white dark:bg-[#161b22] p-6 md:p-7 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_rgba(17,50,64,0.02)]">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base md:text-lg font-bold tracking-tight text-[#113240] dark:text-white font-cinzel">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-sans">
          {subtitle}
        </p>
      </div>
      {action && href && (
        <Link 
          to={href} 
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#226380] dark:text-[#A3C3C7] hover:underline motion-press"
        >
          {action}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
    {children}
  </section>
);

const QuickActionCard: React.FC<{ 
  href: string; 
  icon: React.ElementType; 
  title: string; 
  text: string 
}> = ({ href, icon: Icon, title, text }) => (
  <Link 
    to={href} 
    className="flex items-center gap-3.5 rounded-[6px] border border-slate-200 dark:border-slate-800 p-3.5 hover:bg-[#F2F2F2]/60 dark:hover:bg-white/[0.02] hover:border-[#226380] dark:hover:border-slate-600 bg-white dark:bg-[#161b22] motion-lift motion-press"
  >
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-[#A3C3C7]/40 dark:border-slate-700 bg-[#113240]/5 dark:bg-white/5 text-[#113240] dark:text-slate-200">
      <Icon className="h-4 w-4" />
    </span>
    <div>
      <strong className="block text-xs font-semibold text-[#113240] dark:text-white font-sans">{title}</strong>
      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5 font-sans">{text}</span>
    </div>
  </Link>
);

const AttentionCard: React.FC<{ 
  label: string; 
  value: number; 
  href: string; 
  tone: 'amber' | 'rose' | 'emerald'; 
}> = ({ label, value, href }) => {
  const animatedValue = useAnimatedNumber(value);
  return (
    <Link 
      to={href} 
      className="rounded-[6px] border-l-2 border-l-[#226380] border-t border-r border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-4 block shadow-[0_1px_3px_rgba(17,50,64,0.02)] motion-lift motion-press"
    >
      <p className="font-serif text-2xl lg:text-3xl font-light text-[#113240] dark:text-white tabular-nums">{animatedValue}</p>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-snug font-sans">{label}</p>
    </Link>
  );
};

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">{text}</p>
);

export default Inicio;