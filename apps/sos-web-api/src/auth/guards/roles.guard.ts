import { DatabaseService } from '@/database/database.service';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessControlService } from '@strengthos/shared-security';
import { RequestContext } from '@strengthos/shared-types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject('AccessControlService')
    private readonly accessControlService: AccessControlService,
    private readonly databaseService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestContext;

    if (!user) {
      throw new ForbiddenException('User context not found');
    }

    try {
      // Check if user has any of the required roles
      const hasRole = await this.checkUserRoles(user, requiredRoles);

      if (!hasRole) {
        await this.databaseService.knex('logs').insert({
          log_level: 'WARNING',
          short_message: 'Access denied',
          full_message:
            'Access denied - insufficient roles requiredRoles: ' +
            requiredRoles,
          user_id: user.userId,
          tenant_id: user.tenantId,
          url: request.path,
        });

        throw new ForbiddenException('Insufficient permissions');
      }
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      await this.databaseService.knex('logs').insert({
        log_level: 'ERROR',
        short_message: 'Role guard error',
        url: request.path,
        full_message: (error as any).message,
        user_id: user.userId,
        tenant_id: user.tenantId,
      });

      throw new ForbiddenException('Access control check failed');
    }
  }

  private async checkUserRoles(
    user: RequestContext,
    requiredRoles: string[],
  ): Promise<boolean> {
    try {
      const permissionsResult =
        await this.accessControlService.getUserPermissions(user.userId);

      if (!permissionsResult.isOk || !permissionsResult.returnValue) {
        return false;
      }

      const userRole = permissionsResult.returnValue;

      const hasRequiredRole = requiredRoles.includes(userRole);

      return hasRequiredRole;
    } catch (error) {
      await this.databaseService.knex('logs').insert({
        log_level: 'ERROR',
        short_message: 'Error checking user roles',
        full_message: (error as any).message,
        user_id: user.userId,
        tenant_id: user.tenantId,
      });
      return false;
    }
  }
}
