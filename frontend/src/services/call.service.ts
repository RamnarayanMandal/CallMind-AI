import apiClient from '@/lib/axios-client';
import type { Call, ApiResponse, PaginatedData } from '@/types';

export interface CreateCallPayload {
  customerId: string; agentId: string; organizationId: string;
  phoneNumber: string; scheduledAt?: string;
}

export const callService = {
  async getAll(organizationId: string, page = 1, limit = 10, search?: string, status?: string): Promise<PaginatedData<Call>> {
    const response = await apiClient.get<PaginatedData<Call>>('/calls', {
      params: { organizationId, page, limit, search, status },
    });
    return response as any;
  },

  async getOne(id: string): Promise<Call> {
    const response = await apiClient.get<Call>(`/calls/${id}`);
    return (response as any).data;
  },

  async create(payload: CreateCallPayload): Promise<Call> {
    const response = await apiClient.post<Call>('/calls', payload);
    return (response as any).data;
  },

  async execute(id: string): Promise<void> {
    await apiClient.post(`/calls/${id}/execute`);
  },

  async updateOutcome(id: string, outcome: string): Promise<Call> {
    const response = await apiClient.patch<Call>(`/calls/${id}/outcome`, { outcome });
    return (response as any).data;
  },
};
