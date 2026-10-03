import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, ClipboardList, Settings, Users, LogOut, ChevronLeft, ChevronRight, 
  Building, UserRound, ChevronDown, Plus, Church, Landmark, Layers, BarChart3,
  FileText, Calendar, Car, ShieldCheck, Wrench
} from 'lucide-react';
import { useAuth as useAuthHook } from '../contexts/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { logout, user } = useAuthHook();
  const location = useLocation();
  const [secretariaOpen, setSecretariaOpen] = React.useState(
    location.pathname.startsWith('/documentos') || location.pathname.startsWith('/agenda') || location.pathname.startsWith('/secretaria-configuracoes')
  );
  const [religiososOpen, setReligiososOpen] = React.useState(
    location.pathname.startsWith('/religiosos') || location.pathname.startsWith('/estatisticas-brm')
  );
  const [obrasOpen, setObrasOpen] = React.useState(location.pathname.startsWith('/obras'));
  const [patrimonioOpen, setPatrimonioOpen] = React.useState(location.pathname.startsWith('/patrimonio'));
  const [hospedariaOpen, setHospedariaOpen] = React.useState(location.pathname.startsWith('/hospedagens'));

  React.useEffect(() => {
    if (location.pathname.startsWith('/documentos') || location.pathname.startsWith('/agenda') || location.pathname.startsWith('/secretaria-configuracoes')) {
      setSecretariaOpen(true);
    }
    if (location.pathname.startsWith('/religiosos') || location.pathname.startsWith('/estatisticas-brm')) {
      setReligiososOpen(true);
    }
    if (location.pathname.startsWith('/patrimonio')) {
      setPatrimonioOpen(true);
    }
  }, [location.pathname]);

  // Exibir Usuários apenas para administradores autorizados
  const isAdmin = Boolean(user?.acessos?.includes('admin') || user?.acessos?.includes('usuarios'));

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 border-r border-[#e5e5ea] dark:border-white/10
        ${collapsed ? 'w-20' : 'w-64'} 
        bg-[#fbfbfd]/80 dark:bg-[#161b22]/80 backdrop-blur-xl text-[#1d1d1f] dark:text-[#f5f5f7]`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#e5e5ea] dark:border-white/10">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center shrink-0">
            <img src="/logo-sistema.png" alt="Sistema BRM" className="h-8 w-auto object-contain dark:hidden" />
            <img src="/logo-branco.png" alt="Sistema BRM" className="h-8 w-auto object-contain hidden dark:block" />
          </div>
          {!collapsed && (
            <div className="flex flex-col select-none">
              <span className="font-cinzel text-xs font-bold tracking-[0.16em] text-[#1d1d1f] dark:text-white uppercase">BRM</span>
              <span className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-[#707070] dark:text-[#86868b] font-medium">Província</span>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-[6px] border border-slate-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-[#707070] dark:text-[#86868b] transition-colors cursor-pointer"
          title={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex flex-col justify-between h-[calc(100vh-4rem)] p-3">
        <ul className="space-y-1">
          {/* 1. Início */}
          <li>
            <NavLink
              to="/inicio"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-[6px] transition-all duration-200 group text-[13px] font-medium border ${
                  isActive 
                    ? 'border-[#113240] bg-[#113240] text-white shadow-sm dark:border-[#226380] dark:bg-[#226380] dark:text-white' 
                    : 'border-transparent text-[#474747] dark:text-[#86868b] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#113240] dark:hover:text-white'}`
              }
            >
              <Home className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
              {!collapsed && <span className="truncate">Início</span>}
            </NavLink>
          </li>

          {/* 2. Religiosos */}
          <SidebarGroup label="Religiosos" icon={UserRound} open={religiososOpen} onToggle={() => setReligiososOpen(previous => !previous)} collapsed={collapsed}>
            <SidebarSubLink to="/religiosos" label="Inscritos" icon={Users} collapsed={collapsed} />
            <SidebarSubLink to="/estatisticas-brm" label="Estatística BRM" icon={BarChart3} collapsed={collapsed} />
            <SidebarSubLink to="/religiosos/novo" label="Novo cadastro" icon={Plus} collapsed={collapsed} />
            <SidebarSubLink to="/religiosos-configuracoes" label="Configurações" icon={Settings} collapsed={collapsed} />
          </SidebarGroup>

          {/* 3. Secretaria & Atos */}
          <SidebarGroup label="Secretaria & Atos" icon={FileText} open={secretariaOpen} onToggle={() => setSecretariaOpen(previous => !previous)} collapsed={collapsed}>
            <SidebarSubLink to="/documentos" label="Documentos Oficiais" icon={FileText} collapsed={collapsed} />
            <SidebarSubLink to="/agenda" label="Agenda & Eventos" icon={Calendar} collapsed={collapsed} />
            <SidebarSubLink to="/secretaria-configuracoes" label="Configurações & Formulários" icon={Settings} collapsed={collapsed} />
          </SidebarGroup>

          {/* 4. Comunidades & Obras */}
          <SidebarGroup label="Comunidades & Obras" icon={Building} open={obrasOpen} onToggle={() => setObrasOpen(previous => !previous)} collapsed={collapsed}>
            <SidebarSubLink to="/obras" label="Todas as Obras" icon={Layers} collapsed={collapsed} />
            <SidebarSubLink to="/obras?tipo=Paroquia" label="Paróquias" icon={Church} collapsed={collapsed} />
            <SidebarSubLink to="/obras?tipo=Casa" label="Casas Religiosas" icon={Home} collapsed={collapsed} />
            <SidebarSubLink to="/obras?tipo=Obra" label="Obras & Institutos" icon={Landmark} collapsed={collapsed} />
            <SidebarSubLink to="/obras/nova" label="Nova Obra" icon={Plus} collapsed={collapsed} />
          </SidebarGroup>

          {/* 5. Patrimônio Provincial */}
          <SidebarGroup label="Patrimônio" icon={Landmark} open={patrimonioOpen} onToggle={() => setPatrimonioOpen(previous => !previous)} collapsed={collapsed}>
            <SidebarSubLink to="/patrimonio" label="Visão Geral & Alertas" icon={Layers} collapsed={collapsed} />
            <SidebarSubLink to="/patrimonio?tab=imoveis" label="Imóveis & Terrenos" icon={Building} collapsed={collapsed} />
            <SidebarSubLink to="/patrimonio?tab=veiculos" label="Frota de Veículos" icon={Car} collapsed={collapsed} />
            <SidebarSubLink to="/patrimonio?tab=inventario" label="Inventário & Arte Sacra" icon={Church} collapsed={collapsed} />
            <SidebarSubLink to="/patrimonio?tab=contratos" label="Contratos & Seguros" icon={ShieldCheck} collapsed={collapsed} />
            <SidebarSubLink to="/patrimonio?tab=manutencoes" label="Vistorias & Obras" icon={Wrench} collapsed={collapsed} />
          </SidebarGroup>

          {/* 6. Hospedaria */}
          <SidebarGroup label="Hospedaria" icon={Building} open={hospedariaOpen} onToggle={() => setHospedariaOpen(previous => !previous)} collapsed={collapsed}>
            <SidebarSubLink to="/hospedagens-inscricoes" label="Inscrições" icon={ClipboardList} collapsed={collapsed} />
            <SidebarSubLink to="/hospedagens-configuracoes" label="Configurações" icon={Settings} collapsed={collapsed} />
          </SidebarGroup>

          {/* 5. Usuários */}
          {isAdmin && (
            <li>
              <NavLink
                to="/usuarios"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-[6px] transition-all duration-200 group text-[13px] font-medium border ${
                    isActive 
                      ? 'border-[#113240] bg-[#113240] text-white shadow-sm dark:border-[#226380] dark:bg-[#226380] dark:text-white' 
                      : 'border-transparent text-[#474747] dark:text-[#86868b] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#113240] dark:hover:text-white'}`
                  }
              >
                <Users className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                {!collapsed && <span className="truncate">Usuários</span>}
              </NavLink>
            </li>
          )}
        </ul>

        {/* Footer actions */}
        <div className="space-y-1 border-t border-[#e5e5ea] dark:border-white/10 pt-3">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-[6px] text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 text-[13px] font-medium cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sair do sistema</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
};

const SidebarGroup: React.FC<{
  label: string;
  icon: React.ElementType;
  open: boolean;
  onToggle: () => void;
  collapsed: boolean;
  children: React.ReactNode;
}> = ({ label, icon: Icon, open, onToggle, collapsed, children }) => (
  <li>
    <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 rounded-[6px] px-3 py-2 text-[13px] font-medium text-[#474747] transition-all hover:bg-black/5 hover:text-[#113240] dark:text-[#86868b] dark:hover:bg-white/5 dark:hover:text-white cursor-pointer">
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <><span className="flex-1 text-left">{label}</span><ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} /></>}
    </button>
    {open && !collapsed && <ul className="ml-4 mt-1 space-y-1 border-l border-[#e5e5ea] pl-2.5 dark:border-white/10">{children}</ul>}
  </li>
);

const SidebarSubLink: React.FC<{ to: string; label: string; icon: React.ElementType; collapsed: boolean }> = ({ to, label, icon: Icon, collapsed }) => {
  const location = useLocation();
  const currentFull = location.pathname + location.search;
  const isMatch = to.includes('?') 
    ? currentFull === to 
    : location.pathname === to && (!location.search || location.search === '');

  return (
    <li>
      <NavLink
        to={to}
        className={`flex items-center gap-2.5 rounded-[6px] px-2.5 py-1.5 text-xs font-medium transition-colors border ${
          isMatch
            ? 'border-[#226380]/40 bg-[#226380]/10 text-[#113240] font-semibold dark:border-[#A3C3C7]/30 dark:bg-[#226380]/25 dark:text-[#A3C3C7]'
            : 'border-transparent text-[#707070] hover:bg-black/5 hover:text-[#113240] dark:text-[#86868b] dark:hover:bg-white/5 dark:hover:text-white'
        }`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {!collapsed && <span>{label}</span>}
      </NavLink>
    </li>
  );
};

export default Sidebar;
