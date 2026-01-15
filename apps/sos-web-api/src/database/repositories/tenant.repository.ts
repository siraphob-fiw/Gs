import { Injectable } from '@nestjs/common';
import { BaseRepository, BaseEntity } from '../base.repository';
import { DatabaseService } from '../database.service';
import { BillingInfo, SubscriptionInfo, TenantSettings } from '@/types';

export interface Tenant extends BaseEntity {
  name: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'TRIAL';
  settings?: TenantSettings;
  subscription_info?: SubscriptionInfo;
  billing_info?: BillingInfo;
  created_at: Date;
  updated_at: Date;
  suspended_at?: Date;
}

@Injectable()
export class TenantRepository extends BaseRepository<Tenant> {
  constructor(databaseService: DatabaseService) {
    super(databaseService, 'tenants');
  }

  async findActiveTenants(options = {}): Promise<Tenant[]> {
    try {
      return await this.findWhere({ status: 'ACTIVE' }, options);
    } catch (error) {
      this.logger.error('Failed to find active tenants:', error);
      throw error;
    }
  }

  async findTrialTenants(): Promise<Tenant[]> {
    try {
      return await this.findWhere({ status: 'TRIAL' });
    } catch (error) {
      this.logger.error('Failed to find trial tenants:', error);
      throw error;
    }
  }

  async findExpiringTrials(days: number = 7): Promise<Tenant[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + days);

      const tenants = await this.knex(this.tableName)
        .where('status', 'TRIAL')
        .andWhere('trial_ends_at', '<=', cutoffDate)
        .andWhere('trial_ends_at', '>=', new Date());

      return tenants;
    } catch (error) {
      this.logger.error(`Failed to find expiring trials:`, error);
      throw error;
    }
  }

  async updateSettings(
    tenantId: string,
    settings: any,
  ): Promise<Tenant | null> {
    try {
      return await this.update(tenantId, { settings });
    } catch (error) {
      this.logger.error(
        `Failed to update settings for tenant ${tenantId}:`,
        error,
      );
      throw error;
    }
  }

  async updateSubscription(
    tenantId: string,
    subscriptionData: Partial<Tenant>,
  ): Promise<Tenant | null> {
    try {
      const updateData: Partial<Tenant> = {};

      if (subscriptionData.subscription_info) {
        updateData.subscription_info = subscriptionData.subscription_info;
      }

      if (subscriptionData.billing_info) {
        updateData.billing_info = subscriptionData.billing_info;
      }

      if (subscriptionData.status) {
        updateData.status = subscriptionData.status;
      }

      return await this.update(tenantId, updateData);
    } catch (error) {
      this.logger.error(
        `Failed to update subscription for tenant ${tenantId}:`,
        error,
      );
      throw error;
    }
  }

  async getTenantStats(): Promise<any> {
    try {
      const stats = await this.knex(this.tableName)
        .select('status')
        .count('* as count')
        .groupBy('status');

      const result = {
        total: 0,
        active: 0,
        trial: 0,
        suspended: 0,
        cancelled: 0,
      };

      stats.forEach((stat: any) => {
        const count = parseInt(stat.count, 10);
        result.total += count;

        switch (stat.status) {
          case 'ACTIVE':
            result.active = count;
            break;
          case 'TRIAL':
            result.trial = count;
            break;
          case 'SUSPENDED':
            result.suspended = count;
            break;
          case 'CANCELLED':
            result.cancelled = count;
            break;
        }
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to get tenant stats:', error);
      throw error;
    }
  }
}
