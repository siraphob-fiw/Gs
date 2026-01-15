import { UseMutationResult, UseQueryResult, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { proxyClient } from '@/lib/proxy-client';

export interface PaymentProvider {
  id: string;
  name: string;
  provider_code: string;
  provider_type: string;
  is_active: boolean;
  configuration: Record<string, string>;
  support_currencies: string[];
  support_countries: string[];
  processing_fee_percentage: number;
  fixed_fee: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentProviderDto {
  name: string;
  provider_code: string;
  provider_type: string;
  configuration: Record<string, string>;
  support_currencies: string[];
  support_countries: string[];
  processing_fee_percentage: number;
  fixed_fee: number;
}

export const paymentKeys = {
  all: ['payment-providers'] as const,
  one: (id: string) => ['payment-providers', id] as const,
}

export const usePaymentProviders = (
  filters?: {
    name?: string;
    isactive?: boolean;
    currency?: string;
    limit?: number;
    offset?: number;
  },
): UseQueryResult<PaymentProvider[]> => {
  return useQuery({
    queryKey: paymentKeys.all,
    queryFn: async () => {
      let url = '/payment/providers/all';
      if (filters && Object.keys(filters).length > 0) {
        const params: Record<string, string> = {};
        if (filters.isactive) params.isactive = filters.isactive == true ? '1' : '0';
        if (filters.name) params.name = filters.name;
        if (typeof filters.limit === 'number') params.limit = filters.limit.toString();
        if (typeof filters.offset === 'number') params.offset = filters.offset.toString();
        const queryString = new URLSearchParams(params).toString();
        if (queryString) {
          url = `/payment/providers/all?${queryString}`;
        }
      }
      const response = await proxyClient.get<PaymentProvider[]>(url);
      return response;
    },
    retry: false,
  });
};

export const usePaymentProvider = (
  id: string,
): UseQueryResult<PaymentProvider> => {
  return useQuery({
    queryKey: paymentKeys.one(id),
    queryFn: async () => {
      const response = await proxyClient.get<PaymentProvider>(`/payment/providers/${id}`);
      return response;
    },
    retry: false,
  });
};

export const usePaymentProviderCreate = (): UseMutationResult<
  PaymentProvider,
  unknown,
  CreatePaymentProviderDto
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (provider: CreatePaymentProviderDto) => {
      const response = await proxyClient.post<PaymentProvider>('/payment/providers', provider);
      return response;
    },
    retry: false,
  });
};
export const usePaymentProviderUpdate = (): UseMutationResult<
  PaymentProvider,
  unknown,
  { id: string; provider: CreatePaymentProviderDto }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, provider }) => {
      const response = await proxyClient.put<PaymentProvider>(`/payment/providers/${id}`, provider);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
    retry: false,
  });
};

export const usePaymentProviderDelete = (): UseMutationResult<void, unknown, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await proxyClient.delete(`/payment/providers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
    retry: false,
  });
}
