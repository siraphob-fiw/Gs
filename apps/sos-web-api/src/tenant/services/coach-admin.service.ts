import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { UserService } from '../../user/services/user.service';
import { TenantService } from './tenant.service';
import { TenantContextService } from './tenant-context.service';
import { TenantUserManagementService } from './tenant-user-management.service';
import { ILogger } from '@strengthos/shared-logging';
import {
  RelationshipStatus,
  UserRole,
  UserStatus,
} from '@strengthos/shared-types';
import { DatabaseService } from '../../database/database.service';

export interface CoachTeamStats {
  totalCoaches: number;
  activeCoaches: number;
  totalAthletes: number;
  activeAthletes: number;
  coachingRelationships: number;
  averageAthletesPerCoach: number;
}

export interface CoachPerformanceMetrics {
  coachId: string;
  coachName: string;
  athleteCount: number;
  activeAthletes: number;
  completedSessions: number;
  averageRPE: number;
  retentionRate: number;
  lastActivity: Date;
}

export interface TeamManagementFilters {
  role?: UserRole;
  status?: UserStatus;
  coachId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class CoachAdminService {
  constructor(
    private readonly userService: UserService,
    private readonly tenantService: TenantService,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantUserManagementService: TenantUserManagementService,
    private readonly databaseService: DatabaseService,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {}

  /**
   * Get team overview for coach admin
   */
  async getTeamOverview(
    tenantId: string,
    coachAdminId: string,
  ): Promise<{
    stats: CoachTeamStats;
    recentActivity: any[];
    alerts: any[];
  }> {
    try {
      // Validate coach admin access
      await this.validateCoachAdminAccess(coachAdminId, tenantId);

      const stats = await this.getTeamStats(tenantId);
      const recentActivity = await this.getRecentTeamActivity(tenantId);
      const alerts = await this.getTeamAlerts(tenantId);

      await this.logger.info({
        message: 'Retrieved team overview',
        metadata: {
          tenantId,
          coachAdminId,
          stats,
        },
      });

      return { stats, recentActivity, alerts };
    } catch (error) {
      await this.logger.error({
        message: 'Failed to get team overview',
        metadata: {
          tenantId,
          coachAdminId,
          error: (error as any).message,
        },
      });
      throw error;
    }
  }

  /**
   * Get team statistics
   */
  async getTeamStats(tenantId: string): Promise<CoachTeamStats> {
    const baseQuery = this.databaseService
      .knex('users')
      .where('tenant_id', tenantId);

    // Get coach counts
    const [totalCoachesResult] = await baseQuery
      .clone()
      .whereIn('role', [
        UserRole.COACH,
        UserRole.COACH_ADMIN,
        UserRole.SUPER_ADMIN,
      ])
      .count('* as count');
    const totalCoaches = parseInt(totalCoachesResult.count as string, 10);

    const [activeCoachesResult] = await baseQuery
      .clone()
      .whereIn('role', [
        UserRole.COACH,
        UserRole.COACH_ADMIN,
        UserRole.SUPER_ADMIN,
      ])
      .where('status', UserStatus.ACTIVE)
      .count('* as count');
    const activeCoaches = parseInt(activeCoachesResult.count as string, 10);

    // Get athlete counts
    const [totalAthletesResult] = await baseQuery
      .clone()
      .whereIn('role', [UserRole.ATHLETE, UserRole.SELF_COACHED])
      .count('* as count');
    const totalAthletes = parseInt(totalAthletesResult.count as string, 10);

    const [activeAthletesResult] = await baseQuery
      .clone()
      .whereIn('role', [UserRole.ATHLETE, UserRole.SELF_COACHED])
      .where('status', UserStatus.ACTIVE)
      .count('* as count');
    const activeAthletes = parseInt(activeAthletesResult.count as string, 10);

    // Get coaching relationships count
    const [relationshipsResult] = await this.databaseService
      .knex('coach_athlete_relationships as car')
      .join('users as coach', 'car.coach_id', 'coach.id')
      .join('users as athlete', 'car.athlete_id', 'athlete.id')
      .where('coach.tenant_id', tenantId)
      .where('athlete.tenant_id', tenantId)
      .where('car.status', UserStatus.ACTIVE)
      .count('* as count');
    const coachingRelationships = parseInt(
      relationshipsResult.count as string,
      10,
    );

    // Fix: Use string value for ACTIVE status in join queries
    // (This is not directly in this function, but for reference, if you do a join with .on('car.status', '=', UserStatus.ACTIVE),
    // you should use .on('car.status', '=', this.databaseService.knex.raw('?', [UserStatus.ACTIVE])) or just the string 'ACTIVE'.
    // In this function, we only use .where('car.status', UserStatus.ACTIVE), which is correct.)

    const averageAthletesPerCoach =
      activeCoaches > 0 ? coachingRelationships / activeCoaches : 0;

    return {
      totalCoaches,
      activeCoaches,
      totalAthletes,
      activeAthletes,
      coachingRelationships,
      averageAthletesPerCoach: Math.round(averageAthletesPerCoach * 100) / 100,
    };
  }

  /**
   * Get coach performance metrics
   */
  async getCoachPerformanceMetrics(
    tenantId: string,
    coachAdminId: string,
  ): Promise<CoachPerformanceMetrics[]> {
    try {
      // Validate coach admin access
      await this.validateCoachAdminAccess(coachAdminId, tenantId);

      const coaches = await this.databaseService
        .knex('users')
        .where('tenant_id', tenantId)
        .whereIn('role', [UserRole.COACH, UserRole.COACH_ADMIN])
        .where('status', UserStatus.ACTIVE);

      const coachIds = coaches.map((c) => c.id);
      if (coachIds.length === 0) {
        return [];
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime());
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const ninetyDaysAgo = new Date(now.getTime());
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Get athlete count per coach
      const athleteCounts = await this.databaseService
        .knex('coach_athlete_relationships as car')
        .join('users as athlete', 'car.athlete_id', 'athlete.id')
        .where('athlete.tenant_id', tenantId)
        .whereIn('car.coach_id', coachIds)
        .count('car.athlete_id as count')
        .select('car.coach_id')
        .groupBy('car.coach_id');

      // Get active athlete count per coach
      const activeAthleteCounts = await this.databaseService
        .knex('coach_athlete_relationships as car')
        .join('users as athlete', 'car.athlete_id', 'athlete.id')
        .where('athlete.tenant_id', tenantId)
        .whereIn('car.coach_id', coachIds)
        .where('car.status', UserStatus.ACTIVE)
        .where('athlete.status', UserStatus.ACTIVE)
        .count('car.athlete_id as count')
        .select('car.coach_id')
        .groupBy('car.coach_id');

      // Get completed sessions (last 30 days) per coach
      const completedSessionsCounts = await this.databaseService
        .knex('training_sessions as ts')
        .join(
          'coach_athlete_relationships as car',
          'ts.athlete_id',
          'car.athlete_id',
        )
        .join('users as athlete', 'car.athlete_id', 'athlete.id')
        .whereIn('car.coach_id', coachIds)
        .where('athlete.tenant_id', tenantId)
        .where('ts.session_status', 'COMPLETED')
        .where('ts.updated_at', '>=', thirtyDaysAgo)
        .count('ts.id as count')
        .select('car.coach_id')
        .groupBy('car.coach_id');

      // Get all RPE values (last 30 days) per coach
      const rpeRows = await this.databaseService
        .knex('training_sessions_exercises as tse')
        .join('training_sessions as ts', 'tse.training_session_id', 'ts.id')
        .join(
          'coach_athlete_relationships as car',
          'ts.athlete_id',
          'car.athlete_id',
        )
        .whereIn('car.coach_id', coachIds)
        .where('ts.tenant_id', tenantId)
        .where('ts.session_status', 'COMPLETED')
        .where('ts.updated_at', '>=', thirtyDaysAgo)
        .whereNotNull('tse.actual')
        .select('car.coach_id', 'tse.actual');

      const rpePerCoach: Record<string, number[]> = {};
      for (const row of rpeRows) {
        let rpe = undefined;
        try {
          const actual =
            typeof row.actual === 'string'
              ? JSON.parse(row.actual)
              : row.actual;
          rpe = actual?.rpe;
        } catch (e) {
          Logger.error(e);
        }
        if (typeof rpe === 'number' && !isNaN(rpe)) {
          if (!rpePerCoach[row.coach_id]) rpePerCoach[row.coach_id] = [];
          rpePerCoach[row.coach_id].push(rpe);
        }
      }

      const retainedAthleteCounts = await this.databaseService
        .knex('coach_athlete_relationships as car')
        .join('users as athlete', 'car.athlete_id', 'athlete.id')
        .where('athlete.tenant_id', tenantId)
        .whereIn('car.coach_id', coachIds)
        .where('car.created_at', '<=', ninetyDaysAgo)
        .where('car.status', UserStatus.ACTIVE)
        .where('athlete.status', UserStatus.ACTIVE)
        .count('car.athlete_id as count')
        .select('car.coach_id')
        .groupBy('car.coach_id');

      const totalOldAthleteCounts = await this.databaseService
        .knex('coach_athlete_relationships as car')
        .join('users as athlete', 'car.athlete_id', 'athlete.id')
        .where('athlete.tenant_id', tenantId)
        .whereIn('car.coach_id', coachIds)
        .where('car.created_at', '<=', ninetyDaysAgo)
        .count('car.athlete_id as count')
        .select('car.coach_id')
        .groupBy('car.coach_id');

      const lastActivities = await this.databaseService
        .knex('users')
        .whereIn('id', coachIds)
        .select('id', 'last_login_at', 'created_at');

      const getCount =
        (countsArr: Array<{ coach_id: string; count: string | number }>) =>
        (id: string): number => {
          const found = countsArr.find((x) => x.coach_id === id);
          return found ? parseInt(found.count as string, 10) : 0;
        };

      const getLastActivity = (id: string, fallbackCreatedAt: Date) => {
        const result = lastActivities.find((x) => x.id === id);
        return result?.last_login_at || fallbackCreatedAt;
      };

      const getAthleteCount = getCount(athleteCounts as any);
      const getActiveAthleteCount = getCount(activeAthleteCounts as any);
      const getCompletedSessions = getCount(completedSessionsCounts as any);
      const getRetainedAthletes = getCount(retainedAthleteCounts as any);
      const getTotalOldAthletes = getCount(totalOldAthleteCounts as any);

      const metrics: CoachPerformanceMetrics[] = coaches.map((coach) => {
        const athleteCount = getAthleteCount(coach.id);
        const activeAthletes = getActiveAthleteCount(coach.id);
        const completedSessions = getCompletedSessions(coach.id);

        const rpes = rpePerCoach[coach.id] || [];
        const averageRPE =
          rpes.length > 0
            ? Math.round(
                (rpes.reduce((acc, r) => acc + r, 0) / rpes.length) * 10,
              ) / 10
            : null;

        const retainedAthletes = getRetainedAthletes(coach.id);
        const totalOldAthletes = getTotalOldAthletes(coach.id);
        const retentionRate =
          totalOldAthletes > 0
            ? Math.round((retainedAthletes / totalOldAthletes) * 1000) / 10
            : 100;

        return {
          coachId: coach.id,
          coachName:
            `${coach.first_name ?? ''} ${coach.last_name ?? ''}`.trim(),
          athleteCount,
          activeAthletes,
          completedSessions,
          averageRPE,
          retentionRate,
          lastActivity: getLastActivity(coach.id, coach.created_at),
        };
      });

      await this.logger.info({
        message: 'Retrieved coach performance metrics',
        metadata: {
          tenantId,
          coachAdminId,
          coachCount: metrics.length,
        },
      });

      return metrics;
    } catch (error) {
      await this.logger.error({
        message: 'Failed to get coach performance metrics',
        metadata: {
          tenantId,
          coachAdminId,
          error: (error as any).message,
        },
      });
      throw error;
    }
  }

  /**
   * Assign coach to athlete
   */
  async assignCoachToAthlete(
    tenantId: string,
    coachId: string,
    athleteId: string,
    coachAdminId: string,
  ): Promise<void> {
    try {
      // Validate coach admin access
      await this.validateCoachAdminAccess(coachAdminId, tenantId);

      // Validate coach and athlete belong to tenant
      const coach = await this.userService.findById(coachId);
      const athlete = await this.userService.findById(athleteId);

      if (
        !coach ||
        coach.tenantId !== tenantId ||
        !coach.role.includes('COACH')
      ) {
        throw new NotFoundException('Coach not found in this tenant');
      }

      if (
        !athlete ||
        athlete.tenantId !== tenantId ||
        ![UserRole.ATHLETE, UserRole.SELF_COACHED].includes(athlete.role)
      ) {
        throw new NotFoundException('Athlete not found in this tenant');
      }

      // Check if relationship already exists
      const existingRelationship = await this.databaseService
        .knex('coach_athlete_relationships')
        .where('coach_id', coachId)
        .where('athlete_id', athleteId)
        .where('status', 'ACTIVE')
        .first();

      if (existingRelationship) {
        throw new BadRequestException(
          'Coach-athlete relationship already exists',
        );
      }

      // Create the relationship
      await this.databaseService.knex('coach_athlete_relationships').insert({
        id: this.generateId(),
        coach_id: coachId,
        athlete_id: athleteId,
        status: 'ACTIVE',
        assigned_by: coachAdminId,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Update athlete role if they were self-coached
      // if (athlete.role === UserRole.SELF_COACHED) {
      //   await this.userService.assignRole(athleteId, UserRole.ATHLETE);
      // }

      await this.logger.info({
        message: 'Coach assigned to athlete',
        metadata: {
          tenantId,
          coachId,
          athleteId,
          coachAdminId,
        },
      });
    } catch (error) {
      await this.logger.error({
        message: 'Failed to assign coach to athlete',
        metadata: {
          tenantId,
          coachId,
          athleteId,
          coachAdminId,
          error: (error as any).message,
        },
      });
      throw error;
    }
  }

  /**
   * Remove coach from athlete
   */
  async removeCoachFromAthlete(
    tenantId: string,
    coachId: string,
    athleteId: string,
    coachAdminId: string,
  ): Promise<void> {
    try {
      // Validate coach admin access
      await this.validateCoachAdminAccess(coachAdminId, tenantId);

      // Find and deactivate the relationship
      const relationship = await this.databaseService
        .knex('coach_athlete_relationships')
        .where('coach_id', coachId)
        .where('athlete_id', athleteId)
        .where('status', 'ACTIVE')
        .first();

      if (!relationship) {
        throw new NotFoundException('Coach-athlete relationship not found');
      }

      await this.databaseService
        .knex('coach_athlete_relationships')
        .where('id', relationship.id)
        .update({
          status: RelationshipStatus.TERMINATED,
          removed_by: coachAdminId,
          removed_at: new Date(),
          updated_at: new Date(),
        });

      // Update athlete to self-coached if they have no other active coaches
      // const [otherCoachesResult] = await this.databaseService
      //   .knex('coach_athlete_relationships')
      //   .where('athlete_id', athleteId)
      //   .where('status', UserStatus.ACTIVE)
      //   .count('* as count');
      // const otherCoaches = parseInt(otherCoachesResult.count as string, 10);

      await this.logger.info({
        message: 'Coach removed from athlete',
        metadata: {
          tenantId,
          coachId,
          athleteId,
          coachAdminId,
        },
      });
    } catch (error) {
      await this.logger.error({
        message: 'Failed to remove coach from athlete',
        metadata: {
          tenantId,
          coachId,
          athleteId,
          coachAdminId,
          error: (error as any).message,
        },
      });
      throw error;
    }
  }

  private async validateCoachAdminAccess(
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.tenantId !== tenantId) {
      throw new ForbiddenException('User does not belong to this tenant');
    }

    if (![UserRole.COACH_ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
      throw new ForbiddenException('Coach admin access required');
    }
  }

  private async getRecentTeamActivity(tenantId: string): Promise<any[]> {
    // Get recent activities like new registrations, coaching assignments, etc.
    const activities = await this.databaseService
      .knex('users')
      .where('tenant_id', tenantId)
      .where('created_at', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
      .orderBy('created_at', 'desc')
      .limit(10)
      .select('id', 'first_name', 'last_name', 'role', 'created_at');

    return activities.map((activity) => ({
      type: 'user_registration',
      description: `${activity.first_name} ${activity.last_name} registered as ${activity.role}`,
      timestamp: activity.created_at,
      userId: activity.id,
    }));
  }

  private async getTeamAlerts(tenantId: string): Promise<any[]> {
    const alerts = [];

    // Check for inactive coaches
    const inactiveCoaches = await this.databaseService
      .knex('users')
      .where('tenant_id', tenantId)
      .whereIn('role', [
        UserRole.COACH,
        UserRole.COACH_ADMIN,
        UserRole.SUPER_ADMIN,
      ])
      .where('status', UserStatus.INACTIVE)
      .count('* as count');

    if (parseInt(inactiveCoaches[0].count as string, 10) > 0) {
      alerts.push({
        type: 'warning',
        message: `${inactiveCoaches[0].count} inactive coaches need attention`,
        priority: 'medium',
      });
    }

    // Check for athletes without coaches
    const unassignedAthletes = await this.databaseService
      .knex('users as u')
      .leftJoin('coach_athlete_relationships as car', function () {
        this.on('u.id', '=', 'car.athlete_id').andOnVal(
          'car.status',
          '=',
          'ACTIVE',
        );
      })
      .where('u.tenant_id', tenantId)
      .where('u.role', UserRole.ATHLETE)
      .where('u.status', UserStatus.ACTIVE)
      .whereNull('car.id')
      .count('* as count');

    if (parseInt(unassignedAthletes[0].count as string, 10) > 0) {
      alerts.push({
        type: 'info',
        message: `${unassignedAthletes[0].count} athletes are not assigned to coaches`,
        priority: 'low',
      });
    }

    return alerts;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
