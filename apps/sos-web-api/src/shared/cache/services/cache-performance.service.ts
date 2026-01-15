import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { CacheService } from '../cache.service';
import { Results } from '@strengthos/shared-utils';

export interface CachePerformanceMetrics {
  hitRate: number;
  missRate: number;
  avgResponseTime: number;
  totalOperations: number;
  errorRate: number;
  memoryUsage: number;
  keyCount: number;
  slowQueries: SlowQueryInfo[];
  topKeys: KeyUsageInfo[];
}

export interface SlowQueryInfo {
  operation: string;
  key: string;
  duration: number;
  timestamp: Date;
  tenantId?: string;
}

export interface KeyUsageInfo {
  key: string;
  hitCount: number;
  lastAccessed: Date;
  size: number;
  ttl: number;
}

export interface PerformanceAlert {
  type: 'HIGH_MISS_RATE' | 'SLOW_QUERY' | 'HIGH_MEMORY' | 'HIGH_ERROR_RATE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  metrics: Record<string, any>;
  timestamp: Date;
}

@Injectable()
export class CachePerformanceService implements OnModuleInit {
  private performanceHistory: CachePerformanceMetrics[] = [];
  private slowQueries: SlowQueryInfo[] = [];
  private keyUsage: Map<string, KeyUsageInfo> = new Map();
  private alerts: PerformanceAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  // Performance thresholds
  private readonly thresholds = {
    slowQueryTime: 1000, // 1 second
    lowHitRate: 0.7, // 70%
    highMissRate: 0.4, // 40%
    highErrorRate: 0.05, // 5%
    highMemoryUsage: 0.85, // 85%
    maxSlowQueries: 100,
    maxKeyUsageEntries: 1000,
    maxAlerts: 50,
  };

  constructor(
    private readonly cacheService: CacheService,
    // @Inject('ILogger')
    // private readonly logger: ILogger,
  ) {}

  onModuleInit() {
    this.startPerformanceMonitoring();
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  async collectMetrics(): Promise<Results<CachePerformanceMetrics>> {
    try {
      const cacheStats = await this.cacheService.getCacheStats();

      if (!cacheStats.isOk) {
        return Results.fail<CachePerformanceMetrics>(
          null,
          'Failed to collect cache stats',
        );
      }

      const stats = cacheStats.returnValue;
      const redisMetrics = stats.redis;
      const sessionMetrics = stats.session;

      // Calculate combined metrics
      const totalHits =
        (redisMetrics?.hits || 0) +
        (sessionMetrics?.sessions?.hits || 0) +
        (sessionMetrics?.permissions?.hits || 0) +
        (sessionMetrics?.tenants?.hits || 0);

      const totalMisses =
        (redisMetrics?.misses || 0) +
        (sessionMetrics?.sessions?.misses || 0) +
        (sessionMetrics?.permissions?.misses || 0) +
        (sessionMetrics?.tenants?.misses || 0);

      const totalOperations = totalHits + totalMisses;
      const hitRate = totalOperations > 0 ? totalHits / totalOperations : 0;
      const missRate = totalOperations > 0 ? totalMisses / totalOperations : 0;

      const metrics: CachePerformanceMetrics = {
        hitRate,
        missRate,
        avgResponseTime: redisMetrics?.avgResponseTime || 0,
        totalOperations,
        errorRate: redisMetrics?.errors
          ? redisMetrics.errors / Math.max(totalOperations, 1)
          : 0,
        memoryUsage: redisMetrics?.memoryUsage || 0,
        keyCount: redisMetrics?.totalKeys || 0,
        slowQueries: [...this.slowQueries],
        topKeys: Array.from(this.keyUsage.values())
          .sort((a, b) => b.hitCount - a.hitCount)
          .slice(0, 10),
      };

      // Store metrics history
      this.performanceHistory.push(metrics);
      if (this.performanceHistory.length > 100) {
        this.performanceHistory.shift();
      }

      // Check for performance issues
      await this.checkPerformanceThresholds(metrics);

      return Results.ok(metrics);
    } catch (error) {
      Logger.error({
        message: 'Failed to collect cache performance metrics',
        fullMessage: (error as Error).message,
      });
      return Results.fail<CachePerformanceMetrics>(
        null,
        'Failed to collect performance metrics',
      );
    }
  }

  async getPerformanceHistory(
    hours: number = 24,
  ): Promise<Results<CachePerformanceMetrics[]>> {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      const recentMetrics = this.performanceHistory.filter(
        (_metric) => new Date() >= cutoffTime,
      );

      return Results.ok(recentMetrics);
    } catch (error) {
      return Results.fail<CachePerformanceMetrics[]>(
        null,
        `Failed to get performance history: ${(error as Error).message}`,
      );
    }
  }

  // ============================================================================
  // SLOW QUERY TRACKING
  // ============================================================================

  recordSlowQuery(
    operation: string,
    key: string,
    duration: number,
    tenantId?: string,
  ): void {
    if (duration >= this.thresholds.slowQueryTime) {
      const slowQuery: SlowQueryInfo = {
        operation,
        key,
        duration,
        timestamp: new Date(),
        tenantId,
      };

      this.slowQueries.push(slowQuery);

      // Keep only recent slow queries
      if (this.slowQueries.length > this.thresholds.maxSlowQueries) {
        this.slowQueries.shift();
      }

      Logger.warn({
        message: 'Slow cache query detected',
        fullMessage: JSON.stringify(slowQuery),
      });

      // Create alert for very slow queries
      if (duration >= this.thresholds.slowQueryTime * 2) {
        this.createAlert(
          'SLOW_QUERY',
          'HIGH',
          `Very slow cache query: ${operation} on ${key} took ${duration}ms`,
          {
            operation,
            key,
            duration,
            tenantId,
          },
        );
      }
    }
  }

  getSlowQueries(limit: number = 50): Results<SlowQueryInfo[]> {
    try {
      return Results.ok(this.slowQueries.slice(-limit));
    } catch (error) {
      return Results.fail<SlowQueryInfo[]>(
        null,
        `Failed to get slow queries: ${(error as Error).message}`,
      );
    }
  }

  // ============================================================================
  // KEY USAGE TRACKING
  // ============================================================================

  recordKeyUsage(key: string, hit: boolean, size?: number, ttl?: number): void {
    const existing = this.keyUsage.get(key);

    if (existing) {
      if (hit) {
        existing.hitCount++;
      }
      existing.lastAccessed = new Date();
      if (size !== undefined) existing.size = size;
      if (ttl !== undefined) existing.ttl = ttl;
    } else {
      this.keyUsage.set(key, {
        key,
        hitCount: hit ? 1 : 0,
        lastAccessed: new Date(),
        size: size || 0,
        ttl: ttl || 0,
      });
    }

    // Cleanup old entries
    if (this.keyUsage.size > this.thresholds.maxKeyUsageEntries) {
      const oldestKey = Array.from(this.keyUsage.entries()).sort(
        ([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime(),
      )[0][0];
      this.keyUsage.delete(oldestKey);
    }
  }

  getTopKeys(limit: number = 20): Results<KeyUsageInfo[]> {
    try {
      const topKeys = Array.from(this.keyUsage.values())
        .sort((a, b) => b.hitCount - a.hitCount)
        .slice(0, limit);

      return Results.ok(topKeys);
    } catch (error) {
      return Results.fail<KeyUsageInfo[]>(
        null,
        `Failed to get top keys: ${(error as Error).message}`,
      );
    }
  }

  // ============================================================================
  // PERFORMANCE ALERTS
  // ============================================================================

  private async checkPerformanceThresholds(
    metrics: CachePerformanceMetrics,
  ): Promise<void> {
    // Check hit rate
    if (metrics.hitRate < this.thresholds.lowHitRate) {
      this.createAlert(
        'HIGH_MISS_RATE',
        'MEDIUM',
        `Cache hit rate is low: ${(metrics.hitRate * 100).toFixed(1)}%`,
        { hitRate: metrics.hitRate, threshold: this.thresholds.lowHitRate },
      );
    }

    // Check error rate
    if (metrics.errorRate > this.thresholds.highErrorRate) {
      this.createAlert(
        'HIGH_ERROR_RATE',
        'HIGH',
        `Cache error rate is high: ${(metrics.errorRate * 100).toFixed(1)}%`,
        {
          errorRate: metrics.errorRate,
          threshold: this.thresholds.highErrorRate,
        },
      );
    }

    // Check memory usage (if available)
    if (metrics.memoryUsage > 0) {
      const memoryUsagePercent = metrics.memoryUsage / (1024 * 1024 * 1024); // Convert to GB
      if (memoryUsagePercent > this.thresholds.highMemoryUsage) {
        this.createAlert(
          'HIGH_MEMORY',
          'MEDIUM',
          `Cache memory usage is high: ${memoryUsagePercent.toFixed(1)}GB`,
          {
            memoryUsage: metrics.memoryUsage,
            threshold: this.thresholds.highMemoryUsage,
          },
        );
      }
    }
  }

  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    metrics: Record<string, any>,
  ): void {
    const alert: PerformanceAlert = {
      type,
      severity,
      message,
      metrics,
      timestamp: new Date(),
    };

    this.alerts.push(alert);

    // Keep only recent alerts
    if (this.alerts.length > this.thresholds.maxAlerts) {
      this.alerts.shift();
    }

    // Log based on severity
    switch (severity) {
      case 'CRITICAL':
        Logger.error({
          message: `Cache Performance Alert: ${message}`,
          fullMessage: JSON.stringify(alert),
        });
        break;
      case 'HIGH':
        Logger.error({
          message: `Cache Performance Alert: ${message}`,
          fullMessage: JSON.stringify(alert),
        });
        break;
      case 'MEDIUM':
        Logger.warn({
          message: `Cache Performance Alert: ${message}`,
          fullMessage: JSON.stringify(alert),
        });
        break;
      case 'LOW':
        Logger.log({
          message: `Cache Performance Alert: ${message}`,
          fullMessage: JSON.stringify(alert),
        });
        break;
    }
  }

  getAlerts(
    severity?: PerformanceAlert['severity'],
  ): Results<PerformanceAlert[]> {
    try {
      let filteredAlerts = [...this.alerts];

      if (severity) {
        filteredAlerts = filteredAlerts.filter(
          (alert) => alert.severity === severity,
        );
      }

      return Results.ok(
        filteredAlerts.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        ),
      );
    } catch (error) {
      return Results.fail<PerformanceAlert[]>(
        null,
        `Failed to get alerts: ${(error as Error).message}`,
      );
    }
  }

  clearAlerts(): Results<void> {
    try {
      this.alerts = [];
      // this.logger.info({ message: 'Cache performance alerts cleared' });
      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(
        null,
        `Failed to clear alerts: ${(error as Error).message}`,
      );
    }
  }

  // ============================================================================
  // PERFORMANCE RECOMMENDATIONS
  // ============================================================================

  async getPerformanceRecommendations(): Promise<Results<string[]>> {
    try {
      const recommendations: string[] = [];
      const metrics = await this.collectMetrics();

      if (!metrics.isOk) {
        return Results.fail<string[]>(
          null,
          'Failed to collect metrics for recommendations',
        );
      }

      const currentMetrics = metrics.returnValue;

      // Hit rate recommendations
      if (currentMetrics.hitRate < 0.8) {
        recommendations.push(
          'Consider increasing cache TTL for frequently accessed data',
        );
        recommendations.push(
          'Review cache invalidation strategies to reduce unnecessary evictions',
        );
      }

      // Response time recommendations
      if (currentMetrics.avgResponseTime > 500) {
        recommendations.push(
          'Consider optimizing Redis configuration or upgrading hardware',
        );
        recommendations.push(
          'Review network latency between application and Redis server',
        );
      }

      // Memory usage recommendations
      if (currentMetrics.memoryUsage > 0.8 * 1024 * 1024 * 1024) {
        // 80% of 1GB
        recommendations.push('Consider implementing cache eviction policies');
        recommendations.push(
          'Review data structures and optimize serialization',
        );
      }

      // Slow query recommendations
      if (this.slowQueries.length > 10) {
        recommendations.push(
          'Optimize slow cache operations or consider data structure changes',
        );
        recommendations.push('Review cache key patterns for efficiency');
      }

      return Results.ok(recommendations);
    } catch (error) {
      return Results.fail<string[]>(
        null,
        `Failed to generate recommendations: ${(error as Error).message}`,
      );
    }
  }

  // ============================================================================
  // BACKGROUND MONITORING
  // ============================================================================

  private startPerformanceMonitoring(): void {
    this.collectMetrics();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getMonitoringStatus(): Results<{
    isMonitoring: boolean;
    metricsCount: number;
    slowQueriesCount: number;
    alertsCount: number;
    keyUsageCount: number;
  }> {
    try {
      return Results.ok({
        isMonitoring: this.monitoringInterval !== null,
        metricsCount: this.performanceHistory.length,
        slowQueriesCount: this.slowQueries.length,
        alertsCount: this.alerts.length,
        keyUsageCount: this.keyUsage.size,
      });
    } catch (error) {
      return Results.fail<any>(
        null,
        `Failed to get monitoring status: ${(error as Error).message}`,
      );
    }
  }

  // Cleanup method
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}
