import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Request } from 'express';
import { RequestContext } from '@strengthos/shared-types';

@Injectable()
export class AuditLoggingInterceptor implements NestInterceptor {
  constructor() {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user as RequestContext;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const auditData = {
      method: request.method,
      path: request.path,
      ip: request.ip,
      userAgent: request.get('User-Agent'),
      userId: user?.userId,
      tenantId: user?.tenantId || (request as any).tenantId,
      sessionId: user?.sessionId,
      timestamp: new Date(),
      requestId:
        user?.requestId ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    return next.handle().pipe(
      catchError((error) => {
        const statusCode = error.status || 500;

        // Log security events for failures
        if (
          this.isSecurityRelevantEndpoint(request.path) ||
          statusCode === 401 ||
          statusCode === 403
        ) {
          // Logging is removed
        }

        throw error;
      }),
    );
  }

  // Remove logSecurityEvent entirely since logging is removed

  private isSecurityRelevantEndpoint(path: string): boolean {
    const securityPaths = ['/auth/', '/admin/', '/users/', '/tenants/'];
    return securityPaths.some((securityPath) => path.includes(securityPath));
  }
}
