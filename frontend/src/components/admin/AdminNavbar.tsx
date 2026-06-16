'use client';
import { Menu, Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUnreadCount } from "@/hooks/use-notification";
import { Button } from "../ui/button";

export function AdminNavbar({ onMenuClick, onNotificationClick }: { onMenuClick: () => void; onNotificationClick?: () => void }) {
  const { data: unreadCount } = useUnreadCount();

  return (
    <header className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950 flex-shrink-0">
      <div className="flex items-center gap-3">
        <Button className="text-slate-400 hover:text-white md:hidden" onClick={onMenuClick}>
          <Menu className="w-6 h-6" />
        </Button>
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
        <button
          onClick={onNotificationClick}
          className="h-10 w-10 rounded-xl hover:bg-slate-900 flex items-center justify-center transition-colors relative text-slate-400 hover:text-white"
        >
          <Bell className="h-5 w-5" />
          {(unreadCount ?? 0) > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-slate-950">
              {(unreadCount ?? 0) > 9 ? '9+' : unreadCount ?? 0}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
