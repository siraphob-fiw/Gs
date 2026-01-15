import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { RequestContext, SecurityEventType } from '@strengthos/shared-types';
import {
  CoachAthleteRepository,
  CoachAthleteQueryOptions,
} from '../repositories/coach-athlete.repository';
import {
  CoachAthleteRelationship,
  CreateCoachAthleteRelationshipRequest,
  RelationshipStatus,
  RelationshipTransition,
} from '../entities/coach-athlete-relationship.entity';
import { SecurityMonitoringService } from '@strengthos/shared-security';
import { TenantContextService } from '../../tenant/services/tenant-context.service';
import { EmailService } from '@/email/services/email.service';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class CoachAthleteService {
  constructor(
    private readonly coachAthleteRepository: CoachAthleteRepository,
    @Inject('SecurityMonitoringService')
    private readonly securityMonitoring: SecurityMonitoringService,
    private readonly tenantContext: TenantContextService,
    private readonly emailService: EmailService,
    private readonly databaseService: DatabaseService,
  ) {}

  async createRelationship(
    request: CreateCoachAthleteRelationshipRequest,
    user: RequestContext,
  ): Promise<CoachAthleteRelationship> {
    const coachId = request.coach_id;
    const athleteId = request.athlete_id;
    if (!coachId || !athleteId) {
      throw new NotFoundException('Coach or athlete not found');
    }
    const existingRelationship =
      await this.coachAthleteRepository.findByCoachAndAthlete(
        coachId,
        athleteId,
        RelationshipStatus.ACTIVE,
      );
    if (existingRelationship) {
      throw new BadRequestException(
        'An active relationship already exists between this coach and athlete',
      );
    }

    const authUser = await this.databaseService
      .knex('users')
      .where('id', user.userId)
      .first();

    const relationship = await this.coachAthleteRepository.create(
      request,
      authUser.id,
      authUser.tenant_id,
    );

    await this.databaseService.knex('users').where('id', athleteId).update({
      tenant_id: authUser.tenant_id,
      updated_at: new Date(),
    });

    if (relationship.athlete_email) {
      await this.emailService.sendEmail(relationship.athlete_email, {
        subject: 'You have been added as an athlete to a coach',
        text: `You have been added as an athlete to a coach. Please login to your account to view your coach and start training.`,
      });
    }

    await this.securityMonitoring.logSecurityEvent({
      eventType: SecurityEventType.DATA_MODIFICATION,
      userId: authUser.id,
      tenantId: authUser.tenant_id,
      severity: 'medium',
      metadata: {
        coachId,
        athleteId,
        status: relationship.status,
        notes: request.notes ?? null,
      },
    });
    return relationship;
  }

  async getRelationships(options: CoachAthleteQueryOptions = {}): Promise<{
    relationships: CoachAthleteRelationship[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { relationships, total } =
      await this.coachAthleteRepository.findMany(options);
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      relationships,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async updateRelationship(
    id: string,
    status: RelationshipStatus,
    updatedBy: string,
  ): Promise<CoachAthleteRelationship> {
    const updatedRelationship = await this.coachAthleteRepository.update(
      id,
      status,
      updatedBy,
    );

    if (!updatedRelationship) {
      throw new NotFoundException('Coach-athlete relationship not found');
    }

    // Log the security event
    await this.securityMonitoring.logSecurityEvent({
      eventType: SecurityEventType.DATA_MODIFICATION,
      userId: updatedBy,
      tenantId: updatedRelationship.tenant_id,
      severity: 'medium',
      metadata: {
        newStatus: updatedRelationship.status,
      },
    });

    return updatedRelationship;
  }

  async getCoachAthletes(coachId: string): Promise<CoachAthleteRelationship[]> {
    return this.coachAthleteRepository.findActiveRelationshipsByCoach(coachId);
  }

  async validateCoachAthleteAccess(
    coachId: string,
    athleteId: string,
  ): Promise<boolean> {
    const relationship =
      await this.coachAthleteRepository.findByCoachAndAthlete(
        coachId,
        athleteId,
        RelationshipStatus.ACTIVE,
      );
    return Boolean(relationship);
  }

  private async addTransitionToHistory(
    relationshipId: string,
    transition: Omit<RelationshipTransition, 'id'>,
  ): Promise<void> {
    const uniqueId = `transition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.coachAthleteRepository.addTransitionToHistory(relationshipId, {
      ...transition,
      id: uniqueId,
    });
  }
}
