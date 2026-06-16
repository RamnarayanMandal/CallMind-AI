import { apiClient } from '@/lib/axios-client';
import { AuditLog } from '@/types';

export const auditService = {
  // Get audit logs with optional filtering
  getAuditLogs: async (options: {
    organizationId?: string;
    userId?: string;
    action?: string;
    resourceType?: string;
    limit?: number;
    page?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{ auditLogs: AuditLog[]; total: number }> => {
    const params = new URLSearchParams();
    if (options.organizationId) params.append('organizationId', options.organizationId);
    if (options.userId) params.append('userId', options.userId);
    if (options.action) params.append('action', options.action);
    if (options.resourceType) params.append('resourceType', options.resourceType);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.page) params.append('page', options.page.toString());
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);

    const response = await apiClient.get(`/audit/logs?${params.toString()}`);
    return response.data;
  },

  // Get a specific audit log by ID
  getAuditLogById: async (auditLogId: string): Promise<AuditLog> => {
    const response = await apiClient.get(`/audit/logs/${auditLogId}`);
    return response.data;
  },

  // Export audit logs to CSV
  exportAuditLogs: async (options: {
    organizationId?: string;
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> => {
    const params = new URLSearchParams();
    if (options.organizationId) params.append('organizationId', options.organizationId);
    if (options.userId) params.append('userId', options.userId);
    if (options.action) params.append('action', options.action);
    if (options.resourceType) params.append('resourceType', options.resourceType);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);

    const response = await apiClient.get(`/audit/logs/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Delete audit logs (admin only)
  deleteAuditLogs: async (options: {
    organizationId?: string;
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ deletedCount: number }> => {
    const params = new URLSearchParams();
    if (options.organizationId) params.append('organizationId', options.organizationId);
    if (options.userId) params.append('userId', options.userId);
    if (options.action) params.append('action', options.action);
    if (options.resourceType) params.append('resourceType', options.resourceType);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);

    const response = await apiClient.delete(`/audit/logs?${params.toString()}`);
    return response.data;
  },
};