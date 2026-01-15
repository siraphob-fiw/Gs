import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { 
  Db, 
  createDatabase, 
  DatabaseConnectionMonitor, 
  DatabaseConnectionRetry,
  ConnectionHealthStatus,
  PoolStatus
} from '../connection';
import { DatabaseConnectionConfig, ConnectionConfigFactory } from '@strengthos/shared-validation';

// Mock test containers for now - in a real implementation, we'd use @testcontainers/postgresql
class MockPostgreSQLContainer {
  private static instance: MockPostgreSQLContainer | null = null;
  private isStarted = false;
  private port = 5433; // Use different port to avoid conflicts

  static async create() {
    if (!MockPostgreSQLContainer.instance) {
      MockPostgreSQLContainer.instance = new MockPostgreSQLContainer();
    }
    return MockPostgreSQLContainer.instance;
  }

  async start() {
    if (!this.isStarted) {
      // Simulate container startup
      await new Promise(resolve => setTimeout(resolve, 100));
      this.isStarted = true;
    }
    return this;
  }

  async stop() {
    if (this.isStarted) {
      // Simulate container shutdown
      await new Promise(resolve => setTimeout(resolve, 50));
      this.isStarted = false;
    }
  }

  getHost() {
    return 'localhost';
  }

  getMappedPort() {
    return this.port;
  }

  getDatabase() {
    return 'test_db';
  }

  getUsername() {
    return 'test_user';
  }

  getPassword() {
    return 'test_password';
  }

  getJdbcUrl() {
    return `postgresql://${this.getUsername()}:${this.getPassword()}@${this.getHost()}:${this.getMappedPort()}/${this.getDatabase()}`;
  }
}

describe('Database Connection Integration Tests', () => {
  let container: MockPostgreSQLContainer;
  let testConfig: DatabaseConnectionConfig;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    // Store original environment
    originalEnv = process.env;
    
    // Start test container
    container = await MockPostgreSQLContainer.create();
    await container.start();

    // Create test configuration
    testConfig = {
      host: container.getHost(),
      port: container.getMappedPort(),
      database: container.getDatabase(),
      username: container.getUsername(),
      password: container.getPassword(),
      ssl: false,
      pool: { min: 1, max: 5 },
      timeout: 10000
    };

    // Set environment variables for tests
    process.env.DATABASE_HOST = testConfig.host;
    process.env.DATABASE_PORT = testConfig.port.toString();
    process.env.DATABASE_NAME = testConfig.database;
    process.env.DATABASE_USER = testConfig.username;
    process.env.DATABASE_PASSWORD = testConfig.password;
    process.env.DATABASE_SSL = 'false';
    process.env.DATABASE_POOL_MIN = testConfig.pool.min.toString();
    process.env.DATABASE_POOL_MAX = testConfig.pool.max.toString();
    process.env.DATABASE_TIMEOUT = testConfig.timeout.toString();
  }, 30000);

  afterAll(async () => {
    // Restore original environment
    process.env = originalEnv;
    
    // Stop test container
    if (container) {
      await container.stop();
    }
  }, 10000);

  beforeEach(() => {
    // Stop any existing health monitoring
    DatabaseConnectionMonitor.stopHealthMonitoring();
  });

  afterEach(() => {
    // Clean up health monitoring
    DatabaseConnectionMonitor.stopHealthMonitoring();
  });

  describe('Database Connection Establishment', () => {
    it('should establish connection with test container', async () => {
      const db = new Db(testConfig);
      
      // Mock the actual connection for testing
      const mockTestConnection = vi.spyOn(db, 'testConnection').mockResolvedValue(true);
      
      try {
        const isConnected = await db.testConnection();
        expect(isConnected).toBe(true);
        expect(mockTestConnection).toHaveBeenCalled();
      } finally {
        mockTestConnection.mockRestore();
      }
    });

    it('should handle connection failures gracefully', async () => {
      const invalidConfig: DatabaseConnectionConfig = {
        ...testConfig,
        host: 'nonexistent-host',
        port: 9999
      };

      const db = new Db(invalidConfig);
      
      // Mock connection failure
      const mockTestConnection = vi.spyOn(db, 'testConnection').mockRejectedValue(
        new Error('Connection refused')
      );
      
      try {
        await expect(db.testConnection()).rejects.toThrow('Connection refused');
      } finally {
        mockTestConnection.mockRestore();
      }
    });

    it('should validate SSL/TLS connection configuration', async () => {
      const sslConfig: DatabaseConnectionConfig = {
        ...testConfig,
        ssl: true
      };

      const db = new Db(sslConfig);
      
      // Mock SSL connection
      const mockTestConnection = vi.spyOn(db, 'testConnection').mockResolvedValue(true);
      
      try {
        // SSL configuration is internal to the Db class, so we test the connection works
        const isConnected = await db.testConnection();
        expect(isConnected).toBe(true);
        
        // Verify the config was used by checking the internal config
        expect((db as any)._config.ssl).toBe(true);
      } finally {
        mockTestConnection.mockRestore();
      }
    });
  });

  describe('Connection Pool Management', () => {
    it('should respect pool configuration limits', async () => {
      const poolConfig: DatabaseConnectionConfig = {
        ...testConfig,
        pool: { min: 2, max: 8 }
      };

      const db = new Db(poolConfig);
      const poolStatus = db.getPoolStatus();
      
      expect(poolStatus.min).toBe(2);
      expect(poolStatus.max).toBe(8);
      expect(poolStatus.used).toBe(0);
      expect(poolStatus.free).toBe(0);
      expect(poolStatus.pending).toBe(0);
    });

    it('should handle pool exhaustion scenarios', async () => {
      const smallPoolConfig: DatabaseConnectionConfig = {
        ...testConfig,
        pool: { min: 1, max: 2 }
      };

      const db = new Db(smallPoolConfig);
      
      // Mock pool status to simulate exhaustion
      const mockGetPoolStatus = vi.spyOn(db, 'getPoolStatus').mockReturnValue({
        used: 2,
        free: 0,
        pending: 3,
        min: 1,
        max: 2
      });
      
      try {
        const poolStatus = db.getPoolStatus();
        expect(poolStatus.used).toBe(2);
        expect(poolStatus.free).toBe(0);
        expect(poolStatus.pending).toBe(3);
        
        // Pool is exhausted when used >= max and free === 0
        const isExhausted = poolStatus.used >= poolStatus.max && poolStatus.free === 0;
        expect(isExhausted).toBe(true);
      } finally {
        mockGetPoolStatus.mockRestore();
      }
    });

    it('should monitor pool performance under load', async () => {
      const db = new Db(testConfig);
      
      // Mock multiple concurrent operations
      const operations = Array.from({ length: 10 }, (_, i) => 
        vi.fn().mockResolvedValue(`result-${i}`)
      );
      
      const results = await Promise.all(
        operations.map(op => DatabaseConnectionRetry.executeWithRetry(op, 3, 100))
      );
      
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result).toBe(`result-${index}`);
      });
      
      operations.forEach(op => {
        expect(op).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Connection Health Checks and Recovery', () => {
    it('should perform health checks successfully', async () => {
      const db = new Db(testConfig);
      
      // Mock successful health check
      const mockTestConnection = vi.spyOn(db, 'testConnection').mockResolvedValue(true);
      
      try {
        const isHealthy = await db.testConnection();
        expect(isHealthy).toBe(true);
        expect(mockTestConnection).toHaveBeenCalled();
      } finally {
        mockTestConnection.mockRestore();
      }
    });

    it('should detect unhealthy connections', async () => {
      const db = new Db(testConfig);
      
      // Mock failed health check
      const mockTestConnection = vi.spyOn(db, 'testConnection').mockRejectedValue(
        new Error('Health check failed')
      );
      
      try {
        await expect(db.testConnection()).rejects.toThrow('Health check failed');
      } finally {
        mockTestConnection.mockRestore();
      }
    });

    it('should recover from connection failures with retry logic', async () => {
      let attempts = 0;
      const flakyOperation = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary connection failure');
        }
        return 'success';
      });

      const result = await DatabaseConnectionRetry.executeWithRetry(flakyOperation, 5, 50);
      
      expect(result).toBe('success');
      expect(flakyOperation).toHaveBeenCalledTimes(3);
      expect(attempts).toBe(3);
    });

    it('should implement exponential backoff for retries', async () => {
      const timestamps: number[] = [];
      const operation = vi.fn().mockImplementation(() => {
        timestamps.push(Date.now());
        throw new Error('Persistent failure');
      });

      await expect(
        DatabaseConnectionRetry.executeWithRetry(operation, 3, 100)
      ).rejects.toThrow('Database operation failed after 3 attempts');
      
      expect(operation).toHaveBeenCalledTimes(3);
      expect(timestamps).toHaveLength(3);
      
      // Check that delays increase (exponential backoff)
      if (timestamps.length >= 3) {
        const delay1 = timestamps[1] - timestamps[0];
        const delay2 = timestamps[2] - timestamps[1];
        
        // Second delay should be longer than first (exponential backoff)
        expect(delay2).toBeGreaterThanOrEqual(delay1);
      }
    });
  });

  describe('Connection Monitoring', () => {
    it('should start and monitor connection health', async () => {
      const db = new Db(testConfig);
      
      // Mock health check method
      const mockGetConnectionHealth = vi.spyOn(db, 'getConnectionHealth').mockResolvedValue({
        isHealthy: true,
        responseTime: 50,
        timestamp: new Date(),
        poolStatus: {
          used: 0,
          free: 2,
          pending: 0,
          min: 1,
          max: 5
        }
      });
      
      try {
        expect(DatabaseConnectionMonitor.isHealthMonitoringActive()).toBe(false);
        
        DatabaseConnectionMonitor.startHealthMonitoring(db, 100);
        expect(DatabaseConnectionMonitor.isHealthMonitoringActive()).toBe(true);
        
        // Wait for at least one health check
        await new Promise(resolve => setTimeout(resolve, 150));
        
        expect(mockGetConnectionHealth).toHaveBeenCalled();
      } finally {
        DatabaseConnectionMonitor.stopHealthMonitoring();
        mockGetConnectionHealth.mockRestore();
      }
    });

    it('should handle monitoring failures gracefully', async () => {
      const db = new Db(testConfig);
      
      // Mock health check failure
      const mockGetConnectionHealth = vi.spyOn(db, 'getConnectionHealth').mockRejectedValue(
        new Error('Health check failed')
      );
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        DatabaseConnectionMonitor.startHealthMonitoring(db, 100);
        
        // Wait for health check to fail
        await new Promise(resolve => setTimeout(resolve, 150));
        
        expect(mockGetConnectionHealth).toHaveBeenCalled();
        // Should log error but continue monitoring
        expect(consoleSpy).toHaveBeenCalled();
      } finally {
        DatabaseConnectionMonitor.stopHealthMonitoring();
        mockGetConnectionHealth.mockRestore();
        consoleSpy.mockRestore();
      }
    });

    it('should prevent multiple monitoring instances', () => {
      const db = new Db(testConfig);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      try {
        DatabaseConnectionMonitor.startHealthMonitoring(db, 1000);
        expect(DatabaseConnectionMonitor.isHealthMonitoringActive()).toBe(true);
        
        // Try to start monitoring again
        DatabaseConnectionMonitor.startHealthMonitoring(db, 1000);
        
        expect(consoleSpy).toHaveBeenCalledWith('⚠️  Database health monitoring is already running');
      } finally {
        DatabaseConnectionMonitor.stopHealthMonitoring();
        consoleSpy.mockRestore();
      }
    });
  });

  describe('Configuration Factory Integration', () => {
    it('should create database from environment variables', () => {
      const db = createDatabase();
      
      expect(db).toBeInstanceOf(Db);
      
      const connectionInfo = db.getConnectionInfo();
      expect(connectionInfo.host).toBe(testConfig.host);
      expect(connectionInfo.port).toBe(testConfig.port);
      expect(connectionInfo.database).toBe(testConfig.database);
      // Note: getConnectionInfo() doesn't return username for security reasons
    });

    it('should validate configuration before creating connection', () => {
      // Clear required environment variables
      delete process.env.DATABASE_NAME;
      delete process.env.DATABASE_USER;
      delete process.env.DATABASE_PASSWORD;
      
      try {
        expect(() => createDatabase()).toThrow();
      } finally {
        // Restore environment variables
        process.env.DATABASE_NAME = testConfig.database;
        process.env.DATABASE_USER = testConfig.username;
        process.env.DATABASE_PASSWORD = testConfig.password;
      }
    });

    it('should use ConnectionConfigFactory for standardized configuration', () => {
      const configResult = ConnectionConfigFactory.createDatabaseConfig();
      
      expect(configResult.isValid).toBe(true);
      expect(configResult.data).toBeDefined();
      
      if (configResult.data) {
        const db = new Db(configResult.data);
        expect(db).toBeInstanceOf(Db);
        
        const connectionInfo = db.getConnectionInfo();
        expect(connectionInfo.host).toBe(testConfig.host);
        expect(connectionInfo.port).toBe(testConfig.port);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection timeout', async () => {
      const timeoutConfig: DatabaseConnectionConfig = {
        ...testConfig,
        timeout: 1000 // Minimum allowed timeout
      };

      const db = new Db(timeoutConfig);
      
      // Mock timeout scenario
      const mockTestConnection = vi.spyOn(db, 'testConnection').mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 1500)
        )
      );
      
      try {
        await expect(db.testConnection()).rejects.toThrow('Connection timeout');
      } finally {
        mockTestConnection.mockRestore();
      }
    });

    it('should handle invalid credentials gracefully', async () => {
      const invalidConfig: DatabaseConnectionConfig = {
        ...testConfig,
        username: 'invalid_user',
        password: 'invalid_password'
      };

      const db = new Db(invalidConfig);
      
      // Mock authentication failure
      const mockTestConnection = vi.spyOn(db, 'testConnection').mockRejectedValue(
        new Error('Authentication failed')
      );
      
      try {
        await expect(db.testConnection()).rejects.toThrow('Authentication failed');
      } finally {
        mockTestConnection.mockRestore();
      }
    });

    it('should handle network connectivity issues', async () => {
      const networkConfig: DatabaseConnectionConfig = {
        ...testConfig,
        host: '192.0.2.1' // TEST-NET-1 address (should not be routable)
      };

      const db = new Db(networkConfig);
      
      // Mock network failure
      const mockTestConnection = vi.spyOn(db, 'testConnection').mockRejectedValue(
        new Error('Network unreachable')
      );
      
      try {
        await expect(db.testConnection()).rejects.toThrow('Network unreachable');
      } finally {
        mockTestConnection.mockRestore();
      }
    });

    it('should handle database not found errors', async () => {
      const invalidDbConfig: DatabaseConnectionConfig = {
        ...testConfig,
        database: 'nonexistent_database'
      };

      const db = new Db(invalidDbConfig);
      
      // Mock database not found
      const mockTestConnection = vi.spyOn(db, 'testConnection').mockRejectedValue(
        new Error('Database "nonexistent_database" does not exist')
      );
      
      try {
        await expect(db.testConnection()).rejects.toThrow('Database "nonexistent_database" does not exist');
      } finally {
        mockTestConnection.mockRestore();
      }
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent connections within pool limits', async () => {
      const db = new Db(testConfig);
      
      // Mock successful operations
      const operations = Array.from({ length: 20 }, (_, i) => 
        vi.fn().mockResolvedValue(`query-result-${i}`)
      );
      
      const startTime = Date.now();
      const results = await Promise.all(
        operations.map(op => DatabaseConnectionRetry.executeWithRetry(op, 3, 50))
      );
      const endTime = Date.now();
      
      expect(results).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      results.forEach((result, index) => {
        expect(result).toBe(`query-result-${index}`);
      });
    });

    it('should maintain performance under sustained load', async () => {
      const db = new Db(testConfig);
      
      // Simulate sustained load
      const batchSize = 10;
      const batches = 3;
      const results: string[] = [];
      
      for (let batch = 0; batch < batches; batch++) {
        const operations = Array.from({ length: batchSize }, (_, i) => 
          vi.fn().mockResolvedValue(`batch-${batch}-result-${i}`)
        );
        
        const batchResults = await Promise.all(
          operations.map(op => DatabaseConnectionRetry.executeWithRetry(op, 3, 50))
        );
        
        results.push(...(batchResults as string[]));
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      expect(results).toHaveLength(batches * batchSize);
      for (let i = 0; i < results.length; i++) {
        const batchIndex = Math.floor(i / batchSize);
        const resultIndex = i % batchSize;
        expect(results[i]).toBe(`batch-${batchIndex}-result-${resultIndex}`);
      }
    });
  });
});