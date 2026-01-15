import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Knex } from 'knex';
import { createDatabase, IDb } from '@strengthos/shared-database';
import { DatabaseConfig } from '../config/database.config';
import { ConnectionError } from '@strengthos/shared-validation';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: IDb;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private connectionRetryCount = 0;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_BASE = 1000; // 1 second

  constructor(
    @Inject('DATABASE_CONFIG') private readonly config: DatabaseConfig,
  ) {}

  async onModuleInit() {
    this.db = createDatabase({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      username: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      pool: { min: this.config.poolMin || 2, max: this.config.poolMax || 10 },
      timeout: this.config.timeout || 30000,
      timezone: this.config.timezone || false,
    });

    // Verify the database object was created properly
    if (!this.db || typeof this.db.testConnection !== 'function') {
      throw new Error('Failed to create database connection object');
    }

    // Test the connection with retry logic
    const isConnected = await this.establishConnectionWithRetry();
    if (!isConnected) {
      throw new ConnectionError(
        'database',
        new Error('Failed to establish database connection after retries'),
      );
    }

    // Start connection health monitoring
    this.startHealthMonitoring();
  }

  async onModuleDestroy() {
    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Close database connection using standardized cleanup procedures
    if (this.db && typeof this.db.close === 'function') {
      await this.db.close();
    }
  }

  get knex(): Knex {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Make sure the module has been initialized.',
      );
    }
    return this.db.knex;
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized for connection test');
      }

      // Use enhanced testConnection method from shared database utilities
      const isConnected = await this.db.testConnection();

      // Return connection status as boolean
      return !!isConnected;
    } catch (error) {
      Logger.error('Database connection test failed:', error);
      throw new Error('Database connection test failed');
    }
  }

  async runMigrations(): Promise<void> {
    Logger.log('Running database migrations...');
    try {
      const [batchNo, log] = await this.knex.migrate.latest();
      if (log.length === 0) {
        Logger.log('Database is already up to date');
      } else {
        Logger.log(`Batch ${batchNo} run: ${log.length} migrations`);
        log.forEach((migration) => {
          Logger.log(`Migration applied: ${migration}`);
        });
      }
    } catch (error) {
      Logger.error('Migration failed:', error);
      throw error;
    }
  }

  async rollbackMigrations(steps?: number): Promise<void> {
    Logger.log(`Rolling back ${steps || 'last'} migration(s)...`);
    try {
      let result;
      if (steps) {
        // Rollback specific number of steps
        for (let i = 0; i < steps; i++) {
          result = await this.knex.migrate.rollback();
          if (result[1].length === 0) {
            break; // No more migrations to rollback
          }
        }
      } else {
        // Rollback last batch
        result = await this.knex.migrate.rollback();
      }

      const [batchNo, log] = result || [0, []];
      if (log.length === 0) {
        Logger.log('No migrations to rollback');
      } else {
        Logger.log(`Batch ${batchNo} rolled back: ${log.length} migrations`);
        log.forEach((migration) => {
          Logger.log(`Migration rolled back: ${migration}`);
        });
      }
    } catch (error) {
      Logger.error('Rollback failed:', error);
      throw error;
    }
  }

  async runSeeds(): Promise<void> {
    Logger.log('Running database seeds...');
    try {
      const [log] = await this.knex.seed.run();
      if (log.length === 0) {
        Logger.log('No seeds to run');
      } else {
        Logger.log(`Seeds run: ${log.length} files`);
        log.forEach((seed) => {
          Logger.log(`Seed applied: ${seed}`);
        });
      }
    } catch (error) {
      Logger.error('Seeding failed:', error);
      throw error;
    }
  }

  async getMigrationStatus(): Promise<any[]> {
    try {
      return await this.knex.migrate.list();
    } catch (error) {
      Logger.error('Failed to get migration status:', error);
      throw error;
    }
  }

  /**
   * Execute a raw SQL query
   */
  async query(sql: string, params?: any[]): Promise<any> {
    const result = await this.knex.raw(sql, params);
    return result.rows || result;
  }

  /**
   * Establishes database connection with exponential backoff retry logic
   */
  private async establishConnectionWithRetry(): Promise<boolean> {
    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const isConnected = await this.testConnection();

        if (isConnected) {
          this.connectionRetryCount = 0; // Reset retry count on success
          return true;
        }

        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          const delay = this.RETRY_DELAY_BASE * Math.pow(2, attempt - 1); // Exponential backoff
          await this.sleep(delay);
        }
      } catch (error) {
        Logger.error('Database connection failed:', error);
        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          const delay = this.RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    this.connectionRetryCount++;
    return false;
  }

  /**
   * Starts connection health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const isHealthy = await this.testConnection();

        if (!isHealthy) {
          // Attempt to reconnect if health check fails
          await this.establishConnectionWithRetry();
          // no-op: suppress logging
        } else {
          // no-op: suppress logging
        }
      } catch (error) {
        Logger.error('Health check failed:', error);
        // no-op: suppress logging
      }
    }, this.HEALTH_CHECK_INTERVAL);

    // no-op: suppress logging
  }

  /**
   * Gets current connection health status
   */
  async getConnectionHealth(): Promise<{
    isHealthy: boolean;
    lastCheck: Date;
    retryCount: number;
    poolStats?: any;
  }> {
    const isHealthy = await this.testConnection();

    // Get pool statistics if available
    let poolStats;
    try {
      if (
        this.db &&
        this.db.knex &&
        this.db.knex.client &&
        this.db.knex.client.pool
      ) {
        const pool = this.db.knex.client.pool;
        poolStats = {
          size: pool.size,
          available: pool.available,
          borrowed: pool.borrowed,
          pending: pool.pending,
          max: pool.max,
          min: pool.min,
        };
      }
    } catch (error) {
      Logger.error('Failed to get pool statistics:', error);
    }

    return {
      isHealthy,
      lastCheck: new Date(),
      retryCount: this.connectionRetryCount,
      poolStats,
    };
  }

  /**
   * Get the database instance for direct queries
   */
  getDatabase(): IDb {
    if (!this.db) {
      throw new Error(
        'Database not initialized. Make sure the module has been initialized.',
      );
    }
    return this.db;
  }

  /**
   * Utility method for sleep/delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
