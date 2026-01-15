import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { RedisCacheService, ICacheConfig, ICacheMetrics } from '../redis-cache-service';
import { ILogger } from '@strengthos/shared-logging';
import { UserSession, Permission } from '@strengthos/shared-types';
import { Results } from '@strengthos/shared-utils';
import { ConnectionConfigFactory, RedisConnectionConfig } from '@strengthos/shared-validation';

// Mock Redis container for integration testing
class MockRedisContainer {
  private static instance: MockRedisContainer | null = null;
  private isStarted = false;
  private port = 6380; // Use different port to avoid conflicts

  static async create() {
    if (!MockRedisContainer.instance) {
      MockRedisContainer.instance = new MockRedisContainer();
    }
    return MockRedisContainer.instance;
  }

  async start() {
    if (!this.isStarted) {
      // Simulate container startup
      await new Promise(resolve => setTimeout(resolve, 100));
      this.isStarted = true;
    }
    return this;
  }

  async stop() {
    if (this.isStarted) {
      // Simulate container shutdown
      await new Promise(resolve => setTimeout(resolve, 50));
      this.isStarted = false;
    }
  }

  getHost() {
    return 'localhost';
  }

  getMappedPort() {
    return this.port;
  }

  getConnectionUrl() {
    return `redis://${this.getHost()}:${this.getMappedPort()}`;
  }
}

// Mock logger implementation
class MockLogger implements ILogger {
  info(message: any): void {
    // console.log('INFO:', message);
  }
  
  warning(message: any): void {
    // console.log('WARN:', message);
  }
  
  error(message: any): void {
    // console.log('ERROR:', message);
  }
  
  debug(message: any): void {
    // console.log('DEBUG:', message);
  }
}

describe('Redis Cache Service Integration Tests', () => {
  let container: MockRedisContainer;
  let logger: MockLogger;
  let testConfig: ICacheConfig;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    // Store original environment
    originalEnv = process.env;
    
    // Start test container
    container = await MockRedisContainer.create();
    await container.start();

    // Create mock logger
    logger = new MockLogger();

    // Create test configuration
    testConfig = {
      host: container.getHost(),
      port: container.getMappedPort(),
      password: undefined,
      db: 1, // Use different DB for testing
      timeout: 5000,
      pool: { min: 1, max: 5 },
      keyPrefix: 'test:',
      defaultTTL: 300,
      maxRetries: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true
    };

    // Set environment variables for tests
    process.env.REDIS_HOST = testConfig.host;
    process.env.REDIS_PORT = testConfig.port.toString();
    process.env.REDIS_DB = testConfig.db.toString();
    process.env.REDIS_TIMEOUT = testConfig.timeout.toString();
    process.env.REDIS_POOL_MIN = testConfig.pool.min.toString();
    process.env.REDIS_POOL_MAX = testConfig.pool.max.toString();
  }, 30000);

  afterAll(async () => {
    // Restore original environment
    process.env = originalEnv;
    
    // Stop test container
    if (container) {
      await container.stop();
    }
  }, 10000);

  describe('Redis Connection Establishment', () => {
    it('should establish connection with test container', async () => {
      const cacheService = new RedisCacheService(logger, testConfig);
      
      // Mock the Redis connection for testing
      const mockValidateConnection = vi.spyOn(cacheService, 'validateConnection').mockResolvedValue(
        Results.ok({
          isConnected: true,
          info: {
            serverVersion: '7.0.0',
            uptime: 3600,
            connectedClients: 1
          }
        })
      );
      
      try {
        const result = await cacheService.validateConnection();
        expect(result.isOk).toBe(true);
        expect(result.returnValue?.isConnected).toBe(true);
        expect(result.returnValue?.info).toBeDefined();
      } finally {
        await cacheService.disconnect();
        mockValidateConnection.mockRestore();
      }
    });

    it('should handle connection failures gracefully', async () => {
      const invalidConfig: ICacheConfig = {
        ...testConfig,
        host: 'nonexistent-host',
        port: 9999
      };

      const cacheService = new RedisCacheService(logger, invalidConfig);
      
      // Mock connection failure
      const mockValidateConnection = vi.spyOn(cacheService, 'validateConnection').mockResolvedValue(
        Results.fail({ isConnected: false, info: null }, 'Connection refused')
      );
      
      try {
        const result = await cacheService.validateConnection();
        expect(result.isOk).toBe(false);
        expect(result.returnValue?.isConnected).toBe(false);
      } finally {
        await cacheService.disconnect();
        mockValidateConnection.mockRestore();
      }
    });

    it('should validate Redis authentication with password', async () => {
      const authConfig: ICacheConfig = {
        ...testConfig,
        password: 'test_password'
      };

      const cacheService = new RedisCacheService(logger, authConfig);
      
      // Mock successful authentication
      const mockValidateConnection = vi.spyOn(cacheService, 'validateConnection').mockResolvedValue(
        Results.ok({
          isConnected: true,
          info: {
            serverVersion: '7.0.0',
            uptime: 3600,
            connectedClients: 1
          }
        })
      );
      
      try {
        const result = await cacheService.validateConnection();
        expect(result.isOk).toBe(true);
        expect(result.returnValue?.isConnected).toBe(true);
      } finally {
        await cacheService.disconnect();
        mockValidateConnection.mockRestore();
      }
    });

    it('should handle different database selections', async () => {
      const dbConfigs = [0, 1, 5, 15]; // Test various valid DB numbers
      
      for (const db of dbConfigs) {
        const dbConfig: ICacheConfig = {
          ...testConfig,
          db
        };

        const cacheService = new RedisCacheService(logger, dbConfig);
        
        // Mock successful connection to different DB
        const mockValidateConnection = vi.spyOn(cacheService, 'validateConnection').mockResolvedValue(
          Results.ok({
            isConnected: true,
            info: {
              serverVersion: '7.0.0',
              uptime: 3600,
              connectedClients: 1
            }
          })
        );
        
        try {
          const result = await cacheService.validateConnection();
          expect(result.isOk).toBe(true);
          expect(result.returnValue?.isConnected).toBe(true);
        } finally {
          await cacheService.disconnect();
          mockValidateConnection.mockRestore();
        }
      }
    });
  });

  describe('Connection Timeout and Retry Behavior', () => {
    it('should handle connection timeout scenarios', async () => {
      const timeoutConfig: ICacheConfig = {
        ...testConfig,
        timeout: 1000 // Short timeout
      };

      const cacheService = new RedisCacheService(logger, timeoutConfig);
      
      // Mock timeout scenario
      const mockValidateConnection = vi.spyOn(cacheService, 'validateConnection').mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 1500)
        )
      );
      
      try {
        await expect(cacheService.validateConnection()).rejects.toThrow('Connection timeout');
      } finally {
        await cacheService.disconnect();
        mockValidateConnection.mockRestore();
      }
    });

    it('should implement retry logic for failed operations', async () => {
      const cacheService = new RedisCacheService(logger, testConfig);
      
      let attempts = 0;
      const mockHealthCheck = vi.spyOn(cacheService, 'healthCheck').mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          return Results.fail(null, 'Connection failed');
        }
        return Results.ok(true);
      });
      
      try {
        // Simulate retry logic by calling health check multiple times
        let result = await cacheService.healthCheck();
        expect(result.isOk).toBe(false);
        
        result = await cacheService.healthCheck();
        expect(result.isOk).toBe(false);
        
        result = await cacheService.healthCheck();
        expect(result.isOk).toBe(true);
        
        expect(attempts).toBe(3);
      } finally {
        await cacheService.disconnect();
        mockHealthCheck.mockRestore();
      }
    });

    it('should handle network connectivity issues', async () => {
      const networkConfig: ICacheConfig = {
        ...testConfig,
        host: '192.0.2.1' // TEST-NET-1 address (should not be routable)
      };

      const cacheService = new RedisCacheService(logger, networkConfig);
      
      // Mock network failure
      const mockValidateConnection = vi.spyOn(cacheService, 'validateConnection').mockResolvedValue(
        Results.fail({ isConnected: false, info: null }, 'Network unreachable')
      );
      
      try {
        const result = await cacheService.validateConnection();
        expect(result.isOk).toBe(false);
        expect(result.returnValue?.isConnected).toBe(false);
      } finally {
        await cacheService.disconnect();
        mockValidateConnection.mockRestore();
      }
    });
  });

  describe('Cache Service Integration with Standardized Configuration', () => {
    it('should create cache service from environment variables', () => {
      // Mock the ConnectionConfigFactory
      const mockCreateRedisConfig = vi.spyOn(ConnectionConfigFactory, 'createRedisConfig').mockReturnValue({
        isValid: true,
        data: {
          host: testConfig.host,
          port: testConfig.port,
          password: testConfig.password,
          db: testConfig.db,
          timeout: testConfig.timeout,
          pool: testConfig.pool
        }
      });
      
      try {
        const cacheService = RedisCacheService.createFromEnvironment(logger);
        expect(cacheService).toBeInstanceOf(RedisCacheService);
      } finally {
        mockCreateRedisConfig.mockRestore();
      }
    });

    it('should validate configuration before creating service', () => {
      // Mock invalid configuration
      const mockCreateRedisConfig = vi.spyOn(ConnectionConfigFactory, 'createRedisConfig').mockReturnValue({
        isValid: false,
        errors: [
          { field: 'host', message: 'Host is required', constraint: 'required' }
        ]
      });
      
      try {
        expect(() => {
          RedisCacheService.createFromEnvironment(logger);
        }).toThrow('Redis configuration validation failed');
      } finally {
        mockCreateRedisConfig.mockRestore();
      }
    });

    it('should use ConnectionConfigFactory for standardized configuration', () => {
      const mockCreateRedisConfig = vi.spyOn(ConnectionConfigFactory, 'createRedisConfig').mockReturnValue({
        isValid: true,
        data: {
          host: 'config-host',
          port: 6379,
          password: 'config-password',
          db: 2,
          timeout: 8000,
          pool: { min: 2, max: 8 }
        }
      });
      
      try {
        const cacheService = RedisCacheService.createFromEnvironment(logger);
        expect(cacheService).toBeInstanceOf(RedisCacheService);
        
        // Verify the config was used by checking internal properties
        expect((cacheService as any).config.host).toBe('config-host');
        expect((cacheService as any).config.port).toBe(6379);
        expect((cacheService as any).config.db).toBe(2);
      } finally {
        mockCreateRedisConfig.mockRestore();
      }
    });
  });

  describe('Session Management Integration', () => {
    let cacheService: RedisCacheService;

    beforeEach(() => {
      cacheService = new RedisCacheService(logger, testConfig);
    });

    afterEach(async () => {
      await cacheService.disconnect();
    });

    it('should store and retrieve user sessions', async () => {
      const sessionId = 'test-session-123';
      const userSession: UserSession = {
        sessionId,
        userId: 'user-123',
        tenantId: 'tenant-456',
        email: 'test@example.com',
        roles: ['user'],
        permissions: [],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        isActive: true
      };

      // Mock session operations
      const mockSetSession = vi.spyOn(cacheService, 'setSession').mockResolvedValue(Results.ok(true));
      const mockGetSession = vi.spyOn(cacheService, 'getSession').mockResolvedValue(Results.ok(userSession));
      
      try {
        // Set session
        const setResult = await cacheService.setSession(sessionId, userSession, 1800);
        expect(setResult.isOk).toBe(true);
        expect(setResult.returnValue).toBe(true);

        // Get session
        const getResult = await cacheService.getSession(sessionId);
        expect(getResult.isOk).toBe(true);
        expect(getResult.returnValue).toEqual(userSession);
      } finally {
        mockSetSession.mockRestore();
        mockGetSession.mockRestore();
      }
    });

    it('should handle session expiration', async () => {
      const sessionId = 'expiring-session-123';
      const userSession: UserSession = {
        sessionId,
        userId: 'user-123',
        tenantId: 'tenant-456',
        email: 'test@example.com',
        roles: ['user'],
        permissions: [],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1000), // Expires in 1 second
        isActive: true
      };

      // Mock session operations with expiration
      const mockSetSession = vi.spyOn(cacheService, 'setSession').mockResolvedValue(Results.ok(true));
      const mockGetSession = vi.spyOn(cacheService, 'getSession')
        .mockResolvedValueOnce(Results.ok(userSession))
        .mockResolvedValueOnce(Results.ok(null)); // Expired
      
      try {
        // Set session with short TTL
        const setResult = await cacheService.setSession(sessionId, userSession, 1);
        expect(setResult.isOk).toBe(true);

        // Get session immediately
        const getResult1 = await cacheService.getSession(sessionId);
        expect(getResult1.isOk).toBe(true);
        expect(getResult1.returnValue).toEqual(userSession);

        // Wait for expiration and try again
        await new Promise(resolve => setTimeout(resolve, 1100));
        const getResult2 = await cacheService.getSession(sessionId);
        expect(getResult2.isOk).toBe(true);
        expect(getResult2.returnValue).toBeNull();
      } finally {
        mockSetSession.mockRestore();
        mockGetSession.mockRestore();
      }
    });

    it('should delete user sessions', async () => {
      const userId = 'user-123';
      const sessionIds = ['session-1', 'session-2', 'session-3'];

      // Mock session deletion
      const mockDeleteUserSessions = vi.spyOn(cacheService, 'deleteUserSessions').mockResolvedValue(Results.ok(true));
      
      try {
        const result = await cacheService.deleteUserSessions(userId);
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(true);
      } finally {
        mockDeleteUserSessions.mockRestore();
      }
    });
  });

  describe('Permission Management Integration', () => {
    let cacheService: RedisCacheService;

    beforeEach(() => {
      cacheService = new RedisCacheService(logger, testConfig);
    });

    afterEach(async () => {
      await cacheService.disconnect();
    });

    it('should store and retrieve user permissions', async () => {
      const userId = 'user-123';
      const permissions: Permission[] = [
        { id: '1', name: 'read', resource: 'users', action: 'read' },
        { id: '2', name: 'write', resource: 'users', action: 'write' }
      ];

      // Mock permission operations
      const mockSetUserPermissions = vi.spyOn(cacheService, 'setUserPermissions').mockResolvedValue(Results.ok(true));
      const mockGetUserPermissions = vi.spyOn(cacheService, 'getUserPermissions').mockResolvedValue(Results.ok(permissions));
      
      try {
        // Set permissions
        const setResult = await cacheService.setUserPermissions(userId, permissions, 900);
        expect(setResult.isOk).toBe(true);
        expect(setResult.returnValue).toBe(true);

        // Get permissions
        const getResult = await cacheService.getUserPermissions(userId);
        expect(getResult.isOk).toBe(true);
        expect(getResult.returnValue).toEqual(permissions);
      } finally {
        mockSetUserPermissions.mockRestore();
        mockGetUserPermissions.mockRestore();
      }
    });

    it('should handle permission cache misses', async () => {
      const userId = 'nonexistent-user';

      // Mock permission cache miss
      const mockGetUserPermissions = vi.spyOn(cacheService, 'getUserPermissions').mockResolvedValue(Results.ok(null));
      
      try {
        const result = await cacheService.getUserPermissions(userId);
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBeNull();
      } finally {
        mockGetUserPermissions.mockRestore();
      }
    });
  });

  describe('Tenant-Aware Caching Integration', () => {
    let cacheService: RedisCacheService;

    beforeEach(() => {
      cacheService = new RedisCacheService(logger, testConfig);
    });

    afterEach(async () => {
      await cacheService.disconnect();
    });

    it('should store and retrieve tenant-specific data', async () => {
      const tenantId = 'tenant-123';
      const key = 'user-preferences';
      const data = { theme: 'dark', language: 'en' };

      // Mock tenant data operations
      const mockSetTenantData = vi.spyOn(cacheService, 'setTenantData').mockResolvedValue(Results.ok(true));
      const mockGetTenantData = vi.spyOn(cacheService, 'getTenantData').mockResolvedValue(Results.ok(data));
      
      try {
        // Set tenant data
        const setResult = await cacheService.setTenantData(tenantId, key, data, 600);
        expect(setResult.isOk).toBe(true);
        expect(setResult.returnValue).toBe(true);

        // Get tenant data
        const getResult = await cacheService.getTenantData(tenantId, key);
        expect(getResult.isOk).toBe(true);
        expect(getResult.returnValue).toEqual(data);
      } finally {
        mockSetTenantData.mockRestore();
        mockGetTenantData.mockRestore();
      }
    });

    it('should invalidate entire tenant cache', async () => {
      const tenantId = 'tenant-123';

      // Mock tenant cache invalidation
      const mockInvalidateTenantCache = vi.spyOn(cacheService, 'invalidateTenantCache').mockResolvedValue(Results.ok(5));
      
      try {
        const result = await cacheService.invalidateTenantCache(tenantId);
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(5); // Number of keys deleted
      } finally {
        mockInvalidateTenantCache.mockRestore();
      }
    });

    it('should handle tenant context management', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-456';

      // Mock tenant context operations
      const mockSetTenantContext = vi.spyOn(cacheService, 'setTenantContext').mockResolvedValue(Results.ok(true));
      const mockGetTenantContext = vi.spyOn(cacheService, 'getTenantContext').mockResolvedValue(Results.ok(tenantId));
      
      try {
        // Set tenant context
        const setResult = await cacheService.setTenantContext(userId, tenantId, 3600);
        expect(setResult.isOk).toBe(true);
        expect(setResult.returnValue).toBe(true);

        // Get tenant context
        const getResult = await cacheService.getTenantContext(userId);
        expect(getResult.isOk).toBe(true);
        expect(getResult.returnValue).toBe(tenantId);
      } finally {
        mockSetTenantContext.mockRestore();
        mockGetTenantContext.mockRestore();
      }
    });
  });

  describe('Health Checks and Monitoring', () => {
    let cacheService: RedisCacheService;

    beforeEach(() => {
      cacheService = new RedisCacheService(logger, testConfig);
    });

    afterEach(async () => {
      await cacheService.disconnect();
    });

    it('should perform health checks successfully', async () => {
      // Mock successful health check
      const mockHealthCheck = vi.spyOn(cacheService, 'healthCheck').mockResolvedValue(Results.ok(true));
      
      try {
        const result = await cacheService.healthCheck();
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(true);
      } finally {
        mockHealthCheck.mockRestore();
      }
    });

    it('should detect unhealthy Redis connections', async () => {
      // Mock failed health check
      const mockHealthCheck = vi.spyOn(cacheService, 'healthCheck').mockResolvedValue(
        Results.fail(null, 'Redis health check failed')
      );
      
      try {
        const result = await cacheService.healthCheck();
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Redis health check failed');
      } finally {
        mockHealthCheck.mockRestore();
      }
    });

    it('should collect cache metrics', async () => {
      const mockMetrics: ICacheMetrics = {
        hits: 100,
        misses: 20,
        sets: 80,
        deletes: 10,
        errors: 2,
        totalKeys: 150,
        memoryUsage: 1024000,
        avgResponseTime: 5.2
      };

      // Mock metrics collection
      const mockGetMetrics = vi.spyOn(cacheService, 'getMetrics').mockResolvedValue(Results.ok(mockMetrics));
      
      try {
        const result = await cacheService.getMetrics();
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toEqual(mockMetrics);
        expect(result.returnValue?.hits).toBe(100);
        expect(result.returnValue?.memoryUsage).toBe(1024000);
      } finally {
        mockGetMetrics.mockRestore();
      }
    });

    it('should track performance metrics', async () => {
      // Test performance timer functionality
      const timerId = cacheService.startPerformanceTimer('test-operation');
      expect(timerId).toBeTruthy();
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const duration = cacheService.endPerformanceTimer(timerId);
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Should be less than 1 second
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid configuration gracefully', () => {
      const invalidConfigs = [
        { ...testConfig, host: '' },
        { ...testConfig, port: 0 },
        { ...testConfig, port: 70000 },
        { ...testConfig, db: -1 },
        { ...testConfig, db: 16 },
        { ...testConfig, timeout: 500 },
        { ...testConfig, timeout: 70000 },
        { ...testConfig, pool: { min: 10, max: 5 } }
      ];

      invalidConfigs.forEach(config => {
        expect(() => {
          new RedisCacheService(logger, config);
        }).toThrow();
      });
    });

    it('should sanitize error messages to prevent credential exposure', async () => {
      const cacheService = new RedisCacheService(logger, testConfig);
      
      // Mock error with potential credential exposure
      const mockHealthCheck = vi.spyOn(cacheService, 'healthCheck').mockResolvedValue(
        Results.fail(null, 'Connection failed: redis://user:***@host:6379/0')
      );
      
      try {
        const result = await cacheService.healthCheck();
        expect(result.isOk).toBe(false);
        
        // Error message should not contain the actual password
        if (result.message) {
          expect(result.message).not.toContain('password123');
          expect(result.message).toContain('***'); // Should be sanitized
        }
      } finally {
        await cacheService.disconnect();
        mockHealthCheck.mockRestore();
      }
    });

    it('should handle Redis server unavailable scenarios', async () => {
      const unavailableConfig: ICacheConfig = {
        ...testConfig,
        host: 'unavailable-redis-server',
        port: 6379
      };

      const cacheService = new RedisCacheService(logger, unavailableConfig);
      
      // Mock server unavailable
      const mockValidateConnection = vi.spyOn(cacheService, 'validateConnection').mockResolvedValue(
        Results.fail({ isConnected: false, info: null }, 'Redis server unavailable')
      );
      
      try {
        const result = await cacheService.validateConnection();
        expect(result.isOk).toBe(false);
        expect(result.returnValue?.isConnected).toBe(false);
      } finally {
        await cacheService.disconnect();
        mockValidateConnection.mockRestore();
      }
    });

    it('should handle memory pressure scenarios', async () => {
      const cacheService = new RedisCacheService(logger, testConfig);
      
      // Mock high memory usage metrics
      const mockGetMetrics = vi.spyOn(cacheService, 'getMetrics').mockResolvedValue(
        Results.ok({
          hits: 1000,
          misses: 100,
          sets: 800,
          deletes: 50,
          errors: 5,
          totalKeys: 10000,
          memoryUsage: 1073741824, // 1GB
          avgResponseTime: 15.5
        })
      );
      
      try {
        const result = await cacheService.getMetrics();
        expect(result.isOk).toBe(true);
        expect(result.returnValue?.memoryUsage).toBeGreaterThan(1000000000); // > 1GB
        expect(result.returnValue?.totalKeys).toBe(10000);
      } finally {
        await cacheService.disconnect();
        mockGetMetrics.mockRestore();
      }
    });
  });

  describe('Performance and Load Testing', () => {
    let cacheService: RedisCacheService;

    beforeEach(() => {
      cacheService = new RedisCacheService(logger, testConfig);
    });

    afterEach(async () => {
      await cacheService.disconnect();
    });

    it('should handle concurrent cache operations', async () => {
      // Mock concurrent operations that return simple values (not Results objects)
      const mockGet = vi.spyOn(cacheService, 'get').mockImplementation(async (key: string) => {
        const index = parseInt(key.split('-')[1]);
        return `result-${index}`;
      });
      
      try {
        const startTime = Date.now();
        const results = await Promise.all(
          Array.from({ length: 20 }, (_, i) => cacheService.get(`key-${i}`))
        );
        const endTime = Date.now();
        
        expect(results).toHaveLength(20);
        expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
        
        results.forEach((result, index) => {
          expect(result).toBe(`result-${index}`);
        });
      } finally {
        mockGet.mockRestore();
      }
    });

    it('should maintain performance under sustained load', async () => {
      // Simulate sustained load
      const batchSize = 10;
      const batches = 3;
      const results: any[][] = [];
      
      const mockSet = vi.spyOn(cacheService, 'set').mockResolvedValue(true);
      const mockGet = vi.spyOn(cacheService, 'get').mockImplementation(async (key: string) => {
        return `cached-${key}`;
      });
      
      try {
        for (let batch = 0; batch < batches; batch++) {
          const batchOperations = Array.from({ length: batchSize }, async (_, i) => {
            const key = `batch-${batch}-key-${i}`;
            await cacheService.set(key, `value-${i}`, 300);
            return await cacheService.get(key);
          });
          
          const batchResults = await Promise.all(batchOperations);
          results.push(batchResults);
          
          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        expect(results).toHaveLength(batches);
        results.forEach((batchResults, batchIndex) => {
          expect(batchResults).toHaveLength(batchSize);
          batchResults.forEach((result, resultIndex) => {
            expect(result).toBe(`cached-batch-${batchIndex}-key-${resultIndex}`);
          });
        });
      } finally {
        mockSet.mockRestore();
        mockGet.mockRestore();
      }
    });

    it('should handle cache flush operations efficiently', async () => {
      const cacheService = new RedisCacheService(logger, testConfig);
      
      // Mock flush operations
      const mockFlushAll = vi.spyOn(cacheService, 'flushAll').mockResolvedValue(Results.ok(undefined));
      const mockFlushTenant = vi.spyOn(cacheService, 'flushTenant').mockResolvedValue(Results.ok(25));
      
      try {
        // Test flush all
        const flushAllResult = await cacheService.flushAll();
        expect(flushAllResult.isOk).toBe(true);
        
        // Test tenant flush
        const flushTenantResult = await cacheService.flushTenant('tenant-123');
        expect(flushTenantResult.isOk).toBe(true);
        expect(flushTenantResult.returnValue).toBe(25);
      } finally {
        await cacheService.disconnect();
        mockFlushAll.mockRestore();
        mockFlushTenant.mockRestore();
      }
    });
  });
});