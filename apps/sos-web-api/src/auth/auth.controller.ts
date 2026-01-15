import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  Get,
  Delete,
  Param,
  Res,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { User } from './decorators/user.decorator';
import {
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ResetPasswordDto,
  PhoneVerificationDto,
  PhoneVerificationConfirmDto,
  RegisterWithPhoneDto,
  RegisterWithEmailDto,
  SendResetPasswordEmailDto,
  setupPasswordDto,
  VerifyEmailOtpDto,
  ResendEmailOtpDto,
  ValidateResetPasswordTokenDto,
  AuthMethod,
} from './dto/login.dto';
import {
  AuthResponseDto,
  LogoutResponseDto,
  ForgotPasswordResponseDto,
  ResetPasswordResponseDto,
} from './dto/auth-response.dto';
import { UserProfileDto } from './dto/profile.dto';
import { RequestContext, Results, UserRole } from '@strengthos/shared-types';
import { ApiPostOperation, ApiGetOperation, ApiStandardOperation } from '../common/decorators';
import { UserService } from '@/user/services/user.service';
import { UserResponseDto } from '@/user/dto/user-response.dto';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { DatabaseService } from '@/database/database.service';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiPostOperation(
    'User login',
    AuthResponseDto,
    'Authenticate user with email and password. Returns JWT tokens for subsequent API calls.',
    false,
  )
  @ApiBody({ type: LoginDto })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
  ): Promise<Results<AuthResponseDto>> {
    const ipAddress: string = request.ip || '127.0.0.1';
    const userAgent: string = request.get('User-Agent') || '';

    try {
      return await this.authService.login(loginDto, ipAddress, userAgent);
    } catch (e) {
      if (e instanceof UnauthorizedException && e.message === 'pending_verification') {
        // Return 200 OK with failure message to avoid server-side error logging
        // Frontend handles this by checking success: false and redirecting
        return {
          success: false,
          message: 'pending_verification',
        } as any;
      }
      throw e;
    }
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiPostOperation(
    'Refresh access token',
    AuthResponseDto,
    'Generate new access token using refresh token. Extends user session without requiring re-authentication.',
    false,
  )
  @ApiBody({ type: RefreshTokenDto })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    const ipAddress: string = request.ip || '127.0.0.1';
    const userAgent: string = request.get('User-Agent') || '';

    return this.authService.refreshToken(refreshTokenDto, ipAddress, userAgent);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiStandardOperation(
    'User logout',
    'Logout user and invalidate session. Blacklists the current JWT token.',
    true,
  )
  async logout(@User() user: RequestContext, @Req() request: Request): Promise<LogoutResponseDto> {
    const accessToken = request.headers.authorization?.split(' ')[1];
    await this.authService.logout(user, accessToken);
    return { message: 'Successfully logged out' };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiStandardOperation(
    'Change password',
    'Change user password. Requires current password for verification.',
    true,
  )
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(
    @User() user: RequestContext,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<Record<string, any> | null> {
    return await this.authService.changePassword(user, changePasswordDto);
  }

  @Post('setup-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiStandardOperation('Setup password', 'Setup user password. Only oauth register.', true)
  @ApiBody({ type: setupPasswordDto })
  async setupPassword(
    @User() user: RequestContext,
    @Body() setupPasswordDto: setupPasswordDto,
  ): Promise<Record<string, any> | null> {
    return await this.authService.setupPassword(user, setupPasswordDto);
  }

  @Public()
  @Post('send-reset-password-email')
  @HttpCode(HttpStatus.OK)
  @ApiPostOperation(
    'Request password reset',
    ForgotPasswordResponseDto,
    'Send password reset instructions to user email. Does not reveal if email exists for security.',
    false,
  )
  @ApiBody({ type: SendResetPasswordEmailDto })
  async sendResetPasswordEmail(
    @Body() sendResetPasswordEmailDto: SendResetPasswordEmailDto,
    @Req() request: Request,
  ): Promise<ForgotPasswordResponseDto> {
    const ipAddress = request.ip;
    const userAgent = request.get('User-Agent');

    await this.authService.sendResetPasswordEmail(sendResetPasswordEmailDto, ipAddress, userAgent);
    return { message: 'Password reset instructions sent to your email' };
  }

  @Public()
  @Post('validate-reset-password-token')
  @HttpCode(HttpStatus.OK)
  @ApiPostOperation(
    'Validate reset password token',
    ResetPasswordResponseDto,
    'Validate reset password token. Returns true if token is valid, false otherwise.',
    false,
  )
  @ApiBody({ type: ValidateResetPasswordTokenDto })
  async validateResetPasswordToken(
    @Body() resetPasswordDto: ValidateResetPasswordTokenDto,
  ): Promise<Record<string, any> | null> {
    return await this.authService.validateResetPasswordToken(resetPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiPostOperation(
    'Reset password',
    ResetPasswordResponseDto,
    'Reset user password using token received via email. Returns authentication tokens for automatic login.',
    false,
  )
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<Record<string, any> | null> {
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @Post('switch-tenant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiStandardOperation(
    'Switch tenant context',
    'Switch to a different tenant context and regenerate tokens',
    true,
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tenantId: {
          type: 'string',
          description: 'The new tenant ID to switch to',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
      required: ['tenantId'],
    },
  })
  async switchTenant(
    @Body() body: { tenantId: string; refreshToken: string },
    @User() user: RequestContext,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.switchTenantContext(
      user.userId!,
      body.tenantId,
      body.refreshToken,
    );

    return result;
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiGetOperation(
    'Get user profile',
    UserProfileDto,
    'Get current user profile information including permissions and tenant context.',
    true,
  )
  async getProfile(@User() user: RequestContext): Promise<UserResponseDto> {
    const userData = await this.userService.findById(user.userId);
    return userData;
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiGetOperation(
    'Get user sessions',
    Array,
    'Get all active sessions for the authenticated user.',
    true,
  )
  async getSessions(@User() user: RequestContext): Promise<any[]> {
    return this.authService.getUserSessions(user.userId);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiStandardOperation('Revoke session', 'Revoke a specific session by session ID.', true)
  async revokeSession(
    @User() user: RequestContext,
    @Param('sessionId') sessionId: string,
  ): Promise<{ message: string }> {
    await this.authService.revokeSession(user.userId, sessionId);
    return { message: 'Session revoked successfully' };
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiStandardOperation(
    'Revoke all sessions',
    'Revoke all sessions for the authenticated user.',
    true,
  )
  async revokeAllSessions(@User() user: RequestContext): Promise<{ message: string }> {
    await this.authService.logoutAllSessions(user.userId);
    return { message: 'All sessions revoked successfully' };
  }

  @Post('send-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiStandardOperation(
    'Send email verification',
    'Send email verification to user. Requires authentication.',
    true,
  )
  async sendEmailVerification(@User() user: RequestContext): Promise<{ message: string }> {
    await this.authService.sendEmailVerification(user.userId);
    return { message: 'Verification email sent successfully' };
  }

  @Public()
  @Get('verify-email/:token')
  @ApiGetOperation(
    'Verify email',
    Object,
    'Verify email address using token received via email.',
    false,
  )
  async verifyEmail(@Param('token') token: string): Promise<{ status: boolean; message: string }> {
    return await this.authService.verifyEmail(token);
  }

  @Public()
  @Post('verify-email-otp')
  @HttpCode(HttpStatus.OK)
  @ApiPostOperation(
    'Verify email OTP',
    AuthResponseDto,
    'Verify email address using OTP for mobile application.',
    false,
  )
  @ApiBody({ type: VerifyEmailOtpDto })
  async verifyEmailOtp(
    @Body() verifyEmailOtpDto: VerifyEmailOtpDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    const ipAddress = request.ip;
    const userAgent = request.get('User-Agent');
    return await this.authService.verifyEmailOtp(
      verifyEmailOtpDto.email,
      verifyEmailOtpDto.otp,
      ipAddress,
      userAgent,
    );
  }

  @Public()
  @Post('resend-email-otp')
  @HttpCode(HttpStatus.OK)
  @ApiPostOperation('Resend email OTP', Object, 'Resend OTP for email verification.', false)
  @ApiBody({ type: ResendEmailOtpDto })
  async resendEmailOtp(
    @Body() resendEmailOtpDto: ResendEmailOtpDto,
  ): Promise<{ success: boolean; message: string }> {
    return await this.authService.resendEmailOtp(resendEmailOtpDto.email);
  }

  @Public()
  @Post('phone/verify')
  @HttpCode(HttpStatus.OK)
  @ApiPostOperation(
    'Request phone verification',
    Object,
    'Send verification code to phone number via SMS or WhatsApp.',
    false,
  )
  @ApiBody({ type: PhoneVerificationDto })
  async requestPhoneVerification(
    @Body() phoneVerificationDto: PhoneVerificationDto,
    @Req() request: Request,
  ): Promise<{ message: string }> {
    const ipAddress = request.ip;
    const userAgent = request.get('User-Agent');

    await this.authService.requestPhoneVerification(phoneVerificationDto, ipAddress, userAgent);
    return { message: 'Verification code sent successfully' };
  }

  @Public()
  @Post('phone/verify/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiPostOperation(
    'Confirm phone verification',
    Object,
    'Verify phone number using the received verification code.',
    false,
  )
  @ApiBody({ type: PhoneVerificationConfirmDto })
  async confirmPhoneVerification(
    @Body() phoneVerificationConfirmDto: PhoneVerificationConfirmDto,
    @Req() request: Request,
  ): Promise<{ message: string; verified: boolean }> {
    const ipAddress = request.ip;
    const userAgent = request.get('User-Agent');

    const verified = await this.authService.confirmPhoneVerification(
      phoneVerificationConfirmDto,
      ipAddress,
      userAgent,
    );
    return {
      message: verified ? 'Phone verified successfully' : 'Invalid verification code',
      verified,
    };
  }

  @Public()
  @Post('register/email')
  @HttpCode(HttpStatus.OK)
  @ApiPostOperation(
    'Register with email',
    AuthResponseDto,
    'Register new user using email authentication.',
    false,
  )
  @ApiBody({ type: RegisterWithEmailDto })
  async registerWithEmail(
    @Body() registerWithEmailDto: RegisterWithEmailDto,
    @Req() request: Request,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const ipAddress = request.ip;
    const userAgent = request.get('User-Agent');

    return this.authService.registerWithEmail(registerWithEmailDto, ipAddress, userAgent);
  }

  @Public()
  @Post('register/phone')
  @HttpCode(HttpStatus.CREATED)
  @ApiPostOperation(
    'Register with phone number',
    AuthResponseDto,
    'Register new user using phone number authentication (WhatsApp or LINE).',
    false,
  )
  @ApiBody({ type: RegisterWithPhoneDto })
  async registerWithPhone(
    @Body() registerWithPhoneDto: RegisterWithPhoneDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    const ipAddress = request.ip;
    const userAgent = request.get('User-Agent');

    return this.authService.registerWithPhone(registerWithPhoneDto, ipAddress, userAgent);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiGetOperation(
    'Initiate Google OAuth',
    Object,
    'Redirects to Google OAuth consent screen. Pass domain as query parameter.',
    false,
  )
  async googleAuth(): Promise<void> {
    Logger.log('Google OAuth initiated via Passport');
  }

  @Public()
  @Get('google/mobile')
  @ApiGetOperation(
    'Google OAuth for mobile',
    AuthResponseDto,
    'Authenticate using Google ID token or authorization code from mobile SDK. Pass idToken or code as query parameter.',
    false,
  )
  async googleMobileAuth(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const code = req.query.code as string | undefined;
    const redirectScheme = req.query.state as string | undefined; // e.g., 'myapp'
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.get('User-Agent') || '';

    if (!code) {
      throw new Error('Either idToken or code query parameter is required');
    }
    // Logger.log('_+_+_+_+_+_ START +_+_+_+_+_+_+_+_+');

    // Logger.log('====== code', code);
    // Logger.log('====== redirectScheme', redirectScheme);
    // Logger.log('====== ipAddress', ipAddress);
    // Logger.log('====== userAgent', userAgent);

    const result = await this.authService.handleGoogleMobileOAuth(
      { code: code, redirectScheme: redirectScheme },
      ipAddress,
      userAgent,
    );
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiGetOperation(
    'Google OAuth callback',
    AuthResponseDto,
    'Handles Google OAuth callback and authenticates user.',
    false,
  )
  async googleAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // state is available in req.query.state for CSRF validation if needed
    await this.databaseService.knex('logs').insert({
      short_message: 'Google OAuth callback received',
      full_message: JSON.stringify({
        googleUser: req.user,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        frontendUrl: process.env.FRONTEND_URL,
      }),
      log_level: 'INFO',
      user_id: null,
      tenant_id: null,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });
    const googleUser = (req as any).user;
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.get('User-Agent') || '';
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, ''); // Remove trailing slash

    try {
      const authResponse = await this.authService.handleGoogleOAuth(
        googleUser,
        ipAddress,
        userAgent,
      );
      const loginResponse = await this.authService.login({
        identifier: authResponse.identifier,
        authMethod: AuthMethod.OAUTH,
        tenantId: authResponse.tenantId,
        oauthData: authResponse.oauthData,
      });

      const redirectUrl = new URL(`${frontendUrl}/oauth/callback`);
      redirectUrl.searchParams.set('accessToken', loginResponse.data!.accessToken);
      redirectUrl.searchParams.set('refreshToken', loginResponse.data!.refreshToken);
      redirectUrl.searchParams.set('user', JSON.stringify(loginResponse.data!.user));

      res.redirect(redirectUrl.toString());
    } catch (error) {
      Logger.error('Google OAuth callback error:', error);
      const redirectUrl = new URL(`${frontendUrl}/login`);
      redirectUrl.searchParams.set('error', 'oauth_failed');
      redirectUrl.searchParams.set(
        'message',
        (error as any).message || 'OAuth authentication failed',
      );

      res.redirect(redirectUrl.toString());
    }
  }
}
