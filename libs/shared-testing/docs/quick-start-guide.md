# Quick Start Guide: Creating Test Applications

This guide helps you quickly create and set up test applications for new StrengthOS applications.

## TL;DR - Quick Commands

```bash
# Create test app for NestJS backend
npm run create-test-app create my-api nestjs

# Create test app for Next.js frontend  
npm run create-test-app create my-frontend nextjs

# Create test app for Express service
npm run create-test-app create my-service express

# List existing test apps
npm run list-test-apps
```

## Step-by-Step Guide

### 1. Create Your Production Application

First, create your production application in the `apps/` directory:

```bash
# Example: Create a new NestJS application
cd apps/
nest new my-new-service
```

### 2. Create the Test Application

Use the CLI to create a corresponding test application:

```bash
# From the monorepo root
npm run create-test-app create my-new-service nestjs
```

This creates:
- `test-apps/my-new-service-tests/` directory
- Complete test application structure
- Configured package.json with dependencies
- Example test files for each test type
- Documentation and configuration files

### 3. Install Dependencies

```bash
cd test-apps/my-new-service-tests
npm install
```

### 4. Start Writing Tests

The test application is ready to use! You can start writing tests immediately:

```typescript
// test-apps/my-new-service-tests/src/unit/my-service.spec.ts
import { MyService } from '@strengthos/my-new-service/src/my-service';
import { TestModuleBuilder } from '@strengthos/shared-testing';

describe('MyService', () => {
  let service: MyService;
  
  beforeEach(async () => {
    const { service: testService } = await TestModuleBuilder
      .forService(MyService)
      .build();
      
    service = testService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### 5. Run Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:cov
```

## Application Types

### NestJS Backend

```bash
npm run create-test-app create my-api nestjs
```

**Includes:**
- Jest configuration for Node.js
- Supertest for HTTP testing
- @nestjs/testing utilities
- Example service, controller, and E2E tests

**Best for:** REST APIs, GraphQL APIs, microservices

### Next.js Frontend

```bash
npm run create-test-app create my-frontend nextjs
```

**Includes:**
- Jest with jsdom environment
- React Testing Library
- Playwright for E2E testing
- Example component and page tests

**Best for:** Web applications, admin dashboards, user portals

### Express Service

```bash
npm run create-test-app create my-service express
```

**Includes:**
- Jest configuration for Node.js
- Supertest for HTTP testing
- Example route and middleware tests

**Best for:** Lightweight APIs, webhook handlers, proxy services

## Test Types

### Unit Tests (`src/unit/`)
- Test individual functions/services in isolation
- Mock all external dependencies
- Fast execution (< 100ms per test)

### Integration Tests (`src/integration/`)
- Test interactions between modules
- Mock external services only
- Test real internal component interactions

### E2E Tests (`src/e2e/`)
- Test complete user workflows
- Use real HTTP requests or browser interactions
- Mock external dependencies at application level

## Customization Options

### Specific Test Types Only

```bash
# Only unit and E2E tests (skip integration)
npm run create-test-app create my-service express unit e2e
```

### Programmatic Creation

```typescript
import { createTestApplication } from '@strengthos/shared-testing';

createTestApplication({
  appName: 'my-custom-app',
  appType: 'nestjs',
  testTypes: ['unit', 'integration'],
  description: 'Custom test application',
  author: 'My Team'
});
```

## Common Patterns

### Testing Services

```typescript
import { TestModuleBuilder, createMockRepository } from '@strengthos/shared-testing';

describe('UserService', () => {
  let service: UserService;
  let mockRepo: jest.Mocked<UserRepository>;
  
  beforeEach(async () => {
    const { service: testService, mocks } = await TestModuleBuilder
      .forService(UserService)
      .withMocks([
        { provide: UserRepository, useValue: createMockRepository() }
      ])
      .build();
      
    service = testService;
    mockRepo = mocks.get(UserRepository);
  });
});
```

### Testing Controllers

```typescript
import { TestModuleBuilder } from '@strengthos/shared-testing';

describe('UserController', () => {
  let controller: UserController;
  
  beforeEach(async () => {
    const { controller: testController } = await TestModuleBuilder
      .forController(UserController)
      .withMocks([
        { provide: UserService, useValue: createMockService() }
      ])
      .build();
      
    controller = testController;
  });
});
```

### E2E Testing

```typescript
import { TestApplicationFactory } from '@strengthos/shared-testing';
import * as request from 'supertest';

describe('User API (e2e)', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    app = await TestApplicationFactory
      .create()
      .withMocks([
        { module: DatabaseModule, providers: [mockDatabaseProviders] }
      ])
      .build();
  });
  
  it('/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200);
  });
});
```

## Troubleshooting

### Common Issues

1. **"Production application not found"**
   - Make sure your production app exists in `apps/[app-name]`
   - The warning is just informational - test app will still be created

2. **Import errors in tests**
   - Ensure production application is built: `cd apps/my-app && npm run build`
   - Check tsconfig.json paths are correct

3. **Test dependencies not found**
   - Run `npm install` in the test application directory
   - Check that shared-testing library is built: `cd libs/shared-testing && npm run build`

### Getting Help

- 📖 Check the generated README.md in your test application
- 📖 Review `libs/shared-testing/docs/creating-test-applications.md`
- 🔍 Look at existing test applications for examples
- 🧪 Run example tests: `cd libs/shared-testing && npm test`

## Next Steps

1. **Write your first test** - Start with a simple unit test
2. **Set up CI/CD** - Add test running to your build pipeline
3. **Add test data** - Use factories from `@strengthos/shared-testing`
4. **Mock external services** - Use the provided mock utilities
5. **Document test patterns** - Add examples specific to your application

## Advanced Usage

### Custom Templates

You can extend the template system by adding new templates to `libs/shared-testing/src/templates/templates.ts`.

### Automation Scripts

Create scripts to automatically generate test applications for new services:

```bash
# Use the programmatic API
npx ts-node libs/shared-testing/examples/programmatic-usage.ts batch
```

### CI/CD Integration

Add test application creation to your CI/CD pipeline:

```yaml
# .github/workflows/create-test-app.yml
- name: Create test application
  run: npm run create-test-app create ${{ github.event.inputs.app_name }} nestjs
```

---

**Happy Testing!** 🧪 The separated test architecture ensures your tests are fast, reliable, and don't interfere with production builds.