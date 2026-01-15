import { registerAs } from '@nestjs/config';
import { DatabaseConfig as SharedDatabaseConfig } from '@strengthos/shared-types';

export interface DatabaseConfig extends SharedDatabaseConfig {
  url: string;
  ssl: boolean | { rejectUnauthorized: boolean };
  poolMin: number;
  poolMax: number;
  timeout: number;
  migrations: {
    directory: string;
    tableName: string;
  };
  seeds: {
    directory: string;
  };
}

export default registerAs('database', (): DatabaseConfig => {
  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgresql://postgres:password@localhost:5432/strengthos_dev';

  // Parse DATABASE_URL to extract components
  const url = new URL(databaseUrl);

  return {
    // Shared DatabaseConfig properties
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1), // Remove leading slash
    username: url.username,
    password: url.password,
    timezone: false,

    // Extended properties
    url: databaseUrl,
    ssl: process.env.DATABASE_SSL === 'true',
    poolMin: parseInt(process.env.DATABASE_POOL_MIN || '1', 10),
    poolMax: parseInt(process.env.DATABASE_POOL_MAX || '5', 10),
    timeout: parseInt(process.env.DATABASE_TIMEOUT || '30000', 10),
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
    },
  };
});
