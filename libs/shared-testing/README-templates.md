# Test Application Templates

This document describes the test application template system implemented in the shared-testing library.

## Overview

The template system provides automated creation of test applications following the separated test architecture pattern. This ensures consistency across all test applications and makes it easy to create new test applications for any production application.

## Features

- **Multiple Framework Support**: Templates for NestJS, Next.js, and Express applications
- **Flexible Test Types**: Support for unit, integration, and E2E tests
- **Template Substitution**: Dynamic content generation based on configuration
- **CLI Interface**: Command-line tool for easy test application creation
- **Programmatic API**: TypeScript API for automated test application generation

## Quick Start

### Using the CLI

```bash
# From the monorepo root
node libs/shared-testing/dist/cli/create-test-app.js create my-app nestjs

# Or with specific test types
node libs/shared-testing/dist/cli/create-test-app.js create my-frontend nextjs unit integration

# List existing test applications
node libs/shared-testing/dist/cli/create-test-app.js list

# Show help
node libs/shared-testing/dist/cli/create-test-app.js help
```

### Using the API

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

## Templates

### NestJS Template

Creates a test application for NestJS backend applications with:

- Jest configuration optimized for Node.js testing
- Supertest for HTTP endpoint testing
- @nestjs/testing utilities
- Directory structure for unit, integration, and E2E tests
- Example test files demonstrating patterns

**Generated Files:**
- `package.json` - Dependencies and scripts
- `jest.config.js` - Jest configuration
- `nest-cli.json` - NestJS CLI configuration
- `tsconfig.json` - TypeScript configuration
- `README.md` - Usage documentation
- `src/test-setup.ts` - Global test setup
- `src/unit/example.spec.ts` - Example unit test
- `src/integration/example.spec.ts` - Example integration test
- `src/e2e/example.spec.ts` - Example E2E test
- `src/fixtures/test-factories.ts` - Test data factories
- `src/utils/test-helpers.ts` - Test utilities

### Next.js Template

Creates a test application for Next.js frontend applications with:

- Jest with jsdom environment for component testing
- React Testing Library for component testing
- Playwright for E2E browser testing
- Directory structure for unit, integration, and E2E tests
- Example test files for components and pages

**Generated Files:**
- `package.json` - Dependencies and scripts
- `jest.config.js` - Jest configuration
- `playwright.config.ts` - Playwright configuration
- `tsconfig.json` - TypeScript configuration
- `next-env.d.ts` - Next.js type definitions
- `README.md` - Usage documentation
- `src/test-setup.ts` - Global test setup with React mocks
- `src/unit/example.spec.tsx` - Example component test
- `src/integration/example.spec.tsx` - Example page test
- `src/e2e/example.spec.ts` - Example Playwright test
- `src/fixtures/test-data.ts` - Test data fixtures
- `src/utils/test-helpers.tsx` - React test utilities

### Express Template

Creates a test application for Express.js applications with:

- Jest configuration for Node.js testing
- Supertest for HTTP testing
- Directory structure for unit, integration, and E2E tests
- Example test files for routes and middleware

**Generated Files:**
- `package.json` - Dependencies and scripts
- `jest.config.js` - Jest configuration
- `tsconfig.json` - TypeScript configuration
- `README.md` - Usage documentation
- `src/test-setup.ts` - Global test setup
- Example test files for unit, integration, and E2E tests

## Configuration Options

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

## Template Variables

Templates support the following variables for substitution:

- `{{appName}}` - Production application name
- `{{testAppName}}` - Test application name (appName + '-tests')
- `{{appType}}` - Application type (nestjs, nextjs, express)
- `{{description}}` - Application description
- `{{author}}` - Author name
- `{{hasUnit}}` - Whether unit tests are included
- `{{hasIntegration}}` - Whether integration tests are included
- `{{hasE2E}}` - Whether E2E tests are included
- `{{includePlaywright}}` - Whether Playwright is included
- `{{includeTestingLibrary}}` - Whether Testing Library is included

## Directory Structure

Generated test applications follow this structure:

```
test-apps/
└── {app-name}-tests/
    ├── src/
    │   ├── unit/           # Isolated unit tests
    │   ├── integration/    # Module/component integration tests
    │   ├── e2e/           # End-to-end workflow tests
    │   ├── fixtures/      # Test data and factories
    │   ├── utils/         # Test utilities
    │   └── test-setup.ts  # Global test configuration
    ├── package.json
    ├── jest.config.js     # (or playwright.config.ts for Next.js E2E)
    ├── tsconfig.json
    └── README.md
```

## Usage Examples

### Creating a NestJS Test Application

```bash
node libs/shared-testing/dist/cli/create-test-app.js create user-service nestjs
```

This creates:
- `test-apps/user-service-tests/`
- Configured for NestJS testing with @nestjs/testing
- Includes unit, integration, and E2E test directories
- Example tests demonstrating service testing patterns

### Creating a Next.js Test Application

```bash
node libs/shared-testing/dist/cli/create-test-app.js create admin-dashboard nextjs
```

This creates:
- `test-apps/admin-dashboard-tests/`
- Configured for React component testing with Testing Library
- Includes Playwright for E2E browser testing
- Example tests for components and pages

### Creating an Express Test Application

```bash
node libs/shared-testing/dist/cli/create-test-app.js create api-gateway express unit e2e
```

This creates:
- `test-apps/api-gateway-tests/`
- Configured for Express.js testing with Supertest
- Only includes unit and E2E tests (no integration)
- Example tests for routes and middleware

## Best Practices

### 1. Naming Conventions

- Production app: `my-app`
- Test app: `my-app-tests`
- Package name: `@strengthos/my-app-tests`

### 2. Test Organization

- **Unit tests**: Test individual functions/services in isolation
- **Integration tests**: Test module/component interactions
- **E2E tests**: Test complete user workflows

### 3. Dependencies

- Production app is imported as a file dependency
- Shared-testing library provides common utilities
- Test-specific dependencies are isolated to test applications

### 4. Configuration

- Each test application has its own configuration
- Global test setup in `src/test-setup.ts`
- Framework-specific configurations (Jest, Playwright, etc.)

## Extending Templates

To add support for new frameworks or modify existing templates:

1. **Add new template**: Create template definition in `src/templates/templates.ts`
2. **Update types**: Add new app type to `TestAppConfig` interface
3. **Update CLI**: Add support for new app type in CLI validation
4. **Test**: Verify template generation works correctly

Example of adding a new template:

```typescript
export const fastifyTemplate: AppTemplate = {
  files: [
    // Template files for Fastify applications
  ],
  dependencies: {
    // Fastify-specific dependencies
  },
  devDependencies: {
    // Fastify test dependencies
  },
  scripts: {
    // Fastify test scripts
  }
};
```

## Troubleshooting

### Common Issues

1. **Template not found**: Ensure the app type is supported (nestjs, nextjs, express)
2. **File permissions**: Ensure write permissions to test-apps directory
3. **TypeScript errors**: Check tsconfig.json paths configuration
4. **Import errors**: Verify production application exists and is built

### Getting Help

- Check the generated README.md in your test application
- Review example test files for patterns
- Consult the shared-testing library documentation
- Look at existing test applications for reference

## Implementation Details

The template system consists of:

- **Types**: TypeScript interfaces for configuration and templates
- **Templates**: Template definitions with file content and metadata
- **Generator**: Core logic for creating test applications
- **CLI**: Command-line interface for easy usage
- **API**: Programmatic interface for automation

Files:
- `src/templates/types.ts` - Type definitions
- `src/templates/templates.ts` - Template definitions
- `src/templates/create-test-application.ts` - Core generator logic
- `src/cli/create-test-app.ts` - CLI implementation
- `docs/creating-test-applications.md` - Comprehensive documentation