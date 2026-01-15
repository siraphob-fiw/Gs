import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { proxyClient } from '@/lib/proxy-client';
import { SessionStatus } from '@/types/global';

export interface SessionWarmupValues {
  sets: number;
  weight: number;
  reps: number;
}
export interface SessionExerciseValues {
  sets: number;
  weight: number;
  reps: number;
  rpe: number;
}

export interface SessionExerciseActualValues {
  sets: number;
  reps: number;
  weight: number;
  rpe: number;
  central_stress: number;
  peripheral_stress: number;
  total_stress: number;
}

export interface TrainingSessionExercise {
  id: string;
  sessionId: string;
  exerciseId: string;
  exerciseName?: string;
  order: number;
  exerciseDate: Date;
  target: SessionExerciseValues[];
  warmup: SessionWarmupValues[] | null;
  actual: SessionExerciseActualValues[];
  modifiers: string[];
  metrics: Record<string, any>;
  notes: string;
  exerciseStatus: 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingSession {
  id: string;
  sessionName: string;
  athleteId: string;
  coachId: string;
  athleteName?: string;
  tenantId?: string;
  sessionStatus: SessionStatus;
  startDate: Date;
  endDate?: Date;
  exercises: TrainingSessionExercise[];
  session_metric: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingSessionAthlete extends TrainingSession {
  athleteName: string;
}

export interface UpdateTrainingSessionDto {
  sessionName?: string;
  sessionStatus?: SessionStatus;
  exercises?: UpdateTrainingSessionExerciseDto[];
  deletedExercises?: string[];
  replaceAllExercises?: boolean;
}

export interface UpdateTrainingSessionExerciseDto {
  exerciseId?: string;
  order?: number;
  exerciseDate?: string;
  warmup?: SessionWarmupValues[];
  actual?: SessionExerciseActualValues[];
  metrics?: Record<string, any>;
  notes?: string;
  targets?: SessionExerciseValues[];
  modifiers?: string[];
}

export interface ProgressSessionExerciseDto {
  exerciseId: string;
  order: number;
  warmup?: SessionWarmupValues[];
  actual: SessionExerciseActualValues[];
  metrics: Record<string, any>;
  notes?: string;
}

// HOOKS

export const useTrainingSessions = (query?: {
  coachId?: string;
  athleteId?: string;
  trainingBlockId?: string;
  status?: SessionStatus[];
  page?: number;
  limit?: number;
}): UseQueryResult<{
  sessions: TrainingSession[];
  total: number;
  page: number;
  limit: number;
}> => {
  return useQuery({
    queryKey: ['training-sessions', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query?.coachId) params.append('coachId', query.coachId);
      if (query?.athleteId) params.append('athleteId', query.athleteId);
      if (query?.status?.length) params.append('status', query.status.join(','));
      if (query?.page) params.append('page', query.page.toString());
      if (query?.limit) params.append('limit', query.limit.toString());
      const response = await proxyClient.get<{
        sessions: TrainingSession[];
        total: number;
        page: number;
        limit: number;
      }>(`/training-sessions?${params.toString()}`);
      return response;
    },
  });
};

export const useTrainingSessionsCalendar = (query?: {
  day?: number;
  month?: number;
  year?: number;
  athleteId?: string;
}) => {
  return useQuery<{
    sessions: TrainingSession[];
  }>({
    queryKey: ['training-sessions-calendar', query],
    queryFn: async (): Promise<{
      sessions: TrainingSession[];
    }> => {
      const params = new URLSearchParams();
      if (query?.day) params.append('day', query.day.toString());
      if (query?.month) params.append('month', query.month.toString());
      if (query?.year) params.append('year', query.year.toString());
      if (query?.athleteId) params.append('athleteId', query.athleteId);
      const response = await proxyClient.get(`/training-sessions/calendar?${params.toString()}`);
      return response as {
        sessions: TrainingSession[];
      };
    },
  });
};

export const useTrainingSession = (id: string) => {
  return useQuery<TrainingSession | null>({
    queryKey: ['training-sessions', id],
    queryFn: async () => {
      const response = await proxyClient.get(`/training-sessions/${id}`);
      if ((response as any).statusCode === 404) {
        return null;
      } else {
        return response as TrainingSession;
      }
    },
    enabled: !!id,
  });
};

export interface CreateSessionExerciseDto {
  exerciseId: string;
  exerciseDate: string;
  order: number;
  target: SessionExerciseValues[];
  warmup?: SessionWarmupValues[];
  actual: SessionExerciseActualValues[];
  modifiers: string[];
  metrics: {
    e1rm: number;
    nl: number;
    tonnage: number;
    total_stress: number;
    peripheral_stress: number;
    central_stress: number;
  };
  notes: string;
}

export interface CreateTrainingSessionDto {
  sessionName: string;
  athleteId: string;
  coachId?: string;
  startDate: string;
  endDate: string;
  exercises: CreateSessionExerciseDto[];
}

export const useCreateTrainingSession = (): UseMutationResult<
  any,
  Error,
  CreateTrainingSessionDto & { tenantId?: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTrainingSessionDto & { tenantId?: string }) => {
      const { tenantId, ...rest } = data;
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const response = await proxyClient.post('/training-sessions', rest, headers);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
    },
  });
};

export const useUpdateTrainingSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      tenantId,
    }: {
      id: string;
      data: UpdateTrainingSessionDto;
      tenantId?: string;
    }) => {
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const response = await proxyClient.put(`/training-sessions/${id}`, data, headers);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['training-sessions', id] });
    },
  });
};

export const useProgressSessionExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      exerciseDate,
      id,
      data,
      tenantId,
    }: {
      exerciseDate: string;
      id: string;
      data: ProgressSessionExerciseDto[];
      tenantId?: string;
    }) => {
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      // Move exerciseDate from query string into request body
      const payload = { 
        exerciseDate : exerciseDate,
        data : data,
       };
      const response = await proxyClient.put(
        `/training-sessions/progress/${id}`,
        payload,
        headers,
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
    },
  });
};

export const useCalculateWeight = () => {
  return useMutation({
    mutationFn: async ({
      exerciseId,
      reps,
      rpe,
      athleteId,
      tenantId,
    }: {
      exerciseId: string;
      reps: number;
      rpe: number;
      athleteId?: string;
      tenantId?: string;
    }) => {
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const response = await proxyClient.post(
        `/training-sessions/calculate-weight`,
        {
          exerciseId,
          reps,
          rpe,
          athleteId,
        },
        headers,
      );
      return response as { e1rm: number; weight: number };
    },
  });
};

export const useBulkCalculateWeight = () => {
  return useMutation({
    mutationFn: async ({
      tenantId,
      athleteId,
      data,
    }: {
      tenantId?: string;
      athleteId?: string;
      data: { exerciseId: string; reps: number; rpe: number }[];
    }) => {
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const response = await proxyClient.post(
        `/training-sessions/bulk-calculate-weight`,
        {
          athleteId,
          data,
        },
        headers,
      );
      return response as { weights: number[] };
    },
  });
};

export const useDeleteTrainingSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tenantId }: { id: string; tenantId?: string }) => {
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      await proxyClient.delete<void>(`/training-sessions/${id}`, headers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
    },
  });
};
