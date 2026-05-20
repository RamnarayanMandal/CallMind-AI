'use client';
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Phone,
  Settings,
  LogOut,
  Bot,
  PieChart,
  Calendar,
  Building2
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Agents', href: '/agents', icon: Bot },
  // { name: 'Analytics', href: '/analytics', icon: PieChart },
  { name: 'Campaigns', href: '/campaigns', icon: Calendar },
  { name: 'Organization', href: '/organization', icon: Building2 },
  // { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className="w-[280px] h-screen bg-card border-r border-border flex flex-col">
      <div className="p-8">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <img src="/logo.png" alt="CallMind AI" className="h-15 w-auto" />
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "" : "text-muted-foreground group-hover:text-foreground")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t mt-auto space-y-4">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="h-9 w-9 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">
            {user?.name?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
