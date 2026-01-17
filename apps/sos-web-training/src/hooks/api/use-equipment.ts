import { proxyClient } from '@/lib/proxy-client';
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryResult,
    UseMutationResult,
} from '@tanstack/react-query';

// Types
export type EquipmentAvailability = 'common_gym' | 'home' | 'specialty_gym';

export interface EquipmentSpecifications {
    weight?: number;
    length?: number;
    width?: number;
    weightRange?: {
        min: number;
        max: number;
    };
    increments?: number[];
    capacity?: number;
    features?: string[];
    dimensions?: {
        width: number;
        height: number;
        length: number;
    };
}

export interface Equipment {
    id: string;
    name: string;
    type: string;
    availability: EquipmentAvailability;
    category_id?: string;
    specifications?: EquipmentSpecifications;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface EquipmentCategory {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface EquipmentFilters {
    availability?: EquipmentAvailability;
    category_id?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}

export interface EquipmentListResponse {
    equipments: Equipment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface EquipmentCategoryListResponse {
    categories: EquipmentCategory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CreateEquipmentRequest {
    name: string;
    type: string;
    availability: EquipmentAvailability;
    category_id?: string;
    specifications?: EquipmentSpecifications;
    description?: string;
    is_active?: boolean;
}

export interface UpdateEquipmentRequest {
    id: string;
    name?: string;
    type?: string;
    availability?: EquipmentAvailability;
    category_id?: string;
    specifications?: EquipmentSpecifications;
    description?: string;
    is_active?: boolean;
}

export interface CreateEquipmentCategoryRequest {
    name: string;
    description?: string;
}

export interface UpdateEquipmentCategoryRequest {
    id: string;
    name?: string;
    description?: string;
}

// Query keys for React Query
export const equipmentKeys = {
    all: ['equipment'] as const,
    lists: () => [...equipmentKeys.all, 'list'] as const,
    list: (filters: EquipmentFilters) => {
        const normalizedFilters = {
            page: filters.page || 1,
            limit: filters.limit || 100,
            search: filters.search || '',
            availability: filters.availability || '',
            category_id: filters.category_id || '',
            is_active: filters.is_active,
        };
        return [...equipmentKeys.lists(), normalizedFilters] as const;
    },
    details: () => [...equipmentKeys.all, 'detail'] as const,
    detail: (id: string) => [...equipmentKeys.details(), id] as const,
    categories: () => [...equipmentKeys.all, 'categories'] as const,
    categoryList: () => [...equipmentKeys.categories(), 'list'] as const,
    categoryDetail: (id: string) => [...equipmentKeys.categories(), 'detail', id] as const,
};

// Utility function for optimistic cache updates
const updateEquipmentInCache = (
    queryClient: ReturnType<typeof useQueryClient>,
    equipmentId: string,
    updateFn: (equipment: Equipment) => Equipment,
) => {
    const currentQueries = queryClient.getQueriesData({
        queryKey: equipmentKeys.lists(),
    });

    currentQueries.forEach(([queryKey, data]: [unknown, unknown]) => {
        if (data && typeof data === 'object' && 'equipments' in data) {
            const currentData = data as EquipmentListResponse;
            const updatedEquipments = currentData.equipments.map((equipment) =>
                equipment.id === equipmentId ? updateFn(equipment) : equipment,
            );
            queryClient.setQueryData(queryKey as readonly unknown[], {
                ...currentData,
                equipments: updatedEquipments,
            });
        }
    });

    // Also update the individual equipment cache
    const equipmentDetail = queryClient.getQueryData<Equipment>(
        equipmentKeys.detail(equipmentId),
    );
    if (equipmentDetail) {
        queryClient.setQueryData(equipmentKeys.detail(equipmentId), updateFn(equipmentDetail));
    }
};

/**
 * Fetch equipment with optional filtering and pagination
 */
export function useEquipments(
    filters: EquipmentFilters = {},
): UseQueryResult<EquipmentListResponse> {
    return useQuery({
        queryKey: equipmentKeys.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams();

            if (filters.limit) params.append('limit', String(filters.limit));
            if (filters.page) params.append('page', String(filters.page));
            if (filters.search) params.append('search', filters.search);
            if (filters.availability) params.append('availability', filters.availability);
            if (filters.category_id) params.append('category_id', filters.category_id);
            if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));

            const queryString = params.toString();
            const url = queryString ? `/equipment?${queryString}` : '/equipment';
            const response = await proxyClient.get<EquipmentListResponse>(url);
            return response;
        },
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Fetch single equipment by ID
 */
export function useEquipment(id: string): UseQueryResult<Equipment> {
    return useQuery({
        queryKey: equipmentKeys.detail(id),
        queryFn: async () => {
            const response = await proxyClient.get<Equipment>(`/equipment/${id}`);
            return response;
        },
        enabled: !!id,
    });
}

/**
 * Create new equipment
 */
export function useCreateEquipment(): UseMutationResult<
    Equipment,
    Error,
    CreateEquipmentRequest
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateEquipmentRequest) => {
            const response = await proxyClient.post<Equipment>('/equipment', data);
            return response;
        },
        onSuccess: (newEquipment) => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });

            // Optimistically add to cache
            const currentQueries = queryClient.getQueriesData({
                queryKey: equipmentKeys.lists(),
            });
            currentQueries.forEach(([queryKey, data]) => {
                if (data && typeof data === 'object' && 'equipments' in data) {
                    const currentData = data as EquipmentListResponse;
                    queryClient.setQueryData(queryKey as readonly unknown[], {
                        ...currentData,
                        equipments: [newEquipment, ...currentData.equipments],
                        total: currentData.total + 1,
                    });
                }
            });
        },
        onError: (error) => {
            console.error('Failed to create equipment:', error);
        },
    });
}

/**
 * Update existing equipment
 */
export function useUpdateEquipment(): UseMutationResult<
    Equipment,
    Error,
    UpdateEquipmentRequest
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateEquipmentRequest) => {
            if (!data.id) {
                throw new Error('Equipment ID is required for update');
            }
            const { id, ...rest } = data;
            const response = await proxyClient.put<Equipment>(`/equipment/${id}`, rest);
            return response;
        },
        onSuccess: (updatedEquipment) => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
            updateEquipmentInCache(queryClient, updatedEquipment.id, () => updatedEquipment);
        },
        onError: (error) => {
            console.error('Failed to update equipment:', error);
        },
    });
}

/**
 * Delete equipment
 */
export function useDeleteEquipment(): UseMutationResult<void, Error, string> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await proxyClient.delete(`/equipment/${id}`);
        },
        onSuccess: (_, deletedId) => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
            queryClient.removeQueries({ queryKey: equipmentKeys.detail(deletedId) });

            // Optimistically remove from list cache
            const currentQueries = queryClient.getQueriesData({
                queryKey: equipmentKeys.lists(),
            });
            currentQueries.forEach(([queryKey, data]) => {
                if (data && typeof data === 'object' && 'equipments' in data) {
                    const currentData = data as EquipmentListResponse;
                    queryClient.setQueryData(queryKey as readonly unknown[], {
                        ...currentData,
                        equipments: currentData.equipments.filter((eq) => eq.id !== deletedId),
                        total: currentData.total - 1,
                    });
                }
            });
        },
        onError: (error) => {
            console.error('Failed to delete equipment:', error);
        },
    });
}

// ============================================================================
// EQUIPMENT CATEGORIES
// ============================================================================

/**
 * Fetch equipment categories
 */
export function useEquipmentCategories(): UseQueryResult<EquipmentCategoryListResponse> {
    return useQuery({
        queryKey: equipmentKeys.categoryList(),
        queryFn: async () => {
            const response = await proxyClient.get<EquipmentCategoryListResponse>(
                '/equipment/categories/all',
            );
            return response;
        },
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Create equipment category
 */
export function useCreateEquipmentCategory(): UseMutationResult<
    EquipmentCategory,
    Error,
    CreateEquipmentCategoryRequest
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateEquipmentCategoryRequest) => {
            const response = await proxyClient.post<EquipmentCategory>(
                '/equipment/categories',
                data,
            );
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.categories() });
        },
        onError: (error) => {
            console.error('Failed to create equipment category:', error);
        },
    });
}

/**
 * Update equipment category
 */
export function useUpdateEquipmentCategory(): UseMutationResult<
    EquipmentCategory,
    Error,
    UpdateEquipmentCategoryRequest
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateEquipmentCategoryRequest) => {
            if (!data.id) {
                throw new Error('Category ID is required for update');
            }
            const { id, ...rest } = data;
            const response = await proxyClient.put<EquipmentCategory>(
                `/equipment/categories/${id}`,
                rest,
            );
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.categories() });
        },
        onError: (error) => {
            console.error('Failed to update equipment category:', error);
        },
    });
}

/**
 * Delete equipment category
 */
export function useDeleteEquipmentCategory(): UseMutationResult<void, Error, string> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await proxyClient.delete(`/equipment/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: equipmentKeys.categories() });
        },
        onError: (error) => {
            console.error('Failed to delete equipment category:', error);
        },
    });
}
