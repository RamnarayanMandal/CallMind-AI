import { userRole } from '@/types/admin.types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: userRole;
  organizationId?: string | null;
  isEmailVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) => {
        // Set cookies for middleware
        if (typeof window !== 'undefined') {
          document.cookie = `accessToken=${accessToken}; path=/; Max-Age=900; SameSite=Lax; Secure`;
          document.cookie = `userRole=${user.role}; path=/; Max-Age=604800; SameSite=Lax; Secure`;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }
        set({ user, accessToken, refreshToken });
      },

      setUser: (user) => {
        if (typeof window !== 'undefined') {
          document.cookie = `userRole=${user.role}; path=/; Max-Age=604800; SameSite=Lax; Secure`;
        }
        set({ user });
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
          document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';

          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
