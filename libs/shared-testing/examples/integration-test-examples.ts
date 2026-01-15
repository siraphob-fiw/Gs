/**
 * Integration Test Examples
 * 
 * This file demonstrates comprehensive integration testing patterns using the
 * modernized testing architecture with TestModuleBuilder for module testing.
 */

import { TestModuleBuilder } from '../src/builders/test-module-builder';
import { userFactory, tenantFactory } from '../src/factories';
import { createMockDatabase, createMockNotificationService, createMockCacheService } from '../src/mocks';

// Example 1: Module Integration Testing
describe('UserModule Integration Tests', () => {
  let module: TestingModule;
  let userService: UserService;
  let userController: UserController;
  let mockDatabase: jest.Mocked<DatabaseService>;
  let mockNotifications: jest.Mocked<NotificationService>;

  beforeEach(async () => {
    const { module: testModule, mocks } = await TestModuleBuilder
      .forModule(UserModule)
      .withMocks([
        { provide: DatabaseService, useValue: createMockDatabase() },
        { provide: 'NotificationService', useValue: createMockNotificationService() },
        { provide: 'CacheService', useValue: createMockCacheService() }
      ])
      .excludeGlobalProviders(['GlobalExceptionFilter', 'AuthGuard'])
      .build();

    module = testModule;
    userService = module.get<UserService>(UserService);
    userController = module.get<UserController>(UserController);
    mockDatabase = mocks.get(DatabaseService);
    mockNotifications = mocks.get('NotificationService');
  });

  describe('User Registration Workflow', () => {
    it('should handle complete user registration from controller to service', async () => {
      // Arrange
      const registrationData = {
        email: 'newuser@gym.com',
        firstName: 'John',
        lastName: 'Doe',
        tenantId: 'gym-123'
      };

      const expectedUser = userFactory.create(registrationData);
      mockDatabase.query().insert.mockResolvedValue([expectedUser]);
      mockNotifications.sendWelcomeEmail.mockResolvedValue({ success: true });

      // Act
      const result = await userController.registerUser(registrationData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.email).toBe(registrationData.email);
      
      // Verify service interactions
      expect(mockDatabase.query().insert).toHaveBeenCalledWith(
        expect.objectContaining(registrationData)
      );
      expect(mockNotifications.sendWelcomeEmail).toHaveBeenCalledWith(
        registrationData.email,
        registrationData.firstName
      );
    });

    it('should handle validation errors in the complete workflow', async () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email',
        firstName: '',
        tenantId: 'gym-123'
      };

      // Act
      const result = await userController.registerUser(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid email format');
      expect(result.errors).toContain('First name is required');
      
      // Verify no database operations occurred
      expect(mockDatabase.query().insert).not.toHaveBeenCalled();
      expect(mockNotifications.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('should handle database errors and rollback properly', async () => {
      // Arrange
      const registrationData = userFactory.create();
      const dbError = new Error('Database constraint violation');
      
      mockDatabase.query().insert.mockRejectedValue(dbError);

      // Act
      const result = await userController.registerUser(registrationData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Registration failed');
      
      // Verify no notifications were sent on failure
      expect(mockNotifications.sendWelcomeEmail).not.toHaveBeenCalled();
    });
  });

  describe('User Profile Management', () => {
    it('should update user profile and invalidate cache', async () => {
      // Arrange
      const userId = 'user-123';
      const existingUser = userFactory.create({ id: userId });
      const updateData = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = { ...existingUser, ...updateData };

      mockDatabase.query().where.mockReturnThis();
      mockDatabase.query().first.mockResolvedValue(existingUser);
      mockDatabase.query().update.mockResolvedValue([updatedUser]);

      const mockCache = createMockCacheService();
      module.get('CacheService').del = mockCache.del;

      // Act
      const result = await userController.updateProfile(userId, updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.firstName).toBe('Updated');
      
      // Verify cache invalidation
      expect(mockCache.del).toHaveBeenCalledWith(`user:${userId}`);
    });
  });
});

// Example 2: Multi-Module Integration Testing
describe('AuthModule Integration Tests', () => {
  let module: TestingModule;
  let authService: AuthService;
  let authController: AuthController;
  let userService: UserService;
  let mockDatabase: jest.Mocked<DatabaseService>;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const { module: testModule, mocks } = await TestModuleBuilder
      .forModule(AuthModule)
      .withImports([UserModule]) // Include related module
      .withMocks([
        { provide: DatabaseService, useValue: createMockDatabase() },
        { provide: JwtService, useValue: createMockJwtService() },
        { provide: 'SecurityService', useValue: createMockSecurityService() }
      ])
      .build();

    module = testModule;
    authService = module.get<AuthService>(AuthService);
    authController = module.get<AuthController>(AuthController);
    userService = module.get<UserService>(UserService);
    mockDatabase = mocks.get(DatabaseService);
    mockJwtService = mocks.get(JwtService);
  });

  describe('Login Workflow', () => {
    it('should authenticate user and generate tokens', async () => {
      // Arrange
      const loginData = { email: 'user@gym.com', password: 'password123' };
      const user = userFactory.create({ 
        email: loginData.email,
        status: UserStatus.ACTIVE 
      });
      const accessToken = 'jwt-access-token';
      const refreshToken = 'jwt-refresh-token';

      // Mock user lookup
      mockDatabase.query().where.mockReturnThis();
      mockDatabase.query().first.mockResolvedValue(user);
      
      // Mock password verification (would be handled by AuthService)
      jest.spyOn(authService, 'verifyPassword').mockResolvedValue(true);
      
      // Mock token generation
      mockJwtService.sign.mockReturnValueOnce(accessToken);
      mockJwtService.sign.mockReturnValueOnce(refreshToken);

      // Act
      const result = await authController.login(loginData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.accessToken).toBe(accessToken);
      expect(result.data.refreshToken).toBe(refreshToken);
      expect(result.data.user.email).toBe(user.email);
      
      // Verify interactions between services
      expect(authService.verifyPassword).toHaveBeenCalledWith(
        loginData.password, 
        user.passwordHash
      );
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should reject login for suspended users', async () => {
      // Arrange
      const loginData = { email: 'suspended@gym.com', password: 'password123' };
      const suspendedUser = userFactory.create({ 
        email: loginData.email,
        status: UserStatus.SUSPENDED 
      });

      mockDatabase.query().where.mockReturnThis();
      mockDatabase.query().first.mockResolvedValue(suspendedUser);

      // Act
      const result = await authController.login(loginData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Account suspended');
      
      // Verify no tokens were generated
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle rate limiting for failed login attempts', async () => {
      // Arrange
      const loginData = { email: 'user@gym.com', password: 'wrongpassword' };
      const user = userFactory.create({ email: loginData.email });

      mockDatabase.query().where.mockReturnThis();
      mockDatabase.query().first.mockResolvedValue(user);
      jest.spyOn(authService, 'verifyPassword').mockResolvedValue(false);
      
      // Mock rate limiting service
      const mockSecurityService = module.get('SecurityService');
      mockSecurityService.checkRateLimit.mockResolvedValue({ 
        allowed: false, 
        remainingAttempts: 0 
      });

      // Act
      const result = await authController.login(loginData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Too many failed attempts');
      
      // Verify security service interaction
      expect(mockSecurityService.checkRateLimit).toHaveBeenCalledWith(
        'login', 
        loginData.email
      );
    });
  });
});

// Example 3: Database Transaction Integration Testing
describe('TenantModule Integration Tests', () => {
  let module: TestingModule;
  let tenantService: TenantService;
  let userService: UserService;
  let mockDatabase: jest.Mocked<DatabaseService>;
  let mockTransaction: jest.Mocked<any>;

  beforeEach(async () => {
    mockTransaction = {
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([]),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined)
    };

    const { module: testModule, mocks } = await TestModuleBuilder
      .forModule(TenantModule)
      .withImports([UserModule])
      .withMocks([
        { 
          provide: DatabaseService, 
          useValue: {
            ...createMockDatabase(),
            transaction: jest.fn().mockImplementation(callback => callback(mockTransaction))
          }
        }
      ])
      .build();

    module = testModule;
    tenantService = module.get<TenantService>(TenantService);
    userService = module.get<UserService>(UserService);
    mockDatabase = mocks.get(DatabaseService);
  });

  describe('Tenant Creation with Admin User', () => {
    it('should create tenant and admin user in single transaction', async () => {
      // Arrange
      const tenantData = {
        name: 'New Gym',
        domain: 'newgym.strengthos.com',
        adminEmail: 'admin@newgym.com',
        adminName: 'Gym Admin'
      };

      const expectedTenant = tenantFactory.create({
        name: tenantData.name,
        domain: tenantData.domain
      });

      const expectedAdmin = userFactory.create({
        email: tenantData.adminEmail,
        firstName: tenantData.adminName,
        role: UserRole.TENANT_ADMIN,
        tenantId: expectedTenant.id
      });

      mockTransaction.insert.mockResolvedValueOnce([expectedTenant]);
      mockTransaction.insert.mockResolvedValueOnce([expectedAdmin]);

      // Act
      const result = await tenantService.createTenantWithAdmin(tenantData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.tenant.name).toBe(tenantData.name);
      expect(result.data.admin.email).toBe(tenantData.adminEmail);
      
      // Verify transaction usage
      expect(mockDatabase.transaction).toHaveBeenCalled();
      expect(mockTransaction.insert).toHaveBeenCalledTimes(2);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should rollback transaction on admin user creation failure', async () => {
      // Arrange
      const tenantData = {
        name: 'New Gym',
        domain: 'newgym.strengthos.com',
        adminEmail: 'invalid-email',
        adminName: 'Gym Admin'
      };

      const expectedTenant = tenantFactory.create({
        name: tenantData.name,
        domain: tenantData.domain
      });

      mockTransaction.insert.mockResolvedValueOnce([expectedTenant]);
      mockTransaction.insert.mockRejectedValueOnce(new Error('Invalid email format'));

      // Act
      const result = await tenantService.createTenantWithAdmin(tenantData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email format');
      
      // Verify transaction rollback
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });
  });
});

// Example 4: Event-Driven Integration Testing
describe('NotificationModule Integration Tests', () => {
  let module: TestingModule;
  let notificationService: NotificationService;
  let eventEmitter: EventEmitter2;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockSMSService: jest.Mocked<SMSService>;

  beforeEach(async () => {
    const { module: testModule, mocks } = await TestModuleBuilder
      .forModule(NotificationModule)
      .withMocks([
        { provide: EmailService, useValue: createMockEmailService() },
        { provide: SMSService, useValue: createMockSMSService() },
        { provide: 'TemplateService', useValue: createMockTemplateService() }
      ])
      .build();

    module = testModule;
    notificationService = module.get<NotificationService>(NotificationService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    mockEmailService = mocks.get(EmailService);
    mockSMSService = mocks.get(SMSService);
  });

  describe('Event-Driven Notifications', () => {
    it('should handle user.created event and send welcome notifications', async () => {
      // Arrange
      const user = userFactory.create({
        email: 'newuser@gym.com',
        phone: '+1234567890',
        preferences: { emailNotifications: true, smsNotifications: true }
      });

      mockEmailService.sendWelcomeEmail.mockResolvedValue({ success: true });
      mockSMSService.sendWelcomeSMS.mockResolvedValue({ success: true });

      // Act
      eventEmitter.emit('user.created', { user });

      // Wait for async event handling
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        user.email,
        user.firstName
      );
      expect(mockSMSService.sendWelcomeSMS).toHaveBeenCalledWith(
        user.phone,
        user.firstName
      );
    });

    it('should handle session.completed event and send summary notifications', async () => {
      // Arrange
      const sessionData = {
        userId: 'user-123',
        sessionId: 'session-456',
        duration: 90,
        exerciseCount: 8,
        totalVolume: 5000
      };

      const user = userFactory.create({ 
        id: sessionData.userId,
        preferences: { workoutSummaries: true }
      });

      // Mock user lookup
      jest.spyOn(notificationService, 'getUserById').mockResolvedValue(user);
      mockEmailService.sendWorkoutSummary.mockResolvedValue({ success: true });

      // Act
      eventEmitter.emit('session.completed', sessionData);

      // Wait for async event handling
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      expect(mockEmailService.sendWorkoutSummary).toHaveBeenCalledWith(
        user.email,
        expect.objectContaining({
          duration: sessionData.duration,
          exerciseCount: sessionData.exerciseCount
        })
      );
    });
  });
});

// Example 5: Cache Integration Testing
describe('UserModule with Cache Integration Tests', () => {
  let module: TestingModule;
  let userService: UserService;
  let mockDatabase: jest.Mocked<DatabaseService>;
  let mockCache: jest.Mocked<CacheService>;

  beforeEach(async () => {
    const { module: testModule, mocks } = await TestModuleBuilder
      .forModule(UserModule)
      .withMocks([
        { provide: DatabaseService, useValue: createMockDatabase() },
        { provide: 'CacheService', useValue: createMockCacheService() }
      ])
      .build();

    module = testModule;
    userService = module.get<UserService>(UserService);
    mockDatabase = mocks.get(DatabaseService);
    mockCache = mocks.get('CacheService');
  });

  describe('User Retrieval with Caching', () => {
    it('should return cached user when available', async () => {
      // Arrange
      const userId = 'user-123';
      const cachedUser = userFactory.create({ id: userId });
      
      mockCache.get.mockResolvedValue(JSON.stringify(cachedUser));

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedUser);
      
      // Verify cache was checked but database was not
      expect(mockCache.get).toHaveBeenCalledWith(`user:${userId}`);
      expect(mockDatabase.query().where).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache when not in cache', async () => {
      // Arrange
      const userId = 'user-123';
      const dbUser = userFactory.create({ id: userId });
      
      mockCache.get.mockResolvedValue(null); // Not in cache
      mockDatabase.query().where.mockReturnThis();
      mockDatabase.query().first.mockResolvedValue(dbUser);
      mockCache.set.mockResolvedValue('OK');

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(dbUser);
      
      // Verify cache miss, database fetch, and cache set
      expect(mockCache.get).toHaveBeenCalledWith(`user:${userId}`);
      expect(mockDatabase.query().where).toHaveBeenCalledWith('id', userId);
      expect(mockCache.set).toHaveBeenCalledWith(
        `user:${userId}`,
        JSON.stringify(dbUser),
        3600 // TTL
      );
    });

    it('should invalidate cache on user update', async () => {
      // Arrange
      const userId = 'user-123';
      const updateData = { firstName: 'Updated' };
      const existingUser = userFactory.create({ id: userId });
      const updatedUser = { ...existingUser, ...updateData };

      mockDatabase.query().where.mockReturnThis();
      mockDatabase.query().first.mockResolvedValue(existingUser);
      mockDatabase.query().update.mockResolvedValue([updatedUser]);
      mockCache.del.mockResolvedValue(1);

      // Act
      const result = await userService.updateUser(userId, updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.firstName).toBe('Updated');
      
      // Verify cache invalidation
      expect(mockCache.del).toHaveBeenCalledWith(`user:${userId}`);
    });
  });
});

export {
  // Export examples for documentation purposes
  // These are not meant to be imported, just for reference
};