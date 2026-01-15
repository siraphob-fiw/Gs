import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { proxyClient } from '@/lib/proxy-client';
import { Gender, UserRole, UserStatus } from '@strengthos/shared-types';
import { UserPreferences, WeeklyAvailability } from '@strengthos/shared-types/src/user-management';
import { cookieManager } from '@/contexts/auth-context';

// ---------- Types ----------
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: Date | string | null;
  gender: Gender;
  body_weight?: number | null;
  height?: number | null;
  phone: string;
  created_at: Date | string;
  updated_at: Date | string;
  last_login_at: Date | string;
  email_verified_at?: Date | string | null;
  suspended_at?: Date | string | null;
  reset_token?: string | null;
  reset_token_expires?: Date | string | null;
  email_verification_token?: string | null;
  email_verification_expires?: Date | string | null;
  phone_verified: boolean;
  phone_verified_at?: Date | string | null;
  phone_verification_token?: string | null;
  phone_verification_expires_at?: Date | string | null;
  auth_providers?: Record<string, string>;
  whatsapp_data?: Record<string, string>;
  line_data?: Record<string, string>;
  preferences?: Record<string, string>;
}

export interface UpdateUserRequest {
  status?: UserStatus;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  bodyWeight?: number;
  height?: number;
  phone?: string;
  preferences?: Record<string, string>;
}

export interface TenantUserFilters {
  tenantId?: string;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserListResponse {
  users: UserResponseWithCoachIdDto[];
  total: number;
  page: number;
  limit: number;
}

export interface UserResponse {
  id: string;
  tenantId: string;
  tenantName?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  phoneVerified?: boolean;
  phoneVerifiedAt?: Date;
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date | null;
    gender?: Gender;
    bodyWeight?: number;
    height?: number;
  };
  preferences?: Record<string, string>;
  auth_providers?: Record<string, string>;
  whatsappData?: Record<string, string>;
  lineData?: Record<string, string>;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
  email_verified_at?: Date;
  suspended_at?: Date;
}

export interface UserResponseWithCoachIdDto extends UserResponse {
  coachId?: string;
  coachName?: string;
}

export interface ApprovalCoachDto {
  coaches: CoachWithProfile[];
  total: number;
}

export interface CoachWithProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  profile: {
    bio: string;
    specializations: string[];
    certifications: string[];
    hourly_rate: number;
    currency: string;
    is_available: boolean;
    availability: WeeklyAvailability;
    social_links: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface athleteInvitationFilter {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
  availableToInvite?: boolean;
}

// ---------- Hooks ----------
export const useUsers = (filters: TenantUserFilters): UseQueryResult<UserListResponse> =>
  useQuery({
    queryKey: ['users', filters],
    queryFn: async (): Promise<UserListResponse> => {
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      const res = await proxyClient.get(`/users?${params.toString()}`);
      return res as UserListResponse;
    },
    retry: false,
  });

export const useUserById = (userId: string) =>
  useQuery({
    queryKey: ['users', userId],
    queryFn: async (): Promise<UserResponse> => {
      const res = await proxyClient.get(`/users/${userId}`);
      return res as UserResponse;
    },
    enabled: Boolean(userId),
    retry: false,
  });

export const useTenantUsers = (filters: TenantUserFilters) =>
  useQuery({
    queryKey: ['tenants', 'users', filters],
    queryFn: async () => {
      const authUser = cookieManager.getCookie('auth_user');
      const tenantId = JSON.parse(authUser || '{}').tenantId;
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (authUser && JSON.parse(authUser).role !== UserRole.SUPER_ADMIN) {
        const res = await proxyClient.get(`/tenants/${tenantId}/users?${params.toString()}`);
        return res;
      } else {
        const res = await proxyClient.get(`/users?${params.toString()}`);
        return res;
      }
    },
    enabled: true,
    retry: false,
  });

export const useTenantUserStats = () =>
  useQuery({
    queryKey: ['tenants', 'users', 'stats'],
    queryFn: async (): Promise<{
      totalUsers: number;
      activeUsers: number;
      usersByRole: Record<string, number>;
      usersByStatus: Record<string, number>;
      recentRegistrations: number;
    }> => {
      const authUser = cookieManager.getCookie('auth_user');
      const tenantId = JSON.parse(authUser || '{}').tenantId;
      let res;
      if(tenantId) {
        res = await proxyClient.get(`/tenants/${tenantId}/users/stats`);
      } else if(JSON.parse(authUser || '{}').role === UserRole.SUPER_ADMIN) {
        res = await proxyClient.get(`/tenants/users/stats`);
      } else {
        return  {
          totalUsers: 0,
          activeUsers: 0,
          usersByRole: {},
          usersByStatus: {},
          recentRegistrations: 0,
        };
      }
      return res as {
        totalUsers: number;
        activeUsers: number;
        usersByRole: Record<string, number>;
        usersByStatus: Record<string, number>;
        recentRegistrations: number;
      };
    },
    enabled: true,
    retry: false,
  });

export const useUpdateUser = (): UseMutationResult<
  UserResponse,
  Error,
  {
    id: string;
    data: UpdateUserRequest;
    tenantId?: string;
  }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      tenantId,
    }: {
      id: string;
      data: UpdateUserRequest;
      tenantId?: string;
    }) => {
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      return await proxyClient.put(`/users/${id}`, data, headers);
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific user query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
      // Also invalidate tenant users list in case it's being displayed
      queryClient.invalidateQueries({ queryKey: ['tenants', 'users'] });
    },
    retry: false,
  });
};

export const useDeleteUser = () => {
  return useMutation({
    mutationFn: async ({ userId, tenantId }: { userId: string; tenantId?: string }) => {
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      await proxyClient.delete<void>(`/users/${userId}`, headers);
    },
    retry: false,
  });
};

export const useUpdateUserStatus = () => {
  return useMutation({
    mutationFn: async ({
      userId,
      status,
      tenantId,
    }: {
      userId: string;
      status: UserStatus;
      tenantId?: string;
    }) => {
      if (userId && status) {
        const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
        await proxyClient.put<void>(`/users/${userId}/status`, { status: status }, headers);
      }
    },
    retry: false,
  });
};

export const useTrainingPreferences = (userId: string) =>
  useQuery({
    queryKey: ['users', userId, 'training-preferences'],
    queryFn: async (): Promise<Record<string, string>> => {
      const res = await proxyClient.get(`/users/${userId}/training-preferences`);
      return res as Record<string, string>;
    },
    enabled: Boolean(userId),
    retry: false,
  });

export const useUpdateTrainingPreferences = () => {
  return useMutation({
    mutationFn: async ({
      userId,
      preferences,
      tenantId,
    }: {
      userId: string;
      preferences: UserPreferences;
      tenantId?: string;
    }) => {
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      await proxyClient.put<void>(`/users/${userId}/training-preferences`, preferences, headers);
    },
    retry: false,
  });
};

export const useAssignRoleUser = () => {
  return useMutation({
    mutationFn: async ({
      userId,
      role,
      tenantId,
    }: {
      userId: string;
      role: UserRole;
      tenantId?: string;
    }) => {
      const headers: Record<string, string> = tenantId ? { 'x-tenant-id': tenantId } : {};
      const res = await proxyClient.put(`/users/${userId}/role`, { role: role }, headers);
      return res;
    },
    retry: false,
  });
};

export const useApprovalCoachList = (): UseQueryResult<ApprovalCoachDto> => {
  return useQuery({
    queryKey: ['users', 'approval-coach-list'],
    queryFn: async (): Promise<ApprovalCoachDto> => {
      const res = await proxyClient.get(`/users/approval-coach-list`);
      return res as ApprovalCoachDto;
    },
    retry: false,
  });
};

export const useAssignTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, tenantId }: { userId: string; tenantId: string }) => {
      const res = await proxyClient.put(`/super-admin/users/${userId}/tenant`, { tenantId });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    retry: false,
  });
};

export const useAthleteInvitation = (filters: athleteInvitationFilter) =>
  useQuery({
    queryKey: ['users', 'athlete-invitation', filters],
    queryFn: async (): Promise<UserListResponse> => {
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.availableToInvite) params.append('availableToInvite', filters.availableToInvite.toString());
      const res = await proxyClient.get(`/users?${params.toString()}`);
      return res as UserListResponse;
    },
    retry: false,
  });
