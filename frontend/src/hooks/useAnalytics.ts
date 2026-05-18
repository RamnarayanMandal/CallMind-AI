import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';

export function useAnalytics(organizationId: string) {
  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', organizationId],
    queryFn: () => analyticsService.getStats(organizationId),
    enabled: !!organizationId,
  });

  const recentCallsQuery = useQuery({
    queryKey: ['recent-calls', organizationId],
    queryFn: () => analyticsService.getRecentCalls(organizationId),
    enabled: !!organizationId,
  });

  return {
    stats: statsQuery.data,
    recentCalls: recentCallsQuery.data || [],
    isLoading: statsQuery.isLoading || recentCallsQuery.isLoading,
    refetch: () => {
      statsQuery.refetch();
      recentCallsQuery.refetch();
    }
  };
}
