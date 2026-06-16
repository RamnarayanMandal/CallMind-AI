import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription.service';
import type { CreatePlanDto, Plan, SubscriptionRecord, SubscriptionUsageData } from '@/types';
import { toast } from 'sonner';

/** Hook: fetch all subscription plans */
export function usePlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionService.getPlans(),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

/** Hook: admin CRUD for plans */
export function useAdminPlans() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionService.getPlans(),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreatePlanDto) => subscriptionService.createPlan(dto),
    onSuccess: () => { invalidate(); toast.success('Plan created'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create plan'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreatePlanDto> }) =>
      subscriptionService.updatePlan(id, dto),
    onSuccess: () => { invalidate(); toast.success('Plan updated'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update plan'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subscriptionService.deletePlan(id),
    onSuccess: () => { invalidate(); toast.success('Plan deleted'); },
    onError: () => toast.error('Failed to delete plan'),
  });

  return {
    plans: (plansQuery.data ?? []) as Plan[],
    isLoading: plansQuery.isLoading,
    isError: plansQuery.isError,
    error: plansQuery.error as Error | null,
    createPlan: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updatePlan: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deletePlan: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    refetch: plansQuery.refetch,
  };
}

/** Hook: initiate a Razorpay subscription */
export function useSubscribe() {
  const mutation = useMutation({
    mutationFn: (planId: string) => subscriptionService.createSubscription(planId),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Subscription failed'),
  });

  return {
    subscribe: mutation.mutateAsync,
    isSubscribing: mutation.isPending,
  };
}

/** Hook: initiate a manual Razorpay order */
export function useCreateOrder() {
  const mutation = useMutation({
    mutationFn: ({ organizationId, planId, isYearly }: { organizationId: string, planId: string, isYearly: boolean }) => subscriptionService.createOrder(organizationId, planId, isYearly),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create order'),
  });

  return {
    createOrder: mutation.mutateAsync,
    isCreatingOrder: mutation.isPending,
  };
}

/** Hook: verify a manual Razorpay order */
export function useVerifyOrder() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: any) => subscriptionService.verifyOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-current'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-call-status'] });
      toast.success('Payment successful! Plan activated.');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Payment verification failed'),
  });

  return {
    verifyOrder: mutation.mutateAsync,
    isVerifyingOrder: mutation.isPending,
  };
}

/** Hook: fetch the current active subscription for an org */
export function useCurrentSubscription(organizationId?: string) {
  return useQuery<SubscriptionRecord | null>({
    queryKey: ['subscription-current', organizationId],
    queryFn: () =>
      organizationId
        ? subscriptionService.getCurrentSubscription(organizationId)
        : Promise.resolve(null),
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 2, // 2 min
  });
}

/** Hook: check whether the org can make calls */
export function useCallStatus(organizationId?: string) {
  return useQuery<{ canCall: boolean; blockReason: string | null }>({
    queryKey: ['subscription-call-status', organizationId],
    queryFn: () =>
      organizationId
        ? subscriptionService.getCallStatus(organizationId)
        : Promise.resolve({ canCall: false, blockReason: 'no_subscription' }),
    enabled: !!organizationId,
    staleTime: 1000 * 30, // 30 seconds — recheck frequently
  });
}

/** Hook: fetch usage data with cost breakdown */
export function useSubscriptionUsage(organizationId?: string) {
  return useQuery<SubscriptionUsageData>({
    queryKey: ['subscription-usage', organizationId],
    queryFn: () =>
      organizationId
        ? subscriptionService.getUsage(organizationId)
        : Promise.resolve({
            aiMinutesUsed: 0, aiCost: 0, callMinutesUsed: 0, callCost: 0,
            currentBill: 0, remainingBalance: 0, minutesLimit: 0, planName: null,
          }),
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 2,
  });
}
