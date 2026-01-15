import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from '../services/tenant-context.service';
import { ILogger } from '@strengthos/shared-logging';
import { UserRole } from '@strengthos/shared-types';

export interface TenantAwareRequest extends Request {
  tenantId?: string;
  tenantContext?: {
    tenantId: string;
    userId: string;
    role: UserRole;
    isSuperAdmin: boolean;
  };
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContextService: TenantContextService,
    @Inject('ILogger') private readonly loggingService: ILogger,
  ) {}

  async use(req: TenantAwareRequest, res: Response, next: NextFunction) {
    try {
      // Skip tenant context for certain routes
      if (this.shouldSkipTenantContext(req.path)) {
        return next();
      }

      // Get user from request (should be set by auth middleware)
      const user = (req as any).user;
      if (!user) {
        return next();
      }

      // Extract tenant ID from various sources
      const tenantId = this.extractTenantId(req, user);

      if (tenantId) {
        // Validate tenant access
        const hasAccess = await this.validateTenantAccess(
          user.id,
          tenantId,
          user.role,
        );

        if (!hasAccess) {
          await this.logSecurityViolation(user.id, tenantId, req);
          throw new ForbiddenException('Access denied to tenant');
        }

        // Set tenant context in database
        await this.tenantContextService.setTenantContext(user.id, tenantId);

        // Add tenant context to request
        req.tenantId = tenantId;
        req.tenantContext = {
          tenantId,
          userId: user.id,
          role: user.role,
          isSuperAdmin: user.role === UserRole.SUPER_ADMIN,
        };

        await this.loggingService.debug({
          message: 'Tenant context set',
          userId: user.id,
          tenantId,
          path: req.path,
        });
      }

      next();
    } catch (error) {
      await this.loggingService.error({
        message: 'Tenant context middleware error',
        fullMessage: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.id,
        path: req.path,
      });

      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      next(error);
    }
  }

  private shouldSkipTenantContext(path: string): boolean {
    const skipPaths = [
      '/health',
      '/api/docs',
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/logout',
      '/super-admin',
    ];

    return skipPaths.some((skipPath) => path.startsWith(skipPath));
  }

  private extractTenantId(req: TenantAwareRequest, user: any): string | null {
    // Priority order for tenant ID extraction:
    // 1. URL parameter (:tenantId or :id in tenant routes)
    // 2. Query parameter (?tenantId)
    // 3. Header (x-tenant-id)
    // 4. User's default tenant
    // 5. Body (for POST/PUT requests)

    // 1. URL parameter
    if (req.params.tenantId) {
      return req.params.tenantId;
    }

    // For tenant-specific routes, use the ID parameter as tenant ID
    if (req.path.startsWith('/tenants/') && req.params.id) {
      return req.params.id;
    }

    // 2. Query parameter
    if (req.query.tenantId) {
      return req.query.tenantId as string;
    }

    // 3. Header
    const headerTenantId = req.headers['x-tenant-id'] as string;
    if (headerTenantId) {
      return headerTenantId;
    }

    // 4. User's default tenant (for non-super admins)
    if (user.tenantId && user.role !== UserRole.SUPER_ADMIN) {
      return user.tenantId;
    }

    // 5. Body (for POST/PUT requests)
    if (req.body && req.body.tenantId) {
      return req.body.tenantId;
    }

    return null;
  }

  private async validateTenantAccess(
    userId: string,
    tenantId: string,
    userRole: UserRole,
  ): Promise<boolean> {
    // Super admins can access any tenant
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // For other users, validate through tenant context service
    return await this.tenantContextService.validateTenantAccess(
      userId,
      tenantId,
    );
  }

  private async logSecurityViolation(
    userId: string,
    tenantId: string,
    req: TenantAwareRequest,
  ): Promise<void> {
    await this.loggingService.warning({
      message: 'Tenant access violation detected',
      userId,
      tenantId,
      path: req.path,
      method: req.method,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
