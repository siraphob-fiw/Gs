import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import {
  Exercise,
  ExerciseWithUser,
  ExerciseFilters,
  ExerciseListResponse,
  CreateExerciseRequest,
  UpdateExerciseRequest,
  ExerciseVariation,
  ExerciseProgression,
  ExerciseRecommendation,
  ExerciseRecommendationRequest,
  ExerciseSearchRequest,
  BodyPart,
  Discipline,
} from '@strengthos/shared-types';
import { proxyClient } from '@/lib/proxy-client';
// Utility function for optimistic cache updates
const updateExerciseInCache = (
  queryClient: any,
  exerciseId: string,
  updateFn: (exercise: any) => any,
) => {
  const currentQueries = queryClient.getQueriesData({ queryKey: exerciseKeys.lists() });
  currentQueries.forEach(([queryKey, data]: [any, any]) => {
    if (data && typeof data === 'object' && 'exercises' in data) {
      const currentData = data as ExerciseListResponse;
      const updatedExercises = currentData.exercises.map((exercise) =>
        exercise.id === exerciseId ? updateFn(exercise) : exercise,
      );
      queryClient.setQueryData(queryKey, {
        ...currentData,
        exercises: updatedExercises,
      });
    }
  });

  // Also update the individual exercise cache
  const exerciseDetail = queryClient.getQueryData(exerciseKeys.detail(exerciseId));
  if (exerciseDetail) {
    queryClient.setQueryData(exerciseKeys.detail(exerciseId), updateFn(exerciseDetail));
  }
};

// Query keys for React Query - optimized for better cache management
export const exerciseKeys = {
  all: ['exercises'] as const,
  lists: () => [...exerciseKeys.all, 'list'] as const,
  list: (filters: ExerciseFilters) => {
    const normalizedFilters = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      search: filters.search || '',
      exerciseType: filters.exerciseType || '',
      bodyParts: filters.bodyParts
        ? Array.isArray(filters.bodyParts)
          ? filters.bodyParts.sort()
          : [filters.bodyParts]
        : [],
      movementPatterns: filters.movementPatterns ? filters.movementPatterns.sort() : [],
      discipline: filters.discipline
        ? Array.isArray(filters.discipline)
          ? filters.discipline.sort()
          : [filters.discipline]
        : [],
      status: filters.status !== undefined ? filters.status : '',
      sortBy: filters.sortBy || '',
      sortOrder: filters.sortOrder || '',
    };
    return [...exerciseKeys.lists(), normalizedFilters] as const;
  },
  details: () => [...exerciseKeys.all, 'detail'] as const,
  detail: (id: string) => [...exerciseKeys.details(), id] as const,
  variations: () => [...exerciseKeys.all, 'variations'] as const,
  variation: (id: string) => [...exerciseKeys.variations(), id] as const,
  progressions: () => [...exerciseKeys.all, 'progressions'] as const,
  progression: (id: string) => [...exerciseKeys.progressions(), id] as const,
  recommendations: () => [...exerciseKeys.all, 'recommendations'] as const,
  search: (query: string) => [...exerciseKeys.all, 'search', query.toLowerCase().trim()] as const,
  approve: (id: string) => [...exerciseKeys.all, 'approve', id] as const,
};

// Fetch exercises using program-generation endpoints
export const useExercises = (filters?: ExerciseFilters): UseQueryResult<ExerciseListResponse> => {
  return useQuery({
    queryKey: exerciseKeys.list(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.exerciseType) params.append('exerciseType', filters.exerciseType);
      if (filters?.movementPatterns) {
        filters.movementPatterns.forEach((pattern) => params.append('movementPatterns', pattern));
      }
      if (filters?.bodyParts) {
        const bodyParts = Array.isArray(filters.bodyParts)
          ? filters.bodyParts
          : [filters.bodyParts];
        bodyParts.forEach((part: BodyPart) => params.append('bodyParts', part.toLowerCase()));
      }
      if (filters?.discipline) {
        const disciplines = Array.isArray(filters.discipline)
          ? filters.discipline
          : [filters.discipline];
        disciplines.forEach((tag: Discipline) => params.append('discipline', tag));
      }
      if (filters?.status !== undefined) {
        params.append('status', filters.status ? 'true' : 'false');
      }
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      const queryString = params.toString();
      const url = queryString ? `/exercise?${queryString}` : '/exercise';

      const response = await proxyClient.get<ExerciseListResponse>(url);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors, but not for 4xx errors
      if (failureCount >= 3) return false;

      // Don't retry for client errors (4xx)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) return false;
      }

      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    throwOnError: false, // Don't throw errors, let the component handle them
  });
};

// Fetch single exercise
export const useExercise = (id: string) => {
  return useQuery<ExerciseWithUser>({
    queryKey: exerciseKeys.detail(id),
    queryFn: async () => {
      const response = await proxyClient.get<ExerciseWithUser>(`/exercise/${id}`);
      return response;
    },
    enabled: !!id,
  });
};

// Search exercises using program-generation select endpoint
export const useExerciseSearch = (searchRequest: ExerciseSearchRequest) => {
  return useQuery<ExerciseWithUser[]>({
    queryKey: exerciseKeys.search(searchRequest.query),
    queryFn: async () => {
      const response = await (proxyClient as any).post('/exercise/select', searchRequest);
      return response;
    },
    enabled: !!searchRequest.query && searchRequest.query.length > 2,
  });
};

// Get exercise variations
export const useExerciseVariations = (exerciseId: string) => {
  return useQuery<ExerciseVariation[]>({
    queryKey: exerciseKeys.variation(exerciseId),
    queryFn: async () => {
      const response = await proxyClient.get<ExerciseVariation[]>(
        `/exercise/${exerciseId}/variations`,
      );
      return response;
    },
    enabled: !!exerciseId,
  });
};

// Get exercise progressions
export const useExerciseProgressions = (exerciseId: string) => {
  return useQuery<ExerciseProgression[]>({
    queryKey: exerciseKeys.progression(exerciseId),
    queryFn: async () => {
      const response = await proxyClient.get<ExerciseProgression[]>(
        `/exercise/${exerciseId}/progressions`,
      );
      return response;
    },
    enabled: !!exerciseId,
  });
};

// Get exercise recommendations using program-generation select endpoint
export const useExerciseRecommendations = (request: ExerciseRecommendationRequest) => {
  return useQuery<ExerciseRecommendation[]>({
    queryKey: exerciseKeys.recommendations(),
    queryFn: async () => {
      const response = await (proxyClient as any).post('/exercise/select', request);
      return response;
    },
    enabled: !!request.userId,
  });
};

// Create exercise
export const useCreateExercise = (): UseMutationResult<
  Exercise,
  Error,
  CreateExerciseRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExerciseRequest) => {
      const response = await proxyClient.post<Exercise>('/exercise', data);
      return response;
    },
    onSuccess: (newExercise) => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
      const currentQueries = queryClient.getQueriesData({ queryKey: exerciseKeys.lists() });
      currentQueries.forEach(([queryKey, data]) => {
        if (data && typeof data === 'object' && 'exercises' in data) {
          const currentData = data as ExerciseListResponse;
          queryClient.setQueryData(queryKey, {
            ...currentData,
            exercises: [newExercise, ...currentData.exercises],
            total: currentData.total + 1,
          });
        }
      });
    },
    onError: (error) => {},
    retry: false,
  });
};

export const useBulkCreateExercise = (): UseMutationResult<
  Exercise[],
  Error,
  { exercises: CreateExerciseRequest[] }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { exercises: CreateExerciseRequest[] }) => {
      const { exercises } = data;
      const response = await proxyClient.post<Exercise[]>('/exercise/bulk-import', exercises);
      return response;
    },
    onSuccess: () => {
      // Just invalidate the queries - no manual update needed
      // This prevents duplicate keys when the query refetches
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to bulk create exercises:', error);
    },
    retry: false,
  });
};

// Update exercise
export const useUpdateExercise = (): UseMutationResult<
  Exercise,
  Error,
  UpdateExerciseRequest
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateExerciseRequest) => {
      if (!data.id) {
        throw new Error('Exercise ID is required for update');
      }
      const { id, ...rest } = data;
      const response = await proxyClient.put<Exercise>(`/exercise/${id}`, rest);
      return response;
    },
    onSuccess: (updatedExercise) => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
      updateExerciseInCache(queryClient, updatedExercise.id, () => updatedExercise);
    },
    onError: (error) => {
      console.error('Failed to update exercise:', error);
    },
  });
};

// Delete exercise
export const useDeleteExercise = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: async (id: string) => {
      const url = `/exercise/${id}`;
      const response = await proxyClient.delete<{ message: string }>(url);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete exercise:', error);
    },
  });
};

// Create exercise variation
export const useCreateExerciseVariation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ExerciseVariation,
    Error,
    {
      exerciseId: string;
      data: Omit<ExerciseVariation, 'id' | 'createdAt' | 'updatedAt'>;
    }
  >({
    mutationFn: async ({ exerciseId, data }) => {
      const response = await proxyClient.post<ExerciseVariation>(`/exercise/${exerciseId}/variations`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.variation(variables.exerciseId) });
    },
  });
};

export const useApproveExercise = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message: string },
    Error,
    string
  >({
    mutationFn: async (id: string) => {
      const response = await proxyClient.get<{ success: boolean; message: string }>(
        `/exercise/approved/${id}`,
      );
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
      updateExerciseInCache(queryClient, id, (exercise) => ({
        ...exercise,
        isApproved: true,
      }));
    },
    onError: (error) => {
      console.error('Failed to approve exercise:', error);
    },
  });
};

// Create exercise progression
export const useCreateExerciseProgression = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ExerciseProgression,
    Error,
    {
      exerciseId: string;
      data: Omit<ExerciseProgression, 'id' | 'createdAt' | 'updatedAt'>;
    }
  >({
    mutationFn: async ({ exerciseId, data }) => {
      const response = await proxyClient.post<ExerciseProgression>(
        `/exercise/${exerciseId}/progressions`,
        data,
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.progression(variables.exerciseId) });
    },
  });
};
