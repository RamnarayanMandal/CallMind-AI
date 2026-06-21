import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ToolService } from '../services/tool.service';
import { useAuth } from '@/hooks/useAuth';

export function useTools() {
  const { user } = useAuth();
  const orgId = user?.organizationId || '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tools', orgId],
    queryFn: () => ToolService.getAll(orgId!),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => ToolService.create({ ...data, organizationId: orgId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tools', orgId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ToolService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tools', orgId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ToolService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tools', orgId] }),
  });

  const seedMutation = useMutation({
    mutationFn: (integrationId?: string) => ToolService.seedEcommerce(orgId!, integrationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tools', orgId] }),
  });

  return {
    tools: query.data || [],
    isLoading: query.isLoading,
    createTool: createMutation.mutateAsync,
    updateTool: updateMutation.mutateAsync,
    deleteTool: deleteMutation.mutateAsync,
    seedEcommerceTools: seedMutation.mutateAsync,
  };
}
