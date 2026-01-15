import { ClientJwtService } from '../hooks/api/use-auth';
import { Results } from '@strengthos/shared-types';

/**
 * Cookie management utilities
 */
class CookieManager {
  /**
   * Set a cookie
   */
  static setCookie(name: string, value: string, days: number = 7): void {
    if (typeof window === 'undefined') return;

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

    // Set cookie with SameSite=Lax for CSRF protection
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax;Secure=${window.location.protocol === 'https:'}`;
  }

  /**
   * Get a cookie
   */
  static getCookie(name: string): string | null {
    if (typeof window === 'undefined') return null;

    let cname = name + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(cname) == 0) {
        return c.substring(cname.length, c.length);
      }
    }
    return "";
  }

  /**
   * Delete a cookie
   */
  static deleteCookie(name: string): void {
    if (typeof window === 'undefined') return;

    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
}

/**
 * Token manager for handling JWT tokens in the client
 */
export class TokenManager {
  /**
   * Get access token from cookies
   */
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return CookieManager.getCookie('auth_access_token');
  }

  /**
   * Get refresh token from cookies
   */
  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return CookieManager.getCookie('auth_refresh_token');
  }

  /**
   * Set tokens in cookies
   */
  static setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;

    // Store in cookies
    CookieManager.setCookie('auth_access_token', accessToken, 7);
    CookieManager.setCookie('auth_refresh_token', refreshToken, 30);
  }

  /**
   * Clear tokens from cookies
   */
  static clearTokens(): void {
    if (typeof window === 'undefined') return;

    // Clear from cookies
    CookieManager.deleteCookie('auth_access_token');
    CookieManager.deleteCookie('auth_refresh_token');
  }

  /**
   * Check if access token exists
   */
  static hasAccessToken(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Check if refresh token exists
   */
  static hasRefreshToken(): boolean {
    return !!this.getRefreshToken();
  }

  /**
   * Validate access token format and expiry
   */
  static validateAccessToken(): Results<any> {
    const token = this.getAccessToken();
    if (!token) {
      return Results.fail<any>(null, 'No access token found');
    }

    const jwtService = new ClientJwtService();
    const result = jwtService.verifyToken(token);
    if (result.success) {
      return Results.ok(result.data!);
    } else {
      return Results.fail<any>(null, result.message || 'Token validation failed');
    }
  }

  /**
   * Check if access token is expired or close to expiring
   */
  static isTokenExpired(bufferMinutes: number = 5): boolean {
    const validationResult = this.validateAccessToken();
    if (!validationResult.success) {
      return true;
    }

    const payload = validationResult.data!;
    if (!payload.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiryWithBuffer = payload.exp - bufferMinutes * 60;

    return now >= expiryWithBuffer;
  }

  /**
   * Get token payload without validation
   */
  static getTokenPayload(): Record<string, any> | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      // Decode JWT payload (without verification)
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user ID from token
   */
  static getUserIdFromToken(): string | null {
    const payload = this.getTokenPayload();
    return payload?.userId ?? null;
  }

  /**
   * Get tenant ID from token
   */
  static getTenantIdFromToken(): string | null {
    const payload = this.getTokenPayload();
    return payload?.tenantId ?? null;
  }

  /**
   * Get user role from token
   */
  static getRoleFromToken(): string | null {
    const payload = this.getTokenPayload();
    return payload?.role ?? null;
  }

  /**
   * Get session ID from token
   */
  static getSessionIdFromToken(): string | null {
    const payload = this.getTokenPayload();
    return payload?.sessionId ?? null;
  }

  /**
   * Create Authorization header value
   */
  static getAuthorizationHeader(): string | null {
    const token = this.getAccessToken();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Check if tokens need refresh
   */
  static needsRefresh(): boolean {
    return this.hasRefreshToken() && (this.isTokenExpired() || !this.hasAccessToken());
  }

  /**
   * Get token expiry time
   */
  static getTokenExpiry(): Date | null {
    const payload = this.getTokenPayload();
    if (!payload?.exp) return null;

    return new Date(payload.exp * 1000);
  }

  /**
   * Get time until token expires (in minutes)
   */
  static getTimeUntilExpiry(): number | null {
    const expiry = this.getTokenExpiry();
    if (!expiry) return null;

    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }

  /**
   * Check if user has specific role
   */
  static hasRole(role: string): boolean {
    const userRole = this.getRoleFromToken();
    return userRole === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  static hasAnyRole(roles: string[]): boolean {
    const userRole = this.getRoleFromToken();
    return userRole ? roles.includes(userRole) : false;
  }

  /**
   * Check if user has permission to access program-generation endpoints
   */
  static canAccessProgramGeneration(): boolean {
    const role = this.getRoleFromToken();
    const allowedRoles = ['COACH_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'];
    return role ? allowedRoles.includes(role) : false;
  }

  static canDeployTrainingBlocks(): boolean {
    const role = this.getRoleFromToken();
    const allowedRoles = ['COACH', 'COACH_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'];
    return role ? allowedRoles.includes(role) : false;
  }

  /**
   * Check if user can create training blocks
   */
  static canCreate(): boolean {
    const role = this.getRoleFromToken();
    const allowedRoles = ['COACH', 'COACH_ADMIN', 'SELF_COACHED', 'TENANT_ADMIN', 'SUPER_ADMIN'];
    return role ? allowedRoles.includes(role) : false;
  }

  /**
   * Check if user can delete training blocks
   */
  static canDelete(): boolean {
    const role = this.getRoleFromToken();
    const allowedRoles = ['TENANT_ADMIN', 'SUPER_ADMIN'];
    return role ? allowedRoles.includes(role) : false;
  }

  /**
   * Check if user can manage exercises
   */
  static canManageExercises(): boolean {
    const role = this.getRoleFromToken();
    const allowedRoles = ['COACH', 'COACH_ADMIN', 'SUPER_ADMIN'];
    return role ? allowedRoles.includes(role) : false;
  }

  /**
   * Check if user can manage equipment
   */
  static canManageEquipment(): boolean {
    const role = this.getRoleFromToken();
    const allowedRoles = ['COACH', 'COACH_ADMIN', 'SUPER_ADMIN'];
    return role ? allowedRoles.includes(role) : false;
  }

  /**
   * Get permissions for current user role
   */
  static getUserPermissions(): string[] {
    const role = this.getRoleFromToken();

    switch (role) {
      case 'SUPER_ADMIN':
        return ['*'];

      case 'COACH_ADMIN':
        return [
          'view_training_blocks',
          'create_training_blocks',
          'edit_training_blocks',
          'delete_training_blocks',
          'view_exercises',
          'create_exercises',
          'edit_exercises',
          'delete_exercises',
          'view_equipment',
          'create_equipment',
          'edit_equipment',
          'delete_equipment',
          'manage_clients',
          'view_analytics',
        ];

      case 'COACH':
        return [
          'view_training_blocks',
          'create_training_blocks',
          'edit_training_blocks',
          'view_exercises',
          'create_exercises',
          'edit_exercises',
          'view_equipment',
          'manage_clients',
        ];

      case 'SELF_COACHED':
        return [
          'view_training_blocks',
          'create_training_blocks',
          'edit_training_blocks',
          'view_exercises',
          'view_equipment',
        ];

      case 'ATHLETE':
      case 'USER':
        return ['view_training_blocks', 'view_exercises', 'view_equipment'];

      default:
        return [];
    }
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(permission: string): boolean {
    const permissions = this.getUserPermissions();
    return permissions.includes('*') || permissions.includes(permission);
  }
}

/**
 * HTTP interceptor for adding authentication headers
 */
export function addAuthHeader(headers: Record<string, string> = {}): Record<string, string> {
  const authHeader = TokenManager.getAuthorizationHeader();

  if (authHeader) {
    return {
      ...headers,
      Authorization: authHeader,
    };
  }

  return headers;
}

/**
 * Check if request needs authentication
 */
export function needsAuthentication(url: string): boolean {
  // Define public endpoints that don't need authentication
  const publicEndpoints = [
    '/login',
    '/register',
    '/forgot-password',
    '/send-reset-password-email',
    '/reset-password',
    '/verify-email',
    '/refresh',
    '/health',
    '/public',

    // CMS public endpoints
    '/cms-pages',
    '/cms-posts',
    '/cms-categories',
    '/cms-media',
  ];

  // All program-generation endpoints require authentication
  if (url.includes('/program-generation/')) {
    return true;
  }

  // All user-specific endpoints require authentication
  const protectedEndpoints = ['/users/', '/profile', '/settings', '/notifications', '/analytics'];

  if (protectedEndpoints.some((endpoint) => url.includes(endpoint))) {
    return true;
  }

  return !publicEndpoints.some((endpoint) => url.includes(endpoint));
}

/**
 * Check if user has permission to access specific endpoint
 */
export function hasEndpointPermission(url: string, method: string = 'GET'): boolean {
  // If not authenticated, no permissions
  if (!TokenManager.hasAccessToken()) {
    return false;
  }

  // Super admin has access to everything
  if (TokenManager.hasRole('SUPER_ADMIN')) {
    return true;
  }

  // Check program-generation endpoints
  if (url.includes('/program-generation/')) {
    if (url.includes('/training-blocks')) {
      if (method === 'GET') {
        return TokenManager.hasPermission('view_training_blocks');
      } else if (method === 'POST') {
        return TokenManager.hasPermission('create_training_blocks');
      } else if (method === 'PUT' || method === 'PATCH') {
        return TokenManager.hasPermission('edit_training_blocks');
      } else if (method === 'DELETE') {
        return TokenManager.hasPermission('delete_training_blocks');
      }
    }

    if (url.includes('/exercises')) {
      if (method === 'GET') {
        return TokenManager.hasPermission('view_exercises');
      } else if (method === 'POST') {
        return TokenManager.hasPermission('create_exercises');
      } else if (method === 'PUT' || method === 'PATCH') {
        return TokenManager.hasPermission('edit_exercises');
      } else if (method === 'DELETE') {
        return TokenManager.hasPermission('delete_exercises');
      }
    }
  }

  if (url.includes('/equipment')) {
    if (method === 'GET') {
      return TokenManager.hasPermission('view_equipment');
    } else if (method === 'POST') {
      return TokenManager.hasPermission('create_equipment');
    } else if (method === 'PUT' || method === 'PATCH') {
      return TokenManager.hasPermission('edit_equipment');
    } else if (method === 'DELETE') {
      return TokenManager.hasPermission('delete_equipment');
    }
  }

  // Default to allowing access if not explicitly restricted
  return true;
}

/**
 * Token refresh scheduler
 */
export class TokenRefreshScheduler {
  private refreshTimer: NodeJS.Timeout | null = null;
  private refreshCallback: (() => Promise<void>) | null = null;

  /**
   * Start automatic token refresh
   */
  start(refreshCallback: () => Promise<void>): void {
    this.refreshCallback = refreshCallback;
    this.scheduleNextRefresh();
  }

  /**
   * Stop automatic token refresh
   */
  stop(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.refreshCallback = null;
  }

  /**
   * Schedule next token refresh
   */
  private scheduleNextRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const timeUntilExpiry = TokenManager.getTimeUntilExpiry();
    if (!timeUntilExpiry || timeUntilExpiry == null || timeUntilExpiry <= 0) {
      return;
    }

    // Refresh 5 minutes before expiry, but at least every hour
    const refreshInMinutes = Math.min(Math.max(timeUntilExpiry - 5, 1), 60);
    const refreshInMs = refreshInMinutes * 60 * 1000;

    this.refreshTimer = setTimeout(async () => {
      if (this.refreshCallback) {
        try {
          await this.refreshCallback();
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      }
      this.scheduleNextRefresh();
    }, refreshInMs);
  }
}

// Export singleton instance
export const tokenRefreshScheduler = new TokenRefreshScheduler();
