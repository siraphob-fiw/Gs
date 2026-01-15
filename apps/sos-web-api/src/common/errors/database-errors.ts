/**
 * Standardized error types for database and connection configuration issues
 * Provides consistent error handling across the application
 */

export enum DatabaseErrorCode {
  // Configuration errors
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  MISSING_CONFIGURATION = 'MISSING_CONFIGURATION',
  INVALID_CONNECTION_URL = 'INVALID_CONNECTION_URL',

  // Connection errors
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',

  // Pool errors
  POOL_EXHAUSTED = 'POOL_EXHAUSTED',
  POOL_TIMEOUT = 'POOL_TIMEOUT',
  POOL_CONFIGURATION_ERROR = 'POOL_CONFIGURATION_ERROR',

  // Query errors
  QUERY_FAILED = 'QUERY_FAILED',
  QUERY_TIMEOUT = 'QUERY_TIMEOUT',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',

  // Health check errors
  HEALTH_CHECK_FAILED = 'HEALTH_CHECK_FAILED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export enum RedisErrorCode {
  // Configuration errors
  INVALID_CONFIGURATION = 'REDIS_INVALID_CONFIGURATION',
  MISSING_CONFIGURATION = 'REDIS_MISSING_CONFIGURATION',
  INVALID_CONNECTION_URL = 'REDIS_INVALID_CONNECTION_URL',

  // Connection errors
  CONNECTION_FAILED = 'REDIS_CONNECTION_FAILED',
  CONNECTION_TIMEOUT = 'REDIS_CONNECTION_TIMEOUT',
  CONNECTION_REFUSED = 'REDIS_CONNECTION_REFUSED',
  AUTHENTICATION_FAILED = 'REDIS_AUTHENTICATION_FAILED',

  // Operation errors
  OPERATION_FAILED = 'REDIS_OPERATION_FAILED',
  OPERATION_TIMEOUT = 'REDIS_OPERATION_TIMEOUT',
  KEY_NOT_FOUND = 'REDIS_KEY_NOT_FOUND',

  // Health check errors
  HEALTH_CHECK_FAILED = 'REDIS_HEALTH_CHECK_FAILED',
  SERVICE_UNAVAILABLE = 'REDIS_SERVICE_UNAVAILABLE',
}

/**
 * Base class for all database-related errors
 */
export abstract class DatabaseError extends Error {
  public readonly timestamp: Date;
  public readonly service: 'database' | 'redis';
  public readonly code: DatabaseErrorCode | RedisErrorCode;
  public readonly context?: Record<string, any>;
  public readonly isRetryable: boolean;

  constructor(
    message: string,
    code: DatabaseErrorCode | RedisErrorCode,
    service: 'database' | 'redis',
    context?: Record<string, any>,
    isRetryable: boolean = false,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.service = service;
    this.code = code;
    this.context = context;
    this.isRetryable = isRetryable;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Returns a sanitized version of the error for logging (removes sensitive data)
   */
  toSafeObject(): Record<string, any> {
    const safeContext = this.context
      ? this.sanitizeContext(this.context)
      : undefined;

    return {
      name: this.name,
      message: this.message,
      code: this.code,
      service: this.service,
      timestamp: this.timestamp.toISOString(),
      isRetryable: this.isRetryable,
      context: safeContext,
    };
  }

  /**
   * Removes sensitive information from context for safe logging
   */
  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sensitiveKeys = [
      'password',
      'secret',
      'token',
      'key',
      'auth',
      'credential',
    ];
    const sanitized = { ...context };

    Object.keys(sanitized).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}

/**
 * Configuration-related database errors
 */
export class DatabaseConfigurationError extends DatabaseError {
  constructor(
    message: string,
    code: DatabaseErrorCode = DatabaseErrorCode.INVALID_CONFIGURATION,
    context?: Record<string, any>,
  ) {
    super(message, code, 'database', context, false);
  }

  static missingConfiguration(
    field: string,
    suggestion?: string,
  ): DatabaseConfigurationError {
    return new DatabaseConfigurationError(
      `Missing required database configuration: ${field}${suggestion ? `. ${suggestion}` : ''}`,
      DatabaseErrorCode.MISSING_CONFIGURATION,
      { field, suggestion },
    );
  }

  static invalidConfiguration(
    field: string,
    value: any,
    constraint: string,
  ): DatabaseConfigurationError {
    return new DatabaseConfigurationError(
      `Invalid database configuration for ${field}: ${constraint}`,
      DatabaseErrorCode.INVALID_CONFIGURATION,
      {
        field,
        value: typeof value === 'string' ? value : '[COMPLEX_VALUE]',
        constraint,
      },
    );
  }

  static invalidConnectionUrl(
    url: string,
    expectedFormat: string,
  ): DatabaseConfigurationError {
    return new DatabaseConfigurationError(
      `Invalid database connection URL format. Expected: ${expectedFormat}`,
      DatabaseErrorCode.INVALID_CONNECTION_URL,
      { expectedFormat, providedUrl: '[REDACTED]' },
    );
  }
}

/**
 * Connection-related database errors
 */
export class DatabaseConnectionError extends DatabaseError {
  constructor(
    message: string,
    code: DatabaseErrorCode = DatabaseErrorCode.CONNECTION_FAILED,
    context?: Record<string, any>,
    isRetryable: boolean = true,
  ) {
    super(message, code, 'database', context, isRetryable);
  }

  static connectionFailed(
    host: string,
    port: number,
    originalError?: Error,
  ): DatabaseConnectionError {
    return new DatabaseConnectionError(
      `Failed to connect to database at ${host}:${port}${originalError ? `: ${originalError.message}` : ''}`,
      DatabaseErrorCode.CONNECTION_FAILED,
      { host, port, originalError: originalError?.message },
      true,
    );
  }

  static connectionTimeout(
    host: string,
    port: number,
    timeoutMs: number,
  ): DatabaseConnectionError {
    return new DatabaseConnectionError(
      `Database connection timeout after ${timeoutMs}ms to ${host}:${port}`,
      DatabaseErrorCode.CONNECTION_TIMEOUT,
      { host, port, timeoutMs },
      true,
    );
  }

  static authenticationFailed(username: string): DatabaseConnectionError {
    return new DatabaseConnectionError(
      `Database authentication failed for user: ${username}`,
      DatabaseErrorCode.AUTHENTICATION_FAILED,
      { username },
      false,
    );
  }
}

/**
 * Pool-related database errors
 */
export class DatabasePoolError extends DatabaseError {
  constructor(
    message: string,
    code: DatabaseErrorCode = DatabaseErrorCode.POOL_EXHAUSTED,
    context?: Record<string, any>,
    isRetryable: boolean = true,
  ) {
    super(message, code, 'database', context, isRetryable);
  }

  static poolExhausted(
    maxConnections: number,
    waitingCount: number,
  ): DatabasePoolError {
    return new DatabasePoolError(
      `Database connection pool exhausted. Max: ${maxConnections}, Waiting: ${waitingCount}`,
      DatabaseErrorCode.POOL_EXHAUSTED,
      { maxConnections, waitingCount },
      true,
    );
  }

  static poolTimeout(timeoutMs: number): DatabasePoolError {
    return new DatabasePoolError(
      `Database pool acquisition timeout after ${timeoutMs}ms`,
      DatabaseErrorCode.POOL_TIMEOUT,
      { timeoutMs },
      true,
    );
  }
}

/**
 * Configuration-related Redis errors
 */
export class RedisConfigurationError extends DatabaseError {
  constructor(
    message: string,
    code: RedisErrorCode = RedisErrorCode.INVALID_CONFIGURATION,
    context?: Record<string, any>,
  ) {
    super(message, code, 'redis', context, false);
  }

  static missingConfiguration(
    field: string,
    suggestion?: string,
  ): RedisConfigurationError {
    return new RedisConfigurationError(
      `Missing required Redis configuration: ${field}${suggestion ? `. ${suggestion}` : ''}`,
      RedisErrorCode.MISSING_CONFIGURATION,
      { field, suggestion },
    );
  }

  static invalidConfiguration(
    field: string,
    value: any,
    constraint: string,
  ): RedisConfigurationError {
    return new RedisConfigurationError(
      `Invalid Redis configuration for ${field}: ${constraint}`,
      RedisErrorCode.INVALID_CONFIGURATION,
      {
        field,
        value: typeof value === 'string' ? value : '[COMPLEX_VALUE]',
        constraint,
      },
    );
  }
}

/**
 * Connection-related Redis errors
 */
export class RedisConnectionError extends DatabaseError {
  constructor(
    message: string,
    code: RedisErrorCode = RedisErrorCode.CONNECTION_FAILED,
    context?: Record<string, any>,
    isRetryable: boolean = true,
  ) {
    super(message, code, 'redis', context, isRetryable);
  }

  static connectionFailed(
    host: string,
    port: number,
    originalError?: Error,
  ): RedisConnectionError {
    return new RedisConnectionError(
      `Failed to connect to Redis at ${host}:${port}${originalError ? `: ${originalError.message}` : ''}`,
      RedisErrorCode.CONNECTION_FAILED,
      { host, port, originalError: originalError?.message },
      true,
    );
  }

  static authenticationFailed(): RedisConnectionError {
    return new RedisConnectionError(
      'Redis authentication failed - check password configuration',
      RedisErrorCode.AUTHENTICATION_FAILED,
      {},
      false,
    );
  }
}

/**
 * Operation-related Redis errors
 */
export class RedisOperationError extends DatabaseError {
  constructor(
    message: string,
    code: RedisErrorCode = RedisErrorCode.OPERATION_FAILED,
    context?: Record<string, any>,
    isRetryable: boolean = true,
  ) {
    super(message, code, 'redis', context, isRetryable);
  }

  static operationFailed(
    operation: string,
    key?: string,
    originalError?: Error,
  ): RedisOperationError {
    return new RedisOperationError(
      `Redis ${operation} operation failed${key ? ` for key: ${key}` : ''}${originalError ? `: ${originalError.message}` : ''}`,
      RedisErrorCode.OPERATION_FAILED,
      { operation, key, originalError: originalError?.message },
      true,
    );
  }

  static operationTimeout(
    operation: string,
    timeoutMs: number,
    key?: string,
  ): RedisOperationError {
    return new RedisOperationError(
      `Redis ${operation} operation timeout after ${timeoutMs}ms${key ? ` for key: ${key}` : ''}`,
      RedisErrorCode.OPERATION_TIMEOUT,
      { operation, timeoutMs, key },
      true,
    );
  }
}

/**
 * Health check related errors
 */
export class HealthCheckError extends DatabaseError {
  constructor(
    message: string,
    service: 'database' | 'redis',
    code: DatabaseErrorCode | RedisErrorCode,
    context?: Record<string, any>,
  ) {
    const errorCode =
      service === 'database'
        ? DatabaseErrorCode.HEALTH_CHECK_FAILED
        : RedisErrorCode.HEALTH_CHECK_FAILED;

    super(message, code || errorCode, service, context, true);
  }

  static databaseHealthCheckFailed(originalError?: Error): HealthCheckError {
    return new HealthCheckError(
      `Database health check failed${originalError ? `: ${originalError.message}` : ''}`,
      'database',
      DatabaseErrorCode.HEALTH_CHECK_FAILED,
      { originalError: originalError?.message },
    );
  }

  static redisHealthCheckFailed(originalError?: Error): HealthCheckError {
    return new HealthCheckError(
      `Redis health check failed${originalError ? `: ${originalError.message}` : ''}`,
      'redis',
      RedisErrorCode.HEALTH_CHECK_FAILED,
      { originalError: originalError?.message },
    );
  }
}

/**
 * Utility functions for error handling
 */
export class DatabaseErrorUtils {
  /**
   * Determines if an error is retryable based on its type and code
   */
  static isRetryable(error: Error): boolean {
    if (error instanceof DatabaseError) {
      return error.isRetryable;
    }

    // Check for common retryable error patterns
    const retryablePatterns = [
      /connection.*timeout/i,
      /connection.*refused/i,
      /pool.*exhausted/i,
      /temporary.*failure/i,
      /network.*error/i,
    ];

    return retryablePatterns.some((pattern) => pattern.test(error.message));
  }

  /**
   * Extracts error code from various error types
   */
  static getErrorCode(error: Error): string {
    if (error instanceof DatabaseError) {
      return error.code;
    }

    // Map common error patterns to codes
    const message = error.message.toLowerCase();

    if (message.includes('timeout')) {
      return 'TIMEOUT';
    }
    if (message.includes('connection') && message.includes('refused')) {
      return 'CONNECTION_REFUSED';
    }
    if (message.includes('authentication') || message.includes('auth')) {
      return 'AUTHENTICATION_FAILED';
    }
    if (message.includes('pool')) {
      return 'POOL_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Creates a user-friendly error message with troubleshooting suggestions
   */
  static createUserFriendlyMessage(error: Error): string {
    if (error instanceof DatabaseError) {
      return error.message;
    }

    const code = this.getErrorCode(error);
    const suggestions: Record<string, string> = {
      TIMEOUT: 'Check network connectivity and increase timeout values',
      CONNECTION_REFUSED: 'Verify the service is running and accessible',
      AUTHENTICATION_FAILED: 'Check username and password configuration',
      POOL_ERROR: 'Review connection pool configuration and usage patterns',
    };

    const suggestion = suggestions[code];
    return `${error.message}${suggestion ? `. Suggestion: ${suggestion}` : ''}`;
  }

  /**
   * Logs error with appropriate level and context
   */
  static logError(
    error: Error,
    logger: any,
    context?: Record<string, any>,
  ): void {
    const errorInfo =
      error instanceof DatabaseError
        ? error.toSafeObject()
        : { message: error.message, name: error.name };

    const logContext = { ...errorInfo, ...context };

    if (error instanceof DatabaseError && error.isRetryable) {
      logger.warn('Retryable database error occurred', logContext);
    } else {
      logger.error('Database error occurred', logContext);
    }
  }
}

// All error types are already exported individually above
