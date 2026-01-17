// Redis cache service migrated from human-lift-training-api/src/Services/Caches/RedisCacheService.ts
import Redis from 'ioredis';
import { Results } from '@strengthos/shared-utils';
import { ILogger } from '@strengthos/shared-logging';
import { UserSession, Permission } from '@strengthos/shared-types';
import {
  ConnectionConfigFactory,
  RedisConnectionConfig,
  ConfigurationError,
  ConnectionError
} from '@strengthos/shared-validation';

export interface ICacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  totalKeys: number;
  memoryUsage: number;
  avgResponseTime: number;
}

export interface ICacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  timeout: number;
  pool: {
    min: number;
    max: number;
  };
  keyPrefix?: string;
  defaultTTL?: number;
  maxRetries?: number;
  retryDelayOnFailover?: number;
  enableReadyCheck?: boolean;
  lazyConnect?: boolean;
}

export interface IRedisCacheService {
  // Session Management
  setSession(sessionId: string, session: UserSession, ttlSeconds?: number): Promise<Results<boolean>>;
  getSession(sessionId: string): Promise<Results<UserSession | null>>;
  deleteSession(sessionId: string): Promise<Results<boolean>>;
  deleteUserSessions(userId: string): Promise<Results<boolean>>;

  // Permission Management
  setUserPermissions(userId: string, permissions: Permission[], ttlSeconds?: number): Promise<Results<boolean>>;
  getUserPermissions(userId: string): Promise<Results<Permission[] | null>>;
  deleteUserPermissions(userId: string): Promise<Results<boolean>>;

  // Tenant Context Management
  setTenantContext(userId: string, tenantId: string, ttlSeconds?: number): Promise<Results<boolean>>;
  getTenantContext(userId: string): Promise<Results<string | null>>;
  deleteTenantContext(userId: string): Promise<Results<boolean>>;

  // Tenant-Aware Caching
  setTenantData<T>(tenantId: string, key: string, data: T, ttlSeconds?: number): Promise<Results<boolean>>;
  getTenantData<T>(tenantId: string, key: string): Promise<Results<T | null>>;
  deleteTenantData(tenantId: string, key: string): Promise<Results<boolean>>;
  invalidateTenantCache(tenantId: string): Promise<Results<number>>;

  // Generic Cache Operations
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  deleteByPattern(pattern: string): Promise<number>;

  // Cache Management
  flushAll(): Promise<Results<void>>;
  flushTenant(tenantId: string): Promise<Results<number>>;
  getMetrics(): Promise<Results<ICacheMetrics>>;
  healthCheck(): Promise<Results<boolean>>;

  // Enhanced Connection Management
  validateConnection(): Promise<Results<{ isConnected: boolean; info: any }>>;
  disconnect(): Promise<Results<void>>;

  // Performance Monitoring
  startPerformanceTimer(operation: string): string;
  endPerformanceTimer(timerId: string): number;
}

export class RedisCacheService implements IRedisCacheService {
  private redis!: Redis;
  private performanceTimers: Map<string, number> = new Map();
  private metrics: ICacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    totalKeys: 0,
    memoryUsage: 0,
    avgResponseTime: 0
  };

  constructor(
    private readonly logger: ILogger,
    private readonly config: ICacheConfig,
  ) {
    this.validateConfiguration();
    this.initializeRedis();
  }

  /**
   * Creates a RedisCacheService instance using standardized configuration from environment variables
   */
  static createFromEnvironment(logger: ILogger): RedisCacheService {
    const configResult = ConnectionConfigFactory.createRedisConfig();

    if (!configResult.isValid) {
      const errorMessages = configResult.errors?.map(e => e.message).join(', ') || 'Unknown validation error';
      throw new Error(`Redis configuration validation failed: ${errorMessages}`);
    }

    const standardizedConfig = configResult.data!;

    // Convert standardized config to ICacheConfig
    const cacheConfig: ICacheConfig = {
      host: standardizedConfig.host,
      port: standardizedConfig.port,
      password: standardizedConfig.password,
      db: standardizedConfig.db,
      timeout: standardizedConfig.timeout,
      pool: standardizedConfig.pool,
      // Use defaults for legacy properties
      keyPrefix: 'strengthos:',
      defaultTTL: 600,
      maxRetries: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true
    };

    return new RedisCacheService(logger, cacheConfig);
  }

  /**
   * Validates the Redis configuration before initialization
   */
  private validateConfiguration(): void {
    if (!this.config.host) {
      throw new ConfigurationError('host', this.config.host, 'Redis host is required');
    }

    if (!this.config.port || this.config.port < 1 || this.config.port > 65535) {
      throw new ConfigurationError('port', this.config.port, 'Redis port must be between 1 and 65535');
    }

    if (this.config.db !== undefined && (this.config.db < 0 || this.config.db > 15)) {
      throw new ConfigurationError('db', this.config.db, 'Redis database must be between 0 and 15');
    }

    if (this.config.timeout && (this.config.timeout < 1000 || this.config.timeout > 60000)) {
      throw new ConfigurationError('timeout', this.config.timeout, 'Redis timeout must be between 1000ms and 60000ms');
    }

    if (this.config.pool) {
      if (this.config.pool.min < 0 || this.config.pool.min > 20) {
        throw new ConfigurationError('pool.min', this.config.pool.min, 'Redis pool minimum must be between 0 and 20');
      }
      if (this.config.pool.max < 1 || this.config.pool.max > 50) {
        throw new ConfigurationError('pool.max', this.config.pool.max, 'Redis pool maximum must be between 1 and 50');
      }
      if (this.config.pool.min >= this.config.pool.max) {
        throw new ConfigurationError('pool', this.config.pool, 'Redis pool minimum must be less than maximum');
      }
    }

    // Log successful configuration validation (without sensitive data)
    this.logger.info({
      message: 'Redis configuration validated successfully',
      fullMessage: JSON.stringify({
        host: this.config.host,
        port: this.config.port,
        db: this.config.db,
        timeout: this.config.timeout,
        pool: this.config.pool,
        hasPassword: !!this.config.password,
        timestamp: new Date().toISOString()
      })
    });
  }

  /**
   * Sanitizes error messages to prevent credential exposure
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove potential passwords from error messages
    let sanitized = message;

    // Remove password from connection strings
    sanitized = sanitized.replace(/(:\/\/[^:]*:)[^@]*(@)/g, '$1***$2');

    // Remove auth tokens
    sanitized = sanitized.replace(/auth\s+[^\s]+/gi, 'auth ***');

    // Remove password parameters
    sanitized = sanitized.replace(/password[=:]\s*[^\s&]+/gi, 'password=***');

    return sanitized;
  }

  private initializeRedis(): void {
    this.redis = new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.db,
      keyPrefix: this.config.keyPrefix || 'strengthos:',
      maxRetriesPerRequest: this.config.maxRetries || 3,
      enableReadyCheck: this.config.enableReadyCheck ?? true,
      lazyConnect: this.config.lazyConnect ?? true,
      connectTimeout: this.config.timeout || 5000,
      commandTimeout: this.config.timeout || 5000,
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      this.logger.info({
        message: 'Redis cache connected successfully',
        fullMessage: JSON.stringify({
          host: this.config.host,
          port: this.config.port,
          db: this.config.db,
          timestamp: new Date().toISOString()
        })
      });
    });

    this.redis.on('ready', () => {
      this.logger.info({
        message: 'Redis cache ready for operations',
        fullMessage: JSON.stringify({
          host: this.config.host,
          port: this.config.port,
          db: this.config.db,
          timestamp: new Date().toISOString()
        })
      });
    });

    this.redis.on('error', (error) => {
      this.metrics.errors++;

      // Create standardized connection error
      const connectionError = new ConnectionError('redis', error);

      // Log error without exposing sensitive information
      this.logger.error({
        message: 'Redis cache connection error',
        fullMessage: JSON.stringify({
          errorType: connectionError.name,
          errorMessage: this.sanitizeErrorMessage(error.message),
          host: this.config.host,
          port: this.config.port,
          db: this.config.db,
          timestamp: new Date().toISOString(),
          // Include error code if available for troubleshooting
          errorCode: (error as any).code || 'UNKNOWN'
        })
      });
    });

    this.redis.on('close', () => {
      this.logger.warning({
        message: 'Redis cache connection closed',
        fullMessage: JSON.stringify({
          host: this.config.host,
          port: this.config.port,
          db: this.config.db,
          timestamp: new Date().toISOString()
        })
      });
    });

    this.redis.on('reconnecting', (delay: number) => {
      this.logger.info({
        message: 'Redis cache reconnecting...',
        fullMessage: JSON.stringify({
          host: this.config.host,
          port: this.config.port,
          db: this.config.db,
          reconnectDelay: delay,
          timestamp: new Date().toISOString()
        })
      });
    });

    this.redis.on('end', () => {
      this.logger.warning({
        message: 'Redis cache connection ended',
        fullMessage: JSON.stringify({
          host: this.config.host,
          port: this.config.port,
          db: this.config.db,
          timestamp: new Date().toISOString()
        })
      });
    });
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  async setSession(sessionId: string, session: UserSession, ttlSeconds: number = 1800): Promise<Results<boolean>> {
    const timerId = this.startPerformanceTimer('setSession');
    try {
      const key = this.getSessionKey(sessionId);
      const serializedSession = JSON.stringify(session);

      const result = await this.redis.setex(key, ttlSeconds, serializedSession);

      if (result === 'OK') {
        // Maintain user-to-sessions mapping
        const userSessionsKey = this.getUserSessionsKey(session.userId);
        await this.redis.sadd(userSessionsKey, sessionId);
        await this.redis.expire(userSessionsKey, ttlSeconds);

        this.metrics.sets++;
        return Results.ok(true);
      }

      return Results.ok(false);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to set session in Redis cache', fullMessage: (error as Error).message });
      return Results.fail<boolean>(null, 'Failed to set session in cache');
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  async getSession(sessionId: string): Promise<Results<UserSession | null>> {
    const timerId = this.startPerformanceTimer('getSession');
    try {
      const key = this.getSessionKey(sessionId);
      const serializedSession = await this.redis.get(key);

      if (serializedSession) {
        this.metrics.hits++;
        const session = JSON.parse(serializedSession) as UserSession;
        return Results.ok(session);
      }

      this.metrics.misses++;
      return Results.ok(null);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to get session from Redis cache', fullMessage: (error as Error).message });
      return Results.fail<UserSession | null>(null, 'Failed to get session from cache');
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  async deleteSession(sessionId: string): Promise<Results<boolean>> {
    const timerId = this.startPerformanceTimer('deleteSession');
    try {
      // Get session to find user ID for cleanup
      const sessionResult = await this.getSession(sessionId);

      const key = this.getSessionKey(sessionId);
      const result = await this.redis.del(key);

      if (sessionResult.isOk && sessionResult.returnValue) {
        const userSessionsKey = this.getUserSessionsKey(sessionResult.returnValue.userId);
        await this.redis.srem(userSessionsKey, sessionId);
      }

      this.metrics.deletes++;
      return Results.ok(result > 0);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to delete session from Redis cache', fullMessage: (error as Error).message });
      return Results.fail<boolean>(null, 'Failed to delete session from cache');
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  async deleteUserSessions(userId: string): Promise<Results<boolean>> {
    const timerId = this.startPerformanceTimer('deleteUserSessions');
    try {
      const userSessionsKey = this.getUserSessionsKey(userId);
      const sessionIds = await this.redis.smembers(userSessionsKey);

      if (sessionIds.length > 0) {
        const sessionKeys = sessionIds.map(id => this.getSessionKey(id));
        await this.redis.del(...sessionKeys);
        await this.redis.del(userSessionsKey);
      }

      this.metrics.deletes += sessionIds.length + 1;
      return Results.ok(true);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to delete user sessions from Redis cache', fullMessage: (error as Error).message });
      return Results.fail<boolean>(null, 'Failed to delete user sessions from cache');
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  // ============================================================================
  // PERMISSION MANAGEMENT
  // ============================================================================

  async setUserPermissions(userId: string, permissions: Permission[], ttlSeconds: number = 900): Promise<Results<boolean>> {
    const timerId = this.startPerformanceTimer('setUserPermissions');
    try {
      const key = this.getPermissionKey(userId);
      const serializedPermissions = JSON.stringify(permissions);

      const result = await this.redis.setex(key, ttlSeconds, serializedPermissions);
      this.metrics.sets++;
      return Results.ok(result === 'OK');
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to set user permissions in Redis cache', fullMessage: (error as Error).message });
      return Results.fail<boolean>(null, 'Failed to set user permissions in cache');
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  async getUserPermissions(userId: string): Promise<Results<Permission[] | null>> {
    const timerId = this.startPerformanceTimer('getUserPermissions');
    try {
      const key = this.getPermissionKey(userId);
      const serializedPermissions = await this.redis.get(key);

      if (serializedPermissions) {
        this.metrics.hits++;
        const permissions = JSON.parse(serializedPermissions) as Permission[];
        return Results.ok(permissions);
      }

      this.metrics.misses++;
      return Results.ok(null);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to get user permissions from Redis cache', fullMessage: (error as Error).message });
      return Results.fail<Permission[] | null>(null, 'Failed to get user permissions from cache');
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  async deleteUserPermissions(userId: string): Promise<Results<boolean>> {
    const timerId = this.startPerformanceTimer('deleteUserPermissions');
    try {
      const key = this.getPermissionKey(userId);
      const result = await this.redis.del(key);
      this.metrics.deletes++;
      return Results.ok(result > 0);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to delete user permissions from Redis cache', fullMessage: (error as Error).message });
      return Results.fail<boolean>(null, 'Failed to delete user permissions from cache');
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  // ============================================================================
  // TENANT CONTEXT MANAGEMENT
  // ============================================================================

  async setTenantContext(userId: string, tenantId: string, ttlSeconds: number = 3600): Promise<Results<boolean>> {
    const timerId = this.startPerformanceTimer('setTenantContext');
    try {
      const key = this.getTenantContextKey(userId);
      const result = await this.redis.setex(key, ttlSeconds, tenantId);
      this.metrics.sets++;
      return Results.ok(result === 'OK');
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to set tenant context in Redis cache', fullMessage: (error as Error).message });
      return Results.fail<boolean>(null, 'Failed to set tenant context in cache');
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  async getTenantContext(userId: string): Promise<Results<string | null>> {
    const timerId = this.startPerformanceTimer('getTenantContext');
    try {
      const key = this.getTenantContextKey(userId);
      const tenantId = await this.redis.get(key);

      if (tenantId) {
        this.metrics.hits++;
        return Results.ok(tenantId);
      }

      this.metrics.misses++;
      return Results.ok(null);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to get tenant context from Redis cache', fullMessage: (error as Error).message });
      return Results.fail<string | null>(null, 'Failed to get tenant context from cache');
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  async deleteTenantContext(userId: string): Promise<Results<boolean>> {
    const timerId = this.startPerformanceTimer('deleteTenantContext');
    try {
      const key = this.getTenantContextKey(userId);
      const result = await this.redis.del(key);
      this.metrics.deletes++;
      return Results.ok(result > 0);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to delete tenant context from Redis cache', fullMessage: (error as Error).message });
      return Results.fail<boolean>(null, 'Failed to delete tenant context from cache');
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  // ============================================================================
  // TENANT-AWARE CACHING
  // ============================================================================

  async setTenantData<T>(tenantId: string, key: string, data: T, ttlSeconds: number = 600): Promise<Results<boolean>> {
    const timerId = this.startPerformanceTimer('setTenantData');
    try {
      const tenantKey = this.getTenantDataKey(tenantId, key);
      const serializedData = JSON.stringify(data);

      const result = await this.redis.setex(tenantKey, ttlSeconds, serializedData);

      // Track tenant keys for invalidation
      const tenantKeysSet = this.getTenantKeysSet(tenantId);
      await this.redis.sadd(tenantKeysSet, key);
      await this.redis.expire(tenantKeysSet, ttlSeconds + 300); // Keep set longer than data

      this.metrics.sets++;
      return Results.ok(result === 'OK');
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to set tenant data in Redis cache', fullMessage: (error as Error).message });
      return Results.fail<boolean>(null, 'Failed to set tenant data in cache');
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  async getTenantData<T>(tenantId: string, key: string): Promise<Results<T | null>> {
    const timerId = this.startPerformanceTimer('getTenantData');
    try {
      const tenantKey = this.getTenantDataKey(tenantId, key);
      const serializedData = await this.redis.get(tenantKey);

      if (serializedData) {
        this.metrics.hits++;
        const data = JSON.parse(serializedData) as T;
        return Results.ok(data);
      }

      this.metrics.misses++;
      return Results.ok(null);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to get tenant data from Redis cache', fullMessage: (error as Error).message });
      return Results.fail<T | null>(null, 'Failed to get tenant data from cache');
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  async deleteTenantData(tenantId: string, key: string): Promise<Results<boolean>> {
    const timerId = this.startPerformanceTimer('deleteTenantData');
    try {
      const tenantKey = this.getTenantDataKey(tenantId, key);
      const result = await this.redis.del(tenantKey);

      // Remove from tenant keys set
      const tenantKeysSet = this.getTenantKeysSet(tenantId);
      await this.redis.srem(tenantKeysSet, key);

      this.metrics.deletes++;
      return Results.ok(result > 0);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to delete tenant data from Redis cache', fullMessage: (error as Error).message });
      return Results.fail<boolean>(null, 'Failed to delete tenant data from cache');
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  async invalidateTenantCache(tenantId: string): Promise<Results<number>> {
    const timerId = this.startPerformanceTimer('invalidateTenantCache');
    try {
      const tenantKeysSet = this.getTenantKeysSet(tenantId);
      const keys = await this.redis.smembers(tenantKeysSet);

      if (keys.length > 0) {
        const tenantKeys = keys.map(key => this.getTenantDataKey(tenantId, key));
        const deletedCount = await this.redis.del(...tenantKeys);
        await this.redis.del(tenantKeysSet);

        this.metrics.deletes += deletedCount + 1;
        return Results.ok(deletedCount);
      }

      return Results.ok(0);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to invalidate tenant cache', fullMessage: (error as Error).message });
      return Results.fail<number>(null, 'Failed to invalidate tenant cache');
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  async flushAll(): Promise<Results<void>> {
    const timerId = this.startPerformanceTimer('flushAll');
    try {
      await this.redis.flushdb();
      this.resetMetrics();
      this.logger.info({ message: 'Redis cache flushed successfully' });
      return Results.ok(undefined);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to flush Redis cache', fullMessage: (error as Error).message });
      return Results.fail<void>(null, 'Failed to flush Redis cache');
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  async flushTenant(tenantId: string): Promise<Results<number>> {
    return this.invalidateTenantCache(tenantId);
  }

  async getMetrics(): Promise<Results<ICacheMetrics>> {
    try {
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      if (memoryMatch) {
        this.metrics.memoryUsage = parseInt(memoryMatch[1]);
      }

      const dbSize = await this.redis.dbsize();
      this.metrics.totalKeys = dbSize;

      return Results.ok({ ...this.metrics });
    } catch (error) {
      this.logger.error({ message: 'Failed to get cache metrics', fullMessage: (error as Error).message });
      return Results.fail<ICacheMetrics>(null, 'Failed to get cache metrics');
    }
  }

  async healthCheck(): Promise<Results<boolean>> {
    const timerId = this.startPerformanceTimer('healthCheck');
    try {
      const result = await this.redis.ping();
      const isHealthy = result === 'PONG';

      if (isHealthy) {
        this.logger.info({
          message: 'Redis health check passed',
          fullMessage: JSON.stringify({
            host: this.config.host,
            port: this.config.port,
            db: this.config.db,
            responseTime: this.endPerformanceTimer(timerId),
            timestamp: new Date().toISOString()
          })
        });
      } else {
        this.logger.warning({
          message: 'Redis health check failed - unexpected response',
          fullMessage: JSON.stringify({
            host: this.config.host,
            port: this.config.port,
            db: this.config.db,
            response: result,
            timestamp: new Date().toISOString()
          })
        });
      }

      return Results.ok(isHealthy);
    } catch (error) {
      this.metrics.errors++;
      const connectionError = new ConnectionError('redis', error as Error);

      this.logger.error({
        message: 'Redis health check failed',
        fullMessage: JSON.stringify({
          host: this.config.host,
          port: this.config.port,
          db: this.config.db,
          errorType: connectionError.name,
          errorMessage: this.sanitizeErrorMessage((error as Error).message),
          timestamp: new Date().toISOString()
        })
      });

      return Results.fail<boolean>(null, 'Redis health check failed');
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  /**
   * Enhanced connection validation with detailed diagnostics
   */
  async validateConnection(): Promise<Results<{ isConnected: boolean; info: any }>> {
    const timerId = this.startPerformanceTimer('validateConnection');
    try {
      // Test basic connectivity
      const pingResult = await this.redis.ping();
      if (pingResult !== 'PONG') {
        return Results.fail<{ isConnected: boolean; info: any }>({ isConnected: false, info: null }, 'Redis ping test failed');
      }

      // Get server info for diagnostics
      const info = await this.redis.info('server');
      const serverInfo = this.parseRedisInfo(info);

      // Test basic operations
      const testKey = `${this.config.keyPrefix || 'strengthos:'}health_check_${Date.now()}`;
      await this.redis.set(testKey, 'test', 'EX', 10);
      const testValue = await this.redis.get(testKey);
      await this.redis.del(testKey);

      if (testValue !== 'test') {
        return Results.fail<{ isConnected: boolean; info: any }>({ isConnected: false, info: null }, 'Redis read/write test failed');
      }

      this.logger.info({
        message: 'Redis connection validation successful',
        fullMessage: JSON.stringify({
          host: this.config.host,
          port: this.config.port,
          db: this.config.db,
          serverVersion: serverInfo.redis_version,
          responseTime: this.endPerformanceTimer(timerId),
          timestamp: new Date().toISOString()
        })
      });

      return Results.ok({
        isConnected: true,
        info: {
          serverVersion: serverInfo.redis_version,
          uptime: serverInfo.uptime_in_seconds,
          connectedClients: serverInfo.connected_clients
        }
      });
    } catch (error) {
      this.metrics.errors++;
      const connectionError = new ConnectionError('redis', error as Error);

      this.logger.error({
        message: 'Redis connection validation failed',
        fullMessage: JSON.stringify({
          host: this.config.host,
          port: this.config.port,
          db: this.config.db,
          errorType: connectionError.name,
          errorMessage: this.sanitizeErrorMessage((error as Error).message),
          timestamp: new Date().toISOString()
        })
      });

      return Results.fail<{ isConnected: boolean; info: any }>({ isConnected: false, info: null }, `Redis connection validation failed: ${this.sanitizeErrorMessage((error as Error).message)}`);
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  /**
   * Graceful connection cleanup with proper error handling
   */
  async disconnect(): Promise<Results<void>> {
    try {
      if (this.redis.status === 'ready' || this.redis.status === 'connecting') {
        this.logger.info({
          message: 'Initiating Redis connection cleanup',
          fullMessage: JSON.stringify({
            host: this.config.host,
            port: this.config.port,
            db: this.config.db,
            status: this.redis.status,
            timestamp: new Date().toISOString()
          })
        });

        // Clear performance timers
        this.performanceTimers.clear();

        // Gracefully disconnect
        await this.redis.quit();

        this.logger.info({
          message: 'Redis connection cleanup completed successfully',
          fullMessage: JSON.stringify({
            host: this.config.host,
            port: this.config.port,
            db: this.config.db,
            timestamp: new Date().toISOString()
          })
        });
      }

      return Results.ok(undefined);
    } catch (error) {
      this.logger.error({
        message: 'Error during Redis connection cleanup',
        fullMessage: JSON.stringify({
          host: this.config.host,
          port: this.config.port,
          db: this.config.db,
          errorMessage: this.sanitizeErrorMessage((error as Error).message),
          timestamp: new Date().toISOString()
        })
      });

      // Force disconnect if graceful quit fails
      try {
        this.redis.disconnect();
      } catch (forceError) {
        this.logger.warning({
          message: 'Force disconnect also failed',
          fullMessage: this.sanitizeErrorMessage((forceError as Error).message)
        });
      }

      return Results.fail(null, `Redis cleanup failed: ${this.sanitizeErrorMessage((error as Error).message)}`);
    }
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  startPerformanceTimer(operation: string): string {
    const timerId = `${operation}_${Date.now()}_${Math.random()}`;
    this.performanceTimers.set(timerId, Date.now());
    return timerId;
  }

  endPerformanceTimer(timerId: string): number {
    const startTime = this.performanceTimers.get(timerId);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.performanceTimers.delete(timerId);

      // Update average response time
      this.metrics.avgResponseTime =
        (this.metrics.avgResponseTime + duration) / 2;

      return duration;
    }
    return 0;
  }

  // ============================================================================
  // GENERIC CACHE OPERATIONS
  // ============================================================================

  async get<T>(key: string): Promise<T | null> {
    const timerId = this.startPerformanceTimer('get');
    try {
      const value = await this.redis.get(key);

      if (value) {
        this.metrics.hits++;
        try {
          return JSON.parse(value) as T;
        } catch {
          // If parsing fails, return as string
          return value as unknown as T;
        }
      } else {
        this.metrics.misses++;
        return null;
      }
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to get cache value', key, fullMessage: (error as Error).message });
      return null;
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    const timerId = this.startPerformanceTimer('set');
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);

      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }

      this.metrics.sets++;
      return true;
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to set cache value', key, fullMessage: (error as Error).message });
      return false;
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  async delete(key: string): Promise<boolean> {
    const timerId = this.startPerformanceTimer('delete');
    try {
      const result = await this.redis.del(key);
      this.metrics.deletes++;
      return result > 0;
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({ message: 'Failed to delete cache value', key, fullMessage: (error as Error).message });
      return false;
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  /**
   * Delete all keys matching a pattern using SCAN
   * @param pattern - Redis pattern (e.g., "exercise:list:*")
   * @returns Number of deleted keys
   */
  async deleteByPattern(pattern: string): Promise<number> {
    const timerId = this.startPerformanceTimer('deleteByPattern');
    let deletedCount = 0;

    try {
      // Use SCAN to find keys matching the pattern (more efficient than KEYS for large datasets)
      let cursor = '0';
      const fullPattern = `${this.config.keyPrefix || ''}${pattern}`;

      do {
        const result = await this.redis.scan(cursor, 'MATCH', fullPattern, 'COUNT', 100);
        cursor = result[0];
        const keys = result[1];

        if (keys.length > 0) {
          // Delete keys without the prefix since redis.del uses the prefix automatically
          const keysWithoutPrefix = keys.map(k =>
            k.startsWith(this.config.keyPrefix || '')
              ? k.substring((this.config.keyPrefix || '').length)
              : k
          );

          for (const key of keysWithoutPrefix) {
            await this.redis.del(key);
            deletedCount++;
          }
        }
      } while (cursor !== '0');

      this.metrics.deletes += deletedCount;
      this.logger.info({
        message: `Deleted ${deletedCount} keys matching pattern: ${pattern}`,
        fullMessage: JSON.stringify({ pattern, deletedCount })
      });

      return deletedCount;
    } catch (error) {
      this.metrics.errors++;
      this.logger.error({
        message: 'Failed to delete keys by pattern',
        fullMessage: (error as Error).message
      });
      return deletedCount;
    } finally {
      this.endPerformanceTimer(timerId);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  private getUserSessionsKey(userId: string): string {
    return `user_sessions:${userId}`;
  }

  private getPermissionKey(userId: string): string {
    return `permissions:${userId}`;
  }

  private getTenantContextKey(userId: string): string {
    return `tenant_context:${userId}`;
  }

  private getTenantDataKey(tenantId: string, key: string): string {
    return `tenant:${tenantId}:${key}`;
  }

  private getTenantKeysSet(tenantId: string): string {
    return `tenant_keys:${tenantId}`;
  }

  private resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalKeys: 0,
      memoryUsage: 0,
      avgResponseTime: 0
    };
  }

  /**
   * Parses Redis INFO command output into key-value pairs
   */
  private parseRedisInfo(info: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = info.split('\r\n');

    for (const line of lines) {
      if (line && !line.startsWith('#') && line.includes(':')) {
        const [key, value] = line.split(':');
        // Try to parse numeric values
        const numValue = parseFloat(value);
        result[key] = isNaN(numValue) ? value : numValue;
      }
    }

    return result;
  }
}

// Factory function
export function createRedisCacheService(
  logger: ILogger,
  config: ICacheConfig
): RedisCacheService {
  return new RedisCacheService(logger, config);
}

// Default configuration
export const DEFAULT_REDIS_CONFIG: ICacheConfig = {
  host: 'localhost',
  port: 6379,
  db: 0,
  timeout: 5000,
  pool: {
    min: 1,
    max: 5
  },
  keyPrefix: 'strengthos:',
  defaultTTL: 600,
  maxRetries: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  lazyConnect: true
};