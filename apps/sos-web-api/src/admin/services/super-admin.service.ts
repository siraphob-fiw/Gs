import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { UserService } from '../../user/services/user.service';
import { TenantService } from '../../tenant/services/tenant.service';
import { AdminService } from './admin.service';
import { ILogger } from '@strengthos/shared-logging';
import { UserRole, UserStatus, TenantStatus } from '@strengthos/shared-types';
import { DatabaseService } from '../../database/database.service';
import { UserResponseDto } from '../../user/dto';
import dayjs from 'dayjs';

export interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<UserRole, number>;
  tenantsByStatus: Record<TenantStatus, number>;
  recentGrowth: {
    newTenants: number;
    newUsers: number;
    period: string;
  };
}

export interface TenantHealthMetrics {
  tenantId: string;
  tenantName: string;
  status: TenantStatus;
  userCount: number;
  activeUsers: number;
  lastActivity: Date;
  subscription_info: string;
  subscription_info_details: Record<string, any> | null;
  healthScore: number;
  issues: string[];
}

export interface SystemHealthCheck {
  overall: 'healthy' | 'warning' | 'critical';
  database: 'healthy' | 'warning' | 'critical';
  cache: 'healthy' | 'warning' | 'critical';
  external: 'healthy' | 'warning' | 'critical';
  performance: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
  };
  alerts: Array<{
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: Date;
  }>;
}

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly userService: UserService,
    private readonly tenantService: TenantService,
    private readonly adminService: AdminService,
    private readonly databaseService: DatabaseService,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {}

  /**
   * Get platform-wide statistics
   */
  async getPlatformStats(superAdminId: string): Promise<PlatformStats> {
    try {
      // Validate super admin access
      await this.validateSuperAdminAccess(superAdminId);

      // Get tenant statistics
      const [totalTenantsResult] = await this.databaseService
        .knex('tenants')
        .count('* as count');
      const totalTenants = parseInt(totalTenantsResult.count as string, 10);

      const [activeTenantsResult] = await this.databaseService
        .knex('tenants')
        .where('status', TenantStatus.ACTIVE)
        .count('* as count');
      const activeTenants = parseInt(activeTenantsResult.count as string, 10);

      // Get user statistics
      const [totalUsersResult] = await this.databaseService
        .knex('users')
        .count('* as count');
      const totalUsers = parseInt(totalUsersResult.count as string, 10);

      const [activeUsersResult] = await this.databaseService
        .knex('users')
        .where('status', UserStatus.ACTIVE)
        .count('* as count');
      const activeUsers = parseInt(activeUsersResult.count as string, 10);

      // Get users by role
      const roleStats = await this.databaseService
        .knex('users')
        .select('role')
        .count('* as count')
        .groupBy('role');

      const usersByRole = Object.values(UserRole).reduce(
        (acc, role) => {
          acc[role] = 0;
          return acc;
        },
        {} as Record<UserRole, number>,
      );

      roleStats.forEach(({ role, count }) => {
        usersByRole[role as UserRole] = parseInt(count as string, 10);
      });

      // Get tenants by status
      const tenantStatusStats = await this.databaseService
        .knex('tenants')
        .select('status')
        .count('* as count')
        .groupBy('status');

      const tenantsByStatus = Object.values(TenantStatus).reduce(
        (acc, status) => {
          acc[status] = 0;
          return acc;
        },
        {} as Record<TenantStatus, number>,
      );

      tenantStatusStats.forEach(({ status, count }) => {
        tenantsByStatus[status as TenantStatus] = parseInt(count as string, 10);
      });

      // Get recent growth (last 30)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [newTenantsResult] = await this.databaseService
        .knex('tenants')
        .where('created_at', '>=', thirtyDaysAgo)
        .count('* as count');
      const newTenants = parseInt(newTenantsResult.count as string, 10);

      const [newUsersResult] = await this.databaseService
        .knex('users')
        .where('created_at', '>=', thirtyDaysAgo)
        .count('* as count');
      const newUsers = parseInt(newUsersResult.count as string, 10);

      const stats: PlatformStats = {
        totalTenants,
        activeTenants,
        totalUsers,
        activeUsers,
        usersByRole,
        tenantsByStatus,
        recentGrowth: {
          newTenants,
          newUsers,
          period: '30',
        },
      };

      await this.logger.info({
        message: 'Retrieved platform stats',
        metadata: {
          superAdminId,
          stats,
        },
      });

      return stats;
    } catch (error) {
      await this.logger.error({
        message: 'Failed to get platform stats',
        fullMessage: JSON.stringify({
          superAdminId,
          error: (error as any).message,
        }),
      });
      throw error;
    }
  }

  /**
   * Get tenant health metrics
   */
  async getTenantHealthMetrics(
    superAdminId: string,
  ): Promise<TenantHealthMetrics[]> {
    try {
      // Validate super admin access
      await this.validateSuperAdminAccess(superAdminId);

      const tenants = await this.databaseService
        .knex('tenants')
        .orderBy('tenants.created_at', 'desc');

      // If tenant.subscription_info is null, ensure sub fields are null
      for (const tenant of tenants) {
        if (tenant.subscription_info) {
          tenant.subscription_info_details = await this.databaseService
            .knex('subscriptions')
            .innerJoin(
              'subscription_plans as sp',
              'subscriptions.plan_id',
              'sp.id',
            )
            .select(
              'subscriptions.id as subscription_id',
              'subscriptions.status as subscription_status',
              'subscriptions.start_date as subscription_start_date',
              'subscriptions.end_date as subscription_end_date',
              'subscriptions.auto_renew as subscription_auto_renew',
              'sp.name as plan_name',
              'sp.description as plan_description',
              'sp.price as plan_price',
              'sp.currency as plan_currency',
              'sp.billing_cycle as plan_billing_cycle',
            )
            .where('subscriptions.id', tenant.subscription_info)
            .first();
        }
      }

      const healthMetrics: TenantHealthMetrics[] = [];

      for (const tenant of tenants) {
        // Get user count for tenant
        const [userCountResult] = await this.databaseService
          .knex('users')
          .where('tenant_id', tenant.id)
          .count('* as count');
        const userCount = parseInt(userCountResult.count as string, 10);

        // Get active user count
        const [activeUserCountResult] = await this.databaseService
          .knex('users')
          .where('tenant_id', tenant.id)
          .where('status', UserStatus.ACTIVE)
          .count('* as count');
        const activeUsers = parseInt(activeUserCountResult.count as string, 10);

        // Get last activity
        const lastActivityResult = await this.databaseService
          .knex('users')
          .where('tenant_id', tenant.id)
          .orderBy('last_login_at', 'desc')
          .select('last_login_at')
          .first();

        const lastActivity =
          lastActivityResult?.last_login_at || tenant.created_at;

        // Calculate health score and identify issues
        const { healthScore, issues } = this.calculateTenantHealth(
          tenant,
          userCount,
          activeUsers,
          lastActivity,
        );

        healthMetrics.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          status: tenant.status,
          userCount,
          activeUsers,
          lastActivity,
          subscription_info: tenant.subscription_info,
          subscription_info_details: tenant.subscription_info_details
            ? tenant.subscription_info_details
            : null,
          healthScore,
          issues,
        });
      }

      await this.logger.info({
        message: 'Retrieved tenant health metrics',
        metadata: {
          superAdminId,
          tenantCount: healthMetrics.length,
        },
      });

      return healthMetrics;
    } catch (error) {
      await this.logger.error({
        message: 'Failed to get tenant health metrics',
        fullMessage: JSON.stringify({
          superAdminId,
          error: (error as any).message,
        }),
      });
      throw error;
    }
  }

  /**
   * Get system health check
   */
  async getSystemHealthCheck(superAdminId: string): Promise<SystemHealthCheck> {
    try {
      // Validate super admin access
      await this.validateSuperAdminAccess(superAdminId);

      // Check database health
      const databaseHealth = await this.checkDatabaseHealth();

      // Check cache health (in-memory)
      const cacheHealth = await this.checkCacheHealth();

      // Check external services health
      const externalHealth = await this.checkExternalServicesHealth();

      // Get performance metrics
      const performance = await this.getPerformanceMetrics();

      // Get system alerts
      const alerts = await this.getSystemAlerts();

      // Determine overall health
      const healthStatuses = [databaseHealth, cacheHealth, externalHealth];
      let overall: 'healthy' | 'warning' | 'critical' = 'healthy';

      if (healthStatuses.includes('critical')) {
        overall = 'critical';
      } else if (healthStatuses.includes('warning')) {
        overall = 'warning';
      }

      const healthCheck: SystemHealthCheck = {
        overall,
        database: databaseHealth,
        cache: cacheHealth,
        external: externalHealth,
        performance,
        alerts,
      };

      await this.logger.info({
        message: 'Retrieved system health check',
        fullMessage: JSON.stringify({
          superAdminId,
          healthCheck,
        }),
      });

      return healthCheck;
    } catch (error) {
      await this.logger.error({
        message: 'Failed to get system health check',
        fullMessage: JSON.stringify({
          superAdminId,
          error: (error as any).message,
        }),
      });
      throw error;
    }
  }

  /**
   * Perform bulk tenant operation
   */
  async performBulkTenantOperation(
    superAdminId: string,
    tenantId: string,
    operation: 'activate' | 'suspend' | 'deactivate',
  ): Promise<{
    success: string[];
    failed: Array<{ tenantId: string; error: string }>;
  }> {
    try {
      // Validate super admin access
      await this.validateSuperAdminAccess(superAdminId);

      const success: string[] = [];
      const failed: Array<{ tenantId: string; error: string }> = [];

      try {
        switch (operation) {
          case 'activate':
            await this.tenantService.reactivateTenant(tenantId, superAdminId);
            break;
          case 'suspend':
            await this.tenantService.suspendTenant(tenantId, superAdminId);
            break;
          case 'deactivate':
            await this.tenantService.deleteTenant(tenantId);
            break;
        }
        success.push(tenantId);
      } catch (error) {
        failed.push({
          tenantId,
          error: (error as any).message,
        });
      }

      await this.logger.info({
        message: 'Performed bulk tenant operation',
        fullMessage: JSON.stringify({
          superAdminId,
          operation,
          tenantId,
          successCount: success.length,
          failedCount: failed.length,
        }),
      });

      return { success, failed };
    } catch (error) {
      await this.logger.error({
        message: 'Failed to perform bulk tenant operation',
        fullMessage: JSON.stringify({
          superAdminId,
          operation,
          tenantId,
          error: (error as any).message,
        }),
      });
      throw error;
    }
  }

  /**
   * Get platform usage analytics
   */
  async getPlatformUsageAnalytics(
    superAdminId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    userRegistrations: Array<{ date: string; count: number }>;
    tenantCreations: Array<{ date: string; count: number }>;
    activeUsers: Array<{ date: string; count: number }>;
    sessionActivity: Array<{ date: string; sessions: number }>;
  }> {
    try {
      // Validate super admin access
      await this.validateSuperAdminAccess(superAdminId);

      // Get user registrations by day
      const userRegistrations = await this.databaseService
        .knex('users')
        .select(this.databaseService.knex.raw('DATE(created_at) as date'))
        .count('* as count')
        .where('created_at', '>=', startDate)
        .where('created_at', '<=', endDate)
        .groupBy(this.databaseService.knex.raw('DATE(created_at)'))
        .orderBy('date');

      // Get tenant creations by day
      const tenantCreations = await this.databaseService
        .knex('tenants')
        .select(this.databaseService.knex.raw('DATE(created_at) as date'))
        .count('* as count')
        .where('created_at', '>=', startDate)
        .where('created_at', '<=', endDate)
        .groupBy(this.databaseService.knex.raw('DATE(created_at)'))
        .orderBy('date');

      // Get active users by day (users who logged in)
      const activeUsers = await this.databaseService
        .knex('users')
        .select(this.databaseService.knex.raw('DATE(last_login_at) as date'))
        .count('* as count')
        .where('last_login_at', '>=', startDate)
        .where('last_login_at', '<=', endDate)
        .whereNotNull('last_login_at')
        .groupBy(this.databaseService.knex.raw('DATE(last_login_at)'))
        .orderBy('date');

      // Get session activity (if we have a sessions table)
      const sessionActivity = await this.databaseService
        .knex('user_sessions')
        .select(this.databaseService.knex.raw('DATE(created_at) as date'))
        .count('* as sessions')
        .where('created_at', '>=', startDate)
        .where('created_at', '<=', endDate)
        .groupBy(this.databaseService.knex.raw('DATE(created_at)'))
        .orderBy('date')
        .catch(() => []); // Handle case where sessions table doesn't exist

      const analytics = {
        userRegistrations: userRegistrations.map((row) => ({
          date: row.date,
          count: parseInt(row.count as string, 10),
        })),
        tenantCreations: tenantCreations.map((row) => ({
          date: row.date,
          count: parseInt(row.count as string, 10),
        })),
        activeUsers: activeUsers.map((row) => ({
          date: row.date,
          count: parseInt(row.count as string, 10),
        })),
        sessionActivity: sessionActivity.map((row) => ({
          date: row.date,
          sessions: parseInt(row.sessions as string, 10),
        })),
      };

      await this.logger.info({
        message: 'Retrieved platform usage analytics',
        fullMessage: JSON.stringify({
          superAdminId,
          startDate,
          endDate,
          analytics,
        }),
      });

      return analytics;
    } catch (error) {
      await this.logger.error({
        message: 'Failed to get platform usage analytics',
        fullMessage: JSON.stringify({
          superAdminId,
          startDate,
          endDate,
          error: (error as any).message,
        }),
      });
      throw error;
    }
  }

  private async validateSuperAdminAccess(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin access required');
    }
  }

  private calculateTenantHealth(
    tenant: any,
    userCount: number,
    activeUsers: number,
    lastActivity: Date,
  ): { healthScore: number; issues: string[] } {
    // Use dayjs for date calculation
    // Make sure to have: import dayjs from 'dayjs'; at top of file
    let healthScore = 100;
    const issues: string[] = [];

    // Check user activity using dayjs
    const daysSinceLastActivity = dayjs(lastActivity).diff(dayjs(), 'day');

    if (daysSinceLastActivity > 30) {
      healthScore -= 30;
      issues.push('No user activity in over 30 days');
    } else if (daysSinceLastActivity > 7) {
      healthScore -= 15;
      issues.push('No user activity in over 7 days');
    }

    // Check user engagement
    const engagementRate = userCount > 0 ? (activeUsers / userCount) * 100 : 0;
    if (engagementRate < 50) {
      healthScore -= 20;
      issues.push('Low user engagement rate');
    }

    // Check tenant status
    if (tenant.status === TenantStatus.SUSPENDED) {
      healthScore -= 40;
      issues.push('Tenant is suspended');
    } else if (tenant.status === TenantStatus.CANCELLED) {
      healthScore -= 30;
      issues.push('Tenant is cancelled');
    }

    // Check subscription status
    if (tenant.subscription?.status === 'past_due') {
      healthScore -= 25;
      issues.push('Subscription payment is past due');
    } else if (tenant.subscription?.status === 'canceled') {
      healthScore -= 35;
      issues.push('Subscription is canceled');
    }

    return { healthScore: Math.max(0, healthScore), issues };
  }

  private async checkDatabaseHealth(): Promise<
    'healthy' | 'warning' | 'critical'
  > {
    try {
      // Simple database connectivity check
      await this.databaseService.knex.raw('SELECT 1');
      return 'healthy';
    } catch (error) {
      Logger.log('Database health check failed', error);
      return 'critical';
    }
  }

  private async checkCacheHealth(): Promise<
    'healthy' | 'warning' | 'critical'
  > {
    // In-memory cache is always available
    return 'healthy';
  }

  private async checkExternalServicesHealth(): Promise<
    'healthy' | 'warning' | 'critical'
  > {
    // This would check external services like payment providers, email services, etc.
    // For now, assume healthy
    return 'healthy';
  }

  private async getPerformanceMetrics(): Promise<{
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
  }> {
    // This would integrate with monitoring services
    // For now, return mock data
    return {
      avgResponseTime: 150, // ms
      errorRate: 0.5, // %
      throughput: 1000, // requests per minute
    };
  }

  private async getSystemAlerts(): Promise<
    Array<{
      type: 'info' | 'warning' | 'error';
      message: string;
      timestamp: Date;
    }>
  > {
    const alerts = [];

    // Check for high error rates
    const errorRate = 0.5; // This would come from monitoring
    if (errorRate > 5) {
      alerts.push({
        type: 'error' as const,
        message: `High error rate detected: ${errorRate}%`,
        timestamp: new Date(),
      });
    }

    // Check for suspended tenants
    const [suspendedTenantsResult] = await this.databaseService
      .knex('tenants')
      .where('status', TenantStatus.SUSPENDED)
      .count('* as count');
    const suspendedTenants = parseInt(
      suspendedTenantsResult.count as string,
      10,
    );

    if (suspendedTenants > 0) {
      alerts.push({
        type: 'warning' as const,
        message: `${suspendedTenants} tenants are currently suspended`,
        timestamp: new Date(),
      });
    }

    return alerts;
  }

  /**
   * Assign a user to a different tenant
   */
  async assignTenantToUser(
    userId: string,
    tenantId: string,
    superAdminId: string,
  ): Promise<UserResponseDto> {
    try {
      // Validate super admin access
      await this.validateSuperAdminAccess(superAdminId);

      const result = await this.userService.assignTenant(
        userId,
        tenantId,
        superAdminId,
      );

      await this.logger.info({
        message: 'Assigned user to tenant',
        metadata: {
          userId,
          tenantId,
          superAdminId,
        },
      });

      return result;
    } catch (error) {
      await this.logger.error({
        message: 'Failed to assign user to tenant',
        fullMessage: JSON.stringify({
          userId,
          tenantId,
          superAdminId,
          error: (error as any).message,
        }),
      });
      throw error;
    }
  }

  /**
   * Bulk assign users to a tenant
   */
  async bulkAssignTenantToUsers(
    userIds: string[],
    tenantId: string,
    superAdminId: string,
  ): Promise<UserResponseDto[]> {
    try {
      // Validate super admin access
      await this.validateSuperAdminAccess(superAdminId);

      const result = await this.userService.bulkAssignTenant(
        userIds,
        tenantId,
        superAdminId,
      );

      await this.logger.info({
        message: 'Bulk assigned users to tenant',
        metadata: {
          userCount: userIds.length,
          tenantId,
          superAdminId,
        },
      });

      return result;
    } catch (error) {
      await this.logger.error({
        message: 'Failed to bulk assign users to tenant',
        fullMessage: JSON.stringify({
          userCount: userIds.length,
          tenantId,
          superAdminId,
          error: (error as any).message,
        }),
      });
      throw error;
    }
  }
}
