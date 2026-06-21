'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Settings, Wrench } from 'lucide-react';

const tabs = [
  { name: 'Settings', href: '', icon: Settings },
  { name: 'AI Tools', href: '/tools', icon: Wrench },
];

export default function AgentDetailLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const agentId = params?.id as string;
  const base = `/agents/${agentId}`;

  return (
    <div className="space-y-6">
      <div className="border-b border-border/50">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => {
            const href = `${base}${tab.href}`;
            const isActive = tab.href === '' ? pathname === base : pathname.startsWith(href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={href}
                className={cn(
                  'flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}
