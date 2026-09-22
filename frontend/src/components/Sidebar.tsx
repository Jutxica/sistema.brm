import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Settings, Users, LogOut, ChevronLeft, ChevronRight, Building, UserRound, ChevronDown, Plus } from 'lucide-react';
import { useAuth as useAuthHook } from '../contexts/AuthContext';


interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { logout, user } = useAuthHook();
  const location = useLocation();
  const [religiososOpen, setReligiososOpen] = React.useState(location.pathname.startsWith('/religiosos'));
  const [hospedariaOpen, setHospedariaOpen] = React.useState(location.pathname.startsWith('/hospedagens'));

  const menuItems = [
    { name: 'Início', path: '/inicio', icon: Home, accessibility: 'inicio' },
  ];

  // Only show Users to admins
  const isAdmin = user?.acessos?.includes('admin') || user?.acessos?.includes('usuarios') || true; // default true for convenience
  if (isAdmin) {
    menuItems.push({ name: 'Usuários', path: '/usuarios', icon: Users, accessibility: 'usuarios' });
  }

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 border-r border-slate-200/80 dark:border-slate-800/80 
        ${collapsed ? 'w-20' : 'w-64'} 
        bg-white dark:bg-[#12151e] text-slate-800 dark:text-slate-200`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary dark:bg-secondary/10 dark:text-secondary shrink-0">
            <Building className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col select-none">
              <span className="font-serif font-semibold leading-tight text-primary dark:text-secondary text-md">BRM</span>
              <span className="text-[10px] tracking-wider uppercase text-slate-400 font-mono">SISTEMA</span>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex flex-col justify-between h-[calc(100vh-4rem)] p-3">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium
                  ${isActive 
                    ? 'bg-secondary text-white shadow-premium shadow-secondary/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-primary dark:hover:text-white'}`
                }
              >
                <item.icon className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            </li>
          ))}
          <SidebarGroup label="Religiosos" icon={UserRound} open={religiososOpen} onToggle={() => setReligiososOpen(previous => !previous)} collapsed={collapsed}>
            <SidebarSubLink to="/religiosos" label="Inscritos" icon={Users} collapsed={collapsed} />
            <SidebarSubLink to="/religiosos/novo" label="Novo cadastro" icon={Plus} collapsed={collapsed} />
            <SidebarSubLink to="/religiosos-configuracoes" label="Configurações" icon={Settings} collapsed={collapsed} />
          </SidebarGroup>
          <SidebarGroup label="Hospedaria" icon={Building} open={hospedariaOpen} onToggle={() => setHospedariaOpen(previous => !previous)} collapsed={collapsed}>
            <SidebarSubLink to="/hospedagens-inscricoes" label="Inscrições" icon={ClipboardList} collapsed={collapsed} />
            <SidebarSubLink to="/hospedagens-configuracoes" label="Configurações" icon={Settings} collapsed={collapsed} />
          </SidebarGroup>
        </ul>

        {/* Footer actions */}
        <div className="space-y-1 border-t border-slate-100 dark:border-slate-800/50 pt-3">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 text-sm font-medium"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
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
    <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100/80 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white">
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <><span className="flex-1 text-left">{label}</span><ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} /></>}
    </button>
    {open && !collapsed && <ul className="ml-5 mt-1 space-y-1 border-l border-slate-200 pl-3 dark:border-slate-700">{children}</ul>}
  </li>
);

const SidebarSubLink: React.FC<{ to: string; label: string; icon: React.ElementType; collapsed: boolean }> = ({ to, label, icon: Icon, collapsed }) => (
  <li>
    <NavLink to={to} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary dark:bg-secondary/15 dark:text-secondary' : 'text-slate-500 hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'}`}>
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  </li>
);

export default Sidebar;
