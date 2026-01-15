import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContextService } from '../services/tenant-context.service';
import { UserRole, RequestContext } from '@strengthos/shared-types';
import { TenantAwareRequest } from '../middleware/tenant-context.middleware';

export const REQUIRE_TENANT_ACCESS = 'requireTenantAccess';
export const TENANT_ROLES = 'tenantRoles';

// Decorator to require tenant access
export const RequireTenantAccess = Reflector.createDecorator<boolean>();

// Decorator to specify required tenant roles
export const TenantRoles = (...roles: UserRole[]) =>
  Reflector.createDecorator<UserRole[]>()(roles);

@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantAwareRequest>();
    const user = request.user as RequestContext;

    if (!user) {
      return false;
    }

    // Check if tenant access is required for this route
    const requireTenantAccess = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_TENANT_ACCESS,
      [context.getHandler(), context.getClass()],
    );

    if (!requireTenantAccess) {
      return true; // No tenant access required
    }

    // Get tenant ID from request context
    const tenantId = request.tenantId || this.extractTenantIdFromRoute(request);

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required for this operation');
    }

    // Super admins can access any tenant (check via tenant context if available)
    if (request.tenantContext?.isSuperAdmin) {
      return true;
    }

    // Validate tenant access
    const hasAccess = await this.tenantContextService.validateTenantAccess(
      user.userId!,
      tenantId,
    );
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to tenant');
    }

    // Check tenant-specific role requirements
    const requiredTenantRoles = this.reflector.getAllAndOverride<UserRole[]>(
      TENANT_ROLES,
      [context.getHandler(), context.getClass()],
    );

    if (requiredTenantRoles && requiredTenantRoles.length > 0) {
      const userTenantContext =
        await this.tenantContextService.getUserTenantContext(user.userId!);

      if (
        !userTenantContext ||
        !requiredTenantRoles.includes(userTenantContext.role)
      ) {
        throw new ForbiddenException('Insufficient tenant permissions');
      }
    }

    return true;
  }

  private extractTenantIdFromRoute(request: TenantAwareRequest): string | null {
    // Extract tenant ID from route parameters
    if (request.params.tenantId) {
      return request.params.tenantId;
    }

    // For tenant-specific routes, use the ID parameter as tenant ID
    if (request.path.startsWith('/tenants/') && request.params.id) {
      return request.params.id;
    }

    return null;
  }
}
