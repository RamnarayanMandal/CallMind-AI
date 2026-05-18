import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentService, CreateAgentPayload } from '@/services/agent.service';
import { toast } from 'sonner';
import { Agent } from 'http';

export function useAgents(organizationId: string, page = 1, limit = 10) {
  const queryClient = useQueryClient();

  const agentsQuery = useQuery({
    queryKey: ['agents', organizationId, page, limit],
    queryFn: () => agentService.getAll(organizationId, page, limit),
    enabled: !!organizationId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateAgentPayload) => agentService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', organizationId] });
      toast.success('Agent created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create agent');
    },
  });

  return {
    agents: (agentsQuery.data || []) as Agent[],
    meta: agentsQuery.data?.meta,
    isLoading: agentsQuery.isLoading,
    createAgent: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
