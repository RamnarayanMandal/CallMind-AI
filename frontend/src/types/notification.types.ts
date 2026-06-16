export interface AppNotification {
  _id: string;
  userId: string;
  type: 'contact_submission' | 'call_completed' | 'system_alert' | 'info';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
