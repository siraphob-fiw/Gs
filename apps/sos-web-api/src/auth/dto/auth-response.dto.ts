import { ApiProperty } from '@nestjs/swagger';
import { User } from '@strengthos/shared-types';

export class AuthResponseDto {
  @ApiProperty({
    description: 'User information',
    type: 'object',
    additionalProperties: true,
  })
  user: User;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token expiration date',
    example: '2024-12-31T23:59:59.000Z',
  })
  expiresAt: Date;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Logout success message',
    example: 'Successfully logged out',
  })
  message: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Password reset request success message',
    example: 'Password reset instructions sent to your email',
  })
  message: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Password reset success message',
    example: 'Password has been reset successfully',
  })
  message: string;
}
