'use client';

import React, { useEffect, ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useAuthLoading } from '../../contexts/auth-context';
import { useUserRole } from '../../hooks/api/use-auth-hooks';
import { useRoleAccess } from '@/hooks/api/use-role-access';
// Loading component
function AuthLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-info"></div>
    </div>
  );
}

// Unauthorized component
function UnauthorizedAccess({ requiredRoles }: { requiredRoles?: UserRole[] }) {
  const router = useRouter();
  const { isAdmin } = useRoleAccess();
  return (
    <div className="min-h-screen flex items-center justify-center bg-backgroundSecondary">
      <div className="max-w-md w-full bg-surface shadow-lg rounded-lg p-6 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-error"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-medium text-textSecondary mb-2">Access Denied</h1>
        <p className="text-textMuted mb-4">
          You don&apos;t have permission to access this page.
          {requiredRoles && requiredRoles.length > 0 && (
            <span className="block mt-2 text-sm">Required role(s): {requiredRoles.join(', ')}</span>
          )}
        </p>
        <div className="space-y-2">
          <button
            onClick={() => router.back()}
            className="w-full bg-text hover:bg-textHover text-surface font-medium py-2 px-4 rounded-md transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => {
              if (isAdmin()) {
                router.push('/admin');
              } else {
                router.push('/dashboard');
              }
            }}
            className="w-full bg-info hover:bg-infoHover text-surface font-medium py-2 px-4 rounded-md transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

import { UserRole } from '@strengthos/shared-types';

// Options for the withAuth HOC
export interface WithAuthOptions {
  requiredRoles?: UserRole[];
  allowUnauthenticated?: boolean;
}

/**
 * Higher-order component that adds authentication protection to a page
 */
export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {},
) {
  const { requiredRoles = [], allowUnauthenticated = false } = options;

  const AuthenticatedComponent = (props: P) => {
    const router = useRouter();
    const isAuthenticated = useIsAuthenticated();
    const isLoading = useAuthLoading();
    const { hasAnyRole } = useUserRole();

    useEffect(() => {
      // Don't redirect while loading
      if (isLoading) return;

      // If authentication is not required, allow access
      if (allowUnauthenticated) return;

      // Redirect to login if not authenticated
      if (!isAuthenticated) {
        router.push(`/`);
        return;
      }

      // Check role requirements
      if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
        // User doesn't have required role, but we'll show unauthorized component
        // instead of redirecting to allow them to see the error
        return;
      }
    }, [isAuthenticated, isLoading, hasAnyRole, router]);

    // Show loading spinner while checking authentication
    if (isLoading) {
      return <AuthLoadingSpinner />;
    }

    // If authentication is not required, render the component
    if (allowUnauthenticated) {
      return <WrappedComponent {...props} />;
    }

    // If not authenticated, don't render anything (redirect will happen)
    if (!isAuthenticated) {
      return <AuthLoadingSpinner />;
    }

    // Check role requirements
    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
      return <UnauthorizedAccess requiredRoles={requiredRoles} />;
    }

    // All checks passed, render the wrapped component
    return <WrappedComponent {...props} />;
  };

  // Set display name for debugging
  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AuthenticatedComponent;
}

/**
 * Hook to check if current user can access a route
 */
export function useRouteAccess(requiredRoles: UserRole[] = []) {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const { hasAnyRole } = useUserRole();

  const canAccess = isAuthenticated && (requiredRoles.length === 0 || hasAnyRole(requiredRoles));

  return {
    canAccess,
    isAuthenticated,
    isLoading,
    hasRequiredRole: requiredRoles.length === 0 || hasAnyRole(requiredRoles),
  };
}

/**
 * Component that conditionally renders children based on authentication and roles
 */
interface ProtectedProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
  showUnauthorized?: boolean;
}

export function Protected({
  children,
  requiredRoles = [],
  fallback = null,
  showUnauthorized = false,
}: ProtectedProps) {
  const { canAccess, isLoading, hasRequiredRole } = useRouteAccess(requiredRoles);

  if (isLoading) {
    return <AuthLoadingSpinner />;
  }

  if (!canAccess) {
    if (showUnauthorized && !hasRequiredRole) {
      return <UnauthorizedAccess requiredRoles={requiredRoles} />;
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Predefined HOCs for common role requirements
 */

// Requires user or coach role
export const withUserAuth = <P extends object>(component: ComponentType<P>) =>
  withAuth(component, {
    requiredRoles: [UserRole.ATHLETE, UserRole.SELF_COACHED, UserRole.COACH, UserRole.COACH_ADMIN],
  });

// Requires coach role only
export const withCoachAuth = <P extends object>(component: ComponentType<P>) =>
  withAuth(component, { requiredRoles: [UserRole.COACH, UserRole.COACH_ADMIN] });

// Requires any authentication (user or coach)
export const withAnyAuth = <P extends object>(component: ComponentType<P>) =>
  withAuth(component, {
    requiredRoles: [UserRole.ATHLETE, UserRole.SELF_COACHED, UserRole.COACH, UserRole.COACH_ADMIN],
  });

// Public page that works with or without authentication
export const withPublicAuth = <P extends object>(component: ComponentType<P>) =>
  withAuth(component, { allowUnauthenticated: true });
