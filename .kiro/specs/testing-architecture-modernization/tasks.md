# Implementation Plan

- [-] 1. Create separated test applications and infrastructure

  - [x] 1.1 Create test-apps folder and sos-web-api-tests application
    - Create new test-apps/ directory in monorepo root for all test applications
    - Create NestJS application structure for test-apps/sos-web-api-tests
    - Configure package.json with sos-web-api and shared-testing as dependencies
    - Set up Jest configuration optimized for test application structure
    - Configure TypeScript settings for test application with proper imports from production app
    - Update monorepo workspace configuration to include test-apps/*
    - _Requirements: 9.1, 9.2, 9.3, 10.1_

  - [x] 1.2 Enhance shared-testing library and set up test app structure

    - Enhance libs/shared-testing with TestModuleBuilder, MockFactory interfaces, and common utilities
    - Create directory structure in test-apps/sos-web-api-tests with unit/, integration/, e2e/, fixtures/, and utils/ folders
    - Configure test application to use shared-testing library for common infrastructure
    - Add app-specific test utilities and configuration in test application
    - _Requirements: 6.1, 6.2, 6.3, 10.2_

  - [x] 1.3 Configure all production applications to exclude test files

    - Remove all test files and test dependencies from sos-web-api production app
    - Remove all test files and test dependencies from sos-web-training production app
    - Update all production package.json files to exclude test-related dependencies
    - Configure build scripts to ensure no test code is included in any production builds
    - Verify all production applications build and start without test dependencies
    - _Requirements: 9.1, 9.4, 10.4_

  - [x] 1.4 Create sos-web-training-tests application

    - Create test-apps/sos-web-training-tests for Next.js application testing
    - Configure package.json with sos-web-training and shared-testing as dependencies
    - Set up Jest and Playwright configuration for frontend testing
    - Configure TypeScript settings for test application with proper imports from production app
    - Create directory structure for unit, integration, and e2e tests
    - _Requirements: 9.2, 9.5, 10.2, 10.6_
-
  - [x] 1.5 Create test application templates in shared-testing

    - Implement createTestApplication utility in libs/shared-testing for generating new test apps
    - Create templates for NestJS and Next.js test applications
    - Add CLI script for automatically creating test applications for new production apps
    - Document the process for creating test applications for future applications
    - _Requirements: 9.5, 10.6_
-

- [x] 2. Implement core test utilities and mock factories in test application



  - [x] 2.1 Implement TestModuleBuilder in shared-testing library


    - Write TestModuleBuilder class in libs/shared-testing with forService(), forController(), and forModule() methods
    - Implement ServiceTestBuilder and ControllerTestBuilder with mock configuration
    - Add support for excluding global providers and complex dependencies
    - Configure test application to use shared TestModuleBuilder with proper imports from production app
    - Write unit tests for TestModuleBuilder functionality in shared-testing library
    - _Requirements: 1.3, 2.3, 4.1, 4.2, 10.3_

  - [x] 2.2 Implement MockFactory system in shared-testing and test app


    - Create base MockFactory interface in libs/shared-testing with create(), createMany(), and reset() methods
    - Implement app-specific UserFactory, TenantFactory, and other entity factories in test application
    - Configure factories to import and use production application data models and types
    - Add TestDataBuilder in test app for creating related entities with proper relationships
    - Write unit tests for factory functionality and relationship management
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 10.3_

  - [x] 2.3 Create database and service mock utilities in shared-testing library


    - Implement realistic Knex.js query builder mocks in libs/shared-testing that match the actual interface
    - Create mock implementations for shared library services (notifications, monitoring, security) in shared-testing
    - Add mock configuration utilities for different test scenarios in shared-testing
    - Configure test application to use shared mocks with imported production service interfaces
    - Write tests to verify mock implementations match real service interfaces
    - _Requirements: 4.4, 1.2, 2.2, 10.3_

- [-] 3. Migrate existing unit tests to separated test application



  - [x] 3.1 Move and refactor UserService tests to test application







    - Move UserService.spec.ts from apps/sos-web-api to test-apps/sos-web-api-tests
    - Update imports to reference production application services and types from @strengthos/sos-web-api
    - Convert tests to use TestModuleBuilder from @strengthos/shared-testing with proper dependency injection overrides
    - Ensure tests run in isolation without shared state or external dependencies
    - Verify test performance improvement and production build no longer includes test files
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.1, 9.2_

  - [x] 3.2 Migrate TenantService and related service tests to test application





    - Move TenantService, TenantContextService, and TenantAwareDatabaseService tests to test app
    - Update all imports to reference production application modules
    - Implement proper mocking for database operations and tenant context using test app utilities
    - Add comprehensive test coverage for tenant-specific business logic
    - Ensure tests complete quickly without database dependencies
    - _Requirements: 1.1, 1.2, 5.2, 9.2, 10.3_

  - [x] 3.3 Convert remaining service tests to separated test application pattern





    - Move all remaining service tests from production app to sos-web-api-tests
    - Update imports for ValidationService, NotificationService, and other core services
    - Replace bcrypt and other external library mocks with proper dependency injection
    - Implement consistent error handling and assertion patterns across all service tests
    - Add performance benchmarks to ensure unit tests complete under target times
    - _Requirements: 1.1, 5.2, 8.1, 8.3, 9.1, 9.4_

- [-] 4. Create simplified integration test modules in test application

  - [x] 4.1 Implement integration tests for AuthModule in test app

    - Create test-specific AuthModule configuration with minimal providers in test application
    - Import AuthModule from production app and configure with test-specific overrides
    - Mock external dependencies like database, notifications, and security monitoring
    - Test authentication flows, JWT token generation, and role-based access control
    - Verify module interactions work correctly with mocked dependencies
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 10.1, 10.3_

  - [x] 4.2 Build UserModule integration tests in test app





    - Import UserModule from production app and create simplified test configuration
    - Exclude complex global providers and configure test-specific overrides
    - Test user creation, update, and status management workflows
    - Verify proper interaction between UserService, UserRepository, and validation services
    - Add tests for bulk operations and role assignment functionality
    - _Requirements: 2.1, 2.2, 4.3, 10.1, 10.3_

  - [x] 4.3 Implement TenantModule integration tests in test app








    - Import TenantModule from production app and create test configuration
    - Configure tenant-aware database mocking within test application
    - Test tenant creation, domain validation, and multi-tenancy isolation
    - Verify tenant context propagation and data isolation between tenants
    - Add comprehensive error handling tests for tenant-related operations
    - _Requirements: 2.1, 2.2, 8.2, 10.1, 10.3_

- [-] 5. Implement TestApplicationFactory for E2E tests in test application


  - [x] 5.1 Create TestApplicationFactory with comprehensive mocking in test app



    - Implement TestApplicationFactory class in test application with application-level mock configuration
    - Configure factory to import and bootstrap production application with test overrides
    - Add support for module-specific provider overrides and global service mocking
    - Create application mock definitions for database, notifications, and monitoring services
    - Write tests to verify TestApplicationFactory creates properly configured applications
    - _Requirements: 3.1, 3.2, 4.1, 10.1, 10.2_

  - [x] 5.2 Build authentication and authorization E2E tests





    - Create comprehensive E2E tests for user registration, login, and logout workflows
    - Test JWT token validation, refresh token functionality, and session management
    - Verify role-based access control and permission checking across different endpoints
    - Add tests for security monitoring integration and failed login tracking
    - _Requirements: 3.1, 3.3, 3.4_

  - [x] 5.3 Implement user management E2E workflows





    - Create E2E tests for complete user lifecycle management (create, update, delete, status changes)
    - Test bulk operations, role assignments, and tenant-specific user operations
    - Verify proper error handling and validation across the entire user management flow
    - Add performance tests to ensure E2E workflows complete within acceptable timeframes
    - _Requirements: 3.1, 3.3, 5.1_

- [x] 6. Optimize test performance and parallel execution


  - [x] 6.1 Implement test isolation and cleanup mechanisms


    - Add proper test cleanup utilities to reset mock state between tests
    - Implement resource management to prevent memory leaks and handle cleanup
    - Create test isolation mechanisms to prevent shared state issues
    - Write tests to verify proper cleanup and isolation between test runs
    - _Requirements: 5.3, 7.4, 8.4_

  - [x] 6.2 Add test categorization and execution scripts


    - Create npm scripts for running unit, integration, and E2E tests separately
    - Implement test tagging and filtering for different development scenarios
    - Add performance monitoring and reporting for test execution times
    - Create documentation and examples for each test category and execution method
    - _Requirements: 6.1, 6.2, 6.4, 5.1, 5.2_

  - [x] 6.3 Implement comprehensive error handling and debugging support


    - Add detailed error messages with context for test failures and setup issues
    - Implement debugging utilities for individual test execution with proper logging
    - Create clear error reporting for mock expectation failures and assertion errors
    - Add troubleshooting documentation and common error resolution guides
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 7. Remove legacy testing infrastructure and finalize migration





  - [x] 7.1 Clean up global mocks and legacy test setup


    - Remove global Jest mocks from setup.ts that are replaced by dependency injection overrides
    - Delete obsolete test utilities and mock implementations that are no longer needed
    - Update Jest configuration to optimize for new test structure and performance
    - Verify all tests pass with new infrastructure and no legacy dependencies remain
    - _Requirements: 4.2, 5.1, 5.2_

  - [x] 7.2 Update documentation and add comprehensive examples


    - Create detailed documentation for new testing patterns and best practices
    - Add code examples and templates for unit, integration, and E2E test creation
    - Document mock factory usage, TestModuleBuilder patterns, and TestApplicationFactory configuration
    - Create troubleshooting guide and FAQ for common testing scenarios and issues
    - _Requirements: 6.4, 8.1, 8.2_

  - [x] 7.3 Validate final test suite performance and reliability


    - Run complete test suite to verify all tests pass and performance targets are met
    - Measure and document test execution times for unit (< 30s), integration, and E2E tests
    - Verify test reliability by running multiple iterations and checking for flaky tests
    - Create performance benchmarks and monitoring for ongoing test suite health
    - _Requirements: 5.1, 5.2, 5.4_