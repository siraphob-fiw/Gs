import Knex from 'knex';
import { DatabaseConfig } from '@strengthos/shared-types';
import {
  ConnectionConfigFactory,
  DatabaseConnectionConfig,
  ConnectionConfigUtils,
} from '@strengthos/shared-validation';

export interface IDb {
  get knex(): Knex.Knex<any, unknown[]>;
  testConnection(): Promise<boolean>;
  testConnectionWithRetry(maxRetries?: number): Promise<boolean>;
  getConnectionHealth(): Promise<ConnectionHealthStatus>;
  getPoolStatus(): PoolStatus;
  close(): Promise<void>;
  closeWithCleanup(): Promise<void>;
  getConnectionInfo(): { host: string; port: number; database: string };
  isConnected(): boolean;
}

export interface ConnectionHealthStatus {
  isHealthy: boolean;
  responseTime: number;
  error?: string;
  timestamp: Date;
  poolStatus: PoolStatus;
}

export interface PoolStatus {
  used: number;
  free: number;
  pending: number;
  min: number;
  max: number;
}

export class Db implements IDb {
  private _knex: Knex.Knex<any, unknown[]>;
  private _config: DatabaseConnectionConfig;
  private _isConnected: boolean = false;

  constructor(config?: DatabaseConfig | DatabaseConnectionConfig) {
    // Properly select config: prefer explicit, fall back to env with validation
    let finalConfig: DatabaseConnectionConfig | undefined;

    if (config && Db.isLegacyConfigStatic(config)) {
      finalConfig = Db.convertLegacyConfigStatic(config);
    } else if (config && Db.isStandardizedConfigStatic(config)) {
      finalConfig = config as DatabaseConnectionConfig;
    } else {
      const configResult = ConnectionConfigFactory.createDatabaseConfig();
      if (!configResult.isValid) {
        const errorMessages =
          configResult.errors?.map((err) => `${err.field}: ${err.message}`).join(', ') ||
          'Unknown validation error';
        throw new Error(`Database configuration validation failed: ${errorMessages}`);
      }
      finalConfig = configResult.data!;
    }

    // Always validate (even after our own conversion)
    const validationResult = ConnectionConfigFactory.validateDatabaseConfig(finalConfig);
    if (!validationResult.isValid) {
      const errorMessages =
        validationResult.errors?.map((err) => `${err.field}: ${err.message}`).join(', ') ||
        'Unknown validation error';
      throw new Error(`Database configuration validation failed: ${errorMessages}`);
    }

    this._config = finalConfig;

    // Masked DSN
    const maskedConnectionString = ConnectionConfigUtils.createMaskedConnectionString(this._config);

    // Actual Knex connection config
    this._knex = Knex({
      client: 'pg',
      connection: {
        host: this._config.host,
        port: this._config.port,
        user: this._config.username,
        password: this._config.password,
        database: this._config.database,
        ssl: this._config.ssl ? { rejectUnauthorized: false } : false,
      },
      pool: {
        min: this._config.pool.min,
        max: this._config.pool.max,
      },
      acquireConnectionTimeout: this._config.timeout,
    });

    // Hook up event handlers
    this._knex
      .on('query', () => {
        this._isConnected = true;
      })
      .on('query-error', (error) => {
        this._isConnected = false;
      });
  }

  public get knex(): Knex.Knex<any, unknown[]> {
    return this._knex;
  }

  public async testConnection(): Promise<boolean> {
    try {
      const startTime = Date.now();
      await this._knex.raw('SELECT 1 as test');
      const duration = Date.now() - startTime;
      this._isConnected = true;
      return true;
    } catch (error: any) {
      this._isConnected = false;
      const errorMessage = error?.message ?? String(error) ?? 'Unknown error';
      this.logConnectionErrorContext(errorMessage);
      return false;
    }
  }

  public async testConnectionWithRetry(maxRetries: number = 3): Promise<boolean> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        await this._knex.raw('SELECT 1 as test');
        const duration = Date.now() - startTime;
        this._isConnected = true;
        return true;
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(error?.message || 'Unknown error');
        this._isConnected = false;
        if (attempt < maxRetries) {
          const backoffDelay = this.calculateExponentialBackoff(attempt);
          await this.sleep(backoffDelay);
        }
      }
    }
    console.error(
      `❌ Database connection failed after ${maxRetries} attempts: ${lastError?.message}`
    );
    this.logConnectionErrorContext(lastError?.message || 'Unknown error');
    return false;
  }

  public async getConnectionHealth(): Promise<ConnectionHealthStatus> {
    const startTime = Date.now();
    let isHealthy = false;
    let error: string | undefined;
    try {
      await this._knex.raw('SELECT 1 as health_check');
      await this._knex.raw('SELECT current_timestamp as server_time');
      isHealthy = true;
      this._isConnected = true;
    } catch (err: any) {
      isHealthy = false;
      this._isConnected = false;
      error = err?.message ?? String(err) ?? 'Unknown error';
    }
    const responseTime = Date.now() - startTime;
    const poolStatus = this.getPoolStatus();
    return {
      isHealthy,
      responseTime,
      error,
      timestamp: new Date(),
      poolStatus,
    };
  }

  public getPoolStatus(): PoolStatus {
    const pool = (this._knex as any).client?.pool;
    if (!pool) {
      return {
        used: 0,
        free: 0,
        pending: 0,
        min: this._config.pool.min,
        max: this._config.pool.max,
      };
    }
    return {
      used: typeof pool.numUsed === 'function' ? pool.numUsed() || 0 : 0,
      free: typeof pool.numFree === 'function' ? pool.numFree() || 0 : 0,
      pending: typeof pool.numPendingAcquires === 'function' ? pool.numPendingAcquires() || 0 : 0,
      min: this._config.pool.min,
      max: this._config.pool.max,
    };
  }

  public async close(): Promise<void> {
    try {
      await this._knex.destroy();
      this._isConnected = false;
    } catch (error: any) {
      const errorMessage = error?.message ?? String(error) ?? 'Unknown error';
      console.error('❌ Error closing database connection:', errorMessage);
      throw error;
    }
  }

  public async closeWithCleanup(): Promise<void> {
    try {
      const poolStatus = this.getPoolStatus();
      await this._knex.destroy();
      this._isConnected = false;
    } catch (error: any) {
      const errorMessage = error?.message ?? String(error) ?? 'Unknown error';
      console.error('❌ Error during database connection cleanup:', errorMessage);
      try {
        await this._knex.destroy();
        this._isConnected = false;
      } catch (forceError) {
        console.error('❌ Failed to force close database connection:', forceError);
      }
      throw error;
    }
  }

  public getConnectionInfo(): { host: string; port: number; database: string } {
    return {
      host: this._config.host,
      port: this._config.port,
      database: this._config.database,
    };
  }

  public isConnected(): boolean {
    return this._isConnected;
  }

  // -- Static & Instance helpers --

  private static isLegacyConfigStatic(config: any): config is DatabaseConfig {
    return (
      config &&
      typeof config.host === 'string' &&
      typeof config.port === 'number' &&
      typeof config.database === 'string' &&
      typeof config.username === 'string' &&
      typeof config.password === 'string' &&
      !('ssl' in config) &&
      !('pool' in config) &&
      !('timeout' in config)
    );
  }
  private static isStandardizedConfigStatic(config: any): config is DatabaseConnectionConfig {
    return (
      config &&
      typeof config.host === 'string' &&
      typeof config.port === 'number' &&
      typeof config.database === 'string' &&
      typeof config.username === 'string' &&
      typeof config.password === 'string' &&
      typeof config.ssl === 'boolean' &&
      config.pool &&
      typeof config.pool.min === 'number' &&
      typeof config.pool.max === 'number' &&
      typeof config.timeout === 'number'
    );
  }
  private static convertLegacyConfigStatic(legacyConfig: DatabaseConfig): DatabaseConnectionConfig {
    return {
      host: legacyConfig.host,
      port: legacyConfig.port,
      database: legacyConfig.database,
      username: legacyConfig.username,
      password: legacyConfig.password,
      ssl: false,
      pool: {
        min: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
        max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
      },
      timeout: parseInt(process.env.DATABASE_TIMEOUT || '30000', 10),
    };
  }

  /**
   * Calculates exponential backoff delay for retry attempts
   */
  private calculateExponentialBackoff(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async waitForPendingConnections(timeoutMs: number): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const poolStatus = this.getPoolStatus();
      if (poolStatus.pending === 0) {
        return;
      }
      await this.sleep(100);
    }
    const poolStatus = this.getPoolStatus();
    console.warn(
      `⚠️  Timeout waiting for pending connections. ${poolStatus.pending} connections still pending`
    );
  }

  private logConnectionErrorContext(errorMessage: string): void {
    try {
      if (errorMessage.includes('ECONNREFUSED')) {
        console.error('💡 Connection refused - check if database server is running and accessible');
        console.error(`💡 Verify connection details: ${this._config.host}:${this._config.port}`);
      } else if (
        errorMessage.includes('authentication failed') ||
        errorMessage.includes('password authentication failed')
      ) {
        console.error('💡 Authentication failed - check username and password');
        console.error(
          `💡 Username: ${ConnectionConfigUtils.createMaskedConnectionString(this._config).split(':')[0]}`
        );
      } else if (errorMessage.includes('database') && errorMessage.includes('does not exist')) {
        console.error('💡 Database does not exist - check database name');
        console.error(`💡 Database name: ${this._config.database}`);
      } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
        console.error('💡 Connection timeout - check network connectivity and database server load');
        console.error(`💡 Timeout setting: ${this._config.timeout}ms`);
      } else if (errorMessage.includes('SSL') || errorMessage.includes('ssl')) {
        console.error('💡 SSL connection issue - check SSL configuration');
        console.error(`💡 SSL enabled: ${this._config.ssl}`);
      } else if (errorMessage.includes('pool')) {
        const poolStatus = this.getPoolStatus();
        console.error('💡 Connection pool issue - check pool configuration');
        console.error(
          `💡 Pool status: ${poolStatus.used}/${poolStatus.max} used, ${poolStatus.pending} pending`
        );
      }
    } catch (e) {
      // Defensive: do not throw in error logger
    }
  }
}

export function createDatabase(config?: DatabaseConfig | DatabaseConnectionConfig): IDb {
  return new Db(config);
}

export function createDatabaseWithStandardConfig(): IDb {
  const configResult = ConnectionConfigFactory.createDatabaseConfig();
  if (!configResult.isValid) {
    const errorMessages =
      configResult.errors?.map((err) => `${err.field}: ${err.message}`).join(', ') ||
      'Unknown validation error';
    throw new Error(`Failed to create database with standard configuration: ${errorMessages}`);
  }
  return new Db(configResult.data);
}

let dbInstance: IDb | null = null;
export function getDatabase(config?: DatabaseConfig | DatabaseConnectionConfig): IDb {
  if (!dbInstance) {
    dbInstance = new Db(config);
  }
  return dbInstance;
}

export function resetDatabaseInstance(): void {
  if (dbInstance) {
    dbInstance.close().catch((error) => {
      console.error('Error closing database instance during reset:', error);
    });
    dbInstance = null;
  }
}

export class DatabaseConnectionMonitor {
  private static healthCheckInterval: NodeJS.Timeout | null = null;
  private static isMonitoring = false;

  static startHealthMonitoring(
    db: IDb,
    intervalMs: number = 30000,
    onHealthChange?: (health: ConnectionHealthStatus) => void,
  ): void {
    if (this.isMonitoring) {
      console.warn('⚠️  Database health monitoring is already running');
      return;
    }
    this.isMonitoring = true;

    let lastHealthStatus: boolean | null = null;

    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await db.getConnectionHealth();
        if (lastHealthStatus !== health.isHealthy) {
          if (health.isHealthy) {
          } else {
            console.error(`❌ Database connection unhealthy: ${health.error}`);
          }
          lastHealthStatus = health.isHealthy;
        }
        if (onHealthChange) {
          try {
            onHealthChange(health);
          } catch (cbErr) {
            console.error('Error in healthChange callback:', cbErr);
          }
        }
        const poolStatus = health.poolStatus;
        if (poolStatus.used >= poolStatus.max * 0.8) {
          console.warn(
            `⚠️  High database pool utilization: ${poolStatus.used}/${poolStatus.max} connections used`
          );
        }
      } catch (error) {
        console.error('❌ Error during health check:', error);
      }
    }, intervalMs);
  }

  static stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.isMonitoring = false;
    }
  }

  static isHealthMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}

export class DatabaseConnectionRetry {
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000,
  ): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt < maxRetries) {
          const delay = this.calculateBackoffDelay(attempt, baseDelayMs);
          await this.sleep(delay);
        }
      }
    }
    throw new Error(
      `Database operation failed after ${maxRetries} attempts: ${lastError?.message}`,
    );
  }

  private static calculateBackoffDelay(attempt: number, baseDelayMs: number): number {
    const maxDelay = 30000;
    const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelay);
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
