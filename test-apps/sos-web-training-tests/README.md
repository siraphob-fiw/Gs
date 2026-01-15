# SOS Web Training Tests

This is the isolated test application for `@strengthos/sos-web-training` - the Next.js frontend application for users and coaches.

## Overview

This test application follows the separated testing architecture pattern, providing:
- Isolated testing environment separate from production code
- Comprehensive test coverage for React components, hooks, and utilities
- Integration tests for component interactions and API integrations
- End-to-end tests using Playwright for complete user workflows

## Directory Structure

```
src/
├── unit/          # Unit tests for individual components, hooks, and utilities
├── integration/   # Integration tests for component interactions and API integrations
├── e2e/          # End-to-end tests using Playwright
├── fixtures/     # Test data, mock data, and fixture utilities
├── utils/        # Test helpers, custom matchers, and testing utilities
└── test-setup.ts # Global test configuration and mocks
```

## Test Categories

### Unit Tests
- Individual React component testing
- Custom hooks testing
- Utility function testing
- Uses Jest with jsdom environment
- Uses React Testing Library for component testing

### Integration Tests
- Component interaction testing
- API integration testing
- Context provider testing
- Form submission workflows
- Uses Jest with jsdom environment

### End-to-End Tests
- Complete user workflows
- Cross-browser testing
- Visual regression testing
- Uses Playwright for browser automation

## Scripts

- `npm test` - Run all tests
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run test:e2e:ui` - Run E2E tests with Playwright UI
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage report

## Dependencies

This test application imports from:
- `@strengthos/sos-web-training` - The production Next.js application
- `@strengthos/shared-testing` - Shared testing utilities and patterns

## Configuration

- **Jest**: Configured for React/Next.js testing with jsdom environment
- **Playwright**: Configured for cross-browser E2E testing
- **TypeScript**: Configured with proper path mapping to production app
- **ESLint**: Configured for test code linting

## Best Practices

1. **Isolation**: Tests run in complete isolation from production code
2. **Performance**: Unit tests complete in under 30 seconds
3. **Reliability**: Tests are deterministic and don't depend on external services
4. **Maintainability**: Clear test structure and comprehensive documentation
5. **Coverage**: Comprehensive test coverage for critical user workflows