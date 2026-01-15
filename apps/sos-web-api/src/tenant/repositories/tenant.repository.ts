import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TenantStatus, SubscriptionStatus, tenantWithSubscription } from '@strengthos/shared-types';
import {
  Tenant,
  TenantSettings,
  CreateTenantRequest,
  UpdateTenantRequest,
} from '@strengthos/shared-types/user-management';
import { v4 as uuidv4 } from 'uuid';
import { PublicTenantResponseDto } from '../dto';

export interface TenantFilters {
  status?: TenantStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class TenantRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(tenantData: CreateTenantRequest): Promise<tenantWithSubscription> {
    const tenantId = uuidv4();
    let subscription_info;
    if(tenantData.plan === 'trial') {
      subscription_info = await this.databaseService.knex('subscriptions').insert({
        id: uuidv4(),
        tenant_id: tenantId,
        plan_id: 'trial',
        status: SubscriptionStatus.TRIAL,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        auto_renew: false,
      }).returning('id').first();
    } else {
      const plan = await this.databaseService.knex('subscription_plans').where('id', tenantData.plan).first();
      subscription_info = await this.databaseService.knex('subscriptions').insert({
        id: uuidv4(),
        tenant_id: tenantId,
        plan_id: tenantData.plan,
        status: SubscriptionStatus.ACTIVE,
        start_date: new Date(),
        end_date: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
        auto_renew: true,
      }).returning('id').first();
    }

    const defaultSettings: TenantSettings = {
      allowSelfCoached: true,
      requireCoachApproval: false,
      enableVideoAnalysis: true,
      defaultLanguage: 'en',
      availableLanguages: ['en'],
      maxCoaches: 10,
      maxAthletes: 100,
      logo: '',
      complianceSettings: {
        gdprEnabled: true,
        pdpaEnabled: false,
        hipaaEnabled: false,
      },
    };

    const tenantRow: Tenant = {
      id: tenantId,
      name: tenantData.name,
      description: null,
      status: TenantStatus.TRIAL,
      settings: defaultSettings,
      subscription_info: subscription_info,
      billing_info: {
        amount: 0,
        currency: 'USD',
        billingCycle: 'MONTHLY',
        ...tenantData.billingInfo,
      },
      contact: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const query = this.databaseService.knex('tenants');
    await query.insert(tenantRow);
    return await this.mapRowToTenant(tenantRow as Tenant);
  }

  async findById(id: string): Promise<tenantWithSubscription | null> {
    const tenantRow = await this.databaseService
      .knex('tenants')
      .where('id', id)
      .first();

    return tenantRow ? await this.mapRowToTenant(tenantRow) : null;
  }

  async findByName(name: string): Promise<tenantWithSubscription | null> {
    const query = this.databaseService.knex('tenants');
    const tenantRow = await query.where('name', name).first();

    return tenantRow ? await this.mapRowToTenant(tenantRow) : null;
  }

  async findAll(filters?: TenantFilters): Promise<tenantWithSubscription[]> {
    let query = this.databaseService
      .knex('tenants')
      .select('*')
      .orderBy('created_at', 'desc');

    if (filters) {
      if (filters.status) {
        query = query.where('status', filters.status);
      }
      if (filters.createdAfter) {
        query = query.where('created_at', '>=', filters.createdAfter);
      }
      if (filters.createdBefore) {
        query = query.where('created_at', '<=', filters.createdBefore);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.offset(filters.offset);
      }
    }

    const tenantRows = await query;
    return Promise.all(tenantRows.map((row) => this.mapRowToTenant(row)));
  }

  async update(
    id: string,
    updates: UpdateTenantRequest,
  ): Promise<tenantWithSubscription | null> {
    const tenantData = await this.findById(id);

    if (!tenantData) {
      return null;
    }

    const updateData = {
      ...tenantData,
      description: updates.description ?? tenantData.description,
      contact: updates.contact ?? tenantData.contact ?? {},
      updated_at: new Date(),
    };
   
    const rowsAffected = await this.databaseService
      .knex('tenants')
      .where('id', id)
      .update(updateData);

    if (rowsAffected === 0) {
      return null;
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const trx = await this.databaseService.knex.transaction();

    try {
      // Soft delete by updating status
      const rowsAffected = await trx('tenants').where('id', id).update({
        status: TenantStatus.CANCELLED,
        updated_at: new Date(),
        suspended_at: new Date(),
      });

      if (rowsAffected === 0) {
        await trx.rollback();
        return false;
      }

      // Deactivate all users in the tenant
      await trx('users').where('tenant_id', id).update({
        status: 'DEACTIVATED',
        updated_at: new Date(),
      });

      // Revoke all active sessions for tenant users
      await trx('user_sessions').where('is_revoked', false).update({
        is_revoked: true,
        revoked_at: new Date(),
        revoked_reason: 'tenant_deleted',
      });

      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async suspend(id: string): Promise<boolean> {
    const trx = await this.databaseService.knex.transaction();

    try {
      // Update tenant status
      const rowsAffected = await trx('tenants').where('id', id).update({
        status: TenantStatus.SUSPENDED,
        suspended_at: new Date(),
        updated_at: new Date(),
      });

      if (rowsAffected === 0) {
        await trx.rollback();
        return false;
      }

      // Revoke all active sessions for tenant users
      await trx('user_sessions').where('is_revoked', false).update({
        is_revoked: true,
        revoked_at: new Date(),
        revoked_reason: 'tenant_suspended',
      });

      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async reactivate(id: string): Promise<boolean> {
    const rowsAffected = await this.databaseService
      .knex('tenants')
      .where('id', id)
      .update({
        status: TenantStatus.ACTIVE,
        suspended_at: null,
        updated_at: new Date(),
      });

    return rowsAffected > 0;
  }

  private async mapRowToTenant(row: Tenant): Promise<tenantWithSubscription> {
    const subscription_info_details = await this.databaseService.knex('subscriptions').where('id', row.subscription_info).first();
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      settings: row.settings,
      subscription_info: row.subscription_info,
      subscription_info_details: subscription_info_details ?? null,
      billing_info: row.billing_info,
      contact: row.contact,
      created_at: row.created_at,
      updated_at: row.updated_at,
      suspended_at: row.suspended_at,
    };
  }

  /**
   * Find all tenants that allow public join (for users without a tenant)
   */
  async findPublicTenants(): Promise<PublicTenantResponseDto[]> {
    const tenantRows = await this.databaseService
      .knex('tenants')
      .leftJoin('users', 'users.tenant_id', 'tenants.id')
      .where('tenants.status', TenantStatus.ACTIVE)
      .where('tenants.is_free', false)
      .groupBy('tenants.id')
      .select(
        'tenants.*',
        this.databaseService.knex.raw(
          "COUNT(CASE WHEN users.role = 'ATHLETE' THEN users.id END) as total_athletes",
        ),
        this.databaseService.knex.raw(
          "COUNT(CASE WHEN users.role = 'COACH' THEN users.id END) as total_coaches",
        ),
      )
      .orderBy('tenants.name', 'asc');

    const parseRows = tenantRows.map((row) => {
      return {
        ...row,
        total_athletes: parseInt(row.total_athletes as string, 10),
        total_coaches: parseInt(row.total_coaches as string, 10),
      };
    });

    return parseRows;
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
    const result = await this.databaseService.knex.raw(
      `
      SELECT 
        u.id as "userId",
        u.first_name,
        u.last_name,
        u.status,
        u.updated_at as "lastActivity",
        COALESCE(MAX(
          CASE 
            WHEN (set_elem->>'weight')::numeric > 0 
              AND (set_elem->>'reps')::numeric > 0
            THEN 
              CASE
                WHEN (set_elem->>'rpe')::numeric BETWEEN 1 AND 10
                THEN 
                  -- RPE-based 1RM calculation: weight / (1 / (1 + (reps + (10 - rpe)) / 30))
                  (set_elem->>'weight')::numeric / (1.0 / (1.0 + ((set_elem->>'reps')::numeric + (10.0 - (set_elem->>'rpe')::numeric)) / 30.0))
                ELSE
                  -- Simple Epley formula: weight * (1 + reps / 30)
                  (set_elem->>'weight')::numeric * (1.0 + (set_elem->>'reps')::numeric / 30.0)
              END
            ELSE 0
          END
        ), 0)::float as "max1RM"
      FROM users u
      LEFT JOIN training_sessions ts ON ts.athlete_id = u.id AND ts.tenant_id = u.tenant_id
      LEFT JOIN training_sessions_exercises tse ON tse.training_session_id = ts.id
      LEFT JOIN LATERAL jsonb_array_elements(COALESCE(tse.actual, '[]'::jsonb)) AS set_elem ON true
      WHERE u.tenant_id = ?
        AND u.role = 'ATHLETE'
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY "max1RM" DESC
      `,
      [tenantId],
    );

    const leaderboard = result.rows || result;

    return {
      leaderboard: leaderboard.map((row: any) => ({
        userId: row.userId,
        name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
        status: row.status,
        lastActivity: row.lastActivity,
        max1RM: parseFloat(row.max1RM) || 0,
      })),
    };
  }
}
