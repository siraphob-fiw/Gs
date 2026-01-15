import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { IRedisCacheService } from '@strengthos/shared-cache';
import { ILogger } from '@strengthos/shared-logging';
import { Results } from '@strengthos/shared-utils';
import { Permission } from '@strengthos/shared-types';

/**
 * Cache Service - Uses Redis cache
 */
@Injectable()
export class CacheService implements OnModuleInit {
  constructor(
    @Inject('IRedisCacheService')
    private readonly cacheService: IRedisCacheService,
    @Inject('ILogger')
    private readonly SharedLogger: ILogger,
  ) {}

  async onModuleInit() {
    const healthResult = await this.cacheService.healthCheck();
    if (healthResult.isOk && healthResult.returnValue) {
      this.SharedLogger.info({
        message: 'Cache service initialized (Redis mode)',
      });
    } else {
      this.SharedLogger.warn({
        message: 'Cache service initialized but Redis health check failed',
      });
    }
  }

  // ============================================================================
  // PERMISSION MANAGEMENT
  // ============================================================================

  async setUserPermissions(
    userId: string,
    permissions: Permission[],
    ttlSeconds?: number,
  ): Promise<Results<boolean>> {
    try {
      return await this.cacheService.setUserPermissions(
        userId,
        permissions,
        ttlSeconds,
      );
    } catch (error) {
      this.SharedLogger.error({
        message: 'Failed to set user permissions in cache',
        fullMessage: (error as Error).message,
      });
      return Results.fail<boolean>(
        null,
        'Failed to set user permissions in cache',
      );
    }
  }

  async getUserPermissions(
    userId: string,
  ): Promise<Results<Permission[] | null>> {
    try {
      return await this.cacheService.getUserPermissions(userId);
    } catch (error) {
      this.SharedLogger.error({
        message: 'Failed to get user permissions from cache',
        fullMessage: (error as Error).message,
      });
      return Results.fail<Permission[] | null>(
        null,
        'Failed to get user permissions from cache',
      );
    }
  }

  async deleteUserPermissions(userId: string): Promise<Results<boolean>> {
    try {
      return await this.cacheService.deleteUserPermissions(userId);
    } catch (error) {
      this.SharedLogger.error({
        message: 'Failed to delete user permissions from cache',
        fullMessage: (error as Error).message,
      });
      return Results.fail<boolean>(
        null,
        'Failed to delete user permissions from cache',
      );
    }
  }

  // ============================================================================
  // TENANT CONTEXT MANAGEMENT
  // ============================================================================

  async setTenantContext(
    userId: string,
    tenantId: string,
    ttlSeconds?: number,
  ): Promise<Results<boolean>> {
    try {
      return await this.cacheService.setTenantContext(
        userId,
        tenantId,
        ttlSeconds,
      );
    } catch (error) {
      this.SharedLogger.error({
        message: 'Failed to set tenant context in cache',
        fullMessage: (error as Error).message,
      });
      return Results.fail<boolean>(
        null,
        'Failed to set tenant context in cache',
      );
    }
  }

  async getTenantContext(userId: string): Promise<Results<string | null>> {
    try {
      return await this.cacheService.getTenantContext(userId);
    } catch (error) {
      this.SharedLogger.error({
        message: 'Failed to get tenant context from cache',
        fullMessage: (error as Error).message,
      });
      return Results.fail<string | null>(
        null,
        'Failed to get tenant context from cache',
      );
    }
  }

  async deleteTenantContext(userId: string): Promise<Results<boolean>> {
    try {
      return await this.cacheService.deleteTenantContext(userId);
    } catch (error) {
      this.SharedLogger.error({
        message: 'Failed to delete tenant context from cache',
        fullMessage: (error as Error).message,
      });
      return Results.fail<boolean>(
        null,
        'Failed to delete tenant context from cache',
      );
    }
  }

  // ============================================================================
  // TENANT-AWARE CACHING
  // ============================================================================

  async setTenantData<T>(
    tenantId: string,
    key: string,
    data: T,
    ttlSeconds?: number,
  ): Promise<Results<boolean>> {
    try {
      return await this.cacheService.setTenantData(
        tenantId,
        key,
        data,
        ttlSeconds,
      );
    } catch (error) {
      this.SharedLogger.error({
        message: 'Failed to set tenant data in cache',
        fullMessage: (error as Error).message,
      });
      return Results.fail<boolean>(null, 'Failed to set tenant data in cache');
    }
  }

  async getTenantData<T>(
    tenantId: string,
    key: string,
  ): Promise<Results<T | null>> {
    try {
      return await this.cacheService.getTenantData<T>(tenantId, key);
    } catch (error) {
      this.SharedLogger.error({
        message: 'Failed to get tenant data from cache',
        fullMessage: (error as Error).message,
      });
      return Results.fail<T | null>(
        null,
        'Failed to get tenant data from cache',
      );
    }
  }

  async deleteTenantData(
    tenantId: string,
    key: string,
  ): Promise<Results<boolean>> {
    try {
      return await this.cacheService.deleteTenantData(tenantId, key);
    } catch (error) {
      this.SharedLogger.error({
        message: 'Failed to delete tenant data from cache',
        fullMessage: (error as Error).message,
      });
      return Results.fail<boolean>(
        null,
        'Failed to delete tenant data from cache',
      );
    }
  }

  async invalidateTenantCache(tenantId: string): Promise<Results<number>> {
    try {
      return await this.cacheService.invalidateTenantCache(tenantId);
    } catch (error) {
      this.SharedLogger.error({
        message: 'Failed to invalidate tenant cache',
        fullMessage: (error as Error).message,
      });
      return Results.fail<number>(null, 'Failed to invalidate tenant cache');
    }
  }

  // ============================================================================
  // CACHE INVALIDATION
  // ============================================================================
  async queueInvalidation(_event: any): Promise<Results<void>> {
    return Results.ok(undefined);
  }

  // ============================================================================
  // CACHE MANAGEMENT AND MONITORING
  // ============================================================================

  async getMetrics(): Promise<
    Results<{
      hits: number;
      misses: number;
      size: number;
      evictions: number;
      hitRate: number;
      avgLatency: number;
    }>
  > {
    try {
      const metricsResult = await this.cacheService.getMetrics();
      if (metricsResult.isOk && metricsResult.returnValue) {
        const metrics = metricsResult.returnValue;
        const totalRequests = metrics.hits + metrics.misses;
        return Results.ok({
          hits: metrics.hits,
          misses: metrics.misses,
          size: metrics.totalKeys,
          evictions: 0,
          hitRate: totalRequests > 0 ? metrics.hits / totalRequests : 0,
          avgLatency: metrics.avgResponseTime,
        });
      }
      return Results.ok({
        hits: 0,
        misses: 0,
        size: 0,
        evictions: 0,
        hitRate: 0,
        avgLatency: 0,
      });
    } catch (error) {
      this.SharedLogger.error({
        message: 'Failed to get cache metrics',
        fullMessage: (error as Error).message,
      });
      return Results.fail(null, 'Failed to get cache metrics');
    }
  }

  async getCacheStats(): Promise<Results<any>> {
    try {
      const metricsResult = await this.cacheService.getMetrics();
      return Results.ok({
        redis: metricsResult.isOk ? metricsResult.returnValue : null,
        mode: 'redis',
      });
    } catch (error) {
      this.SharedLogger.error({
        message: 'Failed to get cache stats',
        fullMessage: (error as Error).message,
      });
      return Results.fail<any>(null, 'Failed to get cache stats');
    }
  }

  async healthCheck(): Promise<Results<boolean>> {
    try {
      return await this.cacheService.healthCheck();
    } catch (error) {
      this.SharedLogger.error({
        message: 'Cache health check failed',
        fullMessage: (error as Error).message,
      });
      return Results.fail<boolean>(null, 'Cache health check failed');
    }
  }

  async flushAll(): Promise<Results<void>> {
    try {
      return await this.cacheService.flushAll();
    } catch (error) {
      this.SharedLogger.error({
        message: 'Failed to flush all caches',
        fullMessage: (error as Error).message,
      });
      return Results.fail<void>(null, 'Failed to flush all caches');
    }
  }

  // ============================================================================
  // GENERIC CACHE OPERATIONS
  // ============================================================================

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.cacheService.get<T>(key);
    } catch (error) {
      this.SharedLogger.error({
        message: 'Failed to get value from cache',
        fullMessage: (error as Error).message,
      });
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      return await this.cacheService.set(key, value, ttlSeconds);
    } catch (error) {
      this.SharedLogger.error({
        message: 'Failed to set value in cache',
        fullMessage: (error as Error).message,
      });
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      return await this.cacheService.delete(key);
    } catch (error) {
      this.SharedLogger.error({
        message: 'Failed to delete value from cache',
        fullMessage: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   * @param pattern - Pattern to match (e.g., "exercise:list:*")
   * @returns Number of deleted keys
   */
  async deleteByPattern(pattern: string): Promise<number> {
    try {
      return await this.cacheService.deleteByPattern(pattern);
    } catch (error) {
      this.SharedLogger.error({
        message: 'Failed to delete values by pattern from cache',
        fullMessage: (error as Error).message,
      });
      return 0;
    }
  }

  // ============================================================================
  // CACHE WARMING
  // ============================================================================

  async warmCache(_tenantId: string, _userId?: string): Promise<Results<void>> {
    return Results.ok(undefined);
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  startPerformanceTimer(operation: string): string {
    return this.cacheService.startPerformanceTimer(operation);
  }

  endPerformanceTimer(timerId: string): number {
    return this.cacheService.endPerformanceTimer(timerId);
  }
}
