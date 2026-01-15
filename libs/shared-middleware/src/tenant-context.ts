import { Injectable, NestMiddleware, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@strengthos/shared-logging';
import { IDb } from '@strengthos/shared-database';
import { RequestContext, UserRole } from '@strengthos/shared-types';
import { ComplexUser } from '@strengthos/shared-database';

export interface TenantInfo {
  id: string;
  name: string;
  status: string;
  settings: Record<string, any>;
}

export interface TenantContextConfig {
  headerName?: string; // Header name for tenant ID
  queryParam?: string; // Query parameter name for tenant ID
  requireTenant?: boolean; // Whether tenant is required
  validateTenant?: boolean; // Whether to validate tenant exists
  allowedTenants?: string[]; // List of allowed tenant IDs
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private static readonly DEFAULT_CONFIG: TenantContextConfig = {
    headerName: 'X-Tenant-ID',
    queryParam: 'tenantId',
    requireTenant: false,
    validateTenant: true,
  };

  private config: TenantContextConfig;

  constructor(
    private readonly db: IDb,
    private readonly logger: ILogger,
    config?: Partial<TenantContextConfig>,
  ) {
    this.config = { ...TenantContextMiddleware.DEFAULT_CONFIG, ...config };
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = this.extractTenantId(req);
      const user = (req as any).user as RequestContext;

      // If no tenant ID provided
      if (!tenantId) {
        if (this.config.requireTenant) {
          throw new BadRequestException('Tenant ID is required');
        }
        return next();
      }

      // Validate tenant ID format
      if (!this.isValidTenantId(tenantId)) {
        throw new BadRequestException('Invalid tenant ID format');
      }

      // Check if tenant is in allowed list
      if (this.config.allowedTenants && !this.config.allowedTenants.includes(tenantId)) {
        throw new ForbiddenException('Access to this tenant is not allowed');
      }

      // Validate tenant exists and is active
      if (this.config.validateTenant) {
        const tenant = await this.validateTenant(tenantId);
        if (!tenant) {
          throw new BadRequestException('Tenant not found or inactive');
        }

        // Enhanced tenant access validation with complex User interfaces
        if (user && user.tenantId && user.tenantId !== tenantId) {
          // Allow super admins to access any tenant
          const userRole = (req as any).userRole as UserRole;
          if (userRole !== UserRole.SUPER_ADMIN) {
            await this.logger.warn({
              message: 'User attempted to access different tenant',
              metadata: {
                userId: user.userId,
                userTenantId: user.tenantId,
                requestedTenantId: tenantId,
                userRole,
                ip: req.ip,
                path: req.path,
              },
            });
            throw new ForbiddenException('Access to this tenant is forbidden');
          }
        }

        // Validate user belongs to tenant (except for super admins)
        if (user && user.userId) {
          const userRole = (req as any).userRole as UserRole;
          if (userRole !== UserRole.SUPER_ADMIN) {
            const userBelongsToTenant = await this.validateUserTenantAccess(user.userId, tenantId);
            if (!userBelongsToTenant) {
              await this.logger.warn({
                message: 'User does not belong to requested tenant',
                metadata: {
                  userId: user.userId,
                  requestedTenantId: tenantId,
                  userRole,
                  ip: req.ip,
                  path: req.path,
                },
              });
              throw new ForbiddenException('User does not have access to this tenant');
            }
          }
        }

        // Attach tenant info to request
        (req as any).tenant = tenant;
      }

      // Attach tenant ID to request
      (req as any).tenantId = tenantId;

      await this.logger.debug({
        message: 'Tenant context established',
        metadata: {
          tenantId,
          userId: user?.userId,
          path: req.path,
          method: req.method,
        },
      });

      next();
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }

      await this.logger.error({
        message: 'Tenant context middleware error',
        metadata: {
          error: (error as any).message,
          path: req.path,
          method: req.method,
          ip: req.ip,
        },
      });

      throw new BadRequestException('Failed to establish tenant context');
    }
  }

  private extractTenantId(req: Request): string | null {
    // Try header first
    if (this.config.headerName) {
      const headerValue = req.get(this.config.headerName);
      if (headerValue) {
        return headerValue;
      }
    }

    // Try query parameter
    if (this.config.queryParam) {
      const queryValue = req.query[this.config.queryParam] as string;
      if (queryValue) {
        return queryValue;
      }
    }

    // Try from authenticated user context
    const user = (req as any).user as RequestContext;
    if (user?.tenantId) {
      return user.tenantId;
    }

    return null;
  }

  private isValidTenantId(tenantId: string): boolean {
    // Basic validation - adjust as needed
    return /^[a-zA-Z0-9\-_]{1,50}$/.test(tenantId);
  }

  private async validateTenant(tenantId: string): Promise<TenantInfo | null> {
    try {
      const tenant = await this.db.knex('tenants')
        .where({ id: tenantId, status: 'active' })
        .first();

      if (!tenant) {
        return null;
      }

      return {
        id: tenant.id,
        name: tenant.name,
        status: tenant.status,
        settings: tenant.settings || {},
      };
    } catch (error) {
      await this.logger.error({
        message: 'Failed to validate tenant',
        metadata: {
          tenantId,
          error: (error as any).message,
        },
      });
      return null;
    }
  }

  private async validateUserTenantAccess(userId: string, tenantId: string): Promise<boolean> {
    try {
      // Check if user belongs to the tenant using complex User interface
      const user = await this.db.knex('users')
        .where({ id: userId, tenant_id: tenantId })
        .first();

      return !!user;
    } catch (error) {
      await this.logger.error({
        message: 'Failed to validate user tenant access',
        metadata: {
          userId,
          tenantId,
          error: (error as any).message,
        },
      });
      return false;
    }
  }
}

// Factory function for creating tenant context middleware
export function createTenantContextMiddleware(
  db: IDb,
  logger: ILogger,
  config?: Partial<TenantContextConfig>,
): TenantContextMiddleware {
  return new TenantContextMiddleware(db, logger, config);
}

// Predefined configurations
export const RequiredTenantConfig: Partial<TenantContextConfig> = {
  requireTenant: true,
  validateTenant: true,
};

export const OptionalTenantConfig: Partial<TenantContextConfig> = {
  requireTenant: false,
  validateTenant: true,
};

export const StrictTenantConfig: Partial<TenantContextConfig> = {
  requireTenant: true,
  validateTenant: true,
  headerName: 'X-Tenant-ID',
  queryParam: 'tenantId',
};