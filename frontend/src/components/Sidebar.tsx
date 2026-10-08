import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, ClipboardList, Settings, Users, LogOut, ChevronLeft, ChevronRight, 
  Building, UserRound, ChevronDown, Plus, Church, Landmark, Layers, BarChart3,
  FileText, Calendar, Car, ShieldCheck, Wrench, History, Archive, Send, LayoutDashboard, X
} from 'lucide-react';
import { useAuth as useAuthHook, hasModuleAccess } from '../contexts/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const useRouteExpanded = (routeIsActive: boolean): [boolean, () => void] => {
  const [override, setOverride] = React.useState<boolean | null>(null);
  return [
    override ?? routeIsActive,
    () => setOverride(previous => !(previous ?? routeIsActive)),
  ];
};

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { logout, user } = useAuthHook();
  const location = useLocation();
  const secretariaRouteActive = location.pathname.startsWith('/secretaria')
    || location.pathname.startsWith('/documentos')
    || location.pathname.startsWith('/agenda');
  const [secretariaOpen, toggleSecretariaOpen] = useRouteExpanded(secretariaRouteActive);
  const [religiososOpen, toggleReligiososOpen] = useRouteExpanded(
    location.pathname.startsWith('/religiosos') || location.pathname.startsWith('/estatisticas-brm'),
  );
  const [obrasOpen, toggleObrasOpen] = useRouteExpanded(location.pathname.startsWith('/obras'));
  const [patrimonioOpen, togglePatrimonioOpen] = useRouteExpanded(location.pathname.startsWith('/patrimonio'));
  const [hospedariaOpen, toggleHospedariaOpen] = useRouteExpanded(location.pathname.startsWith('/hospedagens'));

  const canAccessInicio = hasModuleAccess(user, 'inicio');
  const canAccessReligiosos = hasModuleAccess(user, 'religiosos');
  const canAccessSecretaria = hasModuleAccess(user, 'secretaria');
  const canAccessObras = hasModuleAccess(user, 'obras');
  const canAccessPatrimonio = hasModuleAccess(user, 'patrimonio');
  const canAccessHospedagens = hasModuleAccess(user, 'hospedagens');
  const canAccessConfiguracoes = hasModuleAccess(user, 'configuracoes');
  const canAccessUsuarios = hasModuleAccess(user, 'usuarios');
  const canAccessArquivoSecretaria = Boolean(user?.acessos.some(access => access === 'arquivo_secretaria' || access === 'arquivo_substituto'));

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search, setMobileOpen]);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen, setMobileOpen]);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar navegação"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px] md:hidden print:hidden"
        />
      )}
      <aside
        id="administrative-sidebar"
        aria-label="Navegação principal"
        className={`brm-sidebar fixed inset-y-0 left-0 z-50 w-[min(18rem,calc(100vw-2.5rem))] border-r border-[#dce4e2] bg-white text-[#203136] transition-[width,transform] duration-200 dark:border-[#354246] dark:bg-[#1c2427] dark:text-[#edf2f1] md:z-30 md:translate-x-0 print:hidden
          ${collapsed ? 'md:w-20' : 'md:w-64'}
          ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
      >
      {/* Brand Header */}
      <div className="brm-sidebar-brand flex items-center justify-between h-[4.25rem] px-4 border-b border-[#dce4e2] dark:border-[#354246]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center shrink-0">
            <img src="/logo-branco.png" alt="Sistema BRM" className="h-9 w-auto object-contain" />
          </div>
          {!collapsed && (
            <div className="flex flex-col select-none">
              <span className="text-[13px] font-semibold tracking-[0.08em] text-[#113240] dark:text-white uppercase">BRM</span>
              <span className="text-[10px] tracking-[0.11em] uppercase text-[#66777b] dark:text-[#a0aeaf]">Província Meridional</span>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="brm-sidebar-collapse hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-[#707070] transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-[#86868b] dark:hover:bg-white/10"
          aria-label={collapsed ? 'Expandir navegação' : 'Recolher navegação'}
          title={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#707070] transition-colors hover:bg-slate-100 dark:text-[#a3aaad] dark:hover:bg-white/10 md:hidden"
          aria-label="Fechar navegação"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex h-[calc(100dvh-4.25rem)] flex-col justify-between overflow-y-auto p-3">
        <ul className="space-y-1.5">
          {/* 1. Início */}
          {canAccessInicio && <li>
            <NavLink
              to="/inicio"
              title={collapsed ? 'Início' : undefined}
              className={({ isActive }) =>
                `brm-sidebar-link flex min-h-10 items-center gap-3 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors group ${
                  isActive
                    ? 'border-[#226380]/10 bg-[#226380] text-white shadow-sm dark:border-[#A3C3C7]/15 dark:bg-[#226380] dark:text-white'
                    : 'border-transparent text-[#52636a] hover:bg-slate-100 hover:text-[#17333d] dark:text-[#a3aaad] dark:hover:bg-white/5 dark:hover:text-white'}`
              }
            >
              <Home className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
              {!collapsed && <span className="truncate">Início</span>}
            </NavLink>
          </li>}

          {user && !canAccessPatrimonio && (
            <li>
              <SidebarSubLink to="/patrimonio/tarefas" label="Minhas tarefas" icon={ClipboardList} collapsed={collapsed} />
            </li>
          )}

          {/* 2. Religiosos */}
          {(canAccessReligiosos || canAccessConfiguracoes) && (
            <SidebarGroup label="Religiosos" icon={UserRound} open={religiososOpen} onToggle={toggleReligiososOpen} collapsed={collapsed}>
              {canAccessReligiosos && <SidebarSubLink to="/religiosos" label="Inscritos" icon={Users} collapsed={collapsed} />}
              {canAccessReligiosos && <SidebarSubLink to="/estatisticas-brm" label="Estatística BRM" icon={BarChart3} collapsed={collapsed} />}
              {canAccessReligiosos && <SidebarSubLink to="/religiosos/novo" label="Novo cadastro" icon={Plus} collapsed={collapsed} />}
              {canAccessConfiguracoes && <SidebarSubLink to="/religiosos-configuracoes" label="Configurações" icon={Settings} collapsed={collapsed} />}
            </SidebarGroup>
          )}

          {/* 3. Secretaria & Atos */}
          {(canAccessSecretaria || canAccessConfiguracoes || canAccessArquivoSecretaria) && (
            <SidebarGroup label="Secretaria & Atos" icon={FileText} open={secretariaOpen} onToggle={toggleSecretariaOpen} collapsed={collapsed}>
              {(canAccessSecretaria || canAccessArquivoSecretaria) && <SidebarSubLink to="/secretaria" label="Painel da Secretaria" icon={LayoutDashboard} collapsed={collapsed} />}
              {canAccessSecretaria && <SidebarSubLink to="/religiosos" label="Inscritos e contas" icon={Users} collapsed={collapsed} />}
              {canAccessSecretaria && <SidebarSubLink to="/documentos" label="Documentos Oficiais" icon={FileText} collapsed={collapsed} />}
              {canAccessSecretaria && <SidebarSubLink to="/agenda" label="Agenda & Eventos" icon={Calendar} collapsed={collapsed} />}
              {canAccessArquivoSecretaria && <SidebarSubLink to="/secretaria/arquivo" label="Arquivo Confidencial" icon={Archive} collapsed={collapsed} />}
              {canAccessConfiguracoes && <SidebarSubLink to="/secretaria-configuracoes" label="Configurações & Formulários" icon={Settings} collapsed={collapsed} />}
            </SidebarGroup>
          )}

          {/* 4. Comunidades & Obras */}
          {canAccessObras && (
            <SidebarGroup label="Comunidades & Obras" icon={Building} open={obrasOpen} onToggle={toggleObrasOpen} collapsed={collapsed}>
              <SidebarSubLink to="/obras" label="Todas as Obras" icon={Layers} collapsed={collapsed} />
              <SidebarSubLink to="/obras?tipo=Paroquia" label="Paróquias" icon={Church} collapsed={collapsed} />
              <SidebarSubLink to="/obras?tipo=Casa" label="Casas Religiosas" icon={Home} collapsed={collapsed} />
              <SidebarSubLink to="/obras?tipo=Obra" label="Obras & Institutos" icon={Landmark} collapsed={collapsed} />
              <SidebarSubLink to="/obras/nova" label="Nova Obra" icon={Plus} collapsed={collapsed} />
            </SidebarGroup>
          )}

          {/* 5. Patrimônio Provincial */}
          {canAccessPatrimonio && (
            <SidebarGroup label="Patrimônio" icon={Landmark} open={patrimonioOpen} onToggle={togglePatrimonioOpen} collapsed={collapsed}>
              <SidebarSubLink to="/patrimonio" label="Visão Geral & Alertas" icon={Layers} collapsed={collapsed} />
              <SidebarSubLink to="/patrimonio?tab=imoveis" label="Imóveis & Terrenos" icon={Building} collapsed={collapsed} />
              <SidebarSubLink to="/patrimonio?tab=veiculos" label="Frota de Veículos" icon={Car} collapsed={collapsed} />
              <SidebarSubLink to="/patrimonio?tab=inventario" label="Inventário & Arte Sacra" icon={Church} collapsed={collapsed} />
              <SidebarSubLink to="/patrimonio?tab=contratos" label="Contratos & Seguros" icon={ShieldCheck} collapsed={collapsed} />
              <SidebarSubLink to="/patrimonio?tab=manutencoes" label="Vistorias & Obras" icon={Wrench} collapsed={collapsed} />
              <SidebarSubLink to="/patrimonio/tarefas" label="Agenda de atividades" icon={ClipboardList} collapsed={collapsed} />
              <SidebarSubLink to="/patrimonio?tab=auditoria" label="Logs de Auditoria" icon={History} collapsed={collapsed} />
              <SidebarSubLink to="/patrimonio/envios-secretaria" label="Enviar documentos à Secretaria" icon={Send} collapsed={collapsed} />
            </SidebarGroup>
          )}

          {/* 6. Hospedaria */}
          {(canAccessHospedagens || canAccessConfiguracoes) && (
            <SidebarGroup label="Hospedaria" icon={Building} open={hospedariaOpen} onToggle={toggleHospedariaOpen} collapsed={collapsed}>
              {canAccessHospedagens && <SidebarSubLink to="/hospedagens-inscricoes" label="Inscrições" icon={ClipboardList} collapsed={collapsed} />}
              {canAccessConfiguracoes && <SidebarSubLink to="/hospedagens-configuracoes" label="Configurações" icon={Settings} collapsed={collapsed} />}
            </SidebarGroup>
          )}

          {/* 5. Usuários */}
          {canAccessUsuarios && (
            <li>
              <NavLink
                to="/usuarios"
                className={({ isActive }) =>
                  `brm-sidebar-link flex min-h-10 items-center gap-3 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors group ${
                    isActive 
                      ? 'border-[#226380]/10 bg-[#226380] text-white shadow-sm dark:border-[#A3C3C7]/15 dark:bg-[#226380] dark:text-white'
                      : 'border-transparent text-[#52636a] hover:bg-slate-100 hover:text-[#17333d] dark:text-[#a3aaad] dark:hover:bg-white/5 dark:hover:text-white'}`
                  }
              >
                <Users className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                {!collapsed && <span className="truncate">Usuários</span>}
              </NavLink>
            </li>
          )}
        </ul>

        {/* Footer actions */}
        <div className="space-y-1 border-t border-[#dce4e2] dark:border-[#354246] pt-3">
          <button
            onClick={logout}
            className="brm-sidebar-logout flex items-center gap-3 w-full px-3 py-2 rounded-[6px] text-[#80282E] hover:bg-[#80282E]/10 transition-all duration-200 text-[13px] font-medium cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sair do sistema</span>}
          </button>
        </div>
      </nav>
      </aside>
    </>
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
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? label : undefined}
      aria-expanded={open}
      title={collapsed ? label : undefined}
      className={`brm-sidebar-group-trigger flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-[#52636a] transition-colors hover:bg-slate-100 hover:text-[#17333d] dark:text-[#a3aaad] dark:hover:bg-white/5 dark:hover:text-white ${open ? 'bg-slate-100/80 dark:bg-white/5' : ''}`}
    >
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
        title={collapsed ? label : undefined}
        className={`brm-sidebar-link flex min-h-9 items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
          isMatch
            ? 'border-[#226380]/10 bg-[#226380]/10 text-[#17333d] font-semibold dark:border-[#A3C3C7]/20 dark:bg-[#226380]/25 dark:text-[#A3C3C7]'
            : 'border-transparent text-[#68777d] hover:bg-slate-100 hover:text-[#17333d] dark:text-[#a3aaad] dark:hover:bg-white/5 dark:hover:text-white'
        }`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {!collapsed && <span>{label}</span>}
      </NavLink>
    </li>
  );
};

export default Sidebar;
