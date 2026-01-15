import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { UserRole, SecurityEventType } from '@strengthos/shared-types';
import { AdminRepository } from '../repositories/admin.repository';
import { AdminActionEntity } from '../entities/system-config.entity';
import { AdminActionDto } from '../dto/admin-request.dto';
import { UserService } from '../../user/services/user.service';
import { TenantService } from '../../tenant/services/tenant.service';
import { SecurityMonitoringService } from '@strengthos/shared-security';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly userService: UserService,
    private readonly tenantService: TenantService,
    @Inject('SecurityMonitoringService')
    private readonly securityMonitoring: SecurityMonitoringService,
  ) {}

  async validateSuperAdmin(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has super admin role
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
    if (!isSuperAdmin) {
      throw new ForbiddenException('Super admin access required');
    }
  }

  async logAdminAction(
    adminUserId: string,
    actionDto: AdminActionDto,
  ): Promise<AdminActionEntity> {
    // Validate admin permissions
    await this.validateSuperAdmin(adminUserId);

    // Create admin action record
    const adminAction = await this.adminRepository.createAdminAction(
      adminUserId,
      actionDto,
    );

    // Log to audit system
    await this.securityMonitoring.logSecurityEvent({
      userId: adminUserId,
      eventType: SecurityEventType.DATA_MODIFICATION,
      severity: 'high',
      tenantId: 'system',
      metadata: actionDto,
    });

    return adminAction;
  }

  async getAdminActions(
    adminUserId: string,
    filters?: {
      adminUserId?: string;
      action?: string;
      targetType?: string;
      startDate?: Date;
      endDate?: Date;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{ actions: AdminActionEntity[]; total: number }> {
    // Validate admin permissions
    await this.validateSuperAdmin(adminUserId);

    return this.adminRepository.getAdminActions(filters, pagination);
  }

  async getAdminActionById(
    adminUserId: string,
    actionId: string,
  ): Promise<AdminActionEntity> {
    // Validate admin permissions
    await this.validateSuperAdmin(adminUserId);

    const action = await this.adminRepository.getAdminActionById(actionId);
    if (!action) {
      throw new NotFoundException('Admin action not found');
    }

    return action;
  }

  async performUserAction(
    adminUserId: string,
    targetUserId: string,
    eventType: 'activate' | 'deactivate' | 'reset_password' | 'delete',
    _metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    // Validate admin permissions
    await this.validateSuperAdmin(adminUserId);

    // Perform the action
    switch (eventType) {
      case 'activate':
        await this.userService.updateStatus(targetUserId, 'active' as any);
        break;
      case 'deactivate':
        await this.userService.updateStatus(targetUserId, 'inactive' as any);
        break;
      case 'reset_password':
        await this.userService.changePassword(
          targetUserId,
          'temp-password-123',
        );
        break;
      case 'delete':
        await this.userService.delete(targetUserId);
        break;
      default:
        throw new Error(`Unknown eventType: ${eventType}`);
    }

    // Log the admin action
    await this.logAdminAction(adminUserId, {
      action: `user_${eventType}`,
      targetType: 'user',
      targetId: targetUserId,
      details: { action: eventType },
    });
  }

  async performTenantAction(
    adminUserId: string,
    targetTenantId: string,
    eventType: 'activate' | 'deactivate' | 'suspend' | 'delete',
  ): Promise<void> {
    // Validate admin permissions
    await this.validateSuperAdmin(adminUserId);

    // Perform the action
    switch (eventType) {
      case 'activate':
        await this.tenantService.reactivateTenant(
          targetTenantId,
          'Admin activation',
        );
        break;
      case 'deactivate':
        await this.tenantService.reactivateTenant(
          targetTenantId,
          'Admin deactivation',
        );
        break;
      case 'suspend':
        await this.tenantService.suspendTenant(targetTenantId, 'admin');
        break;
      case 'delete':
        await this.tenantService.deleteTenant(targetTenantId);
        break;
      default:
        throw new Error(`Unknown eventType: ${eventType}`);
    }

    // Log the admin action
    await this.logAdminAction(adminUserId, {
      action: `tenant_${eventType}`,
      targetType: 'tenant',
      targetId: targetTenantId,
      details: { action: eventType },
    });
  }

  async getSystemOverview(adminUserId: string): Promise<{
    recentActions: AdminActionEntity[];
    systemHealth: string;
    criticalAlerts: any[];
  }> {
    // Validate admin permissions
    await this.validateSuperAdmin(adminUserId);

    // Get recent admin actions
    const { actions: recentActions } =
      await this.adminRepository.getAdminActions({}, { page: 1, limit: 10 });

    // This would typically integrate with monitoring services
    const systemHealth = 'healthy';
    const criticalAlerts: any[] = [];

    return {
      recentActions,
      systemHealth,
      criticalAlerts,
    };
  }
}
