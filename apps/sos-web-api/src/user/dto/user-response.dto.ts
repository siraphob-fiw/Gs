import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  UserRole,
  UserStatus,
  Gender as GenderType,
} from '@strengthos/shared-types';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Tenant ID' })
  tenantId: string;

  @ApiProperty({ description: 'Tenant Name' })
  tenantName?: string;

  @ApiPropertyOptional({ description: 'User email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  phone?: string;

  @ApiProperty({ enum: UserRole, description: 'User role' })
  role: UserRole;

  @ApiPropertyOptional({ description: 'Has password' })
  hasPassword?: boolean;

  @ApiProperty({ enum: UserStatus, description: 'User status' })
  status: UserStatus;

  @ApiPropertyOptional({ description: 'Phone verification status' })
  phoneVerified?: boolean;

  @ApiPropertyOptional({ description: 'Phone verification timestamp' })
  phoneVerifiedAt?: Date;

  @ApiProperty({
    description: 'User profile information',
    type: 'object',
    additionalProperties: true,
  })
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    gender?: GenderType;
    bodyWeight?: number;
    height?: number;
  };

  @ApiPropertyOptional({
    description: 'User preferences',
    type: 'object',
    additionalProperties: true,
  })
  preferences?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'OAuth provider data',
    type: 'object',
    additionalProperties: true,
  })
  auth_providers?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'WhatsApp authentication data',
    type: 'object',
    additionalProperties: true,
  })
  whatsappData?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'LINE authentication data',
    type: 'object',
    additionalProperties: true,
  })
  lineData?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: Date;

  @ApiPropertyOptional({ description: 'Last login timestamp' })
  last_login_at?: Date;

  @ApiPropertyOptional({ description: 'Email verification timestamp' })
  email_verified_at?: Date;

  @ApiPropertyOptional({ description: 'Coach ID' })
  coachId?: string;

  @ApiPropertyOptional({ description: 'Coach Name' })
  coachName?: string;
}
