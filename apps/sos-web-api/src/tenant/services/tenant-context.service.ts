import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TenantRepository } from '../repositories/tenant.repository';
import { UserRole } from '@strengthos/shared-types';
import { TenantContext } from '@strengthos/shared-types/user-management';

@Injectable()
export class TenantContextService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly tenantRepository: TenantRepository,
  ) {}

  /**
   * Set the tenant context for Row-Level Security
   * This should be called at the beginning of each request after authentication
   */
  async setTenantContext(userId: string, tenantId: string): Promise<void> {
    await this.databaseService.knex.raw('SELECT set_tenant_context(?, ?)', [
      userId,
      tenantId,
    ]);
  }

  /**
   * Validate if a user has access to a specific tenant
   */
  async validateTenantAccess(
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    const result = await this.databaseService
      .knex('users')
      .where('id', userId)
      .where('status', '=', 'ACTIVE')
      .first();

    if (!result) {
      return false;
    } else if (
      result.role === UserRole.SUPER_ADMIN ||
      result.role === UserRole.TENANT_ADMIN ||
      result?.tenant_id === tenantId
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Basic tenant access validation (fallback when stored procedures are not available)
   */
  private async basicTenantAccessValidation(
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    // Check if user belongs to the tenant
    const user = await this.databaseService
      .knex('users')
      .where('tenant_id', tenantId)
      .where('id', userId)
      .where('status', '=', 'ACTIVE')
      .first();

    if (user) {
      return true;
    }

    // Check if user is super admin (can access any tenant)
    const superAdminUser = await this.databaseService
      .knex('users')
      .where('id', userId)
      .where('role', UserRole.SUPER_ADMIN)
      .where('status', '=', 'ACTIVE')
      .first();

    return !!superAdminUser;
  }

  /**
   * Get user's tenant context information
   */
  async getUserTenantContext(userId: string): Promise<TenantContext | null> {
    try {
      const result = await this.databaseService.knex.raw(
        'SELECT * FROM get_user_tenant_context(?)',
        [userId],
      );

      const row = result.rows[0];
      if (!row) return null;

      const tenant = await this.tenantRepository.findById(row.tenant_id);
      if (!tenant) return null;

      return {
        tenantId: row.tenant_id,
        userId: userId,
        role: row.user_role,
        permissions: [], // Will be populated by permission service if needed
        settings: tenant.settings,
      };
    } catch (error) {
      // Fallback to basic context retrieval
      Logger.error('Error getting user tenant context:', error);
      return await this.getBasicUserTenantContext(userId);
    }
  }

  /**
   * Basic user tenant context retrieval (fallback)
   */
  private async getBasicUserTenantContext(
    userId: string,
  ): Promise<TenantContext | null> {
    const user = await this.databaseService
      .knex('users')
      .where('id', userId)
      .where('status', '=', 'ACTIVE')
      .first();

    if (!user) return null;

    const tenant = await this.tenantRepository.findById(user.tenant_id);
    if (!tenant) return null;

    return {
      tenantId: tenant.id,
      userId: userId,
      role: user.role,
      permissions: [], // Will be populated by permission service if needed
      settings: tenant.settings,
    };
  }

  /**
   * Clear the tenant context (useful for cleanup)
   */
  async clearTenantContext(): Promise<void> {
    try {
      await this.databaseService.knex.raw(
        "SELECT set_config('app.current_tenant_id', '', true)",
      );
      await this.databaseService.knex.raw(
        "SELECT set_config('app.current_user_id', '', true)",
      );
    } catch (error) {
      Logger.error('Error clearing tenant context:', error);
      // Ignore errors if the configuration variables don't exist
    }
  }

  /**
   * Get current tenant ID from the database context
   */
  async getCurrentTenantId(): Promise<string | null> {
    try {
      const result = await this.databaseService.knex.raw(
        "SELECT current_setting('app.current_tenant_id', true) as tenant_id",
      );
      const tenantId = result.rows[0]?.tenant_id;
      return tenantId && tenantId !== '' ? tenantId : null;
    } catch (error) {
      Logger.error('Error getting current tenant ID:', error);
      return null;
    }
  }

  /**
   * Refresh tenant statistics materialized view
   * Should be called periodically or after significant data changes
   */
  async refreshTenantStats(): Promise<void> {
    try {
      await this.databaseService.knex.raw('SELECT refresh_tenant_stats()');
    } catch (error) {
      // If the function doesn't exist, we can skip this operation
      // In a production environment, you might want to log this
      Logger.error('Error refreshing tenant stats:', error);
    }
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats(tenantId?: string) {
    try {
      let query = this.databaseService.knex('v_tenant_stats');

      if (tenantId) {
        query = query.where('tenant_id', tenantId);
      }

      return await query.select('*');
    } catch (error) {
      // If the view doesn't exist, return empty array
      Logger.error('Error getting tenant stats:', error);
      return [];
    }
  }

  /**
   * Check if a tenant is active and accessible
   */
  async isTenantActive(tenantId: string): Promise<boolean> {
    const tenant = await this.tenantRepository.findById(tenantId);
    return tenant?.status === 'ACTIVE' || tenant?.status === 'TRIAL';
  }

  /**
   * Get all tenants that a user has access to
   */
  async getUserAccessibleTenants(userId: string): Promise<string[]> {
    // Check if user is super admin
    const user = await this.databaseService
      .knex('users')
      .where('id', userId)
      .where('status', '=', 'ACTIVE')
      .first();

    if (!user) return [];

    if (user.role === UserRole.SUPER_ADMIN) {
      // Super admin can access all tenants
      const tenants = await this.databaseService
        .knex('tenants')
        .where('status', '!=', 'CANCELLED')
        .select('id');
      return tenants.map((t) => t.id);
    } else {
      // Regular user can only access their own tenant
      return [user.tenant_id];
    }
  }

  /**
   * Get tenant domain for the current context
   */
  getTenantDomain(): string | null {
    // This would typically be extracted from the request context
    // For now, return null as a placeholder
    return null;
  }

  /**
   * Create request context with user, session, and request information
   */
  createRequestContext(
    userId: string,
    _sessionId: string,
    _requestId: string,
  ): Partial<TenantContext> {
    return {
      userId,
      tenantId: '', // Will be set based on user's tenant
      role: UserRole.ATHLETE, // Default role, will be updated
      permissions: [],
      settings: {} as any, // Will be populated with actual settings
    };
  }
}
