'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { Bot } from 'lucide-react';
import { toast } from 'sonner';
import { userRole } from '@/types/admin.types';

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      // Temporarily store tokens so apiClient can use the access token in Authorization header
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      authService.getMe()
        .then((user) => {
          setAuth(user, accessToken, refreshToken);
          toast.success('Successfully logged in');

          if (user.role === userRole.ADMIN || user.role === userRole.SUPER_ADMIN) {
            router.push('/admin');
          } else if (user.role === userRole.USER) {
            router.push('/dashboard');
          } else {
            router.push('/onboarding');
          }
        })
        .catch((err) => {
          console.error('Failed to fetch user profile:', err);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          toast.error('Authentication failed. Please try again.');
          router.push('/login?error=auth_failed');
        });
    } else {
      toast.error('Missing authentication tokens');
      router.push('/login?error=missing_tokens');
    }
  }, [searchParams, router, setAuth]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-t-2 border-primary animate-spin" />
          <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-medium animate-pulse text-muted-foreground">Authenticating securely...</p>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><div className="h-12 w-12 rounded-full border-t-2 border-primary animate-spin" /></div>}>
      <AuthSuccessContent />
    </Suspense>
  );
}
