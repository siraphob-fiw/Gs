import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConnectionConfigFactory, ConnectionConfigUtils, ConfigurationError, ConnectionError } from '../connection-config-factory';
import { CONNECTION_ENV_VARS, DEFAULT_CONNECTION_CONFIG, JoiConnectionSchemas } from '../connection-config-schemas';

describe('ConnectionConfigFactory', () => {
  // Store original environment variables
  const originalEnv = process.env;
  let consoleSpy: any;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
    
    // Clear all connection-related environment variables
    Object.values(CONNECTION_ENV_VARS.DATABASE).forEach(envVar => {
      delete process.env[envVar];
    });
    Object.values(CONNECTION_ENV_VARS.REDIS).forEach(envVar => {
      delete process.env[envVar];
    });

    // Mock console.log to capture secure logging
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
    
    // Restore console.log
    if (consoleSpy) {
      consoleSpy.mockRestore();
    }
  });

  describe('createDatabaseConfig', () => {
    it('should create valid database config from individual environment variables', () => {
      // Set up environment variables
      process.env[CONNECTION_ENV_VARS.DATABASE.HOST] = 'localhost';
      process.env[CONNECTION_ENV_VARS.DATABASE.PORT] = '5432';
      process.env[CONNECTION_ENV_VARS.DATABASE.NAME] = 'test_db';
      process.env[CONNECTION_ENV_VARS.DATABASE.USER] = 'test_user';
      process.env[CONNECTION_ENV_VARS.DATABASE.PASSWORD] = 'test_password';
      process.env[CONNECTION_ENV_VARS.DATABASE.SSL] = 'false';

      const result = ConnectionConfigFactory.createDatabaseConfig();

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        ssl: false,
        pool: {
          min: DEFAULT_CONNECTION_CONFIG.DATABASE.POOL_MIN,
          max: DEFAULT_CONNECTION_CONFIG.DATABASE.POOL_MAX
        },
        timeout: DEFAULT_CONNECTION_CONFIG.DATABASE.TIMEOUT
      });
    });

    it('should create valid database config from DATABASE_URL', () => {
      process.env[CONNECTION_ENV_VARS.DATABASE.URL] = 'postgresql://test_user:test_password@localhost:5432/test_db';

      const result = ConnectionConfigFactory.createDatabaseConfig();

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        ssl: false,
        pool: {
          min: DEFAULT_CONNECTION_CONFIG.DATABASE.POOL_MIN,
          max: DEFAULT_CONNECTION_CONFIG.DATABASE.POOL_MAX
        },
        timeout: DEFAULT_CONNECTION_CONFIG.DATABASE.TIMEOUT
      });
    });

    it('should prioritize individual env vars over DATABASE_URL', () => {
      process.env[CONNECTION_ENV_VARS.DATABASE.URL] = 'postgresql://url_user:url_password@url-host:5433/url_db';
      process.env[CONNECTION_ENV_VARS.DATABASE.HOST] = 'override-host';
      process.env[CONNECTION_ENV_VARS.DATABASE.USER] = 'override_user';
      // Need to provide all required fields for validation to pass
      process.env[CONNECTION_ENV_VARS.DATABASE.NAME] = 'override_db';
      process.env[CONNECTION_ENV_VARS.DATABASE.PASSWORD] = 'override_password';

      const result = ConnectionConfigFactory.createDatabaseConfig();

      expect(result.isValid).toBe(true);
      expect(result.data?.host).toBe('override-host');
      expect(result.data?.username).toBe('override_user');
      expect(result.data?.database).toBe('override_db'); // Should use individual var when set
      expect(result.data?.password).toBe('override_password'); // Should use individual var when set
    });

    it('should return validation errors for missing required fields', () => {
      // Only set host, missing required fields
      process.env[CONNECTION_ENV_VARS.DATABASE.HOST] = 'localhost';

      const result = ConnectionConfigFactory.createDatabaseConfig();

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      
      const errorFields = result.errors?.map(error => error.field) || [];
      expect(errorFields).toContain('database');
      expect(errorFields).toContain('username');
      expect(errorFields).toContain('password');
    });

    it('should return validation errors for invalid port', () => {
      process.env[CONNECTION_ENV_VARS.DATABASE.HOST] = 'localhost';
      process.env[CONNECTION_ENV_VARS.DATABASE.PORT] = '99999'; // Invalid port
      process.env[CONNECTION_ENV_VARS.DATABASE.NAME] = 'test_db';
      process.env[CONNECTION_ENV_VARS.DATABASE.USER] = 'test_user';
      process.env[CONNECTION_ENV_VARS.DATABASE.PASSWORD] = 'test_password';

      const result = ConnectionConfigFactory.createDatabaseConfig();

      expect(result.isValid).toBe(false);
      expect(result.errors?.some(error => error.field === 'port')).toBe(true);
    });
  });

  describe('createRedisConfig', () => {
    it('should create valid Redis config from individual environment variables', () => {
      process.env[CONNECTION_ENV_VARS.REDIS.HOST] = 'localhost';
      process.env[CONNECTION_ENV_VARS.REDIS.PORT] = '6379';
      process.env[CONNECTION_ENV_VARS.REDIS.PASSWORD] = 'redis_password';
      process.env[CONNECTION_ENV_VARS.REDIS.DB] = '1';

      const result = ConnectionConfigFactory.createRedisConfig();

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({
        host: 'localhost',
        port: 6379,
        password: 'redis_password',
        db: 1,
        timeout: DEFAULT_CONNECTION_CONFIG.REDIS.TIMEOUT,
        pool: {
          min: DEFAULT_CONNECTION_CONFIG.REDIS.POOL_MIN,
          max: DEFAULT_CONNECTION_CONFIG.REDIS.POOL_MAX
        }
      });
    });

    it('should create valid Redis config from REDIS_URL', () => {
      process.env[CONNECTION_ENV_VARS.REDIS.URL] = 'redis://:redis_password@localhost:6379/1';

      const result = ConnectionConfigFactory.createRedisConfig();

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({
        host: 'localhost',
        port: 6379,
        password: 'redis_password',
        db: 1,
        timeout: DEFAULT_CONNECTION_CONFIG.REDIS.TIMEOUT,
        pool: {
          min: DEFAULT_CONNECTION_CONFIG.REDIS.POOL_MIN,
          max: DEFAULT_CONNECTION_CONFIG.REDIS.POOL_MAX
        }
      });
    });

    it('should create valid Redis config with defaults when no env vars set', () => {
      const result = ConnectionConfigFactory.createRedisConfig();

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({
        host: DEFAULT_CONNECTION_CONFIG.REDIS.HOST,
        port: DEFAULT_CONNECTION_CONFIG.REDIS.PORT,
        password: undefined,
        db: DEFAULT_CONNECTION_CONFIG.REDIS.DB,
        timeout: DEFAULT_CONNECTION_CONFIG.REDIS.TIMEOUT,
        pool: {
          min: DEFAULT_CONNECTION_CONFIG.REDIS.POOL_MIN,
          max: DEFAULT_CONNECTION_CONFIG.REDIS.POOL_MAX
        }
      });
    });
  });

  describe('parsePostgreSQLUrl', () => {
    it('should parse valid PostgreSQL URL', () => {
      const url = 'postgresql://user:password@host:5432/database';
      const result = ConnectionConfigFactory.parsePostgreSQLUrl(url);

      expect(result).toEqual({
        host: 'host',
        port: 5432,
        database: 'database',
        username: 'user',
        password: 'password',
        ssl: false
      });
    });

    it('should parse PostgreSQL URL with SSL', () => {
      const url = 'postgresql://user:password@host:5432/database?ssl=true';
      const result = ConnectionConfigFactory.parsePostgreSQLUrl(url);

      expect(result.ssl).toBe(true);
    });

    it('should throw error for invalid PostgreSQL URL', () => {
      const url = 'invalid-url';
      
      expect(() => {
        ConnectionConfigFactory.parsePostgreSQLUrl(url);
      }).toThrow('Invalid PostgreSQL connection URL format');
    });
  });

  describe('parseRedisUrl', () => {
    it('should parse valid Redis URL with password', () => {
      const url = 'redis://:password@host:6379/1';
      const result = ConnectionConfigFactory.parseRedisUrl(url);

      expect(result).toEqual({
        host: 'host',
        port: 6379,
        password: 'password',
        db: 1
      });
    });

    it('should parse valid Redis URL without password', () => {
      const url = 'redis://host:6379/0';
      const result = ConnectionConfigFactory.parseRedisUrl(url);

      expect(result).toEqual({
        host: 'host',
        port: 6379,
        password: undefined,
        db: 0
      });
    });

    it('should throw error for invalid Redis URL', () => {
      const url = 'invalid-url';
      
      expect(() => {
        ConnectionConfigFactory.parseRedisUrl(url);
      }).toThrow('Invalid Redis connection URL format');
    });
  });

  describe('validateRequiredEnvVars', () => {
    it('should pass validation when DATABASE_URL is provided', () => {
      process.env[CONNECTION_ENV_VARS.DATABASE.URL] = 'postgresql://user:password@host:5432/database';

      const result = ConnectionConfigFactory.validateRequiredEnvVars();

      expect(result.isValid).toBe(true);
      expect(result.data?.database).toBe(true);
    });

    it('should pass validation when individual database env vars are provided', () => {
      process.env[CONNECTION_ENV_VARS.DATABASE.NAME] = 'test_db';
      process.env[CONNECTION_ENV_VARS.DATABASE.USER] = 'test_user';
      process.env[CONNECTION_ENV_VARS.DATABASE.PASSWORD] = 'test_password';

      const result = ConnectionConfigFactory.validateRequiredEnvVars();

      expect(result.isValid).toBe(true);
      expect(result.data?.database).toBe(true);
    });

    it('should fail validation when required database env vars are missing', () => {
      const result = ConnectionConfigFactory.validateRequiredEnvVars();

      expect(result.isValid).toBe(false);
      expect(result.errors?.some(error => error.field === 'database_environment')).toBe(true);
    });
  });

  describe('Configuration Schema Validation', () => {
    describe('Database Configuration Schema', () => {
      it('should validate valid database configuration', () => {
        const validConfig = {
          host: 'localhost',
          port: 5432,
          database: 'test_db',
          username: 'test_user',
          password: 'test_password',
          ssl: false,
          pool: { min: 2, max: 10 },
          timeout: 30000
        };

        const result = ConnectionConfigFactory.validateDatabaseConfig(validConfig);
        expect(result.isValid).toBe(true);
        expect(result.data).toEqual(validConfig);
      });

      it('should reject invalid hostname', () => {
        const invalidConfig = {
          host: 'invalid..hostname',
          port: 5432,
          database: 'test_db',
          username: 'test_user',
          password: 'test_password',
          ssl: false,
          pool: { min: 2, max: 10 },
          timeout: 30000
        };

        const result = ConnectionConfigFactory.validateDatabaseConfig(invalidConfig);
        expect(result.isValid).toBe(false);
        expect(result.errors?.some(error => error.field === 'host')).toBe(true);
      });

      it('should reject invalid port numbers', () => {
        const invalidConfigs = [
          { port: 0 },
          { port: 65536 },
          { port: -1 },
          { port: 'invalid' }
        ];

        invalidConfigs.forEach(portConfig => {
          const config = {
            host: 'localhost',
            port: portConfig.port,
            database: 'test_db',
            username: 'test_user',
            password: 'test_password',
            ssl: false,
            pool: { min: 2, max: 10 },
            timeout: 30000
          };

          const result = ConnectionConfigFactory.validateDatabaseConfig(config);
          expect(result.isValid).toBe(false);
          expect(result.errors?.some(error => error.field === 'port')).toBe(true);
        });
      });

      it('should reject invalid pool configuration', () => {
        const invalidPoolConfigs = [
          { min: 10, max: 5 }, // min > max
          { min: -1, max: 10 }, // negative min
          { min: 0, max: 0 }, // max too low
          { min: 60, max: 70 } // exceeds limits
        ];

        invalidPoolConfigs.forEach(poolConfig => {
          const config = {
            host: 'localhost',
            port: 5432,
            database: 'test_db',
            username: 'test_user',
            password: 'test_password',
            ssl: false,
            pool: poolConfig,
            timeout: 30000
          };

          const result = ConnectionConfigFactory.validateDatabaseConfig(config);
          expect(result.isValid).toBe(false);
        });
      });

      it('should reject invalid timeout values', () => {
        const invalidTimeouts = [500, 400000, -1000];

        invalidTimeouts.forEach(timeout => {
          const config = {
            host: 'localhost',
            port: 5432,
            database: 'test_db',
            username: 'test_user',
            password: 'test_password',
            ssl: false,
            pool: { min: 2, max: 10 },
            timeout
          };

          const result = ConnectionConfigFactory.validateDatabaseConfig(config);
          expect(result.isValid).toBe(false);
          expect(result.errors?.some(error => error.field === 'timeout')).toBe(true);
        });
      });

      it('should require essential fields', () => {
        const requiredFields = ['host', 'database', 'username', 'password'];
        
        requiredFields.forEach(field => {
          const config = {
            host: 'localhost',
            port: 5432,
            database: 'test_db',
            username: 'test_user',
            password: 'test_password',
            ssl: false,
            pool: { min: 2, max: 10 },
            timeout: 30000
          };

          delete (config as any)[field];

          const result = ConnectionConfigFactory.validateDatabaseConfig(config);
          expect(result.isValid).toBe(false);
          expect(result.errors?.some(error => error.field === field)).toBe(true);
        });
      });
    });

    describe('Redis Configuration Schema', () => {
      it('should validate valid Redis configuration', () => {
        const validConfig = {
          host: 'localhost',
          port: 6379,
          password: 'redis_password',
          db: 1,
          timeout: 5000,
          pool: { min: 1, max: 5 }
        };

        const result = ConnectionConfigFactory.validateRedisConfig(validConfig);
        expect(result.isValid).toBe(true);
        expect(result.data).toEqual(validConfig);
      });

      it('should validate Redis config without password', () => {
        const configWithoutPassword = {
          host: 'localhost',
          port: 6379,
          db: 0,
          timeout: 5000,
          pool: { min: 1, max: 5 }
        };

        const result = ConnectionConfigFactory.validateRedisConfig(configWithoutPassword);
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid Redis database numbers', () => {
        const invalidDbs = [-1, 16, 100];

        invalidDbs.forEach(db => {
          const config = {
            host: 'localhost',
            port: 6379,
            db,
            timeout: 5000,
            pool: { min: 1, max: 5 }
          };

          const result = ConnectionConfigFactory.validateRedisConfig(config);
          expect(result.isValid).toBe(false);
          expect(result.errors?.some(error => error.field === 'db')).toBe(true);
        });
      });

      it('should reject invalid Redis timeout values', () => {
        const invalidTimeouts = [500, 70000, -1000];

        invalidTimeouts.forEach(timeout => {
          const config = {
            host: 'localhost',
            port: 6379,
            db: 0,
            timeout,
            pool: { min: 1, max: 5 }
          };

          const result = ConnectionConfigFactory.validateRedisConfig(config);
          expect(result.isValid).toBe(false);
          expect(result.errors?.some(error => error.field === 'timeout')).toBe(true);
        });
      });
    });
  });

  describe('Secure Logging', () => {
    it('should not expose database credentials in logs', () => {
      process.env[CONNECTION_ENV_VARS.DATABASE.HOST] = 'localhost';
      process.env[CONNECTION_ENV_VARS.DATABASE.PORT] = '5432';
      process.env[CONNECTION_ENV_VARS.DATABASE.NAME] = 'test_db';
      process.env[CONNECTION_ENV_VARS.DATABASE.USER] = 'sensitive_user';
      process.env[CONNECTION_ENV_VARS.DATABASE.PASSWORD] = 'super_secret_password';

      const result = ConnectionConfigFactory.createDatabaseConfig();
      expect(result.isValid).toBe(true);

      // Check that console.log was called (for success logging)
      expect(consoleSpy).toHaveBeenCalled();
      
      // Get all console.log calls and check none contain sensitive data
      const logCalls = consoleSpy.mock.calls;
      const allLoggedContent = logCalls.map(call => JSON.stringify(call)).join(' ');
      
      expect(allLoggedContent).not.toContain('super_secret_password');
      expect(allLoggedContent).not.toContain('sensitive_user'); // Should be masked
    });

    it('should not expose Redis credentials in logs', () => {
      process.env[CONNECTION_ENV_VARS.REDIS.HOST] = 'localhost';
      process.env[CONNECTION_ENV_VARS.REDIS.PORT] = '6379';
      process.env[CONNECTION_ENV_VARS.REDIS.PASSWORD] = 'redis_secret_password';

      const result = ConnectionConfigFactory.createRedisConfig();
      expect(result.isValid).toBe(true);

      // Check that console.log was called (for success logging)
      expect(consoleSpy).toHaveBeenCalled();
      
      // Get all console.log calls and check none contain sensitive data
      const logCalls = consoleSpy.mock.calls;
      const allLoggedContent = logCalls.map(call => JSON.stringify(call)).join(' ');
      
      expect(allLoggedContent).not.toContain('redis_secret_password');
    });

    it('should mask sensitive values appropriately', () => {
      const testCases = [
        { input: 'user123', expected: 'us*****' },
        { input: 'ab', expected: '***' },
        { input: 'a', expected: '***' },
        { input: '', expected: '***' },
        { input: 'verylongusername', expected: 've**************' }
      ];

      testCases.forEach(({ input, expected }) => {
        // Access the private method through the class prototype
        const masked = (ConnectionConfigFactory as any).maskSensitiveValue(input);
        expect(masked).toBe(expected);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed environment variables gracefully', () => {
      process.env[CONNECTION_ENV_VARS.DATABASE.PORT] = 'not-a-number';
      process.env[CONNECTION_ENV_VARS.DATABASE.SSL] = 'maybe';
      process.env[CONNECTION_ENV_VARS.DATABASE.POOL_MIN] = 'invalid';

      const result = ConnectionConfigFactory.createDatabaseConfig();
      
      // Should still create config with defaults for invalid values
      expect(result.isValid).toBe(false); // Will fail validation due to missing required fields
    });

    it('should provide descriptive error messages', () => {
      const invalidConfig = {
        host: '',
        port: 99999,
        database: '',
        username: '',
        password: '',
        ssl: 'invalid',
        pool: { min: 10, max: 5 },
        timeout: 500
      };

      const result = ConnectionConfigFactory.validateDatabaseConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      
      // Check that error messages are descriptive
      result.errors!.forEach(error => {
        expect(error.message).toBeTruthy();
        expect(error.field).toBeTruthy();
        expect(error.constraint).toBeTruthy();
      });
    });

    it('should handle configuration creation errors', () => {
      // Test with missing required fields to trigger validation errors
      process.env[CONNECTION_ENV_VARS.DATABASE.HOST] = 'localhost';
      // Missing required fields will cause validation to fail
      
      const result = ConnectionConfigFactory.createDatabaseConfig();
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      
      // Should have validation errors for missing required fields
      const errorFields = result.errors!.map(error => error.field);
      expect(errorFields).toContain('database');
      expect(errorFields).toContain('username');
      expect(errorFields).toContain('password');
    });
  });

  describe('Environment Variable Utilities', () => {
    it('should return correct required environment variables', () => {
      const requiredDbVars = ConnectionConfigFactory.getRequiredDatabaseEnvVars();
      expect(requiredDbVars).toContain(CONNECTION_ENV_VARS.DATABASE.NAME);
      expect(requiredDbVars).toContain(CONNECTION_ENV_VARS.DATABASE.USER);
      expect(requiredDbVars).toContain(CONNECTION_ENV_VARS.DATABASE.PASSWORD);
    });

    it('should return all supported environment variables', () => {
      const allDbVars = ConnectionConfigFactory.getAllDatabaseEnvVars();
      expect(allDbVars).toContain(CONNECTION_ENV_VARS.DATABASE.HOST);
      expect(allDbVars).toContain(CONNECTION_ENV_VARS.DATABASE.PORT);
      expect(allDbVars).toContain(CONNECTION_ENV_VARS.DATABASE.URL);
      
      const allRedisVars = ConnectionConfigFactory.getAllRedisEnvVars();
      expect(allRedisVars).toContain(CONNECTION_ENV_VARS.REDIS.HOST);
      expect(allRedisVars).toContain(CONNECTION_ENV_VARS.REDIS.PORT);
      expect(allRedisVars).toContain(CONNECTION_ENV_VARS.REDIS.URL);
    });
  });
});

describe('ConnectionConfigUtils', () => {
  describe('createMaskedConnectionString', () => {
    it('should mask database connection string', () => {
      const config = {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'secret_password',
        ssl: false,
        pool: { min: 2, max: 10 },
        timeout: 30000
      };

      const masked = ConnectionConfigUtils.createMaskedConnectionString(config);
      
      expect(masked).toBe('test_user:***@localhost:5432/test_db');
      expect(masked).not.toContain('secret_password');
    });

    it('should mask Redis connection string', () => {
      const config = {
        host: 'localhost',
        port: 6379,
        password: 'secret_password',
        db: 1,
        timeout: 5000,
        pool: { min: 1, max: 5 }
      };

      const masked = ConnectionConfigUtils.createMaskedConnectionString(config);
      
      expect(masked).toBe('redis://:***@localhost:6379/1');
      expect(masked).not.toContain('secret_password');
    });

    it('should handle Redis connection without password', () => {
      const config = {
        host: 'localhost',
        port: 6379,
        db: 0,
        timeout: 5000,
        pool: { min: 1, max: 5 }
      };

      const masked = ConnectionConfigUtils.createMaskedConnectionString(config);
      
      expect(masked).toBe('redis://localhost:6379/0');
      expect(masked).not.toContain('password');
    });
  });

  describe('isValidConnectionUrl', () => {
    it('should validate PostgreSQL URLs', () => {
      const validUrls = [
        'postgresql://user:password@host:5432/database',
        'postgresql://user:pass@localhost:5432/mydb',
        'postgresql://admin:secret123@db.example.com:5432/production'
      ];

      validUrls.forEach(url => {
        expect(ConnectionConfigUtils.isValidConnectionUrl(url, 'postgresql')).toBe(true);
      });

      const invalidUrls = [
        'invalid-url',
        'mysql://user:pass@host:3306/db',
        'postgresql://incomplete',
        'http://not-a-db-url.com'
      ];

      invalidUrls.forEach(url => {
        expect(ConnectionConfigUtils.isValidConnectionUrl(url, 'postgresql')).toBe(false);
      });
    });

    it('should validate Redis URLs', () => {
      const validUrls = [
        'redis://:password@host:6379/1',
        'redis://host:6379/0',
        'redis://:secret@redis.example.com:6379/5'
      ];

      validUrls.forEach(url => {
        expect(ConnectionConfigUtils.isValidConnectionUrl(url, 'redis')).toBe(true);
      });

      const invalidUrls = [
        'invalid-url',
        'http://redis.com:6379',
        'redis://incomplete',
        'postgresql://user:pass@host:5432/db'
      ];

      invalidUrls.forEach(url => {
        expect(ConnectionConfigUtils.isValidConnectionUrl(url, 'redis')).toBe(false);
      });
    });

    it('should handle malformed URLs gracefully', () => {
      const malformedUrls = [
        null,
        undefined,
        '',
        'not-a-url-at-all',
        'redis://',
        'postgresql://'
      ];

      malformedUrls.forEach(url => {
        expect(ConnectionConfigUtils.isValidConnectionUrl(url as any, 'postgresql')).toBe(false);
        expect(ConnectionConfigUtils.isValidConnectionUrl(url as any, 'redis')).toBe(false);
      });
    });
  });

  describe('getEnvVarDocumentation', () => {
    it('should provide comprehensive environment variable documentation', () => {
      const docs = ConnectionConfigUtils.getEnvVarDocumentation();
      
      expect(docs).toHaveProperty('database');
      expect(docs).toHaveProperty('redis');
      
      expect(docs.database).toHaveProperty('required');
      expect(docs.database).toHaveProperty('optional');
      expect(docs.database).toHaveProperty('defaults');
      
      expect(docs.redis).toHaveProperty('required');
      expect(docs.redis).toHaveProperty('optional');
      expect(docs.redis).toHaveProperty('defaults');
      
      // Verify structure
      expect(Array.isArray(docs.database.required)).toBe(true);
      expect(Array.isArray(docs.database.optional)).toBe(true);
      expect(typeof docs.database.defaults).toBe('object');
    });
  });
});

describe('Error Classes', () => {
  describe('ConfigurationError', () => {
    it('should create configuration error with proper properties', () => {
      const error = new ConfigurationError('host', 'invalid-host', 'must be valid hostname');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error.name).toBe('ConfigurationError');
      expect(error.field).toBe('host');
      expect(error.value).toBe('invalid-host');
      expect(error.constraint).toBe('must be valid hostname');
      expect(error.message).toBe('Configuration error for host: must be valid hostname');
    });
  });

  describe('ConnectionError', () => {
    it('should create connection error with proper properties', () => {
      const originalError = new Error('Connection timeout');
      const error = new ConnectionError('database', originalError);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ConnectionError);
      expect(error.name).toBe('ConnectionError');
      expect(error.service).toBe('database');
      expect(error.originalError).toBe(originalError);
      expect(error.message).toBe('Failed to connect to database: Connection timeout');
    });

    it('should handle Redis connection errors', () => {
      const originalError = new Error('Redis server unavailable');
      const error = new ConnectionError('redis', originalError);
      
      expect(error.service).toBe('redis');
      expect(error.message).toBe('Failed to connect to redis: Redis server unavailable');
    });
  });
});

describe('Advanced URL Parsing', () => {
  describe('PostgreSQL URL Parsing Edge Cases', () => {
    it('should parse URLs with SSL parameters', () => {
      const urlWithSsl = 'postgresql://user:password@host:5432/database?ssl=true&sslmode=require';
      const result = ConnectionConfigFactory.parsePostgreSQLUrl(urlWithSsl);
      
      expect(result.ssl).toBe(true);
      expect(result.host).toBe('host');
      expect(result.port).toBe(5432);
      expect(result.database).toBe('database');
      expect(result.username).toBe('user');
      expect(result.password).toBe('password');
    });

    it('should handle URLs with special characters in credentials', () => {
      const urlWithSpecialChars = 'postgresql://user%40domain:p%40ssw0rd@host:5432/database';
      
      // The current regex pattern actually accepts this format
      const result = ConnectionConfigFactory.parsePostgreSQLUrl(urlWithSpecialChars);
      expect(result.username).toBe('user%40domain');
      expect(result.password).toBe('p%40ssw0rd');
      expect(result.host).toBe('host');
      expect(result.port).toBe(5432);
      expect(result.database).toBe('database');
    });

    it('should reject malformed PostgreSQL URLs', () => {
      const malformedUrls = [
        'postgresql://incomplete',
        'postgresql://user@host:5432', // missing password and database
        'postgresql://user:pass@host', // missing port and database
        'postgresql://user:pass@:5432/db', // missing host
        'not-a-url'
      ];

      malformedUrls.forEach(url => {
        expect(() => {
          ConnectionConfigFactory.parsePostgreSQLUrl(url);
        }).toThrow('Invalid PostgreSQL connection URL format');
      });
    });
  });

  describe('Redis URL Parsing Edge Cases', () => {
    it('should parse Redis URLs without database specification', () => {
      const url = 'redis://:password@host:6379';
      const result = ConnectionConfigFactory.parseRedisUrl(url);
      
      expect(result.host).toBe('host');
      expect(result.port).toBe(6379);
      expect(result.password).toBe('password');
      expect(result.db).toBe(0); // default
    });

    it('should parse Redis URLs without password', () => {
      const url = 'redis://host:6379/2';
      const result = ConnectionConfigFactory.parseRedisUrl(url);
      
      expect(result.host).toBe('host');
      expect(result.port).toBe(6379);
      expect(result.password).toBeUndefined();
      expect(result.db).toBe(2);
    });

    it('should reject malformed Redis URLs', () => {
      const malformedUrls = [
        'redis://incomplete',
        'redis://host', // missing port
        'redis://:password@', // missing host and port
        'not-a-redis-url'
      ];

      malformedUrls.forEach(url => {
        expect(() => {
          ConnectionConfigFactory.parseRedisUrl(url);
        }).toThrow('Invalid Redis connection URL format');
      });
    });
  });
});

describe('Environment Variable Parsing Edge Cases', () => {
  describe('Boolean Environment Variable Parsing', () => {
    it('should parse various boolean representations', () => {
      const testCases = [
        { value: 'true', expected: true },
        { value: 'TRUE', expected: true },
        { value: '1', expected: true },
        { value: 'yes', expected: true },
        { value: 'YES', expected: true },
        { value: 'false', expected: false },
        { value: 'FALSE', expected: false },
        { value: '0', expected: false },
        { value: 'no', expected: false },
        { value: 'NO', expected: false },
        { value: 'invalid', expected: false }, // Default value when parsing fails
        { value: '', expected: false } // Default value when empty
      ];

      testCases.forEach(({ value, expected }) => {
        // Clear environment first
        Object.values(CONNECTION_ENV_VARS.DATABASE).forEach(envVar => {
          delete process.env[envVar];
        });
        
        // Set required fields for valid config
        process.env[CONNECTION_ENV_VARS.DATABASE.HOST] = 'localhost';
        process.env[CONNECTION_ENV_VARS.DATABASE.NAME] = 'test_db';
        process.env[CONNECTION_ENV_VARS.DATABASE.USER] = 'test_user';
        process.env[CONNECTION_ENV_VARS.DATABASE.PASSWORD] = 'test_password';
        process.env[CONNECTION_ENV_VARS.DATABASE.SSL] = value;
        
        const result = ConnectionConfigFactory.createDatabaseConfig();
        expect(result.isValid).toBe(true);
        expect(result.data?.ssl).toBe(expected);
      });
    });
  });

  describe('Integer Environment Variable Parsing', () => {
    it('should handle invalid integer values gracefully', () => {
      // Set required fields first
      process.env[CONNECTION_ENV_VARS.DATABASE.HOST] = 'localhost';
      process.env[CONNECTION_ENV_VARS.DATABASE.NAME] = 'test_db';
      process.env[CONNECTION_ENV_VARS.DATABASE.USER] = 'test_user';
      process.env[CONNECTION_ENV_VARS.DATABASE.PASSWORD] = 'test_password';
      
      // Set invalid integer values
      process.env[CONNECTION_ENV_VARS.DATABASE.PORT] = 'not-a-number';
      process.env[CONNECTION_ENV_VARS.DATABASE.POOL_MIN] = 'invalid';
      process.env[CONNECTION_ENV_VARS.DATABASE.POOL_MAX] = '';
      
      const result = ConnectionConfigFactory.createDatabaseConfig();
      
      // Should be valid but use defaults for invalid values
      expect(result.isValid).toBe(true);
      expect(result.data?.port).toBe(DEFAULT_CONNECTION_CONFIG.DATABASE.PORT);
      expect(result.data?.pool.min).toBe(DEFAULT_CONNECTION_CONFIG.DATABASE.POOL_MIN);
      expect(result.data?.pool.max).toBe(DEFAULT_CONNECTION_CONFIG.DATABASE.POOL_MAX);
    });
  });
});