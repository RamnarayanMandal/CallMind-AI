import api from '@/lib/axios-client';
import { Tool } from '../types/tool.types';

export const ToolService = {
  getAll: async (organizationId: string): Promise<Tool[]> => {
    const res = await api.get(`/tools?organizationId=${organizationId}`);
    return res.data;
  },

  create: async (data: any): Promise<Tool> => {
    const res = await api.post('/tools', data);
    return res.data;
  },

  update: async (id: string, data: any): Promise<Tool> => {
    const res = await api.patch(`/tools/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tools/${id}`);
  },

  seedEcommerce: async (organizationId: string, integrationId?: string): Promise<void> => {
    await api.post('/tools/seed-ecommerce', { organizationId, integrationId });
  },
};
