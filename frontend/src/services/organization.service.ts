import apiClient from '@/lib/axios-client';
import type { Organization, ApiResponse, PaginatedData } from '@/types';

export interface CreateOrgPayload {
  name: string;
  about: string;
  productInfo: string;
  website?: string;
  industry?: string;
  targetAudience?: string;
  businessGoals?: string;
  supportInstructions?: string;
  tone?: string;
}

export const organizationService = {
  async getAll(page = 1, limit = 10): Promise<PaginatedData<Organization>> {
    const { data } = await apiClient.get<PaginatedData<Organization>>('/organizations', {
      params: { page, limit },
    });
    return data;
  },

  async getOne(id: string): Promise<Organization> {
    const { data } = await apiClient.get<Organization>(`/organizations/${id}`);
    return data;
  },

  async create(payload: CreateOrgPayload): Promise<Organization> {
    const { data } = await apiClient.post<Organization>('/organizations', payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateOrgPayload>): Promise<Organization> {
    const { data } = await apiClient.patch<Organization>(`/organizations/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/organizations/${id}`);
  },
};
