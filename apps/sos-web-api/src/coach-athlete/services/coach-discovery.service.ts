import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { SecurityEventType } from '@strengthos/shared-types';
import {
  CoachDiscoveryProfile,
  CoachRequest,
  CreateCoachDiscoveryProfileRequest,
  UpdateCoachDiscoveryProfileRequest,
  CreateCoachRequestRequest,
  RespondToCoachRequestRequest,
} from '../entities/coach-athlete-relationship.entity';
import { CoachDiscoveryRepository } from '../repositories/coach-discovery.repository';
import { CoachRequestRepository } from '../repositories/coach-request.repository';
import { SecurityMonitoringService } from '@strengthos/shared-security';
import { TenantContextService } from '../../tenant/services/tenant-context.service';
// import { NotificationService } from '../../notification/services/notification.service';
// import { NotificationType } from '@strengthos/shared-types';

export interface CoachDiscoveryFilters {
  specializations?: string[];
  languages?: string[];
  location?: string;
  maxHourlyRate?: number;
  minRating?: number;
  availableSlots?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class CoachDiscoveryService {
  constructor(
    private readonly coachDiscoveryRepository: CoachDiscoveryRepository,
    private readonly coachRequestRepository: CoachRequestRepository,
    @Inject('SecurityMonitoringService')
    private readonly securityMonitoring: SecurityMonitoringService,
    private readonly tenantContext: TenantContextService,
    // private readonly notificationService: NotificationService,
  ) {}

  async createCoachProfile(
    userId: string,
    tenantId: string,
    data: CreateCoachDiscoveryProfileRequest,
  ): Promise<CoachDiscoveryProfile> {
    const profile = await this.coachDiscoveryRepository.create(
      userId,
      tenantId,
      data,
    );

    await this.securityMonitoring.logSecurityEvent({
      eventType: SecurityEventType.DATA_MODIFICATION,
      userId,
      tenantId,
      severity: 'medium',

      metadata: {
        specializations: data.specializations,
        bio: data.bio,
        availability: data.availability,
        socialLinks: data.socialLinks,
      },
    });

    return profile;
  }

  async updateCoachProfile(
    userId: string,
    request: UpdateCoachDiscoveryProfileRequest,
  ): Promise<CoachDiscoveryProfile> {
    const profile = await this.coachDiscoveryRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Coach discovery profile not found');
    }

    const updatedProfile = await this.coachDiscoveryRepository.update(
      profile.id,
      request,
    );

    if (!updatedProfile) {
      throw new NotFoundException('Coach discovery profile not found');
    }

    await this.securityMonitoring.logSecurityEvent({
      eventType: SecurityEventType.DATA_MODIFICATION,
      userId,
      tenantId: profile.tenant_id,
      severity: 'medium',

      metadata: {
        changes: request,
      },
    });

    return updatedProfile;
  }

  async getCoachProfile(userId: string): Promise<CoachDiscoveryProfile | null> {
    return this.coachDiscoveryRepository.findByUserId(userId);
  }

  async searchCoaches(filters: CoachDiscoveryFilters = {}): Promise<{
    coaches: CoachDiscoveryProfile[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { coaches, total } =
      await this.coachDiscoveryRepository.search(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      coaches,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async requestCoach(
    athleteId: string,
    request: CreateCoachRequestRequest,
  ): Promise<CoachRequest> {
    const tenantId = await this.tenantContext.getCurrentTenantId();

    // Check if coach exists and is accepting new athletes
    const coachProfile = await this.coachDiscoveryRepository.findByUserId(
      request.coach_id,
    );
    if (!coachProfile) {
      throw new NotFoundException('Coach not found');
    }

    if (!coachProfile.is_available) {
      throw new BadRequestException('Coach is not accepting new athletes');
    }

    // Check for existing pending request
    const existingRequest =
      await this.coachRequestRepository.findPendingRequest(
        athleteId,
        request.coach_id,
      );
    if (existingRequest) {
      throw new BadRequestException(
        'A pending request already exists for this coach',
      );
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (request.expiresIn || 72));

    const coachRequest = await this.coachRequestRepository.create({
      tenantId,
      athleteId,
      coachId: request.coach_id,
      status: 'PENDING',
      message: request.message,
      requestedAt: new Date(),
      expiresAt,
    });

    // Send notification to coach
    // await this.notificationService.sendNotification({
    //   recipientId: request.coach_id,
    //   type: NotificationType.COACH_REQUEST,
    //   channel: 'email' as any,
    //   title: 'New Coaching Request',
    //   message: `You have received a new coaching request from an athlete.`,
    //   metadata: {
    //     requestId: coachRequest.id,
    //     athleteId,
    //     message: request.message,
    //   },
    // });

    await this.securityMonitoring.logSecurityEvent({
      eventType: SecurityEventType.DATA_MODIFICATION,
      userId: athleteId,
      tenantId,
      severity: 'medium',

      metadata: {
        coachId: request.coach_id,
        message: request.message,
        expiresAt,
      },
    });

    return coachRequest;
  }

  async respondToCoachRequest(
    coachId: string,
    requestId: string,
    response: RespondToCoachRequestRequest,
  ): Promise<CoachRequest> {
    const coachRequest = await this.coachRequestRepository.findById(requestId);
    if (!coachRequest) {
      throw new NotFoundException('Coach request not found');
    }

    if (coachRequest.coach_id !== coachId) {
      throw new ForbiddenException('You can only respond to your own requests');
    }

    if (coachRequest.status !== 'PENDING') {
      throw new BadRequestException('Request has already been responded to');
    }

    if (new Date() > coachRequest.expires_at) {
      throw new BadRequestException('Request has expired');
    }

    const updatedRequest = await this.coachRequestRepository.respond(
      requestId,
      response.status,
      response.response_message,
    );

    if (!updatedRequest) {
      throw new NotFoundException('Coach request not found');
    }

    // Send notification to athlete
    // await this.notificationService.sendNotification({
    //   recipientId: coachRequest.athlete_id,
    //   type: NotificationType.COACH_REQUEST_RESPONSE,
    //   channel: 'email' as any,
    //   title: `Coach Request ${response.status}`,
    //   message: `Your coaching request has been ${response.status.toLowerCase()}.`,
    //   metadata: {
    //     requestId,
    //     coachId,
    //     status: response.status,
    //     responseMessage: response.response_message,
    //   },
    // });

    await this.securityMonitoring.logSecurityEvent({
      eventType: SecurityEventType.DATA_MODIFICATION,
      userId: coachId,
      tenantId: coachRequest.tenant_id,
      severity: 'medium',

      metadata: {
        athleteId: coachRequest.athlete_id,
        status: response.status,
        responseMessage: response.response_message,
      },
    });

    return updatedRequest;
  }

  async getCoachRequests(
    coachId: string,
    status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED',
  ): Promise<CoachRequest[]> {
    return this.coachRequestRepository.findByCoachId(coachId, status);
  }

  async getAthleteRequests(
    athleteId: string,
    status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED',
  ): Promise<CoachRequest[]> {
    return this.coachRequestRepository.findByAthleteId(athleteId, status);
  }

  async cancelCoachRequest(
    athleteId: string,
    requestId: string,
  ): Promise<CoachRequest> {
    const coachRequest = await this.coachRequestRepository.findById(requestId);
    if (!coachRequest) {
      throw new NotFoundException('Coach request not found');
    }

    if (coachRequest.athlete_id !== athleteId) {
      throw new ForbiddenException('You can only cancel your own requests');
    }

    if (coachRequest.status !== 'PENDING') {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    const updatedRequest = await this.coachRequestRepository.cancel(requestId);
    if (!updatedRequest) {
      throw new NotFoundException('Coach request not found');
    }

    await this.securityMonitoring.logSecurityEvent({
      eventType: SecurityEventType.DATA_MODIFICATION,
      userId: athleteId,
      tenantId: coachRequest.tenant_id,
      severity: 'medium',

      metadata: {
        coachId: coachRequest.coach_id,
      },
    });

    return updatedRequest;
  }

  async updateCoachAthleteCount(
    coachId: string,
    increment: boolean,
  ): Promise<void> {
    const profile = await this.coachDiscoveryRepository.findByUserId(coachId);
    if (profile) {
      const newCount = increment
        ? profile.is_available
          ? 1
          : 0
        : profile.is_available
          ? 0
          : 1;

      await this.coachDiscoveryRepository.update(profile.id, {
        isAvailable: newCount === 1,
      });
    }
  }
}
