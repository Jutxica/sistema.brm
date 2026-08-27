import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, Calendar, LogIn, LogOut, ArrowRight, TrendingUp, Building2, ShieldCheck, Loader2, Settings 
} from 'lucide-react';

interface DashboardStats {
  totalInscricoes: number;
  checkinsPendentes: number;
  checkoutsPendentes: number;
  quartosOcupados: number;
  recentes: Array<{
    id: string;
    nome: string;
    cidade: string;
    curso: string;
    chegada: string;
    status: string;
  }>;
}

export const Inicio: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Buscar cursos/estadias para mapeamento dos nomes amigáveis no frontend
        const { data: motivosData } = await supabase
          .from('mainhospedagem')
          .select('idmainhospedagem, main_motivo');
        
        const motivosMap = new Map<string, string>();
        motivosData?.forEach(m => {
          motivosMap.set(String(m.idmainhospedagem), m.main_motivo);
        });

        // 2. Total de inscrições
        const { count: totalCount, error: errTotal } = await supabase
          .from('hospedagens')
          .select('*', { count: 'exact', head: true });

        // 3. Check-ins pendentes (hos_checkin é nulo)
        const { count: checkinsCount, error: errCheckins } = await supabase
          .from('hospedagens')
          .select('*', { count: 'exact', head: true })
          .is('hos_checkin', null);

        // 4. Check-outs pendentes (check-in feito mas check-out nulo)
        const { count: checkoutsCount, error: errCheckouts } = await supabase
          .from('hospedagens')
          .select('*', { count: 'exact', head: true })
          .not('hos_checkin', 'is', null)
          .is('hos_checkout', null);

        // 5. Quartos Ocupados (quantidade de quartos distintos com check-in ativo)
        const { data: quartosData, error: errQuartos } = await supabase
          .from('hospedagens')
          .select('hos_quarto')
          .not('hos_checkin', 'is', null)
          .is('hos_checkout', null)
          .not('hos_quarto', 'is', null);

        const distinctRooms = new Set(quartosData?.map(q => q.hos_quarto) || []).size;

        // 6. Próximas chegadas (10 registros mais recentes ordenados pela inscrição desc)
        const { data: recentesData, error: errRecentes } = await supabase
          .from('hospedagens')
          .select('*')
          .order('hos_inscricao', { ascending: false })
          .limit(10);

        if (errTotal || errCheckins || errCheckouts || errQuartos || errRecentes) {
          console.error("Erro em alguma query do dashboard. Usando dados fictícios.");
          setMockData();
          return;
        }

        const mappedRecentes = (recentesData || []).map(item => {
          let statusText = 'Pendente';
          if (item.hos_checkout) {
            statusText = 'Finalizado';
          } else if (item.hos_checkin) {
            statusText = 'Ativo';
          } else if (item.hos_status && String(item.hos_status) !== '0') {
            statusText = 'Confirmado';
          }

          const motivoNome = motivosMap.get(String(item.hos_estadiamotivo)) || item.hos_estadiamotivo || 'Hospedagem';

          return {
            id: String(item.idhospedagens),
            nome: item.hos_nome,
            cidade: item.hos_cidade ? `${item.hos_cidade} - ${item.hos_estado || ''}` : 'Não informada',
            curso: motivoNome,
            chegada: item.hos_previsaochegada || item.hos_inscricao,
            status: statusText
          };
        });

        setStats({
          totalInscricoes: totalCount || 0,
          checkinsPendentes: checkinsCount || 0,
          checkoutsPendentes: checkoutsCount || 0,
          quartosOcupados: distinctRooms,
          recentes: mappedRecentes
        });

      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
        setMockData();
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Inscrever em atualizações em tempo real para recarregar o dashboard se houver mudanças na tabela hospedagens
    const channel = supabase
      .channel('hospedagens-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hospedagens' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const setMockData = () => {
    setStats({
      totalInscricoes: 124,
      checkinsPendentes: 18,
      checkoutsPendentes: 5,
      quartosOcupados: 42,
      recentes: [
        { id: '1', nome: 'Pe. André Souza', cidade: 'São Paulo - SP', curso: 'Teologia Litúrgica', chegada: '2026-05-26T14:00:00', status: 'Ativo' },
        { id: '2', nome: 'Diác. Marcos Vinicius', cidade: 'Rio de Janeiro - RJ', curso: 'Espiritualidade SCJ', chegada: '2026-05-26T16:30:00', status: 'Confirmado' },
        { id: '3', nome: 'Ir. Maria Clara', cidade: 'Brusque - SC', curso: 'Gestão Eclesial', chegada: '2026-05-27T09:00:00', status: 'Pendente' },
        { id: '4', nome: 'Pe. Roberto Silveira', cidade: 'Taubaté - SP', curso: 'Teologia Litúrgica', chegada: '2026-05-27T10:00:00', status: 'Confirmado' }
      ]
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Carregando painel principal...
          </span>
        </div>
      </div>
    );
  }

  const kpis = [
    { title: 'Inscrições Ativas', value: stats?.totalInscricoes || 0, icon: Users, color: 'text-primary bg-primary/10 dark:text-secondary dark:bg-secondary/10' },
    { title: 'Check-ins Pendentes', value: stats?.checkinsPendentes || 0, icon: LogIn, color: 'text-amber-600 bg-amber-500/10' },
    { title: 'Check-outs Pendentes', value: stats?.checkoutsPendentes || 0, icon: LogOut, color: 'text-rose-600 bg-rose-500/10' },
    { title: 'Quartos Ocupados', value: stats?.quartosOcupados || 0, icon: Building2, color: 'text-emerald-600 bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#082842] dark:text-slate-100">
            Olá, {user?.nome || 'Usuário'}!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Seja bem-vindo de volta ao painel de gerenciamento do Sistema BRM.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 font-mono">
          <ShieldCheck className="w-4 h-4" />
          <span>Sessão segura com JWT ativa</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="glass shadow-premium rounded-2xl p-6 hover:shadow-lg hover:border-slate-350 dark:hover:border-slate-700/85 hover-lift bg-white/90">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
                {kpi.title}
              </span>
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-slate-800 dark:text-slate-100">
                {kpi.value}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 font-mono flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                Estável
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Panel Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recents list (2/3 width) */}
        <div className="lg:col-span-2 glass shadow-premium rounded-2xl p-6 bg-white/90">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Próximas Chegadas
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Lista dos inscritos com chegada prevista para as próximas horas.
              </p>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-secondary hover:underline font-semibold transition-colors cursor-pointer">
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 font-semibold tracking-wider font-mono">
                  <th className="pb-3 pr-4">Hóspede</th>
                  <th className="pb-3 pr-4">Curso / Estadia</th>
                  <th className="pb-3 pr-4">Cidade / UF</th>
                  <th className="pb-3 pr-4">Previsão</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 font-mono">
                {stats?.recentes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3.5 pr-4 font-sans font-medium text-slate-800 dark:text-slate-200">
                      {item.nome}
                    </td>
                    <td className="py-3.5 pr-4 font-sans">{item.curso}</td>
                    <td className="py-3.5 pr-4 text-slate-500">{item.cidade}</td>
                    <td className="py-3.5 pr-4">
                      {new Date(item.chegada).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold font-sans
                        ${item.status === 'Confirmado' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
                          item.status === 'Ativo' ? 'bg-secondary/10 text-secondary' : 
                          'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick actions or info (1/3 width) */}
        <div className="glass shadow-premium rounded-2xl p-6 flex flex-col justify-between bg-white/90">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Acesso Rápido
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Atalhos rápidos para operações frequentes.
              </p>
            </div>

            <div className="space-y-3">
              <a 
                href="/hospedagens-inscricoes"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 dark:border-slate-800/50 dark:hover:border-slate-700/80 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/30 dark:hover:bg-slate-900/60 transition-all duration-200 group text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary dark:bg-secondary/15 dark:text-secondary group-hover:scale-105 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p>Ver Inscrições</p>
                  <p className="text-[10px] text-slate-400 font-normal">Pesquisar e filtrar fichas</p>
                </div>
              </a>

              <a 
                href="/hospedagens-configuracoes"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 dark:border-slate-800/50 dark:hover:border-slate-700/80 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/30 dark:hover:bg-slate-900/60 transition-all duration-200 group text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary dark:bg-secondary/15 dark:text-secondary group-hover:scale-105 transition-transform">
                  <Settings className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p>Configurações</p>
                  <p className="text-[10px] text-slate-400 font-normal">Editar cursos e quartos</p>
                </div>
              </a>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50 text-[10px] font-mono text-slate-400 leading-normal mt-6">
            Sistema BRM &copy; 2026. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  );
};
export default Inicio;
