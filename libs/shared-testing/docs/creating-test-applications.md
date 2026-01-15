# Creating Test Applications

This guide explains how to create and use test applications in the StrengthOS monorepo following the separated test architecture pattern.

## Overview

Test applications are dedicated applications that contain all tests for a production application. This separation provides several benefits:

- **Build Isolation**: Production builds exclude all test files and dependencies
- **Dependency Management**: Test-specific dependencies don't affect production bundle size
- **TypeScript Isolation**: Test compilation issues don't block production builds
- **Deployment Optimization**: Production deployments contain only necessary code
- **Development Flexibility**: Tests can use different configurations or experimental features

## Architecture

```
apps/                        # Production applications only (no test files)
├── sos-web-api/             # Production API
├── sos-web-training/        # Production training app
└── [future-apps]/           # Any new applications

test-apps/                   # Dedicated folder for ALL test applications
├── sos-web-api-tests/       # API test application
├── sos-web-training-tests/  # Training app test application
└── [future-app-tests]/      # Test apps for any new applications

libs/
├── shared-testing/          # Shared test utilities and infrastructure
│   ├── src/templates/       # Templates for creating new test applications
│   └── ...
└── ...
```

## Creating Test Applications

### Using the CLI Script

The easiest way to create a new test application is using the CLI script:

```bash
# From the monorepo root
npm run create-test-app create my-app nestjs

# Or with specific test types
npm run create-test-app create my-frontend nextjs unit integration

# List existing test applications
npm run create-test-app list

# Show help
npm run create-test-app help
```

### Using the API Directly

You can also create test applications programmatically:

```typescript
import { createTestApplication } from '@strengthos/shared-testing';

createTestApplication({
  appName: 'my-app',
  appType: 'nestjs',
  testTypes: ['unit', 'integration', 'e2e'],
  description: 'Test application for my-app',
  author: 'Your Name'
});
```

### Configuration Options

```typescript
interface TestAppConfig {
  appName: string;                    // Name of production app (e.g., 'sos-web-api')
  appType: 'nestjs' | 'nextjs' | 'express';  // Application framework
  testTypes: ('unit' | 'integration' | 'e2e')[];  // Test types to include
  description?: string;               // Optional description
  author?: string;                    // Optional author
  includePlaywright?: boolean;        // Include Playwright (auto for Next.js)
  includeTestingLibrary?: boolean;    // Include Testing Library (auto for Next.js)
}
```

## Application Templates

### NestJS Template

Creates a test application for NestJS backend applications with:

- **Jest** configuration optimized for Node.js testing
- **Supertest** for HTTP endpoint testing
- **@nestjs/testing** utilities
- Directory structure for unit, integration, and E2E tests
- Example test files demonstrating patterns

**Generated Structure:**
```
my-app-tests/
├── src/
│   ├── unit/           # Isolated service tests
│   ├── integration/    # Module interaction tests
│   ├── e2e/           # End-to-end workflow tests
│   ├── fixtures/      # Test data and factories
│   ├── utils/         # Test utilities
│   └── test-setup.ts  # Global test configuration
├── package.json
├── jest.config.js
├── nest-cli.json
├── tsconfig.json
└── README.md
```

### Next.js Template

Creates a test application for Next.js frontend applications with:

- **Jest** with jsdom environment for component testing
- **React Testing Library** for component testing
- **Playwright** for E2E browser testing
- Directory structure for unit, integration, and E2E tests
- Example test files for components and pages

**Generated Structure:**
```
my-frontend-tests/
├── src/
│   ├── unit/           # Component and utility tests
│   ├── integration/    # Page and API integration tests
│   ├── e2e/           # Full user workflow tests (Playwright)
│   ├── fixtures/      # Test data and mock APIs
│   ├── utils/         # Test utilities
│   └── test-setup.ts  # Global test configuration
├── package.json
├── jest.config.js
├── playwright.config.ts
├── tsconfig.json
└── README.md
```

### Express Template

Creates a test application for Express.js applications with:

- **Jest** configuration for Node.js testing
- **Supertest** for HTTP testing
- Directory structure for unit, integration, and E2E tests
- Example test files for routes and middleware

## Test Types

### Unit Tests
- Test individual functions, services, or components in isolation
- Mock all external dependencies
- Fast execution (< 100ms per test)
- Located in `src/unit/`

### Integration Tests
- Test interactions between modules or components
- Mock external services but test real internal interactions
- Test request/response flows
- Located in `src/integration/`

### E2E Tests
- Test complete user workflows
- Use real browser interactions (Playwright) or HTTP requests (Supertest)
- Mock external dependencies at application level
- Located in `src/e2e/`

## Using Test Applications

### Installation

After creating a test application:

```bash
cd test-apps/my-app-tests
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

### Writing Tests

Test applications import production code as dependencies:

```typescript
// Import from production application
import { UserService } from '@strengthos/my-app/src/user/services/user.service';
import { UserRepository } from '@strengthos/my-app/src/database/repositories/user.repository';

// Import shared testing utilities
import { TestModuleBuilder, createMockRepository } from '@strengthos/shared-testing';

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

  it('should create user', async () => {
    const userData = { email: 'test@example.com', name: 'Test User' };
    mockRepository.create.mockResolvedValue({ id: '1', ...userData });

    const result = await service.createUser(userData);

    expect(result).toEqual({ id: '1', ...userData });
    expect(mockRepository.create).toHaveBeenCalledWith(userData);
  });
});
```

## Best Practices

### 1. Dependency Management

- Keep production applications clean of test dependencies
- Use `file:` references to import production code
- Leverage shared-testing library for common utilities

### 2. Test Organization

- Follow the three-tier testing strategy (unit, integration, E2E)
- Use consistent naming conventions
- Group related tests in describe blocks

### 3. Mock Management

- Use dependency injection overrides instead of global mocks
- Create reusable mock factories
- Reset mocks between tests

### 4. Performance

- Keep unit tests fast (< 100ms each)
- Use parallel execution where possible
- Clean up resources properly

### 5. Maintenance

- Update test applications when production code changes
- Keep test dependencies up to date
- Document test patterns and conventions

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure production application is built before running tests
2. **TypeScript Errors**: Check tsconfig.json paths configuration
3. **Mock Issues**: Verify mock implementations match real interfaces
4. **Performance**: Check for memory leaks or improper cleanup

### Getting Help

- Check the README.md in your test application
- Review example test files for patterns
- Consult the shared-testing library documentation
- Look at existing test applications for reference

## Migration Guide

### From Embedded Tests

If you have existing tests embedded in production applications:

1. Create a new test application using the templates
2. Move test files to the appropriate directories (unit, integration, e2e)
3. Update imports to reference production code as external dependency
4. Replace global mocks with dependency injection overrides
5. Remove test dependencies from production package.json
6. Update build scripts to exclude test files

### Example Migration

**Before (embedded tests):**
```typescript
// apps/my-app/src/user/user.service.spec.ts
import { UserService } from './user.service';
import { UserRepository } from '../database/repositories/user.repository';
```

**After (separated tests):**
```typescript
// test-apps/my-app-tests/src/unit/user.service.spec.ts
import { UserService } from '@strengthos/my-app/src/user/user.service';
import { UserRepository } from '@strengthos/my-app/src/database/repositories/user.repository';
```

## Future Enhancements

- Interactive CLI with prompts
- Template customization options
- Automatic test generation from production code
- Integration with CI/CD pipelines
- Performance monitoring and reporting