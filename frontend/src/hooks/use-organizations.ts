import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService, CreateOrgPayload } from '@/services/organization.service';
import { Organization } from '@/types';
import { toast } from 'sonner';

export function useOrganizations(page = 1, limit = 10) {
  const queryClient = useQueryClient();

  const organizationsQuery = useQuery({
    queryKey: ['organizations', page, limit],
    queryFn: () => organizationService.getAll(page, limit),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateOrgPayload) => organizationService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create organization');
    },
  });

  return {
    organizations: (organizationsQuery.data?.data || []) as Organization[],
    meta: organizationsQuery.data?.meta,
    isLoading: organizationsQuery.isLoading,
    createOrganization: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: ['organization', id],
    queryFn: () => organizationService.getOne(id),
    enabled: !!id,
  });
}
