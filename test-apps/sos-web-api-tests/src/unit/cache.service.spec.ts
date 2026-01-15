import { CacheService } from '@strengthos/sos-web-api/src/shared/cache/cache.service';
import {
  IRedisCacheService,
  ISessionCacheService,
  CacheConfigurationService,
  CacheInvalidationService,
  InvalidationEvent,
  InvalidationEventType,
  ICacheMetrics,
} from '@strengthos/shared-cache';
import { ILogger } from '@strengthos/shared-logging';
import { TestModuleBuilder } from '../utils/test-module-builder';
import { Results } from '@strengthos/shared-utils';
import { UserSession, Permission } from '@strengthos/shared-types';

describe('CacheService', () => {
  let service: CacheService;
  let mockRedisCache: jest.Mocked<IRedisCacheService>;
  let mockSessionCache: jest.Mocked<ISessionCacheService>;
  let mockConfigService: jest.Mocked<CacheConfigurationService>;
  let mockInvalidationService: jest.Mocked<CacheInvalidationService>;
  let mockLogger: jest.Mocked<ILogger>;

  const mockUserSession: UserSession = {
    id: 'session-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    role: 'athlete',
    permissions: [],
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
  };

  const mockPermissions: Permission[] = [
    {
      id: 'perm-1',
      name: 'read:users',
      resource: 'users',
      action: 'read',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm-2',
      name: 'write:users',
      resource: 'users',
      action: 'write',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockCacheMetrics: ICacheMetrics = {
    hitRate: 0.85,
    missRate: 0.15,
    totalHits: 850,
    totalMisses: 150,
    totalOperations: 1000,
    averageResponseTime: 2.5,
    memoryUsage: 1024000,
    connectionCount: 5,
    errorCount: 2,
  };

  beforeEach(async () => {
    mockRedisCache = {
      setSession: jest.fn(),
      getSession: jest.fn(),
      deleteSession: jest.fn(),
      deleteUserSessions: jest.fn(),
      setUserPermissions: jest.fn(),
      getUserPermissions: jest.fn(),
      deleteUserPermissions: jest.fn(),
      setTenantContext: jest.fn(),
      getTenantContext: jest.fn(),
      deleteTenantContext: jest.fn(),
      setTenantData: jest.fn(),
      getTenantData: jest.fn(),
      deleteTenantData: jest.fn(),
      invalidateTenantCache: jest.fn(),
      getMetrics: jest.fn(),
      healthCheck: jest.fn(),
      flushAll: jest.fn(),
      startPerformanceTimer: jest.fn(),
      endPerformanceTimer: jest.fn(),
    } as any;

    mockSessionCache = {
      setSession: jest.fn(),
      getSession: jest.fn(),
      deleteSession: jest.fn(),
      deleteUserSessions: jest.fn(),
      setUserPermissions: jest.fn(),
      getUserPermissions: jest.fn(),
      deleteUserPermissions: jest.fn(),
      setTenantContext: jest.fn(),
      getTenantContext: jest.fn(),
      deleteTenantContext: jest.fn(),
      getCacheStats: jest.fn(),
      flushAllCaches: jest.fn(),
    } as any;

    mockConfigService = {
      getConfiguration: jest.fn(),
      updateConfiguration: jest.fn(),
    } as any;

    mockInvalidationService = {
      queueInvalidation: jest.fn(),
      invalidateUserData: jest.fn(),
      invalidateUserSessions: jest.fn(),
      invalidatePermissions: jest.fn(),
      invalidateTenantData: jest.fn(),
      warmCache: jest.fn(),
      getQueueStatus: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      warning: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
    } as any;

    const { service: testService } = await TestModuleBuilder
      .forService(CacheService)
      .withMocks([
        { provide: 'IRedisCacheService', useValue: mockRedisCache },
        { provide: 'ISessionCacheService', useValue: mockSessionCache },
        { provide: 'CacheConfigurationService', useValue: mockConfigService },
        { provide: 'CacheInvalidationService', useValue: mockInvalidationService },
        { provide: 'ILogger', useValue: mockLogger },
      ])
      .build();

    service = testService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize successfully when Redis is healthy', async () => {
      mockRedisCache.healthCheck.mockResolvedValue(Results.ok(true));

      await service.onModuleInit();

      expect(mockRedisCache.healthCheck).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Cache service initialized successfully',
      });
    });

    it('should log warning when Redis health check fails', async () => {
      mockRedisCache.healthCheck.mockResolvedValue(Results.ok(false));

      await service.onModuleInit();

      expect(mockRedisCache.healthCheck).toHaveBeenCalled();
      expect(mockLogger.warning).toHaveBeenCalledWith({
        message: 'Redis cache health check failed, falling back to in-memory cache',
      });
    });

    it('should log warning when Redis health check returns error', async () => {
      mockRedisCache.healthCheck.mockResolvedValue(Results.error(null, 'Connection failed'));

      await service.onModuleInit();

      expect(mockRedisCache.healthCheck).toHaveBeenCalled();
      expect(mockLogger.warning).toHaveBeenCalledWith({
        message: 'Redis cache health check failed, falling back to in-memory cache',
      });
    });
  });

  describe('Session Management', () => {
    describe('setSession', () => {
      it('should set session in Redis successfully', async () => {
        mockRedisCache.setSession.mockResolvedValue(Results.ok(true));

        const result = await service.setSession('session-1', mockUserSession, 3600);

        expect(mockRedisCache.setSession).toHaveBeenCalledWith('session-1', mockUserSession, 3600);
        expect(mockSessionCache.setSession).not.toHaveBeenCalled();
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(true);
      });

      it('should fallback to session cache when Redis fails', async () => {
        mockRedisCache.setSession.mockResolvedValue(Results.error(null, 'Redis error'));
        mockSessionCache.setSession.mockResolvedValue(Results.ok(true));

        const result = await service.setSession('session-1', mockUserSession, 3600);

        expect(mockRedisCache.setSession).toHaveBeenCalledWith('session-1', mockUserSession, 3600);
        expect(mockSessionCache.setSession).toHaveBeenCalledWith('session-1', mockUserSession, 3600);
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(true);
      });

      it('should handle exceptions gracefully', async () => {
        mockRedisCache.setSession.mockRejectedValue(new Error('Connection error'));

        const result = await service.setSession('session-1', mockUserSession, 3600);

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to set session in cache',
          fullMessage: 'Connection error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Failed to set session in cache');
      });
    });

    describe('getSession', () => {
      it('should get session from Redis successfully', async () => {
        mockRedisCache.getSession.mockResolvedValue(Results.ok(mockUserSession));

        const result = await service.getSession('session-1');

        expect(mockRedisCache.getSession).toHaveBeenCalledWith('session-1');
        expect(mockSessionCache.getSession).not.toHaveBeenCalled();
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(mockUserSession);
      });

      it('should fallback to session cache when Redis returns null', async () => {
        mockRedisCache.getSession.mockResolvedValue(Results.ok(null));
        mockSessionCache.getSession.mockResolvedValue(Results.ok(mockUserSession));

        const result = await service.getSession('session-1');

        expect(mockRedisCache.getSession).toHaveBeenCalledWith('session-1');
        expect(mockSessionCache.getSession).toHaveBeenCalledWith('session-1');
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(mockUserSession);
      });

      it('should handle exceptions gracefully', async () => {
        mockRedisCache.getSession.mockRejectedValue(new Error('Connection error'));

        const result = await service.getSession('session-1');

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to get session from cache',
          fullMessage: 'Connection error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Failed to get session from cache');
      });
    });

    describe('deleteSession', () => {
      it('should delete session from both caches successfully', async () => {
        mockRedisCache.deleteSession.mockResolvedValue(Results.ok(true));
        mockSessionCache.deleteSession.mockResolvedValue(Results.ok(true));

        const result = await service.deleteSession('session-1');

        expect(mockRedisCache.deleteSession).toHaveBeenCalledWith('session-1');
        expect(mockSessionCache.deleteSession).toHaveBeenCalledWith('session-1');
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(true);
      });

      it('should succeed if at least one cache deletion succeeds', async () => {
        mockRedisCache.deleteSession.mockResolvedValue(Results.error(null, 'Redis error'));
        mockSessionCache.deleteSession.mockResolvedValue(Results.ok(true));

        const result = await service.deleteSession('session-1');

        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(true);
      });

      it('should handle exceptions gracefully', async () => {
        mockRedisCache.deleteSession.mockRejectedValue(new Error('Connection error'));

        const result = await service.deleteSession('session-1');

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to delete session from cache',
          fullMessage: 'Connection error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Failed to delete session from cache');
      });
    });

    describe('deleteUserSessions', () => {
      it('should delete user sessions and queue invalidation event', async () => {
        mockRedisCache.deleteUserSessions.mockResolvedValue(Results.ok(true));
        mockSessionCache.deleteUserSessions.mockResolvedValue(Results.ok(true));
        mockInvalidationService.queueInvalidation.mockResolvedValue(Results.ok(undefined));

        const result = await service.deleteUserSessions('user-1');

        expect(mockRedisCache.deleteUserSessions).toHaveBeenCalledWith('user-1');
        expect(mockSessionCache.deleteUserSessions).toHaveBeenCalledWith('user-1');
        expect(mockInvalidationService.queueInvalidation).toHaveBeenCalledWith({
          type: InvalidationEventType.USER_UPDATED,
          entityType: 'user',
          entityId: 'user-1',
          timestamp: expect.any(Date),
        });
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(true);
      });

      it('should handle exceptions gracefully', async () => {
        mockRedisCache.deleteUserSessions.mockRejectedValue(new Error('Connection error'));

        const result = await service.deleteUserSessions('user-1');

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to delete user sessions from cache',
          fullMessage: 'Connection error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Failed to delete user sessions from cache');
      });
    });
  });

  describe('Permission Management', () => {
    describe('setUserPermissions', () => {
      it('should set user permissions in Redis successfully', async () => {
        mockRedisCache.setUserPermissions.mockResolvedValue(Results.ok(true));

        const result = await service.setUserPermissions('user-1', mockPermissions, 3600);

        expect(mockRedisCache.setUserPermissions).toHaveBeenCalledWith('user-1', mockPermissions, 3600);
        expect(mockSessionCache.setUserPermissions).not.toHaveBeenCalled();
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(true);
      });

      it('should fallback to session cache when Redis fails', async () => {
        mockRedisCache.setUserPermissions.mockResolvedValue(Results.error(null, 'Redis error'));
        mockSessionCache.setUserPermissions.mockResolvedValue(Results.ok(true));

        const result = await service.setUserPermissions('user-1', mockPermissions, 3600);

        expect(mockRedisCache.setUserPermissions).toHaveBeenCalledWith('user-1', mockPermissions, 3600);
        expect(mockSessionCache.setUserPermissions).toHaveBeenCalledWith(
          'user-1',
          ['read:users', 'write:users'],
          3600
        );
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(true);
      });

      it('should handle exceptions gracefully', async () => {
        mockRedisCache.setUserPermissions.mockRejectedValue(new Error('Connection error'));

        const result = await service.setUserPermissions('user-1', mockPermissions, 3600);

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to set user permissions in cache',
          fullMessage: 'Connection error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Failed to set user permissions in cache');
      });
    });

    describe('getUserPermissions', () => {
      it('should get user permissions from Redis successfully', async () => {
        mockRedisCache.getUserPermissions.mockResolvedValue(Results.ok(mockPermissions));

        const result = await service.getUserPermissions('user-1');

        expect(mockRedisCache.getUserPermissions).toHaveBeenCalledWith('user-1');
        expect(mockSessionCache.getUserPermissions).not.toHaveBeenCalled();
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(mockPermissions);
      });

      it('should fallback to session cache and convert string array to permissions', async () => {
        mockRedisCache.getUserPermissions.mockResolvedValue(Results.ok(null));
        mockSessionCache.getUserPermissions.mockResolvedValue(Results.ok(['read:users', 'write:users']));

        const result = await service.getUserPermissions('user-1');

        expect(mockRedisCache.getUserPermissions).toHaveBeenCalledWith('user-1');
        expect(mockSessionCache.getUserPermissions).toHaveBeenCalledWith('user-1');
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toHaveLength(2);
        expect(result.returnValue![0].name).toBe('read:users');
        expect(result.returnValue![1].name).toBe('write:users');
      });

      it('should return null when no permissions found', async () => {
        mockRedisCache.getUserPermissions.mockResolvedValue(Results.ok(null));
        mockSessionCache.getUserPermissions.mockResolvedValue(Results.ok(null));

        const result = await service.getUserPermissions('user-1');

        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBeNull();
      });

      it('should handle exceptions gracefully', async () => {
        mockRedisCache.getUserPermissions.mockRejectedValue(new Error('Connection error'));

        const result = await service.getUserPermissions('user-1');

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to get user permissions from cache',
          fullMessage: 'Connection error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Failed to get user permissions from cache');
      });
    });

    describe('deleteUserPermissions', () => {
      it('should delete user permissions and queue invalidation event', async () => {
        mockRedisCache.deleteUserPermissions.mockResolvedValue(Results.ok(true));
        mockSessionCache.deleteUserPermissions.mockResolvedValue(Results.ok(true));
        mockInvalidationService.queueInvalidation.mockResolvedValue(Results.ok(undefined));

        const result = await service.deleteUserPermissions('user-1');

        expect(mockRedisCache.deleteUserPermissions).toHaveBeenCalledWith('user-1');
        expect(mockSessionCache.deleteUserPermissions).toHaveBeenCalledWith('user-1');
        expect(mockInvalidationService.queueInvalidation).toHaveBeenCalledWith({
          type: InvalidationEventType.PERMISSIONS_UPDATED,
          entityType: 'user',
          entityId: 'user-1',
          timestamp: expect.any(Date),
        });
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(true);
      });

      it('should handle exceptions gracefully', async () => {
        mockRedisCache.deleteUserPermissions.mockRejectedValue(new Error('Connection error'));

        const result = await service.deleteUserPermissions('user-1');

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to delete user permissions from cache',
          fullMessage: 'Connection error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Failed to delete user permissions from cache');
      });
    });
  });

  describe('Tenant Context Management', () => {
    describe('setTenantContext', () => {
      it('should set tenant context in Redis successfully', async () => {
        mockRedisCache.setTenantContext.mockResolvedValue(Results.ok(true));

        const result = await service.setTenantContext('user-1', 'tenant-1', 3600);

        expect(mockRedisCache.setTenantContext).toHaveBeenCalledWith('user-1', 'tenant-1', 3600);
        expect(mockSessionCache.setTenantContext).not.toHaveBeenCalled();
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(true);
      });

      it('should fallback to session cache when Redis fails', async () => {
        mockRedisCache.setTenantContext.mockResolvedValue(Results.error(null, 'Redis error'));
        mockSessionCache.setTenantContext.mockResolvedValue(Results.ok(true));

        const result = await service.setTenantContext('user-1', 'tenant-1', 3600);

        expect(mockRedisCache.setTenantContext).toHaveBeenCalledWith('user-1', 'tenant-1', 3600);
        expect(mockSessionCache.setTenantContext).toHaveBeenCalledWith('user-1', 'tenant-1', 3600);
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(true);
      });

      it('should handle exceptions gracefully', async () => {
        mockRedisCache.setTenantContext.mockRejectedValue(new Error('Connection error'));

        const result = await service.setTenantContext('user-1', 'tenant-1', 3600);

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to set tenant context in cache',
          fullMessage: 'Connection error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Failed to set tenant context in cache');
      });
    });

    describe('getTenantContext', () => {
      it('should get tenant context from Redis successfully', async () => {
        mockRedisCache.getTenantContext.mockResolvedValue(Results.ok('tenant-1'));

        const result = await service.getTenantContext('user-1');

        expect(mockRedisCache.getTenantContext).toHaveBeenCalledWith('user-1');
        expect(mockSessionCache.getTenantContext).not.toHaveBeenCalled();
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe('tenant-1');
      });

      it('should fallback to session cache when Redis returns null', async () => {
        mockRedisCache.getTenantContext.mockResolvedValue(Results.ok(null));
        mockSessionCache.getTenantContext.mockResolvedValue(Results.ok('tenant-1'));

        const result = await service.getTenantContext('user-1');

        expect(mockRedisCache.getTenantContext).toHaveBeenCalledWith('user-1');
        expect(mockSessionCache.getTenantContext).toHaveBeenCalledWith('user-1');
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe('tenant-1');
      });

      it('should handle exceptions gracefully', async () => {
        mockRedisCache.getTenantContext.mockRejectedValue(new Error('Connection error'));

        const result = await service.getTenantContext('user-1');

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to get tenant context from cache',
          fullMessage: 'Connection error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Failed to get tenant context from cache');
      });
    });

    describe('deleteTenantContext', () => {
      it('should delete tenant context from both caches successfully', async () => {
        mockRedisCache.deleteTenantContext.mockResolvedValue(Results.ok(true));
        mockSessionCache.deleteTenantContext.mockResolvedValue(Results.ok(true));

        const result = await service.deleteTenantContext('user-1');

        expect(mockRedisCache.deleteTenantContext).toHaveBeenCalledWith('user-1');
        expect(mockSessionCache.deleteTenantContext).toHaveBeenCalledWith('user-1');
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(true);
      });

      it('should handle exceptions gracefully', async () => {
        mockRedisCache.deleteTenantContext.mockRejectedValue(new Error('Connection error'));

        const result = await service.deleteTenantContext('user-1');

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to delete tenant context from cache',
          fullMessage: 'Connection error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Failed to delete tenant context from cache');
      });
    });
  });

  describe('Tenant-Aware Caching', () => {
    describe('setTenantData', () => {
      it('should set tenant data successfully', async () => {
        const testData = { key: 'value', number: 123 };
        mockRedisCache.setTenantData.mockResolvedValue(Results.ok(true));

        const result = await service.setTenantData('tenant-1', 'test-key', testData, 3600);

        expect(mockRedisCache.setTenantData).toHaveBeenCalledWith('tenant-1', 'test-key', testData, 3600);
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(true);
      });

      it('should handle exceptions gracefully', async () => {
        mockRedisCache.setTenantData.mockRejectedValue(new Error('Connection error'));

        const result = await service.setTenantData('tenant-1', 'test-key', { data: 'test' }, 3600);

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to set tenant data in cache',
          fullMessage: 'Connection error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Failed to set tenant data in cache');
      });
    });

    describe('getTenantData', () => {
      it('should get tenant data successfully', async () => {
        const testData = { key: 'value', number: 123 };
        mockRedisCache.getTenantData.mockResolvedValue(Results.ok(testData));

        const result = await service.getTenantData('tenant-1', 'test-key');

        expect(mockRedisCache.getTenantData).toHaveBeenCalledWith('tenant-1', 'test-key');
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(testData);
      });

      it('should handle exceptions gracefully', async () => {
        mockRedisCache.getTenantData.mockRejectedValue(new Error('Connection error'));

        const result = await service.getTenantData('tenant-1', 'test-key');

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to get tenant data from cache',
          fullMessage: 'Connection error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Failed to get tenant data from cache');
      });
    });

    describe('deleteTenantData', () => {
      it('should delete tenant data successfully', async () => {
        mockRedisCache.deleteTenantData.mockResolvedValue(Results.ok(true));

        const result = await service.deleteTenantData('tenant-1', 'test-key');

        expect(mockRedisCache.deleteTenantData).toHaveBeenCalledWith('tenant-1', 'test-key');
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(true);
      });

      it('should handle exceptions gracefully', async () => {
        mockRedisCache.deleteTenantData.mockRejectedValue(new Error('Connection error'));

        const result = await service.deleteTenantData('tenant-1', 'test-key');

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to delete tenant data from cache',
          fullMessage: 'Connection error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Failed to delete tenant data from cache');
      });
    });

    describe('invalidateTenantCache', () => {
      it('should invalidate tenant cache successfully', async () => {
        mockInvalidationService.invalidateTenantData.mockResolvedValue(Results.ok(undefined));
        mockRedisCache.invalidateTenantCache.mockResolvedValue(Results.ok(5));

        const result = await service.invalidateTenantCache('tenant-1');

        expect(mockInvalidationService.invalidateTenantData).toHaveBeenCalledWith('tenant-1');
        expect(mockRedisCache.invalidateTenantCache).toHaveBeenCalledWith('tenant-1');
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(5);
      });

      it('should handle invalidation service failure', async () => {
        mockInvalidationService.invalidateTenantData.mockResolvedValue(Results.error(null, 'Invalidation failed'));

        const result = await service.invalidateTenantCache('tenant-1');

        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Invalidation failed');
      });

      it('should handle exceptions gracefully', async () => {
        mockInvalidationService.invalidateTenantData.mockRejectedValue(new Error('Service error'));

        const result = await service.invalidateTenantCache('tenant-1');

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to invalidate tenant cache',
          fullMessage: 'Service error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Failed to invalidate tenant cache');
      });
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate user data', async () => {
      mockInvalidationService.invalidateUserData.mockResolvedValue(Results.ok(undefined));

      const result = await service.invalidateUserData('user-1');

      expect(mockInvalidationService.invalidateUserData).toHaveBeenCalledWith('user-1');
      expect(result.isOk).toBe(true);
    });

    it('should invalidate user sessions', async () => {
      mockInvalidationService.invalidateUserSessions.mockResolvedValue(Results.ok(undefined));

      const result = await service.invalidateUserSessions('user-1');

      expect(mockInvalidationService.invalidateUserSessions).toHaveBeenCalledWith('user-1');
      expect(result.isOk).toBe(true);
    });

    it('should invalidate permissions', async () => {
      mockInvalidationService.invalidatePermissions.mockResolvedValue(Results.ok(undefined));

      const result = await service.invalidatePermissions('user-1');

      expect(mockInvalidationService.invalidatePermissions).toHaveBeenCalledWith('user-1');
      expect(result.isOk).toBe(true);
    });

    it('should queue invalidation event', async () => {
      const event: InvalidationEvent = {
        type: InvalidationEventType.USER_UPDATED,
        entityType: 'user',
        entityId: 'user-1',
        timestamp: new Date(),
      };

      mockInvalidationService.queueInvalidation.mockResolvedValue(Results.ok(undefined));

      const result = await service.queueInvalidation(event);

      expect(mockInvalidationService.queueInvalidation).toHaveBeenCalledWith(event);
      expect(result.isOk).toBe(true);
    });
  });

  describe('Cache Management and Monitoring', () => {
    describe('getMetrics', () => {
      it('should get cache metrics successfully', async () => {
        mockRedisCache.getMetrics.mockResolvedValue(Results.ok(mockCacheMetrics));

        const result = await service.getMetrics();

        expect(mockRedisCache.getMetrics).toHaveBeenCalled();
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(mockCacheMetrics);
      });

      it('should handle exceptions gracefully', async () => {
        mockRedisCache.getMetrics.mockRejectedValue(new Error('Connection error'));

        const result = await service.getMetrics();

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to get cache metrics',
          fullMessage: 'Connection error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Failed to get cache metrics');
      });
    });

    describe('getCacheStats', () => {
      it('should get comprehensive cache stats successfully', async () => {
        const sessionStats = { hitRate: 0.9, totalOperations: 500 };
        const queueStatus = { pendingItems: 10, processingItems: 2 };

        mockSessionCache.getCacheStats.mockReturnValue(Results.ok(sessionStats));
        mockRedisCache.getMetrics.mockResolvedValue(Results.ok(mockCacheMetrics));
        mockInvalidationService.getQueueStatus.mockReturnValue(queueStatus);

        const result = await service.getCacheStats();

        expect(result.isOk).toBe(true);
        expect(result.returnValue).toEqual({
          redis: mockCacheMetrics,
          session: sessionStats,
          invalidationQueue: queueStatus,
        });
      });

      it('should handle partial failures gracefully', async () => {
        const sessionStats = { hitRate: 0.9, totalOperations: 500 };
        const queueStatus = { pendingItems: 10, processingItems: 2 };

        mockSessionCache.getCacheStats.mockReturnValue(Results.ok(sessionStats));
        mockRedisCache.getMetrics.mockResolvedValue(Results.error(null, 'Redis error'));
        mockInvalidationService.getQueueStatus.mockReturnValue(queueStatus);

        const result = await service.getCacheStats();

        expect(result.isOk).toBe(true);
        expect(result.returnValue).toEqual({
          redis: null,
          session: sessionStats,
          invalidationQueue: queueStatus,
        });
      });

      it('should handle exceptions gracefully', async () => {
        mockSessionCache.getCacheStats.mockImplementation(() => {
          throw new Error('Session cache error');
        });

        const result = await service.getCacheStats();

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to get cache stats',
          fullMessage: 'Session cache error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Failed to get cache stats');
      });
    });

    describe('healthCheck', () => {
      it('should perform health check successfully', async () => {
        mockRedisCache.healthCheck.mockResolvedValue(Results.ok(true));

        const result = await service.healthCheck();

        expect(mockRedisCache.healthCheck).toHaveBeenCalled();
        expect(result.isOk).toBe(true);
        expect(result.returnValue).toBe(true);
      });

      it('should handle exceptions gracefully', async () => {
        mockRedisCache.healthCheck.mockRejectedValue(new Error('Connection error'));

        const result = await service.healthCheck();

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Cache health check failed',
          fullMessage: 'Connection error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Cache health check failed');
      });
    });

    describe('flushAll', () => {
      it('should flush all caches successfully', async () => {
        mockRedisCache.flushAll.mockResolvedValue(Results.ok(undefined));
        mockSessionCache.flushAllCaches.mockResolvedValue(Results.ok(undefined));

        const result = await service.flushAll();

        expect(mockRedisCache.flushAll).toHaveBeenCalled();
        expect(mockSessionCache.flushAllCaches).toHaveBeenCalled();
        expect(result.isOk).toBe(true);
      });

      it('should handle partial failures with warning', async () => {
        mockRedisCache.flushAll.mockRejectedValue(new Error('Redis error'));
        mockSessionCache.flushAllCaches.mockResolvedValue(Results.ok(undefined));

        const result = await service.flushAll();

        expect(mockLogger.warning).toHaveBeenCalledWith({
          message: 'Some cache flush operations failed',
          fullMessage: JSON.stringify({ failures: 1 }),
        });
        expect(result.isOk).toBe(true);
      });

      it('should handle exceptions gracefully', async () => {
        mockRedisCache.flushAll.mockImplementation(() => {
          throw new Error('Flush error');
        });

        const result = await service.flushAll();

        expect(mockLogger.error).toHaveBeenCalledWith({
          message: 'Failed to flush all caches',
          fullMessage: 'Flush error',
        });
        expect(result.isOk).toBe(false);
        expect(result.message).toBe('Failed to flush all caches');
      });
    });
  });

  describe('Cache Warming', () => {
    it('should warm cache successfully', async () => {
      mockInvalidationService.warmCache.mockResolvedValue(Results.ok(undefined));

      const result = await service.warmCache('tenant-1', 'user-1');

      expect(mockInvalidationService.warmCache).toHaveBeenCalledWith('tenant-1', 'user-1');
      expect(result.isOk).toBe(true);
    });

    it('should handle exceptions gracefully', async () => {
      mockInvalidationService.warmCache.mockRejectedValue(new Error('Warm cache error'));

      const result = await service.warmCache('tenant-1', 'user-1');

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Failed to warm cache',
        fullMessage: 'Warm cache error',
      });
      expect(result.isOk).toBe(false);
      expect(result.message).toBe('Failed to warm cache');
    });
  });

  describe('Performance Monitoring', () => {
    it('should start performance timer', () => {
      mockRedisCache.startPerformanceTimer.mockReturnValue('timer-123');

      const timerId = service.startPerformanceTimer('test-operation');

      expect(mockRedisCache.startPerformanceTimer).toHaveBeenCalledWith('test-operation');
      expect(timerId).toBe('timer-123');
    });

    it('should end performance timer', () => {
      mockRedisCache.endPerformanceTimer.mockReturnValue(150);

      const duration = service.endPerformanceTimer('timer-123');

      expect(mockRedisCache.endPerformanceTimer).toHaveBeenCalledWith('timer-123');
      expect(duration).toBe(150);
    });
  });

  describe('Performance benchmarks', () => {
    it('should complete cache operations within acceptable time limits', async () => {
      const startTime = Date.now();

      mockRedisCache.setSession.mockResolvedValue(Results.ok(true));
      mockRedisCache.getSession.mockResolvedValue(Results.ok(mockUserSession));
      mockRedisCache.deleteSession.mockResolvedValue(Results.ok(true));
      mockRedisCache.setUserPermissions.mockResolvedValue(Results.ok(true));
      mockRedisCache.getUserPermissions.mockResolvedValue(Results.ok(mockPermissions));

      // Test multiple operations
      await Promise.all([
        service.setSession('session-1', mockUserSession, 3600),
        service.getSession('session-1'),
        service.deleteSession('session-1'),
        service.setUserPermissions('user-1', mockPermissions, 3600),
        service.getUserPermissions('user-1'),
      ]);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Cache operations should complete quickly (under 100ms for this test)
      expect(executionTime).toBeLessThan(100);
    });
  });

  describe('Error handling patterns', () => {
    it('should provide consistent error handling across all methods', async () => {
      mockRedisCache.setSession.mockRejectedValue(new Error('Connection timeout'));

      const result = await service.setSession('session-1', mockUserSession, 3600);

      expect(result.isOk).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to set session in cache',
          fullMessage: 'Connection timeout',
        })
      );
    });

    it('should handle null and undefined inputs gracefully', async () => {
      mockRedisCache.getSession.mockResolvedValue(Results.ok(null));

      const result1 = await service.getSession(null as any);
      const result2 = await service.getSession(undefined as any);

      expect(result1.isOk).toBe(true);
      expect(result1.returnValue).toBeNull();
      expect(result2.isOk).toBe(true);
      expect(result2.returnValue).toBeNull();
    });

    it('should maintain data integrity during fallback scenarios', async () => {
      // Test that fallback to session cache maintains data consistency
      mockRedisCache.setSession.mockResolvedValue(Results.error(null, 'Redis unavailable'));
      mockSessionCache.setSession.mockResolvedValue(Results.ok(true));

      const setResult = await service.setSession('session-1', mockUserSession, 3600);

      expect(setResult.isOk).toBe(true);
      expect(mockSessionCache.setSession).toHaveBeenCalledWith('session-1', mockUserSession, 3600);
    });
  });
});