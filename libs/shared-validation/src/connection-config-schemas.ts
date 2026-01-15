import Joi from 'joi';
import { z } from 'zod';

// TypeScript interfaces for connection configurations
export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  timezone?: string | false;
  pool: {
    min: number;
    max: number;
  };
  timeout: number;
}

export interface RedisConnectionConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  timeout: number;
  pool: {
    min: number;
    max: number;
  };
}

// Validation result types
export interface ConnectionConfigValidationResult<T = any> {
  isValid: boolean;
  data?: T;
  errors?: ConnectionConfigValidationError[];
}

export interface ConnectionConfigValidationError {
  field: string;
  message: string;
  value?: any;
  constraint: string;
}

// Joi validation schemas
export const JoiConnectionSchemas = {
  // Database connection pool configuration
  databasePool: Joi.object({
    min: Joi.number().integer().min(0).max(50).default(2).messages({
      'number.base': 'Pool minimum must be a number',
      'number.integer': 'Pool minimum must be an integer',
      'number.min': 'Pool minimum must be at least 0',
      'number.max': 'Pool minimum must not exceed 50'
    }),
    max: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.base': 'Pool maximum must be a number',
      'number.integer': 'Pool maximum must be an integer',
      'number.min': 'Pool maximum must be at least 1',
      'number.max': 'Pool maximum must not exceed 100'
    })
  }).custom((value, helpers) => {
    if (value.min >= value.max) {
      return helpers.error('pool.minMaxValidation');
    }
    return value;
  }).messages({
    'pool.minMaxValidation': 'Pool minimum must be less than maximum'
  }),

  // Redis connection pool configuration
  redisPool: Joi.object({
    min: Joi.number().integer().min(0).max(20).default(1).messages({
      'number.base': 'Pool minimum must be a number',
      'number.integer': 'Pool minimum must be an integer',
      'number.min': 'Pool minimum must be at least 0',
      'number.max': 'Pool minimum must not exceed 20'
    }),
    max: Joi.number().integer().min(1).max(50).default(5).messages({
      'number.base': 'Pool maximum must be a number',
      'number.integer': 'Pool maximum must be an integer',
      'number.min': 'Pool maximum must be at least 1',
      'number.max': 'Pool maximum must not exceed 50'
    })
  }).custom((value, helpers) => {
    if (value.min >= value.max) {
      return helpers.error('pool.minMaxValidation');
    }
    return value;
  }).messages({
    'pool.minMaxValidation': 'Pool minimum must be less than maximum'
  }),

  // Database connection configuration
  databaseConnection: Joi.object({
    host: Joi.string().hostname().required().messages({
      'string.hostname': 'Database host must be a valid hostname or IP address',
      'any.required': 'Database host is required'
    }),
    port: Joi.number().integer().min(1).max(65535).default(5432).messages({
      'number.base': 'Database port must be a number',
      'number.integer': 'Database port must be an integer',
      'number.min': 'Database port must be at least 1',
      'number.max': 'Database port must not exceed 65535'
    }),
    database: Joi.string().min(1).max(63).required().messages({
      'string.min': 'Database name must be at least 1 character',
      'string.max': 'Database name must not exceed 63 characters',
      'any.required': 'Database name is required'
    }),
    username: Joi.string().min(1).max(63).required().messages({
      'string.min': 'Database username must be at least 1 character',
      'string.max': 'Database username must not exceed 63 characters',
      'any.required': 'Database username is required'
    }),
    password: Joi.string().min(1).required().messages({
      'string.min': 'Database password must be at least 1 character',
      'any.required': 'Database password is required'
    }),
    ssl: Joi.boolean().default(false).messages({
      'boolean.base': 'SSL setting must be a boolean value'
    }),
    pool: Joi.object().keys({
      min: Joi.number().integer().min(0).max(50).default(2),
      max: Joi.number().integer().min(1).max(100).default(10)
    }).custom((value, helpers) => {
      if (value.min >= value.max) {
        return helpers.error('pool.minMaxValidation');
      }
      return value;
    }).default({ min: 2, max: 10 }).messages({
      'pool.minMaxValidation': 'Pool minimum must be less than maximum'
    }),
    timeout: Joi.number().integer().min(1000).max(300000).default(30000).messages({
      'number.base': 'Timeout must be a number',
      'number.integer': 'Timeout must be an integer',
      'number.min': 'Timeout must be at least 1000ms (1 second)',
      'number.max': 'Timeout must not exceed 300000ms (5 minutes)'
    }),
    timezone: Joi.alternatives().try(
      Joi.string().valid('UTC', 'utc', 'GMT', 'gmt'),
      Joi.boolean().valid(false)
    ).default(false).messages({
      'alternatives.match': 'Timezone must be a valid timezone string or false to disable conversion'
    })
  }),

  // Redis connection configuration
  redisConnection: Joi.object({
    host: Joi.string().hostname().required().messages({
      'string.hostname': 'Redis host must be a valid hostname or IP address',
      'any.required': 'Redis host is required'
    }),
    port: Joi.number().integer().min(1).max(65535).default(6379).messages({
      'number.base': 'Redis port must be a number',
      'number.integer': 'Redis port must be an integer',
      'number.min': 'Redis port must be at least 1',
      'number.max': 'Redis port must not exceed 65535'
    }),
    password: Joi.string().min(1).optional().allow('').messages({
      'string.min': 'Redis password must be at least 1 character if provided'
    }),
    db: Joi.number().integer().min(0).max(15).default(0).messages({
      'number.base': 'Redis database must be a number',
      'number.integer': 'Redis database must be an integer',
      'number.min': 'Redis database must be at least 0',
      'number.max': 'Redis database must not exceed 15'
    }),
    timeout: Joi.number().integer().min(1000).max(60000).default(5000).messages({
      'number.base': 'Timeout must be a number',
      'number.integer': 'Timeout must be an integer',
      'number.min': 'Timeout must be at least 1000ms (1 second)',
      'number.max': 'Timeout must not exceed 60000ms (1 minute)'
    }),
    pool: Joi.object().keys({
      min: Joi.number().integer().min(0).max(20).default(1),
      max: Joi.number().integer().min(1).max(50).default(5)
    }).custom((value, helpers) => {
      if (value.min >= value.max) {
        return helpers.error('pool.minMaxValidation');
      }
      return value;
    }).default({ min: 1, max: 5 }).messages({
      'pool.minMaxValidation': 'Pool minimum must be less than maximum'
    })
  })
};

// Zod validation schemas (alternative)
export const ZodConnectionSchemas = {
  // Database connection pool configuration
  databasePool: z.object({
    min: z.number().int().min(0).max(50).default(2),
    max: z.number().int().min(1).max(100).default(10)
  }).refine(data => data.min < data.max, {
    message: 'Pool minimum must be less than maximum',
    path: ['pool']
  }),

  // Redis connection pool configuration
  redisPool: z.object({
    min: z.number().int().min(0).max(20).default(1),
    max: z.number().int().min(1).max(50).default(5)
  }).refine(data => data.min < data.max, {
    message: 'Pool minimum must be less than maximum',
    path: ['pool']
  }),

  // Database connection configuration
  databaseConnection: z.object({
    host: z.string().min(1, 'Database host is required'),
    port: z.number().int().min(1).max(65535).default(5432),
    database: z.string().min(1, 'Database name is required').max(63),
    username: z.string().min(1, 'Database username is required').max(63),
    password: z.string().min(1, 'Database password is required'),
    ssl: z.boolean().default(false),
    pool: z.object({
      min: z.number().int().min(0).max(50).default(2),
      max: z.number().int().min(1).max(100).default(10)
    }).refine(data => data.min < data.max, {
      message: 'Pool minimum must be less than maximum'
    }).default({ min: 2, max: 10 }),
    timeout: z.number().int().min(1000).max(300000).default(30000),
    timezone: z.union([z.literal('UTC'), z.literal('utc'), z.literal('GMT'), z.literal('gmt'), z.literal(false)]).default(false)
  }),

  // Redis connection configuration
  redisConnection: z.object({
    host: z.string().min(1, 'Redis host is required'),
    port: z.number().int().min(1).max(65535).default(6379),
    password: z.string().optional(),
    db: z.number().int().min(0).max(15).default(0),
    timeout: z.number().int().min(1000).max(60000).default(5000),
    pool: z.object({
      min: z.number().int().min(0).max(20).default(1),
      max: z.number().int().min(1).max(50).default(5)
    }).refine(data => data.min < data.max, {
      message: 'Pool minimum must be less than maximum'
    }).default({ min: 1, max: 5 })
  })
};

// Environment variable name constants
export const CONNECTION_ENV_VARS = {
  // Database environment variables
  DATABASE: {
    URL: 'DATABASE_URL',
    HOST: 'DATABASE_HOST',
    PORT: 'DATABASE_PORT',
    NAME: 'DATABASE_NAME',
    USER: 'DATABASE_USER',
    PASSWORD: 'DATABASE_PASSWORD',
    SSL: 'DATABASE_SSL',
    TIMEZONE: 'DATABASE_TIMEZONE',
    POOL_MIN: 'DATABASE_POOL_MIN',
    POOL_MAX: 'DATABASE_POOL_MAX',
    TIMEOUT: 'DATABASE_TIMEOUT'
  },
  // Redis environment variables
  REDIS: {
    URL: 'REDIS_URL',
    HOST: 'REDIS_HOST',
    PORT: 'REDIS_PORT',
    PASSWORD: 'REDIS_PASSWORD',
    DB: 'REDIS_DB',
    TIMEOUT: 'REDIS_TIMEOUT',
    POOL_MIN: 'REDIS_POOL_MIN',
    POOL_MAX: 'REDIS_POOL_MAX'
  }
} as const;

// Default configuration values
export const DEFAULT_CONNECTION_CONFIG = {
  DATABASE: {
    HOST: 'localhost',
    PORT: 5432,
    SSL: false,
    TIMEZONE: false,
    POOL_MIN: 2,
    POOL_MAX: 10,
    TIMEOUT: 30000
  },
  REDIS: {
    HOST: 'localhost',
    PORT: 6379,
    DB: 0,
    TIMEOUT: 5000,
    POOL_MIN: 1,
    POOL_MAX: 5
  }
} as const;

// Connection URL parsing regex patterns
export const CONNECTION_URL_PATTERNS = {
  // PostgreSQL URL pattern: postgresql://user:password@host:port/database?ssl=true
  POSTGRESQL: /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?$/,
  // Redis URL pattern: redis://[:password@]host:port[/db]
  REDIS: /^redis:\/\/(?::([^@]+)@)?([^:]+):(\d+)(?:\/(\d+))?$/
} as const;