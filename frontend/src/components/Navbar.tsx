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
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0b1c2e]/80 backdrop-blur-md">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-serif text-lg font-semibold text-primary dark:text-slate-100 leading-tight">
          {title}
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="Alternar tema"
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>

        {/* Notifications (aesthetic) */}
        <button
          title="Notificações"
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/10 dark:bg-secondary/20 text-secondary">
              <UserIcon className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
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
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200/80 dark:border-slate-800/85 bg-white dark:bg-[#0b1c2e] shadow-premium p-1.5 z-40">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/50">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono truncate">{user?.nome}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium mt-1"
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
