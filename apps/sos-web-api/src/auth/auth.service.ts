import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  AuthenticationService,
  PasswordUtils,
} from '@strengthos/shared-security';
import { RequestContext, Results, UserStatus } from '@strengthos/shared-types';
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
  AuthMethod,
  ValidateResetPasswordTokenDto,
} from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Knex } from 'knex';
import { DatabaseService } from '@/database';
import { EmailService } from '@/email/services/email.service';
import { randomBytes, randomInt } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AuthenticationService')
    private readonly authenticationService: AuthenticationService,
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService,
    private passwordUtils: PasswordUtils,
  ) {}

  protected get knex(): Knex {
    return this.databaseService.knex;
  }

  private async logToDatabase(
    logData: {
      shortMessage: string;
      fullMessage?: string;
      userId?: string;
      tenantId?: string;
      ip?: string;
      userAgent?: string;
      url?: string;
    },
    logLevel: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR',
  ): Promise<void> {
    await this.databaseService.knex('logs').insert({
      short_message: logData.shortMessage,
      full_message: logData.fullMessage,
      log_level: logLevel,
      user_id: logData.userId,
      tenant_id: logData.tenantId,
      ip_address: logData.ip,
      user_agent: logData.userAgent,
      url: logData.url,
    });
  }

  async login(
    loginDto: LoginDto,
    ipAddress?: string | undefined,
    userAgent?: string,
  ): Promise<Results<AuthResponseDto>> {
    try {
      const loginRequest = {
        identifier: loginDto.identifier,
        password: loginDto.password,
        authMethod: loginDto.authMethod,
        tenantId: loginDto.tenantId,
        rememberMe: loginDto.rememberMe || false,
        verificationToken: loginDto.verificationToken,
        oauthData: loginDto.oauthData,
        ipAddress: ipAddress,
        userAgent: userAgent,
      };

      const result = await this.authenticationService.login(loginRequest);

      if (!result.isOk) {
        if (result.message === 'pending_verification') {
          if (loginDto.datafrom && loginDto.datafrom === 'application') {
            const user = await this.knex('users')
              .where({ email: loginDto.identifier })
              .first();

            if (
              user &&
              user.status === 'PENDING_VERIFICATION' &&
              user.auth_providers?.mobileapp
            ) {
              const mobileAuth = user.auth_providers.mobileapp;
              const now = new Date();
              const otpExpiry = mobileAuth.datetime
                ? new Date(mobileAuth.datetime)
                : new Date(0); // Default to epoch if no datetime

              // Check if expired
              if (now > otpExpiry || !mobileAuth.otp) {
                const otp = randomInt(100000, 999999).toString();
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 1);

                const providers = user.auth_providers;
                providers.mobileapp = {
                  otp,
                  datetime: expiresAt,
                };

                await this.knex('users').where({ id: user.id }).update({
                  auth_providers: providers,
                });

                // Try to send email again if possible, or just generate as requested
                // Assuming sendEmail logic matches register flow:
                await this.emailService.sendEmail(user.email, {
                  subject: 'Verification Code',
                  text: `Your verification code is ${otp}`,
                });
              }
              const sanitizedUser: any =
                await this.authenticationService.sanitizeUser(user);
              sanitizedUser.status = user.status;
              return Results.ok(
                {
                  user: sanitizedUser,
                  accessToken: null,
                  refreshToken: null,
                  expiresAt: null,
                },
                'verify_otp',
              );
            }
          }
          throw new UnauthorizedException('pending_verification');
        } else if (result.message === 'pending_approval') {
          throw new UnauthorizedException('pending_approval');
        } else {
          await this.logToDatabase(
            {
              shortMessage: 'Login attempt failed',
              ip: ipAddress,
              userAgent: userAgent,
              url: '/api/auth/login',
              fullMessage: JSON.stringify({
                authMethod: loginDto.authMethod,
              }),
            },
            'WARNING',
          );
        }

        throw new UnauthorizedException(
          result.message || 'Invalid credentials',
        );
      }

      if (result.returnValue) {
        // Handle null tenant_id - user may not be assigned to a tenant yet
        if (result.returnValue!.user.tenantId) {
          const tenant = await this.knex('tenants')
            .where('id', result.returnValue!.user.tenantId)
            .first();
          result.returnValue!.user.tenantName = tenant?.name || null;
          result.returnValue!.user.freePlan =
            tenant?.is_free === true ? true : false;
        } else {
          result.returnValue!.user.tenantName = null;
          result.returnValue!.user.freePlan = false;
        }
        return Results.ok({
          user: result.returnValue!.user,
          accessToken: result.returnValue!.accessToken,
          refreshToken: result.returnValue!.refreshToken,
          expiresAt: result.returnValue!.expiresAt,
        });
      }

      return Results.fail<AuthResponseDto>(
        null,
        result.message || 'Login failed',
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      await this.logToDatabase(
        {
          shortMessage: 'Login service error: ' + (error as any).message,
          ip: ipAddress,
          fullMessage: JSON.stringify({
            identifier: loginDto.identifier,
            authMethod: loginDto.authMethod,
          }),
        },
        'ERROR',
      );

      throw new UnauthorizedException(error.message || 'Authentication failed');
    }
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    try {
      const refreshRequest = {
        refreshToken: refreshTokenDto.refreshToken,
        ipAddress,
        userAgent,
      };

      const result =
        await this.authenticationService.refreshToken(refreshRequest);

      if (!result.isOk) {
        await this.logToDatabase(
          {
            shortMessage: 'Token refresh failed',
            ip: ipAddress,
            userAgent: userAgent,
            url: '/api/auth/refresh-token',
            fullMessage: result.message || 'Invalid refresh token',
          },
          'WARNING',
        );
        throw new UnauthorizedException(
          result.message || 'Invalid refresh token',
        );
      }

      if (result.returnValue) {
        // Handle null tenant_id - user may not be assigned to a tenant yet
        if (result.returnValue!.user.tenantId) {
          const tenant = await this.knex('tenants')
            .where('id', result.returnValue!.user.tenantId)
            .first();
          result.returnValue!.user.tenantName = tenant?.name || null;
        } else {
          result.returnValue!.user.tenantName = null;
        }
        return result.returnValue!;
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      await this.logToDatabase(
        {
          shortMessage: 'Token refresh service error',
          ip: ipAddress,
          userAgent: userAgent,
          url: '/api/auth/refresh-token',
          fullMessage: JSON.stringify({
            refreshToken: refreshTokenDto.refreshToken,
            result: error.message,
          }),
        },
        'ERROR',
      );

      throw new UnauthorizedException('Token refresh failed');
    }
  }

  async switchTenantContext(
    userId: string,
    newTenantId: string,
    currentRefreshToken: string,
  ): Promise<AuthResponseDto> {
    try {
      const result = await this.authenticationService.switchTenantContext(
        userId,
        newTenantId,
        currentRefreshToken,
      );

      if (!result.isOk) {
        await this.logToDatabase(
          {
            shortMessage: 'Tenant switch failed',
            userId,
            tenantId: newTenantId,
            url: '/api/auth/switch-tenant',
          },
          'WARNING',
        );
        throw new BadRequestException(
          result.message || 'Failed to switch tenant',
        );
      }

      return result.returnValue!;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      await this.logToDatabase(
        {
          shortMessage: 'Tenant switch service error',
          userId,
          tenantId: newTenantId,
          url: '/api/auth/switch-tenant',
          fullMessage: JSON.stringify({
            newTenantId,
            currentRefreshToken: currentRefreshToken.substring(0, 10) + '...',
          }),
        },
        'ERROR',
      );

      throw new BadRequestException('Tenant switch failed');
    }
  }

  async logout(user: RequestContext, token: string): Promise<void> {
    try {
      const result = await this.authenticationService.logout(
        user.userId,
        token,
      );

      if (!result.isOk) {
        await this.logToDatabase(
          {
            shortMessage: 'Logout failed',
            userId: user.userId,
            tenantId: user.tenantId,
            url: '/api/auth/logout',
          },
          'ERROR',
        );
        throw new BadRequestException(result.message || 'Logout failed');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      await this.logToDatabase(
        {
          shortMessage: 'Logout service error: ' + (error as any).message,
          userId: user.userId,
          tenantId: user.tenantId,
          url: '/api/auth/logout',
          fullMessage: JSON.stringify({
            userId: user.userId,
            tenantId: user.tenantId,
          }),
        },
        'ERROR',
      );

      throw new BadRequestException('Logout failed');
    }
  }

  async changePassword(
    user: RequestContext,
    changePasswordDto: ChangePasswordDto,
  ): Promise<Record<string, any> | null> {
    try {
      const changeRequest = {
        userId: user.userId,
        currentPassword: changePasswordDto.currentPassword,
        newPassword: changePasswordDto.newPassword,
      };

      const result =
        await this.authenticationService.changePassword(changeRequest);

      if (!result.isOk) {
        throw new BadRequestException(
          result.message || 'Password change failed',
        );
      }

      if (result.returnValue) {
        // Handle null tenant_id - user may not be assigned to a tenant yet
        if (result.returnValue!.user.tenantId) {
          const tenant = await this.knex('tenants')
            .where('id', result.returnValue!.user.tenantId)
            .first();
          result.returnValue!.user.tenantName = tenant?.name || null;
        } else {
          result.returnValue!.user.tenantName = null;
        }
        return result.returnValue!;
      }

      return null;
    } catch (error) {
      await this.logToDatabase(
        {
          shortMessage: 'Password change failed',
          fullMessage: JSON.stringify({
            result: error.message,
          }),
          userId: user.userId,
          tenantId: user.tenantId,
          url: '/api/auth/change-password',
        },
        'WARNING',
      );
      if (error instanceof BadRequestException) {
        throw error;
      }

      await this.logToDatabase(
        {
          shortMessage:
            'Password change service error: ' + (error as any).message,
          userId: user.userId,
          tenantId: user.tenantId,
          url: '/api/auth/change-password',
          fullMessage: JSON.stringify({
            currentPassword: changePasswordDto.currentPassword,
            newPassword: changePasswordDto.newPassword,
          }),
        },
        'ERROR',
      );

      throw new BadRequestException('Password change failed');
    }
  }

  async setupPassword(
    user: RequestContext,
    changePasswordDto: ChangePasswordDto,
  ): Promise<Record<string, any> | null> {
    try {
      const setupRequest = {
        userId: user.userId,
        newPassword: changePasswordDto.newPassword,
      };

      const checkUser = await this.databaseService
        .knex('users')
        .where('id', user.userId)
        .first();

      if (checkUser.password_hash !== null) {
        throw new BadRequestException('Already setup password');
      } else {
        const validation = this.passwordUtils.validatePassword(
          setupRequest.newPassword,
        );

        if (!validation.isValid) {
          return Results.fail<Record<string, any> | null>(
            null,
            `Password validation failed: ${validation.errors.join(', ')}`,
          );
        }

        const hashResult = await this.passwordUtils.hashPassword(
          setupRequest.newPassword,
        );
        if (!hashResult.isOk) {
          return Results.fail<Record<string, any> | null>(
            null,
            'Failed to hash new password',
          );
        }

        return await this.databaseService.knex.transaction(async (trx) => {
          // Update password
          await trx('users').where({ id: setupRequest.userId }).update({
            password_hash: hashResult.returnValue!.hashedPassword,
            salt: hashResult.returnValue!.salt,
            updated_at: new Date(),
          });

          // Construct updated user object (avoid unnecessary query)
          const updatedUser = {
            ...user,
            password_hash: hashResult.returnValue!.hashedPassword,
            salt: hashResult.returnValue!.salt,
            updated_at: new Date(),
          };

          // Invalidate all existing sessions
          await trx('user_sessions')
            .where({ user_id: setupRequest.userId, is_revoked: false })
            .update({
              is_revoked: true,
              revoked_at: new Date(),
              revoked_reason: 'password_changed',
            });

          // Generate new tokens
          const tokenResult =
            await this.authenticationService.generateTokens(updatedUser);
          if (!tokenResult.isOk) {
            throw new Error('Failed to generate new tokens');
          }

          // Create new session with the new tokens
          await trx('user_sessions').insert({
            user_id: updatedUser.userId,
            access_token_jti: tokenResult.returnValue!.accessToken,
            refresh_token: tokenResult.returnValue!.refreshToken,
            expires_at: tokenResult.returnValue!.expiresAt,
            ip_address: null, // IP/UA not available in change password request
            user_agent: null,
          });

          const userResult =
            await this.authenticationService.sanitizeUser(updatedUser);

          const tenant = await this.knex('tenants')
            .where('id', userResult.tenantId)
            .first();

          return Results.ok({
            user: userResult,
            accessToken: tokenResult.returnValue!.accessToken,
            refreshToken: tokenResult.returnValue!.refreshToken,
            expiresAt: tokenResult.returnValue!.expiresAt,
            tenantName: tenant,
          });
        });
      }
    } catch (error) {
      await this.logToDatabase(
        {
          shortMessage: 'Password change failed',
          fullMessage: JSON.stringify({
            result: error.message,
          }),
          userId: user.userId,
          tenantId: user.tenantId,
          url: '/api/auth/change-password',
        },
        'WARNING',
      );
      if (error instanceof BadRequestException) {
        throw error;
      }

      await this.logToDatabase(
        {
          shortMessage:
            'Password change service error: ' + (error as any).message,
          userId: user.userId,
          tenantId: user.tenantId,
          url: '/api/auth/change-password',
          fullMessage: JSON.stringify({
            currentPassword: changePasswordDto.currentPassword,
            newPassword: changePasswordDto.newPassword,
          }),
        },
        'ERROR',
      );

      throw new BadRequestException('Password change failed');
    }
  }

  async validateSession(accessToken: string): Promise<RequestContext> {
    try {
      const result =
        await this.authenticationService.validateSession(accessToken);

      if (!result.isOk) {
        throw new UnauthorizedException(result.message || 'Invalid session');
      }

      return result.returnValue!;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      await this.logToDatabase(
        {
          shortMessage: 'Session validation error',
          url: '/api/auth/validate-session',
          fullMessage: (error as any).message,
        },
        'ERROR',
      );
      throw new UnauthorizedException('Session validation failed');
    }
  }

  async sendResetPasswordEmail(
    sendResetPasswordEmailDto: SendResetPasswordEmailDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      const user = await this.knex('users')
        .where({ email: sendResetPasswordEmailDto.email })
        .first();

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const checkAuthToken = await this.knex('password_reset_tokens')
        .where({ user_id: user.id })
        .where('expires_at', '>', new Date())
        .where('used', false)
        .first();

      if (checkAuthToken) {
        throw new BadRequestException('Password reset token already exists');
      }

      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      await this.knex('password_reset_tokens').insert({
        user_id: user.id,
        tenant_id: user.tenant_id,
        token: resetToken,
        expires_at: expiresAt,
        created_at: new Date(),
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      await this.emailService.sendEmail(user.email, {
        subject: 'Password Reset',
        text: `Please click the link below to reset your password: ${process.env.APP_URL}reset-password/${resetToken}`,
      });

      await this.logToDatabase(
        {
          shortMessage: 'Password reset email sent',
          ip: ipAddress,
          userAgent: userAgent,
          url: '/api/auth/send-reset-password-email',
          fullMessage: JSON.stringify({
            email: sendResetPasswordEmailDto.email,
          }),
        },
        'INFO',
      );
    } catch (error) {
      await this.logToDatabase(
        {
          shortMessage:
            'Send reset password email service error: ' +
            (error as any).message,
          ip: ipAddress,
          userAgent: userAgent,
          url: '/api/auth/send-reset-password-email',
          fullMessage: JSON.stringify({
            email: sendResetPasswordEmailDto.email,
          }),
        },
        'WARNING',
      );
    }
  }

  async validateResetPasswordToken(
    validateResetPasswordTokenDto: ValidateResetPasswordTokenDto,
  ): Promise<Record<string, any> | null> {
    try {
      const result =
        await this.authenticationService.validateResetPasswordToken(
          validateResetPasswordTokenDto,
        );

      Logger.log(result);

      if (!result.isOk) {
        return {
          success: false,
          message:
            result.returnValue!.message ||
            'Password reset token validation failed',
          userId: null,
        };
      }

      return {
        success: true,
        message: 'Password reset token validated',
        userId: result.returnValue!.userId,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
    }
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.authenticationService.resetPassword({
        token: resetPasswordDto.token,
        userId: resetPasswordDto.userId,
        newPassword: resetPasswordDto.newPassword,
      });

      if (!result.isOk) {
        return {
          success: false,
          message: result.returnValue!.message,
        };
      }

      return {
        success: true,
        message: result.returnValue!.message,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      await this.logToDatabase(
        {
          shortMessage:
            'Reset password service error: ' + (error as any).message,
          userId: resetPasswordDto.userId,
          url: '/api/auth/reset-password',
          fullMessage: JSON.stringify({
            newPassword: resetPasswordDto.newPassword,
            result: error.message,
          }),
        },
        'ERROR',
      );

      throw new BadRequestException('Password reset failed');
    }
  }

  async getUserSessions(userId: string): Promise<any[]> {
    try {
      const result = await this.authenticationService.getUserSessions(userId);

      if (!result.isOk) {
        throw new BadRequestException(
          result.message || 'Failed to retrieve sessions',
        );
      }

      return result.returnValue || [];
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      await this.logToDatabase(
        {
          shortMessage:
            'Get user sessions service error: ' + (error as any).message,
          userId: userId,
          url: '/api/auth/get-user-sessions',
          fullMessage: JSON.stringify({
            userId: userId,
          }),
        },
        'ERROR',
      );

      throw new BadRequestException('Failed to retrieve sessions');
    }
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    try {
      const result = await this.authenticationService.revokeSession(
        userId,
        sessionId,
      );

      if (!result.isOk) {
        await this.logToDatabase(
          {
            shortMessage: 'Session revocation failed',
            userId: userId,
            url: '/api/auth/revoke-session',
            fullMessage: JSON.stringify({
              sessionId: sessionId,
            }),
          },
          'ERROR',
        );
        throw new BadRequestException(
          result.message || 'Failed to revoke session',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      await this.logToDatabase(
        {
          shortMessage:
            'Revoke session service error: ' + (error as any).message,
          userId: userId,
          url: '/api/auth/revoke-session',
          fullMessage: JSON.stringify({
            sessionId: sessionId,
          }),
        },
        'ERROR',
      );

      throw new BadRequestException('Failed to revoke session');
    }
  }

  async logoutAllSessions(userId: string): Promise<void> {
    try {
      const result = await this.authenticationService.logoutAllSessions(userId);

      if (!result.isOk) {
        throw new BadRequestException(
          result.message || 'Failed to logout all sessions',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to logout all sessions');
    }
  }

  async sendEmailVerification(userId: string): Promise<void> {
    try {
      const user = await this.knex('users').where({ id: userId }).first();

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const verificationToken = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      await this.knex('email_verification_tokens').insert({
        user_id: userId,
        tenant_id: user.tenant_id,
        email: user.email,
        token: verificationToken,
        expires_at: expiresAt,
        created_at: new Date(),
      });

      const result = await this.emailService.sendEmail(user.email, {
        subject: 'Email Verification',
        text: `Please verify your email by clicking the link below: ${process.env.APP_URL}verify-email?token=${verificationToken}`,
      });

      if (!result.success) {
        await this.logToDatabase(
          {
            shortMessage: 'Send email verification failed',
            userId: userId,
            // tenantId: user.tenantId,
            url: '/api/auth/send-email-verification',
            fullMessage: JSON.stringify({
              userId: userId,
              email: user.email,
              verificationToken: verificationToken,
              expiresAt: expiresAt,
              createdAt: new Date(),
            }),
          },
          'ERROR',
        );
        throw new BadRequestException(
          result.error?.message || 'Failed to send verification email',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      await this.logToDatabase(
        {
          shortMessage:
            'Send email verification service error: ' + (error as any).message,
          userId: userId,
          url: '/api/auth/send-email-verification',
          fullMessage: JSON.stringify({
            userId: userId,
          }),
        },
        'ERROR',
      );

      throw new BadRequestException('Failed to send verification email');
    }
  }

  async verifyEmail(
    token: string,
  ): Promise<{ status: boolean; message: string }> {
    return await this.authenticationService.verifyEmail(token);
  }

  async requestPhoneVerification(
    phoneVerificationDto: PhoneVerificationDto,
    ipAddress?: string,
    _userAgent?: string,
  ): Promise<void> {
    try {
      const request = {
        phoneNumber: phoneVerificationDto.phoneNumber,
        method: phoneVerificationDto.method,
      };

      const result =
        await this.authenticationService.requestPhoneVerification(request);

      if (!result.isOk) {
        throw new BadRequestException(
          result.message || 'Failed to send verification code',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      await this.logToDatabase(
        {
          shortMessage: 'Phone verification request service error',
          ip: ipAddress,
          url: '/api/auth/request-phone-verification',
          fullMessage: JSON.stringify({
            stackTrace: (error as any).stack,
            message: (error as any).message,
          }),
        },
        'ERROR',
      );

      throw new BadRequestException('Failed to send verification code');
    }
  }

  async confirmPhoneVerification(
    phoneVerificationConfirmDto: PhoneVerificationConfirmDto,
    ipAddress?: string,
    _userAgent?: string,
  ): Promise<boolean> {
    try {
      const request = {
        phoneNumber: phoneVerificationConfirmDto.phoneNumber,
        token: phoneVerificationConfirmDto.token,
      };

      const result =
        await this.authenticationService.confirmPhoneVerification(request);

      if (!result.isOk) {
        return false;
      }

      return result.returnValue || false;
    } catch (error) {
      await this.logToDatabase(
        {
          shortMessage: 'Phone verification confirmation service error',
          ip: ipAddress,
          userAgent: _userAgent,
          url: '/api/auth/confirm-phone-verification',
          fullMessage: JSON.stringify({
            stackTrace: (error as any).stack,
            message: (error as any).message,
          }),
        },
        'ERROR',
      );

      return false;
    }
  }

  async registerWithPhone(
    registerWithPhoneDto: RegisterWithPhoneDto,
    ipAddress?: string,
    _userAgent?: string,
  ): Promise<AuthResponseDto> {
    try {
      const request = {
        phoneNumber: registerWithPhoneDto.phoneNumber,
        authMethod: registerWithPhoneDto.authMethod,
        profile: registerWithPhoneDto.profile,
        preferences: registerWithPhoneDto.preferences,
        verificationToken: registerWithPhoneDto.verificationToken,
        whatsappData: registerWithPhoneDto.whatsappData,
        lineData: registerWithPhoneDto.lineData,
      };

      const result =
        await this.authenticationService.registerWithPhone(request);

      if (!result.isOk) {
        throw new BadRequestException(result.message || 'Registration failed');
      }
      return result.returnValue!;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      await this.logToDatabase(
        {
          shortMessage: 'Phone registration service error',
          ip: ipAddress,
          url: '/api/auth/register-with-phone',
          fullMessage: JSON.stringify({
            stackTrace: (error as any).stack,
            message: (error as any).message,
          }),
        },
        'ERROR',
      );

      throw new BadRequestException('Registration failed');
    }
  }

  async registerWithEmail(
    registerWithEmailDto: RegisterWithEmailDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Users register without a tenant_id - they will be assigned when invited
      const request = {
        firstName: registerWithEmailDto.firstName,
        lastName: registerWithEmailDto.lastName,
        email: registerWithEmailDto.email,
        authMethod: registerWithEmailDto.authMethod,
        password: registerWithEmailDto.password,
        role: registerWithEmailDto.role,
      };

      const result =
        await this.authenticationService.registerWithEmail(request);
      if (!result.success) {
        return {
          success: false,
          message: result.message || 'Registration failed',
        };
      }

      if (registerWithEmailDto.datafrom === 'application') {
        const otp = randomInt(100000, 999999).toString();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        const user = await this.knex('users')
          .where({ id: result.userId })
          .first();
        const providers = user.auth_providers || {};
        providers.mobileapp = {
          otp,
          datetime: expiresAt,
        };

        await this.knex('users').where({ id: result.userId }).update({
          status: UserStatus.PENDING_VERIFICATION,
          auth_providers: providers,
        });

        await this.emailService.sendEmail(request.email, {
          subject: 'Verification Code',
          text: `Your verification code is ${otp}`,
        });
      } else {
        // await this.sendEmailVerification(result.userId);
      }

      return {
        success: true,
        message: result.message || 'Registration successful',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      await this.logToDatabase(
        {
          shortMessage: 'Email registration service error',
          ip: ipAddress,
          userAgent: userAgent,
          url: '/api/auth/register-with-email',
          fullMessage: JSON.stringify({
            stackTrace: (error as any).stack,
            message: (error as any).message,
          }),
        },
        'ERROR',
      );

      throw new BadRequestException('Registration failed');
    }
  }

  async handleGoogleOAuth(
    googleUser: {
      googleId: string;
      email: string;
      firstName: string;
      lastName: string;
      picture?: string;
      accessToken?: string;
      refreshToken?: string;
    },
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    identifier: string;
    authMethod: 'OAUTH';
    tenantId: string;
    oauthData: {
      provider: string;
      googleId: string;
      email: string;
      firstName: string;
      lastName: string;
      picture: string;
    };
    ipAddress?: string;
    userAgent?: string;
  }> {
    try {
      // Normalize email to lowercase for consistent lookup
      const normalizedEmail = googleUser.email.toLowerCase();

      // Check if user exists with this email
      const existingUser = await this.knex('users')
        .where({ email: normalizedEmail })
        .first();

      let user;
      if (existingUser) {
        // Update user with Google OAuth data and profile if needed
        const updateData: any = {
          updated_at: new Date(),
        };

        // Update OAuth providers
        const oauthProviders = existingUser.auth_providers || {};
        if (
          !oauthProviders.google ||
          oauthProviders.google.id !== googleUser.googleId
        ) {
          oauthProviders.google = {
            id: googleUser.googleId,
            accessToken: googleUser.accessToken,
            refreshToken: googleUser.refreshToken,
            picture: googleUser.picture,
          };
          updateData.auth_providers = oauthProviders;
        }

        // Update email verification if not already verified
        if (!existingUser.email_verified_at) {
          updateData.email_verified_at = new Date();
        }

        // Update name if missing or if it's just the email prefix (indicating it was auto-generated)
        const emailPrefix = normalizedEmail.split('@')[0];
        if (
          !existingUser.first_name ||
          existingUser.first_name === emailPrefix ||
          existingUser.first_name.toLowerCase() === emailPrefix
        ) {
          updateData.first_name = googleUser.firstName || emailPrefix;
        }
        if (!existingUser.last_name) {
          updateData.last_name = googleUser.lastName || '';
        }

        // Update picture if available and not set
        if (googleUser.picture && !oauthProviders.google?.picture) {
          oauthProviders.google = oauthProviders.google || {};
          oauthProviders.google.picture = googleUser.picture;
          updateData.auth_providers = oauthProviders;
        }

        if (Object.keys(updateData).length > 1) {
          // More than just updated_at
          await this.knex('users')
            .where({ id: existingUser.id })
            .update(updateData);
        }

        // Refresh user data after update
        user = await this.knex('users').where({ id: existingUser.id }).first();
      } else {
        // Create new user
        const userId = this.generateUserId();
        const now = new Date();
        const FreeTenant = await this.knex('tenants')
          .where('is_free', true)
          .first();

        const userData = {
          id: userId,
          tenant_id: FreeTenant.id,
          email: normalizedEmail,
          first_name: googleUser.firstName || normalizedEmail.split('@')[0],
          last_name: googleUser.lastName || '',
          role: 'ATHLETE',
          status: 'ACTIVE',
          email_verified_at: now,
          auth_providers: {
            google: {
              id: googleUser.googleId,
              accessToken: googleUser.accessToken,
              refreshToken: googleUser.refreshToken,
              picture: googleUser.picture,
            },
          },
          created_at: now,
          updated_at: now,
        };

        await this.knex('users').insert(userData);
        user = userData;
      }

      const loginRequest = {
        identifier: normalizedEmail,
        authMethod: 'OAUTH' as const,
        tenantId: user.tenant_id,
        oauthData: {
          provider: 'google',
          googleId: googleUser.googleId,
          email: normalizedEmail,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          picture: googleUser.picture,
        },
        ipAddress,
        userAgent,
      };

      return loginRequest;
    } catch (error) {
      await this.logToDatabase(
        {
          shortMessage: 'Google OAuth authentication error',
          ip: ipAddress,
          userAgent: userAgent,
          url: '/api/auth/google/callback',
          fullMessage: JSON.stringify({
            stackTrace: (error as any).stack,
            message: (error as any).message,
            googleEmail: googleUser.email,
            googleId: googleUser.googleId,
          }),
        },
        'ERROR',
      );

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('OAuth authentication failed');
    }
  }

  /**
   * Handle Google OAuth for mobile apps
   * Accepts either idToken (from Google Sign-In SDK) or authorization code
   */
  async handleGoogleMobileOAuth(
    body: { code?: string; redirectScheme?: string },
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Results<AuthResponseDto>> {
    const logger = new Logger('AuthService');
    Logger.log('on mobile application =-=-=-=-=-=-=-=-=-=-=-=');
    try {
      let googleUser: {
        googleId: string;
        email: string;
        firstName: string;
        lastName: string;
        picture?: string;
      };

      Logger.log('googleUser =-=-=-=-=-=-=-=-=-=-=-=', googleUser);

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      Logger.log('clientId =-=-=-=-=-=-=-=-=-=-=-=', clientId);
      Logger.log('clientSecret =-=-=-=-=-=-=-=-=-=-=-=', clientSecret);

      const client = new OAuth2Client(clientId, clientSecret);

      const mobileRedirectUri = body.redirectScheme || '';

      try {
        const { tokens } = await client.getToken({
          code: body.code,
          redirect_uri: mobileRedirectUri,
        });

        if (!tokens.id_token) {
          throw new UnauthorizedException('No ID token received from Google');
        }

        // Verify the received ID token
        const ticket = await client.verifyIdToken({
          idToken: tokens.id_token,
          audience: clientId,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
          throw new UnauthorizedException('Invalid Google ID token');
        }

        googleUser = {
          googleId: payload.sub!,
          email: payload.email.toLowerCase(),
          firstName: payload.given_name || '',
          lastName: payload.family_name || '',
          picture: payload.picture,
        };
      } catch (codeError) {
        const errorMessage = (codeError as Error).message;
        logger.error(
          `Failed to exchange authorization code: ${errorMessage}`,
          (codeError as Error).stack,
        );

        // Provide more helpful error message for common issues
        let userMessage = `Failed to exchange authorization code: ${errorMessage}`;
        if (errorMessage.includes('invalid_grant')) {
          userMessage +=
            '. This usually means: (1) the authorization code was already used (codes are single-use), or (2) the code has expired (codes expire in ~10 minutes).';
        }

        throw new UnauthorizedException(userMessage);
      }

      // Use existing handleGoogleOAuth logic
      const authResponse = await this.handleGoogleOAuth(
        googleUser,
        ipAddress,
        userAgent,
      );

      // Login and return tokens
      return this.login({
        identifier: authResponse.identifier,
        authMethod: AuthMethod.OAUTH,
        tenantId: authResponse.tenantId,
        oauthData: authResponse.oauthData,
      });
    } catch (error) {
      await this.logToDatabase(
        {
          shortMessage: 'Google Mobile OAuth error',
          ip: ipAddress,
          userAgent: userAgent,
          url: '/api/auth/google/mobile',
          fullMessage: JSON.stringify({
            stackTrace: (error as any).stack,
            message: (error as any).message,
          }),
        },
        'ERROR',
      );

      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new UnauthorizedException('Mobile OAuth authentication failed');
    }
  }

  async verifyEmailOtp(
    email: string,
    otp: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    try {
      const user = await this.knex('users').where({ email }).first();

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (!user.auth_providers?.mobileapp) {
        throw new BadRequestException('No verification pending');
      }

      const mobileAuth = user.auth_providers.mobileapp;

      if (String(mobileAuth.otp) !== String(otp)) {
        throw new BadRequestException('Invalid OTP');
      }

      const expiry = new Date(mobileAuth.datetime);
      if (new Date() > expiry) {
        throw new BadRequestException('OTP expired');
      }

      const providers = user.auth_providers;
      delete providers.mobileapp;

      await this.knex('users').where({ id: user.id }).update({
        status: 'ACTIVE',
        auth_providers: providers,
        email_verified_at: new Date(),
        updated_at: new Date(),
      });

      // Prepare user object for token generation
      // We need to map the raw DB user to the expected shape if necessary
      // Assuming generateTokens handles the partial/db user object correctly as seen in setupPassword
      const updatedUser = {
        ...user,
        status: 'ACTIVE',
        auth_providers: providers,
        email_verified_at: new Date(),
      };

      // Ensure userId/id field compatibility. shared-lib might expect 'userId' or 'id'.
      // In setupPassword it uses `updatedUser` which comes from RequestContext (has userId).
      // Here `user` is from knex (has id).
      // Let's normalize.
      const userForToken = {
        ...updatedUser,
        userId: user.id, // Ensure userId is present if needed by library
        id: user.id,
      };

      const tokenResult =
        await this.authenticationService.generateTokens(userForToken);

      if (!tokenResult.isOk) {
        throw new Error('Failed to generate tokens');
      }

      // Create session
      await this.knex('user_sessions').insert({
        user_id: user.id,
        access_token_jti: tokenResult.returnValue!.accessToken,
        refresh_token: tokenResult.returnValue!.refreshToken,
        expires_at: tokenResult.returnValue!.expiresAt,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date(),
      });

      const sanitizedUser =
        await this.authenticationService.sanitizeUser(userForToken);

      let tenantName = null;
      let freePlan = false;

      if (sanitizedUser.tenantId) {
        const tenant = await this.knex('tenants')
          .where('id', sanitizedUser.tenantId)
          .first();
        tenantName = tenant?.name || null;
        freePlan = tenant?.is_free === true;
      }

      // Append extra info if needed, similar to login response
      sanitizedUser.tenantName = tenantName;
      sanitizedUser.freePlan = freePlan;

      return {
        user: sanitizedUser,
        accessToken: tokenResult.returnValue!.accessToken,
        refreshToken: tokenResult.returnValue!.refreshToken,
        expiresAt: tokenResult.returnValue!.expiresAt,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      await this.logToDatabase(
        {
          shortMessage: 'Verify Email OTP error',
          fullMessage: JSON.stringify({
            error: (error as any).message,
            email,
          }),
        },
        'ERROR',
      );
      throw new BadRequestException('Verification failed');
    }
  }

  async resendEmailOtp(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.knex('users').where({ email }).first();

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // We allow resending if status is PENDING_VERIFICATION OR if they have mobileapp provider but maybe status got desynced?
      // Strict check on status is safer.
      if (user.status !== 'PENDING_VERIFICATION') {
        // Maybe they are trying to verify a new device/login?
        // For now, let's assume this is strictly for the initial registration/login flow where they are stuck.
        // If they need 2FA later, that's a different flow.
        // However, looking at login flow:
        // if (user && user.status === 'PENDING_VERIFICATION' && user.auth_providers?.mobileapp)
        // So we should stick to that.
        throw new BadRequestException(
          'User is already verified or not in pending state',
        );
      }

      const otp = randomInt(100000, 999999).toString();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const providers = user.auth_providers || {};
      providers.mobileapp = {
        otp,
        datetime: expiresAt,
      };

      await this.knex('users').where({ id: user.id }).update({
        auth_providers: providers,
        updated_at: new Date(),
      });

      await this.emailService.sendEmail(email, {
        subject: 'Verification Code',
        text: `Your new verification code is ${otp}`,
      });

      return {
        success: true,
        message: 'OTP resent successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      await this.logToDatabase(
        {
          shortMessage: 'Resend Email OTP error',
          fullMessage: JSON.stringify({
            error: (error as any).message,
            email,
          }),
        },
        'ERROR',
      );
      throw new BadRequestException('Failed to resend OTP');
    }
  }

  private generateUserId(): string {
    return uuidv4();
  }
}
