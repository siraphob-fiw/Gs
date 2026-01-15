import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { UserService } from '../../user/services/user.service';
import { TenantContextService } from './tenant-context.service';
import { Gender, UserRole, UserStatus } from '@strengthos/shared-types';
import { DatabaseUser } from '@strengthos/shared-database';
import { DatabaseService } from '../../database/database.service';
import { UserResponseDto } from '@/user/dto/user-response.dto';

export interface TenantUserFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TenantUserStats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<UserRole, number>;
  usersByStatus: Record<UserStatus, number>;
  recentRegistrations: number;
}

@Injectable()
export class TenantUserManagementService {
  constructor(
    private readonly userService: UserService,
    private readonly tenantContextService: TenantContextService,
    private readonly databaseService: DatabaseService,
  ) {}

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

  /**
   * Get all users for a specific tenant with complex User interface support
   */
  async getTenantUsers(
    tenantId: string,
    filters: TenantUserFilters = {},
    requestingUserId: string,
  ): Promise<{
    users: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const ur = await this.userService.findById(requestingUserId);
      if (ur.role !== UserRole.SUPER_ADMIN) {
        await this.validateTenantAccess(requestingUserId, tenantId);
      }

      const { page = 1, limit = 20, role, status, search } = filters;
      const offset = (page - 1) * limit;

      const applyFilters = (queryBuilder: any) => {
        if (role) queryBuilder.where('users.role', role);
        if (status) queryBuilder.where('users.status', status);
        if (search) {
          queryBuilder.where(function () {
            this.whereILike('users.email', `%${search}%`)
              .orWhereILike('users.first_name', `%${search}%`)
              .orWhereILike('users.last_name', `%${search}%`)
              .orWhereILike('users.phone', `%${search}%`);
          });
        }
      };

      // Base query for users with joined coach info
      const baseUsersQuery = this.databaseService
        .knex('users')
        .where('users.tenant_id', tenantId)
        .whereNot('users.role', UserRole.SUPER_ADMIN);

      applyFilters(baseUsersQuery);

      let query = baseUsersQuery
        .clone()
        .leftJoin(
          'coach_athlete_relationships as car',
          'users.id',
          'car.athlete_id',
        )
        .leftJoin('users as coaches', 'car.coach_id', 'coaches.id')
        .select(
          'users.*',
          'car.coach_id as coach_id',
          'coaches.first_name as coach_first_name',
          'coaches.last_name as coach_last_name',
        );

      // Count query (no joins, only filters)
      const countQuery = baseUsersQuery.clone();

      applyFilters(countQuery);

      const [{ count }] =
        await countQuery.count<{ count: string }[]>('* as count');
      const total = Number(count) || 0;

      // Get paginated results
      const dbUsers = await query
        .orderBy('users.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      // Map to complex User interfaces
      const users = await Promise.all(
        dbUsers.map((dbUser) => this.mapDatabaseUserToResponse(dbUser)),
      );

      return {
        users,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logToDatabase({
        logLv: 'ERROR',
        shortMessage: 'Failed to get tenant users',
        fullMessage: JSON.stringify({
          tenantId,
          requestingUserId,
          error: (error as any).message,
        }),
      });
      throw error;
    }
  }

  async getTenantUserStats(
    requestingUserId: string,
    tenantId?: string,
  ): Promise<TenantUserStats> {
    try {
      const ur = await this.userService.findById(requestingUserId);
      if (ur.role !== UserRole.SUPER_ADMIN) {
        await this.validateTenantAccess(requestingUserId, tenantId);
      }

      let baseQuery;

      baseQuery = this.databaseService
        .knex('users')
        .whereNot('role', UserRole.SUPER_ADMIN);

      if (ur.role !== UserRole.SUPER_ADMIN) {
        baseQuery.where('tenant_id', tenantId);
      }

      const [totalResult] = await baseQuery.clone().count('* as count');
      const totalUsers = parseInt(totalResult.count as string, 10);

      const [activeResult] = await baseQuery
        .clone()
        .where('status', UserStatus.ACTIVE)
        .count('* as count');
      const activeUsers = parseInt(activeResult.count as string, 10);

      const roleStats = await baseQuery
        .clone()
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

      // Get users by status
      const statusStats = await baseQuery
        .clone()
        .select('status')
        .count('* as count')
        .groupBy('status');

      const usersByStatus = Object.values(UserStatus).reduce(
        (acc, status) => {
          acc[status] = 0;
          return acc;
        },
        {} as Record<UserStatus, number>,
      );

      statusStats.forEach(({ status, count }) => {
        usersByStatus[status as UserStatus] = parseInt(count as string, 10);
      });

      // Get recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [recentResult] = await baseQuery
        .clone()
        .where('created_at', '>=', thirtyDaysAgo)
        .count('* as count');
      const recentRegistrations = parseInt(recentResult.count as string, 10);

      const stats: TenantUserStats = {
        totalUsers,
        activeUsers,
        usersByRole,
        usersByStatus,
        recentRegistrations,
      };

      await this.logToDatabase({
        logLv: 'INFO',
        shortMessage: 'Retrieved tenant user stats',
        fullMessage: JSON.stringify({
          tenantId: tenantId,
          userId: requestingUserId,
          stats,
        }),
      });

      return stats;
    } catch (error) {
      this.logToDatabase({
        tenantId: tenantId,
        userId: requestingUserId,
        logLv: 'ERROR',
        shortMessage: 'Failed to get tenant user stats',
        fullMessage: JSON.stringify({
          error: (error as any).message,
        }),
      });
      throw error;
    }
  }
  /**
   * Get coaching relationships within tenant
   */
  async getTenantCoachingRelationships(
    tenantId: string,
    requestingUserId: string,
  ): Promise<
    Array<{
      coach: UserResponseDto;
      athletes: UserResponseDto[];
      relationshipCount: number;
    }>
  > {
    try {
      // Validate tenant access
      await this.validateTenantAccess(requestingUserId, tenantId);

      // Get all coaches in the tenant
      const coaches = await this.databaseService
        .knex('users')
        .where('tenant_id', tenantId)
        .whereIn('role', [UserRole.COACH, UserRole.COACH_ADMIN])
        .where('status', UserStatus.ACTIVE);

      const coachingRelationships = [];

      for (const coachData of coaches) {
        const coach = await this.mapDatabaseUserToResponse(coachData);

        // Get athletes for this coach
        const athleteData = await this.databaseService
          .knex('coach_athlete_relationships as car')
          .join('users as u', 'car.athlete_id', 'u.id')
          .where('car.coach_id', coach.id)
          .where('car.status', 'ACTIVE')
          .where('u.tenant_id', tenantId)
          .select('u.*');

        const athletes = athleteData.map((dbUser) =>
          this.mapDatabaseUserToResponse(dbUser),
        );

        coachingRelationships.push({
          coach,
          athletes,
          relationshipCount: athletes.length,
        });
      }

      await this.logToDatabase({
        tenantId: tenantId,
        userId: requestingUserId,
        logLv: 'INFO',
        shortMessage: 'Retrieved tenant coaching relationships',
        fullMessage: JSON.stringify({
          relations: coachingRelationships.length,
        }),
      });

      return coachingRelationships;
    } catch (error) {
      await this.logToDatabase({
        tenantId: tenantId,
        userId: requestingUserId,
        logLv: 'ERROR',
        shortMessage: 'Failed to get tenant coaching relationships',
        fullMessage: JSON.stringify({
          error: (error as any).message,
        }),
      });
      throw error;
    }
  }

  private async validateTenantAccess(
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const hasAccess = await this.tenantContextService.validateTenantAccess(
      userId,
      tenantId,
    );
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to tenant');
    }
  }

  private async mapDatabaseUserToResponse(
    dbUser: DatabaseUser,
  ): Promise<UserResponseDto> {
    return {
      id: dbUser.id,
      tenantId: dbUser.tenant_id,
      email: dbUser.email,
      phone: dbUser.phone,
      coachId: dbUser.coach_id,
      coachName:
        dbUser.coach_first_name && dbUser.coach_last_name
          ? `${dbUser.coach_first_name} ${dbUser.coach_last_name}`.trim()
          : dbUser.coach_first_name || dbUser.coach_last_name || null,
      role: dbUser.role as UserRole,
      status: dbUser.status as UserStatus,
      phoneVerified: dbUser.phone_verified,
      phoneVerifiedAt: dbUser.phone_verified_at,
      profile: {
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        dateOfBirth: dbUser.date_of_birth,
        gender: dbUser.gender as Gender,
        bodyWeight: dbUser.body_weight,
        height: dbUser.height,
      },
      preferences: dbUser.preferences,
      auth_providers: dbUser.auth_providers,
      whatsappData: dbUser.whatsapp_data,
      lineData: dbUser.line_data,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at,
      last_login_at: dbUser.last_login_at,
      email_verified_at: dbUser.email_verified_at,
    };
  }
}
