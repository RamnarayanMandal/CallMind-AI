import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { AdminUser, AdminStats, AdminSubscription } from '@/types/admin.types';

export const ADMIN_KEYS = {
  all: ['admin'] as const,
  users: () => [...ADMIN_KEYS.all, 'users'] as const,
  stats: () => [...ADMIN_KEYS.all, 'stats'] as const,
  analytics: () => [...ADMIN_KEYS.all, 'analytics'] as const,
  subscriptions: () => [...ADMIN_KEYS.all, 'subscriptions'] as const,
};

export const useAdminUsers = () => {
  return useQuery<AdminUser[], Error>({
    queryKey: ADMIN_KEYS.users(),
    queryFn: () => adminService.getUsers(),
    refetchInterval: 5000, // Poll every 5 seconds for real-time demo updates
  });
};

export const useAdminStats = () => {
  return useQuery<AdminStats, Error>({
    queryKey: ADMIN_KEYS.stats(),
    queryFn: () => adminService.getDashboardStats(),
  });
};

export const useAdminAnalytics = () => {
  return useQuery<any, Error>({
    queryKey: ADMIN_KEYS.analytics(),
    queryFn: () => adminService.getAnalytics(),
  });
};

export const useAdminSubscriptions = () => {
  return useQuery<AdminSubscription[], Error>({
    queryKey: ADMIN_KEYS.subscriptions(),
    queryFn: () => adminService.getSubscriptions(),
  });
};
