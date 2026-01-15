import { config } from 'dotenv';
import { Knex } from 'knex';
import { ConnectionConfigFactory } from '@strengthos/shared-validation';

// Load environment variables
config();

/**
 * Creates a Knex connection configuration using the standardized ConnectionConfigFactory
 * This ensures consistency with other database connections in the application
 */
function createKnexConnection(): any {
  const configResult = ConnectionConfigFactory.createDatabaseConfig();
  
  if (!configResult.isValid) {
    console.error('❌ Failed to create database configuration for Knex:');
    configResult.errors?.forEach(error => {
      console.error(`  - ${error.field}: ${error.message}`);
    });
    throw new Error('Invalid database configuration. Please check your environment variables.');
  }

  const dbConfig = configResult.data!;
  
  // Convert standardized config to Knex format
  const knexConnection = {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.username,
    password: dbConfig.password,
    ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
    timezone: false,
  };

  // Log successful configuration (without sensitive data)
  console.log('✅ Knex database configuration created successfully:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    ssl: dbConfig.ssl,
    pool: dbConfig.pool,
    timeout: dbConfig.timeout
  });

  return knexConnection;
}

/**
 * Creates the base Knex configuration with standardized connection settings
 */
function createBaseConfig(): Knex.Config {
  const configResult = ConnectionConfigFactory.createDatabaseConfig();
  
  if (!configResult.isValid) {
    throw new Error('Failed to create database configuration for Knex');
  }

  const dbConfig = configResult.data!;

  return {
    client: 'postgresql',
    connection: {
      ...createKnexConnection(),
      timezone: false,
      // Completely disable automatic timezone conversion
      typeCast: (field: any, next: () => any) => {
        // Handle all datetime/timestamp/date fields to prevent timezone conversion
        if (field.type === 'DATETIME' || field.type === 'TIMESTAMP' || field.type === 'TIMESTAMPTZ' || field.type === 'DATE') {
          return field.string();
        }
        // Also handle any field that might be a date by checking the field name
        if (field.name && (field.name.includes('date') || field.name.includes('time') || field.name.includes('_at'))) {
          return field.string();
        }
        return next();
      },
    },
    migrations: {
      directory: './migrations',
      extension: 'ts',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
      extension: 'ts',
    },
    pool: {
      min: dbConfig.pool.min,
      max: dbConfig.pool.max,
    },
    acquireConnectionTimeout: dbConfig.timeout,
  };
}

/**
 * Environment-specific Knex configurations
 * All configurations use the standardized ConnectionConfigFactory for consistency
 */
const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    ...createBaseConfig(),
    debug: false,
  },
  
  test: {
    ...createBaseConfig(),
    connection: (() => {
      // For test environment, override the database name
      const baseConnection = createKnexConnection();
      return {
        ...baseConnection,
        database: process.env.DATABASE_NAME_TEST || 'gym_db_test',
      };
    })(),
  },
  
  staging: {
    ...createBaseConfig(),
    // Staging-specific pool configuration
    pool: (() => {
      const configResult = ConnectionConfigFactory.createDatabaseConfig();
      if (!configResult.isValid) {
        throw new Error('Failed to create staging database configuration');
      }
      const dbConfig = configResult.data!;
      return {
        min: Math.max(dbConfig.pool.min, 2), // Minimum 2 for staging
        max: Math.min(dbConfig.pool.max, 20), // Maximum 20 for staging
      };
    })(),
  },
  
  production: {
    ...createBaseConfig(),
    // Production-specific pool configuration
    pool: (() => {
      const configResult = ConnectionConfigFactory.createDatabaseConfig();
      if (!configResult.isValid) {
        throw new Error('Failed to create production database configuration');
      }
      const dbConfig = configResult.data!;
      return {
        min: Math.max(dbConfig.pool.min, 5), // Minimum 5 for production
        max: Math.max(dbConfig.pool.max, 30), // Ensure at least 30 for production
      };
    })(),
    // Production-specific timeout configuration
    acquireConnectionTimeout: (() => {
      const configResult = ConnectionConfigFactory.createDatabaseConfig();
      if (!configResult.isValid) {
        throw new Error('Failed to create production database configuration');
      }
      const dbConfig = configResult.data!;
      return Math.max(dbConfig.timeout, 60000); // Minimum 60s for production
    })(),
  },
};

/**
 * Validates the Knex configuration for the current environment
 */
function validateKnexConfig(environment: string): void {
  const config = knexConfig[environment];
  
  if (!config) {
    throw new Error(`No Knex configuration found for environment: ${environment}`);
  }

  // Validate that we have a connection configuration
  if (!config.connection) {
    throw new Error(`No connection configuration found for environment: ${environment}`);
  }

  // Validate pool configuration
  if (config.pool) {
    if (config.pool.min && config.pool.max && config.pool.min >= config.pool.max) {
      throw new Error(`Invalid pool configuration for ${environment}: min (${config.pool.min}) must be less than max (${config.pool.max})`);
    }
  }

  console.log(`✅ Knex configuration validated successfully for environment: ${environment}`);
}

/**
 * Gets the Knex configuration for the specified environment with validation
 */
export function getKnexConfig(environment: string = process.env.NODE_ENV || 'development'): Knex.Config {
  try {
    validateKnexConfig(environment);
    return knexConfig[environment];
  } catch (error) {
    console.error(`❌ Failed to get Knex configuration for environment ${environment}:`, error);
    throw error;
  }
}

/**
 * Gets all available Knex configurations
 */
export function getAllKnexConfigs(): { [key: string]: Knex.Config } {
  return knexConfig;
}

/**
 * Validates that the database connection can be established
 */
export async function validateKnexConnection(environment: string = process.env.NODE_ENV || 'development'): Promise<boolean> {
  const knex = require('knex');
  const config = getKnexConfig(environment);
  
  let db: any = null;
  
  try {
    db = knex(config);
    
    // Test the connection
    await db.raw('SELECT 1');
    
    console.log(`✅ Knex database connection validated successfully for environment: ${environment}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to validate Knex database connection for environment ${environment}:`, error);
    return false;
  } finally {
    if (db) {
      await db.destroy();
    }
  }
}

// Validate configuration on module load for the current environment
try {
  const currentEnv = process.env.NODE_ENV || 'development';
  validateKnexConfig(currentEnv);
} catch (error) {
  console.error('❌ Knex configuration validation failed on module load:', error);
  // Don't throw here to allow the module to load, but log the error
}

export default knexConfig;