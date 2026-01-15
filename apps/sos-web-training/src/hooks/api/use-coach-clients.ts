import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { proxyClient } from '@/lib/proxy-client';
import { ErrorHandler } from '@/lib/error-handler';
import { RelationshipStatus, Results } from '@strengthos/shared-types';
import {
  CoachDiscoveryProfile,
  CreateCoachDiscoveryProfileRequest,
  UpdateCoachDiscoveryProfileRequest,
} from '@/types/coaching';

interface coachAthleteRelationshipFilters {
  coach_id?: string;
  athlete_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface RelationshipListResponse {
  training_session_count: number;
  last_activity: Date | null;
  id: string;
  tenant_id: string;
  coach_id: string;
  athlete_id: string;
  status: RelationshipStatus;
  created_at: Date;
  updated_at: Date;
  athlete_firstName: string;
  athlete_lastName: string;
  athlete_role: string;
  athlete_email: string;
  coach_email: string;
  coach_firstName: string;
  coach_lastName: string;
}

export interface CoachAthleteRelationship {
  id: string;
  tenant_id: string;
  coachId: string;
  athleteId: string;
  status: RelationshipStatus;
  notes?: string;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  terminatedBy?: string;
  terminationReason?: string;
}

export interface CoachAthleteRelationshipList {
  relationships: RelationshipListResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateCoachAthleteRelationshipDto {
  coach_id: string;
  athlete_id: string;
  notes?: string;
}

export const coachAthleteKeys = {
  all: ['coachAthleteKeys'] as const,
  lists: ['coachAthleteKeys', 'list'] as const,
  list: (filters: coachAthleteRelationshipFilters) =>
    ['coachAthleteKeys', 'list', filters] as const,
  create: () => ['coachAthleteKeys', 'create'] as const,
};

export const useCoachClients = (
  filters?: coachAthleteRelationshipFilters,
): UseQueryResult<CoachAthleteRelationshipList> =>
  useQuery({
    queryKey: coachAthleteKeys.list(filters ?? {}),
    queryFn: async (): Promise<CoachAthleteRelationshipList> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }

      const queryString = params.toString();
      const url = queryString
        ? `/coach-athlete/relationships?${queryString}`
        : '/coach-athlete/relationships';
      try {
        const response = await proxyClient.get<CoachAthleteRelationshipList>(url);
        return response;
      } catch (error) {
        ErrorHandler.handle(error, {
          logError: true,
          fallbackMessage: 'Error fetching coach clients',
          context: { endpoint: url, method: 'GET', requestData: filters },
          severity: 'low',
          retryable: false,
        });
        return {
          relationships: [],
          total: 0,
          page: 1,
          limit: 10,
        };
      }
    },
    retry: false,
    staleTime: 300_000, // 5 minutes
  });

export const useCreateRelationship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCoachAthleteRelationshipDto & { tenantId?: string }) => {
      const { tenantId, ...rest } = data;
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const response = await proxyClient.post<CoachAthleteRelationship>(
        '/coach-athlete/relationships',
        rest,
        headers,
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachAthleteKeys.list({}) });
    },
  });
};

export const useUpdateRelationshipStatus = (): UseMutationResult<
  CoachAthleteRelationship,
  Error,
  { relationshipId: string; status: string; tenantId?: string }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { relationshipId: string; status: string; tenantId?: string }) => {
      const { tenantId } = data;
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const statusType = data.status as RelationshipStatus;
      const response = await proxyClient.put<CoachAthleteRelationship>(
        `/coach-athlete/relationships/${data.relationshipId}/${statusType}`,
        undefined,
        headers,
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachAthleteKeys.list({}) });
    },
  });
};

export const useCreateCoachDiscoveryProfile = () => {
  return useMutation({
    mutationFn: async (data: CreateCoachDiscoveryProfileRequest & { tenantId?: string }) => {
      const { tenantId, ...rest } = data;
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const response = await proxyClient.post<any>('/coach-discovery/profile', rest, headers);
      return response;
    },
    retry: false,
  });
};

export const useUpdateCoachDiscoveryProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateCoachDiscoveryProfileRequest & { tenantId?: string }) => {
      const { tenantId, ...rest } = data;
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const response = await proxyClient.put<any>('/coach-discovery/profile', rest, headers);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coachDiscoveryProfile'] });
    },
    retry: false,
  });
};

export const useCoachDiscoveryProfile = () => {
  return useQuery({
    queryKey: ['coachDiscoveryProfile'],
    queryFn: async (): Promise<CoachDiscoveryProfile | null> => {
      const response = await proxyClient.get<CoachDiscoveryProfile>(`/coach-discovery/profile`);
      return response;
    },
    retry: false,
    staleTime: 300000, // 5 minutes
  });
};

export const useCoachOverview = (timeDuration?: number) => {
  return useQuery({
    queryKey: ['coachOverview', timeDuration],
    queryFn: async (): Promise<{
      competitionLifts: any[];
      sessionSchedule: Record<string, any>;
      timeWindowDays: number;
    }> => {
      const params = timeDuration ? `?timeDuration=${timeDuration}` : '';
      const response = await proxyClient.get<
        Results<{
          competitionLifts: any[];
          sessionSchedule: Record<string, any>;
          timeWindowDays: number;
        }>
      >(`/coach-athlete/coach-interface-overview${params}`);
      return (
        response.data ?? {
          competitionLifts: [],
          sessionSchedule: {},
          timeWindowDays: timeDuration ?? 14,
        }
      );
    },
    retry: false,
    staleTime: 300000, // 5 minutes
  });
};
