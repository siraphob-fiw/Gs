# SOS Web API Tests

This is a dedicated test application for testing the `sos-web-api` production application. It follows the separated test application pattern to ensure production builds are not affected by test code.

## Structure

```
src/
├── unit/          # Isolated service and utility tests
├── integration/   # Module interaction tests
├── e2e/          # End-to-end workflow tests
├── fixtures/     # Test data and factories
└── utils/        # Test utilities and helpers
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

## Test Categories

### Unit Tests (`src/unit/`)
- Test individual services in isolation
- Use minimal dependencies and mocking
- Fast execution (< 5 seconds per test file)

### Integration Tests (`src/integration/`)
- Test module interactions
- Mock external dependencies
- Medium execution time (< 15 seconds per test file)

### E2E Tests (`src/e2e/`)
- Test complete workflows
- Use TestApplicationFactory
- Longer execution time (< 30 seconds per test file)

## Dependencies

This test application imports the production `sos-web-api` as a dependency and uses the `shared-testing` library for common test utilities.