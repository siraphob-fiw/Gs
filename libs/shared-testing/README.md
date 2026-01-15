# @strengthos/shared-testing

Comprehensive testing utilities, factories, and mocks for StrengthOS applications. This library provides everything you need to write effective tests across the StrengthOS ecosystem.

## Features

### Modern Testing Architecture
- 🏗️ **Separated Test Applications** - Tests run in dedicated apps, not production code
- 🔧 **TestModuleBuilder** - Create isolated test modules with dependency injection overrides
- 🏭 **TestApplicationFactory** - Build complete application contexts for E2E testing
- ⚡ **Performance Optimized** - Fast execution with proper resource management
- 🎯 **No Global Mocks** - All mocking through dependency injection for better isolation

### Test Utilities & Data
- 🏭 **Factories** - Generate realistic test data with customizable options
- 🎭 **Mock Services** - Complete mock implementations of core services
- 🧪 **Test Utilities** - Helpers for database, API, and performance testing
- 🌱 **Data Seeding** - Generate complete test datasets with relationships
- ⚙️ **Test Configuration** - Pre-configured Jest/Vitest setups for different test types
- 🎯 **Assertions** - Custom assertion helpers for common patterns

## Installation

```bash
npm install @strengthos/shared-testing
```

## Quick Start

### Modern Testing Pattern (Recommended)

```typescript
import { TestModuleBuilder, userFactory } from '@strengthos/shared-testing';
import { UserService } from '@strengthos/my-app/src/user/user.service';

// Unit Test Example
describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const { service: testService, mocks } = await TestModuleBuilder
      .forService(UserService)
      .withMocks([
        { provide: UserRepository, useValue: createMockRepository() }
      ])
      .build();

    service = testService;
    mockRepository = mocks.get(UserRepository);
  });

  it('should create user successfully', async () => {
    const userData = userFactory.create({ email: 'test@example.com' });
    mockRepository.create.mockResolvedValue(userData);

    const result = await service.createUser(userData);
    
    expect(result.success).toBe(true);
    expect(mockRepository.create).toHaveBeenCalledWith(userData);
  });
});
```

### Legacy Pattern (Deprecated)

```typescript
// ❌ Old pattern - avoid using
import { createServiceMocks, seedTestData } from '@strengthos/shared-testing';

const mocks = createServiceMocks({ tenantId: tenant.id });
const testData = await seedTestData('minimal');
```

## Modern Testing Patterns

### Separated Test Applications

The modernized architecture uses dedicated test applications that import production code as dependencies:

```
Production Apps (apps/)          Test Apps (test-apps/)
├── sos-web-api/                ├── sos-web-api-tests/
│   ├── src/                    │   ├── src/
│   └── package.json            │   │   ├── unit/
│                               │   │   ├── integration/
├── sos-web-training/           │   │   ├── e2e/
│   ├── src/                    │   │   └── fixtures/
│   └── package.json            │   └── package.json
│                               │
└── [future-apps]/              └── [future-app-tests]/
```

**Benefits:**
- 🚀 **Clean Production Builds** - No test files or dependencies in production
- ⚡ **Fast Development** - Tests don't slow down production compilation
- 🔧 **Flexible Configuration** - Each test app can have custom settings
- 📦 **Isolated Dependencies** - Test libraries don't affect production bundle size

### TestModuleBuilder Pattern

Create isolated test modules with only the dependencies you need:

```typescript
// Unit Test - Test individual services
const { service, mocks } = await TestModuleBuilder
  .forService(UserService)
  .withMocks([
    { provide: UserRepository, useValue: createMockRepository() }
  ])
  .build();

// Integration Test - Test module interactions
const { module } = await TestModuleBuilder
  .forModule(UserModule)
  .withMocks([
    { provide: DatabaseService, useValue: createMockDatabase() }
  ])
  .excludeGlobalProviders(['GlobalExceptionFilter'])
  .build();
```

### TestApplicationFactory Pattern

Create complete application contexts for E2E testing:

```typescript
const app = await TestApplicationFactory
  .create()
  .withMocks([
    { 
      module: DatabaseModule, 
      providers: [
        { provide: DatabaseService, useValue: createMockDatabase() }
      ]
    }
  ])
  .build();

// Use with supertest for HTTP testing
const response = await request(app.getHttpServer())
  .post('/api/users')
  .send(userData)
  .expect(201);
```

## Factories

### User Factory

Create users with different roles and configurations:

```typescript
import { userFactory, UserRole } from '@strengthos/shared-testing';

// Basic user creation
const athlete = userFactory.createAthlete({
  email: 'athlete@gym.com',
  firstName: 'Jane',
  lastName: 'Smith'
});

const coach = userFactory.createCoach({
  tenantId: 'gym-123',
  email: 'coach@gym.com'
});

// Create with traits
const verifiedUser = userFactory.createWithTraits(['verified', 'recentLogin'], {
  email: 'verified@gym.com'
});

// Create batches
const athletes = userFactory.createBatch(10, {
  tenantId: 'gym-123',
  role: UserRole.ATHLETE
});

// Create complete test cohorts
const cohort = userFactory.createTestCohort('gym-123');
// Returns: { coachAdmin, coaches[], athletes[], selfCoached[] }
```

### Tenant Factory

Create tenants for multi-tenant testing:

```typescript
import { tenantFactory, TenantStatus } from '@strengthos/shared-testing';

const tenant = tenantFactory.create({
  name: 'Elite Fitness Center',
  domain: 'elite.strengthos.com',
  status: TenantStatus.ACTIVE
});

// Create with traits
const trialTenant = tenantFactory.createWithTraits(['trial'], {
  name: 'New Gym'
});
```

### Program Factory

Create training programs:

```typescript
import { programFactory, ProgramType } from '@strengthos/shared-testing';

const strengthProgram = programFactory.createStrengthProgram({
  name: 'Beginner Powerlifting',
  durationWeeks: 12,
  sessionsPerWeek: 3
});

const template = programFactory.createTemplate({
  name: 'Popular Template',
  isPublic: true
});
```

### Session Factory

Create training sessions:

```typescript
import { sessionFactory, SessionStatus } from '@strengthos/shared-testing';

// Different session states
const scheduled = sessionFactory.createScheduled({
  name: 'Upper Body Workout',
  scheduledAt: new Date('2024-01-15T10:00:00Z')
});

const completed = sessionFactory.createCompleted({
  name: 'Leg Day',
  duration: 90,
  rpe: 8
});

// Sessions with exercises
const sessionWithExercises = sessionFactory.createWithExercises(5, {
  name: 'Full Body Workout'
});

// Create training weeks
const trainingSessions = sessionFactory.createTrainingWeek('user-123');
```

## Mock Services

Complete mock implementations of core services:

```typescript
import { createServiceMocks, AssertionHelper } from '@strengthos/shared-testing';

describe('User Management', () => {
  let mocks: ReturnType<typeof createServiceMocks>;

  beforeEach(() => {
    mocks = createServiceMocks({
      tenantId: 'test-tenant',
      autoSuccess: true,
      simulateErrors: false,
      responseDelay: 0
    });
  });

  it('should create and retrieve users', async () => {
    const userData = {
      email: 'test@example.com',
      role: UserRole.ATHLETE
    };

    const createResult = await mocks.userService.createUser(userData);
    AssertionHelper.expectSuccess(createResult);

    const user = createResult.returnValue!;
    const getResult = await mocks.userService.getUserById(user.id);
    AssertionHelper.expectSuccess(getResult);
    
    expect(getResult.returnValue).toEqual(user);
  });
});
```

### Available Mock Services

- **MockUserManagementService** - User CRUD, search, role management
- **MockTenantManagementService** - Tenant operations, suspension/reactivation
- **MockAccessControlService** - Permissions, role assignments, audit logging
- **mockDatabaseService()** - Database operations
- **mockCacheService()** - Redis/cache operations
- **mockNotificationService()** - Email, SMS, push notifications

## Test Utilities

### Database Testing

```typescript
import { TestDatabase } from '@strengthos/shared-testing';

describe('Database Operations', () => {
  let testDb: TestDatabase;

  beforeEach(async () => {
    testDb = TestDatabase.getInstance(knex);
    await testDb.cleanDatabase();
  });

  it('should handle database operations', async () => {
    await testDb.seedDatabase({
      users: [{ id: '1', email: 'test@example.com' }],
      tenants: [{ id: '1', name: 'Test Tenant' }]
    });

    const userCount = await testDb.countRows('users');
    expect(userCount).toBe(1);
  });
});
```

### API Testing

```typescript
import { ApiTestHelper } from '@strengthos/shared-testing';

describe('API Endpoints', () => {
  let apiHelper: ApiTestHelper;

  beforeEach(() => {
    apiHelper = new ApiTestHelper(app);
  });

  it('should test authenticated endpoints', async () => {
    const token = 'jwt-token';
    
    await apiHelper.testEndpoint({
      method: 'POST',
      url: '/api/users',
      auth: token,
      body: { email: 'test@example.com' },
      expectedStatus: 201,
      expectedBody: { success: true }
    });
  });

  it('should test pagination', async () => {
    const result = await apiHelper.testPagination('/api/users', token);
    expect(result.pagination.page).toBe(1);
  });
});
```

### Performance Testing

```typescript
import { TestTimer, PerformanceHelper } from '@strengthos/shared-testing';

describe('Performance Tests', () => {
  it('should measure execution time', async () => {
    const { result, duration } = await TestTimer.measure(async () => {
      return await someExpensiveOperation();
    });

    expect(duration).toBeLessThan(1000); // Should complete in under 1s
  });

  it('should test performance under load', async () => {
    const results = await PerformanceHelper.testPerformance(
      () => someOperation(),
      {
        iterations: 100,
        maxAverageTime: 50,
        maxSingleTime: 100
      }
    );

    expect(results.averageTime).toBeLessThan(50);
  });
});
```

## Data Seeding

Generate complete test datasets with relationships:

```typescript
import { createTestSeeder, seedTestData } from '@strengthos/shared-testing';

// Quick seeding for common scenarios
const minimalData = await seedTestData('minimal');
const fullData = await seedTestData('full');
const multiTenantData = await seedTestData('multi-tenant');

// Custom seeding
const seeder = createTestSeeder({
  tenantCount: 3,
  usersPerTenant: 20,
  programsPerTenant: 10,
  sessionsPerUser: 50,
  includeTemplates: true,
  includeHistoricalData: true
});

const testData = await seeder.generateTestData();

// Access generated data
console.log(`Generated ${testData.tenants.length} tenants`);
console.log(`Generated ${testData.users.length} users`);

// Use relationships
const tenantUsers = testData.relationships.tenantUsers.get(tenantId);
const userSessions = testData.relationships.userSessions.get(userId);
```

## Test Configuration

Pre-configured Vitest setups for different test types:

```typescript
// vitest.config.ts
import { testConfigs } from '@strengthos/shared-testing';

export default testConfigs.unit({
  coverage: true,
  coverageThreshold: 90
});

// For integration tests
export default testConfigs.integration({
  testTimeout: 30000,
  maxWorkers: 1
});

// For database tests
import { createDatabaseTestConfig } from '@strengthos/shared-testing';

export default createDatabaseTestConfig({
  globalSetup: './test/setup.ts',
  globalTeardown: './test/teardown.ts'
});
```

### Available Configurations

- `testConfigs.unit()` - Fast unit tests with high coverage
- `testConfigs.integration()` - Integration tests with database
- `testConfigs.e2e()` - End-to-end tests
- `testConfigs.performance()` - Performance and load tests
- `testConfigs.browser()` - Browser/DOM tests
- `createDatabaseTestConfig()` - Database-specific setup
- `createApiTestConfig()` - API testing setup
- `createMockServiceConfig()` - Mock service testing

## Assertion Helpers

Custom assertions for common patterns:

```typescript
import { AssertionHelper } from '@strengthos/shared-testing';

// Results pattern assertions
AssertionHelper.expectSuccess(result);
AssertionHelper.expectError(result, 'Expected error message');

// Array assertions
AssertionHelper.expectArrayContains(
  users, 
  user => user.role === UserRole.COACH,
  3 // Expected count
);

// Object shape validation
AssertionHelper.expectObjectShape(user, {
  id: 'string',
  email: 'string',
  createdAt: 'object'
});

// Date range validation
AssertionHelper.expectDateInRange(
  user.createdAt,
  new Date('2024-01-01'),
  new Date('2024-12-31')
);
```

## Best Practices

### 1. Use Factories for Consistent Data

```typescript
// Good: Use factories for consistent test data
const user = userFactory.createAthlete({
  tenantId: 'test-tenant',
  email: 'athlete@example.com'
});

// Avoid: Manual object creation
const user = {
  id: 'manual-id',
  email: 'athlete@example.com',
  // Missing required fields...
};
```

### 2. Leverage Traits for Variations

```typescript
// Good: Use traits for common variations
const verifiedUser = userFactory.createWithTraits(['verified']);
const suspendedUser = userFactory.createWithTraits(['suspended']);
```

### 3. Use Mock Services for Integration Tests

```typescript
// Good: Use mock services for predictable behavior
const mocks = createServiceMocks({ autoSuccess: true });
const result = await mocks.userService.createUser(userData);
```

### 4. Seed Data for Complex Scenarios

```typescript
// Good: Use seeder for complex test scenarios
const testData = await seedTestData('multi-tenant');
const tenant = testData.tenants[0];
const users = testData.relationships.tenantUsers.get(tenant.id);
```

## API Reference

### Factories
- `userFactory` - Create test users with roles and traits
- `tenantFactory` - Create test tenants
- `programFactory` - Create training programs
- `sessionFactory` - Create training sessions
- `BaseFactory` - Base class for custom factories

### Mock Services
- `createServiceMocks()` - Create all mock services
- `MockUserManagementService` - Mock user operations
- `MockTenantManagementService` - Mock tenant operations
- `MockAccessControlService` - Mock access control

### Test Utilities
- `TestRunner` - Run test suites with different configurations
- `TestDatabase` - Database testing utilities
- `TestTimer` - Performance measurement
- `ApiTestHelper` - API testing utilities
- `AssertionHelper` - Custom assertions
- `TestSeeder` - Generate complete test datasets

### Configuration
- `testConfigs` - Pre-configured test setups
- `createTestConfig()` - Custom test configuration
- `environmentConfigs` - Environment-specific configs

## Test Application Templates

Create dedicated test applications following the separated test architecture:

```bash
# Create test application for NestJS backend
npm run create-test-app create my-api nestjs

# Create test application for Next.js frontend
npm run create-test-app create my-frontend nextjs

# Create test application for Express service
npm run create-test-app create my-service express unit e2e

# List existing test applications
npm run list-test-apps
```

### Benefits of Separated Test Architecture

- **🚀 Clean Production Builds** - No test files or dependencies in production
- **⚡ Fast Development** - Tests don't slow down production compilation
- **🔧 Flexible Configuration** - Each test app can have custom settings
- **📦 Isolated Dependencies** - Test libraries don't affect production bundle size

### Generated Structure

```
your-app-tests/
├── src/
│   ├── unit/           # Isolated service/component tests
│   ├── integration/    # Module interaction tests
│   ├── e2e/           # End-to-end workflow tests
│   ├── fixtures/      # Test data and factories
│   ├── utils/         # Test utilities
│   └── test-setup.ts  # Global test configuration
├── package.json        # Test dependencies + production app reference
├── jest.config.js      # Test framework configuration
└── README.md          # Test-specific documentation
```

### Programmatic Usage

```typescript
import { createTestApplication } from '@strengthos/shared-testing';

createTestApplication({
  appName: 'my-service',
  appType: 'nestjs',
  testTypes: ['unit', 'integration', 'e2e'],
  description: 'Test application for my-service',
  author: 'Development Team'
});
```

### Available Templates

- **NestJS** - Backend API testing with Jest and Supertest
- **Next.js** - Frontend testing with React Testing Library and Playwright  
- **Express** - Lightweight API testing with Jest and Supertest

### Documentation

- 📖 [Quick Start Guide](./docs/quick-start-guide.md) - Get started in 5 minutes
- 📖 [Template System](./README-templates.md) - Detailed template documentation
- 📖 [Creating Test Applications](./docs/creating-test-applications.md) - Comprehensive guide
- 🔧 [Examples](./examples/) - Example implementations and usage patterns

## License

MIT