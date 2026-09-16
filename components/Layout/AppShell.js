"use client";
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { Menu, Home } from 'lucide-react';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  const isLoginPage = pathname === '/login';
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#f8faf7]">
      {/* Sidebar — fixed on mobile, sticky on desktop */}
      <Sidebar isSidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#092b1f] px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold">Heaven Homes</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="text-white/80 hover:text-white p-1"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}