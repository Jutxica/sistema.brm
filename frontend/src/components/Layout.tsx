import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface LayoutProps {
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ title = 'Sistema BRM' }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <div className="institutional-app min-h-screen bg-[#f4f6f5] dark:bg-[#141a1c] flex transition-colors duration-200 relative">
      {/* Sidebar navigation */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileNavigationOpen}
        setMobileOpen={setMobileNavigationOpen}
      />

      {/* Main viewport */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative
          ${sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'} print:pl-0`}
      >
        {/* Header toolbar */}
        <Navbar 
          mobileNavigationOpen={mobileNavigationOpen}
          onMobileMenuToggle={() => {
            setSidebarCollapsed(false);
            setMobileNavigationOpen(open => !open);
          }}
          title={title} 
        />

        {/* Dynamic page contents - Apple cathedral of space */}
        <main className="institutional-content flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-6 lg:px-9 max-w-[1520px] w-full mx-auto print:p-0 print:m-0 print:max-w-none">
          <Outlet />
        </main>

        {/* Rodapé Centralizado Oficial */}
        <footer className="w-full py-4 mt-auto border-t border-[#dce4e2] dark:border-[#354246] text-center print:hidden">
          <p className="text-[11px] text-[#66777b] dark:text-[#a0aeaf] font-sans">
            Sistema BRM · Província Brasil Meridional · © 2026
          </p>
        </footer>
      </div>
    </div>
  );
};
export default Layout;
