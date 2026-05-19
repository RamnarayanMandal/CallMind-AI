import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentService, CreateAgentPayload } from '@/services/agent.service';
import { Agent } from '@/types';
import { toast } from 'sonner';

export function useAgents(organizationId: string, page = 1, limit = 10) {
  const queryClient = useQueryClient();

  const agentsQuery = useQuery({
    queryKey: ['agents', organizationId, page, limit],
    queryFn: () => agentService.getAll(organizationId, page, limit),
    enabled: !!organizationId,
  });

  const createAgentMutation = useMutation({
    mutationFn: (payload: CreateAgentPayload) => agentService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('AI Agent created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create agent');
    },
  });

  const updateAgentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateAgentPayload> }) =>
      agentService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update agent');
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: (id: string) => agentService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete agent');
    },
  });

  return {
    agents: (agentsQuery.data?.data || []) as Agent[],
    meta: agentsQuery.data?.meta,
    isLoading: agentsQuery.isLoading,
    createAgent: createAgentMutation.mutateAsync,
    isCreating: createAgentMutation.isPending,
    updateAgent: updateAgentMutation.mutateAsync,
    isUpdating: updateAgentMutation.isPending,
    deleteAgent: deleteAgentMutation.mutateAsync,
    refetch: agentsQuery.refetch,
  };
}
