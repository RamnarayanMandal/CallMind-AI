import { apiClient } from '@/lib/axios-client';
import { NotificationListResponse } from '@/types/notification.types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

class NotificationService {
  async getAll(params?: { page?: number; limit?: number; type?: string }): Promise<NotificationListResponse> {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.count;
  }

  async markAsRead(id: string): Promise<any> {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllAsRead(): Promise<any> {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data;
  }
}

export const notificationService = new NotificationService();
