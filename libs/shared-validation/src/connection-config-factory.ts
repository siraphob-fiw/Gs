import Joi from 'joi';
import {
  DatabaseConnectionConfig,
  RedisConnectionConfig,
  ConnectionConfigValidationResult,
  ConnectionConfigValidationError,
  JoiConnectionSchemas,
  CONNECTION_ENV_VARS,
  DEFAULT_CONNECTION_CONFIG,
  CONNECTION_URL_PATTERNS
} from './connection-config-schemas';

/**
 * Factory class for creating and validating database and Redis connection configurations
 * Handles environment variable parsing, URL parsing, and configuration validation
 */
export class ConnectionConfigFactory {
  /**
   * Creates a database connection configuration from environment variables
   * Supports both individual environment variables and DATABASE_URL connection string
   */
  static createDatabaseConfig(): ConnectionConfigValidationResult<DatabaseConnectionConfig> {
    try {
      const config = this.parseDatabaseEnvironment();
      const validationResult = this.validateDatabaseConfig(config);
      
      if (!validationResult.isValid) {
        return validationResult;
      }

      // Log successful configuration creation (without sensitive data)
      this.logConfigurationSuccess('database', {
        host: config.host,
        port: config.port,
        database: config.database,
        ssl: config.ssl,
        pool: config.pool,
        timeout: config.timeout
      });

      return {
        isValid: true,
        data: config
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'database_config',
          message: `Failed to create database configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
          constraint: 'configuration_creation_failed'
        }]
      };
    }
  }

  /**
   * Creates a Redis connection configuration from environment variables
   * Supports both individual environment variables and REDIS_URL connection string
   */
  static createRedisConfig(): ConnectionConfigValidationResult<RedisConnectionConfig> {
    try {
      const config = this.parseRedisEnvironment();
      const validationResult = this.validateRedisConfig(config);
      
      if (!validationResult.isValid) {
        return validationResult;
      }

      // Log successful configuration creation (without sensitive data)
      this.logConfigurationSuccess('redis', {
        host: config.host,
        port: config.port,
        db: config.db,
        pool: config.pool,
        timeout: config.timeout
      });

      return {
        isValid: true,
        data: config
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'redis_config',
          message: `Failed to create Redis configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
          constraint: 'configuration_creation_failed'
        }]
      };
    }
  }

  /**
   * Validates a database configuration object
   */
  static validateDatabaseConfig(config: any): ConnectionConfigValidationResult<DatabaseConnectionConfig> {
    const { error, value } = JoiConnectionSchemas.databaseConnection.validate(config, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors: ConnectionConfigValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
        constraint: detail.type
      }));

      return {
        isValid: false,
        errors
      };
    }

    return {
      isValid: true,
      data: value
    };
  }

  /**
   * Validates a Redis configuration object
   */
  static validateRedisConfig(config: any): ConnectionConfigValidationResult<RedisConnectionConfig> {
    const { error, value } = JoiConnectionSchemas.redisConnection.validate(config, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors: ConnectionConfigValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
        constraint: detail.type
      }));

      return {
        isValid: false,
        errors
      };
    }

    return {
      isValid: true,
      data: value
    };
  }

  /**
   * Parses a PostgreSQL connection URL into individual configuration components
   * Format: postgresql://user:password@host:port/database?ssl=true
   */
  static parsePostgreSQLUrl(url: string): Partial<DatabaseConnectionConfig> {
    const match = url.match(CONNECTION_URL_PATTERNS.POSTGRESQL);
    
    if (!match) {
      throw new Error('Invalid PostgreSQL connection URL format. Expected: postgresql://user:password@host:port/database');
    }

    const [, username, password, host, portStr, database, queryString] = match;
    const port = parseInt(portStr, 10);
    
    // Parse query parameters for SSL and other options
    const queryParams = new URLSearchParams(queryString?.substring(1) || '');
    const ssl = queryParams.get('ssl') === 'true' || queryParams.get('sslmode') === 'require';

    return {
      host,
      port,
      database,
      username,
      password,
      ssl
    };
  }

  /**
   * Parses a Redis connection URL into individual configuration components
   * Format: redis://[:password@]host:port[/db]
   */
  static parseRedisUrl(url: string): Partial<RedisConnectionConfig> {
    const match = url.match(CONNECTION_URL_PATTERNS.REDIS);
    
    if (!match) {
      throw new Error('Invalid Redis connection URL format. Expected: redis://[:password@]host:port[/db]');
    }

    const [, password, host, portStr, dbStr] = match;
    const port = parseInt(portStr, 10);
    const db = dbStr ? parseInt(dbStr, 10) : 0;

    return {
      host,
      port,
      password: password || undefined,
      db
    };
  }

  /**
   * Parses database configuration from environment variables
   * Prioritizes DATABASE_URL if available, falls back to individual variables
   */
  private static parseDatabaseEnvironment(): DatabaseConnectionConfig {
    const env = process.env;
    
    // Try to parse from DATABASE_URL first
    if (env[CONNECTION_ENV_VARS.DATABASE.URL]) {
      const urlConfig = this.parsePostgreSQLUrl(env[CONNECTION_ENV_VARS.DATABASE.URL]!);
      
      // Merge URL config with individual environment variables (individual vars take precedence)
      return {
        host: env[CONNECTION_ENV_VARS.DATABASE.HOST] || urlConfig.host || DEFAULT_CONNECTION_CONFIG.DATABASE.HOST,
        port: this.parseIntegerEnv(CONNECTION_ENV_VARS.DATABASE.PORT) || urlConfig.port || DEFAULT_CONNECTION_CONFIG.DATABASE.PORT,
        database: env[CONNECTION_ENV_VARS.DATABASE.NAME] || urlConfig.database || '',
        username: env[CONNECTION_ENV_VARS.DATABASE.USER] || urlConfig.username || '',
        password: env[CONNECTION_ENV_VARS.DATABASE.PASSWORD] || urlConfig.password || '',
        ssl: this.parseBooleanEnv(CONNECTION_ENV_VARS.DATABASE.SSL) ?? urlConfig.ssl ?? DEFAULT_CONNECTION_CONFIG.DATABASE.SSL,
        timezone: this.parseTimezoneEnv(CONNECTION_ENV_VARS.DATABASE.TIMEZONE) ?? DEFAULT_CONNECTION_CONFIG.DATABASE.TIMEZONE,
        pool: {
          min: this.parseIntegerEnv(CONNECTION_ENV_VARS.DATABASE.POOL_MIN) || DEFAULT_CONNECTION_CONFIG.DATABASE.POOL_MIN,
          max: this.parseIntegerEnv(CONNECTION_ENV_VARS.DATABASE.POOL_MAX) || DEFAULT_CONNECTION_CONFIG.DATABASE.POOL_MAX
        },
        timeout: this.parseIntegerEnv(CONNECTION_ENV_VARS.DATABASE.TIMEOUT) || DEFAULT_CONNECTION_CONFIG.DATABASE.TIMEOUT
      };
    }

    // Parse from individual environment variables
    return {
      host: env[CONNECTION_ENV_VARS.DATABASE.HOST] || DEFAULT_CONNECTION_CONFIG.DATABASE.HOST,
      port: this.parseIntegerEnv(CONNECTION_ENV_VARS.DATABASE.PORT) || DEFAULT_CONNECTION_CONFIG.DATABASE.PORT,
      database: env[CONNECTION_ENV_VARS.DATABASE.NAME] || '',
      username: env[CONNECTION_ENV_VARS.DATABASE.USER] || '',
      password: env[CONNECTION_ENV_VARS.DATABASE.PASSWORD] || '',
      ssl: this.parseBooleanEnv(CONNECTION_ENV_VARS.DATABASE.SSL) ?? DEFAULT_CONNECTION_CONFIG.DATABASE.SSL,
      timezone: this.parseTimezoneEnv(CONNECTION_ENV_VARS.DATABASE.TIMEZONE) ?? DEFAULT_CONNECTION_CONFIG.DATABASE.TIMEZONE,
      pool: {
        min: this.parseIntegerEnv(CONNECTION_ENV_VARS.DATABASE.POOL_MIN) || DEFAULT_CONNECTION_CONFIG.DATABASE.POOL_MIN,
        max: this.parseIntegerEnv(CONNECTION_ENV_VARS.DATABASE.POOL_MAX) || DEFAULT_CONNECTION_CONFIG.DATABASE.POOL_MAX
      },
      timeout: this.parseIntegerEnv(CONNECTION_ENV_VARS.DATABASE.TIMEOUT) || DEFAULT_CONNECTION_CONFIG.DATABASE.TIMEOUT
    };
  }

  /**
   * Parses Redis configuration from environment variables
   * Prioritizes REDIS_URL if available, falls back to individual variables
   */
  private static parseRedisEnvironment(): RedisConnectionConfig {
    const env = process.env;
    
    // Try to parse from REDIS_URL first
    if (env[CONNECTION_ENV_VARS.REDIS.URL]) {
      const urlConfig = this.parseRedisUrl(env[CONNECTION_ENV_VARS.REDIS.URL]!);
      
      // Merge URL config with individual environment variables (individual vars take precedence)
      return {
        host: env[CONNECTION_ENV_VARS.REDIS.HOST] || urlConfig.host || DEFAULT_CONNECTION_CONFIG.REDIS.HOST,
        port: this.parseIntegerEnv(CONNECTION_ENV_VARS.REDIS.PORT) || urlConfig.port || DEFAULT_CONNECTION_CONFIG.REDIS.PORT,
        password: env[CONNECTION_ENV_VARS.REDIS.PASSWORD] || urlConfig.password,
        db: this.parseIntegerEnv(CONNECTION_ENV_VARS.REDIS.DB) ?? urlConfig.db ?? DEFAULT_CONNECTION_CONFIG.REDIS.DB,
        timeout: this.parseIntegerEnv(CONNECTION_ENV_VARS.REDIS.TIMEOUT) || DEFAULT_CONNECTION_CONFIG.REDIS.TIMEOUT,
        pool: {
          min: this.parseIntegerEnv(CONNECTION_ENV_VARS.REDIS.POOL_MIN) || DEFAULT_CONNECTION_CONFIG.REDIS.POOL_MIN,
          max: this.parseIntegerEnv(CONNECTION_ENV_VARS.REDIS.POOL_MAX) || DEFAULT_CONNECTION_CONFIG.REDIS.POOL_MAX
        }
      };
    }

    // Parse from individual environment variables
    return {
      host: env[CONNECTION_ENV_VARS.REDIS.HOST] || DEFAULT_CONNECTION_CONFIG.REDIS.HOST,
      port: this.parseIntegerEnv(CONNECTION_ENV_VARS.REDIS.PORT) || DEFAULT_CONNECTION_CONFIG.REDIS.PORT,
      password: env[CONNECTION_ENV_VARS.REDIS.PASSWORD],
      db: this.parseIntegerEnv(CONNECTION_ENV_VARS.REDIS.DB) ?? DEFAULT_CONNECTION_CONFIG.REDIS.DB,
      timeout: this.parseIntegerEnv(CONNECTION_ENV_VARS.REDIS.TIMEOUT) || DEFAULT_CONNECTION_CONFIG.REDIS.TIMEOUT,
      pool: {
        min: this.parseIntegerEnv(CONNECTION_ENV_VARS.REDIS.POOL_MIN) || DEFAULT_CONNECTION_CONFIG.REDIS.POOL_MIN,
        max: this.parseIntegerEnv(CONNECTION_ENV_VARS.REDIS.POOL_MAX) || DEFAULT_CONNECTION_CONFIG.REDIS.POOL_MAX
      }
    };
  }

  /**
   * Safely parses an integer from environment variable
   */
  private static parseIntegerEnv(envVar: string): number | undefined {
    const value = process.env[envVar];
    if (!value) return undefined;
    
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Safely parses a boolean from environment variable
   */
  private static parseBooleanEnv(envVar: string): boolean | undefined {
    const value = process.env[envVar];
    if (!value) return undefined;
    
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
      return true;
    }
    if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
      return false;
    }
    
    return undefined;
  }

  /**
   * Safely parses a timezone from environment variable
   */
  private static parseTimezoneEnv(envVar: string): string | false | undefined {
    const value = process.env[envVar];
    if (!value) return undefined;
    
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
      return false;
    }
    
    // Validate timezone string
    const validTimezones = ['utc', 'gmt'];
    if (validTimezones.includes(lowerValue)) {
      return lowerValue.toUpperCase();
    }
    
    return undefined;
  }

  /**
   * Logs successful configuration creation without exposing sensitive information
   */
  private static logConfigurationSuccess(service: 'database' | 'redis', config: any): void {
    // Create a safe version of the config for logging (no passwords or sensitive data)
    const safeConfig = { ...config };
    
    // Remove or mask sensitive fields
    if ('password' in safeConfig) {
      delete safeConfig.password;
    }
    if ('username' in safeConfig) {
      safeConfig.username = this.maskSensitiveValue(safeConfig.username);
    }

    console.log(`✅ ${service.charAt(0).toUpperCase() + service.slice(1)} configuration created successfully:`, safeConfig);
  }

  /**
   * Masks sensitive values for logging
   */
  private static maskSensitiveValue(value: string): string {
    if (!value || value.length <= 2) {
      return '***';
    }
    
    const visibleChars = Math.min(2, Math.floor(value.length / 3));
    const maskedLength = value.length - visibleChars;
    
    return value.substring(0, visibleChars) + '*'.repeat(maskedLength);
  }

  /**
   * Gets a list of required environment variables for database configuration
   */
  static getRequiredDatabaseEnvVars(): string[] {
    return [
      CONNECTION_ENV_VARS.DATABASE.NAME,
      CONNECTION_ENV_VARS.DATABASE.USER,
      CONNECTION_ENV_VARS.DATABASE.PASSWORD
    ];
  }

  /**
   * Gets a list of required environment variables for Redis configuration
   */
  static getRequiredRedisEnvVars(): string[] {
    return [
      // Redis has no strictly required vars as it can use all defaults
      // But host is typically required in production
    ];
  }

  /**
   * Gets a list of all supported environment variables for database configuration
   */
  static getAllDatabaseEnvVars(): string[] {
    return Object.values(CONNECTION_ENV_VARS.DATABASE);
  }

  /**
   * Gets a list of all supported environment variables for Redis configuration
   */
  static getAllRedisEnvVars(): string[] {
    return Object.values(CONNECTION_ENV_VARS.REDIS);
  }

  /**
   * Validates that all required environment variables are present
   */
  static validateRequiredEnvVars(): ConnectionConfigValidationResult<{ database: boolean; redis: boolean }> {
    const errors: ConnectionConfigValidationError[] = [];
    
    // Check required database environment variables
    const requiredDbVars = this.getRequiredDatabaseEnvVars();
    const missingDbVars = requiredDbVars.filter(envVar => !process.env[envVar] && !process.env[CONNECTION_ENV_VARS.DATABASE.URL]);
    
    if (missingDbVars.length > 0 && !process.env[CONNECTION_ENV_VARS.DATABASE.URL]) {
      errors.push({
        field: 'database_environment',
        message: `Missing required database environment variables: ${missingDbVars.join(', ')}. Alternatively, provide ${CONNECTION_ENV_VARS.DATABASE.URL}`,
        constraint: 'required_env_vars_missing'
      });
    }

    // Redis doesn't have strictly required vars, but we can check if any Redis config is provided
    const hasRedisConfig = Object.values(CONNECTION_ENV_VARS.REDIS).some(envVar => process.env[envVar]);
    
    if (errors.length > 0) {
      return {
        isValid: false,
        errors
      };
    }

    return {
      isValid: true,
      data: {
        database: true,
        redis: hasRedisConfig
      }
    };
  }
}

// Standardized error types for connection configuration
export class ConfigurationError extends Error {
  constructor(
    public readonly field: string,
    public readonly value: any,
    public readonly constraint: string
  ) {
    super(`Configuration error for ${field}: ${constraint}`);
    this.name = 'ConfigurationError';
  }
}

export class ConnectionError extends Error {
  constructor(
    public readonly service: 'database' | 'redis',
    public readonly originalError: Error
  ) {
    super(`Failed to connect to ${service}: ${originalError.message}`);
    this.name = 'ConnectionError';
  }
}

// Export utility functions for external use
export const ConnectionConfigUtils = {
  /**
   * Creates a masked connection string for logging purposes
   */
  createMaskedConnectionString: (config: DatabaseConnectionConfig | RedisConnectionConfig): string => {
    if ('database' in config) {
      // Database connection
      const maskedPassword = config.password ? '***' : '';
      return `${config.username}:${maskedPassword}@${config.host}:${config.port}/${config.database}`;
    } else {
      // Redis connection
      const maskedPassword = config.password ? ':***@' : '';
      return `redis://${maskedPassword}${config.host}:${config.port}/${config.db}`;
    }
  },

  /**
   * Validates connection URL format without parsing
   */
  isValidConnectionUrl: (url: string, type: 'postgresql' | 'redis'): boolean => {
    try {
      if (type === 'postgresql') {
        return CONNECTION_URL_PATTERNS.POSTGRESQL.test(url);
      } else {
        return CONNECTION_URL_PATTERNS.REDIS.test(url);
      }
    } catch {
      return false;
    }
  },

  /**
   * Gets environment variable documentation
   */
  getEnvVarDocumentation: () => ({
    database: {
      required: ConnectionConfigFactory.getRequiredDatabaseEnvVars(),
      optional: ConnectionConfigFactory.getAllDatabaseEnvVars().filter(
        envVar => !ConnectionConfigFactory.getRequiredDatabaseEnvVars().includes(envVar)
      ),
      defaults: DEFAULT_CONNECTION_CONFIG.DATABASE
    },
    redis: {
      required: ConnectionConfigFactory.getRequiredRedisEnvVars(),
      optional: ConnectionConfigFactory.getAllRedisEnvVars(),
      defaults: DEFAULT_CONNECTION_CONFIG.REDIS
    }
  })
};