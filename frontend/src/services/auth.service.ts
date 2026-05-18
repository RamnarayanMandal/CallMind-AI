import apiClient from '@/lib/axios-client';
import type { AuthResponse, User } from '@/types';

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { name: string; email: string; password: string; }

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    return (response as any).data;
  },

  async register(payload: RegisterPayload): Promise<{ message: string }> {
    const response = await apiClient.post<any>('/auth/register', payload);
    return (response as any).data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile');
    return (response as any).data;
  },

  async verifyOtp(email: string, otp: string): Promise<{ message: string }> {
    const response = await apiClient.post<any>('/auth/verify-otp', { email, otp });
    return (response as any).data;
  },

  async resendOtp(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<any>('/auth/resend-otp', { email });
    return (response as any).data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<any>('/auth/forgot-password', { email });
    return (response as any).data;
  },

  async resetPassword(payload: { email: string; otp: string; newPassword: string }): Promise<{ message: string }> {
    const response = await apiClient.post<any>('/auth/reset-password', payload);
    return (response as any).data;
  },

  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  },

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  },
};
