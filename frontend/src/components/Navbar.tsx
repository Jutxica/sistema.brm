import React, { useCallback, useEffect, useState } from 'react';
import { Sun, Moon, Bell, User as UserIcon, LogOut, Menu, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface TaskReminder {
  id: string;
  titulo: string;
  mensagem: string;
  criada_em: string;
  lida_em: string | null;
}

interface NavbarProps {
  mobileNavigationOpen: boolean;
  onMobileMenuToggle: () => void;
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ mobileNavigationOpen, onMobileMenuToggle, title }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<TaskReminder[]>([]);
  const [notificationError, setNotificationError] = useState('');

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('patrimonio_tarefas_notificacoes')
      .select('id, titulo, mensagem, criada_em, lida_em')
      .order('criada_em', { ascending: false })
      .limit(10);
    if (error) {
      console.error('Falha ao carregar notificações de tarefas:', error);
      setNotificationError('Não foi possível carregar as notificações.');
      return;
    }
    setNotificationError('');
    setNotifications((data || []) as TaskReminder[]);
  }, [user?.id]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadNotifications(), 0);
    const timer = window.setInterval(() => void loadNotifications(), 60_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [loadNotifications]);

  const markAsRead = async (notification: TaskReminder) => {
    if (!user?.id || notification.lida_em) return;
    const { error } = await supabase
      .from('patrimonio_tarefas_notificacoes')
      .update({ lida_em: new Date().toISOString() })
      .eq('id', notification.id)
      .eq('usuario_id', user.id);
    if (error) {
      console.error('Falha ao marcar notificação como lida:', error);
      setNotificationError('Não foi possível atualizar esta notificação.');
      return;
    }
    setNotifications(current => current.map(item =>
      item.id === notification.id ? { ...item, lida_em: new Date().toISOString() } : item,
    ));
  };

  const openReminder = async (notification: TaskReminder) => {
    await markAsRead(notification);
    setNotificationOpen(false);
    navigate('/patrimonio/tarefas');
  };

  const unreadCount = notifications.filter(notification => !notification.lida_em).length;
  const routeTitles: Record<string, string> = {
    '/inicio': 'Visão geral',
    '/meu-perfil': 'Meu perfil',
    '/anuario': 'Anuário dos Confrades',
    '/religiosos': 'Religiosos',
    '/estatisticas-brm': 'Estatísticas BRM',
    '/documentos': 'Documentos oficiais',
    '/secretaria': 'Secretaria Provincial',
    '/secretaria/arquivo': 'Arquivo confidencial',
    '/agenda': 'Agenda & eventos',
    '/secretaria-configuracoes': 'Configurações da Secretaria',
    '/religiosos/novo': 'Novo cadastro',
    '/religiosos-configuracoes': 'Configurações de religiosos',
    '/obras': 'Comunidades & obras',
    '/obras/nova': 'Nova obra',
    '/patrimonio': 'Patrimônio',
    '/patrimonio/tarefas': 'Tarefas do Patrimônio',
    '/patrimonio/envios-secretaria': 'Envios à Secretaria',
    '/hospedagens-inscricoes': 'Hospedaria',
    '/hospedagens-configuracoes': 'Configurações da hospedaria',
    '/usuarios': 'Usuários e acessos',
    '/institucional': 'Institucional',
  };
  const pageTitle = routeTitles[location.pathname]
    || (location.pathname.startsWith('/religiosos/editar/') ? 'Editar cadastro' : undefined)
    || (location.pathname.startsWith('/obras/editar/') ? 'Editar obra' : undefined)
    || (location.pathname.startsWith('/patrimonio/') ? 'Patrimônio' : undefined)
    || title;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e5e5ea] bg-white/95 px-4 backdrop-blur-sm dark:border-white/10 dark:bg-[#161b22]/95 sm:px-6 print:hidden">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#52636a] transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#226380] dark:text-[#a3aaad] dark:hover:bg-white/10 md:hidden"
          aria-label="Abrir navegação"
          aria-controls="administrative-sidebar"
          aria-expanded={mobileNavigationOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden h-7 w-1 shrink-0 rounded-full bg-[#226380] sm:block" />
          <h1 className="truncate text-[15px] font-semibold tracking-tight text-[#17333d] dark:text-white sm:text-base">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          title="Alternar tema"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#52636a] transition-colors hover:bg-slate-100 dark:text-[#a3aaad] dark:hover:bg-white/10"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-[#F2C894]" /> : <Moon className="h-4 w-4 text-[#113240]" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            title="Notificações"
            aria-label={`Notificações${unreadCount ? `, ${unreadCount} não lidas` : ''}`}
            aria-expanded={notificationOpen}
            onClick={() => {
              setNotificationOpen(open => !open);
              void loadNotifications();
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#52636a] transition-colors hover:bg-slate-100 dark:text-[#a3aaad] dark:hover:bg-white/10"
          >
              <Bell className="h-4 w-4" />
            {unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-4 h-4 rounded-full bg-rose-600 px-1 text-[9px] font-bold leading-4 text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>

          {notificationOpen && (
            <>
              <button aria-label="Fechar notificações" className="fixed inset-0 z-30 cursor-default" onClick={() => setNotificationOpen(false)} />
              <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-[#1c2128]">
                <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                  <p className="text-sm font-semibold text-[#113240] dark:text-white">Lembretes de tarefas</p>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Avisos das atividades atribuídas a você</p>
                </div>
                {notificationError ? (
                  <p role="alert" className="p-4 text-xs text-rose-700 dark:text-rose-300">{notificationError}</p>
                ) : notifications.length ? (
                  <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                    {notifications.map(notification => (
                      <li key={notification.id}>
                        <button type="button" onClick={() => void openReminder(notification)} className={`w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 ${notification.lida_em ? '' : 'bg-[#226380]/5'}`}>
                          <span className="flex items-start justify-between gap-3">
                            <span>
                              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">{notification.titulo}</span>
                              <span className="mt-1 block text-xs text-slate-600 dark:text-slate-300">{notification.mensagem}</span>
                              <span className="mt-1.5 block text-[10px] text-slate-400">{new Date(notification.criada_em).toLocaleString('pt-BR')}</span>
                            </span>
                            {notification.lida_em && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-5 text-center text-xs text-slate-500 dark:text-slate-400">Você não tem lembretes de prazo.</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="w-px h-5 bg-[#e5e5ea] dark:bg-white/10 mx-1" />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1 pl-1.5 pr-2.5 rounded-[6px] border border-transparent hover:border-slate-200 dark:hover:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-[6px] bg-[#113240]/10 text-[#113240] dark:bg-[#226380]/20 dark:text-[#A3C3C7] border border-black/5 dark:border-white/10">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <span className="hidden sm:inline text-xs font-medium text-[#113240] dark:text-white">
              {user?.nome || 'Usuário'}
            </span>
          </button>

          {profileDropdownOpen && (
            <>
              {/* Overlay to close */}
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-60 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2128] shadow-lg p-2 z-40">
                <div className="px-3 py-2.5 border-b border-[#e5e5ea] dark:border-white/10">
                  <p className="text-xs font-semibold text-[#113240] dark:text-white truncate">{user?.nome}</p>
                  <p className="text-[11px] text-[#707070] dark:text-[#86868b] truncate mt-0.5">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-left rounded-[6px] text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-medium mt-1 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair do sistema</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
