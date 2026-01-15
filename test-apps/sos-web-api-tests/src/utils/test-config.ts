/**
 * App-specific test configuration for sos-web-api tests
 * Provides configuration utilities for different test scenarios
 */
import { TestAppConfig } from '@strengthos/shared-testing';

export interface SosWebApiTestConfig extends TestAppConfig {
  tenant?: {
    id: string;
    name: string;
    domain?: string;
  };
  auth?: {
    mockJwt: boolean;
    defaultUserId?: string;
    defaultRole?: string;
  };
  features?: {
    enableVideoAnalysis: boolean;
    enableAIFeedback: boolean;
    enableNotifications: boolean;
  };
}

/**
 * Test configuration presets for different testing scenarios
 */
export class SosWebApiTestConfigs {
  /**
   * Configuration for unit tests - maximum isolation
   */
  static forUnitTests(): SosWebApiTestConfig {
    return {
      database: { type: 'mock' },
      cache: { type: 'mock' },
      notifications: { enabled: false, mockAll: true },
      monitoring: { enabled: false, mockSecurityEvents: true },
      auth: {
        mockJwt: true,
        defaultUserId: 'test-user-id',
        defaultRole: 'ATHLETE'
      },
      features: {
        enableVideoAnalysis: false,
        enableAIFeedback: false,
        enableNotifications: false
      }
    };
  }

  /**
   * Configuration for integration tests - some real services
   */
  static forIntegrationTests(): SosWebApiTestConfig {
    return {
      database: { type: 'memory' },
      cache: { type: 'memory' },
      notifications: { enabled: true, mockAll: false },
      monitoring: { enabled: true, mockSecurityEvents: false },
      tenant: {
        id: 'integration-test-tenant',
        name: 'Integration Test Tenant',
        domain: 'integration-test.example.com'
      },
      auth: {
        mockJwt: false,
        defaultUserId: 'integration-test-user',
        defaultRole: 'COACH'
      },
      features: {
        enableVideoAnalysis: true,
        enableAIFeedback: false,
        enableNotifications: true
      }
    };
  }

  /**
   * Configuration for E2E tests - comprehensive application testing
   */
  static forE2ETests(): SosWebApiTestConfig {
    return {
      database: { type: 'test-db', connectionString: process.env.TEST_DATABASE_URL },
      cache: { type: 'memory' },
      notifications: { enabled: true, mockAll: true },
      monitoring: { enabled: true, mockSecurityEvents: true },
      tenant: {
        id: 'e2e-test-tenant',
        name: 'E2E Test Tenant',
        domain: 'e2e-test.example.com'
      },
      auth: {
        mockJwt: false,
        defaultUserId: 'e2e-test-user',
        defaultRole: 'TENANT_ADMIN'
      },
      features: {
        enableVideoAnalysis: true,
        enableAIFeedback: true,
        enableNotifications: true
      }
    };
  }

  /**
   * Configuration for testing error scenarios
   */
  static forErrorTesting(): SosWebApiTestConfig {
    return {
      database: { type: 'mock' },
      cache: { type: 'mock' },
      notifications: { enabled: false, mockAll: true },
      monitoring: { enabled: true, mockSecurityEvents: true },
      auth: {
        mockJwt: true,
        defaultUserId: 'error-test-user',
        defaultRole: 'ATHLETE'
      },
      features: {
        enableVideoAnalysis: false,
        enableAIFeedback: false,
        enableNotifications: false
      }
    };
  }

  /**
   * Configuration for performance testing
   */
  static forPerformanceTests(): SosWebApiTestConfig {
    return {
      database: { type: 'memory' },
      cache: { type: 'memory' },
      notifications: { enabled: false, mockAll: true },
      monitoring: { enabled: false, mockSecurityEvents: true },
      auth: {
        mockJwt: true,
        defaultUserId: 'perf-test-user',
        defaultRole: 'COACH'
      },
      features: {
        enableVideoAnalysis: false,
        enableAIFeedback: false,
        enableNotifications: false
      }
    };
  }

  /**
   * Create a custom configuration by merging with a base configuration
   */
  static custom(baseConfig: SosWebApiTestConfig, overrides: Partial<SosWebApiTestConfig>): SosWebApiTestConfig {
    return {
      ...baseConfig,
      ...overrides,
      // Deep merge nested objects
      database: { ...baseConfig.database, ...overrides.database },
      cache: { ...baseConfig.cache, ...overrides.cache },
      notifications: { ...baseConfig.notifications, ...overrides.notifications },
      monitoring: { ...baseConfig.monitoring, ...overrides.monitoring },
      tenant: { ...baseConfig.tenant, ...overrides.tenant },
      auth: { ...baseConfig.auth, ...overrides.auth },
      features: { ...baseConfig.features, ...overrides.features }
    };
  }
}

/**
 * Environment-specific test configurations
 */
export class TestEnvironmentConfig {
  /**
   * Get configuration based on NODE_ENV
   */
  static getForEnvironment(): SosWebApiTestConfig {
    const env = process.env.NODE_ENV || 'test';
    
    switch (env) {
      case 'test:unit':
        return SosWebApiTestConfigs.forUnitTests();
      case 'test:integration':
        return SosWebApiTestConfigs.forIntegrationTests();
      case 'test:e2e':
        return SosWebApiTestConfigs.forE2ETests();
      case 'test:performance':
        return SosWebApiTestConfigs.forPerformanceTests();
      default:
        return SosWebApiTestConfigs.forUnitTests();
    }
  }

  /**
   * Get database configuration from environment variables
   */
  static getDatabaseConfig(): { type: 'mock' | 'memory' | 'test-db'; connectionString?: string } {
    const dbType = process.env.TEST_DB_TYPE as 'mock' | 'memory' | 'test-db' || 'mock';
    const connectionString = process.env.TEST_DATABASE_URL;

    return {
      type: dbType,
      connectionString: dbType === 'test-db' ? connectionString : undefined
    };
  }

  /**
   * Check if running in CI environment
   */
  static isCI(): boolean {
    return !!(process.env.CI || process.env.GITHUB_ACTIONS || process.env.JENKINS_URL);
  }

  /**
   * Get timeout values based on environment
   */
  static getTimeouts(): { unit: number; integration: number; e2e: number } {
    const isCI = this.isCI();
    
    return {
      unit: isCI ? 10000 : 5000,      // 10s in CI, 5s locally
      integration: isCI ? 30000 : 15000, // 30s in CI, 15s locally
      e2e: isCI ? 60000 : 30000       // 60s in CI, 30s locally
    };
  }
}

/**
 * Test data configuration utilities
 */
export class TestDataConfig {
  /**
   * Get default tenant configuration for tests
   */
  static getDefaultTenant(): { id: string; name: string; domain: string } {
    return {
      id: process.env.TEST_TENANT_ID || 'test-tenant-id',
      name: process.env.TEST_TENANT_NAME || 'Test Tenant',
      domain: process.env.TEST_TENANT_DOMAIN || 'test.example.com'
    };
  }

  /**
   * Get default user configuration for tests
   */
  static getDefaultUser(): { id: string; email: string; role: string } {
    return {
      id: process.env.TEST_USER_ID || 'test-user-id',
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      role: process.env.TEST_USER_ROLE || 'ATHLETE'
    };
  }

  /**
   * Get test data cleanup configuration
   */
  static getCleanupConfig(): { enabled: boolean; retainOnFailure: boolean } {
    return {
      enabled: process.env.TEST_CLEANUP_ENABLED !== 'false',
      retainOnFailure: process.env.TEST_RETAIN_ON_FAILURE === 'true'
    };
  }
}