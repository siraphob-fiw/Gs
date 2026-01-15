// Authentication Service moved from human-lift-training-api/src/Services/Authentications/AuthService.ts
import { randomBytes } from 'crypto';
import { Results } from '@strengthos/shared-utils';
import { ILogger } from '@strengthos/shared-logging';
import { Logger as NestLogger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  User,
  UserStatus,
  SecurityEventType,
  RequestContext,
  UserRole,
} from '@strengthos/shared-types';
import { IDb } from '@strengthos/shared-database';
import { JwtService, JwtPayload, createJwtService } from './jwt';
import { PasswordUtils } from './password-utils';
import { ValidationUtils } from '@strengthos/shared-validation';

export interface AuthenticationConfig {
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  sessionTimeout: number; // in minutes
  requireEmailVerification: boolean;
  enableTwoFactor: boolean;
}

export interface LoginRequest {
  identifier: string; // Can be email or phone number
  password?: string; // Optional for phone-based auth
  authMethod: 'EMAIL' | 'WHATSAPP' | 'LINE' | 'OAUTH';
  tenantId?: string;
  rememberMe?: boolean;
  ipAddress?: string;
  userAgent?: string;
  verificationToken?: string; // For phone verification
  oauthData?: Record<string, any>; // For OAuth providers
}

export interface PhoneVerificationRequest {
  phoneNumber: string;
  method: 'SMS' | 'WHATSAPP';
}

export interface PhoneVerificationConfirm {
  phoneNumber: string;
  token: string;
}

export interface LoginResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface RefreshTokenRequest {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PasswordResetRequest {
  email: string;
  tenantId?: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface RegisterWithPhoneRequest {
  phoneNumber: string;
  authMethod: 'WHATSAPP' | 'LINE';
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
    bodyWeight?: number;
    height?: number;
    experienceLevel?: string;
  };
  preferences?: Record<string, any>;
  verificationToken: string;
  whatsappData?: Record<string, any>;
  lineData?: Record<string, any>;
}

export interface RegisterWithEmailRequest {
  firstName: string;
  lastName: string;
  email: string;
  authMethod: 'EMAIL';
  password: string;
  role: string;
}

export interface ChangePasswordRequest {
  userId: string;
  currentPassword?: string; // Optional for OAuth users setting initial password
  newPassword: string;
}

export class AuthenticationService {
  private static readonly DEFAULT_CONFIG: AuthenticationConfig = {
    maxLoginAttempts: 5,
    lockoutDuration: 30, // 30 minutes
    sessionTimeout: 1440, // 24 hours
    requireEmailVerification: true,
    enableTwoFactor: false,
  };

  private config: AuthenticationConfig;
  // private emailService: EmailService;

  constructor(
    private db: IDb,
    private jwtService: JwtService,
    private passwordUtils: PasswordUtils,
    private logger?: ILogger,
    config?: Partial<AuthenticationConfig>,
  ) {
    this.config = { ...AuthenticationService.DEFAULT_CONFIG, ...config };
  }

  /**
   * Authenticate user with multiple methods (email, phone, WhatsApp, LINE, OAuth)
   */
  public async login(request: LoginRequest): Promise<Results<LoginResult>> {
    try {
      // Validate identifier type
      const identifierType = this.validateIdentifier(request.identifier);
      if (!identifierType.valid) {
        return Results.fail<LoginResult>(null, 'Invalid identifier format');
      }

      // Check if user is locked out (use identifier for lockout tracking)
      const lockoutCheck = await this.checkLockout(request.identifier);
      if (!lockoutCheck.isOk) {
        return Results.fail<LoginResult>(null, lockoutCheck.message!);
      }

      // Find user based on identifier type and auth method
      let userResult;
      if (identifierType.type === 'email' || request.authMethod === 'OAUTH') {
        userResult = await this.findUserByEmail(request.identifier);
      } else {
        userResult = await this.findUserByPhoneNumber(request.identifier);
      }

      if (!userResult.isOk) {
        await this.recordFailedAttempt(request.identifier, request.ipAddress);
        return Results.fail<LoginResult>(null, 'Invalid credentials');
      }

      const user = userResult.returnValue!;
      // Check user status
      if (user.status === UserStatus.PENDING_VERIFICATION) {
        return Results.fail<LoginResult>(null, 'pending_verification');
      } else if (user.status === UserStatus.PENDING_APPROVAL) {
        return Results.fail<LoginResult>(null, 'pending_approval');
      } else if (user.status !== UserStatus.ACTIVE) {
        return Results.fail<LoginResult>(null, 'Account is not active');
      }

      // Verify authentication based on method
      const authResult = await this.verifyAuthentication(user, request);

      if (!authResult.returnValue) {
        await this.recordFailedAttempt(request.identifier, request.ipAddress);
        return Results.fail<LoginResult>(null, authResult.message || 'Invalid credentials');
      }

      // Clear failed attempts on successful login
      await this.clearFailedAttempts(request.identifier);

      // Generate tokens
      const tokenResult = await this.generateTokens(user, request.rememberMe);
      if (!tokenResult.isOk) {
        return Results.fail<LoginResult>(null, 'Failed to generate authentication tokens');
      }

      // Create session
      const sessionResult = await this.createSession(user, tokenResult.returnValue!, request);
      if (!sessionResult.isOk) {
        return Results.fail<LoginResult>(
          null,
          `Failed to create session: ${sessionResult.message}`,
        );
      }

      // await this.db.knex('audit_logs').insert({
      //   tenant_id: user.tenant_id,
      //   user_id: user.id,
      //   event_type: 'USER_LOGIN',
      //   success: true,
      //   metadata: {
      //     loginMethod: request.authMethod,
      //     sessionDuration: tokenResult.returnValue!.expiresAt.getTime() - new Date().getTime(),
      //   },
      // });

      const resUser = await this.sanitizeUser(user);

      return Results.ok({
        user: resUser,
        accessToken: tokenResult.returnValue!.accessToken,
        refreshToken: tokenResult.returnValue!.refreshToken,
        expiresAt: tokenResult.returnValue!.expiresAt,
      });
    } catch (error) {
      NestLogger.error('Authentication failed', error);
      return Results.fail<LoginResult>(null, 'Authentication failed');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshToken(request: RefreshTokenRequest): Promise<Results<LoginResult>> {
    try {
      // Verify refresh token
      const tokenResult = this.jwtService.verifyToken(request.refreshToken);

      if (!tokenResult.isOk) {
        return Results.fail<LoginResult>(null, 'Invalid refresh token');
      }

      const payload = tokenResult.returnValue!;

      // Set RLS context for user_id before querying (required for RLS policies)
      await this.db.knex.raw(`SELECT set_config('app.current_user_id', ?, false)`, [
        payload.userId.toString(),
      ]);

      // Also set tenant context if available (may be null for users without tenant)
      if (payload.role !== 'SUPER_ADMIN' && payload.tenantId) {
        await this.db.knex.raw(`SELECT set_config('app.current_tenant_id', ?, false)`, [
          payload.tenantId.toString(),
        ]);
      }

      // Find user and session
      const user = await this.db.knex('users').where({ id: payload.userId }).first();

      if (!user) {
        return Results.fail<LoginResult>(null, 'User not found');
      }

      const session = await this.db
        .knex('user_sessions')
        .where({
          user_id: payload.userId,
          refresh_token: request.refreshToken,
          is_revoked: false,
        })
        .first();

      if (!session) {
        return Results.fail<LoginResult>(null, 'Session not found');
      }

      // Check if session is expired or token expired
      const tokenExpired = payload.exp ? new Date(payload.exp * 1000) < new Date() : false;
      if (new Date(session.expires_at) < new Date() && tokenExpired) {
        return Results.fail<LoginResult>(null, 'Session and Token has expired');
      }

      // Generate new tokens using the session's tenant ID (which may have been updated via tenant switch)
      const newTokenResult = await this.generateTokens(user, false);
      if (!newTokenResult.isOk) {
        return Results.fail<LoginResult>(null, 'Failed to generate new tokens');
      }

      // Update session
      await this.db.knex('user_sessions').where({ id: session.id }).update({
        access_token_jti: newTokenResult.returnValue!.accessToken,
        refresh_token: newTokenResult.returnValue!.refreshToken,
        expires_at: newTokenResult.returnValue!.expiresAt,
        last_used_at: new Date(),
        ip_address: request.ipAddress,
        user_agent: request.userAgent,
      });

      const userResult = await this.sanitizeUser(user);

      return Results.ok({
        user: userResult,
        accessToken: newTokenResult.returnValue!.accessToken,
        refreshToken: newTokenResult.returnValue!.refreshToken,
        expiresAt: newTokenResult.returnValue!.expiresAt,
      });
    } catch (error) {
      console.error('Token refresh error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        refreshToken: request.refreshToken
          ? `${request.refreshToken.substring(0, 10)}...`
          : 'undefined',
      });

      return Results.fail<LoginResult>(
        null,
        `Token refresh failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Switch tenant context and regenerate tokens
   */
  public async switchTenantContext(
    userId: string,
    newTenantId: string,
    currentRefreshToken: string,
  ): Promise<Results<LoginResult>> {
    try {
      // Verify current refresh token
      const tokenResult = this.jwtService.verifyToken(currentRefreshToken);
      if (!tokenResult.isOk) {
        return Results.fail<LoginResult>(null, 'Invalid refresh token');
      }

      const payload = tokenResult.returnValue!;

      // Verify the user ID matches
      if (payload.userId !== userId) {
        return Results.fail<LoginResult>(null, 'User ID mismatch');
      }

      // Set RLS context for user_id before querying (required for RLS policies)
      await this.db.knex.raw(`SELECT set_config('app.current_user_id', ?, false)`, [
        userId.toString(),
      ]);

      // Find user
      const user = await this.db.knex('users').where({ id: userId }).first();

      if (!user) {
        return Results.fail<LoginResult>(null, 'User not found');
      }

      const session = await this.db
        .knex('user_sessions')
        .where({
          user_id: userId,
          refresh_token: currentRefreshToken,
          is_revoked: false,
        })
        .first();

      if (!session) {
        return Results.fail<LoginResult>(null, 'Session not found or expired');
      }

      // Check session expiry
      if (new Date(session.expires_at) < new Date()) {
        await this.invalidateSession(session.id);
        return Results.fail<LoginResult>(null, 'Session expired');
      }

      // Generate new tokens with the new tenant ID
      const newTokenResult = await this.generateTokens(user, false, newTenantId);
      if (!newTokenResult.isOk) {
        return Results.fail<LoginResult>(null, 'Failed to generate new tokens');
      }

      // Update session with new tokens and tenant ID
      await this.db.knex('user_sessions').where({ id: session.id }).update({
        access_token_jti: newTokenResult.returnValue!.accessToken,
        refresh_token: newTokenResult.returnValue!.refreshToken,
        expires_at: newTokenResult.returnValue!.expiresAt,
        last_used_at: new Date(),
        tenant_id: newTenantId, // Update the session's tenant ID
      });

      // Create user object with updated tenant context
      const userWithNewTenant = {
        ...user,
        tenant_id: newTenantId,
        tenantId: newTenantId,
      };

      const userResult = await this.sanitizeUser(userWithNewTenant);

      return Results.ok({
        user: userResult,
        accessToken: newTokenResult.returnValue!.accessToken,
        refreshToken: newTokenResult.returnValue!.refreshToken,
        expiresAt: newTokenResult.returnValue!.expiresAt,
      });
    } catch (error) {
      return Results.fail<LoginResult>(null, `Tenant switch failed: ${error}`);
    }
  }

  /**
   * Logout user and invalidate session
   */
  public async logout(user_id: string, token: string): Promise<Results<void>> {
    try {
      const query = this.db
        .knex('user_sessions')
        .where({ user_id: user_id, access_token_jti: token, is_revoked: false });

      const session = await query.first();

      await query.update({
        is_revoked: true,
        revoked_at: new Date(),
        revoked_reason: 'user_logout',
      });

      // await this.db.knex('audit_logs').insert({
      //   tenant_id: session.tenant_id,
      //   user_id: session.user_id,
      //   event_type: 'USER_LOGOUT',
      //   success: true,
      //   metadata: {
      //     sessionDuration: session.expires_at.getTime() - new Date().getTime(),
      //   },
      // });

      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Logout failed: ${error}`);
    }
  }

  /**
   * Change user password
   */
  public async changePassword(
    request: ChangePasswordRequest,
  ): Promise<Results<Record<string, any> | null>> {
    try {
      // Get user
      const user = await this.db.knex('users').where({ id: request.userId }).first();

      if (!user) {
        return Results.fail<Record<string, any> | null>(null, 'User not found');
      }

      // Check if user has no password (OAuth user setting initial password)
      const hasNoPassword =
        !user.password_hash || user.password_hash === null || user.password_hash === '';

      // If user has a password, verify current password
      if (!hasNoPassword) {
        if (!request.currentPassword) {
          return Results.fail<Record<string, any> | null>(null, 'Current password is required');
        }
        const passwordResult = await this.passwordUtils.verifyPassword(
          request.currentPassword,
          user.password_hash,
        );
        if (!passwordResult.isOk || !passwordResult.returnValue) {
          return Results.fail<Record<string, any> | null>(null, 'Current password is incorrect');
        }
      }

      // Validate new password
      const validation = this.passwordUtils.validatePassword(request.newPassword);
      if (!validation.isValid) {
        return Results.fail<Record<string, any> | null>(
          null,
          `Password validation failed: ${validation.errors.join(', ')}`,
        );
      }

      // Hash new password
      const hashResult = await this.passwordUtils.hashPassword(request.newPassword);
      if (!hashResult.isOk) {
        return Results.fail<Record<string, any> | null>(null, 'Failed to hash new password');
      }

      // Use transaction to ensure atomicity
      return await this.db.knex.transaction(async (trx) => {
        // Update password
        await trx('users').where({ id: request.userId }).update({
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
        await trx('user_sessions').where({ user_id: request.userId, is_revoked: false }).update({
          is_revoked: true,
          revoked_at: new Date(),
          revoked_reason: 'password_changed',
        });

        // Generate new tokens
        const tokenResult = await this.generateTokens(updatedUser);
        if (!tokenResult.isOk) {
          throw new Error('Failed to generate new tokens');
        }

        // Create new session with the new tokens
        await trx('user_sessions').insert({
          user_id: updatedUser.id,
          access_token_jti: tokenResult.returnValue!.accessToken,
          refresh_token: tokenResult.returnValue!.refreshToken,
          expires_at: tokenResult.returnValue!.expiresAt,
          ip_address: null, // IP/UA not available in change password request
          user_agent: null,
        });

        // Log password change to audit logs
        // await trx('audit_logs').insert({
        //   tenant_id: updatedUser.tenant_id,
        //   user_id: updatedUser.id,
        //   event_type: 'PASSWORD_CHANGE',
        //   success: true,
        //   metadata: {
        //     passwordChangedAt: new Date().toISOString(),
        //   },
        // });

        const userResult = await this.sanitizeUser(updatedUser);

        return Results.ok({
          user: userResult,
          accessToken: tokenResult.returnValue!.accessToken,
          refreshToken: tokenResult.returnValue!.refreshToken,
          expiresAt: tokenResult.returnValue!.expiresAt,
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return Results.fail<Record<string, any> | null>(
        null,
        `Password change failed: ${errorMessage}`,
      );
    }
  }

  /**
   * Validate session and return user context
   */
  public async validateSession(accessToken: string): Promise<Results<RequestContext>> {
    try {
      const tokenResult = this.jwtService.verifyToken(accessToken);
      if (!tokenResult.isOk) {
        return Results.fail<RequestContext>(null, 'Invalid access token');
      }

      const payload = tokenResult.returnValue!;

      // Set RLS context for user_id before querying (required for RLS policies)
      // This allows the query to work even when tenant_id is null
      await this.db.knex.raw(`SELECT set_config('app.current_user_id', ?, false)`, [
        payload.userId.toString(),
      ]);

      // Check if session exists and is active
      const session = await this.db
        .knex('user_sessions')
        .where({
          user_id: payload.userId,
          is_revoked: false,
        })
        .where('expires_at', '>', new Date())
        .first();

      if (!session) {
        return Results.fail<RequestContext>(null, 'Session not found or expired');
      }

      // Update last accessed
      await this.db
        .knex('user_sessions')
        .where({ id: session.id })
        .update({ last_used_at: new Date() });

      // Get tenant_id: first from session, then fall back to user's tenant_id from DB
      let tenantId = session.tenant_id;
      if (!tenantId) {
        const user = await this.db
          .knex('users')
          .where({ id: payload.userId })
          .select('tenant_id')
          .first();
        tenantId = user?.tenant_id;
      }

      // Set tenant context for RLS policies after resolving tenant ID
      if (tenantId) {
        await this.db.knex.raw(`SELECT set_config('app.current_tenant_id', ?, false)`, [
          tenantId.toString(),
        ]);
      }

      // Create context using the resolved tenant ID
      const contextPayload = {
        ...payload,
        tenantId,
      };

      const context = this.jwtService.createRequestContext(
        contextPayload,
        session.ip_address,
        session.user_agent,
      );

      return Results.ok(context);
    } catch (error) {
      return Results.fail<RequestContext>(null, `Session validation failed: ${error}`);
    }
  }

  /**
   * Request password reset
   */
  public async forgotPassword(request: {
    email: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<Results<void>> {
    try {
      // Find user
      const userResult = await this.findUserByEmail(request.email);
      if (!userResult.isOk) {
        // Don't reveal if user exists for security
        return Results.ok(undefined);
      }

      const user = userResult.returnValue!;

      // Generate reset token
      const resetToken = this.generateResetToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      // Store reset token
      await this.db.knex('password_reset_tokens').insert({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt,
        created_at: new Date(),
        ip_address: request.ipAddress,
        user_agent: request.userAgent,
      });

      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Password reset request failed: ${error}`);
    }
  }

  public async validateResetPasswordToken(request: {
    token: string;
  }): Promise<Results<Record<string, any> | null>> {
    try {
      const resetToken = await this.db
        .knex('password_reset_tokens')
        .where({ token: request.token, used: false })
        .first();

      if (!resetToken) {
        return Results.fail({
          success: false,
          message: 'Invalid reset token'
        });
      }

      if (resetToken.expires_at && resetToken.expires_at < new Date()) {
        await this.db.knex('password_reset_tokens').where({ id: resetToken.id }).update({
          used: true,
          used_at: new Date(),
        });
        return Results.fail({
          success: false,
          message: 'Reset token expired'
        });
      }

      return Results.ok({
        userId: resetToken.user_id,
      });
    } catch (error) {
      return Results.fail({
        success: false,
        message: `Password reset token validation failed: ${error}`
      });
    }
  }

  /**
   * Reset password using token
   */
  public async resetPassword(request: {
    token: string;
    userId: string;
    newPassword: string;
  }): Promise<Results<Record<string, any> | null>> {
    let trx;
    try {
      // Start a transaction
      trx = await this.db.knex.transaction();

      const user = await trx('users').where({ id: request.userId }).first();

      if (!user) {
        await trx.rollback();
        return Results.fail({
          success: false,
          message: 'User not found'
        });
      }

      const hashResult = await this.passwordUtils.hashPassword(request.newPassword);
      if (!hashResult.isOk) {
        await trx.rollback();
        return Results.fail<Record<string, any> | null>(null, 'Failed to hash new password');
      }

      if (
        user.password_hash &&
        user.password_hash !== null &&
        user.password_hash === hashResult.returnValue!.hashedPassword
      ) {
        await trx.rollback();
        return Results.fail({
          success: false,
          message: 'New password is the same as the current password'
        });
      }

      const updatedRows = await trx('users')
        .where({ id: request.userId })
        .update({
          password_hash: hashResult.returnValue!.hashedPassword,
          salt: hashResult.returnValue!.salt,
          updated_at: new Date(),
        });

      if (updatedRows === 0) {
        await trx.rollback();
        return Results.fail({
          success: false,
          message: 'Failed to update user password'
        });
      }

      const tokenUpdatedRows = await trx('password_reset_tokens')
        .where({ token: request.token })
        .update({
          used: true,
          used_at: new Date(),
        });

      if (tokenUpdatedRows === 0) {
        await trx.rollback();
        return Results.fail(
          {
            success: false,
            message: 'Invalid or already used reset token'
          },
        );
      }

      await trx.commit();
      return Results.ok({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      if (trx) {
        try {
          await trx.rollback();
        } catch {
        }
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      return Results.fail({
        success: false,
        message: `Password reset failed: ${errorMessage}`
      });
    }
  }

  /**
   * Get user sessions
   */
  public async getUserSessions(userId: string): Promise<Results<any[]>> {
    try {
      const sessions = await this.db
        .knex('user_sessions')
        .where({ user_id: userId, is_revoked: false })
        .select(['id', 'ip_address', 'user_agent', 'created_at', 'last_used_at', 'expires_at'])
        .orderBy('last_used_at', 'desc');

      return Results.ok(sessions);
    } catch (error) {
      return Results.fail<any[]>(null, `Failed to get user sessions: ${error}`);
    }
  }

  /**
   * Revoke specific session
   */
  public async revokeSession(userId: string, sessionId: string): Promise<Results<void>> {
    try {
      const result = await this.db
        .knex('user_sessions')
        .where({
          id: sessionId,
          user_id: userId,
          is_revoked: false,
        })
        .update({
          is_revoked: true,
          revoked_at: new Date(),
          revoked_reason: 'session_revoked',
        });

      if (result === 0) {
        return Results.fail<void>(null, 'Session not found or already revoked');
      }

      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Failed to revoke session: ${error}`);
    }
  }

  /**
   * Logout all sessions for user
   */
  public async logoutAllSessions(userId: string): Promise<Results<void>> {
    try {
      await this.db.knex('user_sessions').where({ user_id: userId, is_revoked: false }).update({
        is_revoked: true,
        revoked_at: new Date(),
        revoked_reason: 'logout_all_sessions',
      });

      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Failed to logout all sessions: ${error}`);
    }
  }

  /**
   * Send email verification
   */
  public async sendEmailVerification(userId: string): Promise<Results<void>> {
    try {
      // Get user
      const user = await this.db.knex('users').where({ id: userId }).first();

      if (!user) {
        return Results.fail<void>(null, 'User not found');
      }

      if (user.email_verified_at) {
        return Results.fail<void>(null, 'Email already verified');
      }

      // Generate verification token
      const verificationToken = this.generateResetToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      // Store verification token
      await this.db.knex('email_verification_tokens').insert({
        user_id: userId,
        token: verificationToken,
        expires_at: expiresAt,
        created_at: new Date(),
      });

      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Failed to send email verification: ${error}`);
    }
  }

  /**
   * Verify email using token
   */
  public async verifyEmail(token: string): Promise<{ status: boolean; message: string }> {
    try {
      // Find valid verification token
      const verificationToken = await this.db
        .knex('email_verification_tokens')
        .where({
          token: token,
        })
        .first();

      if (!verificationToken) {
        return {
          status: false,
          message: 'Verification token not found',
        };
      } else if (verificationToken.expires_at && verificationToken.expires_at < new Date()) {
        return {
          status: false,
          message: 'Verification token expired',
        };
      } else if (verificationToken.used) {
        return {
          status: false,
          message: 'Verification token already used',
        };
      }

      // Mark email as verified
      const user = await this.db.knex('users').where({ id: verificationToken.user_id }).first();
      if (!user) {
        return {
          status: false,
          message: 'User not found',
        };
      } else {
        if (user.status !== UserStatus.PENDING_VERIFICATION) {
          return {
            status: false,
            message: 'User already verified',
          };
        } else {
          await this.db
            .knex('users')
            .where({ id: user.id })
            .update({
              email_verified_at: new Date(),
              status:
                user.role === UserRole.COACH ? UserStatus.PENDING_APPROVAL : UserStatus.ACTIVE,
              updated_at: new Date(),
            });
        }
      }

      // Mark token as used
      await this.db.knex('email_verification_tokens').where({ id: verificationToken.id }).update({
        used: true,
        used_at: new Date(),
      });

      // await this.db.knex('audit_logs').insert({
      //   tenant_id: user.tenant_id,
      //   user_id: user.id,
      //   event_type: SecurityEventType.EMAIL_VERIFIED,
      //   success: true,
      // });

      return {
        status: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      return {
        status: false,
        message: `Email verification failed: ${error}`,
      };
    }
  }

  /**
   * Request phone number verification
   */
  public async requestPhoneVerification(request: PhoneVerificationRequest): Promise<Results<void>> {
    try {
      // Generate verification token
      const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

      // Store verification token
      await this.db.knex('phone_verification_tokens').insert({
        phone_number: request.phoneNumber,
        token,
        expires_at: expiresAt,
        method: request.method,
        created_at: new Date(),
        is_used: false,
      });

      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Phone verification request failed: ${error}`);
    }
  }

  /**
   * Confirm phone number verification
   */
  public async confirmPhoneVerification(
    request: PhoneVerificationConfirm,
  ): Promise<Results<boolean>> {
    try {
      // Find valid verification token
      const verificationToken = await this.db
        .knex('phone_verification_tokens')
        .where({
          phone_number: request.phoneNumber,
          token: request.token,
          is_used: false,
        })
        .where('expires_at', '>', new Date())
        .first();

      if (!verificationToken) {
        return Results.ok(false);
      }

      // Mark token as used
      await this.db.knex('phone_verification_tokens').where({ id: verificationToken.id }).update({
        is_used: true,
        used_at: new Date(),
      });

      return Results.ok(true);
    } catch (error) {
      return Results.fail<boolean>(null, `Phone verification confirmation failed: ${error}`);
    }
  }

  /**
   * Register user with phone number
   */
  public async registerWithPhone(request: RegisterWithPhoneRequest): Promise<Results<LoginResult>> {
    try {
      // Verify phone verification token first
      const verificationResult = await this.confirmPhoneVerification({
        phoneNumber: request.phoneNumber,
        token: request.verificationToken,
      });

      if (!verificationResult.isOk || !verificationResult.returnValue) {
        return Results.fail<LoginResult>(null, 'Phone number not verified');
      }

      // Check if user already exists with this phone number
      const existingUser = await this.findUserByPhoneNumber(request.phoneNumber);
      if (existingUser.isOk) {
        return Results.fail<LoginResult>(null, 'User with this phone number already exists');
      }

      // Create user with complex interface structure
      const userId = this.generateUserId();
      const now = new Date();

      const userData = {
        id: userId,
        phone_number: request.phoneNumber,
        role: 'ATHLETE', // Default role
        status: 'PENDING_VERIFICATION',
        phone_verified: true,
        phone_verified_at: now,

        // Profile fields
        first_name: request.profile.firstName,
        last_name: request.profile.lastName,
        date_of_birth: request.profile.dateOfBirth
          ? new Date(request.profile.dateOfBirth).toString()
          : undefined,
        gender: request.profile.gender,
        body_weight: request.profile.bodyWeight,
        height: request.profile.height,

        // JSON fields
        preferences: request.preferences || {},
        whatsapp_data: request.whatsappData,
        line_data: request.lineData,

        created_at: now,
        updated_at: now,
      };
      // Insert user
      await this.db.knex('users').insert(userData);

      // Generate tokens
      const tokenResult = await this.generateTokens(userData, false);
      if (!tokenResult.isOk) {
        return Results.fail<LoginResult>(null, 'Failed to generate authentication tokens');
      }

      // Create session
      const sessionResult = await this.createSession(userData, tokenResult.returnValue!, {
        identifier: request.phoneNumber,
        authMethod: request.authMethod,
      } as LoginRequest);

      if (!sessionResult.isOk) {
        return Results.fail<LoginResult>(
          null,
          `Failed to create session: ${sessionResult.message}`,
        );
      }

      const userResult = await this.sanitizeUser(userData);

      return Results.ok({
        user: userResult,
        accessToken: tokenResult.returnValue!.accessToken,
        refreshToken: tokenResult.returnValue!.refreshToken,
        expiresAt: tokenResult.returnValue!.expiresAt,
      });
    } catch (error) {
      return Results.fail<LoginResult>(null, `Phone registration failed: ${error}`);
    }
  }

  /**
   * Register user with email
   * Users are registered with the Free Plan tenant by default (self-training)
   * They can later be invited to or join other tenants
   */
  public async registerWithEmail(request: RegisterWithEmailRequest): Promise<{
    success: boolean;
    message: string;
    userId: string;
  }> {
    try {
      // Check if user already exists with this email (globally)
      const existingUser = await this.findUserByEmail(request.email);
      if (existingUser.isOk) {
        return {
          success: false,
          message: 'User with this email already exists',
          userId: '',
        };
      }

      // Create user
      const userId = this.generateUserId();
      const now = new Date();
      const saltRounds = 12;
      if (!request.password) {
        return {
          userId: '',
          success: false,
          message: 'Password is required',
        };
      }
      let passwordHash: string;
      let salt: string;
      try {
        salt = await bcrypt.genSalt(saltRounds);
        passwordHash = await bcrypt.hash(request.password, salt);
      } catch (err) {
        return {
          userId: '',
          success: false,
          message: 'Failed to hash password',
        };
      }

      const defaultTenantId = await this.db.knex('tenants').where({ is_free: true }).first();
      if (!defaultTenantId) {
        return {
          userId: '',
          success: false,
          message: 'Free Plan not available',
        };
      }

      // Assign user to Free Plan tenant by default (self-training)
      const userData = {
        id: userId,
        tenant_id: defaultTenantId.id,
        first_name: request.firstName,
        last_name: request.lastName,
        email: request.email,
        password_hash: passwordHash,
        salt: salt,
        role: request.role,
        status: 'PENDING_VERIFICATION', //'PENDING_VERIFICATION',
        created_at: now,
        updated_at: now,
      };

      const result = await this.db.knex('users').insert(userData);

      if (!result || (Array.isArray(result) && result.length === 0)) {
        return {
          userId: '',
          success: false,
          message: 'Failed to register user',
        };
      }

      return {
        userId: userId,
        success: true,
        message: 'User registered successfully',
      };
    } catch (error) {
      return {
        userId: '',
        success: false,
        message: `Email registration failed: ${error}`,
      };
    }
  }

  // Private helper methods
  private async findUserByEmail(email: string): Promise<Results<any>> {
    try {
      // Set RLS context for login operations - use a minimal context that allows user lookup

      const query = this.db.knex('users').where({ email: email.toLowerCase() });

      const user = await query.first();

      if (!user) {
        return Results.fail<void>(null, 'User not found');
      }

      return Results.ok(user);
    } catch (error) {
      return Results.fail(`Database error: ${error}`);
    }
  }

  private async findUserByPhoneNumber(phoneNumber: string): Promise<Results<any>> {
    try {
      // Set RLS context for phone lookup

      const query = this.db.knex('users').where({ phone_number: phoneNumber });

      const user = await query.first();

      if (!user) {
        return Results.fail<void>(null, 'User not found');
      }

      return Results.ok(user);
    } catch (error) {
      return Results.fail(`Database error: ${error}`);
    }
  }

  private validateIdentifier(identifier: string): { type: 'email' | 'phone'; valid: boolean } {
    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Simple phone regex (starts with + and contains digits)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;

    if (emailRegex.test(identifier)) {
      return { type: 'email', valid: true };
    } else if (phoneRegex.test(identifier)) {
      return { type: 'phone', valid: true };
    } else {
      return { type: 'email', valid: false };
    }
  }

  private async verifyAuthentication(user: any, request: LoginRequest): Promise<Results<boolean>> {
    try {
      switch (request.authMethod) {
        case 'EMAIL':
          if (!request.password) {
            return Results.fail<boolean>(null, 'Password required for email authentication');
          }
          const passwordHash = user.password_hash;
          if (!passwordHash) {
            return Results.fail<boolean>(null, 'No password set for user');
          }
          const passwordResult = await this.passwordUtils.verifyPassword(
            request.password,
            passwordHash,
          );
          return Results.ok(passwordResult.returnValue);

        case 'WHATSAPP':
        case 'LINE':
          if (!request.verificationToken) {
            return Results.fail<boolean>(
              null,
              'Verification token required for phone authentication',
            );
          }
          // Verify phone verification token
          const phoneVerificationResult = await this.confirmPhoneVerification({
            phoneNumber: request.identifier,
            token: request.verificationToken,
          });
          return Results.ok(phoneVerificationResult.isOk && phoneVerificationResult.returnValue);

        case 'OAUTH':
          if (!request.oauthData) {
            return Results.fail<boolean>(null, 'OAuth data required for OAuth authentication');
          }
          // For OAuth, we trust the provider (Google) has already verified the user
          // The oauthData should contain provider-specific information
          if (request.oauthData.provider === 'google') {
            // Verify that the email matches
            if (
              request.oauthData.email &&
              request.oauthData.email.toLowerCase() !== user.email?.toLowerCase()
            ) {
              return Results.fail<boolean>(null, 'OAuth email mismatch');
            }

            // Verify Google ID matches if user has OAuth providers configured
            if (request.oauthData.googleId) {
              const userOAuthProviders = user.auth_providers || {};
              const googleProvider = userOAuthProviders.google;

              // If user has Google OAuth configured, verify the ID matches
              if (
                googleProvider &&
                googleProvider.id &&
                googleProvider.id !== request.oauthData.googleId
              ) {
                return Results.fail<boolean>(null, 'OAuth Google ID mismatch');
              }
            }

            return Results.ok(true);
          }
          // For other OAuth providers, add verification logic here
          return Results.ok(true);

        default:
          return Results.fail<boolean>(null, 'Unsupported authentication method');
      }
    } catch (error) {
      return Results.fail<boolean>(null, `Authentication verification failed: ${error}`);
    }
  }

  private generateUserId(): string {
    return ValidationUtils.generateUUID();
  }

  public async generateTokens(
    user: any,
    rememberMe: boolean = false,
    customTenantId?: string,
  ): Promise<Results<{ accessToken: string; refreshToken: string; expiresAt: Date }>> {
    try {
      // Calculate expiration time in minutes
      const sessionTimeoutMinutes = rememberMe
        ? this.config.sessionTimeout * 7
        : this.config.sessionTimeout;

      // Create JWT service with specific expiration for this token
      const tokenJwtService = createJwtService({
        secret: this.jwtService['config'].secret,
        algorithm: this.jwtService['config'].algorithm,
        expiresIn: `${sessionTimeoutMinutes}m`, // Use minutes for consistency
        issuer: this.jwtService['config'].issuer,
        audience: this.jwtService['config'].audience,
      });

      const payload: JwtPayload = {
        userId: user.id,
        tenantId: customTenantId || user.tenant_id, // Use custom tenant ID if provided
        role: user.role,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      const accessTokenResult = tokenJwtService.generateToken(payload);
      if (!accessTokenResult.isOk) {
        return Results.fail<{ accessToken: string; refreshToken: string; expiresAt: Date }>(
          null,
          'Failed to generate access token',
        );
      }

      // Get the actual expiration time from the JWT token
      const tokenExpirationResult = tokenJwtService.getTokenExpiration(
        accessTokenResult.returnValue!,
      );
      if (!tokenExpirationResult.isOk) {
        return Results.fail<{ accessToken: string; refreshToken: string; expiresAt: Date }>(
          null,
          'Failed to get token expiration',
        );
      }

      // Generate refresh token with longer expiry (7 days)
      const refreshJwtService = createJwtService({
        secret: this.jwtService['config'].secret,
        algorithm: this.jwtService['config'].algorithm,
        expiresIn: '7d',
        issuer: this.jwtService['config'].issuer,
        audience: this.jwtService['config'].audience,
      });

      const refreshPayload = { ...payload };
      const refreshTokenResult = refreshJwtService.generateToken(refreshPayload);
      if (!refreshTokenResult.isOk) {
        return Results.fail<{ accessToken: string; refreshToken: string; expiresAt: Date }>(
          null,
          'Failed to generate refresh token',
        );
      }

      return Results.ok({
        accessToken: accessTokenResult.returnValue!,
        refreshToken: refreshTokenResult.returnValue!,
        expiresAt: tokenExpirationResult.returnValue!,
      });
    } catch (error) {
      return Results.fail<{ accessToken: string; refreshToken: string; expiresAt: Date }>(
        null,
        `Token generation failed: ${error}`,
      );
    }
  }

  private async createSession(
    user: any,
    tokens: { accessToken: string; refreshToken: string; expiresAt: Date },
    request: LoginRequest,
  ): Promise<Results<void>> {
    try {
      await this.db.knex('user_sessions').insert({
        user_id: user.id,
        access_token_jti: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt,
        ip_address: request.ipAddress,
        user_agent: request.userAgent,
      });

      await this.db.knex('users').where({ id: user.id }).update({
        last_login_at: new Date(),
      });

      return Results.ok(undefined);
    } catch (error) {
      // Enhanced error logging with full error details
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as any)?.code;
      const errorDetail = (error as any)?.detail;
      const errorConstraint = (error as any)?.constraint;

      if (this.logger) {
        await this.logger.error({
          message: 'Session creation failed with database error',
          metadata: {
            error: errorMessage,
            errorCode,
            errorDetail,
            errorConstraint,
            user_id: user.id,
            tenant_id: user.tenant_id,
            fullError: error,
          },
        });
      }

      return Results.fail<void>(
        null,
        `Session creation failed: ${errorMessage} (Code: ${errorCode})`,
      );
    }
  }

  private async checkLockout(email: string): Promise<Results<void>> {
    try {
      const attempts = await this.db
        .knex('login_attempts')
        .where({ email: email.toLowerCase() })
        .where('attempted_at', '>', new Date(Date.now() - this.config.lockoutDuration * 60 * 1000))
        .count('* as count')
        .first();

      if (attempts && Number(attempts.count) >= this.config.maxLoginAttempts) {
        return Results.fail<void>(
          null,
          `Account locked due to too many failed attempts. Try again in ${this.config.lockoutDuration} minutes.`,
        );
      }

      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Lockout check failed: ${error}`);
    }
  }

  private async recordFailedAttempt(email: string, ipAddress?: string): Promise<void> {
    try {
      await this.db.knex('login_attempts').insert({
        email: email.toLowerCase(),
        ip_address: ipAddress,
        attempted_at: new Date(),
        success: false,
      });
    } catch (error) {
      // Log but don't fail the authentication process
      NestLogger.log({
        message: 'Failed to record login attempt',
        metadata: { email, error: (error as any).message },
      });
    }
  }

  private async clearFailedAttempts(email: string): Promise<void> {
    try {
      await this.db.knex('login_attempts').where({ email: email.toLowerCase() }).del();
    } catch (error) {
      // Log but don't fail the authentication process
      if (this.logger) {
        await this.logger.error({
          message: 'Failed to clear login attempts',
          metadata: { email, error: (error as any).message },
        });
      }
    }
  }

  private async invalidateSession(sessionId: string): Promise<void> {
    try {
      await this.db.knex('user_sessions').where({ id: sessionId }).update({
        is_revoked: true,
        revoked_at: new Date(),
        revoked_reason: 'session_invalidated',
      });
    } catch (error) {
      if (this.logger) {
        await this.logger.error({
          message: 'Failed to invalidate session',
          metadata: { sessionId, error: (error as any).message },
        });
      }
    }
  }

  private generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  private generateRandomPassword(length = 12): string {
    const charset = {
      lower: 'abcdefghijklmnopqrstuvwxyz',
      upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      digit: '0123456789',
      special: '!@#$%^&*',
    };

    const allChars = Object.values(charset).join('');
    let password = [
      charset.lower[Math.floor(Math.random() * charset.lower.length)],
      charset.upper[Math.floor(Math.random() * charset.upper.length)],
      charset.digit[Math.floor(Math.random() * charset.digit.length)],
      charset.special[Math.floor(Math.random() * charset.special.length)],
    ];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password.push(allChars.charAt(Math.floor(Math.random() * allChars.length)));
    }

    // Shuffle to randomize positions
    for (let i = password.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [password[i], password[j]] = [password[j], password[i]];
    }

    return password.join('');
  }

  public async sanitizeUser(user: any): Promise<User> {
    const { password_hash, ...sanitized } = user;
    // Handle null tenant_id - user may not be assigned to a tenant yet
    let tenantName = null;
    if (sanitized.tenant_id) {
      const tenant = await this.db.knex('tenants').where({ id: sanitized.tenant_id }).first();
      tenantName = tenant?.name || null;
    }
    return {
      id: sanitized.id,
      email: sanitized.email,
      firstName: sanitized.first_name || 'Unknown',
      lastName: sanitized.last_name || 'User',
      role: sanitized.role,
      tenantId: sanitized.tenant_id || null,
      tenantName: tenantName,
      freePlan: sanitized.free_plan,
      isActive: !sanitized.is_revoked,
      createdAt: sanitized.created_at,
      updatedAt: sanitized.updated_at,
    };
  }
}

// Factory function
export function createAuthenticationService(
  db: IDb,
  jwtService: JwtService,
  passwordUtils: PasswordUtils,
  logger?: ILogger,
  config?: Partial<AuthenticationConfig>,
): AuthenticationService {
  return new AuthenticationService(db, jwtService, passwordUtils, logger, config);
}
