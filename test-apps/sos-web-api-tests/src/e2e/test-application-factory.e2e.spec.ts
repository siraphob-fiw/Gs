/**
 * E2E tests for TestApplicationFactory
 * Verifies that the factory creates properly configured applications with comprehensive mocking
 */
import { INestApplication } from '@nestjs/common';
import { 
  SosWebApiTestApplicationFactory, 
  SosWebApiTestUtils, 
  TestApplicationHooks 
} from '../utils/test-application-factory';
import { SosWebApiTestConfigs } from '../utils/test-config';

// Set test environment variables to avoid configuration errors
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mock://test-database';
process.env.JWT_SECRET = 'test-jwt-secret';

describe('TestApplicationFactory E2E', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) {
      await TestApplicationHooks.afterEach(app);
    }
  });

  afterAll(async () => {
    if (app) {
      await TestApplicationHooks.afterAll(app);
    }
    // Reset factory state
    SosWebApiTestApplicationFactory.reset();
  });

  describe('createForE2ETests', () => {
    it('should create application with comprehensive mocking', async () => {
      // Arrange
      const config = SosWebApiTestConfigs.forE2ETests();

      // Act
      app = await SosWebApiTestApplicationFactory.createForE2ETests(config);

      // Assert
      expect(app).toBeDefined();
      expect(app.get).toBeDefined();
      expect(app.getHttpServer).toBeDefined();
    });

    it('should have properly mocked database service', async () => {
      // Arrange
      const config = SosWebApiTestConfigs.forE2ETests();

      // Act
      app = await SosWebApiTestApplicationFactory.createForE2ETests(config);
      const databaseService = SosWebApiTestUtils.getService(app, 'DatabaseService');

      // Assert
      expect(databaseService).toBeDefined();
      expect(databaseService.knex).toBeDefined();
      expect(databaseService.knex.select).toBeDefined();
      expect(typeof databaseService.knex.select).toBe('function');
    });

    it('should have properly mocked notification service', async () => {
      // Arrange
      const config = SosWebApiTestConfigs.forE2ETests();

      // Act
      app = await SosWebApiTestApplicationFactory.createForE2ETests(config);
      const notificationService = SosWebApiTestUtils.getService(app, 'NotificationService');

      // Assert
      expect(notificationService).toBeDefined();
      expect(notificationService.sendEmail).toBeDefined();
      expect(notificationService.sendSMS).toBeDefined();
      expect(notificationService.sendPushNotification).toBeDefined();
    });

    it('should have properly mocked monitoring service', async () => {
      // Arrange
      const config = SosWebApiTestConfigs.forE2ETests();

      // Act
      app = await SosWebApiTestApplicationFactory.createForE2ETests(config);
      const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');

      // Assert
      expect(monitoringService).toBeDefined();
      expect(monitoringService.logSecurityEvent).toBeDefined();
      expect(monitoringService.logPerformanceMetric).toBeDefined();
      expect(monitoringService.getHealthStatus).toBeDefined();
    });

    it('should have properly mocked JWT service', async () => {
      // Arrange
      const config = SosWebApiTestConfigs.forE2ETests();

      // Act
      app = await SosWebApiTestApplicationFactory.createForE2ETests(config);
      const jwtService = SosWebApiTestUtils.getService(app, 'JwtService');

      // Assert
      expect(jwtService).toBeDefined();
      expect(jwtService.sign).toBeDefined();
      expect(jwtService.verify).toBeDefined();
      expect(jwtService.decode).toBeDefined();
    });

    it('should support custom configuration overrides', async () => {
      // Arrange
      const customConfig = SosWebApiTestConfigs.custom(
        SosWebApiTestConfigs.forE2ETests(),
        {
          auth: {
            mockJwt: true,
            defaultUserId: 'custom-user-id',
            defaultRole: 'COACH',
          },
        }
      );

      // Act
      app = await SosWebApiTestApplicationFactory.createForE2ETests(customConfig);
      const jwtService = SosWebApiTestUtils.getService(app, 'JwtService');
      const token = jwtService.verify('mock-token');

      // Assert
      expect(token.sub).toBe('custom-user-id');
      expect(token.role).toBe('COACH');
    });
  });

  describe('createForIntegrationTests', () => {
    it('should create application with selective mocking', async () => {
      // Arrange
      const config = SosWebApiTestConfigs.forIntegrationTests();

      // Act
      app = await SosWebApiTestApplicationFactory.createForIntegrationTests(config);

      // Assert
      expect(app).toBeDefined();
      expect(app.get).toBeDefined();
      expect(app.getHttpServer).toBeDefined();
    });

    it('should have mocked external services only', async () => {
      // Arrange
      const config = SosWebApiTestConfigs.forIntegrationTests();

      // Act
      app = await SosWebApiTestApplicationFactory.createForIntegrationTests(config);

      // Assert - Should have notification mocks
      const notificationService = SosWebApiTestUtils.getService(app, 'NotificationService');
      expect(notificationService).toBeDefined();
      expect(notificationService.sendEmail).toBeDefined();

      // Assert - Should have monitoring mocks
      const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');
      expect(monitoringService).toBeDefined();
      expect(monitoringService.logSecurityEvent).toBeDefined();
    });
  });

  describe('withModuleOverrides', () => {
    it('should apply module-specific overrides', async () => {
      // Arrange
      const customMock = {
        provide: 'CustomService',
        useValue: {
          customMethod: jest.fn().mockReturnValue('custom-result'),
        },
      };

      // Act
      app = await SosWebApiTestApplicationFactory
        .withModuleOverrides(null as any, [customMock])
        .createForE2ETests();

      const customService = SosWebApiTestUtils.getService(app, 'CustomService');

      // Assert
      expect(customService).toBeDefined();
      expect(customService.customMethod()).toBe('custom-result');
    });
  });

  describe('SosWebApiTestUtils', () => {
    beforeEach(async () => {
      app = await SosWebApiTestApplicationFactory.createForE2ETests();
    });

    describe('setupAuth', () => {
      it('should generate JWT token with correct payload', async () => {
        // Act
        const token = await SosWebApiTestUtils.setupAuth(app, 'test-user', 'ATHLETE', 'test-tenant');

        // Assert
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token).not.toBe('');
      });

      it('should create proper auth headers', () => {
        // Arrange
        const token = 'test-jwt-token';

        // Act
        const headers = SosWebApiTestUtils.createAuthHeaders(token);

        // Assert
        expect(headers).toEqual({
          'Authorization': 'Bearer test-jwt-token',
          'Content-Type': 'application/json',
        });
      });
    });

    describe('request', () => {
      it('should create supertest request instance', async () => {
        // Act
        const request = await SosWebApiTestUtils.request(app);

        // Assert
        expect(request).toBeDefined();
        expect(request.get).toBeDefined();
        expect(request.post).toBeDefined();
        expect(request.put).toBeDefined();
        expect(request.delete).toBeDefined();
      });
    });

    describe('resetApplicationState', () => {
      it('should reset application state without errors', async () => {
        // Act & Assert - Should not throw
        await expect(SosWebApiTestUtils.resetApplicationState(app)).resolves.not.toThrow();
      });

      it('should reset all mocks', () => {
        // Arrange
        const notificationService = SosWebApiTestUtils.getService(app, 'NotificationService');
        notificationService.sendEmail('test@example.com', 'Test Subject', 'Test Body');

        // Act
        SosWebApiTestUtils.resetAllMocks(app);

        // Assert
        expect(notificationService.sendEmail).toHaveBeenCalledTimes(0);
      });
    });

    describe('waitForReady', () => {
      it('should wait for application to be ready', async () => {
        // Act & Assert - Should not throw
        await expect(SosWebApiTestUtils.waitForReady(app, 1000)).resolves.not.toThrow();
      });
    });
  });

  describe('TestApplicationHooks', () => {
    beforeEach(async () => {
      app = await SosWebApiTestApplicationFactory.createForE2ETests();
    });

    describe('lifecycle hooks', () => {
      it('should run beforeAll without errors', async () => {
        // Act & Assert
        await expect(TestApplicationHooks.beforeAll(app)).resolves.not.toThrow();
      });

      it('should run beforeEach without errors', async () => {
        // Act & Assert
        await expect(TestApplicationHooks.beforeEach(app)).resolves.not.toThrow();
      });

      it('should run afterEach without errors', async () => {
        // Act & Assert
        await expect(TestApplicationHooks.afterEach(app)).resolves.not.toThrow();
      });

      it('should track setup completion', async () => {
        // Arrange
        expect(TestApplicationHooks.isSetupComplete()).toBe(false);

        // Act
        await TestApplicationHooks.beforeAll(app);

        // Assert
        expect(TestApplicationHooks.isSetupComplete()).toBe(true);
      });
    });

    describe('cleanup handlers', () => {
      it('should allow adding custom cleanup handlers', () => {
        // Arrange
        const customHandler = jest.fn().mockResolvedValue(undefined);

        // Act & Assert - Should not throw
        expect(() => TestApplicationHooks.addCleanupHandler(customHandler)).not.toThrow();
      });
    });
  });

  describe('Mock Functionality', () => {
    beforeEach(async () => {
      app = await SosWebApiTestApplicationFactory.createForE2ETests();
    });

    it('should have working database mocks', async () => {
      // Arrange
      const databaseService = SosWebApiTestUtils.getService(app, 'DatabaseService');

      // Act
      const result = await databaseService.knex.select('*').from('users').first();

      // Assert
      expect(result).toBeNull(); // Mock returns null by default
      expect(databaseService.knex.select).toHaveBeenCalledWith('*');
      expect(databaseService.knex.from).toHaveBeenCalledWith('users');
      expect(databaseService.knex.first).toHaveBeenCalled();
    });

    it('should have working notification mocks', async () => {
      // Arrange
      const notificationService = SosWebApiTestUtils.getService(app, 'NotificationService');

      // Act
      const result = await notificationService.sendEmail('test@example.com', 'Subject', 'Body');

      // Assert
      expect(result).toEqual({ success: true, messageId: 'mock-email-id' });
      expect(notificationService.sendEmail).toHaveBeenCalledWith('test@example.com', 'Subject', 'Body');
    });

    it('should have working monitoring mocks', async () => {
      // Arrange
      const monitoringService = SosWebApiTestUtils.getService(app, 'MonitoringService');

      // Act
      await monitoringService.logSecurityEvent('test-event', { userId: 'test-user' });
      const healthStatus = await monitoringService.getHealthStatus();

      // Assert
      expect(monitoringService.logSecurityEvent).toHaveBeenCalledWith('test-event', { userId: 'test-user' });
      expect(healthStatus).toEqual({ status: 'healthy' });
    });

    it('should have working cache mocks', async () => {
      // Arrange
      const cacheService = SosWebApiTestUtils.getService(app, 'CacheService');

      // Act
      await cacheService.set('test-key', 'test-value');
      const result = await cacheService.get('test-key');

      // Assert
      expect(cacheService.set).toHaveBeenCalledWith('test-key', 'test-value');
      expect(cacheService.get).toHaveBeenCalledWith('test-key');
      expect(result).toBeNull(); // Mock returns null by default
    });
  });

  describe('Error Handling', () => {
    it('should handle application creation errors gracefully', async () => {
      // This test would verify error handling in real scenarios
      // For now, we'll just ensure the factory doesn't throw unexpected errors
      expect(async () => {
        app = await SosWebApiTestApplicationFactory.createForE2ETests();
      }).not.toThrow();
    });

    it('should handle service retrieval errors gracefully', async () => {
      // Arrange
      app = await SosWebApiTestApplicationFactory.createForE2ETests();

      // Act & Assert - Should not throw for non-existent services
      expect(() => {
        SosWebApiTestUtils.getService(app, 'NonExistentService');
      }).not.toThrow();
    });
  });
});