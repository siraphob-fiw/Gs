import {
  ApiEmail,
  ApiPassword,
  ApiOptionalString,
  ApiOptionalBoolean,
  ApiString,
} from '../../common/decorators';
import { IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AuthMethod {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  LINE = 'LINE',
  OAUTH = 'OAUTH',
}

export class LoginDto {
  @ApiString(1, undefined, {
    description: 'User identifier (email or phone number)',
    example: 'user@example.com or +1234567890',
  })
  identifier: string;

  @ApiOptionalString(6, undefined, {
    description: 'User password (optional for phone-based auth)',
    example: 'SecurePassword123!',
  })
  password?: string;

  @ApiProperty({
    enum: AuthMethod,
    description: 'Authentication method',
    example: AuthMethod.EMAIL,
  })
  @IsEnum(AuthMethod)
  authMethod: AuthMethod;

  @ApiOptionalString(1, 50, {
    description: 'Tenant ID for multi-tenant authentication',
    example: 'tenant-123',
  })
  tenantId?: string;

  @ApiOptionalBoolean({
    description: 'Remember me option for extended session',
    example: false,
  })
  rememberMe?: boolean;

  @ApiOptionalString(1, undefined, {
    description: 'Verification token for phone-based authentication',
    example: '123456',
  })
  verificationToken?: string;

  @ApiPropertyOptional({
    description: 'OAuth provider data',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  oauthData?: Record<string, any>;

  @ApiOptionalString(1, undefined, {
    description: 'IP address of the client',
    example: '127.0.0.1',
  })
  ipAddress?: string;

  @ApiOptionalString(1, undefined, {
    description: 'User agent of the client',
    example:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  })
  userAgent?: string;

  @ApiOptionalString(1, undefined, {
    description: 'Source of the request',
    example: 'application',
  })
  datafrom?: string;
}

export class RefreshTokenDto {
  @ApiString(1, undefined, {
    description: 'Refresh token for generating new access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiPropertyOptional({
    description: 'Current password (optional for OAuth users setting initial password)',
    example: 'CurrentPassword123!',
  })
  @IsOptional()
  currentPassword?: string;

  @ApiPassword(6, {
    description: 'New password',
    example: 'NewPassword123!',
  })
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiEmail({
    description: 'User email address for password reset',
    example: 'user@example.com',
  })
  email: string;
}

export class SendResetPasswordEmailDto {
  @ApiEmail({
    description: 'User email address for password reset',
    example: 'user@example.com',
  })
  email: string;

  @ApiOptionalString(1, 50, {
    description: 'Tenant ID for multi-tenant password reset',
    example: 'tenant-123',
  })
  tenantId: string;
}

export class ValidateResetPasswordTokenDto {
  @ApiString(1, undefined, {
    description: 'Password reset token',
    example: '1234567890',
  })
  token: string;
}

export class ResetPasswordDto {
  @ApiString(1, undefined, {
    description: 'Password reset token',
    example: '1234567890',
  })
  token: string;

  @ApiString(1, undefined, {
    description: 'User ID',
    example: 'user-123',
  })
  userId: string;

  @ApiString(1, undefined, {
    description: 'Password',
    example: 'NewPassword123!',
  })
  newPassword: string;
}

export class PhoneVerificationDto {
  @ApiString(1, undefined, {
    description: 'Phone number to verify',
    example: '+1234567890',
  })
  phoneNumber: string;

  @ApiProperty({
    enum: ['SMS', 'WHATSAPP'],
    description: 'Verification method',
    example: 'SMS',
  })
  @IsEnum(['SMS', 'WHATSAPP'])
  method: 'SMS' | 'WHATSAPP';
}

export class PhoneVerificationConfirmDto {
  @ApiString(1, undefined, {
    description: 'Phone number being verified',
    example: '+1234567890',
  })
  phoneNumber: string;

  @ApiString(1, 10, {
    description: 'Verification token',
    example: '123456',
  })
  token: string;
}

export class RegisterWithPhoneDto {
  @ApiString(1, undefined, {
    description: 'Phone number for registration',
    example: '+1234567890',
  })
  phoneNumber: string;

  @ApiProperty({
    enum: [AuthMethod.WHATSAPP, AuthMethod.LINE],
    description: 'Authentication method',
    example: AuthMethod.WHATSAPP,
  })
  @IsEnum([AuthMethod.WHATSAPP, AuthMethod.LINE])
  authMethod: AuthMethod.WHATSAPP | AuthMethod.LINE;

  @ApiString(1, 10, {
    description: 'Phone verification token',
    example: '123456',
  })
  verificationToken: string;

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
    gender?: string;
    bodyWeight?: number;
    height?: number;
    experienceLevel?: string;
  };

  @ApiPropertyOptional({
    description: 'User preferences',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;

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
}

export class RegisterWithEmailDto {
  @ApiString(1, undefined, {
    description: 'First name for registration',
    example: 'John',
  })
  firstName: string;

  @ApiString(1, undefined, {
    description: 'Last name for registration',
    example: 'Doe',
  })
  lastName: string;

  @ApiString(1, undefined, {
    description: 'Email address for registration',
    example: 'user@example.com',
  })
  email: string;

  @ApiString(1, undefined, {
    description: 'Password for registration',
    example: 'password123!',
  })
  password: string;

  @ApiProperty({
    enum: [AuthMethod.EMAIL],
    description: 'Authentication method',
    example: AuthMethod.EMAIL,
  })
  @IsEnum([AuthMethod.EMAIL])
  authMethod: AuthMethod.EMAIL;

  @ApiProperty({
    description: 'Role for registration',
    example: 'ATHLETE',
  })
  @IsEnum(['ATHLETE', 'COACH'])
  role: 'ATHLETE' | 'COACH';

  @ApiOptionalString(1, undefined, {
    description: 'Source of the request',
    example: 'application',
  })
  datafrom?: string;
}

export class setupPasswordDto {
  @ApiPassword(6, {
    description: 'New password',
    example: 'NewPassword123!',
  })
  newPassword: string;
}

export class VerifyEmailOtpDto {
  @ApiEmail({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiString(1, 10, {
    description: 'OTP code',
    example: '123456',
  })
  otp: string;
}

export class ResendEmailOtpDto {
  @ApiEmail({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;
}
