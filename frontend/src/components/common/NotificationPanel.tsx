'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Bell, CheckCheck, Loader2, MessageSquare, PhoneCall, AlertTriangle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/use-notification';
import { notificationService } from '@/services/notification.service';

const typeIcons: Record<string, any> = {
  contact_submission: MessageSquare,
  call_completed: PhoneCall,
  system_alert: AlertTriangle,
  info: Info,
};

const typeColors: Record<string, string> = {
  contact_submission: 'text-blue-400 bg-blue-500/10',
  call_completed: 'text-emerald-400 bg-emerald-500/10',
  system_alert: 'text-orange-400 bg-orange-500/10',
  info: 'text-slate-400 bg-slate-500/10',
};

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const queryClient = useQueryClient();
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: unreadCount } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', { limit: 50 }],
    queryFn: () => notificationService.getAll({ limit: 50 }),
    enabled: open,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.read) markAsRead.mutate(notif._id);
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-50" />}

      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-96 bg-slate-950 border-l border-slate-800 z-50 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
            {unreadCount ? <span className="text-xs bg-blue-500 text-white rounded-full px-2 py-0.5">{unreadCount}</span> : null}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount ? (
              <button onClick={() => markAllAsRead.mutate()} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            ) : null}
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100%-64px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : !data?.notifications?.length ? (
            <div className="text-center py-12 text-slate-500">
              <Bell className="w-10 h-10 mx-auto mb-3 text-slate-700" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {data.notifications.map((notif: any) => {
                const Icon = typeIcons[notif.type] || Info;
                const colorClass = typeColors[notif.type] || typeColors.info;
                return (
                  <button
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left px-4 py-3.5 hover:bg-slate-900/50 transition-colors ${!notif.read ? 'bg-blue-950/20' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${notif.read ? 'text-slate-300' : 'text-white font-medium'}`}>{notif.title}</p>
                          {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-slate-600 mt-1">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
