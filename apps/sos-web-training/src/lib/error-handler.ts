import { Logger } from '@strengthos/shared-logging';
import { consoleLogService } from './console-logger';
import { HttpResponse } from '@strengthos/shared-external';
import { useTranslation } from '@/hooks/api/useTranslation';

const logger = new Logger(consoleLogService);

// API Error Response structure based on NestJS standard format
interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp?: string;
  path?: string;
  traceId?: string;
}

// Legacy API Error format for backward compatibility
interface APIError {
  status?: number;
  message: string;
}

// Enhanced error context for better error handling
interface ErrorContext {
  endpoint?: string;
  method?: string;
  requestData?: any;
  userId?: string;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
  context?: ErrorContext;
  useI18n?: boolean;
  retryable?: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorHandler {
  static handle(error: unknown, options: ErrorHandlerOptions = {}): string {
    const {
      showToast = false,
      logError = true,
      fallbackMessage = 'An unexpected error occurred',
      context = {},
      useI18n = false,
      retryable = false,
      severity = 'medium',
    } = options;

    let errorMessage = fallbackMessage;

    if (logError) {
      // Enhanced logging with severity and context
      const logData = {
        message: 'Error handled',
        fullMessage: error instanceof Error ? error.message : String(error),
        context,
        severity,
        retryable,
        timestamp: new Date().toISOString(),
        errorType: this.getErrorType(error),
        stackTrace: error instanceof Error ? error.stack : undefined,
      };

      // Log with appropriate level based on severity
      switch (severity) {
        case 'critical':
          logger.error(logData);
          break;
        case 'high':
          logger.error(logData);
          break;
        case 'medium':
          logger.warn(logData);
          break;
        case 'low':
          logger.info(logData);
          break;
        default:
          logger.error(logData);
      }
    }

    // Handle HttpResponse errors (from new HttpClient)
    if (this.isHttpResponseError(error)) {
      errorMessage = this.handleHttpResponseError(error, context);
    }
    // Handle legacy API errors
    else if (this.isApiError(error)) {
      errorMessage = this.handleApiError(error);
    }
    // Handle network errors
    else if (error instanceof Error && this.isNetworkError(error)) {
      errorMessage = this.handleNetworkError(error);
    }
    // Handle validation errors
    else if (error instanceof Error && error.name === 'ValidationError') {
      errorMessage = 'Please check your input and try again.';
    }
    // Handle generic errors
    else if (error instanceof Error) {
      errorMessage = error.message || fallbackMessage;
    }

    if (showToast) {
      // Could integrate with a toast library here
      // Toast notification would be shown here
    }

    return errorMessage;
  }

  // Get error type for logging
  private static getErrorType(error: unknown): string {
    if (this.isHttpResponseError(error)) {
      return `HTTP_${error.status}`;
    }
    if (this.isApiError(error)) {
      return `API_${error.status}`;
    }
    if (error instanceof Error) {
      if (this.isNetworkError(error)) {
        return 'NETWORK_ERROR';
      }
      if (error.name === 'ValidationError') {
        return 'VALIDATION_ERROR';
      }
      return error.name || 'GENERIC_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  // Type guards for different error types
  private static isHttpResponseError(error: unknown): error is HttpResponse<ApiErrorResponse> {
    return (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      'data' in error &&
      typeof (error as any).status === 'number'
    );
  }

  private static isApiError(error: unknown): error is APIError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof (error as any).status === 'number'
    );
  }

  private static isNetworkError(error: Error): boolean {
    return (
      error.message.includes('Network') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('timeout') ||
      error.name === 'AbortError' ||
      error.name === 'NetworkError'
    );
  }

  // Enhanced HTTP response error handler
  private static handleHttpResponseError(
    error: HttpResponse<ApiErrorResponse>,
    context: ErrorContext = {},
  ): string {
    const { status, data } = error;

    // Extract error message from API response
    let apiMessage = '';
    if (data && typeof data === 'object') {
      if (Array.isArray(data.message)) {
        // Handle validation errors with multiple messages
        apiMessage = data.message.join(', ');
      } else if (typeof data.message === 'string') {
        apiMessage = data.message;
      } else if (data.error) {
        apiMessage = data.error;
      }
    }

    // Handle specific authentication endpoint errors
    if (context.endpoint?.includes('/auth/login')) {
      return this.handleAuthenticationError(status, apiMessage, data);
    }

    // Handle specific API endpoint errors
    if (apiMessage && this.isKnownMissingEndpoint(apiMessage)) {
      return this.handleMissingEndpointError(apiMessage);
    }

    // Map HTTP status codes to user-friendly messages
    return this.mapStatusCodeToMessage(status, apiMessage);
  }

  // Handle authentication-specific errors
  private static handleAuthenticationError(
    status: number,
    message: string,
    data?: ApiErrorResponse,
  ): string {
    switch (status) {
      case 400:
        if (message.toLowerCase().includes('email') || message.toLowerCase().includes('password')) {
          return 'Please enter a valid email and password.';
        }
        return message || 'Invalid login credentials. Please check your email and password.';

      case 401:
        // Handle account lockout scenarios
        if (message.toLowerCase().includes('locked') || message.toLowerCase().includes('lockout')) {
          return this.handleAccountLockout(message, data);
        }
        if (
          message.toLowerCase().includes('invalid') ||
          message.toLowerCase().includes('incorrect')
        ) {
          return 'Invalid email or password. Please try again.';
        }
        if (message.toLowerCase().includes('expired')) {
          return 'Your session has expired. Please log in again.';
        }
        return message || 'Authentication failed. Please check your credentials and try again.';

      case 403:
        return 'Your account does not have permission to access this application.';

      case 429:
        return 'Too many login attempts. Please wait a few minutes before trying again.';

      default:
        return this.mapStatusCodeToMessage(status, message);
    }
  }

  // Handle account lockout with duration information
  private static handleAccountLockout(message: string, data?: ApiErrorResponse): string {
    // Try to extract lockout duration from the message
    const durationMatch = message.match(/(\d+)\s*(minute|hour|second)s?/i);

    if (durationMatch) {
      const duration = durationMatch[1];
      const unit = durationMatch[2].toLowerCase();
      return `Your account has been temporarily locked due to multiple failed login attempts. Please try again in ${duration} ${unit}${duration !== '1' ? 's' : ''}.`;
    }

    // Check if there's a specific unlock time
    const timeMatch = message.match(/until\s+(.+)/i);
    if (timeMatch) {
      return `Your account has been temporarily locked due to multiple failed login attempts. You can try again ${timeMatch[1]}.`;
    }

    // Generic lockout message
    return 'Your account has been temporarily locked due to multiple failed login attempts. Please try again later or contact support if this continues.';
  }

  // Map HTTP status codes to appropriate error messages
  private static mapStatusCodeToMessage(status: number, apiMessage: string): string {
    switch (status) {
      case 400:
        return apiMessage || 'Bad request. Please check your input and try again.';

      case 401:
        return apiMessage || 'You are not authorized to perform this action. Please log in.';

      case 403:
        return apiMessage || 'You do not have permission to perform this action.';

      case 404:
        return apiMessage || 'The requested resource was not found.';

      case 409:
        return apiMessage || 'A conflict occurred. The resource may already exist.';

      case 422:
        return apiMessage || 'Validation failed. Please check your input and try again.';

      case 429:
        return 'Too many requests. Please wait a moment and try again.';

      case 500:
        return 'Internal server error. Please try again later.';

      case 502:
        return 'Bad gateway. The server is temporarily unavailable.';

      case 503:
        return 'Service temporarily unavailable. Please try again later.';

      case 504:
        return 'Gateway timeout. The request took too long to process.';

      default:
        if (status >= 500) {
          return 'Server error. Please try again later.';
        } else if (status >= 400) {
          return apiMessage || 'Client error. Please check your request and try again.';
        }
        return apiMessage || 'An error occurred while processing your request.';
    }
  }

  // Handle network-related errors
  private static handleNetworkError(error: Error): string {
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return 'Request timeout. Please check your connection and try again.';
    }

    if (error.message.includes('Failed to fetch')) {
      return 'Unable to connect to server. Please check your internet connection and try again.';
    }

    if (error.message.includes('Network')) {
      return 'Network connection error. Please check your internet connection.';
    }

    return 'Connection error. Please check your internet connection and try again.';
  }

  // Legacy API error handler for backward compatibility
  private static handleApiError(error: APIError): string {
    const status = error.status;
    const message = error.message;

    // Handle specific API endpoint errors
    if (message && this.isKnownMissingEndpoint(message)) {
      return this.handleMissingEndpointError(message);
    }

    return this.mapStatusCodeToMessage(status || 500, message);
  }

  private static isKnownMissingEndpoint(message: string): boolean {
    const missingEndpoints = [
      '/exercises',
      '/equipment',
      '/plans', // Old endpoint that should redirect to training-blocks
    ];
    return missingEndpoints.some((endpoint) => message.includes(endpoint));
  }

  private static handleMissingEndpointError(message: string): string {
    if (message.includes('/exercises')) {
      return 'Exercise management is currently unavailable. The backend service is being updated.';
    }
    if (message.includes('/equipment')) {
      return 'Equipment management is currently unavailable. The backend service is being updated.';
    }
    if (message.includes('/plans')) {
      return 'This feature has been updated. Please refresh the page and try again.';
    }
    return 'This feature is temporarily unavailable while we update our services.';
  }

  // Enhanced async error handler with better return types
  static async handleAsync<T>(
    asyncFn: () => Promise<T>,
    options: ErrorHandlerOptions = {},
  ): Promise<T | null> {
    try {
      return await asyncFn();
    } catch (error) {
      this.handle(error, options);
      return null;
    }
  }

  // Handle API response errors specifically (for use with Results pattern)
  static handleApiResponse<T>(response: HttpResponse<T>, context: ErrorContext = {}): string {
    return this.handleHttpResponseError(response as HttpResponse<ApiErrorResponse>, context);
  }

  // Extract user-friendly error message from various error types
  static extractErrorMessage(
    error: unknown,
    fallback: string = 'An unexpected error occurred',
  ): string {
    if (this.isHttpResponseError(error)) {
      return this.handleHttpResponseError(error);
    }

    if (this.isApiError(error)) {
      return this.handleApiError(error);
    }

    if (error instanceof Error) {
      if (this.isNetworkError(error)) {
        return this.handleNetworkError(error);
      }
      return error.message || fallback;
    }

    return fallback;
  }

  // Validate if an error response contains account lockout information
  static isAccountLockoutError(error: unknown): boolean {
    if (this.isHttpResponseError(error)) {
      const { status, data } = error;
      if (status === 401 && data && typeof data === 'object') {
        const message = Array.isArray(data.message)
          ? data.message.join(' ').toLowerCase()
          : (data.message || '').toLowerCase();
        return message.includes('locked') || message.includes('lockout');
      }
    }

    if (this.isApiError(error)) {
      return error.status === 401 && error.message.toLowerCase().includes('locked');
    }

    return false;
  }

  // Extract lockout duration from error message
  static extractLockoutDuration(error: unknown): { duration: number; unit: string } | null {
    let message = '';

    if (this.isHttpResponseError(error) && error.data) {
      message = Array.isArray(error.data.message)
        ? error.data.message.join(' ')
        : error.data.message || '';
    } else if (this.isApiError(error)) {
      message = error.message;
    }

    const durationMatch = message.match(/(\d+)\s*(minute|hour|second)s?/i);
    if (durationMatch) {
      return {
        duration: parseInt(durationMatch[1], 10),
        unit: durationMatch[2].toLowerCase(),
      };
    }

    return null;
  }
}

export default ErrorHandler;
