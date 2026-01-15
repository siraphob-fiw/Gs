import { UseMutationResult, UseQueryResult, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { proxyClient } from '@/lib/proxy-client';

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionDto {
  tenant_id: string;
  plan_id: string;
  auto_renew: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  plan_code: string;
  price: number;
  currency: string;
  billing_cycle: string;
  trial_days: number;
  is_active: boolean;
  features: Record<string, any> | null;
  limits: Record<string, any> | null;
  max_users: number;
  max_athletes: number;
  max_coaches: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionPlanDto {
  name: string;
  description: string;
  plan_code: string;
  price: number;
  currency: string;
  billing_cycle: string;
  trial_days: number;
  is_active: boolean;
  features: Record<string, any> | null;
  limits: Record<string, any> | null;
  max_users: number;
  max_athletes: number;
  max_coaches: number;
}

export const subscriptionKeys = {
  all: ['subscriptionplans'] as const,
};

export interface UseSubscriptionOptions {
  enabled?: boolean;
}

export const useSubscriptionPlans = (
  filters?: {
    name?: string;
    isactive?: boolean;
    currency?: string;
    limit?: number;
    offset?: number;
  },
): UseQueryResult<SubscriptionPlan[]> => {
  return useQuery({
    queryKey: subscriptionKeys.all,
    queryFn: async () => {
      let url = '/subscriptions/plans/all';
      if (filters && Object.keys(filters).length > 0) {
        const params: Record<string, string> = {};
        if (filters.isactive) params.isactive = filters.isactive == true ? '1' : '0';
        if (filters.name) params.name = filters.name;
        if (filters.currency) params.currency = filters.currency;
        if (typeof filters.limit === 'number') params.limit = filters.limit.toString();
        if (typeof filters.offset === 'number') params.offset = filters.offset.toString();
        const queryString = new URLSearchParams(params).toString();
        if (queryString) {
          url = `/subscriptions/plans/all?${queryString}`;
        }
      }
      const response = await proxyClient.get<SubscriptionPlan[]>(url);
      return response;
    },
    retry: false,
  });
};

export const useSubscriptionPlan = (
  id: string,
): UseQueryResult<SubscriptionPlan> => {
  return useQuery({
    queryKey: subscriptionKeys.all,
    queryFn: async () => {
      const response = await proxyClient.get<SubscriptionPlan>(`/subscriptions/plans/${id}`);
      return response;
    },
    retry: false,
  });
};

export const useSubscriptionPlanCreate = (): UseMutationResult<
  SubscriptionPlan,
  unknown,
  CreateSubscriptionPlanDto
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: CreateSubscriptionPlanDto) => {
      const response = await proxyClient.post<SubscriptionPlan>('/subscriptions/plans', plan);
      return response;
    },
    retry: false,
  });
};
export const useSubscriptionPlanUpdate = (): UseMutationResult<
  SubscriptionPlan,
  unknown,
  { id: string; plan: CreateSubscriptionPlanDto }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, plan }) => {
      const response = await proxyClient.put<SubscriptionPlan>(`/subscriptions/plans/${id}`, plan);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    retry: false,
  });
};

export const useSubscriptionPlanDelete = (): UseMutationResult<void, unknown, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await proxyClient.delete(`/subscriptions/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    retry: false,
  });
}

export const useCreateSubscription = (): UseMutationResult<Subscription, unknown, CreateSubscriptionDto> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: CreateSubscriptionDto) => {
      const response = await proxyClient.post<Subscription>('/subscriptions', plan);
      return response;
    },
    retry: false,
  });
}
