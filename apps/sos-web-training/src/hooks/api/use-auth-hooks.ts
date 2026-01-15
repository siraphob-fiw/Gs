import { useCallback, useEffect } from 'react';
import { useAuth as useAuthContext } from '../../contexts/auth-context';
import { UserRole } from '@strengthos/shared-types';

export { useAuth } from '../../contexts/auth-context';

export function useLogin() {
  const { login, state } = useAuthContext();

  const handleLogin = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
      await login(email, password, rememberMe);
    },
    [login],
  );

  return {
    login: handleLogin,
    isLoading: state.isLoading,
    error: state.error,
  };
}

export function useLogout() {
  const { logout, state } = useAuthContext();

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return {
    logout: handleLogout,
    isLoading: state.isLoading,
  };
}

export function useTokenRefresh() {
  const { refreshToken, state } = useAuthContext();

  const handleRefreshToken = useCallback(async () => {
    await refreshToken();
  }, [refreshToken]);

  return {
    refreshToken: handleRefreshToken,
    isLoading: state.isLoading,
    error: state.error,
  };
}

export function useAutoTokenRefresh() {
  const { state, refreshToken } = useAuthContext();

  useEffect(() => {
    if (!state.isAuthenticated || !state.accessToken) {
      return;
    }

    const refreshInterval = setInterval(
      () => {
        if (state.isAuthenticated && state.accessToken) {
          refreshToken();
        }
      },
      55 * 60 * 1000,
    );

    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated, state.accessToken, refreshToken]);
}

export function useUserRole() {
  const { state } = useAuthContext();

  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return state.user?.role === role;
    },
    [state.user],
  );

  const hasAnyRole = useCallback(
    (roles: UserRole[]): boolean => {
      return state.user ? roles.includes(state.user.role as UserRole) : false;
    },
    [state.user],
  );

  const isUser = useCallback((): boolean => {
    return hasRole(UserRole.ATHLETE) || hasRole(UserRole.SELF_COACHED);
  }, [hasRole]);

  const isCoach = useCallback((): boolean => {
    return hasRole(UserRole.COACH) || hasRole(UserRole.COACH_ADMIN);
  }, [hasRole]);

  const isAdmin = useCallback((): boolean => {
    return hasRole(UserRole.SUPER_ADMIN) || hasRole(UserRole.COACH_ADMIN);
  }, [hasRole]);

  return {
    hasRole,
    hasAnyRole,
    isUser,
    isCoach,
    isAdmin,
    currentRole: state.user?.role,
  };
}

export function useUserPermissions() {
  const { state } = useAuthContext();
  const { hasRole, hasAnyRole } = useUserRole();

  const canAccessTraining = useCallback((): boolean => {
    return hasAnyRole([
      UserRole.ATHLETE,
      UserRole.SELF_COACHED,
      UserRole.COACH,
      UserRole.COACH_ADMIN,
    ]);
  }, [hasAnyRole]);

  const canManageClients = useCallback((): boolean => {
    return hasRole(UserRole.COACH) || hasRole(UserRole.COACH_ADMIN);
  }, [hasRole]);

  const canAccessAdminFeatures = useCallback((): boolean => {
    return hasRole(UserRole.SUPER_ADMIN) || hasRole(UserRole.COACH_ADMIN);
  }, [hasRole]);

  const canEditWorkout = useCallback(
    (workoutUserId?: string): boolean => {
      if (!state.user) return false;

      // Users can edit their own workouts
      if (
        (hasRole(UserRole.ATHLETE) || hasRole(UserRole.SELF_COACHED)) &&
        workoutUserId === state.user.id
      ) {
        return true;
      }

      // Coaches can edit their clients' workouts
      if (hasRole(UserRole.COACH) || hasRole(UserRole.COACH_ADMIN)) {
        return true; // In a real app, you'd check if the workout belongs to the coach's client
      }

      return false;
    },
    [state.user, hasRole],
  );

  return {
    canAccessTraining,
    canManageClients,
    canAccessAdminFeatures,
    canEditWorkout,
  };
}

export function useSessionManagement() {
  const { state, logout } = useAuthContext();

  const handleSessionExpired = useCallback(async () => {
    await logout();
  }, [logout]);

  const isSessionValid = useCallback((): boolean => {
    return state.isAuthenticated && !!state.accessToken;
  }, [state.isAuthenticated, state.accessToken]);

  return {
    handleSessionExpired,
    isSessionValid,
    user: state.user,
    isAuthenticated: state.isAuthenticated,
  };
}

export function useAuthError() {
  const { state, clearError } = useAuthContext();

  const handleClearError = useCallback(() => {
    clearError();
  }, [clearError]);

  return {
    error: state.error,
    hasError: !!state.error,
    clearError: handleClearError,
  };
}

export function useProtectedAction() {
  const { state } = useAuthContext();

  const executeIfAuthenticated = useCallback(
    (action: (...args: any[]) => any, fallback?: () => void) => {
      return (...args: any[]): any => {
        if (state.isAuthenticated) {
          return action(...args);
        } else {
          if (fallback) {
            fallback();
          }
          return;
        }
      };
    },
    [state.isAuthenticated],
  );

  return {
    executeIfAuthenticated,
    isAuthenticated: state.isAuthenticated,
  };
}

export function useUserProfile() {
  const { state } = useAuthContext();

  const getDisplayName = useCallback((): string => {
    if (!state.user) return '';

    return (
      (state.user as any).name ||
      (state.user as any).profile?.firstName ||
      state.user.email ||
      'Athlete'
    );
  }, [state.user]);

  const getInitials = useCallback((): string => {
    if (!state.user) return '';

    const nameParts = (state.user as any).name?.split(' ') || [];
    let initials = '';

    if (nameParts.length >= 2) {
      initials =
        nameParts[0].charAt(0).toUpperCase() +
        nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    } else if (nameParts.length === 1) {
      initials = nameParts[0].charAt(0).toUpperCase();
    }

    if (!initials && state.user.email) {
      initials = state.user.email.charAt(0).toUpperCase();
    }

    return initials;
  }, [state.user]);

  return {
    user: state.user,
    displayName: getDisplayName(),
    initials: getInitials(),
    email: state.user?.email,
    role: state.user?.role,
    tenantId: state.user?.tenantId,
  };
}
