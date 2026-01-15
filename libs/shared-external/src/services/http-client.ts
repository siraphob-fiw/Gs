import { Results } from '@strengthos/shared-utils';
import { HttpClientConfig, HttpResponse } from '../types/external-types';

export class HttpClient {
  private readonly defaultTimeout = 30000; // 30 seconds
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(private config: HttpClientConfig = {}) {}

  async get<T = any>(url: string): Promise<Results<HttpResponse<T>>> {
    return this.makeRequest<T>('GET', url);
  }

  async post<T = any>(url: string, data?: any): Promise<Results<HttpResponse<T>>> {
    return this.makeRequest<T>('POST', url, data);
  }

  async put<T = any>(url: string, data?: any): Promise<Results<HttpResponse<T>>> {
    return this.makeRequest<T>('PUT', url, data);
  }

  async delete<T = any>(url: string): Promise<Results<HttpResponse<T>>> {
    return this.makeRequest<T>('DELETE', url);
  }

  async patch<T = any>(url: string, data?: any): Promise<Results<HttpResponse<T>>> {
    return this.makeRequest<T>('PATCH', url, data);
  }

  private async makeRequest<T>(
    method: string,
    url: string,
    data?: any,
    retryCount = 0
  ): Promise<Results<HttpResponse<T>>> {
    try {
      const fullUrl = this.buildUrl(url);
      const requestOptions = this.buildRequestOptions(method, data);

      const response = await this.fetchWithTimeout(fullUrl, requestOptions);
      const httpResponse = await this.parseResponse<T>(response);

      // Check if response is successful (2xx status codes)
      if (response.ok) {
        return Results.ok(httpResponse);
      } else {
        // Handle HTTP error responses
        return this.handleHttpError<T>(httpResponse);
      }
    } catch (error) {
      // Handle network errors and timeouts
      if (this.shouldRetry(error, retryCount)) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        return this.makeRequest<T>(method, url, data, retryCount + 1);
      }

      return this.handleNetworkError<T>(error);
    }
  }

  private buildUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    const baseURL = this.config.baseURL || '';
    const cleanBaseUrl = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    
    return `${cleanBaseUrl}${cleanUrl}`;
  }

  private buildRequestOptions(method: string, data?: any): RequestInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers
    };

    const options: RequestInit = {
      method,
      headers,
      credentials: 'include' // Include cookies for authentication
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    return options;
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const timeout = this.config.timeout ?? this.defaultTimeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error: any) {
      if (error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async parseResponse<T>(response: Response): Promise<HttpResponse<T>> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let data: T;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = (await response.json()) as T;
      } catch {
        // If JSON parsing fails, return empty object
        data = {} as T;
      }
    } else {
      // For non-JSON responses, try to get text
      const text = await response.text();
      data = (text || {}) as T;
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers
    };
  }

  private handleHttpError<T>(httpResponse: HttpResponse<T>): Results<HttpResponse<T>> {
    const { status } = httpResponse;
    let errorMessage = `HTTP ${status}: ${httpResponse.statusText}`;

    // Try to extract error message from response data
    if (httpResponse.data && typeof httpResponse.data === 'object') {
      const errorData = httpResponse.data as any;
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    }

    // Map status codes to appropriate error types
    switch (status) {
      case 400:
        return Results.validationError(httpResponse, errorMessage);
      case 401:
        return Results.error(httpResponse, errorMessage);
      case 403:
        return Results.error(httpResponse, 'Access forbidden');
      case 404:
        return Results.fail(httpResponse, errorMessage);
      case 429:
        return Results.error(httpResponse, 'Too many requests. Please try again later.');
      case 500:
      case 502:
      case 503:
      case 504:
        return Results.error(httpResponse, 'Server error. Please try again later.');
      default:
        return Results.error(httpResponse, errorMessage);
    }
  }

  private handleNetworkError<T>(error: any): Results<HttpResponse<T>> {
    let errorMessage = 'Network error occurred';

    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout. Please check your connection and try again.';
    } else if (error.message) {
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else {
        errorMessage = error.message;
      }
    }

    return Results.fail<HttpResponse<T>>(undefined, errorMessage);
  }

  private shouldRetry(error: any, retryCount: number): boolean {
    if (retryCount >= this.maxRetries) {
      return false;
    }

    // Don't retry on timeout errors or client errors (4xx)
    if (error.name === 'AbortError') {
      return false;
    }

    // Retry on network errors and server errors (5xx)
    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}