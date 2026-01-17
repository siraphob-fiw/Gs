'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import { User } from '@strengthos/shared-types';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isLoggingOut: boolean;
}

export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'AUTH_FAILURE'; payload: { error: string } }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_LOGOUT_START' }
  | { type: 'AUTH_REFRESH_SUCCESS'; payload: { accessToken: string; refreshToken: string } }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_SET_LOADING'; payload: { isLoading: boolean } };

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isLoggingOut: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        ...action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...initialState,
        isLoading: false,
        error: action.payload.error,
      };
    case 'AUTH_LOGOUT_START':
      return { ...state, isLoggingOut: true, error: null };
    case 'AUTH_LOGOUT':
      return { ...initialState, isLoading: false };
    case 'AUTH_REFRESH_SUCCESS':
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isLoading: false,
        error: null,
      };
    case 'AUTH_CLEAR_ERROR':
      return { ...state, error: null };
    case 'AUTH_SET_LOADING':
      return { ...state, isLoading: action.payload.isLoading };
    default:
      return state;
  }
}

export interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithMethod: (data: {
    identifier: string;
    password?: string;
    authMethod: 'EMAIL' | 'WHATSAPP' | 'LINE' | 'OAUTH';
    verificationToken?: string;
    rememberMe?: boolean;
  }) => Promise<{ isAuthenticated: boolean; message?: string | null }>;
  register?: (userData: any) => Promise<void>;
  sendPhoneVerification?: (phoneNumber: string) => Promise<void>;
  registerWithPhone: (data: {
    phoneNumber: string;
    authMethod: 'WHATSAPP' | 'LINE';
    profile: {
      firstName: string;
      lastName: string;
      dateOfBirth?: string;
      gender?: string;
      bodyWeight?: number;
      height?: number;
      experienceLevel?: string;
    };
    verificationToken: string;
  }) => Promise<void>;
  requestPhoneVerification: (phoneNumber: string, method: 'SMS' | 'WHATSAPP') => Promise<void>;
  confirmPhoneVerification: (phoneNumber: string, token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  switchTenantContext: (tenantId: string) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
  registerWithEmail: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
  }) => Promise<{ success: boolean; message: string }>;
  setAuthState: (data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    tenantId: string;
  }) => void;
  loginWithOAuth: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const cookieManager = {
  setCookie(name: string, value: string, days = 7): void {
    if (typeof window === 'undefined') return;
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${value};expires=${expires};path=/;SameSite=Lax;${window.location.protocol === 'https:' ? 'Secure;' : ''}`;
  },
  getCookie(name: string): string | null {
    if (typeof window === 'undefined') return null;
    const nameEQ = `${name}=`;
    return (
      document.cookie
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(nameEQ))
        ?.substring(nameEQ.length) || null
    );
  },
  deleteCookie(name: string): void {
    if (typeof window === 'undefined') return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  },
};
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication from storage once on mount
  useEffect(() => {
    const accessToken = cookieManager.getCookie('auth_access_token');
    const refreshToken = cookieManager.getCookie('auth_refresh_token');
    const user = cookieManager.getCookie('auth_user');

    if (accessToken && refreshToken && user) {
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: JSON.parse(user), accessToken, refreshToken },
      });
    } else {
      dispatch({ type: 'AUTH_SET_LOADING', payload: { isLoading: false } });
    }
  }, []);

  // Listen for logout events from API client
  useEffect(() => {
    const handleLogoutEvent = (_event: any) => {
      cookieManager.deleteCookie('auth_access_token');
      cookieManager.deleteCookie('auth_refresh_token');
      cookieManager.deleteCookie('auth_user');
      dispatch({ type: 'AUTH_LOGOUT' });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:logout', handleLogoutEvent as EventListener);
      return () => window.removeEventListener('auth:logout', handleLogoutEvent as EventListener);
    }
  }, []);

  // Automatic token refresh scheduler
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (state.isAuthenticated && state.refreshToken) {
      import('../lib/token-manager').then(({ tokenRefreshScheduler }) => {
        tokenRefreshScheduler.start(async () => {
          const currentRefreshToken = cookieManager.getCookie('auth_refresh_token');
          if (!currentRefreshToken) {
            cookieManager.deleteCookie('auth_access_token');
            cookieManager.deleteCookie('auth_refresh_token');
            cookieManager.deleteCookie('auth_user');
            dispatch({ type: 'AUTH_LOGOUT' });
            return;
          }
          try {
            const authService = (await import('../hooks/api/use-auth')).default;
            const result = await authService.refreshToken({ refreshToken: currentRefreshToken });
            if (result?.success && result.data) {
              const { user, accessToken, refreshToken: newRefreshToken } = result.data;
              cookieManager.setCookie('auth_access_token', accessToken, 7);
              cookieManager.setCookie('auth_refresh_token', newRefreshToken, 30);
              cookieManager.setCookie('auth_user', JSON.stringify(user), 7);
              dispatch({
                type: 'AUTH_REFRESH_SUCCESS',
                payload: { accessToken, refreshToken: newRefreshToken },
              });
            } else {
              cookieManager.deleteCookie('auth_access_token');
              cookieManager.deleteCookie('auth_refresh_token');
              cookieManager.deleteCookie('auth_user');
              dispatch({ type: 'AUTH_LOGOUT' });
            }
          } catch {
            cookieManager.deleteCookie('auth_access_token');
            cookieManager.deleteCookie('auth_refresh_token');
            cookieManager.deleteCookie('auth_user');
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        });
        cleanup = () => tokenRefreshScheduler.stop();
      });
    } else {
      import('../lib/token-manager').then(({ tokenRefreshScheduler }) => {
        tokenRefreshScheduler.stop();
      });
    }
    return () => {
      if (cleanup) cleanup();
      else {
        import('../lib/token-manager').then(({ tokenRefreshScheduler }) =>
          tokenRefreshScheduler.stop(),
        );
      }
    };
  }, [state.isAuthenticated, state.refreshToken]);

  // Functions memoized with useCallback for better referential stability
  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
      await loginWithMethod({
        identifier: email,
        password,
        authMethod: 'EMAIL',
        rememberMe,
      });
    },
    [],
  );

  const loginWithMethod: AuthContextType['loginWithMethod'] = useCallback(async (data) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const authService = (await import('../hooks/api/use-auth')).default;
      const result = await authService.login({
        identifier: data.identifier,
        password: data.password,
        authMethod: data.authMethod,
        verificationToken: data.verificationToken,
        rememberMe: data.rememberMe || false,
      });

      if (result?.success && result.data) {
        const { user, accessToken, refreshToken } = result.data;
        cookieManager.setCookie('auth_access_token', accessToken, 7);
        cookieManager.setCookie('auth_refresh_token', refreshToken, 30);
        cookieManager.setCookie('auth_user', JSON.stringify(user), 7);
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, accessToken, refreshToken } });
        return { isAuthenticated: true };
      } else {
        if (result?.error === 'pending_verification') {
          dispatch({
            type: 'AUTH_FAILURE',
            payload: { error: 'This account needs to be verified first' },
          });
          return {
            isAuthenticated: false,
            message: 'This account needs to be verified first',
          };
        } else if (result?.error === 'pending_approval') {
          dispatch({
            type: 'AUTH_FAILURE',
            payload: { error: 'This account is on pending approval' },
          });
          return {
            isAuthenticated: false,
            message: 'This account is on pending approval',
          };
        } else {
          dispatch({ type: 'AUTH_FAILURE', payload: { error: result?.message || 'Login failed' } });
          return {
            isAuthenticated: false,
            message: result?.message || 'Login failed',
          };
        }
      }
    } catch (error: any) {
      return {
        isAuthenticated: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }, []);

  const registerWithPhone: AuthContextType['registerWithPhone'] = useCallback(async (data) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const authService = (await import('../hooks/api/use-auth')).default;
      const result = await authService.registerWithPhone({
        phoneNumber: data.phoneNumber,
        authMethod: data.authMethod,
        profile: data.profile,
        verificationToken: data.verificationToken,
      });

      if (result?.success && result.data) {
        const { user, accessToken, refreshToken } = result.data;
        cookieManager.setCookie('auth_access_token', accessToken, 7);
        cookieManager.setCookie('auth_refresh_token', refreshToken, 30);
        cookieManager.setCookie('auth_user', JSON.stringify(user), 7);
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, accessToken, refreshToken } });
      } else {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: { error: result?.message || 'Registration failed' },
        });
      }
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: { error: error instanceof Error ? error.message : 'Registration failed' },
      });
    }
  }, []);

  const requestPhoneVerification: AuthContextType['requestPhoneVerification'] = useCallback(
    async (phoneNumber, method) => {
      const authService = (await import('../hooks/api/use-auth')).default;
      const result = await authService.requestPhoneVerification({
        phoneNumber,
        method,
      });
      if (!result?.success) throw new Error(result.message || 'Failed to send verification code');
    },
    [],
  );

  const confirmPhoneVerification: AuthContextType['confirmPhoneVerification'] = useCallback(
    async (phoneNumber, token) => {
      try {
        const authService = (await import('../hooks/api/use-auth')).default;
        const result = await authService.confirmPhoneVerification({
          phoneNumber,
          token,
        });
        return !!result?.success && !!result?.data;
      } catch {
        return false;
      }
    },
    [],
  );

  const logout: AuthContextType['logout'] = useCallback(async () => {
    if (state.isLoggingOut) return;
    dispatch({ type: 'AUTH_LOGOUT_START' });
    try {
      const authService = (await import('../hooks/api/use-auth')).default;
      if (state.user?.id) {
        const result = await authService.logout(state.user.id);
        if (result?.success) {
          cookieManager.deleteCookie('auth_access_token');
          cookieManager.deleteCookie('auth_refresh_token');
          cookieManager.deleteCookie('auth_user');
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }
      cookieManager.deleteCookie('auth_access_token');
      cookieManager.deleteCookie('auth_refresh_token');
      cookieManager.deleteCookie('auth_user');
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch {
      cookieManager.deleteCookie('auth_access_token');
      cookieManager.deleteCookie('auth_refresh_token');
      cookieManager.deleteCookie('auth_user');
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, [state.isLoggingOut, state.user?.id]);

  const refreshToken: AuthContextType['refreshToken'] = useCallback(async () => {
    const currentRefreshToken = cookieManager.getCookie('auth_refresh_token');
    if (!currentRefreshToken) {
      dispatch({ type: 'AUTH_LOGOUT' });
      return;
    }
    try {
      const authService = (await import('../hooks/api/use-auth')).default;
      const result = await authService.refreshToken({ refreshToken: currentRefreshToken });
      if (result?.success && result.data) {
        const { user, accessToken, refreshToken: newRefreshToken } = result.data;
        cookieManager.setCookie('auth_access_token', accessToken, 7);
        cookieManager.setCookie('auth_refresh_token', newRefreshToken, 30);
        cookieManager.setCookie('auth_user', JSON.stringify(user), 7);
        dispatch({
          type: 'AUTH_REFRESH_SUCCESS',
          payload: { accessToken, refreshToken: newRefreshToken },
        });
      } else {
        cookieManager.deleteCookie('auth_access_token');
        cookieManager.deleteCookie('auth_refresh_token');
        cookieManager.deleteCookie('auth_user');
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } catch {
      cookieManager.deleteCookie('auth_access_token');
      cookieManager.deleteCookie('auth_refresh_token');
      cookieManager.deleteCookie('auth_user');
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  const switchTenantContext: AuthContextType['switchTenantContext'] = useCallback(
    async (tenantId) => {
      try {
        const authService = (await import('../hooks/api/use-auth')).default;
        const result = await authService.switchTenantContext(tenantId);
        if (result?.success && result.data) {
          return { success: true };
        }
        return { success: false, message: result?.message || 'Failed to switch tenant' };
      } catch (error: any) {
        return { success: false, message: error?.message || 'Failed to switch tenant' };
      }
    },
    [],
  );

  const clearError: AuthContextType['clearError'] = useCallback(() => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  }, []);

  const setAuthState: AuthContextType['setAuthState'] = useCallback((data) => {
    cookieManager.setCookie('auth_access_token', data.accessToken, 7);
    cookieManager.setCookie('auth_refresh_token', data.refreshToken, 30);
    cookieManager.setCookie('auth_user', JSON.stringify(data.user), 7);
    dispatch({
      type: 'AUTH_SUCCESS',
      payload: { user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken },
    });
  }, []);

  const registerWithEmail: AuthContextType['registerWithEmail'] = useCallback(async (data) => {
    try {
      const authService = (await import('../hooks/api/use-auth')).default;
      const result = await authService.registerWithEmail({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
        authMethod: 'EMAIL',
      });
      return result;
    } catch (error: any) {
      return { success: false, message: error?.message || 'Registration failed' };
    }
  }, []);

  const loginWithOAuth: AuthContextType['loginWithOAuth'] = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      let oauthUrl = '';
      if (process.env.NODE_ENV === 'development') {
        oauthUrl = `http://localhost:3001/api/v1/auth/google`;
      } else {
        oauthUrl = `${apiUrl}/openapi/api/v1/auth/google`;
      }
      window.location.href = oauthUrl;
      return { success: true, message: 'Redirecting to Google...' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'OAuth redirect failed' };
    }
  }, []);

  // Memoize context value to prevent unnecessary rerenders
  const contextValue = useMemo<AuthContextType>(
    () => ({
      state,
      login,
      loginWithMethod,
      registerWithPhone,
      registerWithEmail,
      requestPhoneVerification,
      confirmPhoneVerification,
      logout,
      refreshToken,
      switchTenantContext,
      clearError,
      setAuthState,
      loginWithOAuth,
    }),
    [
      state,
      login,
      loginWithMethod,
      registerWithPhone,
      registerWithEmail,
      requestPhoneVerification,
      confirmPhoneVerification,
      logout,
      refreshToken,
      switchTenantContext,
      clearError,
      setAuthState,
      loginWithOAuth,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// Hooks (optimized)
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
export function useUser(): User | null {
  return useAuth().state.user;
}
export function useIsAuthenticated(): boolean {
  return useAuth().state.isAuthenticated;
}
export function useAuthLoading(): boolean {
  return useAuth().state.isLoading;
}
export function useAuthError(): string | null {
  return useAuth().state.error;
}
