import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ILogger } from '@strengthos/shared-logging';

@Injectable()
export class ControllerLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ControllerLoggingInterceptor.name);

  constructor(@Inject('ILogger') private readonly customLogger: ILogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Get controller and method information
    const controller = context.getClass();
    const handler = context.getHandler();
    const controllerName = controller.name;
    const methodName = handler.name;

    // Get request details
    const method = request.method;
    const url = request.url;
    const userAgent = request.get('User-Agent') || 'Unknown';
    const ip = request.ip || request.connection.remoteAddress || 'Unknown';
    const tenantId = (request as any).tenantId;
    const userId = (request as any).user?.userId;

    // Log controller call
    const logMessage = `Controller called: ${controllerName}.${methodName}`;
    const logData = {
      controller: controllerName,
      method: methodName,
      httpMethod: method,
      url,
      userAgent,
      ip,
      tenantId,
      userId,
      timestamp: new Date(),
    };

    // Log using both NestJS Logger and custom logger
    this.logger.log(`${logMessage} - ${method} ${url}`);

    // Use custom logger if available
    if (this.customLogger) {
      this.customLogger
        .info({
          message: logMessage,
          fullMessage: JSON.stringify(logData),
          ip,
          url,
          userAgent,
        })
        .catch((error) => {
          this.logger.warn(`Failed to log to custom logger: ${error.message}`);
        });
    }

    return next.handle().pipe(
      tap({
        next: (_data) => {
          // Log successful response
          this.logger.log(
            `Controller completed: ${controllerName}.${methodName} - Status: ${response.statusCode}`,
          );
        },
        error: (error) => {
          // Log error response
          this.logger.error(
            `Controller error: ${controllerName}.${methodName} - Error: ${error.message}`,
          );
        },
      }),
    );
  }
}
