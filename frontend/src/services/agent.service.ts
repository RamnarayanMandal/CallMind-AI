import apiClient from '@/lib/axios-client';
import type { Agent, ApiResponse, PaginatedData } from '@/types';

export interface CreateAgentPayload {
  name: string;
  gender?: string;
  tone?: string;
  language?: string;
  customInstructions?: string;
  systemPrompt?: string;
  enabledTools?: string[];
  welcomeMessage?: string;
  persona?: string;
  fallbackMessage?: string;
  businessGoal?: string;
  enableHumanEscalation?: boolean;
  enableLeadCapture?: boolean;
  enableCallTranscript?: boolean;
  maxCallDurationSeconds?: number;
  organizationId: string;
}

export const agentService = {
  async getAll(organizationId: string, page = 1, limit = 10): Promise<PaginatedData<Agent>> {
    const response = await apiClient.get<PaginatedData<Agent>>('/agents', {
      params: { organizationId, page, limit },
    });
    return response as any;
  },

  async getOne(id: string): Promise<Agent> {
    const response = await apiClient.get<Agent>(`/agents/${id}`);
    return (response as any).data;
  },

  async create(payload: CreateAgentPayload): Promise<Agent> {
    const response = await apiClient.post<Agent>('/agents', payload);
    return (response as any).data;
  },

  async update(id: string, payload: Partial<CreateAgentPayload>): Promise<Agent> {
    const response = await apiClient.patch<Agent>(`/agents/${id}`, payload);
    return (response as any).data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/agents/${id}`);
  },
};
