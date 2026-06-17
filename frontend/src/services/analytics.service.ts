import apiClient from '@/lib/axios-client';
import type { DashboardStats, Call } from '@/types';

export const analyticsService = {
  async getStats(organizationId: string): Promise<DashboardStats> {
    const response = await apiClient.get<any>('/analytics/dashboard', {
      params: { organizationId },
    });
    return response.data;
  },

  async getRecentCalls(organizationId: string, limit = 10): Promise<Call[]> {
    const response = await apiClient.get<any>('/calls', {
      params: { organizationId, limit, sortBy: 'createdAt', sortOrder: 'desc' },
    });
    return response.data;
  }
};
