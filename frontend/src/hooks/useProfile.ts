import { useMutation } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { authService } from '@/services/auth.service';

export const useUpdateProfile = (role: 'admin' | 'user') => {
  return useMutation({
    mutationFn: (data: { name?: string; email?: string }) => {
      if (role === 'admin') return adminService.updateProfile(data);
      return authService.updateProfile(data);
    },
  });
};

export const useChangePassword = (role: 'admin' | 'user') => {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => {
      if (role === 'admin') return adminService.changePassword(data);
      return authService.changePassword(data);
    },
  });
};