import { useQuery } from '@tanstack/react-query';
import { callService } from '@/services/call.service';

export function useCallHistory(organizationId: string, page: number, limit: number) {
  return useQuery({
    queryKey: ['call-history', organizationId, page, limit],
    queryFn: () => callService.getCallHistory(organizationId, page, limit),
    enabled: !!organizationId,
  });
}
