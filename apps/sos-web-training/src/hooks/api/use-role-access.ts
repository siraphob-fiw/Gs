import { useAuth } from '@/contexts/auth-context';
import { TokenManager } from '@/lib/token-manager';

/**
 * Centralized roles and permissions configuration for easy optimization and maintainability.
 */
const ROLES = {
  ATHLETE: 'ATHLETE',
  SELF_COACHED: 'SELF_COACHED',
  COACH: 'COACH',
  COACH_ADMIN: 'COACH_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

// Precomputed role groups to avoid re-creating arrays on every call
const ROLE_GROUPS = {
  user: [ROLES.ATHLETE, ROLES.SELF_COACHED],
  coach: [ROLES.COACH, ROLES.COACH_ADMIN],
  admin: [ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN],
  canEdit: [ROLES.COACH, ROLES.COACH_ADMIN, ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN],
  canAccessTraining: [ROLES.ATHLETE, ROLES.SELF_COACHED, ROLES.COACH, ROLES.COACH_ADMIN],
  canManageClients: [ROLES.COACH, ROLES.COACH_ADMIN],
  canAccessGlobalLibrary: [ROLES.COACH_ADMIN, ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN],
};

export function useRoleAccess() {
  const { state } = useAuth();
  const user = state.user;
  const userRole = user?.role as string | undefined;

  const hasRole = (role: string): boolean => !!userRole && userRole === role;

  const hasAnyRole = (roles: string[]): boolean => !!userRole && roles.includes(userRole);

  // Memoized grouped role checks
  const isUser = (): boolean => hasAnyRole(ROLE_GROUPS.user);
  const isCoach = (): boolean => hasAnyRole(ROLE_GROUPS.coach);
  const isAdmin = (): boolean => hasAnyRole(ROLE_GROUPS.admin);

  const hasPermission = (permission: string): boolean => TokenManager.hasPermission(permission);

  return {
    user,
    hasRole,
    hasAnyRole,
    isUser,
    isCoach,
    isAdmin,
    hasPermission,
    currentRole: userRole,
  };
}

export default useRoleAccess;
