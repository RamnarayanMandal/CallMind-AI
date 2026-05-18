import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, LoginPayload, RegisterPayload } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const userQuery = useQuery({
    queryKey: ['auth-me'],
    queryFn: authService.getMe,
    retry: false,
    enabled: !!authService.getToken(),
  });

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (data) => {
      authService.setToken(data.accessToken);
      queryClient.setQueryData(['auth-me'], data.user);
      toast.success('Successfully logged in');
      router.push('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: (data) => {
      authService.setToken(data.accessToken);
      queryClient.setQueryData(['auth-me'], data.user);
      toast.success('Account created successfully');
      router.push('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Registration failed');
    },
  });

  const logout = () => {
    authService.clearToken();
    queryClient.clear();
    router.push('/login');
    toast.info('Logged out');
  };

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout,
  };
}
