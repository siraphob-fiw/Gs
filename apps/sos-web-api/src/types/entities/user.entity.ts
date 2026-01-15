import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsPhoneNumber,
  IsObject,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus, Gender } from '@strengthos/shared-types';
import { TenantAwareEntity, UserTrackableEntity } from './base.entity';

/**
 * User entity representing the users table
 */
export class UserEntity extends TenantAwareEntity {
  @ApiProperty({
    description: 'User email address',
    format: 'email',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Hashed password',
    example: '$2b$10$...',
  })
  @IsString()
  password_hash: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.ATHLETE,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiPropertyOptional({
    description: 'First name',
    maxLength: 100,
    example: 'John',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    maxLength: 100,
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+1234567890',
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Date of birth',
    format: 'date',
    example: '1990-01-01',
  })
  @IsOptional()
  @IsString()
  date_of_birth?: string;

  @ApiPropertyOptional({
    description: 'Gender',
    enum: Gender,
    example: Gender.PREFER_NOT_TO_SAY,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Body weight in kg',
    minimum: 0,
    example: 70.5,
  })
  @IsOptional()
  @IsNumber()
  body_weight?: number;

  @ApiPropertyOptional({
    description: 'Height in cm',
    minimum: 0,
    example: 175,
  })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({
    description: 'User preferences as JSON',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Equipment profiles as JSON',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  equipment_profiles?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Health considerations as JSON',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  health_considerations?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Training schedule as JSON',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  training_schedule?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Emergency contact information as JSON',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  emergency_contact?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Last login timestamp',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  last_login_at?: Date;

  @ApiPropertyOptional({
    description: 'Email verification timestamp',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  email_verified_at?: Date;

  @ApiPropertyOptional({
    description: 'Password reset token',
    example: 'abc123...',
  })
  @IsOptional()
  @IsString()
  password_reset_token?: string;

  @ApiPropertyOptional({
    description: 'Password reset token expiry',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  password_reset_expires?: Date;
}

/**
 * User session entity
 */
export class UserSessionEntity extends TenantAwareEntity {
  @ApiProperty({
    description: 'User ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  user_id: string;

  @ApiProperty({
    description: 'Session token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  session_token: string;

  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refresh_token: string;

  @ApiProperty({
    description: 'Session expiry',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsDateString()
  expires_at: Date;

  @ApiPropertyOptional({
    description: 'IP address',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ip_address?: string;

  @ApiPropertyOptional({
    description: 'User agent',
    example: 'Mozilla/5.0...',
  })
  @IsOptional()
  @IsString()
  user_agent?: string;

  @ApiPropertyOptional({
    description: 'Last activity timestamp',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  last_activity_at?: Date;

  @ApiProperty({
    description: 'Whether session is active',
    example: true,
  })
  is_active: boolean;
}

/**
 * User permission entity
 */
export class UserPermissionEntity extends TenantAwareEntity {
  @ApiProperty({
    description: 'User ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  user_id: string;

  @ApiProperty({
    description: 'Permission name',
    example: 'users.create',
  })
  @IsString()
  permission: string;

  @ApiPropertyOptional({
    description: 'Resource ID for resource-specific permissions',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  resource_id?: string;

  @ApiPropertyOptional({
    description: 'Permission granted by user ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  granted_by?: string;

  @ApiPropertyOptional({
    description: 'Permission granted at timestamp',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  granted_at?: Date;

  @ApiPropertyOptional({
    description: 'Permission expiry timestamp',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  expires_at?: Date;
}

/**
 * User profile entity for extended user information
 */
export class UserProfileEntity extends UserTrackableEntity {
  @ApiProperty({
    description: 'User ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  user_id: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiPropertyOptional({
    description: 'Bio or description',
    maxLength: 1000,
    example: 'Passionate athlete focused on strength training...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Location',
    maxLength: 200,
    example: 'New York, NY',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({
    description: 'Website URL',
    example: 'https://example.com',
  })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({
    description: 'Social media links as JSON',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  social_links?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Fitness goals as JSON array',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  fitness_goals?: string[];

  @ApiPropertyOptional({
    description: 'Experience level',
    example: 'intermediate',
  })
  @IsOptional()
  @IsString()
  experience_level?: string;

  @ApiPropertyOptional({
    description: 'Preferred training style',
    example: 'powerlifting',
  })
  @IsOptional()
  @IsString()
  training_style?: string;

  @ApiPropertyOptional({
    description: 'Privacy settings as JSON',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  privacy_settings?: Record<string, boolean>;
}
