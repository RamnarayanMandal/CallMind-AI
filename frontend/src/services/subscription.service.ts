import apiClient from '@/lib/axios-client';
import type { Plan, CreatePlanDto, CreateSubscriptionResponse, SubscriptionRecord, SubscriptionUsageData } from '@/types';

export const subscriptionService = {
  /** GET /subscription/plans — all plans */
  async getPlans(): Promise<Plan[]> {
    const { data } = await apiClient.get<Plan[]>('/subscription/plans');
    return data as unknown as Plan[];
  },

  /** GET /subscription/plans/:id */
  async getPlanById(id: string): Promise<Plan> {
    const { data } = await apiClient.get<Plan>(`/subscription/plans/${id}`);
    return data as unknown as Plan;
  },

  /** POST /subscription/plans */
  async createPlan(dto: CreatePlanDto): Promise<Plan> {
    const { data } = await apiClient.post<Plan>('/subscription/plans', dto);
    return data as unknown as Plan;
  },

  /** PUT /subscription/plans/:id */
  async updatePlan(id: string, dto: Partial<CreatePlanDto>): Promise<Plan> {
    const { data } = await apiClient.put<Plan>(`/subscription/plans/${id}`, dto);
    return data as unknown as Plan;
  },

  /** DELETE /subscription/plans/:id */
  async deletePlan(id: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.delete<{ success: boolean }>(`/subscription/plans/${id}`);
    return data as unknown as { success: boolean };
  },

  /** POST /subscription/create — initiate Razorpay subscription */
  async createSubscription(planId: string): Promise<CreateSubscriptionResponse> {
    const { data } = await apiClient.post<CreateSubscriptionResponse>('/subscription/create', { planId });
    return data as unknown as CreateSubscriptionResponse;
  },

  /** POST /subscription/create-order — initiate Razorpay one-time order */
  async createOrder(organizationId: string, planId: string, isYearly: boolean): Promise<{ orderId: string, amount: number, currency: string }> {
    const { data } = await apiClient.post<{ orderId: string, amount: number, currency: string }>('/subscription/create-order', { organizationId, planId, isYearly });
    return data;
  },

  /** POST /subscription/verify-order — verify manual payment */
  async verifyOrder(payload: any): Promise<any> {
    const { data } = await apiClient.post('/subscription/verify-order', payload);
    return data;
  },

  /** GET /subscription/current?organizationId=... — active subscription for an org */
  async getCurrentSubscription(organizationId: string): Promise<SubscriptionRecord | null> {
    const { data } = await apiClient.get<SubscriptionRecord | null>('/subscription/current', {
      params: { organizationId },
    });
    return data as unknown as SubscriptionRecord | null;
  },

  /** GET /subscription/call-status?organizationId=... — can org make calls? */
  async getCallStatus(organizationId: string): Promise<{ canCall: boolean; blockReason: string | null }> {
    const { data } = await apiClient.get('/subscription/call-status', {
      params: { organizationId },
    });
    return data as { canCall: boolean; blockReason: string | null };
  },

  /** GET /subscription/usage?organizationId=... — usage data with costs */
  async getUsage(organizationId: string): Promise<SubscriptionUsageData> {
    const { data } = await apiClient.get('/subscription/usage', {
      params: { organizationId },
    });
    return data as SubscriptionUsageData;
  },
};
