import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TenantStatus,
  TenantSettings,
  SubscriptionInfo,
  BillingInfo,
} from '@strengthos/shared-types';

export class TenantResponseDto {
  @ApiProperty({
    description: 'Tenant unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Tenant business name',
    example: 'Elite Fitness Coaching',
  })
  name: string;

  @ApiProperty({
    description: 'Current tenant status',
    enum: TenantStatus,
    example: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  @ApiProperty({
    description: 'Tenant-specific settings',
    type: 'object',
    additionalProperties: true,
  })
  settings: TenantSettings;

  @ApiProperty({
    description: 'Subscription information',
    type: 'object',
    additionalProperties: true,
  })
  subscription: SubscriptionInfo;

  @ApiProperty({
    description: 'Billing information',
    type: 'object',
    additionalProperties: true,
  })
  billing: BillingInfo;

  @ApiProperty({
    description: 'Tenant creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Tenant last update timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Tenant suspension timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  suspendedAt?: Date;
}

export class PublicTenantResponseDto extends TenantResponseDto {
  @ApiProperty({
    description: 'Total number of coaches',
    example: 10,
  })
  totalCoaches: number;

  @ApiProperty({
    description: 'Total number of athletes',
    example: 100,
  })
  totalAthletes: number;
}
