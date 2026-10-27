import React, { useState } from 'react';
import { X } from 'lucide-react';
import Sidebar from '@/Components/Admin/Sidebar';
import Topbar from '@/Components/Admin/Topbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F9FF] text-[#111C2D] font-sans">
      <div className="flex">
        
        {/* Desktop sidebar */}
        <aside className="w-72 shrink-0 hidden lg:block h-screen sticky top-0 border-r border-[#004A2C] bg-[#006039]">
          {/* overflow-y-auto dipindahkan ke sini, HAPUS p-6 agar scrollbar di ujung */}
          <div className="h-full overflow-y-auto custom-scrollbar">
            <Sidebar />
          </div>
        </aside>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-[#111C2D]/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            
            {/* Ubah bg-white menjadi bg-[#006039] */}
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#006039] shadow-xl">
              <button
                className="absolute top-4 right-2 z-50 p-2 rounded-lg hover:bg-white/10"
                onClick={() => setSidebarOpen(false)}
                aria-label="Tutup menu"
              >
                {/* Ubah warna ikon X menjadi putih */}
                <X className="w-6 h-6 text-white" />
              </button>
              
              {/* Tambahkan pt-12 agar tombol silang tidak menimpa konten header sidebar */}
              <div className="h-full overflow-y-auto pt-12">
                <Sidebar />
              </div>
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 min-h-screen">
          <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/70">
            <div className="px-4 sm:px-6">
              <Topbar onMenuClick={() => setSidebarOpen(true)} />
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}