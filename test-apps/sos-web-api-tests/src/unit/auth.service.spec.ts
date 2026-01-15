import { AuthService } from '@strengthos/sos-web-api/src/auth/auth.service';
import { AuthenticationService } from '@strengthos/shared-security';
import { ILogger } from '@strengthos/shared-logging';
import { TestModuleBuilder } from '../utils/test-module-builder';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { RequestContext } from '@strengthos/shared-types';
import { Results } from '@strengthos/shared-utils';
import {
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  PhoneVerificationDto,
  PhoneVerificationConfirmDto,
  RegisterWithPhoneDto,
  AuthMethod,
} from '@strengthos/sos-web-api/src/auth/dto/login.dto';
import { AuthResponseDto } from '@strengthos/sos-web-api/src/auth/dto/auth-response.dto';

describe('AuthService', () => {
  let service: AuthService;
  let mockAuthenticationService: jest.Mocked<AuthenticationService>;
  let mockLogger: jest.Mocked<ILogger>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    tenantId: 'tenant-1',
    role: 'athlete',
  };

  const mockAuthResponse: AuthResponseDto = {
    user: mockUser,
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 3600,
  };

  const mockRequestContext: RequestContext = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    role: 'athlete',
    permissions: [],
  };

  beforeEach(async () => {
    mockAuthenticationService = {
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      changePassword: jest.fn(),
      validateSession: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      getUserSessions: jest.fn(),
      revokeSession: jest.fn(),
      logoutAllSessions: jest.fn(),
      sendEmailVerification: jest.fn(),
      verifyEmail: jest.fn(),
      requestPhoneVerification: jest.fn(),
      confirmPhoneVerification: jest.fn(),
      registerWithPhone: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      warning: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
    } as any;

    const { service: testService } = await TestModuleBuilder
      .forService(AuthService)
      .withMocks([
        { provide: 'AuthenticationService', useValue: mockAuthenticationService },
        { provide: 'ILogger', useValue: mockLogger },
      ])
      .build();

    service = testService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      identifier: 'test@example.com',
      password: 'password123',
      authMethod: AuthMethod.EMAIL,
      tenantId: 'tenant-1',
    };

    it('should login successfully', async () => {
      mockAuthenticationService.login.mockResolvedValue(Results.ok(mockAuthResponse));

      const result = await service.login(loginDto, '192.168.1.1', 'Mozilla/5.0');

      expect(mockAuthenticationService.login).toHaveBeenCalledWith({
        identifier: loginDto.identifier,
        password: loginDto.password,
        authMethod: loginDto.authMethod,
        tenantId: loginDto.tenantId,
        rememberMe: false,
        verificationToken: undefined,
        oauthData: undefined,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'User login successful',
        userId: mockUser.id,
        identifier: loginDto.identifier,
        authMethod: loginDto.authMethod,
        tenantId: loginDto.tenantId,
        ip: '192.168.1.1',
      });
      expect(result).toBe(mockAuthResponse);
    });

    it('should handle login failure', async () => {
      mockAuthenticationService.login.mockResolvedValue(Results.error(null, 'Invalid credentials'));

      await expect(service.login(loginDto, '192.168.1.1')).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.warning).toHaveBeenCalledWith({
        message: 'Login attempt failed',
        identifier: loginDto.identifier,
        authMethod: loginDto.authMethod,
        tenantId: loginDto.tenantId,
        ip: '192.168.1.1',
        fullMessage: 'Invalid credentials',
      });
    });

    it('should handle login service exception', async () => {
      mockAuthenticationService.login.mockRejectedValue(new Error('Service unavailable'));

      await expect(service.login(loginDto, '192.168.1.1')).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Login service error',
        identifier: loginDto.identifier,
        authMethod: loginDto.authMethod,
        ip: '192.168.1.1',
        fullMessage: 'Service unavailable',
      });
    });

    it('should handle login with remember me option', async () => {
      const loginDtoWithRememberMe = { ...loginDto, rememberMe: true };
      mockAuthenticationService.login.mockResolvedValue(Results.ok(mockAuthResponse));

      await service.login(loginDtoWithRememberMe, '192.168.1.1');

      expect(mockAuthenticationService.login).toHaveBeenCalledWith(
        expect.objectContaining({ rememberMe: true })
      );
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'refresh-token',
    };

    it('should refresh token successfully', async () => {
      mockAuthenticationService.refreshToken.mockResolvedValue(Results.ok(mockAuthResponse));

      const result = await service.refreshToken(refreshTokenDto, '192.168.1.1', 'Mozilla/5.0');

      expect(mockAuthenticationService.refreshToken).toHaveBeenCalledWith({
        refreshToken: refreshTokenDto.refreshToken,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Token refresh successful',
        userId: mockUser.id,
        ip: '192.168.1.1',
      });
      expect(result).toBe(mockAuthResponse);
    });

    it('should handle refresh token failure', async () => {
      mockAuthenticationService.refreshToken.mockResolvedValue(Results.error(null, 'Invalid refresh token'));

      await expect(service.refreshToken(refreshTokenDto, '192.168.1.1')).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.warning).toHaveBeenCalledWith({
        message: 'Token refresh failed',
        ip: '192.168.1.1',
        fullMessage: 'Invalid refresh token',
      });
    });

    it('should handle refresh token service exception', async () => {
      mockAuthenticationService.refreshToken.mockRejectedValue(new Error('Service error'));

      await expect(service.refreshToken(refreshTokenDto, '192.168.1.1')).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Token refresh service error',
        ip: '192.168.1.1',
        fullMessage: 'Service error',
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockAuthenticationService.logout.mockResolvedValue(Results.ok(undefined));

      await service.logout(mockRequestContext, 'session-1');

      expect(mockAuthenticationService.logout).toHaveBeenCalledWith('user-1', 'session-1');
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'User logout successful',
        userId: 'user-1',
      });
    });

    it('should handle logout failure', async () => {
      mockAuthenticationService.logout.mockResolvedValue(Results.error(null, 'Logout failed'));

      await expect(service.logout(mockRequestContext, 'session-1')).rejects.toThrow(BadRequestException);
      expect(mockLogger.warning).toHaveBeenCalledWith({
        message: 'Logout failed',
        userId: 'user-1',
        fullMessage: 'Logout failed',
      });
    });

    it('should handle logout service exception', async () => {
      mockAuthenticationService.logout.mockRejectedValue(new Error('Service error'));

      await expect(service.logout(mockRequestContext, 'session-1')).rejects.toThrow(BadRequestException);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Logout service error',
        userId: 'user-1',
        fullMessage: 'Service error',
      });
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    };

    it('should change password successfully', async () => {
      mockAuthenticationService.changePassword.mockResolvedValue(Results.ok(undefined));

      await service.changePassword(mockRequestContext, changePasswordDto);

      expect(mockAuthenticationService.changePassword).toHaveBeenCalledWith({
        userId: 'user-1',
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      });
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Password change successful',
        userId: 'user-1',
      });
    });

    it('should handle password change failure', async () => {
      mockAuthenticationService.changePassword.mockResolvedValue(Results.error(null, 'Current password incorrect'));

      await expect(service.changePassword(mockRequestContext, changePasswordDto)).rejects.toThrow(BadRequestException);
      expect(mockLogger.warning).toHaveBeenCalledWith({
        message: 'Password change failed',
        userId: 'user-1',
        fullMessage: 'Current password incorrect',
      });
    });

    it('should handle password change service exception', async () => {
      mockAuthenticationService.changePassword.mockRejectedValue(new Error('Service error'));

      await expect(service.changePassword(mockRequestContext, changePasswordDto)).rejects.toThrow(BadRequestException);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Password change service error',
        userId: 'user-1',
        fullMessage: 'Service error',
      });
    });
  });

  describe('validateSession', () => {
    it('should validate session successfully', async () => {
      mockAuthenticationService.validateSession.mockResolvedValue(Results.ok(mockRequestContext));

      const result = await service.validateSession('access-token');

      expect(mockAuthenticationService.validateSession).toHaveBeenCalledWith('access-token');
      expect(result).toBe(mockRequestContext);
    });

    it('should handle invalid session', async () => {
      mockAuthenticationService.validateSession.mockResolvedValue(Results.error(null, 'Invalid token'));

      await expect(service.validateSession('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should handle session validation exception', async () => {
      mockAuthenticationService.validateSession.mockRejectedValue(new Error('Service error'));

      await expect(service.validateSession('access-token')).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Session validation error',
        fullMessage: 'Service error',
      });
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'test@example.com',
      tenantId: 'tenant-1',
    };

    it('should handle forgot password request successfully', async () => {
      mockAuthenticationService.forgotPassword.mockResolvedValue(Results.ok(undefined));

      await service.forgotPassword(forgotPasswordDto, '192.168.1.1', 'Mozilla/5.0');

      expect(mockAuthenticationService.forgotPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        tenantId: 'tenant-1',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Password reset requested',
        email: 'test@example.com',
        tenantId: 'tenant-1',
        ip: '192.168.1.1',
        success: true,
      });
    });

    it('should handle forgot password failure silently', async () => {
      mockAuthenticationService.forgotPassword.mockResolvedValue(Results.error(null, 'Email not found'));

      // Should not throw error for security reasons
      await expect(service.forgotPassword(forgotPasswordDto, '192.168.1.1')).resolves.toBeUndefined();
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Password reset requested',
        email: 'test@example.com',
        tenantId: 'tenant-1',
        ip: '192.168.1.1',
        success: false,
      });
    });

    it('should handle forgot password service exception silently', async () => {
      mockAuthenticationService.forgotPassword.mockRejectedValue(new Error('Service error'));

      // Should not throw error for security reasons
      await expect(service.forgotPassword(forgotPasswordDto, '192.168.1.1')).resolves.toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Forgot password service error',
        email: 'test@example.com',
        ip: '192.168.1.1',
        fullMessage: 'Service error',
      });
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto: ResetPasswordDto = {
      token: 'reset-token',
      newPassword: 'newPassword123',
    };

    it('should reset password successfully', async () => {
      mockAuthenticationService.resetPassword.mockResolvedValue(Results.ok({ userId: 'user-1' }));

      await service.resetPassword(resetPasswordDto, '192.168.1.1', 'Mozilla/5.0');

      expect(mockAuthenticationService.resetPassword).toHaveBeenCalledWith({
        token: 'reset-token',
        newPassword: 'newPassword123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Password reset successful',
        userId: 'user-1',
        ip: '192.168.1.1',
      });
    });

    it('should handle reset password failure', async () => {
      mockAuthenticationService.resetPassword.mockResolvedValue(Results.error(null, 'Invalid token'));

      await expect(service.resetPassword(resetPasswordDto, '192.168.1.1')).rejects.toThrow(BadRequestException);
      expect(mockLogger.warning).toHaveBeenCalledWith({
        message: 'Password reset failed',
        ip: '192.168.1.1',
        fullMessage: 'Invalid token',
      });
    });

    it('should handle reset password service exception', async () => {
      mockAuthenticationService.resetPassword.mockRejectedValue(new Error('Service error'));

      await expect(service.resetPassword(resetPasswordDto, '192.168.1.1')).rejects.toThrow(BadRequestException);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Reset password service error',
        ip: '192.168.1.1',
        fullMessage: 'Service error',
      });
    });
  });

  describe('getUserSessions', () => {
    it('should get user sessions successfully', async () => {
      const sessions = [{ id: 'session-1', createdAt: new Date() }];
      mockAuthenticationService.getUserSessions.mockResolvedValue(Results.ok(sessions));

      const result = await service.getUserSessions('user-1');

      expect(mockAuthenticationService.getUserSessions).toHaveBeenCalledWith('user-1');
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'User sessions retrieved',
        userId: 'user-1',
        sessionCount: 1,
      });
      expect(result).toBe(sessions);
    });

    it('should handle get user sessions failure', async () => {
      mockAuthenticationService.getUserSessions.mockResolvedValue(Results.error(null, 'User not found'));

      await expect(service.getUserSessions('user-1')).rejects.toThrow(BadRequestException);
      expect(mockLogger.warning).toHaveBeenCalledWith({
        message: 'Get user sessions failed',
        userId: 'user-1',
        fullMessage: 'User not found',
      });
    });

    it('should handle get user sessions service exception', async () => {
      mockAuthenticationService.getUserSessions.mockRejectedValue(new Error('Service error'));

      await expect(service.getUserSessions('user-1')).rejects.toThrow(BadRequestException);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Get user sessions service error',
        userId: 'user-1',
        fullMessage: 'Service error',
      });
    });
  });

  describe('revokeSession', () => {
    it('should revoke session successfully', async () => {
      mockAuthenticationService.revokeSession.mockResolvedValue(Results.ok(undefined));

      await service.revokeSession('user-1', 'session-1');

      expect(mockAuthenticationService.revokeSession).toHaveBeenCalledWith('user-1', 'session-1');
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Session revoked successfully',
        userId: 'user-1',
        sessionId: 'session-1',
      });
    });

    it('should handle revoke session failure', async () => {
      mockAuthenticationService.revokeSession.mockResolvedValue(Results.error(null, 'Session not found'));

      await expect(service.revokeSession('user-1', 'session-1')).rejects.toThrow(BadRequestException);
      expect(mockLogger.warning).toHaveBeenCalledWith({
        message: 'Session revocation failed',
        userId: 'user-1',
        sessionId: 'session-1',
        fullMessage: 'Session not found',
      });
    });

    it('should handle revoke session service exception', async () => {
      mockAuthenticationService.revokeSession.mockRejectedValue(new Error('Service error'));

      await expect(service.revokeSession('user-1', 'session-1')).rejects.toThrow(BadRequestException);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Revoke session service error',
        userId: 'user-1',
        sessionId: 'session-1',
        fullMessage: 'Service error',
      });
    });
  });

  describe('logoutAllSessions', () => {
    it('should logout all sessions successfully', async () => {
      mockAuthenticationService.logoutAllSessions.mockResolvedValue(Results.ok(undefined));

      await service.logoutAllSessions('user-1');

      expect(mockAuthenticationService.logoutAllSessions).toHaveBeenCalledWith('user-1');
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'All sessions logged out successfully',
        userId: 'user-1',
      });
    });

    it('should handle logout all sessions failure', async () => {
      mockAuthenticationService.logoutAllSessions.mockResolvedValue(Results.error(null, 'User not found'));

      await expect(service.logoutAllSessions('user-1')).rejects.toThrow(BadRequestException);
      expect(mockLogger.warning).toHaveBeenCalledWith({
        message: 'Logout all sessions failed',
        userId: 'user-1',
        fullMessage: 'User not found',
      });
    });

    it('should handle logout all sessions service exception', async () => {
      mockAuthenticationService.logoutAllSessions.mockRejectedValue(new Error('Service error'));

      await expect(service.logoutAllSessions('user-1')).rejects.toThrow(BadRequestException);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Logout all sessions service error',
        userId: 'user-1',
        fullMessage: 'Service error',
      });
    });
  });

  describe('sendEmailVerification', () => {
    it('should send email verification successfully', async () => {
      mockAuthenticationService.sendEmailVerification.mockResolvedValue(Results.ok(undefined));

      await service.sendEmailVerification('user-1');

      expect(mockAuthenticationService.sendEmailVerification).toHaveBeenCalledWith('user-1');
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Email verification sent successfully',
        userId: 'user-1',
      });
    });

    it('should handle send email verification failure', async () => {
      mockAuthenticationService.sendEmailVerification.mockResolvedValue(Results.error(null, 'User not found'));

      await expect(service.sendEmailVerification('user-1')).rejects.toThrow(BadRequestException);
      expect(mockLogger.warning).toHaveBeenCalledWith({
        message: 'Send email verification failed',
        userId: 'user-1',
        fullMessage: 'User not found',
      });
    });

    it('should handle send email verification service exception', async () => {
      mockAuthenticationService.sendEmailVerification.mockRejectedValue(new Error('Service error'));

      await expect(service.sendEmailVerification('user-1')).rejects.toThrow(BadRequestException);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Send email verification service error',
        userId: 'user-1',
        fullMessage: 'Service error',
      });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      mockAuthenticationService.verifyEmail.mockResolvedValue(Results.ok({ userId: 'user-1' }));

      await service.verifyEmail('verification-token');

      expect(mockAuthenticationService.verifyEmail).toHaveBeenCalledWith('verification-token');
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Email verified successfully',
        userId: 'user-1',
      });
    });

    it('should handle email verification failure', async () => {
      mockAuthenticationService.verifyEmail.mockResolvedValue(Results.error(null, 'Invalid token'));

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException);
      expect(mockLogger.warning).toHaveBeenCalledWith({
        message: 'Email verification failed',
        fullMessage: 'Invalid token',
      });
    });

    it('should handle email verification service exception', async () => {
      mockAuthenticationService.verifyEmail.mockRejectedValue(new Error('Service error'));

      await expect(service.verifyEmail('verification-token')).rejects.toThrow(BadRequestException);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Email verification service error',
        fullMessage: 'Service error',
      });
    });
  });

  describe('requestPhoneVerification', () => {
    const phoneVerificationDto: PhoneVerificationDto = {
      phoneNumber: '+1234567890',
      tenantId: 'tenant-1',
      method: 'sms',
    };

    it('should request phone verification successfully', async () => {
      mockAuthenticationService.requestPhoneVerification.mockResolvedValue(Results.ok(undefined));

      await service.requestPhoneVerification(phoneVerificationDto, '192.168.1.1', 'Mozilla/5.0');

      expect(mockAuthenticationService.requestPhoneVerification).toHaveBeenCalledWith({
        phoneNumber: '+1234567890',
        tenantId: 'tenant-1',
        method: 'sms',
      });
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Phone verification code sent successfully',
        phoneNumber: '+1234567890',
        method: 'sms',
        tenantId: 'tenant-1',
        ip: '192.168.1.1',
      });
    });

    it('should handle phone verification request failure', async () => {
      mockAuthenticationService.requestPhoneVerification.mockResolvedValue(Results.error(null, 'Invalid phone number'));

      await expect(service.requestPhoneVerification(phoneVerificationDto, '192.168.1.1')).rejects.toThrow(BadRequestException);
      expect(mockLogger.warning).toHaveBeenCalledWith({
        message: 'Phone verification request failed',
        phoneNumber: '+1234567890',
        method: 'sms',
        tenantId: 'tenant-1',
        ip: '192.168.1.1',
        fullMessage: 'Invalid phone number',
      });
    });

    it('should handle phone verification request service exception', async () => {
      mockAuthenticationService.requestPhoneVerification.mockRejectedValue(new Error('Service error'));

      await expect(service.requestPhoneVerification(phoneVerificationDto, '192.168.1.1')).rejects.toThrow(BadRequestException);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Phone verification request service error',
        phoneNumber: '+1234567890',
        ip: '192.168.1.1',
        fullMessage: 'Service error',
      });
    });
  });

  describe('confirmPhoneVerification', () => {
    const phoneVerificationConfirmDto: PhoneVerificationConfirmDto = {
      phoneNumber: '+1234567890',
      tenantId: 'tenant-1',
      token: '123456',
    };

    it('should confirm phone verification successfully', async () => {
      mockAuthenticationService.confirmPhoneVerification.mockResolvedValue(Results.ok(true));

      const result = await service.confirmPhoneVerification(phoneVerificationConfirmDto, '192.168.1.1', 'Mozilla/5.0');

      expect(mockAuthenticationService.confirmPhoneVerification).toHaveBeenCalledWith({
        phoneNumber: '+1234567890',
        tenantId: 'tenant-1',
        token: '123456',
      });
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Phone verification confirmed successfully',
        phoneNumber: '+1234567890',
        tenantId: 'tenant-1',
        ip: '192.168.1.1',
      });
      expect(result).toBe(true);
    });

    it('should handle phone verification confirmation failure', async () => {
      mockAuthenticationService.confirmPhoneVerification.mockResolvedValue(Results.error(null, 'Invalid token'));

      const result = await service.confirmPhoneVerification(phoneVerificationConfirmDto, '192.168.1.1');

      expect(mockLogger.warning).toHaveBeenCalledWith({
        message: 'Phone verification confirmation failed',
        phoneNumber: '+1234567890',
        tenantId: 'tenant-1',
        ip: '192.168.1.1',
        fullMessage: 'Invalid token',
      });
      expect(result).toBe(false);
    });

    it('should handle phone verification confirmation service exception', async () => {
      mockAuthenticationService.confirmPhoneVerification.mockRejectedValue(new Error('Service error'));

      const result = await service.confirmPhoneVerification(phoneVerificationConfirmDto, '192.168.1.1');

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Phone verification confirmation service error',
        phoneNumber: '+1234567890',
        ip: '192.168.1.1',
        fullMessage: 'Service error',
      });
      expect(result).toBe(false);
    });
  });

  describe('registerWithPhone', () => {
    const registerWithPhoneDto: RegisterWithPhoneDto = {
      phoneNumber: '+1234567890',
      authMethod: AuthMethod.PHONE,
      tenantId: 'tenant-1',
      profile: { firstName: 'John', lastName: 'Doe' },
      verificationToken: '123456',
    };

    it('should register with phone successfully', async () => {
      mockAuthenticationService.registerWithPhone.mockResolvedValue(Results.ok(mockAuthResponse));

      const result = await service.registerWithPhone(registerWithPhoneDto, '192.168.1.1', 'Mozilla/5.0');

      expect(mockAuthenticationService.registerWithPhone).toHaveBeenCalledWith({
        phoneNumber: '+1234567890',
        authMethod: AuthMethod.PHONE,
        tenantId: 'tenant-1',
        profile: { firstName: 'John', lastName: 'Doe' },
        preferences: undefined,
        verificationToken: '123456',
        whatsappData: undefined,
        lineData: undefined,
      });
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Phone registration successful',
        userId: mockUser.id,
        phoneNumber: '+1234567890',
        authMethod: AuthMethod.PHONE,
        tenantId: 'tenant-1',
        ip: '192.168.1.1',
      });
      expect(result).toBe(mockAuthResponse);
    });

    it('should handle phone registration failure', async () => {
      mockAuthenticationService.registerWithPhone.mockResolvedValue(Results.error(null, 'Phone number already exists'));

      await expect(service.registerWithPhone(registerWithPhoneDto, '192.168.1.1')).rejects.toThrow(BadRequestException);
      expect(mockLogger.warning).toHaveBeenCalledWith({
        message: 'Phone registration failed',
        phoneNumber: '+1234567890',
        authMethod: AuthMethod.PHONE,
        tenantId: 'tenant-1',
        ip: '192.168.1.1',
        fullMessage: 'Phone number already exists',
      });
    });

    it('should handle phone registration service exception', async () => {
      mockAuthenticationService.registerWithPhone.mockRejectedValue(new Error('Service error'));

      await expect(service.registerWithPhone(registerWithPhoneDto, '192.168.1.1')).rejects.toThrow(BadRequestException);
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Phone registration service error',
        phoneNumber: '+1234567890',
        ip: '192.168.1.1',
        fullMessage: 'Service error',
      });
    });
  });

  describe('Performance benchmarks', () => {
    it('should complete authentication operations within acceptable time limits', async () => {
      const startTime = Date.now();

      mockAuthenticationService.login.mockResolvedValue(Results.ok(mockAuthResponse));
      mockAuthenticationService.validateSession.mockResolvedValue(Results.ok(mockRequestContext));
      mockAuthenticationService.refreshToken.mockResolvedValue(Results.ok(mockAuthResponse));

      const loginDto: LoginDto = {
        identifier: 'test@example.com',
        password: 'password123',
        authMethod: AuthMethod.EMAIL,
        tenantId: 'tenant-1',
      };

      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'refresh-token',
      };

      // Test multiple operations
      await Promise.all([
        service.login(loginDto, '192.168.1.1'),
        service.validateSession('access-token'),
        service.refreshToken(refreshTokenDto, '192.168.1.1'),
      ]);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Authentication operations should complete quickly (under 200ms for this test)
      expect(executionTime).toBeLessThan(200);
    });
  });

  describe('Error handling patterns', () => {
    it('should provide consistent error handling across all methods', async () => {
      mockAuthenticationService.login.mockRejectedValue(new Error('Service unavailable'));

      const loginDto: LoginDto = {
        identifier: 'test@example.com',
        password: 'password123',
        authMethod: AuthMethod.EMAIL,
        tenantId: 'tenant-1',
      };

      await expect(service.login(loginDto, '192.168.1.1')).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login service error',
          fullMessage: 'Service unavailable',
        })
      );
    });

    it('should handle null and undefined inputs gracefully', async () => {
      mockAuthenticationService.validateSession.mockResolvedValue(Results.error(null, 'Invalid token'));

      await expect(service.validateSession(null as any)).rejects.toThrow(UnauthorizedException);
      await expect(service.validateSession(undefined as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should maintain security by not exposing sensitive information in logs', async () => {
      const loginDto: LoginDto = {
        identifier: 'test@example.com',
        password: 'secretPassword123',
        authMethod: AuthMethod.EMAIL,
        tenantId: 'tenant-1',
      };

      mockAuthenticationService.login.mockResolvedValue(Results.error(null, 'Invalid credentials'));

      await expect(service.login(loginDto, '192.168.1.1')).rejects.toThrow(UnauthorizedException);

      // Verify that password is not logged
      expect(mockLogger.warning).toHaveBeenCalledWith(
        expect.not.objectContaining({
          password: expect.anything(),
        })
      );
    });
  });
});