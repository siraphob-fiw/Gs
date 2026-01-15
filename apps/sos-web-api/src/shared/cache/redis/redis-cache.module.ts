import {
  Module,
  Global,
  DynamicModule,
  Provider,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  RedisCacheService,
  ICacheConfig,
  IRedisCacheService,
  ICacheMetrics,
} from '@strengthos/shared-cache';
import { ILogger } from '@strengthos/shared-logging';
import { Results } from '@strengthos/shared-utils';
import { UserSession, Permission } from '@strengthos/shared-types';

export interface RedisModuleOptions {
  isGlobal?: boolean;
  useFactory?: (...args: any[]) => Promise<ICacheConfig> | ICacheConfig;
  inject?: any[];
}

/**
 * NestJS Redis Cache Module
 * Provides Redis caching capabilities using the shared-cache library
 */
@Global()
@Module({})
export class RedisCacheModule implements OnModuleDestroy {
  private static redisCacheService: RedisCacheService | null = null;
  private readonly logger = new Logger('RedisCacheModule');

  static forRoot(options?: RedisModuleOptions): DynamicModule {
    const redisCacheServiceProvider: Provider = {
      provide: 'IRedisCacheService',
      useFactory: async (
        configService: ConfigService,
        logger: ILogger,
      ): Promise<IRedisCacheService> => {
        const isEnabled = configService.get<boolean>('REDIS_ENABLED', true);

        if (!isEnabled) {
          Logger.warn(
            'Redis is disabled. Using in-memory fallback.',
            'RedisCacheModule',
          );
          // Return a mock/fallback implementation if Redis is disabled
          return RedisCacheModule.createFallbackService(logger);
        }

        const config: ICacheConfig = {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD', ''),
          db: configService.get<number>('REDIS_DB', 0),
          timeout: configService.get<number>('REDIS_TIMEOUT', 5000),
          pool: {
            min: configService.get<number>('REDIS_POOL_MIN', 1),
            max: configService.get<number>('REDIS_POOL_MAX', 10),
          },
          keyPrefix: configService.get<string>(
            'REDIS_KEY_PREFIX',
            'strengthos:',
          ),
          defaultTTL: configService.get<number>('REDIS_TTL', 600),
          maxRetries: 3,
          retryDelayOnFailover: 100,
          enableReadyCheck: true,
          lazyConnect: false, // Connect immediately to catch errors early
        };

        Logger.log(
          `Connecting to Redis at ${config.host}:${config.port}`,
          'RedisCacheModule',
        );

        try {
          RedisCacheModule.redisCacheService = new RedisCacheService(
            logger,
            config,
          );

          // Validate connection
          const healthResult =
            await RedisCacheModule.redisCacheService.healthCheck();
          if (healthResult.isOk && healthResult.returnValue) {
            Logger.log(
              'Redis connection established successfully',
              'RedisCacheModule',
            );
          } else {
            Logger.warn(
              'Redis health check failed, but service is initialized',
              'RedisCacheModule',
            );
          }

          return RedisCacheModule.redisCacheService;
        } catch (error) {
          Logger.error(
            `Failed to initialize Redis: ${(error as Error).message}`,
            'RedisCacheModule',
          );
          // Return fallback on error
          return RedisCacheModule.createFallbackService(logger);
        }
      },
      inject: [ConfigService, 'ILogger'],
    };

    return {
      module: RedisCacheModule,
      imports: [ConfigModule],
      providers: [redisCacheServiceProvider],
      exports: ['IRedisCacheService'],
      global: options?.isGlobal ?? true,
    };
  }

  static forRootAsync(options: RedisModuleOptions): DynamicModule {
    const redisCacheServiceProvider: Provider = {
      provide: 'IRedisCacheService',
      useFactory: async (
        logger: ILogger,
        ...args: any[]
      ): Promise<IRedisCacheService> => {
        if (options.useFactory) {
          const config = await options.useFactory(...args);
          try {
            RedisCacheModule.redisCacheService = new RedisCacheService(
              logger,
              config,
            );
            return RedisCacheModule.redisCacheService;
          } catch (error) {
            Logger.error(
              `Failed to initialize Redis: ${(error as Error).message}`,
              'RedisCacheModule',
            );
            return RedisCacheModule.createFallbackService(logger);
          }
        }
        throw new Error('useFactory is required for forRootAsync');
      },
      inject: ['ILogger', ...(options.inject || [])],
    };

    return {
      module: RedisCacheModule,
      imports: [ConfigModule],
      providers: [redisCacheServiceProvider],
      exports: ['IRedisCacheService'],
      global: options?.isGlobal ?? true,
    };
  }

  private static createFallbackService(_logger: ILogger): IRedisCacheService {
    // In-memory fallback when Redis is unavailable
    const cache = new Map<string, { value: any; expiry: number }>();
    const userSessions = new Map<string, Set<string>>();

    const get = <T>(key: string): T | null => {
      const item = cache.get(key);
      if (!item) return null;
      if (Date.now() > item.expiry) {
        cache.delete(key);
        return null;
      }
      return item.value as T;
    };

    const set = (
      key: string,
      value: any,
      ttlSeconds: number = 600,
    ): boolean => {
      cache.set(key, {
        value,
        expiry: Date.now() + ttlSeconds * 1000,
      });
      return true;
    };

    const del = (key: string): boolean => {
      return cache.delete(key);
    };

    return {
      // Session Management
      setSession: async (
        sessionId: string,
        session: UserSession,
        ttlSeconds: number = 1800,
      ): Promise<Results<boolean>> => {
        set(`session:${sessionId}`, session, ttlSeconds);
        // Track user sessions
        if (!userSessions.has(session.userId)) {
          userSessions.set(session.userId, new Set());
        }
        userSessions.get(session.userId)!.add(sessionId);
        return Results.ok(true);
      },
      getSession: async (
        sessionId: string,
      ): Promise<Results<UserSession | null>> => {
        const session = get<UserSession>(`session:${sessionId}`);
        return Results.ok(session);
      },
      deleteSession: async (sessionId: string): Promise<Results<boolean>> => {
        del(`session:${sessionId}`);
        return Results.ok(true);
      },
      deleteUserSessions: async (
        _userId: string,
      ): Promise<Results<boolean>> => {
        const sessions = userSessions.get(_userId);
        if (sessions) {
          for (const sessionId of sessions) {
            del(`session:${sessionId}`);
          }
          userSessions.delete(_userId);
        }
        return Results.ok(true);
      },

      // Permission Management
      setUserPermissions: async (
        userId: string,
        permissions: Permission[],
        ttlSeconds: number = 900,
      ): Promise<Results<boolean>> => {
        set(`permissions:${userId}`, permissions, ttlSeconds);
        return Results.ok(true);
      },
      getUserPermissions: async (
        userId: string,
      ): Promise<Results<Permission[] | null>> => {
        const permissions = get<Permission[]>(`permissions:${userId}`);
        return Results.ok(permissions);
      },
      deleteUserPermissions: async (
        userId: string,
      ): Promise<Results<boolean>> => {
        del(`permissions:${userId}`);
        return Results.ok(true);
      },

      // Tenant Context Management
      setTenantContext: async (
        userId: string,
        tenantId: string,
        ttlSeconds: number = 3600,
      ): Promise<Results<boolean>> => {
        set(`tenant_context:${userId}`, tenantId, ttlSeconds);
        return Results.ok(true);
      },
      getTenantContext: async (
        userId: string,
      ): Promise<Results<string | null>> => {
        const tenantId = get<string>(`tenant_context:${userId}`);
        return Results.ok(tenantId);
      },
      deleteTenantContext: async (
        userId: string,
      ): Promise<Results<boolean>> => {
        del(`tenant_context:${userId}`);
        return Results.ok(true);
      },

      // Tenant-Aware Caching
      setTenantData: async <T>(
        tenantId: string,
        key: string,
        data: T,
        ttlSeconds: number = 600,
      ): Promise<Results<boolean>> => {
        set(`tenant:${tenantId}:${key}`, data, ttlSeconds);
        return Results.ok(true);
      },
      getTenantData: async <T>(
        tenantId: string,
        key: string,
      ): Promise<Results<T | null>> => {
        const data = get<T>(`tenant:${tenantId}:${key}`);
        return Results.ok(data);
      },
      deleteTenantData: async (
        tenantId: string,
        key: string,
      ): Promise<Results<boolean>> => {
        del(`tenant:${tenantId}:${key}`);
        return Results.ok(true);
      },
      invalidateTenantCache: async (
        tenantId: string,
      ): Promise<Results<number>> => {
        let count = 0;
        for (const key of cache.keys()) {
          if (key.startsWith(`tenant:${tenantId}:`)) {
            cache.delete(key);
            count++;
          }
        }
        return Results.ok(count);
      },

      // Generic Cache Operations
      get: async <T>(key: string): Promise<T | null> => get<T>(key),
      set: async (
        key: string,
        value: any,
        ttlSeconds?: number,
      ): Promise<boolean> => set(key, value, ttlSeconds ?? 600),
      delete: async (key: string): Promise<boolean> => del(key),
      deleteByPattern: async (pattern: string): Promise<number> => {
        // In-memory pattern deletion
        let count = 0;
        const regex = new RegExp(
          '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$',
        );
        for (const key of cache.keys()) {
          if (regex.test(key)) {
            cache.delete(key);
            count++;
          }
        }
        return count;
      },

      // Cache Management
      flushAll: async (): Promise<Results<void>> => {
        cache.clear();
        userSessions.clear();
        return Results.ok(undefined);
      },
      flushTenant: async (tenantId: string): Promise<Results<number>> => {
        let count = 0;
        for (const key of cache.keys()) {
          if (key.startsWith(`tenant:${tenantId}:`)) {
            cache.delete(key);
            count++;
          }
        }
        return Results.ok(count);
      },
      getMetrics: async (): Promise<Results<ICacheMetrics>> => {
        return Results.ok({
          hits: 0,
          misses: 0,
          sets: 0,
          deletes: 0,
          errors: 0,
          totalKeys: cache.size,
          memoryUsage: 0,
          avgResponseTime: 0,
        });
      },
      healthCheck: async (): Promise<Results<boolean>> => Results.ok(true),
      validateConnection: async (): Promise<
        Results<{ isConnected: boolean; info: any }>
      > =>
        Results.ok({ isConnected: true, info: { mode: 'in-memory-fallback' } }),
      disconnect: async (): Promise<Results<void>> => Results.ok(undefined),

      // Performance Monitoring
      startPerformanceTimer: (operation: string): string =>
        `timer_${Date.now()}_${operation}`,
      endPerformanceTimer: (_timerId: string): number => 0,
    } as IRedisCacheService;
  }

  async onModuleDestroy() {
    if (RedisCacheModule.redisCacheService) {
      this.logger.log('Disconnecting from Redis...');
      await RedisCacheModule.redisCacheService.disconnect();
      RedisCacheModule.redisCacheService = null;
      this.logger.log('Redis connection closed');
    }
  }
}
