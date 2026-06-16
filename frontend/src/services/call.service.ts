import { apiClient } from '@/lib/axios-client';
import { Call } from '@/types';

export interface CreateCallPayload {
  agentId: string;
  customerId: string;
  organizationId: string;
  phoneNumber?: string;
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

    const response = await apiClient.get(`/calls?${params.toString()}`);
    return response.data;
  },

  // Alias for consistent naming with other services
  getAll: async (organizationId: string, page = 1, limit = 10, search?: string, status?: string): Promise<{ data: Call[]; meta: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean } }> => {
    const response = await apiClient.get('/calls', { params: { organizationId, page, limit, search, status } });
    return response.data;
  },

  // Get a specific call by ID
  getCallById: async (callId: string): Promise<Call> => {
    const response = await apiClient.get(`/calls/${callId}`);
    return response.data;
  },

  // Initiate a new call
  create: async (data: {
    agentId: string;
    customerId: string;
    organizationId: string;
    phoneNumber?: string;
    scheduledAt?: string;
  }): Promise<Call> => {
    const response = await apiClient.post(`/calls`, data);
    return response.data;
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

  // Delete a call (and optionally its recording)
  deleteCall: async (callId: string): Promise<void> => {
    await apiClient.delete(`/calls/${callId}`);
  },
};