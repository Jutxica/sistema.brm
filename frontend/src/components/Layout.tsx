import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface LayoutProps {
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ title = 'Sistema Conventinho' }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#061320] flex transition-colors duration-300 relative overflow-hidden">
      {/* Background blobs for premium glassmorphism blur effect */}
      <div className="absolute top-[-10%] right-[-5%] w-[45rem] h-[45rem] rounded-full bg-secondary/8 dark:bg-secondary/15 blur-[130px] pointer-events-none animate-float-1 z-0" />
      <div className="absolute bottom-[-15%] left-[5%] w-[38rem] h-[38rem] rounded-full bg-accent/8 dark:bg-accent/15 blur-[120px] pointer-events-none animate-float-2 z-0" />

      {/* Sidebar navigation */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main viewport */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10
          ${sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}
      >
        {/* Header toolbar */}
        <Navbar 
          sidebarCollapsed={sidebarCollapsed} 
          setSidebarCollapsed={setSidebarCollapsed} 
          title={title} 
        />

        {/* Dynamic page contents */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default Layout;
