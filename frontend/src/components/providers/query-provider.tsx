'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // 1 min
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  // Sync client-side Zustand auth store with presence of accessToken cookie.
  // If accessToken cookie is missing (e.g. cleared, expired, or blocked), we MUST call clearAuth()
  // to ensure client state is consistent with middleware, preventing infinite routing loops.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasTokenCookie = document.cookie
        .split(';')
        .some((item) => item.trim().startsWith('accessToken='));

      const { user, clearAuth } = useAuthStore.getState();
      
      if (!hasTokenCookie && user) {
        console.warn('Access token cookie missing but Zustand state is active. Resetting client auth state to sync with server.');
        clearAuth();
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
