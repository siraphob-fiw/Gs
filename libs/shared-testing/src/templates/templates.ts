import { AppTemplate, TemplateVariables } from './types';

/**
 * Template substitution helper
 */
export function substituteTemplate(content: string, variables: TemplateVariables): string {
  return content
    .replace(/\{\{appName\}\}/g, variables.appName)
    .replace(/\{\{testAppName\}\}/g, variables.testAppName)
    .replace(/\{\{appType\}\}/g, variables.appType)
    .replace(/\{\{description\}\}/g, variables.description)
    .replace(/\{\{author\}\}/g, variables.author)
    .replace(/\{\{hasUnit\}\}/g, variables.hasUnit.toString())
    .replace(/\{\{hasIntegration\}\}/g, variables.hasIntegration.toString())
    .replace(/\{\{hasE2E\}\}/g, variables.hasE2E.toString())
    .replace(/\{\{includePlaywright\}\}/g, variables.includePlaywright.toString())
    .replace(/\{\{includeTestingLibrary\}\}/g, variables.includeTestingLibrary.toString());
}

/**
 * NestJS test application template
 */
export const nestjsTemplate: AppTemplate = {
  files: [
    {
      path: 'package.json',
      content: `{
  "name": "@strengthos/{{testAppName}}",
  "version": "1.0.0",
  "description": "{{description}}",
  "author": "{{author}}",
  "private": true,
  "license": "MIT",
  "scripts": {
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch --passWithNoTests",
    "test:cov": "jest --coverage --passWithNoTests",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand --passWithNoTests",
    "test:unit": "jest --testPathPattern=src/unit --passWithNoTests",
    "test:integration": "jest --testPathPattern=src/integration --passWithNoTests",
    "test:e2e": "jest --testPathPattern=src/e2e --passWithNoTests",
    "typecheck": "tsc --noEmit",
    "clean": "rimraf dist",
    "lint": "eslint \\"src/**/*.ts\\" --fix"
  },
  "dependencies": {
    "@strengthos/{{appName}}": "file:../../apps/{{appName}}",
    "@strengthos/shared-testing": "file:../../libs/shared-testing"
  },
  "devDependencies": {
    "@nestjs/testing": "^11.1.6",
    "@types/jest": "^29.5.2",
    "@types/node": "^22.10.2",
    "@types/supertest": "^2.0.12",
    "@typescript-eslint/eslint-plugin": "^8.41.0",
    "@typescript-eslint/parser": "^8.41.0",
    "eslint": "^9.34.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.2.1",
    "jest": "^29.5.0",
    "prettier": "^3.6.2",
    "rimraf": "^5.0.0",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.9.2"
  }
}`
    },
    {
      path: 'tsconfig.json',
      content: `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "declaration": false,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@strengthos/*": ["../../libs/*/src", "../../apps/*/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`
    },
    {
      path: 'jest.config.js',
      content: `module.exports = {
  displayName: '{{testAppName}}',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/test-setup.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleNameMapping: {
    '^@strengthos/(.*)$': '<rootDir>/../../libs/$1/src',
  },
  testTimeout: 30000,
  maxWorkers: '50%',
};`
    },
    {
      path: 'nest-cli.json',
      content: `{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}`
    },
    {
      path: 'README.md',
      content: `# {{testAppName}}

{{description}}

This test application provides isolated testing for the {{appName}} production application following the separated test architecture pattern.

## Structure

\`\`\`
src/
├── unit/           # Isolated service tests
├── integration/    # Module interaction tests  
├── e2e/           # End-to-end workflow tests
├── fixtures/      # Test data and factories
├── utils/         # Test utilities
└── test-setup.ts  # Global test configuration
\`\`\`

## Running Tests

\`\`\`bash
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
\`\`\`

## Writing Tests

This test application imports production code from \`@strengthos/{{appName}}\` and uses shared testing utilities from \`@strengthos/shared-testing\`.

### Unit Tests
- Test individual services in isolation
- Use TestModuleBuilder for minimal dependency injection
- Mock all external dependencies

### Integration Tests  
- Test module interactions
- Use simplified test modules
- Mock external services (database, notifications, etc.)

### E2E Tests
- Test complete user workflows
- Use TestApplicationFactory for full application context
- Mock all external dependencies at application level
`
    },
    {
      path: 'src/test-setup.ts',
      content: `import { TestConfig } from '@strengthos/shared-testing';

// Global test configuration
TestConfig.configure({
  database: {
    type: 'mock'
  },
  cache: {
    type: 'memory'
  },
  notifications: {
    enabled: false,
    mockAll: true
  },
  monitoring: {
    enabled: false,
    mockSecurityEvents: true
  }
});

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});`
    },
    {
      path: 'src/unit/example.spec.ts',
      content: `import { TestModuleBuilder } from '@strengthos/shared-testing';

describe('Example Unit Test', () => {
  it('should demonstrate unit test pattern', async () => {
    // This is an example unit test following the new pattern
    // Replace with actual service tests from your production app
    
    expect(true).toBe(true);
  });
  
  // Example of how to test a service with TestModuleBuilder
  // Uncomment and modify for your actual services:
  /*
  let service: YourService;
  let mockRepository: jest.Mocked<YourRepository>;
  
  beforeEach(async () => {
    const { service: testService, mocks } = await TestModuleBuilder
      .forService(YourService)
      .withMocks([
        { provide: YourRepository, useValue: createMockRepository() },
        { provide: 'ILogger', useValue: createMockLogger() }
      ])
      .build();
      
    service = testService;
    mockRepository = mocks.get(YourRepository);
  });
  
  it('should test service method', async () => {
    // Arrange
    mockRepository.findById.mockResolvedValue(mockData);
    
    // Act
    const result = await service.someMethod('test-id');
    
    // Assert
    expect(result).toBeDefined();
    expect(mockRepository.findById).toHaveBeenCalledWith('test-id');
  });
  */
});`
    },
    {
      path: 'src/integration/example.spec.ts',
      content: `import { TestModuleBuilder } from '@strengthos/shared-testing';

describe('Example Integration Test', () => {
  it('should demonstrate integration test pattern', async () => {
    // This is an example integration test following the new pattern
    // Replace with actual module tests from your production app
    
    expect(true).toBe(true);
  });
  
  // Example of how to test a module with TestModuleBuilder
  // Uncomment and modify for your actual modules:
  /*
  let module: TestingModule;
  
  beforeEach(async () => {
    module = await TestModuleBuilder
      .forModule(YourModule)
      .withMocks([
        { provide: DatabaseService, useValue: createMockDatabase() },
        { provide: 'NotificationService', useValue: createMockNotifications() }
      ])
      .excludeGlobalProviders(['GlobalExceptionFilter'])
      .build();
  });
  
  afterEach(async () => {
    await module.close();
  });
  
  it('should test module interactions', async () => {
    const service = module.get(YourService);
    const repository = module.get(YourRepository);
    
    // Test service and repository interaction
    const result = await service.someMethod();
    expect(result).toBeDefined();
  });
  */
});`
    },
    {
      path: 'src/e2e/example.spec.ts',
      content: `import { TestApplicationFactory } from '@strengthos/shared-testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('Example E2E Test', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    // This is an example E2E test following the new pattern
    // Replace with actual application tests from your production app
    
    // Uncomment and modify for your actual application:
    /*
    app = await TestApplicationFactory
      .create()
      .withMocks([
        { module: DatabaseModule, providers: [mockDatabaseProviders] },
        { module: NotificationModule, providers: [mockNotificationProviders] }
      ])
      .build();
    */
  });
  
  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
  
  it('should demonstrate e2e test pattern', async () => {
    expect(true).toBe(true);
  });
  
  // Example of how to test an endpoint
  // Uncomment and modify for your actual endpoints:
  /*
  it('should handle GET /your-endpoint', async () => {
    return request(app.getHttpServer())
      .get('/your-endpoint')
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
  });
  */
});`
    },
    {
      path: 'src/fixtures/test-factories.ts',
      content: `import { MockFactory } from '@strengthos/shared-testing';

// Example factory - replace with your actual entities
export class ExampleFactory implements MockFactory<any> {
  private sequence = 0;
  
  create(overrides: Partial<any> = {}): any {
    return {
      id: \`example-\${++this.sequence}\`,
      name: \`Example \${this.sequence}\`,
      createdAt: new Date(),
      ...overrides
    };
  }
  
  createMany(count: number, overrides: Partial<any> = {}): any[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
  
  reset(): void {
    this.sequence = 0;
  }
}

// Export factory instances
export const exampleFactory = new ExampleFactory();

// Add more factories for your entities:
// export const userFactory = new UserFactory();
// export const tenantFactory = new TenantFactory();`
    },
    {
      path: 'src/utils/test-helpers.ts',
      content: `import { TestingModule } from '@nestjs/testing';

/**
 * Helper utilities specific to this test application
 */

/**
 * Clean up test module and reset mocks
 */
export async function cleanupTestModule(module: TestingModule): Promise<void> {
  if (module) {
    await module.close();
  }
  jest.clearAllMocks();
}

/**
 * Wait for async operations to complete
 */
export function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a test context with common setup
 */
export interface TestContext {
  module: TestingModule;
  cleanup: () => Promise<void>;
}

export async function createTestContext(moduleBuilder: any): Promise<TestContext> {
  const module = await moduleBuilder.build();
  
  return {
    module,
    cleanup: async () => {
      await cleanupTestModule(module);
    }
  };
}`
    }
  ],
  dependencies: {
    '@strengthos/shared-testing': 'file:../../libs/shared-testing'
  },
  devDependencies: {
    '@nestjs/testing': '^11.1.6',
    '@types/jest': '^29.5.2',
    '@types/node': '^22.10.2',
    '@types/supertest': '^2.0.12',
    'jest': '^29.5.0',
    'supertest': '^6.3.3',
    'ts-jest': '^29.1.0',
    'typescript': '^5.9.2'
  },
  scripts: {
    'test': 'jest --passWithNoTests',
    'test:unit': 'jest --testPathPattern=src/unit --passWithNoTests',
    'test:integration': 'jest --testPathPattern=src/integration --passWithNoTests',
    'test:e2e': 'jest --testPathPattern=src/e2e --passWithNoTests'
  }
};

/**
 * Next.js test application template
 */
export const nextjsTemplate: AppTemplate = {
  files: [
    {
      path: 'package.json',
      content: `{
  "name": "@strengthos/{{testAppName}}",
  "version": "1.0.0",
  "description": "{{description}}",
  "author": "{{author}}",
  "private": true,
  "license": "MIT",
  "scripts": {
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch --passWithNoTests",
    "test:cov": "jest --coverage --passWithNoTests",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand --passWithNoTests",
    "test:unit": "jest --testPathPattern=src/unit --passWithNoTests",
    "test:integration": "jest --testPathPattern=src/integration --passWithNoTests",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "typecheck": "tsc --noEmit",
    "clean": "rimraf dist .next",
    "lint": "eslint \\"src/**/*.{ts,tsx}\\" --fix"
  },
  "dependencies": {
    "@strengthos/{{appName}}": "file:../../apps/{{appName}}",
    "@strengthos/shared-testing": "file:../../libs/shared-testing"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.2",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/jest": "^29.5.2",
    "@types/node": "^22.10.2",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.9.2"
  }
}`
    },
    {
      path: 'tsconfig.json',
      content: `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": "./",
    "paths": {
      "@strengthos/*": ["../../libs/*/src", "../../apps/*/src"],
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "next-env.d.ts"],
  "exclude": ["node_modules", "dist", ".next"]
}`
    },
    {
      path: 'jest.config.js',
      content: `const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: '../../apps/{{appName}}',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  displayName: '{{testAppName}}',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleNameMapping: {
    '^@strengthos/(.*)$': '<rootDir>/../../libs/$1/src',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/src/unit/**/*.{test,spec}.{ts,tsx}',
    '<rootDir>/src/integration/**/*.{test,spec}.{ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test-setup.ts',
  ],
  coverageDirectory: 'coverage',
  testTimeout: 30000,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);`
    },
    {
      path: 'playwright.config.ts',
      content: `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    cwd: '../../apps/{{appName}}',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});`
    },
    {
      path: 'README.md',
      content: `# {{testAppName}}

{{description}}

This test application provides isolated testing for the {{appName}} Next.js application following the separated test architecture pattern.

## Structure

\`\`\`
src/
├── unit/           # Component and utility tests
├── integration/    # Page and API integration tests
├── e2e/           # Full user workflow tests (Playwright)
├── fixtures/      # Test data and mock APIs
├── utils/         # Test utilities
└── test-setup.ts  # Global test configuration
\`\`\`

## Running Tests

\`\`\`bash
# Run unit and integration tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration

# Run E2E tests with Playwright
npm run test:e2e
npm run test:e2e:ui      # With UI
npm run test:e2e:headed  # In headed mode

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
\`\`\`

## Writing Tests

This test application imports production code from \`@strengthos/{{appName}}\` and uses shared testing utilities from \`@strengthos/shared-testing\`.

### Unit Tests
- Test individual components and utilities in isolation
- Use React Testing Library for component tests
- Mock all external dependencies and API calls

### Integration Tests  
- Test page components with their dependencies
- Test API route handlers
- Mock external services and databases

### E2E Tests (Playwright)
- Test complete user workflows across pages
- Test real browser interactions
- Use test fixtures for consistent data
`
    },
    {
      path: 'next-env.d.ts',
      content: `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.`
    },
    {
      path: 'src/test-setup.ts',
      content: `import '@testing-library/jest-dom';
import { TestConfig } from '@strengthos/shared-testing';

// Global test configuration
TestConfig.configure({
  database: {
    type: 'mock'
  },
  cache: {
    type: 'memory'
  },
  notifications: {
    enabled: false,
    mockAll: true
  },
  monitoring: {
    enabled: false,
    mockSecurityEvents: true
  }
});

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    pop: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// Mock Next.js navigation (App Router)
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});`
    },
    {
      path: 'src/unit/example.spec.tsx',
      content: `import { render, screen } from '@testing-library/react';

describe('Example Unit Test', () => {
  it('should demonstrate unit test pattern', () => {
    // This is an example unit test following the new pattern
    // Replace with actual component tests from your production app
    
    expect(true).toBe(true);
  });
  
  // Example of how to test a React component
  // Uncomment and modify for your actual components:
  /*
  it('should render YourComponent', () => {
    render(<YourComponent />);
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    render(<YourComponent />);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    await user.click(button);
    
    expect(screen.getByText('Button clicked')).toBeInTheDocument();
  });
  */
});`
    },
    {
      path: 'src/integration/example.spec.tsx',
      content: `import { render, screen } from '@testing-library/react';

describe('Example Integration Test', () => {
  it('should demonstrate integration test pattern', () => {
    // This is an example integration test following the new pattern
    // Replace with actual page/API tests from your production app
    
    expect(true).toBe(true);
  });
  
  // Example of how to test a page component with dependencies
  // Uncomment and modify for your actual pages:
  /*
  beforeEach(() => {
    // Mock API calls
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'mock data' }),
    });
  });
  
  it('should render YourPage with data', async () => {
    render(<YourPage />);
    
    // Wait for async data loading
    await waitFor(() => {
      expect(screen.getByText('mock data')).toBeInTheDocument();
    });
  });
  */
});`
    },
    {
      path: 'src/e2e/example.spec.ts',
      content: `import { test, expect } from '@playwright/test';

test.describe('Example E2E Test', () => {
  test('should demonstrate e2e test pattern', async ({ page }) => {
    // This is an example E2E test following the new pattern
    // Replace with actual user workflow tests from your production app
    
    await page.goto('/');
    await expect(page).toHaveTitle(/Your App Title/);
  });
  
  // Example of how to test a complete user workflow
  // Uncomment and modify for your actual workflows:
  /*
  test('should complete user registration flow', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    
    // Fill out registration form
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');
    
    // Submit form
    await page.click('[data-testid="submit-button"]');
    
    // Verify success
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
  });
  */
});`
    },
    {
      path: 'src/fixtures/test-data.ts',
      content: `/**
 * Test data fixtures for E2E and integration tests
 */

export const mockUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
};

export const mockApiResponse = {
  success: true,
  data: {
    message: 'Mock API response',
  },
};

// Add more test fixtures as needed for your application
export const testFixtures = {
  user: mockUser,
  apiResponse: mockApiResponse,
};`
    },
    {
      path: 'src/utils/test-helpers.tsx',
      content: `import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

/**
 * Custom render function with providers
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  // Add your app providers here (Theme, Router, etc.)
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

/**
 * Mock API responses for testing
 */
export const mockFetch = (response: any, ok: boolean = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(response),
  });
};

/**
 * Wait for async operations to complete
 */
export const waitForAsync = (ms: number = 0): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};`
    }
  ],
  dependencies: {
    '@strengthos/shared-testing': 'file:../../libs/shared-testing'
  },
  devDependencies: {
    '@playwright/test': '^1.48.2',
    '@testing-library/jest-dom': '^6.6.3',
    '@testing-library/react': '^16.1.0',
    '@testing-library/user-event': '^14.5.2',
    '@types/jest': '^29.5.2',
    '@types/react': '^18.3.12',
    'jest': '^29.5.0',
    'jest-environment-jsdom': '^29.5.0',
    'typescript': '^5.9.2'
  },
  scripts: {
    'test': 'jest --passWithNoTests',
    'test:unit': 'jest --testPathPattern=src/unit --passWithNoTests',
    'test:integration': 'jest --testPathPattern=src/integration --passWithNoTests',
    'test:e2e': 'playwright test'
  }
};

/**
 * Express test application template
 */
export const expressTemplate: AppTemplate = {
  files: [
    {
      path: 'package.json',
      content: `{
  "name": "@strengthos/{{testAppName}}",
  "version": "1.0.0",
  "description": "{{description}}",
  "author": "{{author}}",
  "private": true,
  "license": "MIT",
  "scripts": {
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch --passWithNoTests",
    "test:cov": "jest --coverage --passWithNoTests",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand --passWithNoTests",
    "test:unit": "jest --testPathPattern=src/unit --passWithNoTests",
    "test:integration": "jest --testPathPattern=src/integration --passWithNoTests",
    "test:e2e": "jest --testPathPattern=src/e2e --passWithNoTests",
    "typecheck": "tsc --noEmit",
    "clean": "rimraf dist",
    "lint": "eslint \\"src/**/*.ts\\" --fix"
  },
  "dependencies": {
    "@strengthos/{{appName}}": "file:../../apps/{{appName}}",
    "@strengthos/shared-testing": "file:../../libs/shared-testing"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.2",
    "@types/node": "^22.10.2",
    "@types/supertest": "^2.0.12",
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "typescript": "^5.9.2"
  }
}`
    },
    {
      path: 'tsconfig.json',
      content: `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "declaration": false,
    "removeComments": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "paths": {
      "@strengthos/*": ["../../libs/*/src", "../../apps/*/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`
    },
    {
      path: 'jest.config.js',
      content: `module.exports = {
  displayName: '{{testAppName}}',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/test-setup.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleNameMapping: {
    '^@strengthos/(.*)$': '<rootDir>/../../libs/$1/src',
  },
  testTimeout: 30000,
  maxWorkers: '50%',
};`
    },
    {
      path: 'README.md',
      content: `# {{testAppName}}

{{description}}

This test application provides isolated testing for the {{appName}} Express application following the separated test architecture pattern.

## Structure

\`\`\`
src/
├── unit/           # Isolated function and middleware tests
├── integration/    # Route and service integration tests  
├── e2e/           # End-to-end API workflow tests
├── fixtures/      # Test data and factories
├── utils/         # Test utilities
└── test-setup.ts  # Global test configuration
\`\`\`

## Running Tests

\`\`\`bash
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
\`\`\`

## Writing Tests

This test application imports production code from \`@strengthos/{{appName}}\` and uses shared testing utilities from \`@strengthos/shared-testing\`.

### Unit Tests
- Test individual functions and middleware in isolation
- Mock all external dependencies
- Focus on business logic and edge cases

### Integration Tests  
- Test route handlers with their dependencies
- Mock external services (database, APIs, etc.)
- Test request/response flows

### E2E Tests
- Test complete API workflows
- Use supertest for HTTP testing
- Mock all external dependencies at application level
`
    },
    {
      path: 'src/test-setup.ts',
      content: `import { TestConfig } from '@strengthos/shared-testing';

// Global test configuration
TestConfig.configure({
  database: {
    type: 'mock'
  },
  cache: {
    type: 'memory'
  },
  notifications: {
    enabled: false,
    mockAll: true
  },
  monitoring: {
    enabled: false,
    mockSecurityEvents: true
  }
});

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});`
    }
  ],
  dependencies: {
    '@strengthos/shared-testing': 'file:../../libs/shared-testing'
  },
  devDependencies: {
    '@types/express': '^4.17.21',
    '@types/jest': '^29.5.2',
    '@types/supertest': '^2.0.12',
    'jest': '^29.5.0',
    'supertest': '^6.3.3',
    'ts-jest': '^29.1.0',
    'typescript': '^5.9.2'
  },
  scripts: {
    'test': 'jest --passWithNoTests',
    'test:unit': 'jest --testPathPattern=src/unit --passWithNoTests',
    'test:integration': 'jest --testPathPattern=src/integration --passWithNoTests',
    'test:e2e': 'jest --testPathPattern=src/e2e --passWithNoTests'
  }
};

/**
 * Get template by app type
 */
export function getTemplate(appType: string): AppTemplate {
  switch (appType) {
    case 'nestjs':
      return nestjsTemplate;
    case 'nextjs':
      return nextjsTemplate;
    case 'express':
      return expressTemplate;
    default:
      throw new Error(`Unsupported app type: ${appType}`);
  }
}