import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { DatabaseConfig } from '../config/database.config';
import {
  ConnectionConfigFactory,
  ConfigurationError,
} from '@strengthos/shared-validation';
import { ConsoleLogService } from '../shared/services/console-log.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'DATABASE_CONFIG',
      useFactory: (): DatabaseConfig => {
        const logger = new Logger('DatabaseModule');

        try {
          // Use ConnectionConfigFactory for standardized configuration creation and validation
          const configResult = ConnectionConfigFactory.createDatabaseConfig();

          if (!configResult.isValid) {
            const errorMessages = configResult.errors
              .map((error) => `${error.field}: ${error.message}`)
              .join('; ');

            logger.error(
              `Database configuration validation failed: ${errorMessages}`,
            );

            throw new ConfigurationError(
              'database_config',
              'validation_failed',
              `Database configuration validation failed: ${errorMessages}`,
            );
          }

          const standardizedConfig = configResult.data;

          // Convert standardized config to DatabaseConfig format
          const databaseConfig: DatabaseConfig = {
            host: standardizedConfig.host,
            port: standardizedConfig.port,
            database: standardizedConfig.database,
            username: standardizedConfig.username,
            password: standardizedConfig.password,
            url: `postgresql://${standardizedConfig.username}:${standardizedConfig.password}@${standardizedConfig.host}:${standardizedConfig.port}/${standardizedConfig.database}`,
            timezone: standardizedConfig.timezone ?? false,
            ssl: standardizedConfig.ssl ? { rejectUnauthorized: false } : false,
            poolMin: standardizedConfig.pool?.min ?? 2,
            poolMax: standardizedConfig.pool?.max ?? 10,
            timeout: standardizedConfig.timeout ?? 30000,
            migrations: {
              directory: './migrations',
              tableName: 'knex_migrations',
            },
            seeds: {
              directory: './seeds',
            },
          };

          // logger.log(
          //   `Database configuration created successfully: host=${databaseConfig.host}, port=${databaseConfig.port}, database=${databaseConfig.database}, ssl=${databaseConfig.ssl}, poolMin=${databaseConfig.poolMin}, poolMax=${databaseConfig.poolMax}, timeout=${databaseConfig.timeout}`,
          // );

          return databaseConfig;
        } catch (error) {
          logger.error(
            `Failed to create database configuration: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );

          if (error instanceof ConfigurationError) {
            throw error;
          }

          // Handle missing configuration with descriptive error message
          const requiredVars =
            ConnectionConfigFactory.getRequiredDatabaseEnvVars();
          const missingVars = requiredVars.filter(
            (envVar) => !process.env[envVar],
          );

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
            `Failed to create database configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      },
      inject: [ConfigService],
    },
    DatabaseService,
    {
      provide: 'DATABASE_SERVICE',
      useExisting: DatabaseService,
    },
    ConsoleLogService,
  ],
  exports: [
    DatabaseService,
    'DATABASE_CONFIG',
    'DATABASE_SERVICE',
    ConsoleLogService,
  ],
})
export class DatabaseModule {}
