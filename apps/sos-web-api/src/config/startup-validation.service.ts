import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectionConfigFactory } from '@strengthos/shared-validation';
import { Db } from '@strengthos/shared-database';

export interface StartupValidationResult {
  isValid: boolean;
  errors: StartupValidationError[];
  warnings: StartupValidationWarning[];
}

export interface StartupValidationError {
  service: string;
  field: string;
  message: string;
  severity: 'critical' | 'error';
  suggestion?: string;
}

export interface StartupValidationWarning {
  service: string;
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Service responsible for validating all critical configurations at application startup
 * Implements fail-fast behavior for critical configuration errors
 */
@Injectable()
export class StartupValidationService {
  private readonly logger = new Logger(StartupValidationService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Performs comprehensive startup validation of all critical configurations
   * Returns validation result with errors and warnings
   */
  async validateStartupConfiguration(): Promise<StartupValidationResult> {
    const errors: StartupValidationError[] = [];
    const warnings: StartupValidationWarning[] = [];

    this.logger.log('🔍 Starting application configuration validation...');

    try {
      // 1. Validate environment variables presence
      await this.validateEnvironmentVariables(errors, warnings);

      // 2. Validate database configuration
      await this.validateDatabaseConfiguration(errors, warnings);

      // 3. Redis validation disabled - using in-memory cache only
      // await this.validateRedisConfiguration(errors, warnings);

      // 4. Validate application-specific configuration
      await this.validateApplicationConfiguration(errors, warnings);

      // 5. Test actual connections if configuration is valid
      if (errors.filter((e) => e.severity === 'critical').length === 0) {
        // Skip connection tests in test environment to avoid external dependencies
        if (process.env.NODE_ENV !== 'test') {
          await this.validateConnections(errors, warnings);
        }
      }

      const isValid = errors.length === 0;

      if (isValid) {
        this.logger.log(
          '✅ All startup configuration validation checks passed',
        );
      } else {
        this.logger.error(
          `❌ Startup configuration validation failed with ${errors.length} errors and ${warnings.length} warnings`,
        );
      }

      return {
        isValid,
        errors,
        warnings,
      };
    } catch (error) {
      this.logger.error(
        '💥 Unexpected error during startup validation:',
        error,
      );

      errors.push({
        service: 'startup_validation',
        field: 'validation_process',
        message: `Unexpected error during validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical',
        suggestion: 'Check application logs for detailed error information',
      });

      return {
        isValid: false,
        errors,
        warnings,
      };
    }
  }

  /**
   * Validates that all required environment variables are present
   */
  private async validateEnvironmentVariables(
    errors: StartupValidationError[],
    warnings: StartupValidationWarning[],
  ): Promise<void> {
    this.logger.debug('Validating environment variables...');

    // Validate required environment variables using ConnectionConfigFactory
    const envValidation = ConnectionConfigFactory.validateRequiredEnvVars();

    if (!envValidation.isValid) {
      envValidation.errors.forEach((error) => {
        errors.push({
          service: 'environment',
          field: error.field,
          message: error.message,
          severity: 'critical',
          suggestion: this.getEnvironmentVariableSuggestion(error.field),
        });
      });
    }

    // Check for NODE_ENV
    const nodeEnv = this.configService.get('NODE_ENV');
    if (!nodeEnv) {
      warnings.push({
        service: 'environment',
        field: 'NODE_ENV',
        message: 'NODE_ENV is not set, defaulting to development',
        suggestion: 'Set NODE_ENV to production, staging, or development',
      });
    }

    // Check for critical application variables
    const criticalVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
    criticalVars.forEach((varName) => {
      const value = this.configService.get(varName);
      if (!value) {
        errors.push({
          service: 'environment',
          field: varName,
          message: `${varName} is required but not set`,
          severity: 'critical',
          suggestion: `Set ${varName} environment variable with a secure random string`,
        });
      } else if (value.length < 32) {
        warnings.push({
          service: 'environment',
          field: varName,
          message: `${varName} should be at least 32 characters long for security`,
          suggestion: 'Use a longer, more secure secret key',
        });
      }
    });
  }

  /**
   * Validates database configuration using ConnectionConfigFactory
   */
  private async validateDatabaseConfiguration(
    errors: StartupValidationError[],
    warnings: StartupValidationWarning[],
  ): Promise<void> {
    this.logger.debug('Validating database configuration...');

    try {
      const dbConfigResult = ConnectionConfigFactory.createDatabaseConfig();

      if (!dbConfigResult.isValid) {
        dbConfigResult.errors.forEach((error) => {
          errors.push({
            service: 'database',
            field: error.field,
            message: error.message,
            severity: 'critical',
            suggestion: this.getDatabaseConfigSuggestion(
              error.field,
              error.constraint,
            ),
          });
        });
        return;
      }

      const dbConfig = dbConfigResult.data;

      // Additional database-specific validations
      if (dbConfig.pool.max < dbConfig.pool.min) {
        errors.push({
          service: 'database',
          field: 'pool_configuration',
          message: 'Database pool max size cannot be less than min size',
          severity: 'error',
          suggestion:
            'Ensure DATABASE_POOL_MAX is greater than or equal to DATABASE_POOL_MIN',
        });
      }

      if (dbConfig.pool.max > 50) {
        warnings.push({
          service: 'database',
          field: 'pool_max',
          message:
            'Database pool max size is very high, this may cause resource issues',
          suggestion:
            'Consider reducing DATABASE_POOL_MAX to a more reasonable value (10-20)',
        });
      }

      if (dbConfig.timeout < 5000) {
        warnings.push({
          service: 'database',
          field: 'timeout',
          message:
            'Database timeout is very low, this may cause connection issues',
          suggestion: 'Consider increasing DATABASE_TIMEOUT to at least 5000ms',
        });
      }

      // Production-specific validations
      const nodeEnv = this.configService.get('NODE_ENV');
      if (nodeEnv === 'production') {
        if (!dbConfig.ssl) {
          warnings.push({
            service: 'database',
            field: 'ssl',
            message: 'SSL is not enabled for database connection in production',
            suggestion:
              'Enable SSL by setting DATABASE_SSL=true for production environments',
          });
        }

        if (dbConfig.host === 'localhost' || dbConfig.host === '127.0.0.1') {
          warnings.push({
            service: 'database',
            field: 'host',
            message: 'Database host is localhost in production environment',
            suggestion: 'Use a proper database host for production deployment',
          });
        }
      }
    } catch (error) {
      errors.push({
        service: 'database',
        field: 'configuration',
        message: `Failed to validate database configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical',
        suggestion: 'Check database environment variables and configuration',
      });
    }
  }

  /**
   * Validates Redis configuration using ConnectionConfigFactory
   */
  private async validateRedisConfiguration(
    errors: StartupValidationError[],
    warnings: StartupValidationWarning[],
  ): Promise<void> {
    this.logger.debug('Validating Redis configuration...');

    try {
      const redisConfigResult = ConnectionConfigFactory.createRedisConfig();

      if (!redisConfigResult.isValid) {
        redisConfigResult.errors.forEach((error) => {
          // Redis errors are typically non-critical as caching is optional
          warnings.push({
            service: 'redis',
            field: error.field,
            message: error.message,
            suggestion: this.getRedisConfigSuggestion(
              error.field,
              error.constraint,
            ),
          });
        });
        return;
      }

      const redisConfig = redisConfigResult.data;

      // Additional Redis-specific validations
      if (redisConfig.pool.max < redisConfig.pool.min) {
        warnings.push({
          service: 'redis',
          field: 'pool_configuration',
          message: 'Redis pool max size cannot be less than min size',
          suggestion:
            'Ensure REDIS_POOL_MAX is greater than or equal to REDIS_POOL_MIN',
        });
      }

      if (redisConfig.timeout < 1000) {
        warnings.push({
          service: 'redis',
          field: 'timeout',
          message:
            'Redis timeout is very low, this may cause connection issues',
          suggestion: 'Consider increasing REDIS_TIMEOUT to at least 1000ms',
        });
      }

      // Production-specific validations
      const nodeEnv = this.configService.get('NODE_ENV');
      if (nodeEnv === 'production') {
        if (!redisConfig.password) {
          warnings.push({
            service: 'redis',
            field: 'password',
            message: 'Redis password is not set in production environment',
            suggestion: 'Set REDIS_PASSWORD for production security',
          });
        }

        if (
          redisConfig.host === 'localhost' ||
          redisConfig.host === '127.0.0.1'
        ) {
          warnings.push({
            service: 'redis',
            field: 'host',
            message: 'Redis host is localhost in production environment',
            suggestion: 'Use a proper Redis host for production deployment',
          });
        }
      }
    } catch (error) {
      warnings.push({
        service: 'redis',
        field: 'configuration',
        message: `Failed to validate Redis configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Check Redis environment variables and configuration',
      });
    }
  }

  /**
   * Validates application-specific configuration
   */
  private async validateApplicationConfiguration(
    errors: StartupValidationError[],
    warnings: StartupValidationWarning[],
  ): Promise<void> {
    this.logger.debug('Validating application configuration...');

    // Validate port configuration
    const port = this.configService.get('PORT', 3000);
    if (port < 1024 && process.getuid && process.getuid() !== 0) {
      warnings.push({
        service: 'application',
        field: 'port',
        message: 'Port is below 1024 and application is not running as root',
        suggestion: 'Use a port above 1024 or run with appropriate privileges',
      });
    }

    // Validate CORS configuration
    const corsOrigins = this.configService.get('CORS_ORIGINS', '*');
    const nodeEnv = this.configService.get('NODE_ENV');
    if (nodeEnv === 'production' && corsOrigins === '*') {
      warnings.push({
        service: 'application',
        field: 'cors_origins',
        message: 'CORS is set to allow all origins in production',
        suggestion:
          'Set CORS_ORIGINS to specific allowed origins for production security',
      });
    }

    // Validate logging configuration
    const logLevel = this.configService.get('LOG_LEVEL', 'info');
    const validLogLevels = ['error', 'warn', 'info', 'debug', 'verbose'];
    if (!validLogLevels.includes(logLevel)) {
      errors.push({
        service: 'application',
        field: 'log_level',
        message: `Invalid log level: ${logLevel}`,
        severity: 'error',
        suggestion: `Set LOG_LEVEL to one of: ${validLogLevels.join(', ')}`,
      });
    }

    // Validate rate limiting configuration
    const rateLimitMax = this.configService.get('RATE_LIMIT_MAX', 100);
    if (rateLimitMax < 10) {
      warnings.push({
        service: 'application',
        field: 'rate_limit_max',
        message: 'Rate limit max is very low, this may affect legitimate users',
        suggestion: 'Consider increasing RATE_LIMIT_MAX to a reasonable value',
      });
    }
  }

  /**
   * Tests actual connections to database and Redis
   */
  private async validateConnections(
    errors: StartupValidationError[],
    warnings: StartupValidationWarning[],
  ): Promise<void> {
    this.logger.debug('Testing database and Redis connections...');

    // Test database connection
    await this.testDatabaseConnection(errors, warnings);

    // Test Redis connection
    // await this.testRedisConnection(errors, warnings);
  }

  /**
   * Tests database connection health
   */
  private async testDatabaseConnection(
    errors: StartupValidationError[],
    _warnings: StartupValidationWarning[],
  ): Promise<void> {
    try {
      const dbConfigResult = ConnectionConfigFactory.createDatabaseConfig();
      if (!dbConfigResult.isValid) {
        return; // Skip connection test if config is invalid
      }

      const db = new Db(dbConfigResult.data);
      const isHealthy = await db.testConnection();

      if (isHealthy) {
        this.logger.log('✅ Database connection test successful');
      } else {
        errors.push({
          service: 'database',
          field: 'connection',
          message: 'Database connection test failed',
          severity: 'critical',
          suggestion:
            'Check database server availability and network connectivity',
        });
      }

      // Clean up test connection
      await db.close();
    } catch (error) {
      errors.push({
        service: 'database',
        field: 'connection',
        message: `Database connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical',
        suggestion: 'Verify database configuration and server availability',
      });
    }
  }

  /**
   * Provides specific suggestions for environment variable issues
   */
  private getEnvironmentVariableSuggestion(field: string): string {
    const suggestions: Record<string, string> = {
      database_environment:
        'Set DATABASE_URL or individual DATABASE_* variables (DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD)',
      redis_environment:
        'Set REDIS_URL or individual REDIS_* variables (REDIS_HOST, REDIS_PORT, etc.)',
      JWT_SECRET: 'Generate a secure random string: openssl rand -base64 32',
      JWT_REFRESH_SECRET:
        'Generate a different secure random string: openssl rand -base64 32',
    };

    return (
      suggestions[field] ||
      'Check environment variable documentation for proper configuration'
    );
  }

  /**
   * Provides specific suggestions for database configuration issues
   */
  private getDatabaseConfigSuggestion(
    field: string,
    _constraint?: string,
  ): string {
    const suggestions: Record<string, string> = {
      host: 'Set DATABASE_HOST to your database server hostname or IP address',
      port: 'Set DATABASE_PORT to your database server port (default: 5432 for PostgreSQL)',
      database: 'Set DATABASE_NAME to your database name',
      username: 'Set DATABASE_USER to your database username',
      password: 'Set DATABASE_PASSWORD to your database password',
      'pool.min':
        'Set DATABASE_POOL_MIN to minimum number of connections (recommended: 2-5)',
      'pool.max':
        'Set DATABASE_POOL_MAX to maximum number of connections (recommended: 10-20)',
      timeout:
        'Set DATABASE_TIMEOUT to connection timeout in milliseconds (recommended: 30000)',
    };

    return suggestions[field] || 'Check database configuration documentation';
  }

  /**
   * Provides specific suggestions for Redis configuration issues
   */
  private getRedisConfigSuggestion(
    field: string,
    _constraint?: string,
  ): string {
    const suggestions: Record<string, string> = {
      host: 'Set REDIS_HOST to your Redis server hostname or IP address',
      port: 'Set REDIS_PORT to your Redis server port (default: 6379)',
      password:
        'Set REDIS_PASSWORD if your Redis server requires authentication',
      db: 'Set REDIS_DB to Redis database number (default: 0)',
      timeout:
        'Set REDIS_TIMEOUT to connection timeout in milliseconds (recommended: 5000)',
      'pool.min':
        'Set REDIS_POOL_MIN to minimum number of connections (recommended: 1-2)',
      'pool.max':
        'Set REDIS_POOL_MAX to maximum number of connections (recommended: 5-10)',
    };

    return suggestions[field] || 'Check Redis configuration documentation';
  }

  /**
   * Formats validation results for display
   */
  formatValidationResults(result: StartupValidationResult): string {
    const lines: string[] = [];

    lines.push('🔍 Startup Configuration Validation Results');
    lines.push('='.repeat(50));

    if (result.errors.length > 0) {
      lines.push('\n❌ ERRORS:');
      result.errors.forEach((error) => {
        lines.push(
          `  • [${error.service.toUpperCase()}] ${error.field}: ${error.message}`,
        );
        if (error.suggestion) {
          lines.push(`    💡 Suggestion: ${error.suggestion}`);
        }
      });
    }

    if (result.warnings.length > 0) {
      lines.push('\n⚠️  WARNINGS:');
      result.warnings.forEach((warning) => {
        lines.push(
          `  • [${warning.service.toUpperCase()}] ${warning.field}: ${warning.message}`,
        );
        if (warning.suggestion) {
          lines.push(`    💡 Suggestion: ${warning.suggestion}`);
        }
      });
    }

    if (result.isValid) {
      lines.push('\n✅ All validation checks passed successfully!');
    } else {
      lines.push(
        `\n❌ Validation failed with ${result.errors.length} errors and ${result.warnings.length} warnings`,
      );
      lines.push(
        'Application startup will be aborted due to critical configuration issues.',
      );
    }

    return lines.join('\n');
  }
}
