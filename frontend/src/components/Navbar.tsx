import React, { useState } from 'react';
import { Sun, Moon, Bell, User as UserIcon, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface NavbarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarCollapsed, setSidebarCollapsed, title }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 border-b border-[#e5e5ea] dark:border-white/10 bg-[#fbfbfd]/75 dark:bg-[#161b22]/75 backdrop-blur-xl">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 rounded-[6px] hover:bg-black/5 dark:hover:bg-white/10 text-[#707070] dark:text-[#86868b] md:hidden transition-colors cursor-pointer"
          title="Alternar menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-[4px] border border-[#226380]/20 bg-[#226380]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#226380] dark:border-[#A3C3C7]/20 dark:bg-[#A3C3C7]/10 dark:text-[#A3C3C7]">
            Painel
          </span>
          <h1 className="font-cinzel text-[17px] font-bold text-[#113240] dark:text-white leading-tight tracking-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="Alternar tema"
          className="p-2 rounded-[6px] text-[#707070] dark:text-[#86868b] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/10"
        >
          {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-[#F2C894]" /> : <Moon className="w-4.5 h-4.5 text-[#113240]" />}
        </button>

        {/* Notifications */}
        <button
          title="Notificações"
          className="p-2 rounded-[6px] text-[#707070] dark:text-[#86868b] hover:bg-black/5 dark:hover:bg-white/10 transition-colors relative cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/10"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#226380] rounded-full" />
        </button>

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
              <div className="absolute right-0 mt-2 w-60 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-[#1c2128]/95 backdrop-blur-xl shadow-lg p-2 z-40">
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
