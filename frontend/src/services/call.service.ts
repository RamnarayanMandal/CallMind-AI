import { apiClient } from '@/lib/axios-client';
import { Call } from '@/types';

// Matches the backend TransformInterceptor response: { success, data, meta }
interface WrapperResponse<T, M = any> {
  success: boolean;
  data: T;
  meta?: M;
}

export interface CreateCallPayload {
  agentId: string;
  customerId: string;
  organizationId: string;
  phoneNumber: string;
  scheduledAt?: string;
}

export const callService = {
  // Get calls with optional filtering
  getCalls: async (options: {
    organizationId?: string;
    status?: string;
    outcome?: string;
    limit?: number;
    page?: number;
    search?: string;
  } = {}): Promise<{ calls: Call[]; total: number }> => {
    const params = new URLSearchParams();
    if (options.organizationId) params.append('organizationId', options.organizationId);
    if (options.status) params.append('status', options.status);
    if (options.outcome) params.append('outcome', options.outcome);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.page) params.append('page', options.page.toString());
    if (options.search) params.append('search', options.search);

    const result = await apiClient.get(`/calls?${params.toString()}`) as WrapperResponse<Call[], { total: number }>;
    return { calls: result.data, total: result.meta?.total ?? 0 };
  },

  // Alias for consistent naming with other services
  getAll: async (organizationId: string, page = 1, limit = 10, search?: string, status?: string): Promise<{ data: Call[]; meta: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean } }> => {
    const result = await apiClient.get('/calls', { params: { organizationId, page, limit, search, status } }) as WrapperResponse<Call[], { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean }>;
    return { data: result.data, meta: result.meta! };
  },

  // Get a specific call by ID
  getCallById: async (callId: string): Promise<Call> => {
    const { data } = await apiClient.get(`/calls/${callId}`);
    return data;
  },

  // Initiate a new call
  create: async (data: {
    agentId: string;
    customerId: string;
    organizationId: string;
    phoneNumber: string;
    scheduledAt?: string;
  }): Promise<Call> => {
    const { data: result } = await apiClient.post(`/calls`, data);
    return result;
  },

  // Execute a call (trigger the actual outbound call)
  execute: async (callId: string): Promise<void> => {
    await apiClient.post(`/calls/${callId}/execute`);
  },

  // Get recording URL for a call (returns a blob URL for playback)
  getRecordingUrl: async (callId: string): Promise<string> => {
    const response = await apiClient.get(`/calls/${callId}/recording`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  },

  // Get call history with conversations
  getCallHistory: async (organizationId: string, page = 1, limit = 20): Promise<{ data: any[]; meta: any }> => {
    const result = await apiClient.get('/calls/history/list', {
      params: { organizationId, page, limit },
    }) as WrapperResponse<any[], any>;
    return { data: result.data, meta: result.meta ?? {} };
  },

  // Delete a call (and optionally its recording)
  deleteCall: async (callId: string): Promise<void> => {
    await apiClient.delete(`/calls/${callId}`);
  },
};