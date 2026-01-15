import { Module, Provider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IDb, createDatabase } from '@strengthos/shared-database';
import { DatabaseConfig } from '@strengthos/shared-types';
import {
  ConnectionConfigFactory,
  ConfigurationError,
} from '@strengthos/shared-validation';

// Database provider
const DatabaseProvider: Provider = {
  provide: 'IDb',
  useFactory: (_configService: ConfigService): IDb => {
    const logger = new Logger('SharedDatabaseModule');

    try {
      // Use ConnectionConfigFactory for standardized configuration creation and validation
      const configResult = ConnectionConfigFactory.createDatabaseConfig();

      if (!configResult.isValid) {
        const errorMessages = configResult.errors
          .map((error) => `${error.field}: ${error.message}`)
          .join('; ');

        logger.error('Database configuration validation failed', {
          errors: configResult.errors,
        });

        throw new ConfigurationError(
          'database_config',
          'validation_failed',
          `Database configuration validation failed: ${errorMessages}`,
        );
      }

      const standardizedConfig = configResult.data;

      // Convert standardized config to shared-types DatabaseConfig format
      const dbConfig: DatabaseConfig = {
        host: standardizedConfig.host,
        port: standardizedConfig.port,
        database: standardizedConfig.database,
        username: standardizedConfig.username,
        password: standardizedConfig.password,
        ssl: standardizedConfig.ssl ? { rejectUnauthorized: false } : false,
      };

      logger.log('Shared database configuration created successfully', {
        host: standardizedConfig.host,
        port: standardizedConfig.port,
        database: standardizedConfig.database,
        ssl: standardizedConfig.ssl,
        poolMin: standardizedConfig.pool.min,
        poolMax: standardizedConfig.pool.max,
      });

      return createDatabase(dbConfig);
    } catch (error) {
      logger.error('Failed to create shared database configuration', error);

      if (error instanceof ConfigurationError) {
        throw error;
      }

      // Handle missing configuration with descriptive error message
      const requiredVars = ConnectionConfigFactory.getRequiredDatabaseEnvVars();
      const missingVars = requiredVars.filter((envVar) => !process.env[envVar]);

      if (missingVars.length > 0 && !process.env.DATABASE_URL) {
        throw new ConfigurationError(
          'database_environment',
          'missing_required_variables',
          `Missing required database environment variables: ${missingVars.join(', ')}. ` +
            `Either provide these variables or set DATABASE_URL. ` +
            `Example: DATABASE_URL=postgresql://user:password@host:port/database`,
        );
      }

      throw new ConfigurationError(
        'database_config',
        'creation_failed',
        `Failed to create shared database configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
  inject: [ConfigService],
};

@Module({
  providers: [DatabaseProvider],
  exports: ['IDb'],
})
export class DatabaseModule {}
