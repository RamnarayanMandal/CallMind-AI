'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService, LoginPayload, RegisterPayload } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { userRole } from '@/types/admin.types';

export function useAuth() {
  const { user, setAuth, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const response = await authService.login(payload);
      setAuth(response.user, response.accessToken, response.refreshToken);
      toast.success('Successfully logged in');

      if (response.user.role === userRole.ADMIN || response.user.role === userRole.SUPER_ADMIN) {
        router.push('/admin');
      } else if (response.user.role === userRole.USER) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const response = await authService.register(payload);
      toast.success(response.message || 'OTP sent to your email successfully.');
      router.push(`/verify-otp?email=${encodeURIComponent(payload.email)}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    clearAuth();
    router.push('/login');
    toast.info('Logged out');
  }, [clearAuth, router]);

  const refreshUser = useCallback(async () => {
    try {
      const refreshedUser = await authService.getMe();
      const { setUser } = useAuthStore.getState();
      setUser(refreshedUser as any);
      return refreshedUser;
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      throw error;
    }
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };
}
