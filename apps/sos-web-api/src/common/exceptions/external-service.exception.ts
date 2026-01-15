import { HttpStatus } from '@nestjs/common';
import { ErrorCategory, ErrorSeverity } from '@strengthos/shared-types';
import { BaseException, ErrorContext } from './base.exception';

export class ExternalServiceException extends BaseException {
  constructor(
    message: string,
    serviceName: string,
    code: string = 'EXTERNAL_SERVICE_ERROR',
    context?: ErrorContext,
    metadata?: Record<string, any>,
  ) {
    super(
      {
        code,
        message,
        category: ErrorCategory.EXTERNAL_SERVICE,
        severity: ErrorSeverity.HIGH,
        context,
        metadata: { serviceName, ...metadata },
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}

export class ServiceUnavailableException extends ExternalServiceException {
  constructor(serviceName: string, context?: ErrorContext) {
    super(
      `External service '${serviceName}' is currently unavailable`,
      serviceName,
      'SERVICE_UNAVAILABLE',
      context,
    );

    this.getStatus = () => HttpStatus.SERVICE_UNAVAILABLE;
  }
}

export class ServiceTimeoutException extends ExternalServiceException {
  constructor(serviceName: string, timeoutMs: number, context?: ErrorContext) {
    super(
      `External service '${serviceName}' timed out after ${timeoutMs}ms`,
      serviceName,
      'SERVICE_TIMEOUT',
      context,
      { timeoutMs },
    );

    this.getStatus = () => HttpStatus.GATEWAY_TIMEOUT;
  }
}

export class ServiceAuthenticationException extends ExternalServiceException {
  constructor(serviceName: string, context?: ErrorContext) {
    super(
      `Authentication failed with external service '${serviceName}'`,
      serviceName,
      'SERVICE_AUTHENTICATION_FAILED',
      context,
    );

    this.getStatus = () => HttpStatus.UNAUTHORIZED;
  }
}

export class ServiceRateLimitException extends ExternalServiceException {
  constructor(
    serviceName: string,
    retryAfter?: number,
    context?: ErrorContext,
  ) {
    super(
      `Rate limit exceeded for external service '${serviceName}'`,
      serviceName,
      'SERVICE_RATE_LIMIT',
      context,
      { retryAfter },
    );

    this.getStatus = () => HttpStatus.TOO_MANY_REQUESTS;
  }
}

export class ServiceResponseException extends ExternalServiceException {
  constructor(
    serviceName: string,
    statusCode: number,
    responseBody?: any,
    context?: ErrorContext,
  ) {
    super(
      `External service '${serviceName}' returned error: ${statusCode}`,
      serviceName,
      'SERVICE_RESPONSE_ERROR',
      context,
      { statusCode, responseBody },
    );
  }
}

export class ServiceConfigurationException extends ExternalServiceException {
  constructor(
    serviceName: string,
    configIssue: string,
    context?: ErrorContext,
  ) {
    super(
      `Configuration error for external service '${serviceName}': ${configIssue}`,
      serviceName,
      'SERVICE_CONFIGURATION_ERROR',
      context,
      { configIssue },
    );

    this.getStatus = () => HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
