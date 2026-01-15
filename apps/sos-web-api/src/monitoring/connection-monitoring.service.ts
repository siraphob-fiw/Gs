import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ILogger, LogData } from '@strengthos/shared-logging';

// Simple adapter to make NestJS Logger compatible with ILogger interface
class LoggerAdapter implements ILogger {
  constructor(private nestLogger: Logger) {}

  async info(logData: LogData): Promise<void> {
    this.nestLogger.log(logData.message);
  }

  async error(
    logData: LogData,
    stackTrace?: string,
    innerException?: string,
  ): Promise<void> {
    this.nestLogger.error(logData.message, stackTrace);
  }

  async warning(logData: LogData): Promise<void> {
    this.nestLogger.warn(logData.message);
  }

  async warn(logData: LogData): Promise<void> {
    this.nestLogger.warn(logData.message);
  }

  async debug(logData: LogData): Promise<void> {
    this.nestLogger.debug(logData.message);
  }
}
import { ConfigService } from '@nestjs/config';
import { ConnectionConfigFactory } from '@strengthos/shared-validation';
import { Db } from '@strengthos/shared-database';
import {
  DatabaseConnectionError,
  HealthCheckError,
  RedisConnectionError,
} from '../common/errors/database-errors';
import { RedisCacheService } from '@strengthos/shared-cache';

export interface ConnectionMetrics {
  service: 'database' | 'redis';
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  consecutiveFailures: number;
  totalChecks: number;
  totalFailures: number;
  uptime: number; // percentage
  details?: Record<string, any>;
}

export interface MonitoringAlert {
  id: string;
  service: 'database' | 'redis';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  context?: Record<string, any>;
}

/**
 * Service responsible for monitoring database and Redis connection health
 * Provides real-time monitoring, alerting, and metrics collection
 */
@Injectable()
export class ConnectionMonitoringService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ConnectionMonitoringService.name);

  private monitoringInterval?: NodeJS.Timeout;
  private readonly metrics = new Map<string, ConnectionMetrics>();
  private readonly alerts = new Map<string, MonitoringAlert>();
  private readonly monitoringConfig = {
    intervalMs: 30000, // 30 seconds
    timeoutMs: 10000, // 10 seconds
    maxConsecutiveFailures: 3,
    alertCooldownMs: 300000, // 5 minutes
  };

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const monitoringEnabled =
      this.configService.get('CONNECTION_MONITORING_ENABLED', 'true') ===
      'true';

    if (monitoringEnabled) {
      this.logger.log('🔍 Starting connection monitoring service...');
      await this.initializeMetrics();
      this.startMonitoring();
    } else {
      this.logger.log('Connection monitoring is disabled');
    }
  }

  async onModuleDestroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.logger.log('Connection monitoring service stopped');
    }
  }

  /**
   * Initializes metrics for all configured services
   */
  private async initializeMetrics(): Promise<void> {
    // Initialize database metrics
    this.metrics.set('database', {
      service: 'database',
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 0,
      consecutiveFailures: 0,
      totalChecks: 0,
      totalFailures: 0,
      uptime: 100,
    });

    // Redis metrics disabled - Redis not in use
    // const redisConfigResult = ConnectionConfigFactory.createRedisConfig();
    // if (redisConfigResult.isValid) {
    //   this.metrics.set('redis', {
    //     service: 'redis',
    //     status: 'healthy',
    //     lastCheck: new Date(),
    //     responseTime: 0,
    //     consecutiveFailures: 0,
    //     totalChecks: 0,
    //     totalFailures: 0,
    //     uptime: 100,
    //   });
    // }

    this.logger.log(`Initialized monitoring for ${this.metrics.size} services`);
  }

  /**
   * Starts the monitoring loop
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        this.logger.error('Error during monitoring cycle:', error);
      }
    }, this.monitoringConfig.intervalMs);

    this.logger.log(
      `Connection monitoring started with ${this.monitoringConfig.intervalMs}ms interval`,
    );
  }

  /**
   * Performs health checks on all monitored services
   */
  private async performHealthChecks(): Promise<void> {
    const promises = Array.from(this.metrics.keys()).map((service) =>
      this.checkServiceHealth(service as 'database' | 'redis'),
    );

    await Promise.allSettled(promises);
  }

  /**
   * Checks health of a specific service
   */
  private async checkServiceHealth(
    service: 'database' | 'redis',
  ): Promise<void> {
    const startTime = Date.now();
    const metrics = this.metrics.get(service);

    if (!metrics) {
      return;
    }

    try {
      let isHealthy = false;
      let details: Record<string, any> = {};

      if (service === 'database') {
        const result = await this.checkDatabaseHealth();
        isHealthy = result.isHealthy;
        details = result.details;
      } else if (service === 'redis') {
        // Redis disabled - using in-memory cache
        const result = await this.checkRedisHealth();
        isHealthy = result.isHealthy;
        details = result.details;
      }

      const responseTime = Date.now() - startTime;

      // Update metrics
      metrics.lastCheck = new Date();
      metrics.responseTime = responseTime;
      metrics.totalChecks++;

      if (isHealthy) {
        metrics.consecutiveFailures = 0;
        metrics.status = responseTime > 2000 ? 'degraded' : 'healthy';
        this.resolveAlerts(service);
      } else {
        metrics.consecutiveFailures++;
        metrics.totalFailures++;
        metrics.status = 'unhealthy';

        // Create alert if threshold exceeded
        if (
          metrics.consecutiveFailures >=
          this.monitoringConfig.maxConsecutiveFailures
        ) {
          await this.createAlert(
            service,
            'critical',
            `Service ${service} has failed ${metrics.consecutiveFailures} consecutive health checks`,
            { responseTime, details },
          );
        }
      }

      // Update uptime percentage
      metrics.uptime =
        ((metrics.totalChecks - metrics.totalFailures) / metrics.totalChecks) *
        100;
      metrics.details = details;

      // Log status changes
      this.logHealthStatus(service, metrics, isHealthy);
    } catch (error) {
      this.logger.error(`Health check failed for ${service}:`, error);

      metrics.consecutiveFailures++;
      metrics.totalFailures++;
      metrics.totalChecks++;
      metrics.status = 'unhealthy';
      metrics.lastCheck = new Date();
      metrics.responseTime = Date.now() - startTime;

      await this.createAlert(
        service,
        'critical',
        `Health check error for ${service}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: error instanceof Error ? error.message : error },
      );
    }
  }

  /**
   * Performs database health check
   */
  private async checkDatabaseHealth(): Promise<{
    isHealthy: boolean;
    details: Record<string, any>;
  }> {
    try {
      const dbConfigResult = ConnectionConfigFactory.createDatabaseConfig();
      if (!dbConfigResult.isValid) {
        throw new DatabaseConnectionError('Database configuration is invalid');
      }

      const db = new Db(dbConfigResult.data);

      // Test connection with timeout
      const connectionPromise = db.testConnection();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Health check timeout')),
          this.monitoringConfig.timeoutMs,
        );
      });

      const isConnected = await Promise.race([
        connectionPromise,
        timeoutPromise,
      ]);

      if (!isConnected) {
        await db.close();
        return {
          isHealthy: false,
          details: { reason: 'connection_test_failed' },
        };
      }

      // Test query execution
      const queryStartTime = Date.now();
      const result = await Promise.race([
        db.knex.raw('SELECT 1 as test, NOW() as timestamp'),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout')), 5000);
        }),
      ]);

      const queryTime = Date.now() - queryStartTime;

      // Get pool information
      const poolInfo = this.getConnectionPoolInfo(db);

      await db.close();

      return {
        isHealthy: true,
        details: {
          queryTime,
          poolInfo,
          serverTime: result[0]?.timestamp,
          reason: 'health_check_passed',
        },
      };
    } catch (error) {
      throw HealthCheckError.databaseHealthCheckFailed(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  private async checkRedisHealth(): Promise<{
    isHealthy: boolean;
    details: Record<string, any>;
  }> {
    try {
      const redisConfigResult = ConnectionConfigFactory.createRedisConfig();
      if (!redisConfigResult.isValid) {
        throw new RedisConnectionError('Redis configuration is invalid');
      }
      const redis = new RedisCacheService(
        new LoggerAdapter(this.logger),
        redisConfigResult.data!,
      );
      const result = await redis.healthCheck();
      if (!result.isOk) {
        throw new RedisConnectionError('Redis health check failed');
      }
      return {
        isHealthy: true,
        details: { message: 'Redis health check passed' },
      };
    } catch (error) {
      throw HealthCheckError.redisHealthCheckFailed(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Creates an alert for service issues
   */
  private async createAlert(
    service: 'database' | 'redis',
    severity: 'warning' | 'critical',
    message: string,
    context?: Record<string, any>,
  ): Promise<void> {
    const alertId = `${service}_${severity}_${Date.now()}`;

    // Check for recent similar alerts (cooldown)
    const recentAlerts = Array.from(this.alerts.values()).filter(
      (alert) =>
        alert.service === service &&
        alert.severity === severity &&
        !alert.resolved &&
        Date.now() - alert.timestamp.getTime() <
          this.monitoringConfig.alertCooldownMs,
    );

    if (recentAlerts.length > 0) {
      return; // Skip creating duplicate alert during cooldown
    }

    const alert: MonitoringAlert = {
      id: alertId,
      service,
      severity,
      message,
      timestamp: new Date(),
      resolved: false,
      context,
    };

    this.alerts.set(alertId, alert);

    // Log alert
    if (severity === 'critical') {
      this.logger.error(
        `🚨 CRITICAL ALERT [${service.toUpperCase()}]: ${message}`,
        context,
      );
    } else {
      this.logger.warn(
        `⚠️  WARNING ALERT [${service.toUpperCase()}]: ${message}`,
        context,
      );
    }

    // Here you could integrate with external alerting systems
    // await this.sendToExternalAlertingSystem(alert);
  }

  /**
   * Resolves alerts for a service when it becomes healthy
   */
  private resolveAlerts(service: 'database' | 'redis'): void {
    const unresolvedAlerts = Array.from(this.alerts.values()).filter(
      (alert) => alert.service === service && !alert.resolved,
    );

    unresolvedAlerts.forEach((alert) => {
      alert.resolved = true;
      this.logger.log(
        `✅ RESOLVED ALERT [${service.toUpperCase()}]: ${alert.message}`,
      );
    });
  }

  /**
   * Logs health status changes
   */
  private logHealthStatus(
    service: string,
    metrics: ConnectionMetrics,
    isHealthy: boolean,
  ): void {
    const statusEmoji = {
      healthy: '✅',
      degraded: '⚠️',
      unhealthy: '❌',
    };

    const logData = {
      service,
      status: metrics.status,
      responseTime: metrics.responseTime,
      consecutiveFailures: metrics.consecutiveFailures,
      uptime: Math.round(metrics.uptime * 100) / 100,
    };

    if (isHealthy) {
      this.logger.debug(
        `${statusEmoji[metrics.status]} ${service.toUpperCase()} health check passed`,
        logData,
      );
    } else {
      this.logger.warn(
        `${statusEmoji[metrics.status]} ${service.toUpperCase()} health check failed`,
        logData,
      );
    }
  }

  /**
   * Gets connection pool information from database instance
   */
  private getConnectionPoolInfo(db: Db): Record<string, any> {
    try {
      const knex = (db as any).knex;
      if (knex && knex.client && knex.client.pool) {
        const pool = knex.client.pool;
        return {
          size: pool.size || 0,
          available: pool.available || 0,
          borrowed: pool.borrowed || 0,
          pending: pool.pending || 0,
          min: pool.min || 0,
          max: pool.max || 0,
        };
      }
    } catch (error) {
      this.logger.debug('Could not retrieve pool information:', error);
    }

    return { status: 'pool_info_unavailable' };
  }

  /**
   * Gets current metrics for all services
   */
  getMetrics(): ConnectionMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Gets metrics for a specific service
   */
  getServiceMetrics(
    service: 'database' | 'redis',
  ): ConnectionMetrics | undefined {
    return this.metrics.get(service);
  }

  /**
   * Gets all active alerts
   */
  getActiveAlerts(): MonitoringAlert[] {
    return Array.from(this.alerts.values()).filter((alert) => !alert.resolved);
  }

  /**
   * Gets all alerts (including resolved ones)
   */
  getAllAlerts(): MonitoringAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Forces a health check for all services
   */
  async forceHealthCheck(): Promise<void> {
    this.logger.log('Forcing health check for all services...');
    await this.performHealthChecks();
  }

  /**
   * Forces a health check for a specific service
   */
  async forceServiceHealthCheck(service: 'database' | 'redis'): Promise<void> {
    this.logger.log(`Forcing health check for ${service}...`);
    await this.checkServiceHealth(service);
  }

  /**
   * Gets monitoring statistics
   */
  getMonitoringStats(): Record<string, any> {
    const metrics = this.getMetrics();
    const activeAlerts = this.getActiveAlerts();

    return {
      services: metrics.length,
      healthyServices: metrics.filter((m) => m.status === 'healthy').length,
      degradedServices: metrics.filter((m) => m.status === 'degraded').length,
      unhealthyServices: metrics.filter((m) => m.status === 'unhealthy').length,
      activeAlerts: activeAlerts.length,
      criticalAlerts: activeAlerts.filter((a) => a.severity === 'critical')
        .length,
      averageUptime:
        metrics.reduce((sum, m) => sum + m.uptime, 0) / metrics.length,
      lastCheck: Math.max(...metrics.map((m) => m.lastCheck.getTime())),
      monitoringConfig: this.monitoringConfig,
    };
  }
}
