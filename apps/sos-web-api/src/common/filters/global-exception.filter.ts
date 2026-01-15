import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ILogger, LogLevel } from '@strengthos/shared-logging';
import { SecurityMonitoringService } from '@strengthos/shared-security';
import { SecurityEventType, ErrorSeverity } from '@strengthos/shared-types';
import { BaseException, ErrorContext } from '../exceptions/base.exception';

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  code?: string;
  timestamp: string;
  path: string;
  traceId?: string;
  validationErrors?: any[];
}

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject('ILogger') private readonly logger: ILogger,
    @Inject('SecurityMonitoringService')
    private readonly securityMonitoring: SecurityMonitoringService,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorContext = this.buildErrorContext(request);
    const errorResponse = await this.buildErrorResponse(
      exception,
      errorContext,
    );

    // Log the error
    await this.logError(exception, errorContext, errorResponse);

    // Monitor security events if applicable
    await this.monitorSecurityEvents(exception, errorContext);

    // Send the response only if headers haven't been sent yet
    // (e.g., if a redirect was already sent)
    if (!response.headersSent) {
      response.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  private buildErrorContext(request: Request): ErrorContext {
    return {
      userId: (request as any).user?.userId,
      tenantId: (request as any).user?.tenantId || (request as any).tenantId,
      requestId:
        (request as any).requestId ||
        (request.headers['x-request-id'] as string),
      ip: request.ip,
      userAgent: request.get('User-Agent'),
      path: request.url,
      method: request.method,
      timestamp: new Date(),
    };
  }

  private async buildErrorResponse(
    exception: unknown,
    context: ErrorContext,
  ): Promise<ErrorResponse> {
    const timestamp = new Date().toISOString();
    const path = context.path || '';
    const traceId = context.requestId;

    // Handle BaseException (our custom exceptions)
    if (exception instanceof BaseException) {
      return {
        statusCode: exception.getStatus(),
        message: exception.message,
        error: exception.name,
        code: exception.code,
        timestamp,
        path,
        traceId,
        ...((exception.getErrorResponse() as any).validationErrors && {
          validationErrors: (exception.getErrorResponse() as any)
            .validationErrors,
        }),
      };
    }

    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        return {
          statusCode: status,
          message: responseObj.message || exception.message,
          error: responseObj.error || exception.name,
          code: responseObj.code,
          timestamp,
          path,
          traceId,
          ...(responseObj.validationErrors && {
            validationErrors: responseObj.validationErrors,
          }),
        };
      }

      return {
        statusCode: status,
        message: exception.message,
        error: exception.name,
        timestamp,
        path,
        traceId,
      };
    }

    // Handle generic Error
    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'InternalServerError',
        code: 'INTERNAL_ERROR',
        timestamp,
        path,
        traceId,
      };
    }

    // Handle unknown exceptions
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      error: 'UnknownError',
      code: 'UNKNOWN_ERROR',
      timestamp,
      path,
      traceId,
    };
  }

  private async logError(
    exception: unknown,
    context: ErrorContext,
    errorResponse: ErrorResponse,
  ): Promise<void> {
    try {
      const logLevel = this.getLogLevel(errorResponse.statusCode);
      const logData = {
        message: `${errorResponse.error}: ${errorResponse.message}`,
        fullMessage:
          exception instanceof Error ? exception.stack : String(exception),
        ip: context.ip,
        url: context.path,
        userAgent: context.userAgent,
        userId: context.userId,
        tenantId: context.tenantId,
        requestId: context.requestId,
        statusCode: errorResponse.statusCode,
        errorCode: errorResponse.code,
        method: context.method,
      };

      switch (logLevel) {
        case LogLevel.Error:
          await this.logger.error(
            logData,
            exception instanceof Error ? exception.stack : undefined,
            exception instanceof Error ? exception.message : String(exception),
          );
          break;
        case LogLevel.Warning:
          await this.logger.warning(logData);
          break;
      }
    } catch (loggingError) {
      // Fallback logging - try to use logger one more time, then fail silently
      try {
        await this.logger.error({
          message: 'Failed to log error',
          loggingError: loggingError.message,
          originalError:
            exception instanceof Error ? exception.message : String(exception),
        });
      } catch {
        // If logger completely fails, we can't do much more without console
        // This is a last resort fallback
      }
    }
  }

  private async monitorSecurityEvents(
    exception: unknown,
    context: ErrorContext,
  ): Promise<void> {
    try {
      let eventType: SecurityEventType | null = null;
      let severity: ErrorSeverity = ErrorSeverity.LOW;

      // Determine if this is a security-related event
      if (exception instanceof BaseException) {
        switch (exception.code) {
          case 'INVALID_CREDENTIALS':
          case 'INVALID_TOKEN':
          case 'TOKEN_EXPIRED':
            eventType = SecurityEventType.LOGIN_FAILURE;
            severity = ErrorSeverity.MEDIUM;
            break;
          case 'INSUFFICIENT_PERMISSIONS':
          case 'RESOURCE_ACCESS_DENIED':
          case 'TENANT_ACCESS_DENIED':
            eventType = SecurityEventType.ACCESS_DENIED;
            severity = ErrorSeverity.MEDIUM;
            break;
          case 'TOO_MANY_ATTEMPTS':
          case 'ACCOUNT_LOCKED':
            eventType = SecurityEventType.SUSPICIOUS_ACTIVITY;
            severity = ErrorSeverity.HIGH;
            break;
          case 'TENANT_SUSPENDED':
          case 'TENANT_INACTIVE':
            eventType = SecurityEventType.COMPLIANCE_VIOLATION;
            severity = ErrorSeverity.HIGH;
            break;
        }
      }

      if (eventType) {
        await this.securityMonitoring.logSecurityEvent({
          eventType,
          severity: severity.toLowerCase() as
            | 'low'
            | 'medium'
            | 'high'
            | 'critical',
          userId: context.userId,
          tenantId: context.tenantId,
          ipAddress: context.ip || '',
          userAgent: context.userAgent,
          resource: context.path,
          action: context.method,
          metadata: {
            errorCode:
              exception instanceof BaseException ? exception.code : 'UNKNOWN',
            errorMessage:
              exception instanceof Error
                ? exception.message
                : String(exception),
            requestId: context.requestId,
          },
          tags: ['error', 'security_event'],
        } as any);
      }
    } catch (monitoringError) {
      // Log monitoring failure but don't throw
      await this.logger.error({
        message: 'Failed to log security event',
        fullMessage: (monitoringError as Error).stack,
        metadata: {
          originalError:
            exception instanceof Error ? exception.message : String(exception),
        },
      });
    }
  }

  private getLogLevel(statusCode: number): LogLevel {
    if (statusCode >= 500) {
      return LogLevel.Error;
    } else if (statusCode >= 400) {
      return LogLevel.Warning;
    } else if (statusCode >= 300) {
      return LogLevel.Info;
    } else {
      return LogLevel.Debug;
    }
  }
}
