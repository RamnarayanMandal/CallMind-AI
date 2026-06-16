import { apiClient } from '@/lib/axios-client';
import { ContactListResponse, CreateContactData } from '@/types/contact.types';

class ContactService {
  async getAll(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<ContactListResponse> {
    const response = await apiClient.get('/contacts', { params });
    return response.data;
  }

  async getById(id: string): Promise<any> {
    const response = await apiClient.get(`/contacts/${id}`);
    return response.data;
  }

  async create(data: CreateContactData): Promise<any> {
    const response = await apiClient.post('/contacts', data);
    return response.data;
  }

  async assignAgent(id: string, agentId: string): Promise<any> {
    const response = await apiClient.patch(`/contacts/${id}/assign`, { agentId });
    return response.data;
  }

  async triggerCall(id: string, agentId: string): Promise<any> {
    const response = await apiClient.post(`/contacts/${id}/trigger-call`, { agentId });
    return response.data;
  }

  async updateResponse(id: string, text: string): Promise<any> {
    const res = await apiClient.patch(`/contacts/${id}/response`, { response: text });
    return res.data;
  }
}

export const contactService = new ContactService();
