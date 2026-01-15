import { UseMutationResult, UseQueryResult, useMutation, useQuery } from '@tanstack/react-query';
import { proxyClient } from '@/lib/proxy-client';
import { Gender, UserRole, UserStatus } from '@strengthos/shared-types';
import { cookieManager } from '@/contexts/auth-context';

export interface UserResponse {
  id: string;
  tenantId: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  phoneVerified: boolean;
  phoneVerifiedAt: Date;
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date | null;
    gender?: Gender;
    bodyWeight?: number;
    height?: number;
  };
  preferences: Record<string, any>;
  hasPassword?: boolean;
  auth_providers: Record<string, any>;
  whatsappData: Record<string, any>;
  lineData: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date;
  email_verified_at: Date;
  suspended_at: Date;
}

export const useAuthApi = (): UseQueryResult<UserResponse> => {
  return useQuery<UserResponse>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await proxyClient.get<UserResponse>('/auth/profile');
      return response;
    },
  });
};

export const useVerifyEmailApi = (): UseMutationResult<
  { status: boolean; message: string },
  Error,
  { token: string }
> => {
  return useMutation({
    mutationFn: async ({ token }) => {
      const response = await proxyClient.get<{ status: boolean; message: string }>(
        `/auth/verify-email/${token}`,
      );
      return response;
    },
  });
};

export const useChangePasswordApi = (): UseMutationResult<
  { success: boolean; message: string },
  Error,
  { currentPassword?: string; newPassword: string }
> => {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const response = await proxyClient.post<Record<string, any> | null>('/auth/change-password', {
        ...(currentPassword && { currentPassword }),
        newPassword,
      });

      // Check if response.data exists and has the required fields
      if (response && response?.accessToken && response?.refreshToken && response?.user) {
        cookieManager.setCookie('auth_access_token', response?.accessToken, 7);
        cookieManager.setCookie('auth_refresh_token', response?.refreshToken, 30);
        cookieManager.setCookie('auth_user', JSON.stringify(response?.user), 7);

        return { success: true, message: 'Password changed successfully' };
      }

      // If response.data is null or missing required fields, return error
      throw new Error(response?.message || 'Password change failed - invalid response from server');
    },
  });
};

export const useSendResetPasswordEmailApi = (): UseMutationResult<
  { success: boolean; message: string },
  Error,
  { email: string }
> => {
  return useMutation({
    mutationFn: async ({ email }) => {
      const payload = {
        email: email,
      };

      const response = await proxyClient.post<Record<string, any> | null>(
        '/auth/send-reset-password-email',
        payload,
      );

      if (response) {
        return { success: true, message: 'Password reset instructions sent to your email' };
      }
      return { success: false, message: 'Password reset instructions failed to send' };
    },
  });
};

export const useValidateResetPasswordTokenApi = (): UseMutationResult<
  { success: boolean; message: string; userId: string },
  Error,
  { token: string }
> => {
  return useMutation({
    mutationFn: async ({ token }) => {
      const response = await proxyClient.post<{
        success: boolean;
        message: string;
        userId: string;
      }>('/auth/validate-reset-password-token', {
        token,
      });
      return response;
    },
  });
};

export const useResetPasswordApi = (): UseMutationResult<
  { success: boolean; message: string },
  Error,
  { token: string; userId: string; newPassword: string }
> => {
  return useMutation({
    mutationFn: async ({ token, userId, newPassword }) => {
      const payload = {
        userId,
        newPassword,
        token,
      };

      const response = await proxyClient.post<{
        success: boolean;
        message: string;
      }>('/auth/reset-password', payload);

      // Defensive: check for required success fields (success, message)
      if (
        response &&
        typeof response.success === 'boolean' &&
        typeof response.message === 'string'
      ) {
        return {
          success: response.success,
          message: response.message,
        };
      }

      // Non-standard response
      throw new Error(
        response?.message ||
          'Password reset failed - invalid response from server'
      );
    },
  });
};


export const useSetUpPasswordApi = (): UseMutationResult<
  { success: boolean; message: string },
  Error,
  { token: string; password: string }
> => {
  return useMutation({
    mutationFn: async ({ token, password }) => {
      const response = await proxyClient.post<Record<string, any> | null>('/auth/set-up-password', {
        token,
        password,
      });

      if (response) {
        cookieManager.setCookie('auth_access_token', response.accessToken, 7);
        cookieManager.setCookie('auth_refresh_token', response.refreshToken, 30);
        cookieManager.setCookie('auth_user', JSON.stringify(response.user), 7);

        return { success: true, message: 'Password set up successfully' };
      }
      return { success: false, message: 'Password set up failed' };
    },
  });
};
