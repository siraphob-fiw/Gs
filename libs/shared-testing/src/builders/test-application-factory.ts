import { Type } from '@nestjs/common';
import { MockDefinition } from './test-module-builder';

export interface TestAppConfig {
  database?: {
    type: 'mock' | 'memory' | 'test-db';
    connectionString?: string;
  };
  cache?: {
    type: 'mock' | 'memory';
  };
  notifications?: {
    enabled: boolean;
    mockAll: boolean;
  };
  monitoring?: {
    enabled: boolean;
    mockSecurityEvents: boolean;
  };
}

export interface ApplicationMock {
  module: Type<any>;
  providers: MockDefinition[];
}

export interface ITestApplicationFactory {
  create(config?: TestAppConfig): Promise<any>;
  withMocks(mocks: ApplicationMock[]): ITestApplicationFactory;
  withModules(modules: Type<any>[]): ITestApplicationFactory;
}

class TestApplicationFactoryImpl implements ITestApplicationFactory {
  private mocks: ApplicationMock[] = [];
  private modules: Type<any>[] = [];
  private config: TestAppConfig = {};

  constructor(private appModule: Type<any>) {}

  withMocks(mocks: ApplicationMock[]): ITestApplicationFactory {
    this.mocks = [...this.mocks, ...mocks];
    return this;
  }

  withModules(modules: Type<any>[]): ITestApplicationFactory {
    this.modules = [...this.modules, ...modules];
    return this;
  }

  async create(config?: TestAppConfig): Promise<any> {
    this.config = { ...this.config, ...config };

    // For now, return a mock application until NestJS testing is properly set up
    return {
      get: (token: any) => this.getMockService(token),
      close: () => Promise.resolve(),
      init: () => Promise.resolve(),
      useLogger: () => {},
      getHttpServer: () => ({})
    };
  }

  private getMockService(token: any): any {
    // Return appropriate mock based on token
    if (typeof token === 'string') {
      switch (token) {
        case 'DatabaseService':
          return { knex: {}, transaction: () => {} };
        case 'CacheService':
          return {
            get: () => Promise.resolve(null),
            set: () => Promise.resolve(undefined),
            delete: () => Promise.resolve(true),
            clear: () => Promise.resolve(undefined),
            exists: () => Promise.resolve(false)
          };
        case 'NotificationService':
          return {
            sendEmail: () => Promise.resolve(true),
            sendSMS: () => Promise.resolve(true),
            sendPushNotification: () => Promise.resolve(true)
          };
        default:
          return {};
      }
    }
    return {};
  }
}

export class TestApplicationFactory {
  static create(appModule: Type<any>): ITestApplicationFactory {
    return new TestApplicationFactoryImpl(appModule);
  }

  /**
   * Create a test application with comprehensive mocking
   */
  static async createWithComprehensiveMocks(
    appModule: Type<any>,
    config: TestAppConfig = {}
  ): Promise<any> {
    const defaultConfig: TestAppConfig = {
      database: { type: 'mock' },
      cache: { type: 'mock' },
      notifications: { enabled: false, mockAll: true },
      monitoring: { enabled: false, mockSecurityEvents: true }
    };

    return TestApplicationFactory
      .create(appModule)
      .create({ ...defaultConfig, ...config });
  }

  /**
   * Create a test application with minimal mocking for integration tests
   */
  static async createWithMinimalMocks(
    appModule: Type<any>,
    config: TestAppConfig = {}
  ): Promise<any> {
    const defaultConfig: TestAppConfig = {
      database: { type: 'memory' },
      cache: { type: 'memory' },
      notifications: { enabled: true, mockAll: false },
      monitoring: { enabled: true, mockSecurityEvents: false }
    };

    return TestApplicationFactory
      .create(appModule)
      .create({ ...defaultConfig, ...config });
  }
}

/**
 * Utility functions for test application management
 */
export class TestApplicationUtils {
  /**
   * Clean up test application and close connections
   */
  static async cleanup(app: any): Promise<void> {
    if (app && app.close) {
      await app.close();
    }
  }

  /**
   * Reset all mocks in the application
   */
  static resetMocks(app: any): void {
    // This would reset all registered mocks
    // Implementation depends on how mocks are tracked
  }

  /**
   * Get mock service from application context
   */
  static getMockService<T>(app: any, token: string | Type<T>): T {
    return app.get(token);
  }

  /**
   * Configure test database for integration tests
   */
  static async setupTestDatabase(app: any): Promise<void> {
    // Setup test database schema, run migrations, etc.
    // This is application-specific
  }

  /**
   * Clean up test database after tests
   */
  static async cleanupTestDatabase(app: any): Promise<void> {
    // Clean up test data, reset database state
    // This is application-specific
  }
}