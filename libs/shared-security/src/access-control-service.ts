// Access Control Service moved from human-lift-training-api/src/Services/AccessControl/AccessControlService.ts
import { Results } from '@strengthos/shared-utils';
import { ILogger } from '@strengthos/shared-logging';
import {
  UserRole,
  SecurityEventType,
  RequestContext,
  UserStatus
} from '@strengthos/shared-types';
import { IDb } from '@strengthos/shared-database';

export interface AccessControlConfig {
  enableAuditLogging: boolean;
  cacheRoles: boolean;
  cacheTTL: number;
  strictMode: boolean;
}

export interface PermissionCheck {
  userId: string;
  resource: string;
  action: string;
  context?: RequestContext;
}

export interface RoleAssignment {
  userId: string;
  role: UserRole;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
}

export class AccessControlService {
  private static readonly DEFAULT_CONFIG: AccessControlConfig = {
    enableAuditLogging: true,
    cacheRoles: true,
    cacheTTL: 300000, // 5 minutes
    strictMode: true
  };

  private config: AccessControlConfig;
  private roleCache: Map<string, { roles: UserRole[]; timestamp: number }> = new Map();
  private roleHierarchy: Map<UserRole, UserRole[]> = new Map();

  constructor(
    private db: IDb,
    private logger?: ILogger,
    config?: Partial<AccessControlConfig>
  ) {
    this.config = { ...AccessControlService.DEFAULT_CONFIG, ...config };
    this.initializeRoleHierarchy();
  }

  /**
   * Check if user has a role that allows access to a specific resource and action
   * In this project, access is determined by role only.
   */
  public async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const userRolesResult = await this.getUserRoles(userId);
      if (!userRolesResult.isOk) {
        await this.logSecurityEvent(SecurityEventType.PERMISSION_DENIED, {
          userId,
          resource,
          action,
          reason: 'Failed to retrieve user roles'
        });
        return false;
      }

      const userRole = userRolesResult.returnValue;
      if (!userRole) {
        await this.logSecurityEvent(SecurityEventType.PERMISSION_DENIED, {
          userId,
          resource,
          action,
          reason: 'No role assigned'
        });
        return false;
      }

      // Expand roles to include inherited roles
      const allRoles = this.expandRoles([userRole]);

      // Here, you can implement your own logic to check if the user's role(s) allow the action on the resource.
      // For now, we assume that having any role is sufficient for access.
      // You can customize this logic as needed for your project.

      // Example: Only allow SUPER_ADMIN to access 'admin' resources
      if (resource === 'admin' && !allRoles.includes(UserRole.SUPER_ADMIN)) {
        await this.logSecurityEvent(SecurityEventType.PERMISSION_DENIED, {
          userId,
          resource,
          action,
          reason: 'Insufficient role for admin resource'
        });
        return false;
      }

      // Otherwise, allow access if user has any role
      return true;
    } catch (error) {
      await this.logSecurityEvent(SecurityEventType.PERMISSION_DENIED, {
        userId,
        resource,
        action,
        error: (error as any).message
      });
      return false;
    }
  }

  /**
   * Get the user's role
   */
  public async getUserPermissions(userId: string): Promise<Results<UserRole | null>> {
    // For compatibility with interface, but this project only uses roles.
    return this.getUserRoles(userId);
  }

  /**
   * Assign role to user
   * 
   * NOTE: This implementation does not use the user_role_assignments table.
   * It updates the user's role directly in the users table.
   */
  public async assignRole(userId: string, role: UserRole, assignedBy: string): Promise<void> {
    try {
      // Update the user's role directly in the users table
      await this.db.knex('users')
        .where({ id: userId })
        .update({
          role: role
        });

      // Clear cache
      this.roleCache.delete(userId);

      await this.logSecurityEvent(SecurityEventType.PERMISSION_DENIED, {
        userId,
        role,
        assignedBy
      });
    } catch (error) {
      throw new Error(`Failed to assign role: ${error}`);
    }
  }

  /**
   * Revoke role from user
   * 
   * NOTE: This implementation does not use the user_role_assignments table.
   * It sets the user's role to null in the users table.
   */
  public async revokeRole(userId: string, role: UserRole, revokedBy: string): Promise<void> {
    try {
      // Set the user's role to null only if the current role matches
      await this.db.knex('users')
        .where({ id: userId, role: role })
        .update({
          role: null
        });

      // Clear cache
      this.roleCache.delete(userId);

      await this.logSecurityEvent(SecurityEventType.PERMISSION_DENIED, {
        userId,
        role,
        revokedBy
      });
    } catch (error) {
      throw new Error(`Failed to revoke role: ${error}`);
    }
  }

  /**
   * Validate tenant access for user
   */
  public async validateTenantAccess(userId: string, tenantId: string): Promise<boolean> {
    try {
      const user = await this.db.knex('users')
        .where({ id: userId })
        .first();

      if (!user) {
        await this.logSecurityEvent(SecurityEventType.PERMISSION_DENIED, {
          userId,
          tenantId,
          reason: 'User not found'
        });
        return false;
      }

      // Check if user belongs to the tenant
      if (user.tenant_id !== tenantId) {
        await this.logSecurityEvent(SecurityEventType.PERMISSION_DENIED, {
          userId,
          tenantId,
          userTenantId: user.tenant_id,
          reason: 'Tenant access denied'
        });
        return false;
      }

      return true;
    } catch (error) {
      await this.logSecurityEvent(SecurityEventType.PERMISSION_DENIED, {
        userId,
        tenantId,
        error: (error as any).message
      });
      return false;
    }
  }

  /**
   * Check multiple permissions at once (role-based)
   */
  public async checkMultiplePermissions(checks: PermissionCheck[]): Promise<Results<boolean[]>> {
    try {
      const results = await Promise.all(
        checks.map(check => 
          this.checkPermission(check.userId, check.resource, check.action)
        )
      );
      return Results.ok(results);
    } catch (error) {
      return Results.fail([], `Failed to check multiple permissions: ${error}`);
    }
  }

  // Private helper methods

  private async getUserRoles(userId: string): Promise<Results<UserRole | null>> {
    try {
      // Optionally, implement caching if needed
      // if (this.config.cacheRoles) {
      //   const cached = this.roleCache.get(userId);
      //   if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
      //     return Results.ok(cached.roles[0] ?? null);
      //   }
      // }

      const roleResult = await this.db.knex('users')
        .where({ id: userId })
        .where('status', UserStatus.ACTIVE)
        .select('role');

      if (!roleResult || !roleResult[0] || !roleResult[0].role) {
        return Results.ok(null);
      }

      // Optionally, cache the result
      // if (this.config.cacheRoles) {
      //   this.roleCache.set(userId, { roles: [roleResult[0].role as UserRole], timestamp: Date.now() });
      // }

      return Results.ok(roleResult[0].role as UserRole);
    } catch (error) {
      return Results.fail(null, `Failed to get user roles: ${error}`);
    }
  }

  private expandRoles(roles: UserRole[]): UserRole[] {
    const expandedRoles = new Set<UserRole>(roles);
    for (const role of roles) {
      const inheritedRoles = this.roleHierarchy.get(role) || [];
      inheritedRoles.forEach(inheritedRole => expandedRoles.add(inheritedRole));
    }
    return Array.from(expandedRoles);
  }

  private initializeRoleHierarchy(): void {
    // Define role inheritance (higher roles inherit lower role permissions)
    this.roleHierarchy.set(UserRole.SUPER_ADMIN, [
      UserRole.COACH_ADMIN,
      UserRole.COACH,
      UserRole.ATHLETE,
      UserRole.SELF_COACHED
    ]);
    
    this.roleHierarchy.set(UserRole.COACH_ADMIN, [
      UserRole.COACH,
      UserRole.ATHLETE,
      UserRole.SELF_COACHED,
    ]);
    
    this.roleHierarchy.set(UserRole.COACH, [
      UserRole.SELF_COACHED,
      UserRole.ATHLETE,
    ]);
  }

  private async logSecurityEvent(eventType: SecurityEventType, metadata: any): Promise<void> {
    if (this.config.enableAuditLogging && this.logger) {
      await this.logger.info({
        message: `Access control event: ${eventType}`,
        metadata: {
          eventType,
          ...metadata,
          timestamp: new Date()
        }
      });
    }
  }

  public clearUserCache(userId: string): void {
    this.roleCache.delete(userId);
  }

  public clearAllCache(): void {
    this.roleCache.clear();
  }
}

// Factory function
export function createAccessControlService(
  db: IDb,
  logger?: ILogger,
  config?: Partial<AccessControlConfig>
): AccessControlService {
  return new AccessControlService(db, logger, config);
}