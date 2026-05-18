import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/conversation.service';

export function useAnalytics(organizationId: string) {
  return useQuery({
    queryKey: ['analytics', organizationId],
    queryFn: () => analyticsService.getDashboard(organizationId),
    enabled: !!organizationId,
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 mins
  });
}
