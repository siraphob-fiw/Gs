# Implementation Plan

- [x] 1. Establish baseline and prepare for modernization





  - Create git branch for modernization work
  - Document current package versions and vulnerability state
  - Run full test suite to establish baseline results
  - Create backup of all package.json and lock files
  - _Requirements: 9.1, 10.1_

- [x] 2. Phase 1: Critical Security Vulnerability Fixes





- [x] 2.1 Fix Next.js critical vulnerabilities


  - Update Next.js to latest patch version within v14 range (14.2.32)
  - Test all Next.js applications for functionality
  - Verify critical security vulnerabilities are resolved
  - _Requirements: 1.1, 4.1_

- [x] 2.2 Fix faker.js high severity vulnerability


  - Replace faker.js v6.6.6 with @faker-js/faker latest version
  - Update all test files using faker to use new API
  - Verify all tests pass with new faker implementation
  - _Requirements: 1.1, 7.1_

- [x] 2.3 Fix html-minifier and mjml vulnerabilities


  - Update mjml packages to latest versions to resolve html-minifier dependency
  - Test email template generation functionality
  - Verify no breaking changes in email rendering
  - _Requirements: 1.1_

- [x] 2.4 Fix tmp package vulnerability


  - Update @nestjs/cli to v11.0.10 to resolve tmp dependency
  - Test NestJS CLI functionality and code generation
  - Verify no breaking changes in development workflow
  - _Requirements: 1.1, 8.2_

- [x] 2.5 Validate Phase 1 security fixes


  - Run npm audit to verify critical and high vulnerabilities are resolved
  - Execute full test suite to ensure no regressions
  - Document remaining moderate and low severity vulnerabilities
  - _Requirements: 1.1, 1.4, 10.1_

- [-] 3. Phase 2: TypeScript and Build Tools Update
- [x] 3.1 Update TypeScript to consistent version across all workspaces
  - Update TypeScript to v5.9.2 in all package.json files
  - Update @types packages to compatible versions
  - Fix any TypeScript compilation errors
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 3.2 Update Turbo build system
  - Update turbo to v2.5.6 in root package.json
  - Update turbo.json configuration for any breaking changes
  - Test all turbo commands (build, dev, test, lint)
  - _Requirements: 8.1, 2.4_

- [x] 3.3 Update ESLint and Prettier
  - Update ESLint to v9.34.0 and related plugins
  - Update Prettier to latest version
  - Fix any new linting errors introduced by updates
  - Update ESLint configuration for new version compatibility
  - _Requirements: 8.2, 2.2_

- [ ] 3.4 Validate Phase 2 build tools




  - Run typecheck across all workspaces
  - Execute lint and format commands
  - Verify build pipeline works correctly
  - _Requirements: 6.4, 8.4, 10.1_

- [ ] 4. Phase 3: Testing Framework Updates
- [ ] 4.1 Update Jest to v30 in API workspace
  - Update Jest and related packages to v30.1.1 in sos-web-api
  - Update Jest configuration for breaking changes
  - Fix any test failures due to Jest updates
  - _Requirements: 7.1, 7.2_

- [ ] 4.2 Update Vitest to v3 in shared libraries
  - Update Vitest to v3.2.4 in all shared library workspaces
  - Update Vitest configuration files for breaking changes
  - Fix any test failures due to Vitest updates
  - _Requirements: 7.1, 7.3_

- [ ] 4.3 Update Testing Library packages
  - Update @testing-library/react to v16.3.0
  - Update @testing-library/jest-dom to latest version
  - Update @testing-library/user-event to latest version
  - Fix any test failures due to Testing Library updates
  - _Requirements: 7.1, 7.4_

- [ ] 4.4 Validate Phase 3 testing updates
  - Run all unit tests across all workspaces
  - Run integration tests in API workspace
  - Verify test coverage reporting works correctly
  - _Requirements: 7.4, 10.1, 10.2_

- [-] 5. Phase 4: NestJS Ecosystem Update



- [x] 5.1 Update NestJS core packages


  - Update @nestjs/common, @nestjs/core to v11.1.6
  - Update @nestjs/platform-express to v11.1.6
  - Update @nestjs/testing to v11.1.6
  - _Requirements: 3.1, 3.2_

- [x] 5.2 Update NestJS feature modules
  - Update @nestjs/config to v4.0.2
  - Update @nestjs/jwt to v11.0.0
  - Update @nestjs/passport to v11.0.5
  - Update @nestjs/swagger to v11.2.0
  - Update @nestjs/terminus to v11.0.0
  - Update @nestjs/throttler to v6.4.0
  - _Requirements: 3.1, 3.2_

- [x] 5.3 Update NestJS cache manager

  - Update @nestjs/cache-manager to v3.0.1
  - Update cache-manager to v7.2.0
  - Test caching functionality with new versions
  - _Requirements: 3.1, 3.2_

- [x] 5.4 Fix NestJS breaking changes


  - Update code for any NestJS v11 breaking changes
  - Update dependency injection patterns if needed
  - Update middleware and guard implementations
  - _Requirements: 3.2, 3.3_

- [ ] 5.5 Validate Phase 4 NestJS updates
  - Run all API unit tests
  - Run API integration tests
  - Test all API endpoints functionality
  - Verify authentication and authorization work correctly
  - _Requirements: 3.2, 3.3, 3.4, 10.2_

- [-] 6. Phase 5: Next.js and React Update



- [x] 6.1 Update React to v19


  - Update react and react-dom to v19.1.1 in sos-web-training
  - Update @types/react and @types/react-dom to v19.x
  - Fix any React 19 breaking changes in components
  - _Requirements: 5.1, 5.2_

- [x] 6.2 Update Next.js to v15







  - Update Next.js to v15.5.2 in sos-web-training
  - Update next-themes and other Next.js related packages
  - Update Next.js configuration for v15 changes
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6.3 Update frontend dependencies





  - Update @tanstack/react-query to latest v5
  - Update framer-motion to latest version
  - Update @heroui/react to latest version
  - Update tailwindcss to v4.1.12
  - _Requirements: 2.1, 2.3_

- [x] 6.4 Fix Next.js and React breaking changes


  - Update components for React 19 changes
  - Update Next.js app structure for v15 changes
  - Update routing and navigation code
  - Update build configuration
  - _Requirements: 4.3, 4.4, 5.3, 5.4_

- [ ] 6.5 Validate Phase 5 frontend updates
  - Run all frontend unit tests
  - Test all pages and components render correctly
  - Test all user interactions and workflows
  - Verify build process completes successfully
  - _Requirements: 4.2, 4.3, 4.4, 5.1, 5.3, 5.4, 10.3_

- [ ] 7. Phase 6: Final Dependency Cleanup
- [ ] 7.1 Update remaining major dependencies
  - Update bcrypt to v6.0.0
  - Update helmet to v8.1.0
  - Update passport to v0.7.0
  - Update redis to v5.8.2
  - Update uuid to v11.1.0
  - _Requirements: 2.1, 2.3_

- [ ] 7.2 Update development and build dependencies
  - Update rimraf to v6.0.1
  - Update supertest to v7.1.4
  - Update concurrently to v9.2.1
  - Update autoprefixer and postcss
  - _Requirements: 2.1, 8.4_

- [ ] 7.3 Update utility and validation libraries
  - Update joi to v18.0.1
  - Update zod to v4.1.5
  - Update dayjs to v1.11.18
  - Update clsx and tailwind-merge
  - _Requirements: 2.1, 2.3_

- [ ] 7.4 Align dependency versions across workspaces
  - Ensure consistent versions of shared dependencies
  - Update peerDependencies in shared libraries
  - Remove any duplicate or conflicting dependencies
  - _Requirements: 2.1, 2.2, 6.3_

- [ ] 7.5 Validate Phase 6 final updates
  - Run npm audit to verify minimal vulnerabilities remain
  - Run full test suite across all workspaces
  - Verify all builds complete successfully
  - Test cross-workspace dependency resolution
  - _Requirements: 1.2, 2.4, 10.1, 10.4_

- [ ] 8. Phase 7: Final Validation and Documentation
- [ ] 8.1 Comprehensive testing validation
  - Run all unit tests across all workspaces
  - Run all integration tests
  - Execute end-to-end testing workflows
  - Verify performance benchmarks meet standards
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 8.2 Security and vulnerability validation
  - Run final npm audit across all workspaces
  - Verify all critical and high vulnerabilities resolved
  - Document any remaining moderate/low vulnerabilities
  - Run security scanning tools
  - _Requirements: 1.1, 1.2_

- [ ] 8.3 Build and deployment validation
  - Test production builds for all applications
  - Verify CI/CD pipeline works with updates
  - Test deployment process in staging environment
  - Validate monitoring and logging functionality
  - _Requirements: 8.4, 2.4_

- [ ] 8.4 Create rollback procedures documentation
  - Document rollback steps for each phase
  - Test rollback procedures for critical phases
  - Create emergency rollback scripts
  - Document recovery procedures for common issues
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 8.5 Update project documentation
  - Update README files with new dependency versions
  - Update development setup instructions
  - Document any new development workflow changes
  - Update deployment and maintenance documentation
  - _Requirements: 2.4, 8.4_