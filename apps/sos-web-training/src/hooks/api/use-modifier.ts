import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { proxyClient } from '@/lib/proxy-client';

// TYPES
export interface Modifier {
  id: string;
  tenant_id: string;
  modifier_category_id: string;
  name: string;
  status: string;
  central_stress_factor: number;
  peripheral_stress_factor: number;
  // Cluster-based stress modifier fields (for Set Style category)
  cs_base_multiplier?: number | null;
  cs_cluster_increment?: number | null;
  ps_base_multiplier?: number | null;
  ps_cluster_increment?: number | null;
  uses_cluster_calculation?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateModifierDto {
  name: string;
  modifier_category_id: string;
  central_stress_factor: number;
  peripheral_stress_factor: number;
  status?: string;
  // Cluster-based stress modifier fields (for Set Style category)
  cs_base_multiplier?: number;
  cs_cluster_increment?: number;
  ps_base_multiplier?: number;
  ps_cluster_increment?: number;
  uses_cluster_calculation?: boolean;
}

export interface EditModifierDto {
  name?: string;
  modifier_category_id?: string;
  central_stress_factor?: number;
  peripheral_stress_factor?: number;
  status?: string;
  // Cluster-based stress modifier fields (for Set Style category)
  cs_base_multiplier?: number | null;
  cs_cluster_increment?: number | null;
  ps_base_multiplier?: number | null;
  ps_cluster_increment?: number | null;
  uses_cluster_calculation?: boolean;
}

export interface ModifierCategory {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateModifierCategoryDto {
  name: string;
  description?: string;
}

export interface EditModifierCategoryDto {
  name?: string;
  description?: string;
  status?: string;
}

export interface BulkUpdateModifierDto {
  name?: string;
  modifier_category_id?: string;
  central_stress_factor?: number;
  peripheral_stress_factor?: number;
  status?: string;
}
// HOOKS

//Modifiers
export const useModifiers = (query?: {
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
  tenantId?: string;
}): UseQueryResult<{
  modifiers: Modifier[];
  total: number;
  page: number;
  limit: number;
}> => {
  return useQuery<{
    modifiers: Modifier[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['modifiers', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query?.category) params.append('category', query.category);
      if (query?.status) params.append('status', query.status);
      if (query?.page) params.append('page', query.page.toString());
      if (query?.limit) params.append('limit', query.limit.toString());

      const headers: Record<string, string> = query?.tenantId
        ? { 'x-tenant-id': query.tenantId }
        : {};
      const response = await proxyClient.get<{
        modifiers: Modifier[];
        total: number;
        page: number;
        limit: number;
      }>(`/modifiers?${params.toString()}`, headers);
      return response;
    },
    retry: false,
  });
};

export const useModifier = (id: string): UseQueryResult<Modifier> => {
  return useQuery<Modifier>({
    queryKey: ['modifiers', id],
    queryFn: async () => {
      const response = await proxyClient.get(`/modifiers/${id}`);
      return response as Modifier;
    },
    enabled: !!id,
  });
};

export const useCreateModifier = (): UseMutationResult<
  any,
  Error,
  CreateModifierDto & { tenantId?: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateModifierDto & { tenantId?: string }) => {
      const { tenantId, ...rest } = data;
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const response = await proxyClient.post('/modifiers', rest, headers);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifiers'] });
    },
  });
};

export const useUpdateModifier = (): UseMutationResult<
  any,
  Error,
  { id: string; data: EditModifierDto; tenantId?: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      tenantId,
    }: {
      id: string;
      data: EditModifierDto;
      tenantId?: string;
    }) => {
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const response = await proxyClient.put(`/modifiers/${id}`, data, headers);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['modifiers'] });
      queryClient.invalidateQueries({ queryKey: ['modifiers', id] });
    },
  });
};

export const useDeleteModifier = (): UseMutationResult<
  void,
  Error,
  { id: string; tenantId?: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tenantId }: { id: string; tenantId?: string }) => {
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      await proxyClient.delete(`/modifiers/${id}`, headers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifiers'] });
    },
  });
};

//Modifier Categories
export const useModifierCategories = (query?: {
  name?: string;
  status?: string;
  page?: number;
  limit?: number;
  tenantId?: string;
}): UseQueryResult<{
  modifier_categories: ModifierCategory[];
  total: number;
  page: number;
  limit: number;
}> => {
  return useQuery<{
    modifier_categories: ModifierCategory[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['modifier-categories', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query?.name) params.append('name', query.name);
      if (query?.status) params.append('status', query.status);
      if (query?.page) params.append('page', query.page.toString());
      if (query?.limit) params.append('limit', query.limit.toString());

      const headers: Record<string, string> = query?.tenantId
        ? { 'x-tenant-id': query.tenantId }
        : {};
      const response = await proxyClient.get<{
        modifier_categories: ModifierCategory[];
        total: number;
        page: number;
        limit: number;
      }>(`/modifier-categories?${params.toString()}`, headers);
      return response;
    },
  });
};

export const useCreateModifierCategory = (): UseMutationResult<
  any,
  Error,
  CreateModifierCategoryDto & { tenantId?: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateModifierCategoryDto & { tenantId?: string }) => {
      const { tenantId, ...rest } = data;
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const response = await proxyClient.post('/modifier-categories', rest, headers);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifier-categories'] });
    },
  });
};

export const useUpdateModifierCategory = (): UseMutationResult<
  any,
  Error,
  { id: string; data: Partial<EditModifierCategoryDto>; tenantId?: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      tenantId,
    }: {
      id: string;
      data: Partial<EditModifierCategoryDto>;
      tenantId?: string;
    }) => {
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const response = await proxyClient.put(`/modifier-categories/${id}`, data, headers);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['modifier-categories'] });
      queryClient.invalidateQueries({ queryKey: ['modifier-categories', id] });
    },
  });
};

export const useDeleteModifierCategory = (): UseMutationResult<
  void,
  Error,
  { id: string; tenantId?: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tenantId }: { id: string; tenantId?: string }) => {
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      await proxyClient.delete(`/modifier-categories/${id}`, headers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifier-categories'] });
    },
  });
};

// Bulk create/update modifiers
export const useBulkUpdateModifier = (): UseMutationResult<
  { updated: number; created: number; failed: number; errors: string[] },
  Error,
  { modifiers: BulkUpdateModifierDto[]; tenantId?: string }
> => {
  const queryClient = useQueryClient();
  return useMutation<
    { updated: number; created: number; failed: number; errors: string[] },
    Error,
    { modifiers: BulkUpdateModifierDto[]; tenantId?: string }
  >({
    mutationFn: async (data: { modifiers: BulkUpdateModifierDto[]; tenantId?: string }) => {
      const { tenantId, modifiers } = data;
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const response = await proxyClient.post<{
        updated: number;
        created: number;
        failed: number;
        errors: string[];
      }>('/modifiers/bulkUpdate', modifiers, headers);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifiers'] });
    },
    onError: (error) => {
      console.error('Failed to bulk create modifiers:', error);
    },
    retry: false,
  });
};

// Export modifiers to CSV
export const exportModifiersToCSV = (
  modifiers: Modifier[],
  categories: ModifierCategory[],
  filename: string = 'modifiers_export.csv',
) => {
  // Build category ID -> name map
  const categoryMap = new Map<string, string>();
  categories.forEach((cat) => {
    categoryMap.set(cat.id, cat.name);
  });

  // CSV headers
  const headers = [
    'name',
    'category_name',
    'central_stress_factor',
    'peripheral_stress_factor',
    'status',
  ];

  // Build CSV rows
  const rows = modifiers.map((modifier) => {
    return [
      `"${(modifier.name || '').replace(/"/g, '""')}"`,
      `"${(categoryMap.get(modifier.modifier_category_id) || '').replace(/"/g, '""')}"`,
      modifier.central_stress_factor ?? 0,
      modifier.peripheral_stress_factor ?? 0,
      modifier.status || '',
    ].join(',');
  });

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
