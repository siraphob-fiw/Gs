import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  Db, 
  createDatabase, 
  DatabaseConnectionMonitor, 
  DatabaseConnectionRetry,
  ConnectionHealthStatus,
  PoolStatus
} from '../connection';
import { DatabaseConnectionConfig } from '@strengthos/shared-validation';

// Mock environment variables
const mockEnv = {
  DATABASE_HOST: 'localhost',
  DATABASE_PORT: '5432',
  DATABASE_NAME: 'test_db',
  DATABASE_USER: 'test_user',
  DATABASE_PASSWORD: 'test_password',
  DATABASE_SSL: 'false',
  DATABASE_POOL_MIN: '2',
  DATABASE_POOL_MAX: '10',
  DATABASE_TIMEOUT: '30000'
};

describe('Enhanced Database Connection', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, ...mockEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    DatabaseConnectionMonitor.stopHealthMonitoring();
  });

  describe('Db Class Enhanced Features', () => {
    it('should create database with standardized configuration', () => {
      const config: DatabaseConnectionConfig = {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        ssl: false,
        pool: { min: 2, max: 10 },
        timeout: 30000
      };

      const db = new Db(config);
      expect(db).toBeInstanceOf(Db);
      expect(db.isConnected()).toBe(false);
      
      const connectionInfo = db.getConnectionInfo();
      expect(connectionInfo.host).toBe('localhost');
      expect(connectionInfo.port).toBe(5432);
      expect(connectionInfo.database).toBe('test_db');
    });

    it('should provide pool status information', () => {
      const config: DatabaseConnectionConfig = {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        ssl: false,
        pool: { min: 2, max: 10 },
        timeout: 30000
      };

      const db = new Db(config);
      const poolStatus = db.getPoolStatus();
      
      expect(poolStatus).toHaveProperty('used');
      expect(poolStatus).toHaveProperty('free');
      expect(poolStatus).toHaveProperty('pending');
      expect(poolStatus.min).toBe(2);
      expect(poolStatus.max).toBe(10);
    });

    it('should handle legacy configuration conversion', () => {
      const legacyConfig = {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        ssl: false,
        pool: { min: 2, max: 10 },
        timeout: 30000
      };

      const db = new Db(legacyConfig);
      expect(db).toBeInstanceOf(Db);
      
      const connectionInfo = db.getConnectionInfo();
      expect(connectionInfo.host).toBe('localhost');
      expect(connectionInfo.port).toBe(5432);
      expect(connectionInfo.database).toBe('test_db');
    });
  });

  describe('Connection Health Monitoring', () => {
    it('should start and stop health monitoring', () => {
      const config: DatabaseConnectionConfig = {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        ssl: false,
        pool: { min: 2, max: 10 },
        timeout: 30000
      };

      const db = new Db(config);
      
      expect(DatabaseConnectionMonitor.isHealthMonitoringActive()).toBe(false);
      
      DatabaseConnectionMonitor.startHealthMonitoring(db, 1000);
      expect(DatabaseConnectionMonitor.isHealthMonitoringActive()).toBe(true);
      
      DatabaseConnectionMonitor.stopHealthMonitoring();
      expect(DatabaseConnectionMonitor.isHealthMonitoringActive()).toBe(false);
    });

    it('should not start monitoring if already active', () => {
      const config: DatabaseConnectionConfig = {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        ssl: false,
        pool: { min: 2, max: 10 },
        timeout: 30000
      };

      const db = new Db(config);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      DatabaseConnectionMonitor.startHealthMonitoring(db, 1000);
      DatabaseConnectionMonitor.startHealthMonitoring(db, 1000); // Second call should warn
      
      expect(consoleSpy).toHaveBeenCalledWith('⚠️  Database health monitoring is already running');
      
      DatabaseConnectionMonitor.stopHealthMonitoring();
      consoleSpy.mockRestore();
    });
  });

  describe('Connection Retry Logic', () => {
    it('should execute operation with retry on failure', async () => {
      let attempts = 0;
      const operation = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Connection failed');
        }
        return 'success';
      });

      const result = await DatabaseConnectionRetry.executeWithRetry(operation, 3, 100);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries exceeded', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(
        DatabaseConnectionRetry.executeWithRetry(operation, 2, 100)
      ).rejects.toThrow('Database operation failed after 2 attempts: Persistent failure');
      
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Configuration Validation', () => {
    it('should throw error for invalid configuration', () => {
      expect(() => {
        new Db({
          host: '',
          port: -1,
          database: '',
          username: '',
          password: '',
          ssl: false,
          pool: { min: 10, max: 5 }, // Invalid: min > max
          timeout: 500 // Too low
        } as DatabaseConnectionConfig);
      }).toThrow();
    });

    it('should create database from environment variables', () => {
      const db = createDatabase();
      expect(db).toBeInstanceOf(Db);
      
      const connectionInfo = db.getConnectionInfo();
      expect(connectionInfo.host).toBe('localhost');
      expect(connectionInfo.port).toBe(5432);
      expect(connectionInfo.database).toBe('test_db');
    });
  });
});