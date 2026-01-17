import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  TenantRepository,
  TenantFilters,
} from '../repositories/tenant.repository';
import {
  TenantSettings,
  CreateTenantRequest,
  UpdateTenantRequest,
} from '@strengthos/shared-types/user-management';
import { UserService } from '../../user/services/user.service';
import { PublicTenantResponseDto } from '../dto';
import { AuthMethod, UserRole } from '@/user';
import { DatabaseService } from '@/database';
import { AuthService } from '@/auth/auth.service';
import { Subscription, tenantWithSubscription } from '@strengthos/shared-types';

@Injectable()
export class TenantService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly userService: UserService,
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService,
  ) { }

  private async logToDatabase({
    tenantId,
    userId,
    logLv,
    shortMessage,
    fullMessage,
  }: {
    tenantId?: string;
    userId?: string;
    logLv: 'INFO' | 'WARNING' | 'ERROR';
    shortMessage?: string;
    fullMessage?: string;
  }): Promise<void> {
    await this.databaseService.knex('logs').insert({
      tenant_id: tenantId ?? null,
      user_id: userId ?? null,
      log_level: logLv,
      short_message: shortMessage ?? null,
      full_message: fullMessage ?? null,
      created_at: new Date(),
    });
  }

  async createTenant(
    tenantData: CreateTenantRequest & {
      adminFirstName: string;
      adminLastName: string;
    },
  ): Promise<tenantWithSubscription> {
    // Add db transaction for atomicity of tenant and admin user creation
    const trxProvider = this.databaseService.knex.transactionProvider();
    const trx = await trxProvider();

    try {
      // Parallelize name and email uniqueness checks for efficiency
      const [existingTenant, existingUser] = await Promise.all([
        tenantData.name
          ? this.tenantRepository.findByName(tenantData.name)
          : Promise.resolve(null),
        tenantData.adminEmail
          ? trx('users').where('email', tenantData.adminEmail).first()
          : Promise.resolve(null),
      ]);

      if (existingTenant) {
        throw new ConflictException('Tenant name already exists');
      }

      if (existingUser) {
        throw new ConflictException('Admin email already exists');
      }

      // Pass the transaction context into the repository so both tenant and admin user creation are within the same transaction
      const tenant = await this.tenantRepository.create(tenantData);

      if (!tenant) {
        throw new BadRequestException('Failed to create tenant');
      }

      const adminUser = await this.userService.create(
        {
          email: tenantData.adminEmail,
          password: tenantData.adminPassword,
          authMethod: AuthMethod.EMAIL,
          role: UserRole.TENANT_ADMIN,
          profile: {
            firstName: tenantData.adminFirstName,
            lastName: tenantData.adminLastName,
          },
          tenantId: tenant.id,
        },
        trx,
      );

      if (!adminUser) {
        throw new BadRequestException('Failed to create admin user');
      }

      await trx.commit();

      // Fire off these two actions in parallel, don't need to wait for logging
      await Promise.all([
        this.authService.sendEmailVerification(adminUser.id),
        this.logToDatabase({
          tenantId: tenant.id,
          userId: adminUser.id,
          logLv: 'INFO',
          shortMessage: 'Created Tenant successful',
          fullMessage: JSON.stringify({
            tenant: tenant.name,
            adminUser: adminUser.email,
          }),
        }),
      ]);

      return tenant;
    } catch (error) {
      try {
        await trx.rollback();
      } catch (rollbackError) {
        // Log rollback error but don't mask the original error
        Logger.error('Transaction rollback failed:', rollbackError);
      }
      await this.logToDatabase({
        logLv: 'ERROR',
        shortMessage: `Create tenant error tenant name : ${tenantData.name}`,
        fullMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async updateTenant(
    tenantId: string,
    updates: UpdateTenantRequest,
  ): Promise<tenantWithSubscription> {
    try {
      const tenant = await this.tenantRepository.update(tenantId, updates);

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      await this.logToDatabase({
        logLv: 'INFO',
        shortMessage: 'Tenant updated successfully',
        tenantId: tenantId,
        fullMessage: JSON.stringify(updates),
      });

      return tenant;
    } catch (error) {
      await this.logToDatabase({
        logLv: 'ERROR',
        shortMessage: 'Update tenant error',
        fullMessage: error instanceof Error ? error.message : String(error),
        tenantId,
      });
      throw error;
    }
  }

  async getTenant(tenantId: string): Promise<tenantWithSubscription> {
    let tenant = await this.tenantRepository.findById(tenantId);
    let subscription: Subscription | null = await this.databaseService
      .knex('subscriptions')
      .where('tenant_id', tenantId)
      .first();

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const res = {
      ...tenant,
      subscription_info_details: subscription
        ? {
          planId: subscription.plan_id,
          status: subscription.status,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          auto_renew: subscription.auto_renew,
        }
        : null,
    };

    return res;
  }

  async deleteTenant(tenantId: string): Promise<void> {
    try {
      const tenant = await this.tenantRepository.findById(tenantId);

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      const success = await this.tenantRepository.delete(tenantId);

      if (!success) {
        throw new BadRequestException('Failed to delete tenant');
      }

      await this.logToDatabase({
        logLv: 'INFO',
        shortMessage: `Tenant deleted successfully Tenant Name: ${tenant.name}`,
        tenantId: tenantId,
      });
    } catch (error) {
      await this.logToDatabase({
        logLv: 'ERROR',
        shortMessage: 'Delete tenant error',
        fullMessage: error instanceof Error ? error.message : String(error),
        tenantId: tenantId,
      });
      throw error;
    }
  }

  async getAllTenants(
    filters?: TenantFilters,
  ): Promise<tenantWithSubscription[]> {
    try {
      return await this.tenantRepository.findAll(filters);
    } catch (error) {
      await this.logToDatabase({
        logLv: 'ERROR',
        shortMessage: 'Get all tenants error',
        fullMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async updateTenantSettings(
    tenantId: string,
    settings: TenantSettings,
  ): Promise<TenantSettings> {
    try {
      const tenant = await this.tenantRepository.findById(tenantId);

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      const updatepayload = {
        id: tenant.id,
        name: tenant.name,
        description: tenant.description,
        settings: {
          ...tenant.settings,
          ...settings,
        },
        subscription_info: tenant.subscription_info,
        billing_info: tenant.billing_info,
        contact: tenant.contact,
      };

      const updatedTenant = await this.tenantRepository.update(
        tenantId,
        updatepayload,
      );

      if (!updatedTenant) {
        throw new BadRequestException('Failed to update tenant settings');
      }

      await this.logToDatabase({
        logLv: 'INFO',
        shortMessage: 'Tenant settings updated',
        tenantId: tenantId,
        fullMessage: JSON.stringify(settings),
      });

      return updatedTenant.settings;
    } catch (error) {
      await this.logToDatabase({
        logLv: 'ERROR',
        shortMessage: 'Update tenant settings error',
        fullMessage: error instanceof Error ? error.message : String(error),
        tenantId,
      });
      throw error;
    }
  }

  async getTenantSettings(tenantId: string): Promise<TenantSettings> {
    const tenant = await this.getTenant(tenantId);
    return tenant.settings;
  }

  async suspendTenant(tenantId: string, suspendedBy: string): Promise<void> {
    try {
      const tenant = await this.tenantRepository.findById(tenantId);

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      const success = await this.tenantRepository.suspend(tenantId);

      if (!success) {
        throw new BadRequestException('Failed to suspend tenant');
      }

      await this.logToDatabase({
        logLv: 'INFO',
        shortMessage: 'Tenant suspended',
        tenantId,
        fullMessage: JSON.stringify({ suspendedBy }),
      });
    } catch (error) {
      await this.logToDatabase({
        logLv: 'ERROR',
        shortMessage: 'Suspend tenant error',
        fullMessage: error instanceof Error ? error.message : String(error),
        tenantId,
      });
      throw error;
    }
  }

  async reactivateTenant(
    tenantId: string,
    reactivatedBy: string,
  ): Promise<void> {
    try {
      const tenant = await this.tenantRepository.findById(tenantId);

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      const success = await this.tenantRepository.reactivate(tenantId);

      if (!success) {
        throw new BadRequestException('Failed to reactivate tenant');
      }

      await this.logToDatabase({
        logLv: 'INFO',
        shortMessage: 'Tenant reactivated',
        tenantId,
        fullMessage: JSON.stringify({ reactivatedBy }),
      });
    } catch (error) {
      await this.logToDatabase({
        logLv: 'ERROR',
        shortMessage: 'Reactivate tenant error',
        fullMessage: error instanceof Error ? error.message : String(error),
        tenantId,
      });
      throw error;
    }
  }

  // Alias methods for compatibility with tests
  async findById(tenantId: string): Promise<tenantWithSubscription> {
    return this.getTenant(tenantId);
  }

  async findMany(filters?: TenantFilters): Promise<tenantWithSubscription[]> {
    return this.getAllTenants(filters);
  }

  async getUtil(
    tenantId: string,
    userId: string,
  ): Promise<{
    defaultLanguage: string;
    availableLanguages: string[];
  }> {
    let defaultLanguage = 'en';
    const user = await this.userService.findById(userId);
    const tenant = await this.getTenant(tenantId);
    if (user && user.preferences && user.preferences.language) {
      defaultLanguage = user.preferences.language;
    } else {
      defaultLanguage = tenant.settings.defaultLanguage;
    }

    return {
      defaultLanguage: defaultLanguage,
      availableLanguages: tenant.settings.availableLanguages,
    };
  }

  async getLeaderboard(tenantId: string): Promise<{
    leaderboard: {
      userId: string;
      name: string;
      status: string;
      lastActivity: string;
      max1RM: number;
    }[];
  }> {
    return await this.tenantRepository.getLeaderboard(tenantId);
  }

  /**
   * Get all tenants that allow public join (for users without a tenant)
   */
  async getPublicTenants(): Promise<PublicTenantResponseDto[]> {
    try {
      return await this.tenantRepository.findPublicTenants();
    } catch (error) {
      await this.logToDatabase({
        logLv: 'ERROR',
        shortMessage: 'Get public tenants error',
        fullMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
