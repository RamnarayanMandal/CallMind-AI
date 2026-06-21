import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IntegrationService } from '../services/integration.service';
import { useAuth } from '@/hooks/useAuth';

export function useIntegrations() {
  const { user } = useAuth();
  const orgId = user?.organizationId || '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['integrations', orgId],
    queryFn: () => IntegrationService.getAll(orgId!),
    enabled: !!orgId,
  });

  const templatesQuery = useQuery({
    queryKey: ['integration-templates'],
    queryFn: () => IntegrationService.getTemplates(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => IntegrationService.create({ ...data, organizationId: orgId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations', orgId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => IntegrationService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations', orgId] }),
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => IntegrationService.testConnection(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations', orgId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => IntegrationService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations', orgId] }),
  });

  return {
    integrations: query.data || [],
    isLoading: query.isLoading,
    templates: templatesQuery.data || [],
    isLoadingTemplates: templatesQuery.isLoading,
    createIntegration: createMutation.mutateAsync,
    updateIntegration: updateMutation.mutateAsync,
    testIntegration: testMutation.mutateAsync,
    deleteIntegration: deleteMutation.mutateAsync,
  };
}
