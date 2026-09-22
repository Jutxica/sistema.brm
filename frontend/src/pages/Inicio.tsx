import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, ClipboardList, FileCheck2, Hotel, Loader2, Plus, Settings2, ShieldCheck, UserRound, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface DashboardData {
  hospedaria: { total: number; checkins: number; checkouts: number; ocupados: number; recentes: Array<{ id: string; nome: string; cidade: string; chegada: string; status: string }> };
  religiosos: { total: number; revisao: number; aprovados: number; recentes: Array<{ id: string; nome: string; grau: string; origem: string; status: string; data: string }> };
  inscricoesAbertas: boolean;
  warning: string | null;
}

const initialData: DashboardData = {
  hospedaria: { total: 0, checkins: 0, checkouts: 0, ocupados: 0, recentes: [] },
  religiosos: { total: 0, revisao: 0, aprovados: 0, recentes: [] },
  inscricoesAbertas: true,
  warning: null,
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
      const [hospedagens, checkins, checkouts, quartos, hospedagensRecentes, motivos, religiosos, religiososRevisao, religiososAprovados, religiososRecentes, config] = await Promise.all([
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
      ]);

      const errors = [hospedagens, checkins, checkouts, quartos, hospedagensRecentes, religiosos, religiososRevisao, religiososAprovados, religiososRecentes, config].filter(result => result.error);
      const motivoMap = new Map((motivos.data || []).map(item => [String(item.idmainhospedagem), item.main_motivo || 'Hospedaria']));
      const quartosAtivos = new Set((quartos.data || []).map(item => item.hos_quarto).filter(Boolean)).size;
      const hospedariaRecentes = (hospedagensRecentes.data || []).map(item => ({
        id: String(item.idhospedagens), nome: item.hos_nome || 'Hóspede sem nome', cidade: item.hos_cidade ? `${item.hos_cidade}${item.hos_estado ? `/${item.hos_estado}` : ''}` : 'Cidade não informada', chegada: item.hos_previsaochegada || item.hos_inscricao, status: item.hos_checkout ? 'Finalizado' : item.hos_checkin ? 'Em hospedagem' : 'Pendente',
      }));
      const religiososRecentesData = (religiososRecentes.data || []).map(item => ({ id: item.id, nome: item.nome_religioso || item.nome_civil, grau: item.grau, origem: item.origem_cadastro === 'publico' ? 'Site público' : 'Painel Admin', status: item.status_cadastro, data: item.created_at }));
      setData({ hospedaria: { total: hospedagens.count || 0, checkins: checkins.count || 0, checkouts: checkouts.count || 0, ocupados: quartosAtivos, recentes: hospedariaRecentes.map(item => ({ ...item, status: item.status === 'Pendente' ? motivoMap.get(item.id) || item.status : item.status })) }, religiosos: { total: religiosos.count || 0, revisao: religiososRevisao.count || 0, aprovados: religiososAprovados.count || 0, recentes: religiososRecentesData }, inscricoesAbertas: config.data?.ativo ?? true, warning: errors.length ? 'Alguns dados ainda não estão disponíveis. Confira se o schema mais recente foi executado no Supabase.' : null });
      setLoading(false);
    };
    loadDashboard();
    const channel = supabase.channel('dashboard-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'religiosos' }, loadDashboard).on('postgres_changes', { event: '*', schema: 'public', table: 'hospedagens' }, loadDashboard).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="flex flex-col items-center gap-3"><Loader2 className="h-8 w-8 animate-spin text-secondary" /><span className="text-sm text-slate-500">Carregando visão operacional...</span></div></div>;

  return <div className="space-y-6 animate-fade-in">
    <header className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-7 text-white shadow-premium sm:px-8"><div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[32px] border-white/10" /><div className="absolute -bottom-44 right-32 h-72 w-72 rounded-full border-[22px] border-teal-300/15" /><div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">Painel de controle</p><h1 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">Olá, {user?.nome || 'Usuário'}</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-200">Uma visão clara do que entrou, do que precisa de revisão e do movimento da hospedaria.</p></div><div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${data.inscricoesAbertas ? 'border-teal-300/30 bg-teal-300/10 text-teal-200' : 'border-amber-300/30 bg-amber-300/10 text-amber-200'}`}><span className={`h-2 w-2 rounded-full ${data.inscricoesAbertas ? 'bg-teal-300' : 'bg-amber-300'}`} />Religiosos {data.inscricoesAbertas ? 'abertos' : 'fechados'}</div></div></header>
    {data.warning && <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-800"><ShieldCheck className="h-4 w-4 shrink-0" />{data.warning}</div>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Religiosos cadastrados" value={data.religiosos.total} icon={Users} tone="navy" href="/religiosos" /><Metric label="Aguardando revisão" value={data.religiosos.revisao} icon={FileCheck2} tone="amber" href="/religiosos" /><Metric label="Hospedagens recebidas" value={data.hospedaria.total} icon={Hotel} tone="teal" href="/hospedagens-inscricoes" /><Metric label="Quartos ocupados" value={data.hospedaria.ocupados} icon={Building2} tone="green" href="/hospedagens-inscricoes" /></section>
    <section className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]"><Panel title="Movimento da hospedaria" subtitle="Pendências operacionais e ocupação atual."><div className="grid gap-6 md:grid-cols-[190px_1fr] md:items-center"><Donut value={data.hospedaria.ocupados} max={Math.max(data.hospedaria.ocupados + data.hospedaria.checkins, 1)} label="ocupados" /><div className="space-y-4"><Bar label="Check-ins pendentes" value={data.hospedaria.checkins} max={Math.max(data.hospedaria.checkins, data.hospedaria.checkouts, 1)} color="bg-amber-500" /><Bar label="Check-outs pendentes" value={data.hospedaria.checkouts} max={Math.max(data.hospedaria.checkins, data.hospedaria.checkouts, 1)} color="bg-rose-500" /><Bar label="Religiosos em revisão" value={data.religiosos.revisao} max={Math.max(data.religiosos.revisao, data.religiosos.aprovados, 1)} color="bg-primary" /></div></div></Panel><Panel title="Resumo dos religiosos" subtitle="Estado dos cadastros no momento."><div className="flex items-center justify-center py-2"><Donut value={data.religiosos.aprovados} max={Math.max(data.religiosos.total, 1)} label="aprovados" /></div><div className="mt-4 grid grid-cols-2 gap-3"><MiniStat label="Total" value={data.religiosos.total} /><MiniStat label="Em revisão" value={data.religiosos.revisao} /></div></Panel></section>
    <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"><Panel title="Cadastros de religiosos" subtitle="Entradas mais recentes do site público e do painel." action="Ver inscritos" href="/religiosos"><div className="divide-y divide-slate-100 dark:divide-slate-800">{data.religiosos.recentes.length ? data.religiosos.recentes.map(item => <div className="flex items-center justify-between gap-4 py-3" key={item.id}><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{item.nome}</p><p className="text-[11px] text-slate-400">{item.grau} · {item.origem}</p></div></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${item.status === 'Em revisão' ? 'bg-amber-500/10 text-amber-700' : 'bg-emerald-500/10 text-emerald-700'}`}>{item.status}</span></div>) : <Empty text="Nenhum cadastro de religioso encontrado." />}</div></Panel><Panel title="Ações rápidas" subtitle="Atalhos para o trabalho da secretaria."><div className="grid gap-3"><QuickAction href="/religiosos/novo" icon={Plus} title="Cadastrar religioso" text="Abrir ficha completa" /><QuickAction href="/religiosos-configuracoes" icon={Settings2} title="Configurar inscrições" text="Mensagens e abertura" /><QuickAction href="/hospedagens-inscricoes" icon={ClipboardList} title="Revisar hospedagens" text="Pesquisar inscrições" /></div></Panel></section>
    <section className="grid gap-6 xl:grid-cols-2"><Panel title="Próximas movimentações" subtitle="Inscrições recentes da hospedaria." action="Ver hospedaria" href="/hospedagens-inscricoes"><div className="divide-y divide-slate-100 dark:divide-slate-800">{data.hospedaria.recentes.length ? data.hospedaria.recentes.map(item => <div className="flex items-center justify-between gap-4 py-3" key={item.id}><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{item.nome}</p><p className="text-[11px] text-slate-400">{item.cidade} · {dateLabel(item.chegada)}</p></div><span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.status}</span></div>) : <Empty text="Nenhuma hospedagem encontrada." />}</div></Panel><Panel title="Pendências da secretaria" subtitle="O que merece atenção agora."><div className="grid gap-3 sm:grid-cols-3"><Attention label="Religiosos aguardando revisão" value={data.religiosos.revisao} href="/religiosos" tone="amber" /><Attention label="Check-ins sem registro" value={data.hospedaria.checkins} href="/hospedagens-inscricoes" tone="rose" /><Attention label="Religiosos aprovados" value={data.religiosos.aprovados} href="/religiosos" tone="green" /></div></Panel></section>
  </div>;
};

const Metric: React.FC<{ label: string; value: number; icon: React.ElementType; tone: string; href: string }> = ({ label, value, icon: Icon, tone, href }) => <Link to={href} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-premium transition hover:-translate-y-0.5 hover:border-primary/30 dark:border-slate-800 dark:bg-slate-900/70"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{label}</span><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone === 'navy' ? 'bg-primary/10 text-primary' : tone === 'teal' ? 'bg-teal-500/10 text-teal-700' : tone === 'amber' ? 'bg-amber-500/10 text-amber-700' : tone === 'rose' ? 'bg-rose-500/10 text-rose-700' : 'bg-emerald-500/10 text-emerald-700'}`}><Icon className="h-4 w-4" /></span></div><p className="mt-4 font-mono text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p><span className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-400 group-hover:text-primary">Abrir módulo <ArrowRight className="h-3 w-3" /></span></Link>;
const Panel: React.FC<{ title: string; subtitle: string; action?: string; href?: string; children: React.ReactNode }> = ({ title, subtitle, action, href, children }) => <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-premium dark:border-slate-800 dark:bg-slate-900/70"><div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="font-serif text-lg font-bold text-primary">{title}</h2><p className="mt-1 text-xs text-slate-400">{subtitle}</p></div>{action && href && <Link to={href} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-secondary hover:underline">{action}<ArrowRight className="h-3 w-3" /></Link>}</div>{children}</section>;
const QuickAction: React.FC<{ href: string; icon: React.ElementType; title: string; text: string }> = ({ href, icon: Icon, title, text }) => <Link to={href} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-primary/30 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><span><strong className="block text-xs text-slate-800 dark:text-slate-100">{title}</strong><small className="text-[10px] text-slate-400">{text}</small></span></Link>;
const Attention: React.FC<{ label: string; value: number; href: string; tone: string }> = ({ label, value, href, tone }) => <Link to={href} className={`rounded-xl border p-4 ${tone === 'amber' ? 'border-amber-500/20 bg-amber-500/5' : tone === 'rose' ? 'border-rose-500/20 bg-rose-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></Link>;
const Donut: React.FC<{ value: number; max: number; label: string }> = ({ value, max, label }) => { const percentage = Math.min(Math.round((value / max) * 100), 100); return <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full" style={{ background: `conic-gradient(#0c3a4a ${percentage}%, #e2e8f0 ${percentage}% 100%)` }}><div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white text-center dark:bg-slate-900"><strong className="font-mono text-2xl text-primary">{value}</strong><span className="text-[10px] font-semibold text-slate-400">{label}</span></div></div>; };
const Bar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => <div><div className="mb-1 flex justify-between text-xs"><span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span><strong className="font-mono text-slate-500">{value}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(value ? (value / max) * 100 : 2, 2)}%` }} /></div></div>;
const MiniStat: React.FC<{ label: string; value: number }> = ({ label, value }) => <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><p className="font-mono text-xl font-bold text-primary">{value}</p><p className="mt-1 text-[10px] text-slate-400">{label}</p></div>;
const Empty: React.FC<{ text: string }> = ({ text }) => <p className="py-8 text-center text-xs text-slate-400">{text}</p>;
export default Inicio;
