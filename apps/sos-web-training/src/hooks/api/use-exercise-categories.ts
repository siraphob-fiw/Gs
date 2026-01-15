import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { proxyClient } from '@/lib/proxy-client';

// Types
export interface ExerciseCategory {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExerciseCategoryFilters {
  name?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface ExerciseCategoryListResponse {
  exercise_categories: ExerciseCategory[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateExerciseCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateExerciseCategoryRequest {
  id: string;
  name?: string;
  description?: string;
}

// Query keys for React Query
export const exerciseCategoryKeys = {
  all: ['exercise-categories'] as const,
  lists: () => [...exerciseCategoryKeys.all, 'list'] as const,
  list: (filters: ExerciseCategoryFilters) => {
    const normalizedFilters = {
      page: filters.page || 1,
      limit: filters.limit || 50,
      name: filters.name || '',
      sortBy: filters.sortBy || '',
      sortOrder: filters.sortOrder || '',
    };
    return [...exerciseCategoryKeys.lists(), normalizedFilters] as const;
  },
  details: () => [...exerciseCategoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...exerciseCategoryKeys.details(), id] as const,
};

// Utility function for optimistic cache updates
const updateCategoryInCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  categoryId: string,
  updateFn: (category: ExerciseCategory) => ExerciseCategory,
) => {
  const currentQueries = queryClient.getQueriesData({
    queryKey: exerciseCategoryKeys.lists(),
  });

  currentQueries.forEach(([queryKey, data]: [unknown, unknown]) => {
    if (data && typeof data === 'object' && 'exercise_categories' in data) {
      const currentData = data as ExerciseCategoryListResponse;
      const updatedCategories = currentData.exercise_categories.map((category) =>
        category.id === categoryId ? updateFn(category) : category,
      );
      queryClient.setQueryData(queryKey as readonly unknown[], {
        ...currentData,
        exercise_categories: updatedCategories,
      });
    }
  });

  // Also update the individual category cache
  const categoryDetail = queryClient.getQueryData<ExerciseCategory>(
    exerciseCategoryKeys.detail(categoryId),
  );
  if (categoryDetail) {
    queryClient.setQueryData(exerciseCategoryKeys.detail(categoryId), updateFn(categoryDetail));
  }
};

/**
 * Fetch exercise categories with optional filtering and pagination
 */
export const useExerciseCategories = (
  filters?: ExerciseCategoryFilters,
): UseQueryResult<ExerciseCategoryListResponse> => {
  return useQuery({
    queryKey: exerciseCategoryKeys.list(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.name) params.append('name', filters.name);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      const queryString = params.toString();
      const url = queryString ? `/exercise-categories?${queryString}` : '/exercise-categories';

      const response = await proxyClient.get<ExerciseCategoryListResponse>(url);
      return response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status >= 400 && status < 500) return false;
      }
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Fetch all exercise categories (no pagination, for dropdowns)
 */
export const useAllExerciseCategories = (): UseQueryResult<ExerciseCategory[]> => {
  return useQuery({
    queryKey: [...exerciseCategoryKeys.all, 'all'] as const,
    queryFn: async () => {
      const response = await proxyClient.get<ExerciseCategoryListResponse>(
        '/exercise-categories?limit=1000',
      );
      return response.exercise_categories;
    },
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Fetch single exercise category by ID
 */
export const useExerciseCategory = (id: string): UseQueryResult<ExerciseCategory> => {
  return useQuery({
    queryKey: exerciseCategoryKeys.detail(id),
    queryFn: async () => {
      const response = await proxyClient.get<ExerciseCategory>(`/exercise-categories/${id}`);
      return response;
    },
    enabled: !!id,
  });
};

/**
 * Create a new exercise category
 */
export const useCreateExerciseCategory = (): UseMutationResult<
  ExerciseCategory,
  Error,
  CreateExerciseCategoryRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExerciseCategoryRequest) => {
      const response = await proxyClient.post<ExerciseCategory>('/exercise-categories', data);
      return response;
    },
    onSuccess: (newCategory) => {
      // Invalidate all lists to refresh
      queryClient.invalidateQueries({ queryKey: exerciseCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...exerciseCategoryKeys.all, 'all'] });

      // Optimistically add to cache
      const currentQueries = queryClient.getQueriesData({
        queryKey: exerciseCategoryKeys.lists(),
      });
      currentQueries.forEach(([queryKey, data]) => {
        if (data && typeof data === 'object' && 'exercise_categories' in data) {
          const currentData = data as ExerciseCategoryListResponse;
          queryClient.setQueryData(queryKey as readonly unknown[], {
            ...currentData,
            exercise_categories: [newCategory, ...currentData.exercise_categories],
            total: currentData.total + 1,
          });
        }
      });
    },
    onError: (error) => {
      console.error('Failed to create exercise category:', error);
    },
  });
};

/**
 * Update an existing exercise category
 */
export const useUpdateExerciseCategory = (): UseMutationResult<
  ExerciseCategory,
  Error,
  UpdateExerciseCategoryRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateExerciseCategoryRequest) => {
      if (!data.id) {
        throw new Error('Exercise category ID is required for update');
      }
      const { id, ...rest } = data;
      const response = await proxyClient.put<ExerciseCategory>(`/exercise-categories/${id}`, rest);
      return response;
    },
    onSuccess: (updatedCategory) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: exerciseCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...exerciseCategoryKeys.all, 'all'] });

      // Optimistically update cache
      updateCategoryInCache(queryClient, updatedCategory.id, () => updatedCategory);
    },
    onError: (error) => {
      console.error('Failed to update exercise category:', error);
    },
  });
};

/**
 * Delete an exercise category
 */
export const useDeleteExerciseCategory = (): UseMutationResult<
  { deleted: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await proxyClient.delete<{ deleted: boolean }>(`/exercise-categories/${id}`);
      return response;
    },
    onSuccess: (_, deletedId) => {
      // Invalidate all lists
      queryClient.invalidateQueries({ queryKey: exerciseCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...exerciseCategoryKeys.all, 'all'] });

      // Remove from cache
      queryClient.removeQueries({ queryKey: exerciseCategoryKeys.detail(deletedId) });

      // Optimistically remove from list cache
      const currentQueries = queryClient.getQueriesData({
        queryKey: exerciseCategoryKeys.lists(),
      });
      currentQueries.forEach(([queryKey, data]) => {
        if (data && typeof data === 'object' && 'exercise_categories' in data) {
          const currentData = data as ExerciseCategoryListResponse;
          queryClient.setQueryData(queryKey as readonly unknown[], {
            ...currentData,
            exercise_categories: currentData.exercise_categories.filter(
              (cat) => cat.id !== deletedId,
            ),
            total: currentData.total - 1,
          });
        }
      });
    },
    onError: (error) => {
      console.error('Failed to delete exercise category:', error);
    },
  });
};

