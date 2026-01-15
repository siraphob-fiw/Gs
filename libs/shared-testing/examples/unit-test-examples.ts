/**
 * Unit Test Examples
 * 
 * This file demonstrates comprehensive unit testing patterns using the
 * modernized testing architecture with TestModuleBuilder and mock factories.
 */

import { TestModuleBuilder } from '../src/builders/test-module-builder';
import { userFactory, tenantFactory } from '../src/factories';
import { createMockRepository, createMockLogger, createMockNotificationService } from '../src/mocks';

// Example 1: Basic Service Unit Test
describe('UserService Unit Tests', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<UserRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(async () => {
    const { service: testService, mocks } = await TestModuleBuilder
      .forService(UserService)
      .withMocks([
        { provide: UserRepository, useValue: createMockRepository() },
        { provide: 'ILogger', useValue: createMockLogger() }
      ])
      .build();

    service = testService;
    mockRepository = mocks.get(UserRepository);
    mockLogger = mocks.get('ILogger');
  });

  describe('createUser', () => {
    it('should create user with valid data and return success result', async () => {
      // Arrange
      const userData = userFactory.create({
        email: 'athlete@gym.com',
        role: UserRole.ATHLETE
      });
      const expectedUser = { ...userData, id: 'generated-id' };
      mockRepository.create.mockResolvedValue(expectedUser);

      // Act
      const result = await service.createUser(userData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedUser);
      expect(mockRepository.create).toHaveBeenCalledWith(userData);
      expect(mockLogger.info).toHaveBeenCalledWith('User created successfully', { userId: expectedUser.id });
    });

    it('should reject user creation with invalid email format', async () => {
      // Arrange
      const invalidUserData = userFactory.create({
        email: 'invalid-email-format'
      });

      // Act
      const result = await service.createUser(invalidUserData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email format');
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('User creation failed: Invalid email format');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const userData = userFactory.create();
      const dbError = new Error('Database connection failed');
      mockRepository.create.mockRejectedValue(dbError);

      // Act
      const result = await service.createUser(userData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Database error during user creation', { error: dbError });
    });

    it('should reject duplicate email addresses', async () => {
      // Arrange
      const existingUser = userFactory.create({ email: 'existing@gym.com' });
      const duplicateUserData = userFactory.create({ email: 'existing@gym.com' });
      
      mockRepository.findByEmail.mockResolvedValue(existingUser);

      // Act
      const result = await service.createUser(duplicateUserData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Email already exists');
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('existing@gym.com');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return user when valid ID is provided', async () => {
      // Arrange
      const userId = 'user-123';
      const expectedUser = userFactory.create({ id: userId });
      mockRepository.findById.mockResolvedValue(expectedUser);

      // Act
      const result = await service.getUserById(userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedUser);
      expect(mockRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should return not found when user does not exist', async () => {
      // Arrange
      const userId = 'non-existent-user';
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.getUserById(userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('User not found');
      expect(mockRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should validate user ID format', async () => {
      // Arrange
      const invalidUserId = '';

      // Act
      const result = await service.getUserById(invalidUserId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid user ID');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const newStatus = UserStatus.SUSPENDED;
      const existingUser = userFactory.create({ id: userId, status: UserStatus.ACTIVE });
      const updatedUser = { ...existingUser, status: newStatus };

      mockRepository.findById.mockResolvedValue(existingUser);
      mockRepository.update.mockResolvedValue(updatedUser);

      // Act
      const result = await service.updateUserStatus(userId, newStatus);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.status).toBe(newStatus);
      expect(mockRepository.update).toHaveBeenCalledWith(userId, { status: newStatus });
      expect(mockLogger.info).toHaveBeenCalledWith('User status updated', { userId, newStatus });
    });

    it('should reject invalid status transitions', async () => {
      // Arrange
      const userId = 'user-123';
      const existingUser = userFactory.create({ 
        id: userId, 
        status: UserStatus.DELETED 
      });
      
      mockRepository.findById.mockResolvedValue(existingUser);

      // Act
      const result = await service.updateUserStatus(userId, UserStatus.ACTIVE);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid status transition');
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });
});

// Example 2: Service with Complex Dependencies
describe('NotificationService Unit Tests', () => {
  let service: NotificationService;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockSMSService: jest.Mocked<SMSService>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const { service: testService, mocks } = await TestModuleBuilder
      .forService(NotificationService)
      .withMocks([
        { provide: EmailService, useValue: createMockEmailService() },
        { provide: SMSService, useValue: createMockSMSService() },
        { provide: UserRepository, useValue: createMockRepository() }
      ])
      .build();

    service = testService;
    mockEmailService = mocks.get(EmailService);
    mockSMSService = mocks.get(SMSService);
    mockUserRepository = mocks.get(UserRepository);
  });

  describe('sendWelcomeNotification', () => {
    it('should send email and SMS for new user', async () => {
      // Arrange
      const user = userFactory.create({
        email: 'newuser@gym.com',
        phone: '+1234567890',
        preferences: { emailNotifications: true, smsNotifications: true }
      });

      mockEmailService.sendWelcomeEmail.mockResolvedValue({ success: true });
      mockSMSService.sendWelcomeSMS.mockResolvedValue({ success: true });

      // Act
      const result = await service.sendWelcomeNotification(user);

      // Assert
      expect(result.success).toBe(true);
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(user.email, user.firstName);
      expect(mockSMSService.sendWelcomeSMS).toHaveBeenCalledWith(user.phone, user.firstName);
    });

    it('should respect user notification preferences', async () => {
      // Arrange
      const user = userFactory.create({
        preferences: { emailNotifications: false, smsNotifications: true }
      });

      mockSMSService.sendWelcomeSMS.mockResolvedValue({ success: true });

      // Act
      const result = await service.sendWelcomeNotification(user);

      // Assert
      expect(result.success).toBe(true);
      expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
      expect(mockSMSService.sendWelcomeSMS).toHaveBeenCalled();
    });

    it('should handle partial failures gracefully', async () => {
      // Arrange
      const user = userFactory.create({
        preferences: { emailNotifications: true, smsNotifications: true }
      });

      mockEmailService.sendWelcomeEmail.mockResolvedValue({ success: true });
      mockSMSService.sendWelcomeSMS.mockRejectedValue(new Error('SMS service unavailable'));

      // Act
      const result = await service.sendWelcomeNotification(user);

      // Assert
      expect(result.success).toBe(true); // Partial success
      expect(result.warnings).toContain('SMS delivery failed');
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalled();
    });
  });
});

// Example 3: Utility Function Unit Tests
describe('ValidationUtils Unit Tests', () => {
  describe('validateEmail', () => {
    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        expect(ValidationUtils.validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..double.dot@domain.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(ValidationUtils.validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecure@Password1',
        'Complex#Pass2024'
      ];

      strongPasswords.forEach(password => {
        const result = ValidationUtils.validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords with specific error messages', () => {
      const testCases = [
        { password: 'short', expectedErrors: ['too short', 'missing uppercase', 'missing number', 'missing special character'] },
        { password: 'nouppercase123!', expectedErrors: ['missing uppercase'] },
        { password: 'NoNumbers!', expectedErrors: ['missing number'] },
        { password: 'NoSpecialChars123', expectedErrors: ['missing special character'] }
      ];

      testCases.forEach(({ password, expectedErrors }) => {
        const result = ValidationUtils.validatePassword(password);
        expect(result.isValid).toBe(false);
        expectedErrors.forEach(error => {
          expect(result.errors.some(e => e.includes(error))).toBe(true);
        });
      });
    });
  });
});

// Example 4: Testing with Async Operations and Timers
describe('SessionTimeoutService Unit Tests', () => {
  let service: SessionTimeoutService;
  let mockSessionRepository: jest.Mocked<SessionRepository>;

  beforeEach(async () => {
    jest.useFakeTimers();
    
    const { service: testService, mocks } = await TestModuleBuilder
      .forService(SessionTimeoutService)
      .withMocks([
        { provide: SessionRepository, useValue: createMockRepository() }
      ])
      .build();

    service = testService;
    mockSessionRepository = mocks.get(SessionRepository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should expire sessions after timeout period', async () => {
    // Arrange
    const session = { id: 'session-123', userId: 'user-123', lastActivity: new Date() };
    mockSessionRepository.findActive.mockResolvedValue([session]);

    // Act
    service.startTimeoutMonitoring();
    
    // Fast-forward time by 30 minutes
    jest.advanceTimersByTime(30 * 60 * 1000);

    // Assert
    expect(mockSessionRepository.expireSession).toHaveBeenCalledWith('session-123');
  });

  it('should not expire recently active sessions', async () => {
    // Arrange
    const recentSession = { 
      id: 'session-123', 
      userId: 'user-123', 
      lastActivity: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    };
    mockSessionRepository.findActive.mockResolvedValue([recentSession]);

    // Act
    service.startTimeoutMonitoring();
    jest.advanceTimersByTime(10 * 60 * 1000); // 10 minutes

    // Assert
    expect(mockSessionRepository.expireSession).not.toHaveBeenCalled();
  });
});

// Example 5: Testing Error Boundaries and Edge Cases
describe('DataProcessingService Unit Tests', () => {
  let service: DataProcessingService;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(async () => {
    const { service: testService, mocks } = await TestModuleBuilder
      .forService(DataProcessingService)
      .withMocks([
        { provide: 'ILogger', useValue: createMockLogger() }
      ])
      .build();

    service = testService;
    mockLogger = mocks.get('ILogger');
  });

  describe('processUserData', () => {
    it('should handle null input gracefully', async () => {
      // Act
      const result = await service.processUserData(null);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid input');
      expect(mockLogger.warn).toHaveBeenCalledWith('Null input provided to processUserData');
    });

    it('should handle empty arrays', async () => {
      // Act
      const result = await service.processUserData([]);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.processedCount).toBe(0);
    });

    it('should handle large datasets efficiently', async () => {
      // Arrange
      const largeDataset = userFactory.createBatch(10000);

      // Act
      const startTime = Date.now();
      const result = await service.processUserData(largeDataset);
      const processingTime = Date.now() - startTime;

      // Assert
      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(10000);
      expect(processingTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should handle malformed data gracefully', async () => {
      // Arrange
      const malformedData = [
        userFactory.create(), // Valid
        { invalidUser: true }, // Invalid
        userFactory.create(), // Valid
        null, // Invalid
        userFactory.create() // Valid
      ];

      // Act
      const result = await service.processUserData(malformedData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(3); // Only valid users processed
      expect(result.skippedCount).toBe(2); // Invalid entries skipped
      expect(mockLogger.warn).toHaveBeenCalledTimes(2); // One warning per invalid entry
    });
  });
});

export {
  // Export examples for documentation purposes
  // These are not meant to be imported, just for reference
};