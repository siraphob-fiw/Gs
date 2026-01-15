import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { SecurityEventType } from '@strengthos/shared-types';
import {
  TransitionRequestRepository,
  TransitionRequestQueryOptions,
} from '../repositories/transition-request.repository';
import { CoachAthleteRepository } from '../repositories/coach-athlete.repository';
import {
  TransitionRequest,
  CreateTransitionRequest,
  TransitionType,
  TransitionStatus,
  ApproveTransitionRequest,
  RejectTransitionRequest,
} from '../entities/transition-request.entity';
import { RelationshipStatus } from '../entities/coach-athlete-relationship.entity';
import { SecurityMonitoringService } from '@strengthos/shared-security';
import { TenantContextService } from '../../tenant/services/tenant-context.service';
// import { NotificationService } from '../../notification/services/notification.service';
// import { NotificationType } from '@strengthos/shared-notifications';

@Injectable()
export class CoachTransitionService {
  constructor(
    private readonly transitionRepository: TransitionRequestRepository,
    private readonly coachAthleteRepository: CoachAthleteRepository,
    @Inject('SecurityMonitoringService')
    private readonly securityMonitoring: SecurityMonitoringService,
    private readonly tenantContext: TenantContextService,
    // private readonly notificationService: NotificationService,
  ) {}

  async createTransitionRequest(
    request: CreateTransitionRequest,
  ): Promise<TransitionRequest> {
    await this.validateTransitionRequest(request);

    const transitionRequest = await this.transitionRepository.create(request);

    // Log the creation
    await this.securityMonitoring.logSecurityEvent({
      eventType: SecurityEventType.DATA_MODIFICATION,
      userId: request.athleteId,
      tenantId: await this.tenantContext.getCurrentTenantId(),
      severity: 'medium',
      metadata: {
        transitionType: request.transitionType,
        fromCoachId: request.fromCoachId,
        toCoachId: request.toCoachId,
        reason: request.reason,
      },
    });

    return transitionRequest;
  }

  async getTransitionRequest(id: string): Promise<TransitionRequest> {
    const request = await this.transitionRepository.findById(id);

    if (!request) {
      throw new NotFoundException('Transition request not found');
    }

    return request;
  }

  async getTransitionRequests(
    options: TransitionRequestQueryOptions = {},
  ): Promise<{
    requests: TransitionRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { requests, total } =
      await this.transitionRepository.findMany(options);
    const page = options.page || 1;
    const limit = options.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      requests,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getTransitionHistory(athleteId: string): Promise<TransitionRequest[]> {
    return this.transitionRepository.findByAthleteId(athleteId);
  }

  async approveTransition(
    id: string,
    request: ApproveTransitionRequest,
  ): Promise<TransitionRequest> {
    const transitionRequest = await this.getTransitionRequest(id);

    if (transitionRequest.status !== TransitionStatus.PENDING) {
      throw new BadRequestException(
        'Only pending transition requests can be approved',
      );
    }

    const approvedRequest = await this.transitionRepository.approve(
      id,
      request,
    );

    if (!approvedRequest) {
      throw new NotFoundException('Transition request not found');
    }

    // Log the approval
    await this.securityMonitoring.logSecurityEvent({
      eventType: SecurityEventType.DATA_MODIFICATION,
      userId: request.approverId,
      tenantId: await this.tenantContext.getCurrentTenantId(),
      severity: 'medium',
      metadata: {
        athleteId: transitionRequest.athleteId,
        transitionType: transitionRequest.transitionType,
        approvedBy: request.approverId,
      },
    });

    return approvedRequest;
  }

  async rejectTransition(
    id: string,
    request: RejectTransitionRequest,
  ): Promise<TransitionRequest> {
    const transitionRequest = await this.getTransitionRequest(id);

    if (transitionRequest.status !== TransitionStatus.PENDING) {
      throw new BadRequestException(
        'Only pending transition requests can be rejected',
      );
    }

    const rejectedRequest = await this.transitionRepository.reject(id, request);

    if (!rejectedRequest) {
      throw new NotFoundException('Transition request not found');
    }

    // Log the rejection
    await this.securityMonitoring.logSecurityEvent({
      eventType: SecurityEventType.DATA_MODIFICATION,
      userId: request.rejectedBy,
      tenantId: await this.tenantContext.getCurrentTenantId(),
      severity: 'medium',
      metadata: {
        athleteId: transitionRequest.athleteId,
        transitionType: transitionRequest.transitionType,
        rejectedBy: request.rejectedBy,
        rejectionReason: request.rejectionReason,
      },
    });

    return rejectedRequest;
  }

  async cancelTransition(
    id: string,
    cancelledBy: string,
  ): Promise<TransitionRequest> {
    const transitionRequest = await this.getTransitionRequest(id);

    if (
      ![TransitionStatus.PENDING, TransitionStatus.APPROVED].includes(
        transitionRequest.status,
      )
    ) {
      throw new BadRequestException(
        'Only pending or approved transition requests can be cancelled',
      );
    }

    const cancelledRequest = await this.transitionRepository.cancel(id);

    if (!cancelledRequest) {
      throw new NotFoundException('Transition request not found');
    }

    // Log the cancellation
    await this.securityMonitoring.logSecurityEvent({
      eventType: SecurityEventType.DATA_MODIFICATION,
      userId: cancelledBy,
      tenantId: await this.tenantContext.getCurrentTenantId(),
      severity: 'medium',

      metadata: {
        athleteId: transitionRequest.athleteId,
        transitionType: transitionRequest.transitionType,
        cancelledBy,
      },
    });

    return cancelledRequest;
  }

  private async validateTransitionRequest(
    request: CreateTransitionRequest,
  ): Promise<void> {
    switch (request.transitionType) {
      case TransitionType.SELF_TO_COACH:
        if (!request.toCoachId) {
          throw new BadRequestException(
            'toCoachId is required for SELF_TO_COACH transitions',
          );
        }
        break;

      case TransitionType.COACH_TO_COACH:
        if (!request.fromCoachId || !request.toCoachId) {
          throw new BadRequestException(
            'Both fromCoachId and toCoachId are required for COACH_TO_COACH transitions',
          );
        }
        if (request.fromCoachId === request.toCoachId) {
          throw new BadRequestException(
            'fromCoachId and toCoachId cannot be the same',
          );
        }
        break;

      case TransitionType.COACH_TO_SELF:
        if (!request.fromCoachId) {
          throw new BadRequestException(
            'fromCoachId is required for COACH_TO_SELF transitions',
          );
        }
        break;

      default:
        throw new BadRequestException('Invalid transition type');
    }
  }

  private async handleCoachToSelfTransition(
    request: TransitionRequest,
    result: any,
  ): Promise<void> {
    // Terminate coach relationship
    const relationship =
      await this.coachAthleteRepository.findByCoachAndAthlete(
        request.fromCoachId!,
        request.athleteId,
        RelationshipStatus.ACTIVE,
      );

    if (relationship) {
      await this.coachAthleteRepository.update(
        relationship.id,
        RelationshipStatus.TERMINATED,
        request.athleteId,
      );
    }

    result.dataTransferred.push('training_programs', 'progress_data');
    result.accessUpdated.push('self_coaching_permissions');
    result.notificationsSent.push('athlete', 'former_coach');
  }
}
