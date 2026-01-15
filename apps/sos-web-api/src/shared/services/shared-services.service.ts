import { Injectable, Inject } from '@nestjs/common';
import { IDb } from '@strengthos/shared-database';
import { IRedisCacheService } from '@strengthos/shared-cache';
import { ILogger } from '@strengthos/shared-logging';
import {
  AuthenticationService,
  AccessControlService,
  SecurityMonitoringService,
} from '@strengthos/shared-security';

/**
 * Service demonstrating how to inject and use shared library services
 * This service can be used as a reference for other services in the application
 * Note: Redis is disabled - using in-memory cache only
 */
@Injectable()
export class SharedServicesService {
  constructor(
    @Inject('IDb') private readonly database: IDb,
    @Inject('ILogger') private readonly logger: ILogger,
    @Inject('AuthenticationService')
    private readonly authService: AuthenticationService,
    @Inject('AccessControlService')
    private readonly accessControl: AccessControlService,
    @Inject('SecurityMonitoringService')
    private readonly securityMonitoring: SecurityMonitoringService,
    @Inject('IRedisCacheService')
    private readonly cache: IRedisCacheService,
  ) {}

  /**
   * Test database connectivity
   */
  async testDatabaseConnection(): Promise<boolean> {
    try {
      await this.database.knex.raw('SELECT 1');
      await this.logger.info({
        message: 'Database connection test successful',
      });
      return true;
    } catch (error) {
      await this.logger.error({
        message: 'Database connection test failed',
        fullMessage: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Test cache connectivity (in-memory cache is always available)
   */
  async testCacheConnection(): Promise<boolean> {
    try {
      // In-memory cache is always available
      await this.logger.info({
        message: 'Cache connection test successful (in-memory mode)',
      });
      return true;
    } catch (error) {
      await this.logger.error({
        message: 'Cache connection test failed',
        fullMessage: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Get cache metrics
   */
  async getCacheMetrics() {
    try {
      const statsResult = await this.cache.getMetrics();
      if (statsResult.isOk) {
        await this.logger.info({
          message: 'Cache metrics retrieved successfully',
          fullMessage: JSON.stringify(statsResult.returnValue),
        });
        return statsResult.returnValue;
      } else {
        await this.logger.error({
          message: 'Failed to retrieve cache metrics',
        });
        return null;
      }
    } catch (error) {
      await this.logger.error({
        message: 'Error retrieving cache metrics',
        fullMessage: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Test logging functionality
   */
  async testLogging(): Promise<void> {
    await this.logger.info({ message: 'Testing info level logging' });
    await this.logger.warning({ message: 'Testing warning level logging' });
    await this.logger.debug({ message: 'Testing debug level logging' });
    await this.logger.error({
      message: 'Testing error level logging',
      fullMessage: 'This is a test error message',
    });
  }

  /**
   * Get all shared services status
   */
  async getSharedServicesStatus() {
    const status = {
      database: await this.testDatabaseConnection(),
      cache: await this.testCacheConnection(),
      logging: true, // Always available
      authentication: !!this.authService,
      accessControl: !!this.accessControl,
      securityMonitoring: !!this.securityMonitoring,
    };

    await this.logger.info({
      message: 'Shared services status check completed',
      fullMessage: JSON.stringify(status),
    });

    return status;
  }
}
