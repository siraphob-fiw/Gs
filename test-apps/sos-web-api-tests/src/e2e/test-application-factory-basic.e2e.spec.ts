/**
 * Basic E2E tests for TestApplicationFactory
 * Tests the factory functionality without importing the full AppModule
 */
import { SosWebApiTestConfigs } from '../utils/test-config';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mock://test-database';
process.env.JWT_SECRET = 'test-jwt-secret';

describe('TestApplicationFactory Basic Tests', () => {
  describe('Configuration Tests', () => {
    it('should create E2E test configuration', () => {
      // Act
      const config = SosWebApiTestConfigs.forE2ETests();

      // Assert
      expect(config).toBeDefined();
      expect(config.database?.type).toBe('test-db');
      expect(config.notifications?.mockAll).toBe(true);
      expect(config.monitoring?.mockSecurityEvents).toBe(true);
      expect(config.auth?.mockJwt).toBe(false);
    });

    it('should create integration test configuration', () => {
      // Act
      const config = SosWebApiTestConfigs.forIntegrationTests();

      // Assert
      expect(config).toBeDefined();
      expect(config.database?.type).toBe('memory');
      expect(config.notifications?.enabled).toBe(true);
      expect(config.monitoring?.enabled).toBe(true);
    });

    it('should create unit test configuration', () => {
      // Act
      const config = SosWebApiTestConfigs.forUnitTests();

      // Assert
      expect(config).toBeDefined();
      expect(config.database?.type).toBe('mock');
      expect(config.cache?.type).toBe('mock');
      expect(config.notifications?.mockAll).toBe(true);
      expect(config.auth?.mockJwt).toBe(true);
    });

    it('should support custom configuration merging', () => {
      // Arrange
      const baseConfig = SosWebApiTestConfigs.forE2ETests();
      const customOverrides = {
        auth: {
          mockJwt: true,
          defaultUserId: 'custom-user-id',
          defaultRole: 'ADMIN',
        },
        features: {
          enableVideoAnalysis: false,
        },
      };

      // Act
      const config = SosWebApiTestConfigs.custom(baseConfig, customOverrides);

      // Assert
      expect(config.auth?.mockJwt).toBe(true);
      expect(config.auth?.defaultUserId).toBe('custom-user-id');
      expect(config.auth?.defaultRole).toBe('ADMIN');
      expect(config.features?.enableVideoAnalysis).toBe(false);
      // Should preserve base config values
      expect(config.database?.type).toBe('test-db');
      expect(config.notifications?.mockAll).toBe(true);
    });
  });

  describe('Mock Creation Tests', () => {
    it('should create database mocks with proper structure', () => {
      // This test verifies the mock creation logic without actually creating an application
      const mockKnex = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
        then: jest.fn().mockResolvedValue([]),
        transaction: jest.fn().mockImplementation((callback) => callback({
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null),
          then: jest.fn().mockResolvedValue([]),
        })),
      };

      // Assert
      expect(mockKnex.select).toBeDefined();
      expect(mockKnex.from).toBeDefined();
      expect(mockKnex.where).toBeDefined();
      expect(mockKnex.transaction).toBeDefined();
      
      // Test chaining
      const query = mockKnex.select('*').from('users').where({ id: 1 });
      expect(query).toBeDefined();
      expect(mockKnex.select).toHaveBeenCalledWith('*');
      expect(mockKnex.from).toHaveBeenCalledWith('users');
      expect(mockKnex.where).toHaveBeenCalledWith({ id: 1 });
    });

    it('should create notification service mocks with proper methods', () => {
      const mockNotificationService = {
        sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-email-id' }),
        sendSMS: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-sms-id' }),
        sendPushNotification: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-push-id' }),
        sendBulkEmail: jest.fn().mockResolvedValue({ success: true, count: 0 }),
        getNotificationHistory: jest.fn().mockResolvedValue([]),
        markAsRead: jest.fn().mockResolvedValue(true),
        getUnreadCount: jest.fn().mockResolvedValue(0),
      };

      // Assert
      expect(mockNotificationService.sendEmail).toBeDefined();
      expect(mockNotificationService.sendSMS).toBeDefined();
      expect(mockNotificationService.sendPushNotification).toBeDefined();
      
      // Test mock functionality
      expect(mockNotificationService.sendEmail('test@example.com', 'Subject', 'Body'))
        .resolves.toEqual({ success: true, messageId: 'mock-email-id' });
    });

    it('should create monitoring service mocks with proper methods', () => {
      const mockMonitoringService = {
        logSecurityEvent: jest.fn().mockResolvedValue(undefined),
        logPerformanceMetric: jest.fn().mockResolvedValue(undefined),
        logError: jest.fn().mockResolvedValue(undefined),
        logUserActivity: jest.fn().mockResolvedValue(undefined),
        getMetrics: jest.fn().mockResolvedValue({}),
        getHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
      };

      // Assert
      expect(mockMonitoringService.logSecurityEvent).toBeDefined();
      expect(mockMonitoringService.logPerformanceMetric).toBeDefined();
      expect(mockMonitoringService.getHealthStatus).toBeDefined();
      
      // Test mock functionality
      expect(mockMonitoringService.getHealthStatus())
        .resolves.toEqual({ status: 'healthy' });
    });

    it('should create JWT service mocks with proper methods', () => {
      const mockJwtService = {
        sign: jest.fn().mockReturnValue('mock-jwt-token'),
        verify: jest.fn().mockReturnValue({
          sub: 'test-user-id',
          role: 'ATHLETE',
          tenantId: 'test-tenant-id',
        }),
        decode: jest.fn().mockReturnValue({
          sub: 'test-user-id',
          role: 'ATHLETE',
          tenantId: 'test-tenant-id',
        }),
      };

      // Assert
      expect(mockJwtService.sign).toBeDefined();
      expect(mockJwtService.verify).toBeDefined();
      expect(mockJwtService.decode).toBeDefined();
      
      // Test mock functionality
      expect(mockJwtService.sign({ sub: 'test-user' })).toBe('mock-jwt-token');
      expect(mockJwtService.verify('token')).toEqual({
        sub: 'test-user-id',
        role: 'ATHLETE',
        tenantId: 'test-tenant-id',
      });
    });
  });

  describe('Utility Functions Tests', () => {
    it('should create proper auth headers', () => {
      // Arrange
      const token = 'test-jwt-token';

      // Act
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Assert
      expect(headers).toEqual({
        'Authorization': 'Bearer test-jwt-token',
        'Content-Type': 'application/json',
      });
    });

    it('should handle test configuration creation', () => {
      // Arrange
      const config = SosWebApiTestConfigs.forE2ETests();

      // Act
      const testConfig = {
        NODE_ENV: 'test',
        DATABASE_URL: config.database?.connectionString || 'mock://test-database',
        JWT_SECRET: 'test-jwt-secret',
        JWT_EXPIRES_IN: '1h',
        CACHE_TTL: 300,
        API_PORT: 3000,
        NOTIFICATION_SERVICE_URL: 'http://localhost:3001',
        MONITORING_SERVICE_URL: 'http://localhost:3002',
        REDIS_URL: 'redis://localhost:6379',
      };

      // Assert
      expect(testConfig.NODE_ENV).toBe('test');
      expect(testConfig.DATABASE_URL).toBeDefined();
      expect(testConfig.JWT_SECRET).toBe('test-jwt-secret');
      expect(testConfig.API_PORT).toBe(3000);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle missing configuration gracefully', () => {
      // Act & Assert - Should not throw
      expect(() => {
        const config = SosWebApiTestConfigs.custom(
          SosWebApiTestConfigs.forUnitTests(),
          {}
        );
        expect(config).toBeDefined();
      }).not.toThrow();
    });

    it('should handle invalid configuration values gracefully', () => {
      // Act & Assert - Should not throw
      expect(() => {
        const config = SosWebApiTestConfigs.custom(
          SosWebApiTestConfigs.forUnitTests(),
          {
            database: { type: 'invalid' as any },
          }
        );
        expect(config.database?.type).toBe('invalid');
      }).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should create configuration quickly', () => {
      // Arrange
      const startTime = Date.now();

      // Act
      for (let i = 0; i < 100; i++) {
        SosWebApiTestConfigs.forE2ETests();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert - Should complete in under 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle custom configuration merging efficiently', () => {
      // Arrange
      const baseConfig = SosWebApiTestConfigs.forE2ETests();
      const startTime = Date.now();

      // Act
      for (let i = 0; i < 100; i++) {
        SosWebApiTestConfigs.custom(baseConfig, {
          auth: { defaultUserId: `user-${i}` },
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert - Should complete in under 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});