import api from '@/lib/axios-client';

export interface TelephonyConfig {
  defaultTelephonyProvider: string;
  telephonyAccountId?: string;
  telephonyAuthToken?: string;
  telephonyFromNumber?: string;
  telephonyMetadata?: Record<string, any>;
  hasCredentials?: boolean;
}

export interface UpdateTelephonyConfigPayload {
  defaultTelephonyProvider: string;
  telephonyAccountId?: string;
  telephonyAuthToken?: string;
  telephonyFromNumber?: string;
}

class TelephonyConfigService {
  async getTelephonyConfig(): Promise<TelephonyConfig> {
    const response = await api.get('/admin/telephony-config');
    return response.data;
  }

  async updateTelephonyConfig(payload: UpdateTelephonyConfigPayload): Promise<{ success: boolean; message: string }> {
    const response = await api.put('/admin/telephony-config', payload);
    return response.data;
  }
}

export const telephonyConfigService = new TelephonyConfigService();
