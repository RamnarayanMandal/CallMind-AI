import apiClient from '@/lib/axios-client';
import type { AdminSystemOverview, OrgUsageRow } from '@/types';

export const adminAnalyticsService = {
  /** GET /admin/analytics/overview */
  async getSystemOverview(): Promise<AdminSystemOverview> {
    const { data } = await apiClient.get<AdminSystemOverview>('/admin/analytics/overview');
    return data as unknown as AdminSystemOverview;
  },

  /** GET /admin/analytics/org-usage */
  async getOrgUsage(): Promise<OrgUsageRow[]> {
    const { data } = await apiClient.get<OrgUsageRow[]>('/admin/analytics/org-usage');
    return data as unknown as OrgUsageRow[];
  },

  /** GET /admin/analytics/org/:id/trend?days=30 */
  async getOrgTrend(
    organizationId: string,
    days = 30,
  ): Promise<Array<{ _id: string; total: number; completed: number; failed: number }>> {
    const { data } = await apiClient.get(`/admin/analytics/org/${organizationId}/trend`, {
      params: { days },
    });
    return data as any;
  },
};
