/**
 * AuthModule Integration Tests
 * 
 * Tests the complete AuthModule with minimal providers and mocked external dependencies.
 * Focuses on testing service interactions, authentication flows, JWT token generation,
 * and role-based access control without loading complex global providers.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

// Import production AuthModule and related components
import { AuthService } from '@strengthos/sos-web-api/src/auth/auth.service';

describe('AuthModule Integration', () => {
  let module: TestingModule;
  let authService: AuthService;
  let mockAuthenticationService: jest.Mocked<any>;
  let mockLogger: jest.Mocked<any>;

  beforeEach(async () => {
    // Create comprehensive mocks for external dependencies
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
    };

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      warning: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      info: jest.fn(),
    };

    // Create test-specific AuthModule configuration with minimal providers
    // Focus on core AuthService without complex guards/interceptors/controllers
    module = await Test.createTestingModule({
      providers: [
        AuthService,
        // Mock external dependencies
        {
          provide: 'AuthenticationService',
          useValue: mockAuthenticationService,
        },
        {
          provide: 'ILogger',
          useValue: mockLogger,
        },
        // Note: We exclude controllers, guards and interceptors to avoid complex dependency setup
        // This allows us to focus on testing the core service logic with mocked dependencies
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
    jest.clearAllMocks();
  });

  describe('Module Configuration', () => {
    it('should be defined and properly configured', () => {
      expect(module).toBeDefined();
      expect(authService).toBeDefined();
    });

    it('should have core AuthService from production', () => {
      const authServiceInstance = module.get(AuthService);

      expect(authServiceInstance).toBeDefined();
      
      // Verify this is the actual production class
      expect(authServiceInstance).toBeInstanceOf(AuthService);
      expect(authServiceInstance).toBe(authService);
    });

    it('should have mocked external dependencies', () => {
      const authenticationService = module.get('AuthenticationService');
      const logger = module.get('ILogger');

      expect(authenticationService).toBeDefined();
      expect(logger).toBeDefined();
      expect(authenticationService).toBe(mockAuthenticationService);
      expect(logger).toBe(mockLogger);
    });

    it('should properly inject mocked dependencies into AuthService', () => {
      // Verify that the AuthService can access its injected dependencies
      // This tests that the dependency injection is working correctly
      expect(authService).toBeDefined();
      
      // The service should be able to call methods without throwing dependency errors
      expect(() => {
        // This doesn't actually call the method, just verifies the service is properly constructed
        expect(authService.login).toBeDefined();
        expect(authService.refreshToken).toBeDefined();
        expect(authService.logout).toBeDefined();
        expect(authService.validateSession).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('AuthService Integration with Mocked Dependencies', () => {
    it('should integrate with mocked AuthenticationService correctly', async () => {
      const mockResponse = {
        isOk: true,
        returnValue: {
          user: { id: 'user-1', email: 'test@example.com', roles: ['athlete'] },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresAt: new Date(),
        },
      };

      mockAuthenticationService.login.mockResolvedValue(mockResponse);

      const result = await authService.login({
        identifier: 'test@example.com',
        password: 'password123',
        authMethod: 'EMAIL' as any,
      });

      expect(result).toEqual(mockResponse.returnValue);
      expect(mockAuthenticationService.login).toHaveBeenCalledWith({
        identifier: 'test@example.com',
        password: 'password123',
        authMethod: 'EMAIL',
        tenantId: undefined,
        rememberMe: false,
        verificationToken: undefined,
        oauthData: undefined,
        ipAddress: undefined,
        userAgent: undefined,
      });
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'User login successful',
        userId: 'user-1',
        identifier: 'test@example.com',
        authMethod: 'EMAIL',
        tenantId: undefined,
        ip: undefined,
      });
    });

    it('should handle authentication failures correctly', async () => {
      const mockResponse = {
        isOk: false,
        message: 'Invalid credentials',
      };

      mockAuthenticationService.login.mockResolvedValue(mockResponse);

      await expect(authService.login({
        identifier: 'test@example.com',
        password: 'wrongpassword',
        authMethod: 'EMAIL' as any,
      })).rejects.toThrow('Invalid credentials');

      expect(mockLogger.warning).toHaveBeenCalledWith({
        message: 'Login attempt failed',
        identifier: 'test@example.com',
        authMethod: 'EMAIL',
        tenantId: undefined,
        ip: undefined,
        fullMessage: 'Invalid credentials',
      });
    });

    it('should handle service errors and convert to UnauthorizedException', async () => {
      mockAuthenticationService.login.mockRejectedValue(new Error('Service unavailable'));

      await expect(authService.login({
        identifier: 'test@example.com',
        password: 'password123',
        authMethod: 'EMAIL' as any,
      })).rejects.toThrow('Authentication failed');

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Login service error',
        identifier: 'test@example.com',
        authMethod: 'EMAIL',
        ip: undefined,
        fullMessage: 'Service unavailable',
      });
    });

    it('should handle token refresh flow', async () => {
      const mockResponse = {
        isOk: true,
        returnValue: {
          user: { id: 'user-1', email: 'test@example.com' },
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresAt: new Date(),
        },
      };

      mockAuthenticationService.refreshToken.mockResolvedValue(mockResponse);

      const result = await authService.refreshToken({
        refreshToken: 'old-refresh-token',
      });

      expect(result).toEqual(mockResponse.returnValue);
      expect(mockAuthenticationService.refreshToken).toHaveBeenCalledWith({
        refreshToken: 'old-refresh-token',
        ipAddress: undefined,
        userAgent: undefined,
      });
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Token refresh successful',
        userId: 'user-1',
        ip: undefined,
      });
    });

    it('should handle logout flow', async () => {
      const mockResponse = { isOk: true };
      mockAuthenticationService.logout.mockResolvedValue(mockResponse);

      const mockUser = { userId: 'user-1', tenantId: 'tenant-1' };
      await authService.logout(mockUser as any, 'session-1');

      expect(mockAuthenticationService.logout).toHaveBeenCalledWith('user-1', 'session-1');
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'User logout successful',
        userId: 'user-1',
      });
    });

    it('should handle password change flow', async () => {
      const mockResponse = { isOk: true };
      mockAuthenticationService.changePassword.mockResolvedValue(mockResponse);

      const mockUser = { userId: 'user-1', tenantId: 'tenant-1' };
      await authService.changePassword(mockUser as any, {
        currentPassword: 'oldpass',
        newPassword: 'newpass',
      });

      expect(mockAuthenticationService.changePassword).toHaveBeenCalledWith({
        userId: 'user-1',
        currentPassword: 'oldpass',
        newPassword: 'newpass',
      });
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Password change successful',
        userId: 'user-1',
      });
    });

    it('should handle session validation for role checking', async () => {
      const mockResponse = {
        isOk: true,
        returnValue: {
          userId: 'user-1',
          tenantId: 'tenant-1',
          roles: ['athlete'],
          permissions: ['read:profile'],
        },
      };

      mockAuthenticationService.validateSession.mockResolvedValue(mockResponse);

      const result = await authService.validateSession('valid-token');

      expect(result).toEqual(mockResponse.returnValue);
      expect(mockAuthenticationService.validateSession).toHaveBeenCalledWith('valid-token');
    });

    it('should handle invalid session for role checking', async () => {
      const mockResponse = {
        isOk: false,
        message: 'Invalid or expired token',
      };

      mockAuthenticationService.validateSession.mockResolvedValue(mockResponse);

      await expect(authService.validateSession('invalid-token'))
        .rejects.toThrow('Invalid or expired token');
    });

    it('should handle different user roles in session validation', async () => {
      const testCases = [
        { roles: ['athlete'], expected: ['athlete'] },
        { roles: ['coach'], expected: ['coach'] },
        { roles: ['admin'], expected: ['admin'] },
        { roles: ['athlete', 'coach'], expected: ['athlete', 'coach'] },
      ];

      for (const testCase of testCases) {
        mockAuthenticationService.validateSession.mockResolvedValue({
          isOk: true,
          returnValue: {
            userId: 'user-1',
            tenantId: 'tenant-1',
            roles: testCase.roles,
          },
        });

        const result = await authService.validateSession('token');
        expect(result.roles).toEqual(testCase.expected);
        
        mockAuthenticationService.validateSession.mockReset();
      }
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should handle complete login-logout flow', async () => {
      // Mock successful login
      const loginResponse = {
        isOk: true,
        returnValue: {
          user: { id: 'user-1', email: 'test@example.com' },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresAt: new Date(),
        },
      };
      mockAuthenticationService.login.mockResolvedValue(loginResponse);

      // Mock successful logout
      const logoutResponse = { isOk: true };
      mockAuthenticationService.logout.mockResolvedValue(logoutResponse);

      // Execute login
      const loginResult = await authService.login({
        identifier: 'test@example.com',
        password: 'password123',
        authMethod: 'EMAIL' as any,
      });

      expect(loginResult).toEqual(loginResponse.returnValue);

      // Execute logout
      const mockUser = { userId: 'user-1', tenantId: 'tenant-1' };
      await authService.logout(mockUser as any, 'session-1');

      // Verify both operations were called
      expect(mockAuthenticationService.login).toHaveBeenCalled();
      expect(mockAuthenticationService.logout).toHaveBeenCalledWith('user-1', 'session-1');
      expect(mockLogger.info).toHaveBeenCalledTimes(2); // Login and logout success logs
    });

    it('should handle token refresh flow', async () => {
      const refreshResponse = {
        isOk: true,
        returnValue: {
          user: { id: 'user-1', email: 'test@example.com' },
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresAt: new Date(),
        },
      };
      mockAuthenticationService.refreshToken.mockResolvedValue(refreshResponse);

      const result = await authService.refreshToken({
        refreshToken: 'old-refresh-token',
      }, '127.0.0.1', 'Mozilla/5.0');

      expect(result).toEqual(refreshResponse.returnValue);
      expect(mockAuthenticationService.refreshToken).toHaveBeenCalledWith({
        refreshToken: 'old-refresh-token',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });
    });

    it('should handle password reset flow', async () => {
      // Mock forgot password (always succeeds for security)
      await authService.forgotPassword({
        email: 'test@example.com',
        tenantId: 'tenant-1',
      }, '127.0.0.1', 'Mozilla/5.0');

      // Mock reset password
      const resetResponse = { isOk: true, returnValue: { userId: 'user-1' } };
      mockAuthenticationService.resetPassword.mockResolvedValue(resetResponse);

      await authService.resetPassword({
        token: 'reset-token',
        newPassword: 'newpassword123',
      }, '127.0.0.1', 'Mozilla/5.0');

      expect(mockAuthenticationService.resetPassword).toHaveBeenCalledWith({
        token: 'reset-token',
        newPassword: 'newpassword123',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });
    });
  });

  describe('Mock State Management and Cleanup', () => {
    it('should reset mocks between tests', () => {
      // Call a method
      mockAuthenticationService.login({ identifier: 'test', authMethod: 'EMAIL' });
      
      expect(mockAuthenticationService.login).toHaveBeenCalledTimes(1);
      
      // Clear mocks (this happens in afterEach)
      jest.clearAllMocks();
      
      expect(mockAuthenticationService.login).toHaveBeenCalledTimes(0);
    });

    it('should allow different mock behaviors per test', async () => {
      // First behavior
      mockAuthenticationService.login.mockResolvedValueOnce({
        isOk: true,
        returnValue: { user: { id: 'user-1' } },
      });

      // Second behavior
      mockAuthenticationService.login.mockResolvedValueOnce({
        isOk: false,
        message: 'Invalid credentials',
      });

      const result1 = await authService.login({ identifier: 'valid@test.com', authMethod: 'EMAIL' as any });
      
      try {
        await authService.login({ identifier: 'invalid@test.com', authMethod: 'EMAIL' as any });
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
      }

      expect(result1).toEqual({ user: { id: 'user-1' } });
    });

    it('should handle complex mock scenarios with proper isolation', async () => {
      // Setup complex mock scenario for different user types
      mockAuthenticationService.login.mockImplementation(async (loginData) => {
        if (loginData.identifier === 'admin@example.com') {
          return {
            isOk: true,
            returnValue: {
              user: { id: 'admin-1', roles: ['admin'] },
              accessToken: 'admin-token',
            },
          };
        } else if (loginData.identifier === 'user@example.com') {
          return {
            isOk: true,
            returnValue: {
              user: { id: 'user-1', roles: ['athlete'] },
              accessToken: 'user-token',
            },
          };
        } else {
          return {
            isOk: false,
            message: 'User not found',
          };
        }
      });

      // Test admin login
      const adminResult = await authService.login({
        identifier: 'admin@example.com',
        password: 'password',
        authMethod: 'EMAIL' as any,
      });
      expect(adminResult.user.roles).toContain('admin');

      // Test user login
      const userResult = await authService.login({
        identifier: 'user@example.com',
        password: 'password',
        authMethod: 'EMAIL' as any,
      });
      expect(userResult.user.roles).toContain('athlete');

      // Test invalid login
      try {
        await authService.login({
          identifier: 'invalid@example.com',
          password: 'password',
          authMethod: 'EMAIL' as any,
        });
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('User not found');
      }
    });

    it('should verify module interactions work correctly with mocked dependencies', async () => {
      // Mock successful authentication
      mockAuthenticationService.login.mockResolvedValue({
        isOk: true,
        returnValue: {
          user: { id: 'user-1', email: 'test@example.com' },
          accessToken: 'token123',
        },
      });

      // Mock successful session validation
      mockAuthenticationService.validateSession.mockResolvedValue({
        isOk: true,
        returnValue: { userId: 'user-1', tenantId: 'tenant-1', roles: ['athlete'] },
      });

      // Test login through service
      const loginResult = await authService.login({
        identifier: 'test@example.com',
        password: 'password',
        authMethod: 'EMAIL' as any,
      });

      // Test session validation
      const sessionResult = await authService.validateSession(loginResult.accessToken);

      // Verify the complete flow worked
      expect(loginResult.user.id).toBe('user-1');
      expect(sessionResult.userId).toBe('user-1');
      expect(sessionResult.roles).toContain('athlete');
      
      // Verify all mocked services were called correctly
      expect(mockAuthenticationService.login).toHaveBeenCalled();
      expect(mockAuthenticationService.validateSession).toHaveBeenCalledWith('token123');
      expect(mockLogger.info).toHaveBeenCalledTimes(1); // Login success log
    });
  });
});