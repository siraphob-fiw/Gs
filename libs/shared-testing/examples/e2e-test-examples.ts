/**
 * E2E Test Examples
 * 
 * This file demonstrates comprehensive end-to-end testing patterns using the
 * modernized testing architecture with TestApplicationFactory.
 */

import { TestApplicationFactory } from '../src/builders/test-application-factory';
import { userFactory, tenantFactory } from '../src/factories';
import { createMockDatabase, createMockNotificationService, createMockSecurityService } from '../src/mocks';
import * as request from 'supertest';

// Example 1: Basic API E2E Testing
describe('User Management API (E2E)', () => {
  let app: INestApplication;
  let mockDatabase: jest.Mocked<DatabaseService>;
  let mockNotifications: jest.Mocked<NotificationService>;

  beforeAll(async () => {
    app = await TestApplicationFactory
      .create()
      .withMocks([
        { 
          module: DatabaseModule, 
          providers: [
            { provide: DatabaseService, useValue: createMockDatabase() }
          ]
        },
        {
          module: NotificationModule,
          providers: [
            { provide: 'NotificationService', useValue: createMockNotificationService() }
          ]
        }
      ])
      .build();

    mockDatabase = app.get(DatabaseService);
    mockNotifications = app.get('NotificationService');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/users', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const userData = {
        email: 'newuser@gym.com',
        firstName: 'John',
        lastName: 'Doe',
        tenantId: 'gym-123',
        role: 'athlete'
      };

      const expectedUser = userFactory.create(userData);
      mockDatabase.query().insert.mockResolvedValue([expectedUser]);
      mockNotifications.sendWelcomeEmail.mockResolvedValue({ success: true });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.id).toBeDefined();

      // Verify database interaction
      expect(mockDatabase.query().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email,
          firstName: userData.firstName
        })
      );

      // Verify notification sent
      expect(mockNotifications.sendWelcomeEmail).toHaveBeenCalledWith(
        userData.email,
        userData.firstName
      );
    });

    it('should return validation errors for invalid data', async () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email',
        firstName: '',
        tenantId: 'gym-123'
      };

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Invalid email format');
      expect(response.body.errors).toContain('First name is required');

      // Verify no database operations
      expect(mockDatabase.query().insert).not.toHaveBeenCalled();
    });

    it('should handle duplicate email addresses', async () => {
      // Arrange
      const userData = userFactory.create({ email: 'existing@gym.com' });
      const duplicateError = new Error('Email already exists');
      
      mockDatabase.query().insert.mockRejectedValue(duplicateError);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Email already exists');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should retrieve user by ID', async () => {
      // Arrange
      const userId = 'user-123';
      const expectedUser = userFactory.create({ id: userId });
      
      mockDatabase.query().where.mockReturnThis();
      mockDatabase.query().first.mockResolvedValue(expectedUser);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.email).toBe(expectedUser.email);
    });

    it('should return 404 for non-existent user', async () => {
      // Arrange
      const userId = 'non-existent';
      mockDatabase.query().where.mockReturnThis();
      mockDatabase.query().first.mockResolvedValue(null);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User not found');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const existingUser = userFactory.create({ id: userId });
      const updateData = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = { ...existingUser, ...updateData };

      mockDatabase.query().where.mockReturnThis();
      mockDatabase.query().first.mockResolvedValue(existingUser);
      mockDatabase.query().update.mockResolvedValue([updatedUser]);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .put(`/api/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
    });
  });
});

// Example 2: Authentication E2E Testing
describe('Authentication API (E2E)', () => {
  let app: INestApplication;
  let mockDatabase: jest.Mocked<DatabaseService>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockSecurityService: jest.Mocked<SecurityService>;

  beforeAll(async () => {
    app = await TestApplicationFactory
      .create()
      .withMocks([
        { 
          module: DatabaseModule, 
          providers: [
            { provide: DatabaseService, useValue: createMockDatabase() }
          ]
        },
        {
          module: AuthModule,
          providers: [
            { provide: JwtService, useValue: createMockJwtService() },
            { provide: 'SecurityService', useValue: createMockSecurityService() }
          ]
        }
      ])
      .build();

    mockDatabase = app.get(DatabaseService);
    mockJwtService = app.get(JwtService);
    mockSecurityService = app.get('SecurityService');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate user and return tokens', async () => {
      // Arrange
      const loginData = { email: 'user@gym.com', password: 'password123' };
      const user = userFactory.create({ 
        email: loginData.email,
        status: UserStatus.ACTIVE 
      });
      const accessToken = 'jwt-access-token';
      const refreshToken = 'jwt-refresh-token';

      mockDatabase.query().where.mockReturnThis();
      mockDatabase.query().first.mockResolvedValue(user);
      mockSecurityService.verifyPassword.mockResolvedValue(true);
      mockSecurityService.checkRateLimit.mockResolvedValue({ allowed: true });
      mockJwtService.sign.mockReturnValueOnce(accessToken);
      mockJwtService.sign.mockReturnValueOnce(refreshToken);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBe(accessToken);
      expect(response.body.data.refreshToken).toBe(refreshToken);
      expect(response.body.data.user.email).toBe(user.email);
    });

    it('should reject invalid credentials', async () => {
      // Arrange
      const loginData = { email: 'user@gym.com', password: 'wrongpassword' };
      const user = userFactory.create({ email: loginData.email });

      mockDatabase.query().where.mockReturnThis();
      mockDatabase.query().first.mockResolvedValue(user);
      mockSecurityService.verifyPassword.mockResolvedValue(false);
      mockSecurityService.checkRateLimit.mockResolvedValue({ allowed: true });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should handle rate limiting', async () => {
      // Arrange
      const loginData = { email: 'user@gym.com', password: 'password123' };
      
      mockSecurityService.checkRateLimit.mockResolvedValue({ 
        allowed: false, 
        remainingAttempts: 0,
        resetTime: Date.now() + 300000 // 5 minutes
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginData)
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Too many failed attempts');
      expect(response.headers['retry-after']).toBeDefined();
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const newAccessToken = 'new-access-token';
      const userId = 'user-123';

      mockJwtService.verify.mockReturnValue({ userId, type: 'refresh' });
      mockJwtService.sign.mockReturnValue(newAccessToken);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBe(newAccessToken);
    });

    it('should reject invalid refresh token', async () => {
      // Arrange
      const invalidToken = 'invalid-refresh-token';
      
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: invalidToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid refresh token');
    });
  });
});

// Example 3: Complete User Journey E2E Testing
describe('Complete User Journey (E2E)', () => {
  let app: INestApplication;
  let mockDatabase: jest.Mocked<DatabaseService>;
  let mockNotifications: jest.Mocked<NotificationService>;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeAll(async () => {
    app = await TestApplicationFactory
      .create()
      .withMocks([
        { 
          module: DatabaseModule, 
          providers: [
            { provide: DatabaseService, useValue: createMockDatabase() }
          ]
        },
        {
          module: NotificationModule,
          providers: [
            { provide: 'NotificationService', useValue: createMockNotificationService() }
          ]
        },
        {
          module: AuthModule,
          providers: [
            { provide: JwtService, useValue: createMockJwtService() },
            { provide: 'SecurityService', useValue: createMockSecurityService() }
          ]
        }
      ])
      .build();

    mockDatabase = app.get(DatabaseService);
    mockNotifications = app.get('NotificationService');
    mockJwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle complete user registration and first login workflow', async () => {
    // Step 1: User Registration
    const registrationData = {
      email: 'newuser@gym.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'SecurePass123!',
      tenantId: 'gym-123'
    };

    const newUser = userFactory.create({
      ...registrationData,
      id: 'user-123',
      status: UserStatus.PENDING_VERIFICATION
    });

    mockDatabase.query().insert.mockResolvedValue([newUser]);
    mockNotifications.sendWelcomeEmail.mockResolvedValue({ success: true });
    mockNotifications.sendVerificationEmail.mockResolvedValue({ success: true });

    const registrationResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(registrationData)
      .expect(201);

    expect(registrationResponse.body.success).toBe(true);
    expect(registrationResponse.body.data.user.email).toBe(registrationData.email);
    expect(registrationResponse.body.data.user.status).toBe(UserStatus.PENDING_VERIFICATION);

    // Verify welcome and verification emails sent
    expect(mockNotifications.sendWelcomeEmail).toHaveBeenCalled();
    expect(mockNotifications.sendVerificationEmail).toHaveBeenCalled();

    // Step 2: Email Verification
    const verificationToken = 'verification-token-123';
    const verifiedUser = { ...newUser, status: UserStatus.ACTIVE };

    mockJwtService.verify.mockReturnValue({ userId: newUser.id, type: 'verification' });
    mockDatabase.query().where.mockReturnThis();
    mockDatabase.query().first.mockResolvedValue(newUser);
    mockDatabase.query().update.mockResolvedValue([verifiedUser]);

    const verificationResponse = await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .send({ token: verificationToken })
      .expect(200);

    expect(verificationResponse.body.success).toBe(true);
    expect(verificationResponse.body.data.user.status).toBe(UserStatus.ACTIVE);

    // Step 3: First Login
    const loginData = {
      email: registrationData.email,
      password: registrationData.password
    };

    const accessToken = 'jwt-access-token';
    const refreshToken = 'jwt-refresh-token';

    mockDatabase.query().first.mockResolvedValue(verifiedUser);
    const mockSecurityService = app.get('SecurityService');
    mockSecurityService.verifyPassword.mockResolvedValue(true);
    mockSecurityService.checkRateLimit.mockResolvedValue({ allowed: true });
    mockJwtService.sign.mockReturnValueOnce(accessToken);
    mockJwtService.sign.mockReturnValueOnce(refreshToken);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(loginData)
      .expect(200);

    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.data.accessToken).toBe(accessToken);
    expect(loginResponse.body.data.user.status).toBe(UserStatus.ACTIVE);

    // Step 4: Access Protected Resource
    mockJwtService.verify.mockReturnValue({ userId: verifiedUser.id, type: 'access' });
    mockDatabase.query().first.mockResolvedValue(verifiedUser);

    const profileResponse = await request(app.getHttpServer())
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(profileResponse.body.success).toBe(true);
    expect(profileResponse.body.data.email).toBe(registrationData.email);
  });
});

// Example 4: Multi-Tenant E2E Testing
describe('Multi-Tenant API (E2E)', () => {
  let app: INestApplication;
  let mockDatabase: jest.Mocked<DatabaseService>;

  beforeAll(async () => {
    app = await TestApplicationFactory
      .create()
      .withMocks([
        { 
          module: DatabaseModule, 
          providers: [
            { provide: DatabaseService, useValue: createMockDatabase() }
          ]
        }
      ])
      .build();

    mockDatabase = app.get(DatabaseService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should enforce tenant isolation in user operations', async () => {
    // Arrange
    const tenant1 = tenantFactory.create({ id: 'tenant-1', name: 'Gym A' });
    const tenant2 = tenantFactory.create({ id: 'tenant-2', name: 'Gym B' });
    
    const user1 = userFactory.create({ tenantId: tenant1.id, email: 'user1@gyma.com' });
    const user2 = userFactory.create({ tenantId: tenant2.id, email: 'user2@gymb.com' });

    // Mock JWT token for tenant 1 user
    const mockJwtService = app.get(JwtService);
    mockJwtService.verify.mockReturnValue({ 
      userId: user1.id, 
      tenantId: tenant1.id,
      type: 'access' 
    });

    // Mock database to return only tenant 1 users
    mockDatabase.query().where.mockReturnThis();
    mockDatabase.query().select.mockResolvedValue([user1]); // Only tenant 1 users

    // Act & Assert - User from tenant 1 should only see tenant 1 users
    const response = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', 'Bearer tenant1-token')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].tenantId).toBe(tenant1.id);

    // Verify database query included tenant filter
    expect(mockDatabase.query().where).toHaveBeenCalledWith('tenantId', tenant1.id);
  });

  it('should prevent cross-tenant data access', async () => {
    // Arrange
    const tenant1User = userFactory.create({ tenantId: 'tenant-1' });
    const tenant2User = userFactory.create({ tenantId: 'tenant-2' });

    // Mock JWT token for tenant 1 user
    const mockJwtService = app.get(JwtService);
    mockJwtService.verify.mockReturnValue({ 
      userId: tenant1User.id, 
      tenantId: 'tenant-1',
      type: 'access' 
    });

    // Mock database to return null (user not found in tenant 1)
    mockDatabase.query().where.mockReturnThis();
    mockDatabase.query().first.mockResolvedValue(null);

    // Act & Assert - Tenant 1 user should not access tenant 2 user
    const response = await request(app.getHttpServer())
      .get(`/api/users/${tenant2User.id}`)
      .set('Authorization', 'Bearer tenant1-token')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('User not found');

    // Verify database query included both user ID and tenant ID filters
    expect(mockDatabase.query().where).toHaveBeenCalledWith('id', tenant2User.id);
    expect(mockDatabase.query().where).toHaveBeenCalledWith('tenantId', 'tenant-1');
  });
});

// Example 5: Error Handling and Edge Cases E2E Testing
describe('Error Handling (E2E)', () => {
  let app: INestApplication;
  let mockDatabase: jest.Mocked<DatabaseService>;

  beforeAll(async () => {
    app = await TestApplicationFactory
      .create()
      .withMocks([
        { 
          module: DatabaseModule, 
          providers: [
            { provide: DatabaseService, useValue: createMockDatabase() }
          ]
        }
      ])
      .build();

    mockDatabase = app.get(DatabaseService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle database connection errors gracefully', async () => {
    // Arrange
    const userData = userFactory.create();
    mockDatabase.query().insert.mockRejectedValue(new Error('Database connection failed'));

    // Act & Assert
    const response = await request(app.getHttpServer())
      .post('/api/users')
      .send(userData)
      .expect(500);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Internal server error');
    expect(response.body.requestId).toBeDefined(); // For tracking
  });

  it('should handle malformed JSON requests', async () => {
    // Act & Assert
    const response = await request(app.getHttpServer())
      .post('/api/users')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Invalid JSON');
  });

  it('should handle missing required headers', async () => {
    // Act & Assert
    const response = await request(app.getHttpServer())
      .get('/api/users/profile')
      // Missing Authorization header
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Authorization header required');
  });

  it('should handle request timeout scenarios', async () => {
    // Arrange
    const userData = userFactory.create();
    
    // Mock a slow database operation
    mockDatabase.query().insert.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 35000)) // 35 seconds
    );

    // Act & Assert
    const response = await request(app.getHttpServer())
      .post('/api/users')
      .send(userData)
      .timeout(30000) // 30 second timeout
      .expect(408);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Request timeout');
  });
});

export {
  // Export examples for documentation purposes
  // These are not meant to be imported, just for reference
};