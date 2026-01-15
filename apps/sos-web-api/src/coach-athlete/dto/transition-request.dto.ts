import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsString,
  IsObject,
  IsEnum,
} from 'class-validator';
import {
  TransitionType,
  TransitionStatus,
  TransitionRequest,
} from '../entities/transition-request.entity';

export class CreateTransitionRequestDto {
  @ApiProperty({ description: 'Tenant ID' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ description: 'Athlete user ID' })
  @IsUUID()
  athleteId: string;

  @ApiProperty({ description: 'Type of transition', enum: TransitionType })
  @IsEnum(TransitionType)
  transitionType: TransitionType;

  @ApiPropertyOptional({
    description: 'Current coach ID (for coach transitions)',
  })
  @IsOptional()
  @IsUUID()
  fromCoachId?: string;

  @ApiPropertyOptional({ description: 'New coach ID (for coach transitions)' })
  @IsOptional()
  @IsUUID()
  toCoachId?: string;

  @ApiPropertyOptional({ description: 'Reason for transition' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ApproveTransitionRequestDto {
  @ApiProperty({ description: 'ID of user approving the transition' })
  @IsUUID()
  approverId: string;

  @ApiPropertyOptional({ description: 'Additional metadata for the approval' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class RejectTransitionRequestDto {
  @ApiProperty({ description: 'ID of user rejecting the transition' })
  @IsUUID()
  rejectedBy: string;

  @ApiProperty({ description: 'Reason for rejection' })
  @IsString()
  rejectionReason: string;
}

export class TransitionRequestResponseDto {
  @ApiProperty({ description: 'Transition request ID' })
  id: string;

  @ApiProperty({ description: 'Tenant ID' })
  tenantId: string;

  @ApiProperty({ description: 'Athlete user ID' })
  athleteId: string;

  @ApiProperty({ description: 'Type of transition', enum: TransitionType })
  transitionType: TransitionType;

  @ApiProperty({ description: 'Transition status', enum: TransitionStatus })
  status: TransitionStatus;

  @ApiPropertyOptional({ description: 'Current coach ID' })
  fromCoachId?: string;

  @ApiPropertyOptional({ description: 'New coach ID' })
  toCoachId?: string;

  @ApiPropertyOptional({ description: 'Reason for transition' })
  reason?: string;

  @ApiPropertyOptional({ description: 'User who approved the transition' })
  approvedBy?: string;

  @ApiPropertyOptional({ description: 'Approval timestamp' })
  approvedAt?: Date;

  @ApiPropertyOptional({ description: 'User who rejected the transition' })
  rejectedBy?: string;

  @ApiPropertyOptional({ description: 'Rejection timestamp' })
  rejectedAt?: Date;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Completion timestamp' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  static fromEntity(entity: TransitionRequest): TransitionRequestResponseDto {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      athleteId: entity.athleteId,
      transitionType: entity.transitionType,
      status: entity.status,
      fromCoachId: entity.fromCoachId,
      toCoachId: entity.toCoachId,
      reason: entity.reason,
      approvedBy: entity.approvedBy,
      approvedAt: entity.approvedAt,
      rejectedBy: entity.rejectedBy,
      rejectedAt: entity.rejectedAt,
      rejectionReason: entity.rejectionReason,
      completedAt: entity.completedAt,
      metadata: entity.metadata,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}

export class TransitionRequestQueryDto {
  @ApiPropertyOptional({ description: 'Filter by athlete ID' })
  @IsOptional()
  @IsUUID()
  athleteId?: string;

  @ApiPropertyOptional({
    description: 'Filter by transition type',
    enum: TransitionType,
  })
  @IsOptional()
  @IsEnum(TransitionType)
  transitionType?: TransitionType;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: TransitionStatus,
  })
  @IsOptional()
  @IsEnum(TransitionStatus)
  status?: TransitionStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number = 20;
}
