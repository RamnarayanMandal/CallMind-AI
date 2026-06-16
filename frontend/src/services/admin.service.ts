import api from '@/lib/axios-client';
import { AdminUser, AdminStats, AdminSubscription, AdminOrgBilling, AdminOrgDetail } from '@/types/admin.types';

class AdminService {
  async getUsers(): Promise<AdminUser[]> {
    const response = await api.get('/admin/users');
    return response.data;
  }

  async getDashboardStats(): Promise<AdminStats> {
    const response = await api.get('/admin/dashboard-stats');
    return response.data;
  }

  async getAnalytics(): Promise<any> {
    const response = await api.get('/admin/analytics');
    return response.data;
  }

  async getSubscriptions(): Promise<AdminSubscription[]> {
    const response = await api.get('/admin/subscriptions');
    return response.data;
  }

  async getOrganizations(): Promise<AdminOrgBilling[]> {
    const response = await api.get('/admin/organizations');
    return response.data;
  }

  async getOrganizationById(id: string): Promise<AdminOrgDetail> {
    const response = await api.get(`/admin/organizations/${id}`);
    return response.data;
  }

  async getMyOrganizations(): Promise<AdminOrgBilling[]> {
    const response = await api.get('/admin/my-organizations');
    return response.data;
  }

  async getMyOrganizationById(id: string): Promise<AdminOrgDetail> {
    const response = await api.get(`/admin/my-organizations/${id}`);
    return response.data;
  }

  async updateProfile(data: { name?: string; email?: string }): Promise<any> {
    const response = await api.patch('/admin/profile', data);
    return response.data;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    const response = await api.post('/admin/change-password', data);
    return response.data;
  }
}

export const adminService = new AdminService();
