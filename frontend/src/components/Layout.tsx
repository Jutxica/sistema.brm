import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface LayoutProps {
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ title = 'Sistema BRM' }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0d1117] flex transition-colors duration-300 relative">
      {/* Sidebar navigation */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main viewport */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative
          ${sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}
      >
        {/* Header toolbar */}
        <Navbar 
          sidebarCollapsed={sidebarCollapsed} 
          setSidebarCollapsed={setSidebarCollapsed} 
          title={title} 
        />

        {/* Dynamic page contents - Apple cathedral of space */}
        <main className="flex-1 px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default Layout;
