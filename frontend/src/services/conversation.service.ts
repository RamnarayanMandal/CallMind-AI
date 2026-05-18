import apiClient from '@/lib/axios-client';
import type { Conversation, ApiResponse, PaginatedData, DashboardStats } from '@/types';

export const conversationService = {
  async getAll(organizationId: string, page = 1, limit = 10) {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Conversation>>>('/conversations', {
      params: { organizationId, page, limit },
    });
    return data.data;
  },

  async getByCallId(callId: string): Promise<Conversation> {
    const { data } = await apiClient.get<ApiResponse<Conversation>>(`/conversations/call/${callId}`);
    return data.data;
  },

  async finalize(callId: string): Promise<Conversation> {
    const { data } = await apiClient.post<ApiResponse<Conversation>>(`/conversations/call/${callId}/finalize`);
    return data.data;
  },
};

export const analyticsService = {
  async getDashboard(organizationId: string): Promise<DashboardStats> {
    const { data } = await apiClient.get<ApiResponse<DashboardStats>>('/analytics/dashboard', {
      params: { organizationId },
    });
    return data.data;
  },
};
