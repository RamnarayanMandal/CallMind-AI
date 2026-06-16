'use client';
import { useAuth } from "@/hooks/useAuth";
import { Search, Bell, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUnreadCount } from "@/hooks/use-notification";

export function Navbar({ onMenuClick, onNotificationClick }: { onMenuClick: () => void; onNotificationClick?: () => void }) {
  const { data: unreadCount } = useUnreadCount();

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 flex items-center gap-4 justify-between">
      <button 
        onClick={onMenuClick}
        className="h-10 w-10 rounded-xl hover:bg-accent flex items-center justify-center md:hidden transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex-1 max-w-md relative hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search for customers or calls..." 
          className="pl-10 h-10 bg-accent/30 border-transparent focus:bg-background transition-all"
        />
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onNotificationClick}
          className="h-10 w-10 rounded-xl hover:bg-accent flex items-center justify-center transition-colors relative"
        >
          <Bell className="h-5 w-5" />
          {(unreadCount ?? 0) > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1 border-2 border-background">
              {(unreadCount ?? 0) > 9 ? '9+' : unreadCount ?? 0}
            </span>
          ) : (
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-muted-foreground/30 border-2 border-background" />
          )}
        </button>
      </div>
    </header>
  );
}
