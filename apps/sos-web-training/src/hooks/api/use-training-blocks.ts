import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { proxyClient } from '@/lib/proxy-client';
import {
  CreateTrainingBlockDto,
  TrainingBlockResponse,
  WorkoutMethod,
  WorkoutType,
  PatternSummary,
} from '@/types/global';

export const useTrainingBlocks = (query?: {
  athleteId?: string;
  workoutName?: string;
  workoutMethod?: WorkoutMethod;
  workoutType?: WorkoutType;
  status?: string;
  page?: number;
  limit?: number;
  tenantId?: string;
}): UseQueryResult<{
  blocks: TrainingBlockResponse[];
  total: number;
  page: number;
  limit: number;
}> => {
  return useQuery({
    queryKey: ['training-blocks', query],
    queryFn: async (): Promise<{
      blocks: TrainingBlockResponse[];
      total: number;
      page: number;
      limit: number;
    }> => {
      try {
        const params = new URLSearchParams();
        if (query?.athleteId) params.append('athleteId', query.athleteId);
        if (query?.workoutName) params.append('workoutName', query.workoutName);
        if (query?.workoutMethod) params.append('workoutMethod', query.workoutMethod);
        if (query?.workoutType) params.append('workoutType', query.workoutType);
        if (query?.status) params.append('status', query.status);
        if (query?.page) params.append('page', query.page.toString());
        if (query?.limit) params.append('limit', query.limit.toString());

        const headers: Record<string, string> = query?.tenantId
          ? { 'x-tenant-id': query.tenantId }
          : {};
        const response = await proxyClient.get<{
          blocks: TrainingBlockResponse[];
          total: number;
          page: number;
          limit: number;
        }>(`/training-blocks?${params.toString()}`, headers);
        return response;
      } catch (error) {
        console.error('Error fetching training blocks:', error);
        throw error;
      }
    },
  });
};

export const useTrainingBlock = (id: string, tenantId?: string) => {
  return useQuery({
    queryKey: ['training-blocks', id, tenantId],
    queryFn: async (): Promise<TrainingBlockResponse> => {
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const response = await proxyClient.get(`/training-blocks/${id}`, headers);
      return response as TrainingBlockResponse;
    },
    enabled: !!id,
  });
};

export const useCreateTrainingBlock = (): UseMutationResult<
  any,
  Error,
  CreateTrainingBlockDto & { tenantId?: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTrainingBlockDto & { tenantId?: string }) => {
      const { tenantId, ...rest } = data;
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const response = await proxyClient.post('/training-blocks', rest, headers);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-blocks'] });
    },
  });
};

export const useUpdateTrainingBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      tenantId,
    }: {
      id: string;
      data: Partial<CreateTrainingBlockDto>;
      tenantId?: string;
    }) => {
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const response = await proxyClient.put(`/training-blocks/${id}`, data, headers);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['training-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['training-blocks', id] });
    },
  });
};

export const useDeleteTrainingBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tenantId }: { id: string; tenantId?: string }) => {
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      await proxyClient.delete<void>(`/training-blocks/${id}`, headers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-blocks'] });
    },
  });
};

export const useDuplicateTrainingBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tenantId }: { id: string; tenantId?: string }) => {
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      await proxyClient.post<void>(`/training-blocks/${id}/duplicate`, undefined, headers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-blocks'] });
    },
  });
};

// Types for workout summary calculation
export type ModifierInput = string | { modifierId: string; clusters?: number };

export interface CalculateSummaryExercise {
  exerciseId: string;
  order: number;
  day: number;
  sets: { reps: number; rpe: number }[];
  modifiers: ModifierInput[];
}

export interface CalculateSummaryRequest {
  exercises: CalculateSummaryExercise[];
}

export interface ExerciseSummaryMetric {
  exerciseId: string;
  day: number;
  order: number;
  summary: {
    nl: number;
    totalStress: number;
    centralStress: number;
    peripheralStress: number;
    csBalance: number;
  };
}

export interface WorkoutSummaryResult {
  exercises: ExerciseSummaryMetric[];
  patterns: PatternSummary[];
  total: {
    nl: number;
    peripheral: number;
    central: number;
    total: number;
    csBalance: number;
  };
}

export const useCalculateWorkoutSummary = (): UseMutationResult<
  WorkoutSummaryResult,
  Error,
  CalculateSummaryRequest
> => {
  return useMutation({
    mutationFn: async (data: CalculateSummaryRequest) => {
      const response = await proxyClient.post<WorkoutSummaryResult>(
        '/training-blocks/calculate-summary',
        data,
      );
      return response;
    },
  });
};
