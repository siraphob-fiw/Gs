import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsPhoneNumber,
  MinLength,
  IsUUID,
} from 'class-validator';
import {
  UserRole,
  UserStatus,
  Gender as GenderType,
} from '@strengthos/shared-types';

// Re-export for compatibility
export { UserRole, UserStatus };

export enum AuthMethod {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  LINE = 'LINE',
  OAUTH = 'OAUTH',
}

export class CreateUserDto {
  @ApiPropertyOptional({
    description: 'User email address (required for EMAIL auth method)',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User phone number (required for WHATSAPP/LINE auth methods)',
    example: '+1234567890',
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({
    description: 'User password (required for EMAIL auth method)',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({
    enum: AuthMethod,
    description: 'Authentication method',
    example: AuthMethod.EMAIL,
  })
  @IsEnum(AuthMethod)
  authMethod: AuthMethod;

  @ApiProperty({ enum: UserRole, description: 'User role' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'User profile information',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: GenderType;
    bodyWeight?: number;
    height?: number;
  };

  @ApiPropertyOptional({
    description: 'User preferences as JSON object',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'OAuth provider data',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  auth_providers?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'WhatsApp authentication data',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  whatsappData?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'LINE authentication data',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  lineData?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Tenant ID for multi-tenant user creation',
    example: 'tenant-123',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
