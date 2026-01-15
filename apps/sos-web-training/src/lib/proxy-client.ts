import { getCookie } from '@/app/actions/cookie.actions';
import { addAuthHeader, TokenManager } from './token-manager';

class ProxyClient {
  private readonly PROXY_PREFIX = '/api';

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<{ data: T; status: number }> {
    const url = `${this.PROXY_PREFIX}${endpoint}`;
    
    // Check if tokens need refresh before making the request
    if (TokenManager.needsRefresh()) {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        TokenManager.clearTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('auth:logout', {
              detail: { reason: 'proactive_token_refresh_failed' },
            }),
          );
        }
        throw new Error('Session expired. Please log in again.');
      }

      // Try to refresh tokens proactively
      try {
        const { ClientAuthService, ClientJwtService } = await import('../hooks/api/use-auth');
        const jwtService = new ClientJwtService();
        const authService = new ClientAuthService(jwtService);
        
        const refreshResult = await authService.refreshToken({ refreshToken });
        if (!refreshResult.success) {
          TokenManager.clearTokens();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('auth:logout', {
                detail: { reason: 'token_refresh_failed' },
              }),
            );
          }
          throw new Error('Session expired. Please log in again.');
        }
      } catch (error) {
        console.warn('Proactive token refresh failed:', error);
        // Continue with the request - let the server handle token refresh if needed
      }
    }

    let requestHeaders: Record<string, string> = {};
    // Add authorization header if token exists
    requestHeaders = addAuthHeader(requestHeaders);

    // Determine tenantId: prefer from cookie ("auth_user"); fallback to token
    let tenantId: string | null = null;

    if (typeof window !== 'undefined') {
      try {
        const storedUser = await getCookie('auth_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user && user.tenantId) {
            tenantId = user.tenantId;
          }
        }
      } catch {
        // ignore parse errors, fall back to token
      }
    }

    if (!tenantId) {
      tenantId = TokenManager.getTenantIdFromToken();
    }

    if (tenantId) {
      requestHeaders['x-tenant-id'] = String(tenantId);
    }

    // Add user context header for better logging
    const userId = TokenManager.getUserIdFromToken();
    if (userId) {
      requestHeaders['X-User-ID'] = String(userId);
    }

    // Always add refresh token header for possible backend refresh
    const refreshToken = TokenManager.getRefreshToken();
    if (refreshToken) {
      requestHeaders['X-Refresh-Token'] = String(refreshToken);
    }

    // Add Content-Type header for requests with JSON body
    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    requestHeaders = {
      ...requestHeaders,
      ...headers,
    };

    // Set up fetch options
    const options: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: 'include',
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    // Handle empty body or not-JSON responses gracefully
    let responseData: T;
    const responseText = await response.text();

    try {
      responseData = responseText ? JSON.parse(responseText) : ({} as T);
    } catch {
      responseData = {} as T;
    }

    // Handle 401 Unauthorized - might indicate token expiry
    if (response.status === 401) {
      // Try to refresh token if we have a refresh token
      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken && endpoint !== '/auth/refresh') {
        try {
          const { ClientAuthService, ClientJwtService } = await import('../hooks/api/use-auth');
          const jwtService = new ClientJwtService();
          const authService = new ClientAuthService(jwtService);
          
          const refreshResult = await authService.refreshToken({ refreshToken });
          if (refreshResult.success) {
            // Retry the original request with new token
            const newHeaders = addAuthHeader(requestHeaders);
            const retryOptions: RequestInit = {
              ...options,
              headers: newHeaders,
            };
            
            const retryResponse = await fetch(url, retryOptions);
            const retryText = await retryResponse.text();
            const retryData = retryText ? JSON.parse(retryText) : ({} as T);
            
            if (retryResponse.ok) {
              return { data: retryData, status: retryResponse.status };
            }
            
            // If retry also fails, fall through to original error handling
            responseData = retryData;
          }
        } catch (refreshError) {
          console.warn('Token refresh during 401 handling failed:', refreshError);
          // Fall through to original error handling
        }
      }
      
      // Clear tokens and dispatch logout event
      TokenManager.clearTokens();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('auth:logout', {
            detail: { reason: 'token_expired' },
          }),
        );
      }
    }

    if (!response.ok) {
      const error: any = new Error('API Error');
      error.status = response.status;
      error.data = responseData;
      throw error;
    }

    return { data: responseData, status: response.status };
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    const res = await this.request<T>('GET', endpoint, undefined, headers);
    return res.data;
  }

  async post<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> {
    const res = await this.request<T>('POST', endpoint, data, headers);
    return res.data;
  }

  async put<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> {
    const res = await this.request<T>('PUT', endpoint, data, headers);
    return res.data;
  }

  async patch<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> {
    const res = await this.request<T>('PATCH', endpoint, data, headers);
    return res.data;
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    const res = await this.request<T>('DELETE', endpoint, undefined, headers);
    return res.data;
  }

  async test<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    const res = await this.request<T>('DELETE', endpoint, undefined, headers);
    return res.data;
  }
}

// Create and export the proxy client instance
export const proxyClient = new ProxyClient();
export { ProxyClient };
