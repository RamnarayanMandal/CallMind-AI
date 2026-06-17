'use client';
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Activity,
  Server,
  Settings,
  PieChart,
  X,
  LogOut,
  Shield,
  Key,
  Webhook,
  Globe,
  Building2,
  MessageSquare,
  Bot,
  Phone
} from "lucide-react";
import { Button } from "../ui/button";

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { name: 'My Organizations', href: '/admin/my-organizations', icon: Building2 },
  {name:"Call History",herf:"/admin/call-history", icon:Phone},
  {name: 'My Agents', href: '/admin/agents', icon: Bot },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Contact Messages', href: '/admin/contact-us', icon: MessageSquare },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Analytics', href: '/admin/analytics', icon: PieChart },
  { name: 'AI Monitoring', href: '/admin/monitoring', icon: Activity },
  { name: 'Infrastructure', href: '/admin/infrastructure', icon: Server },
  { name: 'Audit Logs', href: '/admin/audit', icon: Shield },
  { name: 'API Keys', href: '/admin/api-keys', icon: Key },
  { name: 'Webhooks', href: '/admin/webhooks', icon: Webhook },
  { name: 'GDPR', href: '/admin/gdpr', icon: Globe },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Admin Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800 bg-slate-950 flex-shrink-0 flex flex-col transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link href="/admin" onClick={onClose} className="flex items-center gap-3">
            <img src="/logo.png" alt="CallMind AI" className="h-8 w-auto" />
          </Link>
          <Button className="md:hidden text-slate-400 hover:text-white" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-500' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-slate-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4 mt-auto">
          <div className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-400 flex items-center justify-between mb-2 border border-slate-800">
            <span>System Status</span>
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Online
            </span>
          </div>

          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold border border-blue-500/20">
              {user?.name?.[0].toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
