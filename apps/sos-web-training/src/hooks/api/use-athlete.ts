import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { proxyClient } from '@/lib/proxy-client';
import { useAuth } from './use-auth-hooks';
import { AthleteProfile } from '@strengthos/shared-database';
import { AthletePreferences } from '@strengthos/shared-types';

export const athleteKeys = {
  all: ['athlete'] as const,
  list: () => [...athleteKeys.all, 'list'] as const,
};

export interface AthleteListResponse {
  athletes: {
    id: string;
    userId: string;
    tenantId: string;
    profile: AthleteProfile;
    preferences: AthletePreferences;
    currentProgram?: string;
    coachId?: string;
    created_at: Date;
    updated_at: Date;
    userEmail: string;
    firstName: string;
    lastName: string;
  }[];
  total: number;
  page: number;
  limit: number;
}

export const useAthleteList = (): UseQueryResult<AthleteListResponse> => {
  const { state } = useAuth();
  const user = state.user;
  return useQuery<AthleteListResponse>({
    queryKey: athleteKeys.list(),
    queryFn: async () => {
      return proxyClient.get<AthleteListResponse>(`/tenants/${user?.tenantId}/athletes`);
    },
    enabled: !!user?.tenantId,
  });
};
