import { useState, useCallback } from 'react';
import { proxyClient } from '@/lib/proxy-client';
import {
  CoachDiscoveryProfile,
  CoachRequest,
  CreateCoachRequestRequest,
  RespondToCoachRequestRequest,
} from '../../types/coaching';

export interface CoachDiscoveryFilters {
  specializations?: string[];
  languages?: string[];
  location?: string;
  maxHourlyRate?: number;
  minRating?: number;
  availableSlots?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export const useCoachDiscovery = () => {
  const [coaches, setCoaches] = useState<CoachDiscoveryProfile[]>([]);
  const [coachRequests, setCoachRequests] = useState<CoachRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCoaches = useCallback(async (filters: CoachDiscoveryFilters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await proxyClient.get<CoachDiscoveryProfile[]>('/coach-discovery/search', {
        params: filters as any,
      });

      setCoaches(response);
    } catch (err: any) {
      setError(err.message || 'Failed to search coaches');
      console.error('Error searching coaches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestCoach = useCallback(async (request: CreateCoachRequestRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await proxyClient.post<CoachRequest>('/coach-discovery/request', request);

      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send coach request';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCoachRequests = useCallback(async (type: 'sent' | 'received', status?: string) => {
    setLoading(true);
    setError(null);

    try {
      const endpoint =
        type === 'sent' ? '/coach-discovery/requests/sent' : '/coach-discovery/requests/received';
      const response = await proxyClient.get<CoachRequest[]>(endpoint, {
        params: status ? ({ status } as any) : ({} as any),
      });

      setCoachRequests(response);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to get coach requests');
      console.error('Error getting coach requests:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const respondToRequest = useCallback(
    async (requestId: string, response: RespondToCoachRequestRequest) => {
      setLoading(true);
      setError(null);

      try {
        const apiResponse = await proxyClient.put<CoachRequest>(
          `/coach-discovery/request/${requestId}/respond`,
          response,
        );

        return apiResponse;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to respond to coach request';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const cancelRequest = useCallback(async (requestId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await proxyClient.delete<void>(`/coach-discovery/request/${requestId}`);

      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to cancel coach request';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCoachProfile = useCallback(async (profileData: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await proxyClient.post<CoachDiscoveryProfile>(
        '/coach-discovery/profile',
        profileData,
      );

      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create coach profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCoachProfile = useCallback(async (profileData: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await proxyClient.put<CoachDiscoveryProfile>(
        '/coach-discovery/profile',
        profileData,
      );

      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update coach profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCoachProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await proxyClient.get<CoachDiscoveryProfile>('/coach-discovery/profile');

      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to get coach profile');
      console.error('Error getting coach profile:', err);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    coaches,
    coachRequests,
    loading,
    error,
    searchCoaches,
    requestCoach,
    getCoachRequests,
    respondToRequest,
    cancelRequest,
    createCoachProfile,
    updateCoachProfile,
    getCoachProfile,
  };
};
