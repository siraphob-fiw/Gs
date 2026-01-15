/**
 * Example test demonstrating the new testing infrastructure
 * This shows how to use the enhanced TestModuleBuilder and test factories
 */
import { TestingModule } from '@nestjs/testing';
import { 
  TestModuleBuilder,
  userTestFactory,
  tenantTestFactory,
  SosWebApiTestConfigs 
} from '../test-setup';

// Mock service class for demonstration
class MockUserService {
  async findById(id: string) {
    return { id, name: 'Test User' };
  }

  async create(userData: any) {
    return { id: 'new-id', ...userData };
  }
}

describe('Example Test - Enhanced Testing Infrastructure', () => {
  let module: TestingModule;
  let userService: MockUserService;

  beforeEach(async () => {
    // Use the enhanced TestModuleBuilder with pre-configured mocks
    const testResult = await TestModuleBuilder
      .forSosWebApiService<MockUserService>(MockUserService)
      .withMocks([
        // Additional app-specific mocks can be added here
        { provide: 'CustomService', useValue: { getData: jest.fn().mockReturnValue('test-data') } }
      ])
      .build();

    module = testResult.module;
    userService = testResult.service;
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('TestModuleBuilder Integration', () => {
    it('should create service with mocked dependencies', () => {
      expect(userService).toBeDefined();
      expect(userService).toBeInstanceOf(MockUserService);
    });

    it('should have access to mocked services', async () => {
      const result = await userService.findById('test-id');
      expect(result).toEqual({ id: 'test-id', name: 'Test User' });
    });
  });

  describe('Test Data Factories', () => {
    it('should create test users with factory', () => {
      const user = userTestFactory.create({
        email: 'test@example.com',
        role: 'COACH'
      });

      expect(user).toMatchObject({
        email: 'test@example.com',
        role: 'COACH',
        isActive: true
      });
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should create multiple users with unique data', () => {
      const users = userTestFactory.createMany(3, { tenantId: 'test-tenant' });

      expect(users).toHaveLength(3);
      expect(users[0].email).not.toBe(users[1].email);
      expect(users.every(user => user.tenantId === 'test-tenant')).toBe(true);
    });

    it('should create test tenants with factory', () => {
      const tenant = tenantTestFactory.create({
        name: 'Test Organization',
        status: 'ACTIVE'
      });

      expect(tenant).toMatchObject({
        name: 'Test Organization',
        status: 'ACTIVE'
      });
      expect(tenant.settings).toBeDefined();
      expect(tenant.settings.allowSelfCoached).toBe(true);
    });

    it('should reset factory state between tests', () => {
      // Create a user to increment the sequence
      const user1 = userTestFactory.create();
      
      // Reset the factory
      userTestFactory.reset();
      
      // Create another user - should start from sequence 1 again
      const user2 = userTestFactory.create();
      
      expect(user1.id).toBe('user-1');
      expect(user2.id).toBe('user-1'); // Should be the same after reset
    });
  });

  describe('Test Configuration', () => {
    it('should provide unit test configuration', () => {
      const config = SosWebApiTestConfigs.forUnitTests();

      expect(config.database?.type).toBe('mock');
      expect(config.notifications?.mockAll).toBe(true);
      expect(config.auth?.mockJwt).toBe(true);
    });

    it('should provide integration test configuration', () => {
      const config = SosWebApiTestConfigs.forIntegrationTests();

      expect(config.database?.type).toBe('memory');
      expect(config.tenant?.id).toBe('integration-test-tenant');
      expect(config.features?.enableNotifications).toBe(true);
    });

    it('should allow custom configuration merging', () => {
      const baseConfig = SosWebApiTestConfigs.forUnitTests();
      const customConfig = SosWebApiTestConfigs.custom(baseConfig, {
        auth: { mockJwt: false, defaultRole: 'ADMIN' }
      });

      expect(customConfig.auth?.mockJwt).toBe(false);
      expect(customConfig.auth?.defaultRole).toBe('ADMIN');
      expect(customConfig.database?.type).toBe('mock'); // Should preserve base config
    });
  });

  describe('Mock Integration', () => {
    it('should have access to common service mocks', async () => {
      // The TestModuleBuilder should have set up common mocks
      const mockLogger = module.get('ILogger');
      const mockNotificationService = module.get('NotificationService');

      expect(mockLogger).toBeDefined();
      expect(mockNotificationService).toBeDefined();
      
      // Test that mocks are properly configured
      mockLogger.log('test message');
      expect(mockLogger.log).toHaveBeenCalledWith('test message');
    });

    it('should support tenant context mocks', async () => {
      const tenantMocks = TestModuleBuilder.withTenantContext('test-tenant-id');
      
      const tenantTestResult = await TestModuleBuilder
        .forSosWebApiService<MockUserService>(MockUserService)
        .withMocks(tenantMocks)
        .build();

      const tenantContextService = tenantTestResult.module.get('TenantContextService');
      expect(tenantContextService.getCurrentTenantId()).toBe('test-tenant-id');

      await tenantTestResult.module.close();
    });

    it('should support authentication mocks', async () => {
      const authMocks = TestModuleBuilder.withAuthMocks();
      
      const authTestResult = await TestModuleBuilder
        .forSosWebApiService<MockUserService>(MockUserService)
        .withMocks(authMocks)
        .build();

      const jwtService = authTestResult.module.get('JwtService');
      const token = jwtService.sign({ userId: 'test-user' });
      
      expect(token).toBe('mock-jwt-token');
      expect(jwtService.sign).toHaveBeenCalledWith({ userId: 'test-user' });

      await authTestResult.module.close();
    });
  });
});