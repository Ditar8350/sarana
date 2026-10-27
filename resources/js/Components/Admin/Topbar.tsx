import React from 'react';
import { Search, Bell, Moon, Sun, Menu } from 'lucide-react';

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 h-16">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <button className="p-2 rounded-lg hover:bg-slate-100 lg:hidden" onClick={onMenuClick} aria-label="Buka menu">
          <Menu className="w-5 h-5 text-[#3F4941]" />
        </button>
        <div className="relative min-w-0 flex-1 max-w-sm">
          <input
            placeholder="Search"
            className="pl-10 pr-4 py-2 rounded-xl w-full bg-[#F9F9FF] border border-slate-200 text-sm text-[#111C2D] outline-none focus:border-[#006039]"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#3F4941]" />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-4 shrink-0">
        <button className="p-2 rounded-lg hover:bg-slate-100">
          <Bell className="w-5 h-5 text-[#3F4941]" />
        </button>

        <div className="relative">
          <button className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100">
            <div className="w-8 h-8 rounded-full bg-[#006039] text-white text-xs font-bold flex items-center justify-center">A</div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-semibold text-[#111C2D]">Admin Biro Sarana & Prasarana</div>
              <div className="text-xs text-[#3F4941]">Super Administrator</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
