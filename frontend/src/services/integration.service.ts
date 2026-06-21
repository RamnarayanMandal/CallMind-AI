import api from '@/lib/axios-client';
import { Integration, IntegrationTemplate } from '../types/integration.types';

export const IntegrationService = {
  getTemplates: async (): Promise<IntegrationTemplate[]> => {
    const res = await api.get('/integrations/templates');
    return res.data;
  },

  getAll: async (organizationId: string): Promise<Integration[]> => {
    const res = await api.get(`/integrations?organizationId=${organizationId}`);
    return res.data;
  },

  create: async (data: any): Promise<Integration> => {
    const res = await api.post('/integrations', data);
    return res.data;
  },

  update: async (id: string, data: any): Promise<Integration> => {
    const res = await api.patch(`/integrations/${id}`, data);
    return res.data;
  },

  testConnection: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`/integrations/${id}/test`);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/integrations/${id}`);
  },
};
