'use client';
import { Menu, Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AdminNavbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button className="text-slate-400 hover:text-white md:hidden" onClick={onMenuClick}>
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-white font-bold tracking-tight hidden md:block">Super Admin</span>
      </div>

      <div className="flex-1 max-w-md relative hidden sm:block mx-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input 
          placeholder="Search global records..." 
          className="pl-10 h-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:bg-slate-950 focus:border-slate-700 transition-all"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="h-10 w-10 rounded-xl hover:bg-slate-900 flex items-center justify-center transition-colors relative text-slate-400 hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-blue-500 border-2 border-slate-950" />
        </button>
      </div>
    </header>
  );
}
