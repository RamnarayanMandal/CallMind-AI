import { apiClient } from '@/lib/axios-client';
import { Recording } from '@/types';

export const recordingService = {
  // Get recordings with optional filtering
  getRecordings: async (options: {
    organizationId?: string;
    callId?: string;
    limit?: number;
    page?: number;
    search?: string;
  } = {}): Promise<{ recordings: Recording[]; total: number }> => {
    const params = new URLSearchParams();
    if (options.organizationId) params.append('organizationId', options.organizationId);
    if (options.callId) params.append('callId', options.callId);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.page) params.append('page', options.page.toString());
    if (options.search) params.append('search', options.search);

    const response = await apiClient.get(`/recordings?${params.toString()}`);
    return response.data;
  },

  // Get a specific recording by ID
  getRecordingById: async (recordingId: string): Promise<Recording> => {
    const response = await apiClient.get(`/recordings/${recordingId}`);
    return response.data;
  },

  // Get recording URL for playback (returns a blob URL)
  getRecordingUrl: async (recordingId: string): Promise<string> => {
    const response = await apiClient.get(`/recordings/${recordingId}/url`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  },

  // Download a recording file
  downloadRecording: async (recordingId: string): Promise<Blob> => {
    const response = await apiClient.get(`/recordings/${recordingId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Delete a recording
  deleteRecording: async (recordingId: string): Promise<void> => {
    await apiClient.delete(`/recordings/${recordingId}`);
  },
};