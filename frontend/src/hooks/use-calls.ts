import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callService, CreateCallPayload } from '@/services/call.service';
import { Call } from '@/types';
import { toast } from 'sonner';

export function useCalls(organizationId: string, page = 1, limit = 10, search?: string, status?: string) {
  const queryClient = useQueryClient();

  const callsQuery = useQuery({
    queryKey: ['calls', organizationId, page, limit, search, status],
    queryFn: () => callService.getAll(organizationId, page, limit, search, status),
    enabled: !!organizationId,
    // Poll every 10 seconds if there are in-progress calls
    refetchInterval: (query) => {
      const calls = query.state.data?.data || [];
      const hasInProgress = calls.some(c => c.status === 'in-progress');
      return hasInProgress ? 10000 : false;
    },
  });

  const createCallMutation = useMutation({
    mutationFn: (payload: CreateCallPayload) => callService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls', organizationId] });
      toast.success('Call scheduled');
    },
  });

  const executeCallMutation = useMutation({
    mutationFn: (id: string) => callService.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls', organizationId] });
      toast.success('Call execution triggered');
    },
  });

  return {
    calls: (callsQuery.data?.data || []) as Call[],
    meta: callsQuery.data?.meta,
    isLoading: callsQuery.isLoading,
    scheduleCall: createCallMutation.mutate,
    isScheduling: createCallMutation.isPending,
    executeCall: executeCallMutation.mutate,
    isExecuting: executeCallMutation.isPending,
  };
}
