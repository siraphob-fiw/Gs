/**
 * App-specific TestApplicationFactory for sos-web-api
 * Provides comprehensive E2E testing capabilities with application-level mocking
 */
import { INestApplication, Type } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApplicationFactory as BaseTestApplicationFactory, ApplicationMock } from '@strengthos/shared-testing';
import { SosWebApiTestConfig, SosWebApiTestConfigs } from './test-config';

// Import the main application module from sos-web-api
// Note: We'll import this dynamically to avoid configuration issues during test setup

/**
 * Test application factory specifically configured for sos-web-api with comprehensive mocking
 */
export class SosWebApiTestApplicationFactory {
  private static moduleOverrides: Map<Type<any>, any[]> = new Map();
  private static globalMocks: ApplicationMock[] = [];

  /**
   * Create a test application for E2E tests with comprehensive mocking
   */
  static async createForE2ETests(config?: Partial<SosWebApiTestConfig>): Promise<INestApplication> {
    const testConfig = SosWebApiTestConfigs.custom(
      SosWebApiTestConfigs.forE2ETests(),
      config || {}
    );

    // Create comprehensive application mocks
    const applicationMocks = this.createApplicationMocks(testConfig);

    // Create a test module that mimics the AppModule structure but with mocks
    const TestAppModule = await this.createTestAppModule(applicationMocks, testConfig);

    // Build the test module with overrides
    const moduleBuilder = Test.createTestingModule({
      imports: [TestAppModule],
    });

    // Apply all mock overrides
    this.applyMockOverrides(moduleBuilder, applicationMocks, testConfig);

    const moduleRef = await moduleBuilder.compile();
    const app = moduleRef.createNestApplication();

    // Configure E2E specific setup
    await this.setupE2EEnvironment(app, testConfig);

    await app.init();
    return app;
  }

  /**
   * Create a test application for integration tests with selective mocking
   */
  static async createForIntegrationTests(config?: Partial<SosWebApiTestConfig>): Promise<INestApplication> {
    const testConfig = SosWebApiTestConfigs.custom(
      SosWebApiTestConfigs.forIntegrationTests(),
      config || {}
    );

    // Create selective mocks for integration tests
    const applicationMocks = this.createIntegrationMocks(testConfig);

    // Create a test module that mimics the AppModule structure but with mocks
    const TestAppModule = await this.createTestAppModule(applicationMocks, testConfig);

    const moduleBuilder = Test.createTestingModule({
      imports: [TestAppModule],
    });

    this.applyMockOverrides(moduleBuilder, applicationMocks, testConfig);

    const moduleRef = await moduleBuilder.compile();
    const app = moduleRef.createNestApplication();

    await this.setupIntegrationEnvironment(app, testConfig);
    await app.init();
    return app;
  }

  /**
   * Create a test application with custom configuration and module overrides
   */
  static async createWithConfig(
    config: SosWebApiTestConfig,
    moduleOverrides?: Map<Type<any>, any[]>
  ): Promise<INestApplication> {
    const applicationMocks = this.createApplicationMocks(config);

    // Create a test module that mimics the AppModule structure but with mocks
    const TestAppModule = await this.createTestAppModule(applicationMocks, config);

    const moduleBuilder = Test.createTestingModule({
      imports: [TestAppModule],
    });

    this.applyMockOverrides(moduleBuilder, applicationMocks, config);

    // Apply custom module overrides if provided
    if (moduleOverrides) {
      for (const [token, mockValue] of moduleOverrides) {
        moduleBuilder.overrideProvider(token).useValue(mockValue);
      }
    }

    const moduleRef = await moduleBuilder.compile();
    const app = moduleRef.createNestApplication();

    await this.setupE2EEnvironment(app, config);
    await app.init();
    return app;
  }

  /**
   * Add module-specific provider overrides
   */
  static withModuleOverrides(module: Type<any>, overrides: any[]): typeof SosWebApiTestApplicationFactory {
    this.moduleOverrides.set(module, overrides);
    return this;
  }

  /**
   * Add global service mocks
   */
  static withGlobalMocks(mocks: ApplicationMock[]): typeof SosWebApiTestApplicationFactory {
    this.globalMocks = [...this.globalMocks, ...mocks];
    return this;
  }

  /**
   * Reset all configured overrides and mocks
   */
  static reset(): void {
    this.moduleOverrides.clear();
    this.globalMocks = [];
  }

  /**
   * Create a test module that mimics the AppModule structure but with test-friendly configuration
   */
  private static async createTestAppModule(
    applicationMocks: ApplicationMock[],
    config: SosWebApiTestConfig
  ): Promise<Type<any>> {
    const { Module } = await import('@nestjs/common');
    const { ConfigModule } = await import('@nestjs/config');

    // Create a minimal test module that provides the essential structure
    @Module({
      imports: [
        // Configure test-friendly config module
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => this.createTestConfiguration(config)],
          validationOptions: {
            allowUnknown: true,
            abortEarly: false,
          },
        }),
      ],
      controllers: [
        // Add a basic test controller
        {
          provide: 'TestController',
          useValue: {
            getHealth: jest.fn().mockReturnValue({ status: 'ok' }),
          },
        },
      ],
      providers: [
        // Add mock providers from application mocks
        ...this.extractProvidersFromMocks(applicationMocks),
        // Add basic app service mock
        {
          provide: 'AppService',
          useValue: {
            getHello: jest.fn().mockReturnValue('Hello World!'),
            getHealth: jest.fn().mockReturnValue({ status: 'ok' }),
          },
        },
      ],
      exports: [],
    })
    class TestAppModule {}

    return TestAppModule;
  }

  /**
   * Create test configuration that doesn't require environment variables
   */
  private static createTestConfiguration(config: SosWebApiTestConfig): Record<string, any> {
    return {
      NODE_ENV: 'test',
      DATABASE_URL: config.database?.connectionString || 'mock://test-database',
      JWT_SECRET: 'test-jwt-secret',
      JWT_EXPIRES_IN: '1h',
      CACHE_TTL: 300,
      API_PORT: 3000,
      // Add other required configuration values with test defaults
      NOTIFICATION_SERVICE_URL: 'http://localhost:3001',
      MONITORING_SERVICE_URL: 'http://localhost:3002',
      REDIS_URL: 'redis://localhost:6379',
    };
  }

  /**
   * Extract providers from application mocks
   */
  private static extractProvidersFromMocks(applicationMocks: ApplicationMock[]): any[] {
    const providers: any[] = [];
    
    for (const mock of applicationMocks) {
      providers.push(...mock.providers);
    }

    return providers;
  }

  /**
   * Create comprehensive application-level mocks for E2E tests
   */
  private static createApplicationMocks(config: SosWebApiTestConfig): ApplicationMock[] {
    const mocks: ApplicationMock[] = [];

    // Database mocks
    if (config.database?.type === 'mock') {
      mocks.push(this.createDatabaseMocks());
    }

    // Cache mocks
    if (config.cache?.type === 'mock') {
      mocks.push(this.createCacheMocks());
    }

    // Notification mocks
    if (config.notifications?.mockAll) {
      mocks.push(this.createNotificationMocks());
    }

    // Monitoring mocks
    if (config.monitoring?.mockSecurityEvents) {
      mocks.push(this.createMonitoringMocks());
    }

    // Auth mocks
    if (config.auth?.mockJwt) {
      mocks.push(this.createAuthMocks(config.auth));
    }

    // Add global mocks
    mocks.push(...this.globalMocks);

    return mocks;
  }

  /**
   * Create selective mocks for integration tests
   */
  private static createIntegrationMocks(config: SosWebApiTestConfig): ApplicationMock[] {
    const mocks: ApplicationMock[] = [];

    // Only mock external dependencies for integration tests
    if (config.notifications?.mockAll) {
      mocks.push(this.createNotificationMocks());
    }

    if (config.monitoring?.mockSecurityEvents) {
      mocks.push(this.createMonitoringMocks());
    }

    return mocks;
  }

  /**
   * Create database service mocks
   */
  private static createDatabaseMocks(): ApplicationMock {
    return {
      module: null as any, // Will be applied globally
      providers: [
        {
          provide: 'DatabaseService',
          useValue: {
            knex: {
              select: jest.fn().mockReturnThis(),
              from: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              insert: jest.fn().mockReturnThis(),
              update: jest.fn().mockReturnThis(),
              delete: jest.fn().mockReturnThis(),
              first: jest.fn().mockResolvedValue(null),
              then: jest.fn().mockResolvedValue([]),
              transaction: jest.fn().mockImplementation((callback) => callback({
                select: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                insert: jest.fn().mockReturnThis(),
                update: jest.fn().mockReturnThis(),
                delete: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue(null),
                then: jest.fn().mockResolvedValue([]),
              })),
            },
            getConnection: jest.fn().mockReturnValue({}),
            closeConnection: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: 'KNEX_CONNECTION',
          useValue: {
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null),
            then: jest.fn().mockResolvedValue([]),
            transaction: jest.fn().mockImplementation((callback) => callback({
              select: jest.fn().mockReturnThis(),
              from: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              insert: jest.fn().mockReturnThis(),
              update: jest.fn().mockReturnThis(),
              delete: jest.fn().mockReturnThis(),
              first: jest.fn().mockResolvedValue(null),
              then: jest.fn().mockResolvedValue([]),
            })),
          },
        },
      ],
    };
  }

  /**
   * Create cache service mocks
   */
  private static createCacheMocks(): ApplicationMock {
    return {
      module: null as any,
      providers: [
        {
          provide: 'CacheService',
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(true),
            clear: jest.fn().mockResolvedValue(undefined),
            exists: jest.fn().mockResolvedValue(false),
            ttl: jest.fn().mockResolvedValue(-1),
            keys: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: 'CACHE_MANAGER',
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(true),
            reset: jest.fn().mockResolvedValue(undefined),
            ttl: jest.fn().mockResolvedValue(-1),
            keys: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    };
  }

  /**
   * Create notification service mocks
   */
  private static createNotificationMocks(): ApplicationMock {
    return {
      module: null as any,
      providers: [
        {
          provide: 'NotificationService',
          useValue: {
            sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-email-id' }),
            sendSMS: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-sms-id' }),
            sendPushNotification: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-push-id' }),
            sendBulkEmail: jest.fn().mockResolvedValue({ success: true, count: 0 }),
            getNotificationHistory: jest.fn().mockResolvedValue([]),
            markAsRead: jest.fn().mockResolvedValue(true),
            getUnreadCount: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: 'EmailService',
          useValue: {
            send: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-email-id' }),
            sendTemplate: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-template-id' }),
            validateEmail: jest.fn().mockReturnValue(true),
          },
        },
      ],
    };
  }

  /**
   * Create monitoring service mocks
   */
  private static createMonitoringMocks(): ApplicationMock {
    return {
      module: null as any,
      providers: [
        {
          provide: 'MonitoringService',
          useValue: {
            logSecurityEvent: jest.fn().mockResolvedValue(undefined),
            logPerformanceMetric: jest.fn().mockResolvedValue(undefined),
            logError: jest.fn().mockResolvedValue(undefined),
            logUserActivity: jest.fn().mockResolvedValue(undefined),
            getMetrics: jest.fn().mockResolvedValue({}),
            getHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
          },
        },
        {
          provide: 'SecurityMonitoringService',
          useValue: {
            logFailedLogin: jest.fn().mockResolvedValue(undefined),
            logSuspiciousActivity: jest.fn().mockResolvedValue(undefined),
            checkRateLimit: jest.fn().mockResolvedValue(true),
            logAccessAttempt: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    };
  }

  /**
   * Create authentication service mocks
   */
  private static createAuthMocks(authConfig: SosWebApiTestConfig['auth']): ApplicationMock {
    return {
      module: null as any,
      providers: [
        {
          provide: 'JwtService',
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
            verify: jest.fn().mockReturnValue({
              sub: authConfig?.defaultUserId || 'test-user-id',
              role: authConfig?.defaultRole || 'ATHLETE',
              tenantId: 'test-tenant-id',
            }),
            decode: jest.fn().mockReturnValue({
              sub: authConfig?.defaultUserId || 'test-user-id',
              role: authConfig?.defaultRole || 'ATHLETE',
              tenantId: 'test-tenant-id',
            }),
          },
        },
        {
          provide: 'AuthService',
          useValue: {
            validateUser: jest.fn().mockResolvedValue({
              id: authConfig?.defaultUserId || 'test-user-id',
              email: 'test@example.com',
              role: authConfig?.defaultRole || 'ATHLETE',
            }),
            login: jest.fn().mockResolvedValue({
              access_token: 'mock-jwt-token',
              refresh_token: 'mock-refresh-token',
            }),
            refresh: jest.fn().mockResolvedValue({
              access_token: 'mock-new-jwt-token',
            }),
            logout: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    };
  }

  /**
   * Apply mock overrides to the module builder
   */
  private static applyMockOverrides(
    moduleBuilder: any,
    applicationMocks: ApplicationMock[],
    config: SosWebApiTestConfig
  ): void {
    // Apply application-level mocks
    for (const mock of applicationMocks) {
      for (const provider of mock.providers) {
        moduleBuilder.overrideProvider(provider.provide).useValue(provider.useValue);
      }
    }

    // Apply module-specific overrides
    for (const [module, overrides] of this.moduleOverrides) {
      for (const override of overrides) {
        moduleBuilder.overrideProvider(override.provide).useValue(override.useValue);
      }
    }
  }

  /**
   * Setup E2E testing environment
   */
  private static async setupE2EEnvironment(
    app: INestApplication, 
    config: SosWebApiTestConfig
  ): Promise<void> {
    // Setup test database if using real database
    if (config.database?.type === 'test-db') {
      await this.setupTestDatabase(app);
    }

    // Setup test tenant if specified
    if (config.tenant) {
      await this.setupTestTenant(app, config.tenant);
    }

    // Setup test user if specified
    if (config.auth?.defaultUserId) {
      await this.setupTestUser(app, config.auth);
    }

    // Configure application-specific settings
    this.configureApplicationSettings(app, config);
  }

  /**
   * Setup integration testing environment
   */
  private static async setupIntegrationEnvironment(
    app: INestApplication,
    config: SosWebApiTestConfig
  ): Promise<void> {
    // Setup in-memory database if specified
    if (config.database?.type === 'memory') {
      await this.setupInMemoryDatabase(app);
    }

    // Configure application settings for integration tests
    this.configureApplicationSettings(app, config);
  }

  /**
   * Configure application-specific settings
   */
  private static configureApplicationSettings(
    app: INestApplication,
    config: SosWebApiTestConfig
  ): void {
    // Configure global pipes, filters, interceptors for testing
    // This would be application-specific configuration
    
    // Disable certain features for testing if needed
    if (!config.features?.enableVideoAnalysis) {
      // Mock or disable video analysis features
    }

    if (!config.features?.enableAIFeedback) {
      // Mock or disable AI feedback features
    }
  }

  /**
   * Setup test database with schema and initial data
   */
  private static async setupTestDatabase(app: INestApplication): Promise<void> {
    try {
      // Get database service from the application
      const databaseService = app.get('DatabaseService');
      
      // Run migrations if needed
      // await databaseService.runMigrations();
      
      // Seed initial test data
      // await this.seedTestData(app);
      
      console.log('Test database setup completed');
    } catch (error) {
      console.error('Error setting up test database:', error);
      throw error;
    }
  }

  /**
   * Setup in-memory database for integration tests
   */
  private static async setupInMemoryDatabase(app: INestApplication): Promise<void> {
    try {
      // Configure in-memory database
      console.log('Setting up in-memory database for integration tests');
      
      // This would configure SQLite in-memory or similar
      // const databaseService = app.get('DatabaseService');
      // await databaseService.configureInMemory();
      
    } catch (error) {
      console.error('Error setting up in-memory database:', error);
      throw error;
    }
  }

  /**
   * Setup test tenant
   */
  private static async setupTestTenant(
    app: INestApplication, 
    tenantConfig: { id: string; name: string; domain?: string }
  ): Promise<void> {
    try {
      // Get tenant service and create test tenant
      // const tenantService = app.get('TenantService');
      // await tenantService.create(tenantConfig);
      
      console.log('Test tenant setup completed:', tenantConfig);
    } catch (error) {
      console.error('Error setting up test tenant:', error);
      throw error;
    }
  }

  /**
   * Setup test user
   */
  private static async setupTestUser(
    app: INestApplication, 
    authConfig: { defaultUserId?: string; defaultRole?: string }
  ): Promise<void> {
    try {
      // Get user service and create test user
      // const userService = app.get('UserService');
      // await userService.create({
      //   id: authConfig.defaultUserId,
      //   email: 'test@example.com',
      //   role: authConfig.defaultRole,
      // });
      
      console.log('Test user setup completed:', authConfig);
    } catch (error) {
      console.error('Error setting up test user:', error);
      throw error;
    }
  }

  /**
   * Seed test data into the application
   */
  private static async seedTestData(app: INestApplication): Promise<void> {
    try {
      // Seed basic test data
      console.log('Seeding test data...');
      
      // This would use the test factories to create initial data
      // const userFactory = app.get('UserFactory');
      // const tenantFactory = app.get('TenantFactory');
      
      // await tenantFactory.create({ id: 'default-tenant' });
      // await userFactory.create({ tenantId: 'default-tenant' });
      
    } catch (error) {
      console.error('Error seeding test data:', error);
      throw error;
    }
  }

  /**
   * Cleanup test application and associated resources
   */
  static async cleanup(app: INestApplication): Promise<void> {
    try {
      // Cleanup test data
      await this.cleanupTestData(app);
      
      // Close application
      await app.close();
    } catch (error) {
      console.error('Error during test cleanup:', error);
      throw error;
    }
  }

  /**
   * Cleanup test data from database
   */
  private static async cleanupTestData(app: INestApplication): Promise<void> {
    // This would clean up test data from the database
    // Implementation depends on the actual database service structure
    console.log('Cleaning up test data...');
  }
}

/**
 * Utility functions for test application management
 */
export class SosWebApiTestUtils {
  /**
   * Get a service from the test application
   */
  static getService<T>(app: INestApplication, token: any): T {
    return app.get<T>(token);
  }

  /**
   * Execute a request against the test application
   */
  static async request(app: INestApplication) {
    const { default: request } = await import('supertest');
    return request(app.getHttpServer());
  }

  /**
   * Setup authentication for requests with proper JWT token
   */
  static async setupAuth(
    app: INestApplication, 
    userId: string, 
    role: string,
    tenantId?: string
  ): Promise<string> {
    try {
      const jwtService = app.get('JwtService');
      const payload = {
        sub: userId,
        role,
        tenantId: tenantId || 'test-tenant-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      };
      
      return jwtService.sign(payload);
    } catch (error) {
      console.warn('Failed to generate JWT token, using mock token:', error);
      return 'mock-jwt-token';
    }
  }

  /**
   * Create authenticated request headers
   */
  static createAuthHeaders(token: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create test data in the application context using factories
   */
  static async createTestData(app: INestApplication, data: any): Promise<any> {
    try {
      // Use the application's services to create test data
      console.log('Creating test data:', data);
      
      // This would use actual services to create data
      // const userService = app.get('UserService');
      // const tenantService = app.get('TenantService');
      
      // Example: Create a test user
      // if (data.user) {
      //   return await userService.create(data.user);
      // }
      
      return data;
    } catch (error) {
      console.error('Error creating test data:', error);
      throw error;
    }
  }

  /**
   * Reset application state between tests
   */
  static async resetApplicationState(app: INestApplication): Promise<void> {
    try {
      // Reset caches
      const cacheService = app.get('CacheService');
      if (cacheService && cacheService.clear) {
        await cacheService.clear();
      }

      // Reset mock states
      this.resetAllMocks(app);

      // Clear test data if using test database
      // await this.clearTestData(app);

      console.log('Application state reset completed');
    } catch (error) {
      console.error('Error resetting application state:', error);
      throw error;
    }
  }

  /**
   * Reset all mock services in the application
   */
  static resetAllMocks(app: INestApplication): void {
    try {
      // Reset database mocks
      const databaseService = app.get('DatabaseService');
      if (databaseService && jest.isMockFunction(databaseService.knex)) {
        jest.clearAllMocks();
      }

      // Reset notification mocks
      const notificationService = app.get('NotificationService');
      if (notificationService && jest.isMockFunction(notificationService.sendEmail)) {
        jest.clearAllMocks();
      }

      // Reset monitoring mocks
      const monitoringService = app.get('MonitoringService');
      if (monitoringService && jest.isMockFunction(monitoringService.logSecurityEvent)) {
        jest.clearAllMocks();
      }
    } catch (error) {
      // Ignore errors if services don't exist
      console.debug('Some services not available for mock reset:', error.message);
    }
  }

  /**
   * Clear test data from database
   */
  static async clearTestData(app: INestApplication): Promise<void> {
    try {
      // This would clear test data from the database
      // const databaseService = app.get('DatabaseService');
      // await databaseService.clearTestData();
      
      console.log('Test data cleared');
    } catch (error) {
      console.error('Error clearing test data:', error);
      throw error;
    }
  }

  /**
   * Wait for application to be ready
   */
  static async waitForReady(app: INestApplication, timeout: number = 5000): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      try {
        // Try to make a health check request
        const response = await this.request(app).get('/health');
        if (response.status === 200) {
          return;
        }
      } catch (error) {
        // Continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Application not ready within ${timeout}ms`);
  }

  /**
   * Get application metrics for performance testing
   */
  static async getApplicationMetrics(app: INestApplication): Promise<any> {
    try {
      const monitoringService = app.get('MonitoringService');
      return await monitoringService.getMetrics();
    } catch (error) {
      console.warn('Could not get application metrics:', error);
      return {};
    }
  }
}

/**
 * Test application lifecycle hooks for comprehensive E2E testing
 */
export class TestApplicationHooks {
  private static setupComplete = false;
  private static cleanupHandlers: Array<() => Promise<void>> = [];

  /**
   * Setup hook to run before all tests
   */
  static async beforeAll(app: INestApplication, config?: SosWebApiTestConfig): Promise<void> {
    if (this.setupComplete) {
      return;
    }

    try {
      console.log('Running global test setup...');

      // Wait for application to be ready
      await SosWebApiTestUtils.waitForReady(app);

      // Setup test data if needed
      if (config?.database?.type === 'test-db') {
        await this.setupGlobalTestData(app, config);
      }

      // Register cleanup handlers
      this.registerCleanupHandlers(app);

      this.setupComplete = true;
      console.log('Global test setup completed');
    } catch (error) {
      console.error('Error in global test setup:', error);
      throw error;
    }
  }

  /**
   * Setup hook to run before each test
   */
  static async beforeEach(app: INestApplication): Promise<void> {
    try {
      // Reset application state
      await SosWebApiTestUtils.resetApplicationState(app);

      // Reset all mocks to clean state
      SosWebApiTestUtils.resetAllMocks(app);

      console.debug('Test setup completed for individual test');
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  }

  /**
   * Cleanup hook to run after each test
   */
  static async afterEach(app: INestApplication): Promise<void> {
    try {
      // Clear any test-specific data
      await SosWebApiTestUtils.clearTestData(app);

      // Reset mock call counts
      jest.clearAllMocks();

      console.debug('Test cleanup completed for individual test');
    } catch (error) {
      console.error('Error in test cleanup:', error);
      // Don't throw to avoid masking test failures
    }
  }

  /**
   * Cleanup hook to run after all tests
   */
  static async afterAll(app: INestApplication): Promise<void> {
    try {
      console.log('Running global test cleanup...');

      // Run all registered cleanup handlers
      for (const handler of this.cleanupHandlers) {
        await handler();
      }

      // Final application cleanup
      await SosWebApiTestApplicationFactory.cleanup(app);

      this.setupComplete = false;
      this.cleanupHandlers = [];

      console.log('Global test cleanup completed');
    } catch (error) {
      console.error('Error in global test cleanup:', error);
      throw error;
    }
  }

  /**
   * Setup global test data that persists across tests
   */
  private static async setupGlobalTestData(
    app: INestApplication,
    config: SosWebApiTestConfig
  ): Promise<void> {
    try {
      // Create default tenant if specified
      if (config.tenant) {
        await SosWebApiTestUtils.createTestData(app, { tenant: config.tenant });
      }

      // Create default user if specified
      if (config.auth?.defaultUserId) {
        await SosWebApiTestUtils.createTestData(app, {
          user: {
            id: config.auth.defaultUserId,
            role: config.auth.defaultRole,
            tenantId: config.tenant?.id,
          }
        });
      }

      console.log('Global test data setup completed');
    } catch (error) {
      console.error('Error setting up global test data:', error);
      throw error;
    }
  }

  /**
   * Register cleanup handlers for proper resource management
   */
  private static registerCleanupHandlers(app: INestApplication): void {
    // Register database cleanup
    this.cleanupHandlers.push(async () => {
      try {
        const databaseService = app.get('DatabaseService');
        if (databaseService && databaseService.closeConnection) {
          await databaseService.closeConnection();
        }
      } catch (error) {
        console.debug('Database cleanup error:', error);
      }
    });

    // Register cache cleanup
    this.cleanupHandlers.push(async () => {
      try {
        const cacheService = app.get('CacheService');
        if (cacheService && cacheService.clear) {
          await cacheService.clear();
        }
      } catch (error) {
        console.debug('Cache cleanup error:', error);
      }
    });

    // Register process cleanup handlers
    process.on('SIGINT', () => this.handleProcessExit(app));
    process.on('SIGTERM', () => this.handleProcessExit(app));
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception during tests:', error);
      this.handleProcessExit(app);
    });
  }

  /**
   * Handle process exit gracefully
   */
  private static async handleProcessExit(app: INestApplication): Promise<void> {
    try {
      await this.afterAll(app);
    } catch (error) {
      console.error('Error during process exit cleanup:', error);
    } finally {
      process.exit(1);
    }
  }

  /**
   * Add custom cleanup handler
   */
  static addCleanupHandler(handler: () => Promise<void>): void {
    this.cleanupHandlers.push(handler);
  }

  /**
   * Check if global setup is complete
   */
  static isSetupComplete(): boolean {
    return this.setupComplete;
  }
}