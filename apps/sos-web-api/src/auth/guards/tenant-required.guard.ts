import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestContext, UserRole } from '@strengthos/shared-types';
import { REQUIRES_TENANT_KEY } from '../decorators/requires-tenant.decorator';
import { UserService } from '../../user/services/user.service';

/**
 * Guard that checks if the user has a tenant_id assigned.
 * Used with @RequiresTenant() decorator on endpoints that require tenant context.
 *
 * Returns false (403 Forbidden) if user has no tenant.
 * SUPER_ADMIN users are exempt from this check as they can operate across tenants.
 */
@Injectable()
export class TenantRequiredGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if endpoint requires tenant
    const requiresTenant = this.reflector.getAllAndOverride<boolean>(
      REQUIRES_TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If endpoint doesn't require tenant, allow access
    if (!requiresTenant) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestContext;

    if (!user) {
      throw new ForbiddenException('Unauthorized');
    }

    // Always fetch fresh user data for up-to-date role/tenant info
    const userData = await this.userService.findById(user.userId);
    if (!userData) {
      throw new ForbiddenException('User not found');
    }

    let tenantId: string | null = null;

    tenantId =
      request.params?.tenantId ||
      request.headers?.['x-tenant-id'] ||
      request.headers?.['X-Tenant-Id'] || // Also check for capitalized header (case-insensitive header keys in some environments)
      request.query?.tenantId ||
      request.body?.tenantId ||
      null;

    if (userData.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // For non-super admins, use user's assigned tenant if not otherwise specified
    if (!tenantId) {
      tenantId =
        userData.tenantId || user?.tenantId || request.tenantId || null;
    }

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required for this operation');
    }

    return true;
  }
}
