import { UseMutationResult, UseQueryResult, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tenant, TenantSettings, TenantStatus, tenantWithSubscription } from '@strengthos/shared-types';
import { proxyClient } from '@/lib/proxy-client';

export interface TenantFilters {
  status?: TenantStatus;
  domain?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface PublicTenant extends Tenant {
  totalAthletes: number;
  totalCoaches: number;
}

export interface CreateTenantRequest {
  name: string,
  plan: string,
  adminEmail: string,
  adminFirstName: string,
  adminLastName: string,
  adminPassword: string,
}

export interface UpdateTenantRequest {
  name?: string;
  description?: string;
  status?: TenantStatus;
  contact?: { [key: string]: string };
  availableEquipment?: string[]; // 
}

export const tenantsKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantsKeys.all, 'list'] as const,
  list: (filters: TenantFilters = {}) => [...tenantsKeys.lists(), filters] as const,
  item: (tenantId: string) => [...tenantsKeys.all, 'item', tenantId] as const,
};

export interface UseTenantOptions {
  enabled?: boolean;
}

export const useTenants = (
  filters?: TenantFilters,
  options?: UseTenantOptions,
): UseQueryResult<Tenant[]> => {
  return useQuery({
    queryKey: tenantsKeys.list(filters ?? {}),
    queryFn: async () => {
      let url = '/tenants';
      if (filters && Object.keys(filters).length > 0) {
        const params: Record<string, string> = {};
        if (filters.status) params.status = filters.status;
        if (filters.domain) params.domain = filters.domain;
        if (filters.createdAfter) params.createdAfter = filters.createdAfter.toString();
        if (filters.createdBefore) params.createdBefore = filters.createdBefore.toString();
        if (typeof filters.limit === 'number') params.limit = filters.limit.toString();
        if (typeof filters.offset === 'number') params.offset = filters.offset.toString();
        const queryString = new URLSearchParams(params).toString();
        if (queryString) {
          url = `/tenants?${queryString}`;
        }
      }
      const response = await proxyClient.get<Tenant[]>(url);
      return response;
    },
    retry: false,
    staleTime: 300_000, // 5 minutes
    enabled: options?.enabled ?? true, // Allow disabling the query
  });
};

export const useTenantById = (tenantId: string): UseQueryResult<tenantWithSubscription> => {
  return useQuery({
    queryKey: tenantsKeys.item(tenantId),
    queryFn: async () => {
      const response = await proxyClient.get<tenantWithSubscription>(`/tenants/${tenantId}`);
      return response;
    },
    retry: false,
    staleTime: 300_000, // 5 minutes - prevents refetching on every render
    enabled: !!tenantId, // Only fetch when tenantId is truthy
  });
};

export const useUpdateTenant = (tenantId: string): UseMutationResult<Tenant, Error, UpdateTenantRequest> => {
  return useMutation({
    mutationFn: async (data: UpdateTenantRequest) => {
      const response = await proxyClient.put<Tenant>(`/tenants/${tenantId}`, data);
      return response;
    },
    retry: false,
  });
};

export const useUpdateTenantSettings = (
  tenantId: string,
): UseMutationResult<Tenant, Error, TenantSettings> => {
  return useMutation({
    mutationFn: async (settings: TenantSettings) => {
      const response = await proxyClient.put<Tenant>(`/tenants/${tenantId}/settings`, settings);
      return response;
    },
  });
};

export const useCreateTenant = (): UseMutationResult<Tenant, Error, CreateTenantRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenantData: CreateTenantRequest) => {
      const response = await proxyClient.post<Tenant>('/tenants', tenantData);
      return response;
    },
    onSuccess: () => {
      // Refresh tenant lists after creating a new tenant
      queryClient.invalidateQueries({ queryKey: tenantsKeys.lists() });
    },
  });
};

export const useTenantLeaderboard = (
  tenantId: string,
): UseQueryResult<{
  leaderboard: {
    userId: string;
    name: string;
    status: string;
    lastActivity: string;
    max1RM: number;
  }[];
}> => {
  return useQuery({
    queryKey: [...tenantsKeys.all, 'leaderboard', tenantId] as const,
    queryFn: async () => {
      const response = await proxyClient.get<{
        leaderboard: {
          userId: string;
          name: string;
          status: string;
          lastActivity: string;
          max1RM: number;
        }[];
      }>(`/tenants/${tenantId}/leaderboard`);
      return response;
    },
    retry: false,
  });
};

export const usePublicTenants = (
  options?: UseTenantOptions,
): UseQueryResult<PublicTenant[]> => {
  return useQuery({
    queryKey: [...tenantsKeys.all, 'public'] as const,
    queryFn: async () => {
      const response = await proxyClient.get<PublicTenant[]>('/tenants/public');
      return response;
    },
    retry: false,
    staleTime: 300_000, // 5 minutes
    enabled: options?.enabled ?? true,
  });
};