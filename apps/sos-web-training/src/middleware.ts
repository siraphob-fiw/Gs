import { NextRequest, NextResponse } from 'next/server';
import { ClientJwtService, JwtPayload } from './hooks/api/use-auth';
import { UserRole } from '@strengthos/shared-types';

const UNAUTH_ROUTES = [
  '/login',
  '/register',
  '/verify-email',
  '/verify-email/*',
  '/forgot-password',
  '/forgot-password/*',
  '/reset-password/*',
  '/validate-reset-password-token',
  '/oauth/callback',
  '/oauth/callback/*',
];

const PUBLIC_ROUTES = ['/', '/_next', '/favicon.ico', '/fonts', '/images'];


// Define role-based route access (for non-admin users)
const ROLE_ROUTES: Record<UserRole, string[]> = {
  [UserRole.ATHLETE]: [
    '/dashboard',
    '/workout/calendar-session',
    '/workout/session/*',
    '/workout/session/deploy',
    '/progression',
    '/my-account',
    '/setupUserProfile',
  ],
  [UserRole.SELF_COACHED]: [
    '/dashboard',
    '/workout/calendar-session',
    '/workout/session/*',
    '/progression',
    '/my-account',
    '/setupUserProfile',
  ],
  [UserRole.COACH]: [
    '/dashboard',
    '/workout/manage-workouts/*',
    '/workout/session/*',
    '/progression',
    '/manage/coach-athletes',
    '/manage/exercises',
    '/manage/modifier',
    '/my-account',
    '/setupUserProfile',
    '/setupCoachProfile',
  ],
  [UserRole.COACH_ADMIN]: [
    '/admin',
    '/admin/users',
    '/manage/exercises',
    '/manage/modifier',
    '/workout/manage-workouts/*',
    '/workout/session/*',
    '/progression',
    '/manage/exercises',
    '/manage/modifier',
    '/my-account',
    '/setupUserProfile',
    '/setupCoachProfile',
  ],
  [UserRole.TENANT_ADMIN]: [
    '/admin',
    '/admin/tenants',
    '/admin/users',
    '/progression',
    '/manage/exercises',
    '/manage/modifier',
    '/workout/manage-workouts/*',
    '/workout/session/*',
    '/my-account',
    '/setupUserProfile',
  ],
  [UserRole.SUPER_ADMIN]: [],
};

// Determines if a route is public (no authentication required)
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function isUnauthRoute(pathname: string): boolean {
  return UNAUTH_ROUTES.some((route) => pathname.startsWith(route));
}
/**
 * Verify JWT token and extract user information
 */
function verifyToken(token: string): {
  isValid: boolean;
  payload?: JwtPayload | null;
  error?: string;
} {
  try {
    const jwtService = new ClientJwtService();
    const result = jwtService.verifyToken(token);

    if (result.success && result.data) {
      return {
        isValid: true,
        payload: result.data,
      };
    } else {
      return {
        isValid: false,
        error: result.message || 'Invalid token',
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Token verification failed',
    };
  }
}

// Whether a user with the given role has access to the requested route
function hasRoutePermission(pathname: string, userRole: UserRole): boolean {
  // Allow all paths if user is SUPER_ADMIN
  if (userRole === UserRole.SUPER_ADMIN || pathname.startsWith('/reset-password')) {
    return true;
  }

  const allowedPathsByRole: Record<UserRole, string[]> = ROLE_ROUTES;

  if (pathname.startsWith('/admin')) {
    const allowed = allowedPathsByRole[userRole] || [];
    return allowed.some((route) => {
      if (route.endsWith('/*')) {
        const baseRoute = route.slice(0, -2);
        return pathname === baseRoute || pathname.startsWith(baseRoute + '/');
      }
      return pathname === route;
    });
  }

  const allowed = allowedPathsByRole[userRole] || [];
  if (allowed.length > 0) {
    return allowed.some((route) => {
      if (route.endsWith('/*')) {
        const baseRoute = route.slice(0, -2);
        return pathname === baseRoute || pathname.startsWith(baseRoute + '/');
      }
      if (!route.startsWith('/admin')) {
        return pathname === route;
      }
      return false;
    });
  }

  return true;
}

// Redirect helper to login page
function redirectToHomePage(request: NextRequest) {
  return NextResponse.redirect(new URL('/', request.url));
}

function redirectToLogin(request: NextRequest) {
  return NextResponse.redirect(new URL('/login', request.url));
}

function redirectToDashboard(request: NextRequest, userRole: UserRole) {
  if (
    userRole === UserRole.SUPER_ADMIN ||
    userRole === UserRole.TENANT_ADMIN ||
    userRole === UserRole.COACH_ADMIN
  ) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  return NextResponse.redirect(new URL('/dashboard', request.url));
}

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_access_token')?.value || null;

  // Handle requests without token
  if (!token) {
    // Allow access to public routes
    if (isPublicRoute(pathname) || isUnauthRoute(pathname)) {
      return NextResponse.next();
    }
    // Redirect to login for protected routes
    return redirectToHomePage(request);
  }
  // Validate token
  let tokenVerification;
  try {
    tokenVerification = verifyToken(token);
  } catch (_err) {
    const response = redirectToLogin(request);
    response.cookies.delete('auth_access_token');
    response.cookies.delete('auth_refresh_token');
    response.cookies.delete('auth_user');
    return response;
  }

  if (!tokenVerification || !tokenVerification.isValid || !tokenVerification.payload) {
    const response = redirectToLogin(request);
    response.cookies.delete('auth_access_token');
    response.cookies.delete('auth_refresh_token');
    response.cookies.delete('auth_user');
    return response;
  }

  const { payload } = tokenVerification;
  const userRole = payload.role;

  // Create response with user context headers
  const response = NextResponse.next();
  if (payload.userId) response.headers.set('x-user-id', String(payload.userId));
  if (payload.role) response.headers.set('x-user-role', String(payload.role));
  if (payload.tenantId) response.headers.set('x-tenant-id', String(payload.tenantId));
  if (payload.sessionId) response.headers.set('x-session-id', String(payload.sessionId));

  // Prevent logged-in users from accessing public auth pages
  if (isUnauthRoute(pathname)) {
    return redirectToDashboard(request, userRole);
  }

  if (!hasRoutePermission(pathname, userRole)) {
    return redirectToDashboard(request, userRole);
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|fonts).*)'],
};
