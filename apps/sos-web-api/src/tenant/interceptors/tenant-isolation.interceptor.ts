import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { TenantContextService } from '../services/tenant-context.service';
import { ILogger } from '@strengthos/shared-logging';
import { TenantAwareRequest } from '../middleware/tenant-context.middleware';
import { RequestContext } from '@strengthos/shared-types';

@Injectable()
export class TenantIsolationInterceptor implements NestInterceptor {
  constructor(
    private readonly tenantContextService: TenantContextService,
    @Inject('ILogger') private readonly loggingService: ILogger,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<TenantAwareRequest>();
    const user = request.user as RequestContext;
    const tenantId = request.tenantId;

    // Set up tenant context for database queries
    const setupPromise = this.setupTenantContext(user?.userId, tenantId);

    return next.handle().pipe(
      tap(async () => {
        // Ensure tenant context is properly set before processing
        await setupPromise;
      }),
      finalize(async () => {
        // Clean up tenant context after request processing
        try {
          await this.tenantContextService.clearTenantContext();
        } catch (error) {
          await this.loggingService.error({
            message: 'Error clearing tenant context',
            fullMessage: error instanceof Error ? error.message : String(error),
            userId: user?.userId,
            tenantId,
          });
        }
      }),
    ) as Observable<any>;
  }

  private async setupTenantContext(
    userId?: string,
    tenantId?: string,
  ): Promise<void> {
    if (!userId || !tenantId) {
      return;
    }

    try {
      // Set tenant context for row-level security
      await this.tenantContextService.setTenantContext(userId, tenantId);

      await this.loggingService.debug({
        message: 'Tenant isolation context established',
        userId,
        tenantId,
      });
    } catch (error) {
      await this.loggingService.error({
        message: 'Error setting up tenant context',
        fullMessage: error instanceof Error ? error.message : String(error),
        userId,
        tenantId,
      });
      // Don't throw here to avoid breaking the request flow
    }
  }
}
