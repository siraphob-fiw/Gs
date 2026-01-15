import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { proxyClient } from '@/lib/proxy-client';
import { Progression, CreateProgressionDto } from '@/types/global';

export function useProgressions(query?: {
  range?: '1M' | '3M' | '1Y';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  athleteId?: string;
  enabled?: boolean;
}): UseQueryResult<{
  chart: any[];
  summaries: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  return useQuery({
    queryKey: [
      'progressions',
      {
        range: query?.range,
        startDate: query?.startDate,
        endDate: query?.endDate,
        page: query?.page,
        limit: query?.limit,
        athleteId: query?.athleteId,
      },
    ],
    queryFn: async () => {
      const url = new URLSearchParams();
      if (query?.range) url.append('range', query?.range);
      if (query?.startDate) url.append('startDate', query?.startDate);
      if (query?.endDate) url.append('endDate', query?.endDate);
      if (query?.page) url.append('page', query?.page.toString());
      if (query?.limit) url.append('limit', query?.limit.toString());
      if (query?.athleteId) url.append('athleteId', query?.athleteId);
      const res = await proxyClient.get(`/progressions/summary?${url.toString()}`);
      return res as {
        chart: any[];
        summaries: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    },
    enabled: query?.enabled !== false,
  });
}

export function useCreateProgression(): UseMutationResult<
  Progression,
  Error,
  CreateProgressionDto & { tenantId?: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProgressionDto & { tenantId?: string }) => {
      const { tenantId, ...rest } = data;
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const res = await proxyClient.post('/progressions', rest, headers);
      return res as Progression;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progressions'] });
    },
  });
}

export function useStressSummary(query?: {
  range?: '3D' | '6D' | '12D';
  page?: number;
  limit?: number;
}): UseQueryResult<{
  summaries: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  return useQuery({
    queryKey: ['stress-summary', query],
    queryFn: async () => {
      const url = new URLSearchParams();
      if (query?.range) url.append('range', query?.range);
      if (query?.page) url.append('page', query?.page.toString());
      if (query?.limit) url.append('limit', query?.limit.toString());
      const res = await proxyClient.get(`/progressions/stress/summary?${url.toString()}`);
      return res as {
        summaries: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    },
  });
}
