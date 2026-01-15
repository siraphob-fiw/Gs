import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ILogger } from '@strengthos/shared-logging';
import { v4 as uuidv4 } from 'uuid';

export interface RequestLogData {
  requestId: string;
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  tenantId?: string;
  timestamp: Date;
  duration?: number;
  statusCode?: number;
  responseSize?: number;
  error?: string;
}

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(@Inject('ILogger') private readonly logger: ILogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const startTime = Date.now();
    const requestId = (request.headers['x-request-id'] as string) || uuidv4();

    // Add request ID to request object for use in other parts of the application
    (request as any).requestId = requestId;

    // Set request ID header in response
    response.setHeader('X-Request-ID', requestId);

    const logData: RequestLogData = {
      requestId,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.get('User-Agent'),
      userId: (request as any).user?.userId,
      tenantId: (request as any).user?.tenantId || (request as any).tenantId,
      timestamp: new Date(),
    };

    // Log incoming request
    this.logRequest(logData);

    return next.handle().pipe(
      tap((data) => {
        // Log successful response
        const duration = Date.now() - startTime;
        const responseSize = this.calculateResponseSize(data);

        this.logResponse({
          ...logData,
          duration,
          statusCode: response.statusCode,
          responseSize,
        });
      }),
      catchError((error) => {
        // Log error response
        const duration = Date.now() - startTime;

        this.logError({
          ...logData,
          duration,
          statusCode: error.status || 500,
          error: error.message || 'Unknown error',
        });

        throw error;
      }),
    );
  }

  private async logRequest(logData: RequestLogData): Promise<void> {
    try {
      await this.logger.info({
        message: `Incoming ${logData.method} request to ${logData.url}`,
        metadata: {
          type: 'REQUEST',
          requestId: logData.requestId,
          method: logData.method,
          url: logData.url,
          ip: logData.ip,
          userAgent: logData.userAgent,
          userId: logData.userId,
          tenantId: logData.tenantId,
          timestamp: logData.timestamp,
        },
      });
    } catch (error) {
      // Use fallback logging if shared logger fails
      await this.logger.error({
        message: 'Failed to log request',
        error: error.message,
      });
    }
  }

  private async logResponse(logData: RequestLogData): Promise<void> {
    try {
      const level = this.getLogLevelForStatus(logData.statusCode || 200);
      const message = `${logData.method} ${logData.url} - ${logData.statusCode} - ${logData.duration}ms`;

      const metadata = {
        type: 'RESPONSE',
        requestId: logData.requestId,
        method: logData.method,
        url: logData.url,
        statusCode: logData.statusCode,
        duration: logData.duration,
        responseSize: logData.responseSize,
        ip: logData.ip,
        userId: logData.userId,
        tenantId: logData.tenantId,
        timestamp: logData.timestamp,
      };

      if (level === 'error') {
        await this.logger.error({ message, metadata });
      } else if (level === 'warning') {
        await this.logger.warning({ message, metadata });
      } else {
        await this.logger.info({ message, metadata });
      }
    } catch (error) {
      // Use fallback logging if shared logger fails
      await this.logger.error({
        message: 'Failed to log response',
        error: error.message,
      });
    }
  }

  private async logError(logData: RequestLogData): Promise<void> {
    try {
      await this.logger.error({
        message: `${logData.method} ${logData.url} - ${logData.statusCode} - ${logData.duration}ms - Error: ${logData.error}`,
        metadata: {
          type: 'ERROR_RESPONSE',
          requestId: logData.requestId,
          method: logData.method,
          url: logData.url,
          statusCode: logData.statusCode,
          duration: logData.duration,
          error: logData.error,
          ip: logData.ip,
          userId: logData.userId,
          tenantId: logData.tenantId,
          timestamp: logData.timestamp,
        },
      });
    } catch (error) {
      // Use fallback logging if shared logger fails
      await this.logger.error({
        message: 'Failed to log error response',
        error: error.message,
      });
    }
  }

  private calculateResponseSize(data: any): number {
    if (!data) return 0;

    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  private getLogLevelForStatus(
    statusCode: number,
  ): 'info' | 'warning' | 'error' {
    if (statusCode >= 500) {
      return 'error';
    } else if (statusCode >= 400) {
      return 'warning';
    } else {
      return 'info';
    }
  }
}
