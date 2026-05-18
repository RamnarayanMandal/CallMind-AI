import apiClient from '@/lib/axios-client';
import type { Customer, ApiResponse, PaginatedData } from '@/types';

export interface CreateCustomerPayload {
  name: string; phone: string; email?: string; company?: string;
  organizationId: string; metadata?: Record<string, any>;
}

export const customerService = {
  async getAll(organizationId: string, page = 1, limit = 10): Promise<PaginatedData<Customer>> {
    const response = await apiClient.get<PaginatedData<Customer>>('/customers', {
      params: { organizationId, page, limit },
    });
    return response as any;
  },

  async create(payload: CreateCustomerPayload): Promise<Customer> {
    const response = await apiClient.post<Customer>('/customers', payload);
    return (response as any).data;
  },

  async update(id: string, payload: Partial<CreateCustomerPayload>): Promise<Customer> {
    const response = await apiClient.patch<Customer>(`/customers/${id}`, payload);
    return (response as any).data;
  },

  async uploadCsv(file: File, organizationId: string): Promise<{ imported: number }> {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post<{ imported: number }>(
      `/customers/upload-csv?organizationId=${organizationId}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return (response as any).data;
  },

  async search(organizationId: string, query: string): Promise<Customer[]> {
    const response = await apiClient.get<Customer[]>(`/customers/search`, {
      params: { organizationId, query },
    });
    return response as any;
  },
};
