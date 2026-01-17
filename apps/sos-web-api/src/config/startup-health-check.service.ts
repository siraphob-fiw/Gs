import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectionConfigFactory } from '@strengthos/shared-validation';
import { Db } from '@strengthos/shared-database';
import { RedisCacheService } from '@strengthos/shared-cache';
import { ILogger } from '@strengthos/shared-logging';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  responseTime?: number;
  details?: Record<string, any>;
}

export interface StartupHealthCheckResult {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  checks: HealthCheckResult[];
  timestamp: Date;
}

/**
 * Service responsible for performing health checks on all critical services during startup
 * Provides detailed information about service availability and performance
 */
@Injectable()
export class StartupHealthCheckService {
  private readonly logger = new Logger(StartupHealthCheckService.name);

  constructor(private readonly configService: ConfigService) { }

  /**
   * Performs comprehensive health checks on all critical services
   */
  async performStartupHealthChecks(): Promise<StartupHealthCheckResult> {
    this.logger.log('🏥 Starting application health checks...');

    const checks: HealthCheckResult[] = [];
    const startTime = Date.now();

    try {
      // Perform all health checks in parallel for faster startup
      // Redis health check disabled - Redis not in use
      const healthCheckPromises = [
        this.checkDatabaseHealth(),
        this.checkRedisHealth(),  // Disabled - Redis removed from project
        this.checkApplicationHealth(),
      ];

      const results = await Promise.allSettled(healthCheckPromises);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          checks.push(result.value);
        } else {
          const serviceNames = ['database', 'redis', 'application'];
          checks.push({
            service: serviceNames[index],
            status: 'unhealthy',
            message: `Health check failed: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`,
            details: { error: result.reason },
          });
        }
      });

      const overall = this.determineOverallHealth(checks);
      const totalTime = Date.now() - startTime;

      this.logger.log(
        `🏥 Health checks completed in ${totalTime}ms - Overall status: ${overall.toUpperCase()}`,
      );

      return {
        overall,
        checks,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('💥 Unexpected error during health checks:', error);

      return {
        overall: 'unhealthy',
        checks: [
          {
            service: 'health_check_system',
            status: 'unhealthy',
            message: `Health check system failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: { error },
          },
        ],
        timestamp: new Date(),
      };
    }
  }

  /**
   * Performs database health check with connection pooling validation
   */
  private async checkDatabaseHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      this.logger.debug('Checking database health...');

      const dbConfigResult = ConnectionConfigFactory.createDatabaseConfig();
      if (!dbConfigResult.isValid) {
        return {
          service: 'database',
          status: 'unhealthy',
          message: 'Database configuration is invalid',
          responseTime: Date.now() - startTime,
          details: {
            configErrors: dbConfigResult.errors,
            reason: 'invalid_configuration',
          },
        };
      }

      const db = new Db(dbConfigResult.data);

      // Test basic connection
      const connectionTest = await this.timeoutPromise(
        db.testConnection(),
        10000, // 10 second timeout
        'Database connection timeout',
      );

      if (!connectionTest) {
        await db.close();
        return {
          service: 'database',
          status: 'unhealthy',
          message: 'Database connection test failed',
          responseTime: Date.now() - startTime,
          details: { reason: 'connection_failed' },
        };
      }

      // Test query execution
      const queryStartTime = Date.now();
      try {
        const result = await this.timeoutPromise(
          db.knex.raw('SELECT 1 as test, NOW() as timestamp'),
          5000, // 5 second timeout for query
          'Database query timeout',
        );

        const queryTime = Date.now() - queryStartTime;

        // Test connection pool status
        const poolInfo = this.getConnectionPoolInfo(db);

        await db.close();

        // Determine health status based on response time
        let status: 'healthy' | 'degraded' = 'healthy';
        if (queryTime > 2000) {
          status = 'degraded';
        }

        return {
          service: 'database',
          status,
          message:
            status === 'healthy'
              ? 'Database is healthy'
              : 'Database is responding slowly',
          responseTime: Date.now() - startTime,
          details: {
            queryTime,
            poolInfo,
            serverTime: result[0]?.timestamp,
            reason: 'connection_successful',
          },
        };
      } catch (queryError) {
        await db.close();
        return {
          service: 'database',
          status: 'unhealthy',
          message: `Database query test failed: ${queryError instanceof Error ? queryError.message : 'Unknown error'}`,
          responseTime: Date.now() - startTime,
          details: {
            queryError:
              queryError instanceof Error ? queryError.message : queryError,
            reason: 'query_failed',
          },
        };
      }
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : error,
          reason: 'health_check_error',
        },
      };
    }
  }

  private async checkRedisHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      this.logger.debug('Checking Redis health...');

      const isRedisEnabled = this.configService.get<string | boolean>('REDIS_ENABLED');
      // Explicitly check for false (boolean) or 'false' (string) just in case
      if (isRedisEnabled === false || isRedisEnabled === 'false') {
        return {
          service: 'redis',
          status: 'healthy',
          message: 'Redis is disabled',
          responseTime: 0,
          details: { reason: 'disabled_by_config' },
        };
      }

      const redisConfigResult = ConnectionConfigFactory.createRedisConfig();
      if (!redisConfigResult.isValid) {
        // Redis is optional, so configuration errors result in degraded status
        return {
          service: 'redis',
          status: 'degraded',
          message: 'Redis configuration is invalid - caching disabled',
          responseTime: Date.now() - startTime,
          details: {
            configErrors: redisConfigResult.errors,
            reason: 'invalid_configuration',
          },
        };
      }

      const redisService = new RedisCacheService(
        this.logger as unknown as ILogger,
        redisConfigResult.data,
      );

      // Test basic Redis operations
      const testKey = `health_check_${Date.now()}`;
      const testValue = 'health_check_value';

      // Test SET operation
      const setStartTime = Date.now();
      await this.timeoutPromise(
        redisService.set(testKey, testValue, 30), // 30 second TTL
        5000, // 5 second timeout
        'Redis SET operation timeout',
      );
      const setTime = Date.now() - setStartTime;

      // Test GET operation
      const getStartTime = Date.now();
      const retrievedValue = await this.timeoutPromise(
        redisService.get(testKey),
        5000, // 5 second timeout
        'Redis GET operation timeout',
      );
      const getTime = Date.now() - getStartTime;

      // Test DELETE operation
      const delStartTime = Date.now();
      await this.timeoutPromise(
        redisService.delete(testKey),
        5000, // 5 second timeout
        'Redis DEL operation timeout',
      );
      const delTime = Date.now() - delStartTime;

      await redisService.disconnect();

      // Validate operations
      if (retrievedValue !== testValue) {
        return {
          service: 'redis',
          status: 'unhealthy',
          message: 'Redis data integrity test failed',
          responseTime: Date.now() - startTime,
          details: {
            expected: testValue,
            received: retrievedValue,
            setTime,
            getTime,
            delTime,
            reason: 'data_integrity_failed',
          },
        };
      }

      // Determine health status based on response times
      const totalOperationTime = setTime + getTime + delTime;
      let status: 'healthy' | 'degraded' = 'healthy';
      if (totalOperationTime > 1000) {
        status = 'degraded';
      }

      return {
        service: 'redis',
        status,
        message:
          status === 'healthy'
            ? 'Redis is healthy'
            : 'Redis is responding slowly',
        responseTime: Date.now() - startTime,
        details: {
          operationTimes: {
            set: setTime,
            get: getTime,
            del: delTime,
            total: totalOperationTime,
          },
          reason: 'operations_successful',
        },
      };
    } catch (error) {
      // Redis failures are degraded, not unhealthy, since caching is optional
      return {
        service: 'redis',
        status: 'degraded',
        message: `Redis health check failed - caching disabled: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : error,
          reason: 'health_check_error',
        },
      };
    }
  }

  /**
   * Performs application-level health checks
   */
  private async checkApplicationHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      this.logger.debug('Checking application health...');

      const details: Record<string, any> = {};

      // Check memory usage
      const memoryUsage = process.memoryUsage();
      details.memory = {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      };

      // Check CPU usage (basic check)
      const cpuUsage = process.cpuUsage();
      details.cpu = {
        user: cpuUsage.user,
        system: cpuUsage.system,
      };

      // Check uptime
      details.uptime = process.uptime();

      // Check Node.js version
      details.nodeVersion = process.version;

      // Check environment
      details.environment = this.configService.get('NODE_ENV', 'development');

      // Check port availability
      const port = this.configService.get('PORT', 3000);
      details.port = port;

      // Basic application configuration checks
      const configChecks = {
        jwtSecret: !!this.configService.get('JWT_SECRET'),
        jwtRefreshSecret: !!this.configService.get('JWT_REFRESH_SECRET'),
        corsOrigins: !!this.configService.get('CORS_ORIGINS'),
        logLevel: !!this.configService.get('LOG_LEVEL'),
      };
      details.configuration = configChecks;

      // Determine health status
      let status: 'healthy' | 'degraded' = 'healthy';
      let message = 'Application is healthy';

      // Check for potential issues
      if (details.memory.heapUsed > 512) {
        // More than 512MB heap usage
        status = 'degraded';
        message = 'Application memory usage is high';
      }

      if (!configChecks.jwtSecret || !configChecks.jwtRefreshSecret) {
        status = 'degraded';
        message = 'Critical configuration is missing';
      }

      return {
        service: 'application',
        status,
        message,
        responseTime: Date.now() - startTime,
        details,
      };
    } catch (error) {
      return {
        service: 'application',
        status: 'unhealthy',
        message: `Application health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : error,
          reason: 'health_check_error',
        },
      };
    }
  }

  /**
   * Determines overall health status based on individual service checks
   */
  private determineOverallHealth(
    checks: HealthCheckResult[],
  ): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = checks.map((check) => check.status);

    // If any critical service is unhealthy, overall is unhealthy
    const criticalServices = ['database', 'application'];
    const criticalChecks = checks.filter((check) =>
      criticalServices.includes(check.service),
    );

    if (criticalChecks.some((check) => check.status === 'unhealthy')) {
      return 'unhealthy';
    }

    // If any service is degraded, overall is degraded
    if (statuses.includes('degraded')) {
      return 'degraded';
    }

    // If all services are healthy, overall is healthy
    return 'healthy';
  }

  /**
   * Gets connection pool information from database instance
   */
  private getConnectionPoolInfo(db: Db): Record<string, any> {
    try {
      // Access Knex pool information if available
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
   * Wraps a promise with a timeout
   */
  private async timeoutPromise<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string,
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Formats health check results for display
   */
  formatHealthCheckResults(result: StartupHealthCheckResult): string {
    const lines: string[] = [];

    lines.push('🏥 Startup Health Check Results');
    lines.push('='.repeat(40));
    lines.push(
      `Overall Status: ${this.getStatusEmoji(result.overall)} ${result.overall.toUpperCase()}`,
    );
    lines.push(`Timestamp: ${result.timestamp}`);
    lines.push('');

    result.checks.forEach((check) => {
      lines.push(
        `${this.getStatusEmoji(check.status)} ${check.service.toUpperCase()}`,
      );
      lines.push(`  Status: ${check.status}`);
      lines.push(`  Message: ${check.message}`);
      if (check.responseTime !== undefined) {
        lines.push(`  Response Time: ${check.responseTime}ms`);
      }
      if (check.details) {
        lines.push(
          `  Details: ${JSON.stringify(check.details, null, 2).split('\n').join('\n    ')}`,
        );
      }
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Gets emoji for health status
   */
  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'degraded':
        return '⚠️';
      case 'unhealthy':
        return '❌';
      default:
        return '❓';
    }
  }
}
