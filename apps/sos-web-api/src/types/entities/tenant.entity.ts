import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsNumber,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TenantStatus,
  TenantSettings,
  BillingInfo,
} from '@strengthos/shared-types';
import { BaseEntity, UserTrackableEntity } from './base.entity';

/**
 * Tenant entity representing the tenants table
 */
export class TenantEntity extends BaseEntity {
  @ApiProperty({
    description: 'Tenant name',
    minLength: 2,
    maxLength: 200,
    example: 'Elite Fitness Coaching',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'Custom domain',
    example: 'elite-fitness.strengthos.com',
  })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({
    description: 'Tenant status',
    enum: TenantStatus,
    example: TenantStatus.ACTIVE,
  })
  @IsEnum(TenantStatus)
  status: TenantStatus;

  @ApiPropertyOptional({
    description: 'Tenant settings as JSON',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  settings?: TenantSettings;

  @ApiPropertyOptional({
    description: 'Subscription ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  subscription_id?: string;

  @ApiPropertyOptional({
    description: 'Billing information as JSON',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  billing_info?: BillingInfo;

  @ApiPropertyOptional({
    description: 'Maximum number of users allowed',
    minimum: 1,
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_users?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of coaches allowed',
    minimum: 1,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_coaches?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of athletes allowed',
    minimum: 1,
    example: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_athletes?: number;

  @ApiPropertyOptional({
    description: 'Storage limit in GB',
    minimum: 0,
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  storage_limit_gb?: number;

  @ApiPropertyOptional({
    description: 'Current storage usage in GB',
    minimum: 0,
    example: 12.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  storage_used_gb?: number;

  @ApiPropertyOptional({
    description: 'Trial end date',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsOptional()
  trial_ends_at?: Date;

  @ApiPropertyOptional({
    description: 'Whether tenant is in trial period',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_trial?: boolean;

  @ApiPropertyOptional({
    description: 'Tenant metadata as JSON',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Tenant subscription entity
 */
export class TenantSubscriptionEntity extends UserTrackableEntity {
  @ApiProperty({
    description: 'Subscription plan ID',
    example: 'plan_premium_monthly',
  })
  @IsString()
  plan_id: string;

  @ApiProperty({
    description: 'Subscription status',
    example: 'active',
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'Current period start',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  current_period_start: Date;

  @ApiProperty({
    description: 'Current period end',
    format: 'date-time',
    example: '2023-02-01T00:00:00.000Z',
  })
  current_period_end: Date;

  @ApiProperty({
    description: 'Whether to cancel at period end',
    example: false,
  })
  @IsBoolean()
  cancel_at_period_end: boolean;

  @ApiPropertyOptional({
    description: 'Trial end date',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsOptional()
  trial_end?: Date;

  @ApiPropertyOptional({
    description: 'Usage metrics as JSON',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  usage?: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Subscription metadata as JSON',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Tenant feature entity for feature flags
 */
export class TenantFeatureEntity extends UserTrackableEntity {
  @ApiProperty({
    description: 'Feature name',
    example: 'video_analysis',
  })
  @IsString()
  feature_name: string;

  @ApiProperty({
    description: 'Whether feature is enabled',
    example: true,
  })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({
    description: 'Feature configuration as JSON',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  configuration?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Feature enabled at timestamp',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsOptional()
  enabled_at?: Date;

  @ApiPropertyOptional({
    description: 'Feature disabled at timestamp',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsOptional()
  disabled_at?: Date;
}

/**
 * Tenant usage entity for tracking usage metrics
 */
export class TenantUsageEntity extends BaseEntity {
  @ApiProperty({
    description: 'Tenant ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  tenant_id: string;

  @ApiProperty({
    description: 'Metric name',
    example: 'api_calls',
  })
  @IsString()
  metric_name: string;

  @ApiProperty({
    description: 'Metric value',
    example: 1500,
  })
  @IsNumber()
  value: number;

  @ApiProperty({
    description: 'Usage period start',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  period_start: Date;

  @ApiProperty({
    description: 'Usage period end',
    format: 'date-time',
    example: '2023-01-31T23:59:59.999Z',
  })
  period_end: Date;

  @ApiPropertyOptional({
    description: 'Usage metadata as JSON',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Tenant invitation entity
 */
export class TenantInvitationEntity extends UserTrackableEntity {
  @ApiProperty({
    description: 'Invitee email address',
    format: 'email',
    example: 'newuser@example.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Invitation role',
    example: 'COACH',
  })
  @IsString()
  role: string;

  @ApiProperty({
    description: 'Invitation token',
    example: 'inv_abc123...',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Invitation status',
    example: 'pending',
  })
  @IsString()
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';

  @ApiProperty({
    description: 'Invitation expires at',
    format: 'date-time',
    example: '2023-01-08T00:00:00.000Z',
  })
  expires_at: Date;

  @ApiPropertyOptional({
    description: 'Invitation accepted at',
    format: 'date-time',
    example: '2023-01-02T00:00:00.000Z',
  })
  @IsOptional()
  accepted_at?: Date;

  @ApiPropertyOptional({
    description: 'User ID who accepted invitation',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  accepted_by?: string;

  @ApiPropertyOptional({
    description: 'Invitation message',
    maxLength: 500,
    example: 'Welcome to our fitness coaching platform!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
