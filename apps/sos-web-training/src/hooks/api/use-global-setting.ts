import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { proxyClient } from '@/lib/proxy-client';

// ==================
// ENUMS AND INTERFACES
// ==================

export interface GlobalSetting {
  id: string;
  config_key: string;
  config_value: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface GlobalSettingList {
  data: GlobalSetting[];
  page: number;
  limit: number;
  total: number;
}

export interface CreateGlobalSettingDto {
  config_key: string;
  config_value: Record<string, any>;
}

export interface UpdateGlobalSettingDto {
  key: string;
  data: Record<string, any>;
}

export interface GlobalSettingQueryDto {
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

//==================
// Query Keys
//==================
export const globalSettingKeys = {
  all: ['global-settings'] as const,
  list: () => [...globalSettingKeys.all, 'list'] as const,
  item: (key: string) => [...globalSettingKeys.all, 'item', key] as const,
} as const;

// ==================
// Hooks
// ==================
export const useGlobalSettings = ( filters: GlobalSettingQueryDto = {} ): UseQueryResult<GlobalSettingList> => {
  return useQuery({
    queryKey: globalSettingKeys.list(),
    queryFn: async () => {
      let url = '/global-settings';
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      if (filters.page !== undefined) params.set('page', filters.page.toString());
      if (filters.limit !== undefined) params.set('limit', filters.limit.toString());
      const queryString = params.toString();
      if (queryString) {
        url += `${queryString ? `?${queryString}` : ''}`;
      }
      const response = await proxyClient.get<GlobalSettingList>(url);
      return response;
    },
    retry: false,
  });
};

export const useGlobalSetting = (key: string): UseQueryResult<GlobalSetting> =>
  useQuery({
    queryKey: globalSettingKeys.item(key),
    queryFn: async () => await proxyClient.get<GlobalSetting>(`/global-settings/${key}`),
    retry: false,
  });

export const useCreateGlobalSetting = (): UseMutationResult<GlobalSetting, Error, CreateGlobalSettingDto> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateGlobalSettingDto) => {
      return await proxyClient.post<GlobalSetting>('/global-settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalSettingKeys.list() });
    },
    retry: false,
  });
};

export const useUpdateGlobalSetting = (): UseMutationResult<
  GlobalSetting,
  Error,
  { id: string; data: UpdateGlobalSettingDto }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await proxyClient.put<GlobalSetting>(`/global-settings/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalSettingKeys.list() });
    },
    retry: false,
  });
};

export const useSoftDeleteGlobalSetting = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => {
      return proxyClient.delete<void>(`/global-settings/${key}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalSettingKeys.list() });
    },
    retry: false,
  });
};

export const useHardDeleteGlobalSetting = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => {
      return proxyClient.delete<void>(`/global-settings/${key}/permanent`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalSettingKeys.list() });
    },
    retry: false,
  });
};