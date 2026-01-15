# Requirements Document

## Introduction

The current testing architecture in the sos-web-api has significant issues with complex dependencies, improper mocking strategies, and tightly coupled test modules. This feature aims to modernize the testing architecture by implementing proper isolation strategies, simplified test modules, and comprehensive mocking patterns. The goal is to create a maintainable, fast, and reliable testing suite that follows best practices for NestJS applications.

## Requirements

### Requirement 1

**User Story:** As a developer, I want isolated unit tests with minimal dependencies, so that I can test individual services without loading the entire application context.

#### Acceptance Criteria

1. WHEN running unit tests THEN the system SHALL execute tests without loading AppModule or complex dependency chains
2. WHEN testing a service THEN the system SHALL only load the specific service and its direct dependencies
3. WHEN mocking dependencies THEN the system SHALL use proper dependency injection overrides instead of global mocks
4. WHEN a unit test fails THEN the system SHALL provide clear error messages that point to the specific service logic issue

### Requirement 2

**User Story:** As a developer, I want simplified integration test modules, so that I can test service interactions without the overhead of unnecessary providers.

#### Acceptance Criteria

1. WHEN running integration tests THEN the system SHALL create test-specific modules with only necessary providers
2. WHEN testing service interactions THEN the system SHALL mock external dependencies like databases and third-party services
3. WHEN creating test modules THEN the system SHALL avoid loading GlobalExceptionFilter and other complex global providers
4. WHEN integration tests run THEN the system SHALL complete in under 30 seconds for the full suite

### Requirement 3

**User Story:** As a developer, I want comprehensive E2E tests using TestApplicationFactory, so that I can test complete user workflows with proper mocking.

#### Acceptance Criteria

1. WHEN running E2E tests THEN the system SHALL use TestApplicationFactory with comprehensive application-level mocking
2. WHEN testing complete workflows THEN the system SHALL mock all external services including databases, notifications, and monitoring
3. WHEN E2E tests execute THEN the system SHALL simulate real HTTP requests and responses
4. WHEN testing authentication flows THEN the system SHALL properly mock JWT services and security monitoring

### Requirement 4

**User Story:** As a developer, I want proper dependency injection overrides for mocking, so that I can replace services with test doubles without affecting other tests.

#### Acceptance Criteria

1. WHEN overriding services THEN the system SHALL use NestJS testing module overrides instead of global Jest mocks
2. WHEN mocking shared libraries THEN the system SHALL create factory functions that return consistent mock implementations
3. WHEN tests require different mock behaviors THEN the system SHALL allow per-test service overrides
4. WHEN mocking database services THEN the system SHALL provide realistic query builder mocks that match Knex.js interface

### Requirement 5

**User Story:** As a developer, I want fast and reliable test execution, so that I can run tests frequently during development without significant delays.

#### Acceptance Criteria

1. WHEN running the full test suite THEN the system SHALL complete in under 2 minutes
2. WHEN running unit tests THEN the system SHALL complete in under 30 seconds
3. WHEN tests run in parallel THEN the system SHALL not have race conditions or shared state issues
4. WHEN a test fails THEN the system SHALL not affect other test execution or cause cascading failures

### Requirement 6

**User Story:** As a developer, I want clear test categorization and organization, so that I can run specific types of tests based on my development needs.

#### Acceptance Criteria

1. WHEN organizing tests THEN the system SHALL separate unit, integration, and E2E tests into distinct directories
2. WHEN running tests THEN the system SHALL support running specific test categories via npm scripts
3. WHEN writing tests THEN the system SHALL follow consistent naming conventions for test files and describe blocks
4. WHEN tests are added THEN the system SHALL include proper documentation and examples for each test type

### Requirement 7

**User Story:** As a developer, I want realistic test data factories, so that I can create consistent test scenarios without manual data setup.

#### Acceptance Criteria

1. WHEN creating test data THEN the system SHALL provide factory functions for all major entities (User, Tenant, etc.)
2. WHEN test data is needed THEN the system SHALL support creating related entities with proper relationships
3. WHEN tests require specific data scenarios THEN the system SHALL allow overriding factory defaults
4. WHEN cleaning up tests THEN the system SHALL provide utilities to reset mock state between tests

### Requirement 8

**User Story:** As a developer, I want proper error handling and debugging support in tests, so that I can quickly identify and fix issues.

#### Acceptance Criteria

1. WHEN tests fail THEN the system SHALL provide detailed error messages with context about what was being tested
2. WHEN debugging tests THEN the system SHALL support running individual tests with proper logging
3. WHEN mock expectations fail THEN the system SHALL clearly indicate which mock was called incorrectly
4. WHEN database operations fail in tests THEN the system SHALL provide meaningful error messages about the expected vs actual behavior

### Requirement 9

**User Story:** As a developer, I want separate test applications for all current and future applications that don't interfere with production builds, so that I can build and deploy production code without test-related compilation issues.

#### Acceptance Criteria

1. WHEN building any production application THEN the system SHALL exclude all test files and dependencies from the build process
2. WHEN running tests THEN the system SHALL use dedicated test applications (e.g., sos-web-api-tests, sos-web-training-tests) that import production code as dependencies
3. WHEN test dependencies have TypeScript issues THEN the system SHALL not prevent any production builds from succeeding
4. WHEN deploying any application to production THEN the system SHALL only include production code and dependencies in the deployment artifacts
5. WHEN creating new applications THEN the system SHALL follow the separated test application pattern by default

### Requirement 10

**User Story:** As a developer, I want independent test execution environments for all applications, so that I can run comprehensive tests without affecting any production application startup or configuration.

#### Acceptance Criteria

1. WHEN any test application starts THEN the system SHALL load test-specific configurations and mock implementations
2. WHEN running different test types THEN the system SHALL support separate test apps for each production application (sos-web-api-tests, sos-web-training-tests, etc.)
3. WHEN test applications import production code THEN the system SHALL maintain proper dependency boundaries and avoid circular imports
4. WHEN any production application starts THEN the system SHALL not load any test-related code or configurations
5. WHEN configuring monorepo workspaces THEN the system SHALL include test-apps/* in workspace configuration for proper dependency management
6. WHEN new applications are added to the monorepo THEN the system SHALL automatically create corresponding test applications following the established pattern