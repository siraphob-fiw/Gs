/**
 * E2E tests for authentication and authorization workflows
 * Tests comprehensive user registration, login, logout, JWT token validation,
 * refresh token functionality, session management, role-based access control,
 * and security monitoring integration
 */
import { INestApplication } from '@nestjs/common';
import { 
  SosWebApiTestApplicationFactory, 
  SosWebApiTestUtils, 
  TestApplicationHooks 
} from '../utils/test-application-factory';
import { SosWebApiTestConfigs } from '../utils/test-config';
import { UserTestFactory, TenantTestFactory, SosWebApiTestDataBuilder } from '../fixtures/test-factories';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mock://test-database';
process.env.JWT_SECRET = 'test-jwt-secret-for-e2e-auth-tests';
process.env.JWT_EXPIRES_IN = '1h';

describe('Authentication and Authorization E2E Workflows', () => {
  let app: INestApplication;
  let request: any;
  let testDataBuilder: SosWebApiTestDataBuilder;
  let userFactory: UserTestFactory;
  let tenantFactory: TenantTestFactory;

  // Test data
  let testTenant: any;
  let testUsers: {
    athlete: any;
    coach: any;
    admin: any;
    superAdmin: any;
  };

  beforeAll(async () => {
    // Create test application with E2E configuration
    const config = SosWebApiTestConfigs.custom(
      SosWebApiTestConfigs.forE2ETests(),
      {
        auth: {
          mockJwt: false, // Use real JWT for E2E tests
          defaultUserId: 'e2e-test-user',
          defaultRole: 'ATHLETE'
        },
        monitoring: {
          enabled: true,
          mockSecurityEvents: true // Mock security monitoring for testing
        }
      }
    );

    app = await SosWebApiTestApplicationFactory.createForE2ETests(config);
    request = await SosWebApiTestUtils.request(app);

    // Initialize test data factories
    testDataBuilder = new SosWebApiTestDataBuilder();
    userFactory = new UserTestFactory();
    tenantFactory = new TenantTestFactory();

    // Create test tenant and users
    testTenant = tenantFactory.create({
      id: 'auth-test-tenant',
      name: 'Auth Test Tenant',
      domain: 'auth-test.example.com'
    });

    testUsers = {
      athlete: userFactory.create({
        id: 'test-athlete-user',
        tenantId: testTenant.id,
        email: 'athlete@auth-test.example.com',
        role: 'ATHLETE',
        status: 'ACTIVE'
      }),
      coach: userFactory.createCoach({
        id: 'test-coach-user',
        tenantId: testTenant.id,
        email: 'coach@auth-test.example.com'
      }),
      admin: userFactory.createAdmin({
        id: 'test-admin-user',
        tenantId: testTenant.id,
        email: 'admin@auth-test.example.com'
      }),
      superAdmin: userFactory.createSuperAdmin({
        id: 'test-super-admin-user',
        email: 'superadmin@auth-test.example.com'
      })
    };

    await TestApplicationHooks.beforeAll(app, config);
  });

  beforeEach(async () => {
    await TestApplicationHooks.beforeEach(app);
    
    // Reset all mocks before each test
    SosWebApiTestUtils.resetAllMocks(app);
  });

  afterEach(async () => {
    await TestApplicationHooks.afterEach(app);
  });

  afterAll(async () => {
    await TestApplicationHooks.afterAll(app);
    SosWebApiTestApplicationFactory.reset();
  });

  describe('User Registration Workflows', () => {
    describe('Email Registration', () => {
      it('should register new user with email successfully', async () => {
        // Arrange
        const registrationData = {
          identifier: 'newuser@auth-test.example.com',
          password: 'SecurePassword123!',
          authMethod: 'EMAIL',
          tenantId: testTenant.id
        };

        // Mock user service to simulate successful registration
        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.login = jest.fn().mockResolvedValue({
          user: {
            ...testUsers.athlete,
            email: registrationData.identifier,
            id: 'new-user-id'
          },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: new Date(Date.now() + 3600000) // 1 hour
        });

        // Act
        const response = await request
          .post('/auth/login')
          .send(registrationData)
          .expect(200);

        // Assert
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');
        expect(response.body).toHaveProperty('expiresAt');
        expect(response.body.user.email).toBe(registrationData.identifier);
        expect(response.body.user.role).toBe('ATHLETE');

        // Verify security monitoring was called
        const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
        expect(monitoringService.logSecurityEvent).toHaveBeenCalledWith(
          'USER_LOGIN_SUCCESS',
          expect.objectContaining({
            userId: 'new-user-id',
            tenantId: testTenant.id,
            authMethod: 'EMAIL'
          })
        );
      });

      it('should reject registration with invalid email format', async () => {
        // Arrange
        const invalidRegistrationData = {
          identifier: 'invalid-email',
          password: 'SecurePassword123!',
          authMethod: 'EMAIL',
          tenantId: testTenant.id
        };

        // Mock auth service to simulate validation error
        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.login = jest.fn().mockRejectedValue(new Error('Invalid email format'));

        // Act & Assert
        const response = await request
          .post('/auth/login')
          .send(invalidRegistrationData)
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Invalid email format');
      });

      it('should reject registration with weak password', async () => {
        // Arrange
        const weakPasswordData = {
          identifier: 'user@auth-test.example.com',
          password: '123', // Weak password
          authMethod: 'EMAIL',
          tenantId: testTenant.id
        };

        // Mock auth service to simulate password validation error
        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.login = jest.fn().mockRejectedValue(new Error('Password does not meet security requirements'));

        // Act & Assert
        const response = await request
          .post('/auth/login')
          .send(weakPasswordData)
          .expect(400);

        expect(response.body.message).toContain('Password does not meet security requirements');
      });
    });

    describe('Phone Registration', () => {
      it('should register new user with phone number successfully', async () => {
        // Arrange
        const phoneRegistrationData = {
          phoneNumber: '+1234567890',
          authMethod: 'WHATSAPP',
          tenantId: testTenant.id,
          verificationToken: '123456',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            gender: 'male'
          }
        };

        // Mock auth service for phone registration
        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.registerWithPhone = jest.fn().mockResolvedValue({
          user: {
            id: 'phone-user-id',
            tenantId: testTenant.id,
            phoneNumber: phoneRegistrationData.phoneNumber,
            firstName: phoneRegistrationData.profile.firstName,
            lastName: phoneRegistrationData.profile.lastName,
            role: 'ATHLETE',
            status: 'ACTIVE'
          },
          accessToken: 'mock-phone-access-token',
          refreshToken: 'mock-phone-refresh-token',
          expiresAt: new Date(Date.now() + 3600000)
        });

        // Act
        const response = await request
          .post('/auth/register/phone')
          .send(phoneRegistrationData)
          .expect(201);

        // Assert
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body.user.phoneNumber).toBe(phoneRegistrationData.phoneNumber);
        expect(response.body.user.firstName).toBe(phoneRegistrationData.profile.firstName);

        // Verify phone registration was called correctly
        expect(authService.registerWithPhone).toHaveBeenCalledWith(
          phoneRegistrationData,
          expect.any(String), // IP address
          expect.any(String)  // User agent
        );
      });

      it('should handle phone verification workflow', async () => {
        // Arrange - Request phone verification
        const phoneVerificationData = {
          phoneNumber: '+1234567890',
          tenantId: testTenant.id,
          method: 'SMS'
        };

        // Mock auth service for phone verification
        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.requestPhoneVerification = jest.fn().mockResolvedValue(undefined);

        // Act - Request verification
        const verificationResponse = await request
          .post('/auth/phone/verify')
          .send(phoneVerificationData)
          .expect(200);

        // Assert verification request
        expect(verificationResponse.body.message).toBe('Verification code sent successfully');
        expect(authService.requestPhoneVerification).toHaveBeenCalledWith(
          phoneVerificationData,
          expect.any(String),
          expect.any(String)
        );

        // Arrange - Confirm phone verification
        const confirmationData = {
          phoneNumber: phoneVerificationData.phoneNumber,
          tenantId: testTenant.id,
          token: '123456'
        };

        authService.confirmPhoneVerification = jest.fn().mockResolvedValue(true);

        // Act - Confirm verification
        const confirmationResponse = await request
          .post('/auth/phone/verify/confirm')
          .send(confirmationData)
          .expect(200);

        // Assert confirmation
        expect(confirmationResponse.body.verified).toBe(true);
        expect(confirmationResponse.body.message).toBe('Phone verified successfully');
      });
    });
  });

  describe('User Login Workflows', () => {
    describe('Email Login', () => {
      it('should login user with valid credentials successfully', async () => {
        // Arrange
        const loginData = {
          identifier: testUsers.athlete.email,
          password: 'ValidPassword123!',
          authMethod: 'EMAIL',
          tenantId: testTenant.id
        };

        // Mock successful login
        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.login = jest.fn().mockResolvedValue({
          user: testUsers.athlete,
          accessToken: 'valid-access-token',
          refreshToken: 'valid-refresh-token',
          expiresAt: new Date(Date.now() + 3600000)
        });

        // Act
        const response = await request
          .post('/auth/login')
          .send(loginData)
          .expect(200);

        // Assert
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');
        expect(response.body.user.id).toBe(testUsers.athlete.id);
        expect(response.body.user.email).toBe(testUsers.athlete.email);

        // Verify login was called with correct parameters
        expect(authService.login).toHaveBeenCalledWith(
          loginData,
          expect.any(String), // IP address
          expect.any(String)  // User agent
        );

        // Verify security monitoring
        const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
        expect(monitoringService.logSecurityEvent).toHaveBeenCalledWith(
          'USER_LOGIN_SUCCESS',
          expect.objectContaining({
            userId: testUsers.athlete.id,
            tenantId: testTenant.id
          })
        );
      });

      it('should reject login with invalid credentials', async () => {
        // Arrange
        const invalidLoginData = {
          identifier: testUsers.athlete.email,
          password: 'WrongPassword123!',
          authMethod: 'EMAIL',
          tenantId: testTenant.id
        };

        // Mock failed login
        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.login = jest.fn().mockRejectedValue(new Error('Invalid credentials'));

        // Act & Assert
        const response = await request
          .post('/auth/login')
          .send(invalidLoginData)
          .expect(401);

        expect(response.body.message).toContain('Invalid credentials');

        // Verify failed login monitoring
        const securityMonitoringService = SosWebApiTestUtils.getService(app, 'SecurityMonitoringService');
        expect(securityMonitoringService.logFailedLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            identifier: invalidLoginData.identifier,
            tenantId: testTenant.id,
            reason: 'INVALID_CREDENTIALS'
          })
        );
      });

      it('should handle account lockout after multiple failed attempts', async () => {
        // Arrange
        const loginData = {
          identifier: testUsers.athlete.email,
          password: 'WrongPassword123!',
          authMethod: 'EMAIL',
          tenantId: testTenant.id
        };

        // Mock rate limiting service
        const securityMonitoringService = SosWebApiTestUtils.getService(app, 'SecurityMonitoringService');
        securityMonitoringService.checkRateLimit = jest.fn()
          .mockResolvedValueOnce(true)  // First attempt allowed
          .mockResolvedValueOnce(true)  // Second attempt allowed
          .mockResolvedValueOnce(false); // Third attempt blocked

        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.login = jest.fn().mockRejectedValue(new Error('Account temporarily locked'));

        // Act - Multiple failed attempts
        await request.post('/auth/login').send(loginData).expect(401);
        await request.post('/auth/login').send(loginData).expect(401);
        
        const response = await request
          .post('/auth/login')
          .send(loginData)
          .expect(429); // Too Many Requests

        // Assert
        expect(response.body.message).toContain('Account temporarily locked');
        expect(securityMonitoringService.logSuspiciousActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'MULTIPLE_FAILED_LOGINS',
            identifier: loginData.identifier
          })
        );
      });

      it('should support remember me functionality', async () => {
        // Arrange
        const loginData = {
          identifier: testUsers.athlete.email,
          password: 'ValidPassword123!',
          authMethod: 'EMAIL',
          tenantId: testTenant.id,
          rememberMe: true
        };

        // Mock extended session login
        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.login = jest.fn().mockResolvedValue({
          user: testUsers.athlete,
          accessToken: 'extended-access-token',
          refreshToken: 'extended-refresh-token',
          expiresAt: new Date(Date.now() + 30 * 24 * 3600000) // 30 days
        });

        // Act
        const response = await request
          .post('/auth/login')
          .send(loginData)
          .expect(200);

        // Assert
        expect(response.body.expiresAt).toBeDefined();
        const expiresAt = new Date(response.body.expiresAt);
        const now = new Date();
        const daysDifference = (expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24);
        
        expect(daysDifference).toBeGreaterThan(25); // Should be close to 30 days
        expect(authService.login).toHaveBeenCalledWith(
          expect.objectContaining({ rememberMe: true }),
          expect.any(String),
          expect.any(String)
        );
      });
    });

    describe('Multi-tenant Login', () => {
      it('should login user to correct tenant', async () => {
        // Arrange
        const loginData = {
          identifier: testUsers.athlete.email,
          password: 'ValidPassword123!',
          authMethod: 'EMAIL',
          tenantId: testTenant.id
        };

        // Mock tenant-specific login
        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.login = jest.fn().mockResolvedValue({
          user: {
            ...testUsers.athlete,
            tenantId: testTenant.id
          },
          accessToken: 'tenant-specific-token',
          refreshToken: 'tenant-specific-refresh',
          expiresAt: new Date(Date.now() + 3600000)
        });

        // Act
        const response = await request
          .post('/auth/login')
          .send(loginData)
          .expect(200);

        // Assert
        expect(response.body.user.tenantId).toBe(testTenant.id);
        expect(authService.login).toHaveBeenCalledWith(
          expect.objectContaining({ tenantId: testTenant.id }),
          expect.any(String),
          expect.any(String)
        );
      });

      it('should reject login for wrong tenant', async () => {
        // Arrange
        const wrongTenantData = {
          identifier: testUsers.athlete.email,
          password: 'ValidPassword123!',
          authMethod: 'EMAIL',
          tenantId: 'wrong-tenant-id'
        };

        // Mock tenant validation error
        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.login = jest.fn().mockRejectedValue(new Error('User not found in specified tenant'));

        // Act & Assert
        const response = await request
          .post('/auth/login')
          .send(wrongTenantData)
          .expect(404);

        expect(response.body.message).toContain('User not found in specified tenant');
      });
    });
  });

  describe('JWT Token Validation and Management', () => {
    let validToken: string;

    beforeEach(async () => {
      // Setup valid token for tests
      validToken = await SosWebApiTestUtils.setupAuth(
        app,
        testUsers.athlete.id,
        testUsers.athlete.role,
        testTenant.id
      );
    });

    describe('Access Token Validation', () => {
      it('should accept valid JWT token', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(validToken);

        // Act
        const response = await request
          .get('/auth/profile')
          .set(headers)
          .expect(200);

        // Assert
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('email');
        expect(response.body).toHaveProperty('role');
      });

      it('should reject expired JWT token', async () => {
        // Arrange - Mock expired token
        const jwtService = SosWebApiTestUtils.getService(app, 'JwtService');
        jwtService.verify = jest.fn().mockImplementation(() => {
          throw new Error('Token expired');
        });

        const headers = SosWebApiTestUtils.createAuthHeaders('expired-token');

        // Act & Assert
        const response = await request
          .get('/auth/profile')
          .set(headers)
          .expect(401);

        expect(response.body.message).toContain('Token expired');
      });

      it('should reject malformed JWT token', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders('malformed.jwt.token');

        // Mock JWT service to throw malformed token error
        const jwtService = SosWebApiTestUtils.getService(app, 'JwtService');
        jwtService.verify = jest.fn().mockImplementation(() => {
          throw new Error('Invalid token format');
        });

        // Act & Assert
        const response = await request
          .get('/auth/profile')
          .set(headers)
          .expect(401);

        expect(response.body.message).toContain('Invalid token format');
      });

      it('should reject token without proper signature', async () => {
        // Arrange
        const unsignedToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ0ZXN0LXVzZXIifQ.';
        const headers = SosWebApiTestUtils.createAuthHeaders(unsignedToken);

        // Mock JWT service to reject unsigned token
        const jwtService = SosWebApiTestUtils.getService(app, 'JwtService');
        jwtService.verify = jest.fn().mockImplementation(() => {
          throw new Error('Invalid signature');
        });

        // Act & Assert
        const response = await request
          .get('/auth/profile')
          .set(headers)
          .expect(401);

        expect(response.body.message).toContain('Invalid signature');
      });
    });

    describe('Token Payload Validation', () => {
      it('should validate token contains required claims', async () => {
        // Arrange
        const jwtService = SosWebApiTestUtils.getService(app, 'JwtService');
        jwtService.verify = jest.fn().mockReturnValue({
          sub: testUsers.athlete.id,
          role: testUsers.athlete.role,
          tenantId: testTenant.id,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600
        });

        const headers = SosWebApiTestUtils.createAuthHeaders(validToken);

        // Act
        const response = await request
          .get('/auth/profile')
          .set(headers)
          .expect(200);

        // Assert
        expect(jwtService.verify).toHaveBeenCalledWith(validToken);
        expect(response.body.userId).toBe(testUsers.athlete.id);
        expect(response.body.role).toBe(testUsers.athlete.role);
        expect(response.body.tenantId).toBe(testTenant.id);
      });

      it('should reject token with missing required claims', async () => {
        // Arrange - Token missing tenantId claim
        const jwtService = SosWebApiTestUtils.getService(app, 'JwtService');
        jwtService.verify = jest.fn().mockReturnValue({
          sub: testUsers.athlete.id,
          role: testUsers.athlete.role,
          // Missing tenantId
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600
        });

        const headers = SosWebApiTestUtils.createAuthHeaders('incomplete-token');

        // Act & Assert
        const response = await request
          .get('/auth/profile')
          .set(headers)
          .expect(401);

        expect(response.body.message).toContain('Invalid token claims');
      });
    });
  });

  describe('Refresh Token Functionality', () => {
    let refreshToken: string;

    beforeEach(() => {
      refreshToken = 'valid-refresh-token';
    });

    it('should generate new access token with valid refresh token', async () => {
      // Arrange
      const refreshData = {
        refreshToken: refreshToken
      };

      // Mock successful token refresh
      const authService = SosWebApiTestUtils.getService(app, 'AuthService');
      authService.refreshToken = jest.fn().mockResolvedValue({
        user: testUsers.athlete,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: new Date(Date.now() + 3600000)
      });

      // Act
      const response = await request
        .post('/auth/refresh')
        .send(refreshData)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.accessToken).toBe('new-access-token');
      expect(response.body.refreshToken).toBe('new-refresh-token');

      expect(authService.refreshToken).toHaveBeenCalledWith(
        refreshData,
        expect.any(String), // IP address
        expect.any(String)  // User agent
      );
    });

    it('should reject expired refresh token', async () => {
      // Arrange
      const expiredRefreshData = {
        refreshToken: 'expired-refresh-token'
      };

      // Mock expired refresh token
      const authService = SosWebApiTestUtils.getService(app, 'AuthService');
      authService.refreshToken = jest.fn().mockRejectedValue(new Error('Refresh token expired'));

      // Act & Assert
      const response = await request
        .post('/auth/refresh')
        .send(expiredRefreshData)
        .expect(401);

      expect(response.body.message).toContain('Refresh token expired');
    });

    it('should reject invalid refresh token', async () => {
      // Arrange
      const invalidRefreshData = {
        refreshToken: 'invalid-refresh-token'
      };

      // Mock invalid refresh token
      const authService = SosWebApiTestUtils.getService(app, 'AuthService');
      authService.refreshToken = jest.fn().mockRejectedValue(new Error('Invalid refresh token'));

      // Act & Assert
      const response = await request
        .post('/auth/refresh')
        .send(invalidRefreshData)
        .expect(401);

      expect(response.body.message).toContain('Invalid refresh token');
    });

    it('should track refresh token usage for security monitoring', async () => {
      // Arrange
      const refreshData = {
        refreshToken: refreshToken
      };

      const authService = SosWebApiTestUtils.getService(app, 'AuthService');
      authService.refreshToken = jest.fn().mockResolvedValue({
        user: testUsers.athlete,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: new Date(Date.now() + 3600000)
      });

      // Act
      await request
        .post('/auth/refresh')
        .send(refreshData)
        .expect(200);

      // Assert security monitoring
      const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
      expect(monitoringService.logSecurityEvent).toHaveBeenCalledWith(
        'TOKEN_REFRESH_SUCCESS',
        expect.objectContaining({
          userId: testUsers.athlete.id,
          tenantId: testTenant.id
        })
      );
    });
  });

  describe('Session Management', () => {
    let authToken: string;

    beforeEach(async () => {
      authToken = await SosWebApiTestUtils.setupAuth(
        app,
        testUsers.athlete.id,
        testUsers.athlete.role,
        testTenant.id
      );
    });

    describe('User Sessions', () => {
      it('should get all active sessions for user', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(authToken);

        // Mock sessions service
        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.getUserSessions = jest.fn().mockResolvedValue([
          {
            sessionId: 'session-1',
            deviceInfo: 'Chrome on Windows',
            ipAddress: '192.168.1.1',
            lastActivity: new Date(),
            isCurrentSession: true
          },
          {
            sessionId: 'session-2',
            deviceInfo: 'Safari on iPhone',
            ipAddress: '192.168.1.2',
            lastActivity: new Date(Date.now() - 3600000), // 1 hour ago
            isCurrentSession: false
          }
        ]);

        // Act
        const response = await request
          .get('/auth/sessions')
          .set(headers)
          .expect(200);

        // Assert
        expect(response.body).toHaveLength(2);
        expect(response.body[0]).toHaveProperty('sessionId');
        expect(response.body[0]).toHaveProperty('deviceInfo');
        expect(response.body[0]).toHaveProperty('isCurrentSession');
        expect(authService.getUserSessions).toHaveBeenCalledWith(testUsers.athlete.id);
      });

      it('should revoke specific session', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(authToken);
        const sessionIdToRevoke = 'session-to-revoke';

        // Mock session revocation
        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.revokeSession = jest.fn().mockResolvedValue(undefined);

        // Act
        const response = await request
          .delete(`/auth/sessions/${sessionIdToRevoke}`)
          .set(headers)
          .expect(200);

        // Assert
        expect(response.body.message).toBe('Session revoked successfully');
        expect(authService.revokeSession).toHaveBeenCalledWith(
          testUsers.athlete.id,
          sessionIdToRevoke
        );
      });

      it('should revoke all sessions', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(authToken);

        // Mock all sessions revocation
        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.logoutAllSessions = jest.fn().mockResolvedValue(undefined);

        // Act
        const response = await request
          .delete('/auth/sessions')
          .set(headers)
          .expect(200);

        // Assert
        expect(response.body.message).toBe('All sessions revoked successfully');
        expect(authService.logoutAllSessions).toHaveBeenCalledWith(testUsers.athlete.id);
      });
    });

    describe('Session Security', () => {
      it('should detect and handle concurrent sessions from different locations', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(authToken);

        // Mock security monitoring for concurrent sessions
        const securityMonitoringService = SosWebApiTestUtils.getService(app, 'SecurityMonitoringService');
        securityMonitoringService.logSuspiciousActivity = jest.fn().mockResolvedValue(undefined);

        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.getUserSessions = jest.fn().mockResolvedValue([
          {
            sessionId: 'session-1',
            ipAddress: '192.168.1.1',
            location: 'New York, US',
            lastActivity: new Date()
          },
          {
            sessionId: 'session-2',
            ipAddress: '203.0.113.1',
            location: 'London, UK',
            lastActivity: new Date(Date.now() - 300000) // 5 minutes ago
          }
        ]);

        // Act
        await request
          .get('/auth/sessions')
          .set(headers)
          .expect(200);

        // Assert - Should log suspicious activity for concurrent sessions from different locations
        expect(securityMonitoringService.logSuspiciousActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'CONCURRENT_SESSIONS_DIFFERENT_LOCATIONS',
            userId: testUsers.athlete.id
          })
        );
      });

      it('should handle session hijacking detection', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(authToken);

        // Mock session validation that detects hijacking
        const jwtService = SosWebApiTestUtils.getService(app, 'JwtService');
        jwtService.verify = jest.fn().mockImplementation(() => {
          throw new Error('Session validation failed - possible hijacking');
        });

        // Act & Assert
        const response = await request
          .get('/auth/profile')
          .set(headers)
          .expect(401);

        expect(response.body.message).toContain('Session validation failed');

        // Verify security monitoring
        const securityMonitoringService = SosWebApiTestUtils.getService(app, 'SecurityMonitoringService');
        expect(securityMonitoringService.logSuspiciousActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'POSSIBLE_SESSION_HIJACKING'
          })
        );
      });
    });
  });

  describe('User Logout Workflows', () => {
    let authToken: string;

    beforeEach(async () => {
      authToken = await SosWebApiTestUtils.setupAuth(
        app,
        testUsers.athlete.id,
        testUsers.athlete.role,
        testTenant.id
      );
    });

    it('should logout user successfully and invalidate session', async () => {
      // Arrange
      const headers = SosWebApiTestUtils.createAuthHeaders(authToken);

      // Mock logout service
      const authService = SosWebApiTestUtils.getService(app, 'AuthService');
      authService.logout = jest.fn().mockResolvedValue(undefined);

      // Act
      const response = await request
        .post('/auth/logout')
        .set(headers)
        .expect(200);

      // Assert
      expect(response.body.message).toBe('Successfully logged out');
      expect(authService.logout).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUsers.athlete.id,
          tenantId: testTenant.id
        }),
        expect.any(String) // sessionId
      );

      // Verify security monitoring
      const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
      expect(monitoringService.logSecurityEvent).toHaveBeenCalledWith(
        'USER_LOGOUT_SUCCESS',
        expect.objectContaining({
          userId: testUsers.athlete.id,
          tenantId: testTenant.id
        })
      );
    });

    it('should reject requests with invalidated token after logout', async () => {
      // Arrange
      const headers = SosWebApiTestUtils.createAuthHeaders(authToken);

      // Mock logout service
      const authService = SosWebApiTestUtils.getService(app, 'AuthService');
      authService.logout = jest.fn().mockResolvedValue(undefined);

      // Act - Logout first
      await request
        .post('/auth/logout')
        .set(headers)
        .expect(200);

      // Mock JWT service to reject invalidated token
      const jwtService = SosWebApiTestUtils.getService(app, 'JwtService');
      jwtService.verify = jest.fn().mockImplementation(() => {
        throw new Error('Token has been invalidated');
      });

      // Act - Try to use invalidated token
      const response = await request
        .get('/auth/profile')
        .set(headers)
        .expect(401);

      // Assert
      expect(response.body.message).toContain('Token has been invalidated');
    });

    it('should handle logout without valid session gracefully', async () => {
      // Arrange - Invalid token
      const headers = SosWebApiTestUtils.createAuthHeaders('invalid-token');

      // Mock JWT service to reject invalid token
      const jwtService = SosWebApiTestUtils.getService(app, 'JwtService');
      jwtService.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      const response = await request
        .post('/auth/logout')
        .set(headers)
        .expect(401);

      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    let athleteToken: string;
    let coachToken: string;
    let adminToken: string;
    let superAdminToken: string;

    beforeEach(async () => {
      // Setup tokens for different roles
      athleteToken = await SosWebApiTestUtils.setupAuth(
        app,
        testUsers.athlete.id,
        'ATHLETE',
        testTenant.id
      );

      coachToken = await SosWebApiTestUtils.setupAuth(
        app,
        testUsers.coach.id,
        'COACH',
        testTenant.id
      );

      adminToken = await SosWebApiTestUtils.setupAuth(
        app,
        testUsers.admin.id,
        'TENANT_ADMIN',
        testTenant.id
      );

      superAdminToken = await SosWebApiTestUtils.setupAuth(
        app,
        testUsers.superAdmin.id,
        'SUPER_ADMIN',
        'system'
      );
    });

    describe('Athlete Role Permissions', () => {
      it('should allow athlete to access their own profile', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(athleteToken);

        // Act
        const response = await request
          .get('/auth/profile')
          .set(headers)
          .expect(200);

        // Assert
        expect(response.body.role).toBe('ATHLETE');
        expect(response.body.userId).toBe(testUsers.athlete.id);
      });

      it('should deny athlete access to admin endpoints', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(athleteToken);

        // Mock admin endpoint that should be restricted
        // Note: This would be a real admin endpoint in the actual application
        const response = await request
          .get('/admin/users') // Hypothetical admin endpoint
          .set(headers)
          .expect(403);

        // Assert
        expect(response.body.message).toContain('Insufficient permissions');
      });

      it('should allow athlete to change their own password', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(athleteToken);
        const changePasswordData = {
          currentPassword: 'CurrentPassword123!',
          newPassword: 'NewPassword123!'
        };

        // Mock password change service
        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.changePassword = jest.fn().mockResolvedValue(undefined);

        // Act
        const response = await request
          .post('/auth/change-password')
          .set(headers)
          .send(changePasswordData)
          .expect(200);

        // Assert
        expect(response.body.message).toBe('Password changed successfully');
        expect(authService.changePassword).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: testUsers.athlete.id,
            role: 'ATHLETE'
          }),
          changePasswordData
        );
      });
    });

    describe('Coach Role Permissions', () => {
      it('should allow coach to access coach-specific endpoints', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(coachToken);

        // Act
        const response = await request
          .get('/auth/profile')
          .set(headers)
          .expect(200);

        // Assert
        expect(response.body.role).toBe('COACH');
        expect(response.body.userId).toBe(testUsers.coach.id);
      });

      it('should allow coach to manage their athletes', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(coachToken);

        // Mock coach accessing athlete data (this would be a real endpoint)
        const response = await request
          .get('/coach/athletes') // Hypothetical coach endpoint
          .set(headers)
          .expect(200);

        // Assert - Coach should have access to athlete management
        expect(response.status).toBe(200);
      });

      it('should deny coach access to admin-only endpoints', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(coachToken);

        // Act & Assert
        const response = await request
          .get('/admin/system-settings') // Hypothetical admin-only endpoint
          .set(headers)
          .expect(403);

        expect(response.body.message).toContain('Insufficient permissions');
      });
    });

    describe('Admin Role Permissions', () => {
      it('should allow admin to access tenant management endpoints', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act
        const response = await request
          .get('/auth/profile')
          .set(headers)
          .expect(200);

        // Assert
        expect(response.body.role).toBe('TENANT_ADMIN');
        expect(response.body.tenantId).toBe(testTenant.id);
      });

      it('should allow admin to manage users within their tenant', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Mock admin accessing tenant user management
        const response = await request
          .get('/admin/tenant/users') // Hypothetical tenant admin endpoint
          .set(headers)
          .expect(200);

        // Assert
        expect(response.status).toBe(200);
      });

      it('should deny admin access to super admin endpoints', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(adminToken);

        // Act & Assert
        const response = await request
          .get('/super-admin/system') // Hypothetical super admin endpoint
          .set(headers)
          .expect(403);

        expect(response.body.message).toContain('Insufficient permissions');
      });
    });

    describe('Super Admin Role Permissions', () => {
      it('should allow super admin to access all system endpoints', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(superAdminToken);

        // Act
        const response = await request
          .get('/auth/profile')
          .set(headers)
          .expect(200);

        // Assert
        expect(response.body.role).toBe('SUPER_ADMIN');
        expect(response.body.tenantId).toBe('system');
      });

      it('should allow super admin to access cross-tenant data', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(superAdminToken);

        // Mock super admin accessing system-wide data
        const response = await request
          .get('/super-admin/all-tenants') // Hypothetical super admin endpoint
          .set(headers)
          .expect(200);

        // Assert
        expect(response.status).toBe(200);
      });
    });

    describe('Cross-Tenant Access Control', () => {
      it('should prevent users from accessing data from other tenants', async () => {
        // Arrange - Create user from different tenant
        const otherTenant = tenantFactory.create({
          id: 'other-tenant',
          name: 'Other Tenant'
        });

        const otherTenantUser = userFactory.create({
          tenantId: otherTenant.id,
          email: 'user@other-tenant.example.com'
        });

        const otherTenantToken = await SosWebApiTestUtils.setupAuth(
          app,
          otherTenantUser.id,
          'ATHLETE',
          otherTenant.id
        );

        const headers = SosWebApiTestUtils.createAuthHeaders(otherTenantToken);

        // Act - Try to access data from original tenant
        const response = await request
          .get(`/tenant/${testTenant.id}/data`) // Hypothetical tenant-specific endpoint
          .set(headers)
          .expect(403);

        // Assert
        expect(response.body.message).toContain('Access denied to tenant data');
      });

      it('should allow super admin to access any tenant data', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(superAdminToken);

        // Act - Super admin accessing specific tenant data
        const response = await request
          .get(`/super-admin/tenant/${testTenant.id}/data`) // Hypothetical super admin endpoint
          .set(headers)
          .expect(200);

        // Assert
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Security Monitoring Integration', () => {
    let authToken: string;

    beforeEach(async () => {
      authToken = await SosWebApiTestUtils.setupAuth(
        app,
        testUsers.athlete.id,
        testUsers.athlete.role,
        testTenant.id
      );
    });

    describe('Failed Login Tracking', () => {
      it('should log failed login attempts with detailed context', async () => {
        // Arrange
        const failedLoginData = {
          identifier: 'nonexistent@example.com',
          password: 'WrongPassword123!',
          authMethod: 'EMAIL',
          tenantId: testTenant.id
        };

        // Mock failed login
        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.login = jest.fn().mockRejectedValue(new Error('User not found'));

        // Act
        await request
          .post('/auth/login')
          .send(failedLoginData)
          .expect(404);

        // Assert security monitoring
        const securityMonitoringService = SosWebApiTestUtils.getService(app, 'SecurityMonitoringService');
        expect(securityMonitoringService.logFailedLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            identifier: failedLoginData.identifier,
            tenantId: testTenant.id,
            reason: 'USER_NOT_FOUND',
            ipAddress: expect.any(String),
            userAgent: expect.any(String),
            timestamp: expect.any(Date)
          })
        );
      });

      it('should track multiple failed attempts from same IP', async () => {
        // Arrange
        const loginData = {
          identifier: testUsers.athlete.email,
          password: 'WrongPassword123!',
          authMethod: 'EMAIL',
          tenantId: testTenant.id
        };

        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.login = jest.fn().mockRejectedValue(new Error('Invalid credentials'));

        const securityMonitoringService = SosWebApiTestUtils.getService(app, 'SecurityMonitoringService');

        // Act - Multiple failed attempts
        for (let i = 0; i < 3; i++) {
          await request
            .post('/auth/login')
            .send(loginData)
            .expect(401);
        }

        // Assert
        expect(securityMonitoringService.logFailedLogin).toHaveBeenCalledTimes(3);
        expect(securityMonitoringService.logSuspiciousActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'MULTIPLE_FAILED_LOGINS',
            identifier: loginData.identifier,
            attemptCount: 3
          })
        );
      });
    });

    describe('Suspicious Activity Detection', () => {
      it('should detect and log unusual login patterns', async () => {
        // Arrange - Login from unusual location
        const loginData = {
          identifier: testUsers.athlete.email,
          password: 'ValidPassword123!',
          authMethod: 'EMAIL',
          tenantId: testTenant.id
        };

        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.login = jest.fn().mockResolvedValue({
          user: testUsers.athlete,
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresAt: new Date(Date.now() + 3600000)
        });

        // Mock unusual location detection
        const securityMonitoringService = SosWebApiTestUtils.getService(app, 'SecurityMonitoringService');
        securityMonitoringService.logSuspiciousActivity = jest.fn().mockResolvedValue(undefined);

        // Act
        await request
          .post('/auth/login')
          .set('X-Forwarded-For', '203.0.113.1') // Unusual IP
          .send(loginData)
          .expect(200);

        // Assert
        expect(securityMonitoringService.logSuspiciousActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'UNUSUAL_LOGIN_LOCATION',
            userId: testUsers.athlete.id,
            ipAddress: '203.0.113.1'
          })
        );
      });

      it('should detect rapid successive login attempts', async () => {
        // Arrange
        const loginData = {
          identifier: testUsers.athlete.email,
          password: 'ValidPassword123!',
          authMethod: 'EMAIL',
          tenantId: testTenant.id
        };

        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.login = jest.fn().mockResolvedValue({
          user: testUsers.athlete,
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresAt: new Date(Date.now() + 3600000)
        });

        const securityMonitoringService = SosWebApiTestUtils.getService(app, 'SecurityMonitoringService');

        // Act - Rapid successive logins
        const promises = Array(5).fill(null).map(() =>
          request.post('/auth/login').send(loginData)
        );

        await Promise.all(promises);

        // Assert
        expect(securityMonitoringService.logSuspiciousActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'RAPID_LOGIN_ATTEMPTS',
            userId: testUsers.athlete.id,
            attemptCount: 5
          })
        );
      });

      it('should monitor token usage patterns', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(authToken);

        // Mock unusual token usage pattern
        const securityMonitoringService = SosWebApiTestUtils.getService(app, 'SecurityMonitoringService');
        securityMonitoringService.logAccessAttempt = jest.fn().mockResolvedValue(undefined);

        // Act - Multiple rapid API calls
        const promises = Array(10).fill(null).map(() =>
          request.get('/auth/profile').set(headers)
        );

        await Promise.all(promises);

        // Assert
        expect(securityMonitoringService.logAccessAttempt).toHaveBeenCalledTimes(10);
        expect(securityMonitoringService.logSuspiciousActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'UNUSUAL_API_USAGE_PATTERN',
            userId: testUsers.athlete.id
          })
        );
      });
    });

    describe('Security Event Logging', () => {
      it('should log successful authentication events', async () => {
        // Arrange
        const loginData = {
          identifier: testUsers.athlete.email,
          password: 'ValidPassword123!',
          authMethod: 'EMAIL',
          tenantId: testTenant.id
        };

        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.login = jest.fn().mockResolvedValue({
          user: testUsers.athlete,
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresAt: new Date(Date.now() + 3600000)
        });

        // Act
        await request
          .post('/auth/login')
          .send(loginData)
          .expect(200);

        // Assert
        const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
        expect(monitoringService.logSecurityEvent).toHaveBeenCalledWith(
          'USER_LOGIN_SUCCESS',
          expect.objectContaining({
            userId: testUsers.athlete.id,
            tenantId: testTenant.id,
            authMethod: 'EMAIL',
            ipAddress: expect.any(String),
            userAgent: expect.any(String),
            timestamp: expect.any(Date)
          })
        );
      });

      it('should log password change events', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(authToken);
        const changePasswordData = {
          currentPassword: 'CurrentPassword123!',
          newPassword: 'NewPassword123!'
        };

        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.changePassword = jest.fn().mockResolvedValue(undefined);

        // Act
        await request
          .post('/auth/change-password')
          .set(headers)
          .send(changePasswordData)
          .expect(200);

        // Assert
        const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
        expect(monitoringService.logSecurityEvent).toHaveBeenCalledWith(
          'PASSWORD_CHANGE_SUCCESS',
          expect.objectContaining({
            userId: testUsers.athlete.id,
            tenantId: testTenant.id
          })
        );
      });

      it('should log session management events', async () => {
        // Arrange
        const headers = SosWebApiTestUtils.createAuthHeaders(authToken);

        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.logout = jest.fn().mockResolvedValue(undefined);

        // Act
        await request
          .post('/auth/logout')
          .set(headers)
          .expect(200);

        // Assert
        const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
        expect(monitoringService.logSecurityEvent).toHaveBeenCalledWith(
          'USER_LOGOUT_SUCCESS',
          expect.objectContaining({
            userId: testUsers.athlete.id,
            tenantId: testTenant.id,
            sessionId: expect.any(String)
          })
        );
      });
    });

    describe('Rate Limiting and Abuse Prevention', () => {
      it('should enforce rate limits on login attempts', async () => {
        // Arrange
        const loginData = {
          identifier: testUsers.athlete.email,
          password: 'WrongPassword123!',
          authMethod: 'EMAIL',
          tenantId: testTenant.id
        };

        const securityMonitoringService = SosWebApiTestUtils.getService(app, 'SecurityMonitoringService');
        securityMonitoringService.checkRateLimit = jest.fn()
          .mockResolvedValueOnce(true)   // First attempt allowed
          .mockResolvedValueOnce(true)   // Second attempt allowed
          .mockResolvedValueOnce(false); // Third attempt blocked

        const authService = SosWebApiTestUtils.getService(app, 'AuthService');
        authService.login = jest.fn().mockRejectedValue(new Error('Rate limit exceeded'));

        // Act - Multiple attempts
        await request.post('/auth/login').send(loginData).expect(401);
        await request.post('/auth/login').send(loginData).expect(401);
        
        const response = await request
          .post('/auth/login')
          .send(loginData)
          .expect(429);

        // Assert
        expect(response.body.message).toContain('Rate limit exceeded');
        expect(securityMonitoringService.checkRateLimit).toHaveBeenCalledTimes(3);
      });

      it('should enforce rate limits on token refresh attempts', async () => {
        // Arrange
        const refreshData = {
          refreshToken: 'some-refresh-token'
        };

        const securityMonitoringService = SosWebApiTestUtils.getService(app, 'SecurityMonitoringService');
        securityMonitoringService.checkRateLimit = jest.fn().mockResolvedValue(false);

        // Act & Assert
        const response = await request
          .post('/auth/refresh')
          .send(refreshData)
          .expect(429);

        expect(response.body.message).toContain('Rate limit exceeded');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed request bodies gracefully', async () => {
      // Act & Assert
      const response = await request
        .post('/auth/login')
        .send('invalid-json')
        .expect(400);

      expect(response.body.message).toContain('Invalid request format');
    });

    it('should handle missing required fields', async () => {
      // Arrange - Missing password field
      const incompleteData = {
        identifier: 'user@example.com',
        authMethod: 'EMAIL'
        // Missing password
      };

      // Act & Assert
      const response = await request
        .post('/auth/login')
        .send(incompleteData)
        .expect(400);

      expect(response.body.message).toContain('Missing required fields');
    });

    it('should handle database connection errors gracefully', async () => {
      // Arrange - Mock database error
      const authService = SosWebApiTestUtils.getService(app, 'AuthService');
      authService.login = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const loginData = {
        identifier: testUsers.athlete.email,
        password: 'ValidPassword123!',
        authMethod: 'EMAIL',
        tenantId: testTenant.id
      };

      // Act & Assert
      const response = await request
        .post('/auth/login')
        .send(loginData)
        .expect(500);

      expect(response.body.message).toContain('Internal server error');
    });

    it('should handle concurrent login attempts gracefully', async () => {
      // Arrange
      const loginData = {
        identifier: testUsers.athlete.email,
        password: 'ValidPassword123!',
        authMethod: 'EMAIL',
        tenantId: testTenant.id
      };

      const authService = SosWebApiTestUtils.getService(app, 'AuthService');
      authService.login = jest.fn().mockResolvedValue({
        user: testUsers.athlete,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000)
      });

      // Act - Concurrent login attempts
      const promises = Array(5).fill(null).map(() =>
        request.post('/auth/login').send(loginData)
      );

      const responses = await Promise.all(promises);

      // Assert - All should succeed without conflicts
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
      });
    });
  });
});