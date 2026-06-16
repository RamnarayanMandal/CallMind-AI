import { useQuery } from '@tanstack/react-query';
import { adminAnalyticsService } from '@/services/admin-analytics.service';
import type { AdminSystemOverview, OrgUsageRow } from '@/types';

/** Hook: system-wide overview stats */
export function useAdminOverview() {
  return useQuery<AdminSystemOverview>({
    queryKey: ['admin-analytics-overview'],
    queryFn: () => adminAnalyticsService.getSystemOverview(),
    staleTime: 1000 * 60 * 2, // refresh every 2 min
    retry: 1,
  });
}

/** Hook: per-org usage breakdown */
export function useAdminOrgUsage() {
  return useQuery<OrgUsageRow[]>({
    queryKey: ['admin-analytics-org-usage'],
    queryFn: () => adminAnalyticsService.getOrgUsage(),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

/** Hook: call trend for a specific org */
export function useAdminOrgTrend(organizationId: string, days = 30) {
  return useQuery({
    queryKey: ['admin-analytics-org-trend', organizationId, days],
    queryFn: () => adminAnalyticsService.getOrgTrend(organizationId, days),
    enabled: !!organizationId,
  });
}
