import { Injectable, Logger, Scope } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { UserRole } from '@strengthos/shared-types';

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private readonly logger = new Logger(TenantContextService.name);
  private currentTenantId: number | null = null;
  private currentUserId: number | null = null;

  constructor(private readonly databaseService: DatabaseService) {}

  async setTenantContext(userId: number, tenantId: number): Promise<void> {
    try {
      this.currentUserId = userId;
      this.currentTenantId = tenantId;

      // Set the tenant context in the database session
      await this.databaseService.knex.raw('SELECT set_config(?, ?, false)', [
        'app.current_tenant_id',
        tenantId.toString(),
      ]);

      await this.databaseService.knex.raw('SELECT set_config(?, ?, false)', [
        'app.current_user_id',
        userId.toString(),
      ]);

      this.logger.debug(
        `Tenant context set: userId=${userId}, tenantId=${tenantId}`,
      );
    } catch (error) {
      this.logger.error('Failed to set tenant context:', error);
      throw error;
    }
  }

  async clearTenantContext(): Promise<void> {
    try {
      this.currentUserId = null;
      this.currentTenantId = null;

      await this.databaseService.knex.raw('SELECT set_config(?, ?, false)', [
        'app.current_tenant_id',
        '',
      ]);

      await this.databaseService.knex.raw('SELECT set_config(?, ?, false)', [
        'app.current_user_id',
        '',
      ]);

      this.logger.debug('Tenant context cleared');
    } catch (error) {
      this.logger.error('Failed to clear tenant context:', error);
      throw error;
    }
  }

  getCurrentTenantId(): number | null {
    return this.currentTenantId;
  }

  getCurrentUserId(): number | null {
    return this.currentUserId;
  }

  async validateTenantAccess(
    userId: number,
    tenantId: number,
  ): Promise<boolean> {
    try {
      // Check if user belongs to the tenant
      const result = await this.databaseService
        .knex('users')
        .where('id', userId)
        .andWhere('tenant_id', tenantId)
        .select('id')
        .first();

      return !!result;
    } catch (error) {
      this.logger.error('Failed to validate tenant access:', error);
      return false;
    }
  }

  async isSuperAdmin(userId: number): Promise<boolean> {
    try {
      // Check if user has super admin role
      const result = await this.databaseService
        .knex('users')
        .where('id', userId)
        .andWhere('role', UserRole.SUPER_ADMIN)
        .select('id')
        .first();

      return !!result;
    } catch (error) {
      this.logger.error('Failed to check super admin status:', error);
      return false;
    }
  }

  async enableSuperAdminMode(userId: number): Promise<void> {
    const isSuperAdmin = await this.isSuperAdmin(userId);

    if (!isSuperAdmin) {
      throw new Error('User is not a super admin');
    }

    try {
      // Set super admin mode in database session
      await this.databaseService.knex.raw('SELECT set_config(?, ?, false)', [
        'app.super_admin_mode',
        'true',
      ]);

      this.logger.debug(`Super admin mode enabled for user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to enable super admin mode:', error);
      throw error;
    }
  }

  async disableSuperAdminMode(): Promise<void> {
    try {
      await this.databaseService.knex.raw('SELECT set_config(?, ?, false)', [
        'app.super_admin_mode',
        'false',
      ]);

      this.logger.debug('Super admin mode disabled');
    } catch (error) {
      this.logger.error('Failed to disable super admin mode:', error);
      throw error;
    }
  }

  async getCurrentTenantFromDb(): Promise<number | null> {
    try {
      const result = await this.databaseService.knex.raw(
        'SELECT current_setting(?, true) as tenant_id',
        ['app.current_tenant_id'],
      );

      const tenantId = result.rows[0]?.tenant_id;
      return tenantId ? parseInt(tenantId, 10) : null;
    } catch (error) {
      this.logger.error('Failed to get current tenant from database:', error);
      return null;
    }
  }

  async getCurrentUserFromDb(): Promise<number | null> {
    try {
      const result = await this.databaseService.knex.raw(
        'SELECT current_setting(?, true) as user_id',
        ['app.current_user_id'],
      );

      const userId = result.rows[0]?.user_id;
      return userId ? parseInt(userId, 10) : null;
    } catch (error) {
      this.logger.error('Failed to get current user from database:', error);
      return null;
    }
  }
}
