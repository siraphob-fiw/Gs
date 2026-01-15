import type {
  LoginRequest,
  LoginResult,
  RefreshTokenRequest,
  PhoneVerificationRequest,
  PhoneVerificationConfirm,
  RegisterWithPhoneRequest,
  ChangePasswordRequest,
  RegisterWithEmailRequest,
} from '@strengthos/shared-security';
import { Results } from '@strengthos/shared-types';
import { proxyClient } from '../../lib/proxy-client';
import { TokenManager } from '../../lib/token-manager';
import { ErrorHandler } from '../../lib/error-handler';

// Cookie management helper
const setCookie = (name: string, value: string, days: number = 7): void => {
  if (typeof window === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax;Secure=${window.location.protocol === 'https:'}`;
};

// Simple client-side JWT utilities (for basic token parsing only)
interface JwtPayload {
  sub?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  aud?: string;
  [key: string]: any;
}

class ClientJwtService {
  /**
   * Parse JWT token payload (client-side only, no verification)
   */
  parseToken(token: string): Results<JwtPayload> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return Results.fail<JwtPayload>(null, 'Invalid token format');
      }

      const payload = JSON.parse(atob(parts[1]));
      return Results.ok(payload);
    } catch (error) {
      return Results.fail<JwtPayload>(null, 'Failed to parse token');
    }
  }

  /**
   * Check if token is expired (client-side only)
   */
  isTokenExpired(token: string): boolean {
    const parseResult = this.parseToken(token);
    if (!parseResult.success || !parseResult.data?.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    return parseResult.data.exp < now;
  }

  /**
   * Basic token validation (format only, not cryptographic)
   */
  verifyToken(token: string): Results<JwtPayload> {
    if (this.isTokenExpired(token)) {
      return Results.fail<JwtPayload>(null, 'Token is expired');
    }

    return this.parseToken(token);
  }
}

// Client-side authentication service
class ClientAuthService {
  private jwtService: ClientJwtService;

  constructor(jwtService: ClientJwtService) {
    this.jwtService = jwtService;
  }

  /**
   * Login user with multiple authentication methods (email, WhatsApp, LINE)
   */
  async login(request: LoginRequest): Promise<Results<LoginResult>> {
    try {
      const loginData = {
        ...request,
      };

      // Call the API login endpoint
      const response = await proxyClient.post<Results<LoginResult>>('/auth/login', loginData);
      if (response.success) {
        const loginResult: LoginResult = response.data!;
        if (loginResult.accessToken && loginResult.refreshToken) {
          TokenManager.setTokens(loginResult.accessToken, loginResult.refreshToken);
        }
        return Results.ok(loginResult);
      } else {
        const msg = response?.message || response?.error || 'Login failed';
        return Results.fail<LoginResult>(null, msg);
      }
    } catch (error) {
      return Results.fail<LoginResult>(null, ErrorHandler.extractErrorMessage(error));
    }
  }

  /**
   * Request phone verification code
   */
  async requestPhoneVerification(request: PhoneVerificationRequest): Promise<Results<void>> {
    try {
      await proxyClient.post<void>('/auth/phone/request-verification', request);
      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, ErrorHandler.extractErrorMessage(error));
    }
  }

  /**
   * Confirm phone verification code
   */
  async confirmPhoneVerification(request: PhoneVerificationConfirm): Promise<Results<boolean>> {
    try {
      const response = await proxyClient.post<Results<boolean>>(
        '/auth/phone/confirm-verification',
        request,
      );

      if (response.success) {
        return Results.ok(response.data!);
      } else {
        return Results.fail<boolean>(null, response.message || 'Verification failed');
      }
    } catch (error) {
      return Results.fail<boolean>(null, ErrorHandler.extractErrorMessage(error));
    }
  }

  /**
   * Register user with phone number (WhatsApp/LINE)
   */
  async registerWithPhone(request: RegisterWithPhoneRequest): Promise<Results<LoginResult>> {
    try {
      const response = await proxyClient.post<Results<LoginResult>>(
        '/auth/register/phone',
        request,
      );

      if (response.success) {
        const result: LoginResult = response.data!;

        // Store tokens
        TokenManager.setTokens(result.accessToken, result.refreshToken);

        return Results.ok(result);
      } else {
        return Results.fail<LoginResult>(null, response.message || 'Registration failed');
      }
    } catch (error) {
      return Results.fail<LoginResult>(null, ErrorHandler.extractErrorMessage(error));
    }
  }

  /**
   * Register user with email
   */
  async registerWithEmail(
    request: RegisterWithEmailRequest,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await proxyClient.post<{ success: boolean; message: string }>(
        '/auth/register/email',
        request,
      );

      if (response.success) {
        return {
          success: response.success,
          message: response.message,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Registration failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: ErrorHandler.extractErrorMessage(error),
      };
    }
  }

  /**
   * Switch tenant context and regenerate tokens
   */
  async switchTenantContext(tenantId: string): Promise<Results<LoginResult>> {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        return Results.fail<LoginResult>(null, 'No refresh token available');
      }

      const response = await proxyClient.post<Results<LoginResult>>('/auth/switch-tenant', {
        tenantId,
        refreshToken,
      });

      if (response.success) {
        const result: LoginResult = response.data!;
        TokenManager.setTokens(result.accessToken, result.refreshToken);
        setCookie('auth_user', JSON.stringify(result.user), 7);

        return Results.ok(result);
      } else {
        return Results.fail<LoginResult>(null, 'Tenant switch failed');
      }
    } catch (error) {
      return Results.fail<LoginResult>(null, ErrorHandler.extractErrorMessage(error));
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<Results<LoginResult>> {
    try {
      // The /auth/refresh endpoint returns AuthResponseDto directly, not wrapped in Results
      const response = await proxyClient.post<LoginResult>('/auth/refresh', request);

      if (response && response.accessToken && response.refreshToken && response.user) {
        const loginResult: LoginResult = response;
        // Store new tokens
        TokenManager.setTokens(loginResult.accessToken, loginResult.refreshToken);
        return Results.ok(loginResult);
      } else {
        // Clear tokens on refresh failure
        TokenManager.clearTokens();
        return Results.fail<LoginResult>(null, 'Token refresh failed - invalid response format');
      }
    } catch (error) {
      // Clear tokens on refresh failure
      TokenManager.clearTokens();
      return Results.fail<LoginResult>(null, ErrorHandler.extractErrorMessage(error));
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(userId: string, sessionId?: string): Promise<Results<void>> {
    try {
      // Add a small delay to prevent rapid-fire logout calls
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Call the API logout endpoint
      const response = await proxyClient.post<Results<void>>('/auth/logout', { userId, sessionId });

      if (response.success) {
        TokenManager.clearTokens();
        return Results.ok(undefined);
      } else {
        TokenManager.clearTokens();
        return Results.fail<void>(null, response.message || 'Logout failed');
      }
    } catch (error) {
      TokenManager.clearTokens();
      return Results.fail<void>(null, ErrorHandler.extractErrorMessage(error));
    }
  }

  /**
   * Change user password
   */
  async changePassword(request: ChangePasswordRequest): Promise<Results<void>> {
    try {
      const response = await proxyClient.post<Results<void>>('/auth/change-password', request);

      if (response.success) {
        return Results.ok(undefined);
      } else {
        return Results.fail<void>(null, response.message || 'Password change failed');
      }
    } catch (error) {
      return Results.fail<void>(null, ErrorHandler.extractErrorMessage(error));
    }
  }

  /**
   * Validate access token
   */
  async validateToken(accessToken: string): Promise<Results<any>> {
    try {
      // First try to validate locally using JWT service
      const tokenResult = this.jwtService.verifyToken(accessToken);
      if (!tokenResult.success) {
        return Results.fail<any>(null, 'Invalid token format');
      }

      // Then validate with the server
      const response = await proxyClient.post<Results<any>>('/auth/validate', { accessToken });

      if (response.success) {
        return Results.ok(response.data!);
      } else {
        return Results.fail<any>(null, response.message || 'Token validation failed');
      }
    } catch (error) {
      return Results.fail<any>(null, ErrorHandler.extractErrorMessage(error));
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string, tenantId?: string): Promise<Results<void>> {
    try {
      const requestData = {
        email,
        tenantId,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
      };

      const response = await proxyClient.post<Results<void>>('/auth/forgot-password', requestData);

      if (response.success) {
        return Results.ok(undefined);
      } else {
        return Results.fail<void>(null, response.message || 'Password reset request failed');
      }
    } catch (error) {
      return Results.fail<void>(null, ErrorHandler.extractErrorMessage(error));
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<Results<{ userId: string }>> {
    try {
      const resetData = {
        token,
        newPassword,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
      };

      const response = await proxyClient.post<Results<Record<string, any> | null>>(
        '/auth/reset-password',
        resetData,
      );

      if (response.success) {
        return Results.ok({ userId: response.data!.userId });
      } else {
        return Results.fail<{ userId: string }>(null, response.message || 'Password reset failed');
      }
    } catch (error) {
      return Results.fail<{ userId: string }>(null, ErrorHandler.extractErrorMessage(error));
    }
  }

  // Helper methods

  /**
   * Get client IP address (best effort)
   */
  private async getClientIP(): Promise<string> {
    try {
      // This is a simple approach - in production you might want to use a service
      // return 'client-ip-unknown';
      return '127.0.0.1';
    } catch {
      return 'client-ip-unknown';
    }
  }

  /**
   * Mask phone number for logging
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return phoneNumber;
    const start = phoneNumber.substring(0, 2);
    const end = phoneNumber.substring(phoneNumber.length - 2);
    const middle = '*'.repeat(phoneNumber.length - 4);
    return `${start}${middle}${end}`;
  }
}

// Create service instances
const jwtService = new ClientJwtService();
const authService = new ClientAuthService(jwtService);

// Export the service instance and types
export default authService;
export { ClientAuthService, ClientJwtService };
export type { JwtPayload };
