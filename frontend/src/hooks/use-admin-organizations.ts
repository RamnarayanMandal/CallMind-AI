import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { AdminOrgBilling, AdminOrgDetail } from '@/types/admin.types';

export const ADMIN_ORG_KEYS = {
  all: ['admin-organizations'] as const,
  list: () => [...ADMIN_ORG_KEYS.all, 'list'] as const,
  detail: (id: string) => [...ADMIN_ORG_KEYS.all, 'detail', id] as const,
};

export const useAdminOrganizations = () => {
  return useQuery<AdminOrgBilling[], Error>({
    queryKey: ADMIN_ORG_KEYS.list(),
    queryFn: () => adminService.getOrganizations(),
  });
};

export const useAdminOrganization = (id: string) => {
  return useQuery<AdminOrgDetail, Error>({
    queryKey: ADMIN_ORG_KEYS.detail(id),
    queryFn: () => adminService.getOrganizationById(id),
    enabled: !!id,
  });
};

export const MY_ORG_KEYS = {
  all: ['my-organizations'] as const,
  list: (params?: any) => [...MY_ORG_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...MY_ORG_KEYS.all, 'detail', id] as const,
};

export const useMyOrganizations = (params?: { page?: number; limit?: number }) => {
  return useQuery<{ data: AdminOrgBilling[]; meta: any }, Error>({
    queryKey: MY_ORG_KEYS.list(params),
    queryFn: () => adminService.getMyOrganizations(params),
  });
};

export const useMyOrganization = (id: string) => {
  return useQuery<AdminOrgDetail, Error>({
    queryKey: MY_ORG_KEYS.detail(id),
    queryFn: () => adminService.getMyOrganizationById(id),
    enabled: !!id,
  });
};

export const useCreateMyOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminService.createMyOrganization(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_ORG_KEYS.all }),
  });
};

export const useUpdateMyOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.updateMyOrganization(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_ORG_KEYS.all }),
  });
};

export const useDeleteMyOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteMyOrganization(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_ORG_KEYS.all }),
  });
};