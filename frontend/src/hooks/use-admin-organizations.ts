import { useQuery } from '@tanstack/react-query';
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
  list: () => [...MY_ORG_KEYS.all, 'list'] as const,
  detail: (id: string) => [...MY_ORG_KEYS.all, 'detail', id] as const,
};

export const useMyOrganizations = () => {
  return useQuery<AdminOrgBilling[], Error>({
    queryKey: MY_ORG_KEYS.list(),
    queryFn: () => adminService.getMyOrganizations(),
  });
};

export const useMyOrganization = (id: string) => {
  return useQuery<AdminOrgDetail, Error>({
    queryKey: MY_ORG_KEYS.detail(id),
    queryFn: () => adminService.getMyOrganizationById(id),
    enabled: !!id,
  });
};