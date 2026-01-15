import { BaseEntity } from '../../types/entities/base.entity';

export enum TransitionType {
  SELF_TO_COACH = 'SELF_TO_COACH',
  COACH_TO_COACH = 'COACH_TO_COACH',
  COACH_TO_SELF = 'COACH_TO_SELF',
}

export enum TransitionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface TransitionRequest extends BaseEntity {
  tenantId: string;
  athleteId: string;
  transitionType: TransitionType;
  status: TransitionStatus;
  fromCoachId?: string;
  toCoachId?: string;
  reason?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface CreateTransitionRequest {
  tenantId: string;
  athleteId: string;
  transitionType: TransitionType;
  fromCoachId?: string;
  toCoachId?: string;
  reason?: string;
}

export interface ApproveTransitionRequest {
  approverId: string;
  metadata?: Record<string, any>;
}

export interface RejectTransitionRequest {
  rejectedBy: string;
  rejectionReason: string;
}
