import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsObject,
  MinLength,
} from 'class-validator';

import {
  TenantSettings,
  BillingInfo,
} from '@strengthos/shared-types/user-management';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Tenant business name',
    example: 'Elite Fitness Coaching',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Tenant plan',
    example: 'trial',
  })
  @IsString()
  plan: string;

  @ApiProperty({
    description: 'Admin user email address',
    example: 'admin@elite-fitness.com',
  })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({
    description: 'Admin user password',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  adminPassword: string;

  @ApiProperty({
    description: 'Admin user first name',
    example: 'John',
  })
  @IsString()
  @MinLength(2)
  adminFirstName: string;

  @ApiProperty({
    description: 'Admin user last name',
    example: 'Doe',
  })
  @IsString()
  @MinLength(2)
  adminLastName: string;

  @ApiPropertyOptional({
    description: 'Tenant-specific settings',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  settings?: Partial<TenantSettings>;

  @ApiPropertyOptional({
    description: 'Billing information',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  billingInfo?: Partial<BillingInfo>;
}
