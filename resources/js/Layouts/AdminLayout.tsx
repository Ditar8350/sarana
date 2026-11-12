import React, { useState } from 'react';
import { X } from 'lucide-react';
import Sidebar from '@/Components/Admin/Sidebar';
import Topbar from '@/Components/Admin/Topbar';

interface AdminLayoutProps {
  children: React.ReactNode;
  showGlobalSearch?: boolean;
}

export default function AdminLayout({ children, showGlobalSearch = false }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fungsi JavaScript untuk mendeteksi klik tombol hamburger dan toggle class 'collapsed'
  const handleToggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setIsCollapsed((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  const handleExpandSidebar = () => {
    setIsCollapsed(false);
  };

  return (
    <div className="h-screen overflow-hidden bg-[#F4F7F6] text-[#111C2D] font-sans antialiased">
      <div className="flex h-screen overflow-hidden relative">
        
        {/* Desktop Sidebar: Lebar optimal 236px (rapi dan lega), mengecil jadi 68px saat collapsed */}
        <aside
          id="main-sidebar"
          className={`sidebar shrink-0 hidden lg:block h-screen z-30 border-r border-[#004A2C] bg-[#006039] transition-all duration-300 ease-in-out ${
            isCollapsed ? 'collapsed w-[68px]' : 'w-[236px]'
          }`}
        >
          <div className="h-full overflow-y-auto custom-scrollbar overflow-x-hidden">
            <Sidebar isCollapsed={isCollapsed} onExpand={handleExpandSidebar} />
          </div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-[#111C2D]/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            
            <aside className="absolute inset-y-0 left-0 w-[240px] max-w-[85vw] bg-[#006039] shadow-xl z-50">
              <button
                className="absolute top-4 right-2 z-50 p-2 rounded-lg hover:bg-white/10 text-white cursor-pointer"
                onClick={() => setSidebarOpen(false)}
                aria-label="Tutup menu"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="h-full overflow-y-auto pt-12">
                <Sidebar isCollapsed={false} />
              </div>
            </aside>
          </div>
        )}

        {/* Main Content Area: Topbar tetap di tempat, area konten di bawahnya yang di-scroll */}
        <div className="main-content-area flex-1 min-w-0 h-screen flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
          <header className="shrink-0 z-30 bg-white border-b border-slate-200/85 shadow-2xs">
            <div className="px-3.5 sm:px-5 lg:px-6">
              <Topbar onMenuClick={handleToggleSidebar} isCollapsed={isCollapsed} showSearch={showGlobalSearch} />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 lg:px-6 lg:py-5 scroll-smooth">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
