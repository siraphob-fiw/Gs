# Modern Testing Patterns Guide

This guide covers the new testing patterns and best practices implemented in the StrengthOS testing architecture modernization.

## Overview

The modernized testing architecture follows these key principles:

1. **Separated Test Applications** - Tests run in dedicated applications, not in production code
2. **Dependency Injection Overrides** - No global mocks, all mocking through DI
3. **Isolated Test Modules** - Each test creates only the modules it needs
4. **Realistic Mock Factories** - Consistent test data through factory patterns
5. **Performance Optimized** - Fast execution with proper resource management

## Architecture Overview

```
Production Apps (apps/)          Test Apps (test-apps/)
├── sos-web-api/                ├── sos-web-api-tests/
│   ├── src/                    │   ├── src/
│   │   ├── user/               │   │   ├── unit/
│   │   ├── tenant/             │   │   ├── integration/
│   │   └── auth/               │   │   ├── e2e/
│   └── package.json            │   │   ├── fixtures/
│                               │   │   └── utils/
├── sos-web-training/           │   └── package.json
│   ├── src/                    │
│   └── package.json            ├── sos-web-training-tests/
│                               │   ├── src/
└── [future-apps]/              │   └── package.json
                                │
                                └── [future-app-tests]/
```

## Testing Patterns

### 1. Unit Testing Pattern

Unit tests focus on testing individual services in complete isolation.

#### Before (Legacy Pattern)
```typescript
// ❌ Old pattern - loads entire AppModule
describe('UserService', () => {
  let service: UserService;
  let app: TestingModule;

  beforeEach(async () => {
    app = await Test.createTestingModule({
      imports: [AppModule], // Loads everything!
    }).compile();

    service = app.get<UserService>(UserService);
  });
});
```

#### After (Modern Pattern)
```typescript
// ✅ New pattern - isolated service testing
import { UserService } from '@strengthos/sos-web-api/src/user/services/user.service';
import { TestModuleBuilder } from '@strengthos/shared-testing';

describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const { service: testService, mocks } = await TestModuleBuilder
      .forService(UserService)
      .withMocks([
        { provide: UserRepository, useValue: createMockRepository() },
        { provide: 'ILogger', useValue: createMockLogger() }
      ])
      .build();

    service = testService;
    mockRepository = mocks.get(UserRepository);
  });

  it('should create user with valid data', async () => {
    // Arrange
    const userData = userFactory.create({ email: 'test@example.com' });
    mockRepository.create.mockResolvedValue(userData);

    // Act
    const result = await service.createUser(userData);

    // Assert
    expect(result.success).toBe(true);
    expect(mockRepository.create).toHaveBeenCalledWith(userData);
  });
});
```

### 2. Integration Testing Pattern

Integration tests verify that modules work together correctly.

#### Before (Legacy Pattern)
```typescript
// ❌ Old pattern - complex module setup
describe('UserModule Integration', () => {
  let app: TestingModule;

  beforeEach(async () => {
    app = await Test.createTestingModule({
      imports: [
        UserModule,
        DatabaseModule,
        NotificationModule,
        // Many other modules...
      ],
    }).compile();
  });
});
```

#### After (Modern Pattern)
```typescript
// ✅ New pattern - simplified module testing
import { UserModule } from '@strengthos/sos-web-api/src/user/user.module';
import { TestModuleBuilder } from '@strengthos/shared-testing';

describe('UserModule Integration', () => {
  let module: TestingModule;
  let userService: UserService;
  let userController: UserController;

  beforeEach(async () => {
    const { module: testModule } = await TestModuleBuilder
      .forModule(UserModule)
      .withMocks([
        { provide: DatabaseService, useValue: createMockDatabase() },
        { provide: 'NotificationService', useValue: createMockNotifications() }
      ])
      .excludeGlobalProviders(['GlobalExceptionFilter'])
      .build();

    module = testModule;
    userService = module.get<UserService>(UserService);
    userController = module.get<UserController>(UserController);
  });

  it('should handle user creation workflow', async () => {
    // Test the complete workflow from controller to service
    const userData = userFactory.create();
    
    const result = await userController.createUser(userData);
    
    expect(result.success).toBe(true);
    expect(userService.createUser).toHaveBeenCalledWith(userData);
  });
});
```

### 3. E2E Testing Pattern

E2E tests verify complete user workflows through HTTP requests.

#### Before (Legacy Pattern)
```typescript
// ❌ Old pattern - full application bootstrap
describe('User API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
});
```

#### After (Modern Pattern)
```typescript
// ✅ New pattern - controlled application factory
import { TestApplicationFactory } from '@strengthos/shared-testing';
import * as request from 'supertest';

describe('User Management E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await TestApplicationFactory
      .create()
      .withMocks([
        { 
          module: DatabaseModule, 
          providers: [
            { provide: DatabaseService, useValue: createMockDatabase() }
          ]
        },
        {
          module: NotificationModule,
          providers: [
            { provide: 'NotificationService', useValue: createMockNotifications() }
          ]
        }
      ])
      .build();
  });

  it('should handle complete user registration workflow', async () => {
    const userData = userFactory.create();

    // Test the complete HTTP workflow
    const response = await request(app.getHttpServer())
      .post('/api/users')
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(userData.email);

    // Verify user can be retrieved
    await request(app.getHttpServer())
      .get(`/api/users/${response.body.data.id}`)
      .expect(200);
  });
});
```

## Mock Factory Patterns

### 1. Service Mock Factories

Create consistent mock implementations for services:

```typescript
// utils/mock-factories.ts
export function createMockUserRepository(): jest.Mocked<UserRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByTenant: jest.fn(),
  };
}

export function createMockNotificationService(): jest.Mocked<NotificationService> {
  return {
    sendEmail: jest.fn().mockResolvedValue({ success: true }),
    sendSMS: jest.fn().mockResolvedValue({ success: true }),
    sendPush: jest.fn().mockResolvedValue({ success: true }),
  };
}
```

### 2. Data Factory Patterns

Create realistic test data with factories:

```typescript
// fixtures/user-factory.ts
export const userFactory = {
  create: (overrides: Partial<User> = {}): User => ({
    id: `user-${Date.now()}`,
    tenantId: 'default-tenant',
    email: `user-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.ATHLETE,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  createAthlete: (overrides: Partial<User> = {}): User =>
    userFactory.create({ role: UserRole.ATHLETE, ...overrides }),

  createCoach: (overrides: Partial<User> = {}): User =>
    userFactory.create({ role: UserRole.COACH, ...overrides }),

  createBatch: (count: number, overrides: Partial<User> = {}): User[] =>
    Array.from({ length: count }, (_, i) => 
      userFactory.create({ ...overrides, email: `user-${i}@example.com` })
    ),
};
```

### 3. Database Mock Patterns

Create realistic database mocks:

```typescript
// utils/database-mocks.ts
export function createMockDatabase(): jest.Mocked<DatabaseService> {
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([]),
    first: jest.fn().mockResolvedValue(null),
  };

  return {
    query: jest.fn().mockReturnValue(mockQueryBuilder),
    transaction: jest.fn().mockImplementation(callback => callback(mockQueryBuilder)),
    raw: jest.fn().mockResolvedValue({ rows: [] }),
  };
}
```

## Test Organization Patterns

### 1. Directory Structure

```
test-apps/my-app-tests/src/
├── unit/                    # Isolated service tests
│   ├── services/
│   │   ├── user.service.spec.ts
│   │   └── tenant.service.spec.ts
│   └── utils/
│       └── validation.util.spec.ts
├── integration/             # Module interaction tests
│   ├── modules/
│   │   ├── user.module.spec.ts
│   │   └── auth.module.spec.ts
│   └── workflows/
│       └── user-registration.spec.ts
├── e2e/                     # End-to-end tests
│   ├── api/
│   │   ├── users.e2e.spec.ts
│   │   └── auth.e2e.spec.ts
│   └── workflows/
│       └── complete-user-journey.e2e.spec.ts
├── fixtures/                # Test data and factories
│   ├── user-factory.ts
│   ├── tenant-factory.ts
│   └── test-data-builder.ts
└── utils/                   # Test utilities
    ├── test-module-builder.ts
    ├── test-application-factory.ts
    └── mock-factories.ts
```

### 2. Test Naming Conventions

```typescript
// ✅ Good test names - descriptive and specific
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data and return success result', () => {});
    it('should reject user creation with invalid email format', () => {});
    it('should reject user creation when email already exists', () => {});
  });

  describe('getUserById', () => {
    it('should return user when valid ID is provided', () => {});
    it('should return null when user does not exist', () => {});
    it('should throw error when invalid ID format is provided', () => {});
  });
});
```

### 3. Test Data Management

```typescript
// fixtures/test-data-builder.ts
export class TestDataBuilder {
  private users: User[] = [];
  private tenants: Tenant[] = [];

  withTenant(overrides: Partial<Tenant> = {}): TestDataBuilder {
    const tenant = tenantFactory.create(overrides);
    this.tenants.push(tenant);
    return this;
  }

  withUser(overrides: Partial<User> = {}): TestDataBuilder {
    const tenant = this.tenants[0] || tenantFactory.create();
    const user = userFactory.create({ 
      tenantId: tenant.id, 
      ...overrides 
    });
    this.users.push(user);
    return this;
  }

  withUserCohort(tenantId: string, count: number = 5): TestDataBuilder {
    const users = userFactory.createBatch(count, { tenantId });
    this.users.push(...users);
    return this;
  }

  build(): TestData {
    return {
      tenants: this.tenants,
      users: this.users,
      relationships: {
        tenantUsers: new Map(
          this.tenants.map(tenant => [
            tenant.id,
            this.users.filter(user => user.tenantId === tenant.id)
          ])
        ),
      },
    };
  }
}

// Usage in tests
const testData = new TestDataBuilder()
  .withTenant({ name: 'Test Gym' })
  .withUserCohort('tenant-1', 10)
  .build();
```

## Performance Optimization Patterns

### 1. Test Execution Speed

```typescript
// Use test.concurrent for independent tests
describe('UserService Performance', () => {
  test.concurrent('should handle multiple user creations', async () => {
    // Independent test logic
  });

  test.concurrent('should handle user updates efficiently', async () => {
    // Independent test logic
  });
});
```

### 2. Resource Management

```typescript
// Proper cleanup patterns
describe('UserService', () => {
  let service: UserService;
  let mocks: Map<string, jest.Mock>;

  beforeEach(async () => {
    const testSetup = await TestModuleBuilder
      .forService(UserService)
      .withMocks([...])
      .build();
    
    service = testSetup.service;
    mocks = testSetup.mocks;
  });

  afterEach(() => {
    // Clear all mocks to prevent state leakage
    jest.clearAllMocks();
    
    // Clear any timers
    jest.clearAllTimers();
    
    // Reset any global state
    resetGlobalTestState();
  });
});
```

### 3. Memory Management

```typescript
// Use factories instead of large static data
describe('UserService with Large Dataset', () => {
  it('should handle bulk operations efficiently', async () => {
    // ✅ Generate data on demand
    const users = userFactory.createBatch(1000);
    
    // ❌ Don't store large datasets as constants
    // const LARGE_USER_DATASET = [...]; // Memory intensive
    
    const result = await service.bulkCreateUsers(users);
    expect(result.success).toBe(true);
  });
});
```

## Error Handling Patterns

### 1. Comprehensive Error Testing

```typescript
describe('UserService Error Handling', () => {
  it('should handle database connection errors gracefully', async () => {
    // Arrange
    const mockRepo = createMockUserRepository();
    mockRepo.create.mockRejectedValue(new Error('Database connection failed'));
    
    // Act & Assert
    await expect(service.createUser(userData))
      .rejects
      .toThrow('Database connection failed');
  });

  it('should handle validation errors with proper error messages', async () => {
    // Arrange
    const invalidUserData = { email: 'invalid-email' };
    
    // Act
    const result = await service.createUser(invalidUserData);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid email format');
  });
});
```

### 2. Mock Error Scenarios

```typescript
// utils/error-scenarios.ts
export const errorScenarios = {
  databaseError: () => new Error('Database connection failed'),
  validationError: (field: string) => new Error(`Validation failed for ${field}`),
  notFoundError: (resource: string) => new Error(`${resource} not found`),
  unauthorizedError: () => new Error('Unauthorized access'),
};

// Usage in tests
it('should handle database errors', async () => {
  mockRepo.create.mockRejectedValue(errorScenarios.databaseError());
  
  await expect(service.createUser(userData))
    .rejects
    .toThrow('Database connection failed');
});
```

## Best Practices Summary

### ✅ Do's

1. **Use TestModuleBuilder** for isolated service testing
2. **Import from production apps** using `@strengthos/app-name` pattern
3. **Create realistic mock factories** for consistent test data
4. **Use dependency injection overrides** instead of global mocks
5. **Write descriptive test names** that explain the scenario
6. **Clean up resources** in afterEach hooks
7. **Test error scenarios** comprehensively
8. **Use factories for test data** instead of hardcoded objects
9. **Keep tests focused** on single responsibilities
10. **Use appropriate test types** (unit/integration/e2e) for different scenarios

### ❌ Don'ts

1. **Don't use global mocks** that affect other tests
2. **Don't load AppModule** in unit tests
3. **Don't hardcode test data** - use factories instead
4. **Don't share state** between tests
5. **Don't test implementation details** - focus on behavior
6. **Don't ignore cleanup** - always clean up resources
7. **Don't use real external services** in tests
8. **Don't write overly complex tests** - keep them simple and focused
9. **Don't skip error testing** - test both success and failure paths
10. **Don't mix test types** - keep unit, integration, and e2e tests separate

## Migration Guide

### From Legacy to Modern Patterns

1. **Move tests to test applications**
   ```bash
   # Create test application
   npm run create-test-app create my-app nestjs
   
   # Move existing tests
   mv apps/my-app/src/**/*.spec.ts test-apps/my-app-tests/src/unit/
   ```

2. **Update imports**
   ```typescript
   // Before
   import { UserService } from '../user.service';
   
   // After
   import { UserService } from '@strengthos/my-app/src/user/user.service';
   ```

3. **Replace global mocks with DI overrides**
   ```typescript
   // Before
   jest.mock('../database.service');
   
   // After
   const { service } = await TestModuleBuilder
     .forService(UserService)
     .withMocks([
       { provide: DatabaseService, useValue: createMockDatabase() }
     ])
     .build();
   ```

4. **Use factories for test data**
   ```typescript
   // Before
   const user = { id: 1, email: 'test@example.com' };
   
   // After
   const user = userFactory.create({ email: 'test@example.com' });
   ```

This modern testing architecture provides better isolation, faster execution, and more maintainable tests while ensuring production builds remain clean and optimized.