# Requirements Document

## Introduction

This feature involves creating a new Next.js application called `sos-web-training` within the monorepo's apps directory and migrating the existing `human-lift-training-fe` frontend application into this new structure. The new application will serve as the primary web interface for users and coaches to access training functionality, while administrative functions will be handled by a separate `sos-web-admin` application. The new app will integrate with the existing `sos-web-api` backend and leverage the monorepo's shared libraries for consistency and code reuse.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to create a new Next.js app structure in the monorepo, so that the training frontend follows the established monorepo patterns and can leverage shared libraries.

#### Acceptance Criteria

1. WHEN creating the new app THEN the system SHALL create a directory structure at `apps/sos-web-training`
2. WHEN setting up the app THEN the system SHALL configure it as a Next.js 15+ application with TypeScript
3. WHEN configuring the app THEN the system SHALL integrate it with the monorepo's Turbo build system
4. WHEN setting up dependencies THEN the system SHALL reference shared libraries from the monorepo's `libs` and `packages` directories
5. WHEN creating shared UI THEN the system SHALL create a `libs/shared-ui` library for reusable components
6. IF the app is created THEN it SHALL follow the same configuration patterns as `sos-web-api` for consistency

### Requirement 2

**User Story:** As a developer, I want to migrate all existing frontend code from human-lift-training-fe, so that no functionality is lost during the transition.

#### Acceptance Criteria

1. WHEN migrating components THEN reusable UI components SHALL be moved to a shared-ui package for cross-app usage
2. WHEN migrating app-specific components THEN they SHALL be preserved in `sos-web-training/src/components`
3. WHEN migrating app structure THEN the system SHALL transfer all pages and routing from `human-lift-training-fe/src/app`
4. WHEN migrating utilities THEN the system SHALL preserve all helper functions from `human-lift-training-fe/src/helpers`
5. WHEN migrating styles THEN the system SHALL maintain Tailwind CSS configuration and custom styles
6. WHEN migrating dependencies THEN the system SHALL preserve all necessary npm packages including HeroUI, Framer Motion, and validation libraries

### Requirement 3

**User Story:** As a developer, I want the new app to integrate with sos-web-api, so that it can access backend services and data.

#### Acceptance Criteria

1. WHEN configuring API integration THEN the system SHALL establish connection patterns to `sos-web-api`
2. WHEN setting up authentication THEN the system SHALL integrate with the existing authentication system from `sos-web-api`
3. WHEN configuring environment variables THEN the system SHALL support development, staging, and production API endpoints
4. IF API calls are made THEN they SHALL use consistent error handling and response patterns
5. WHEN integrating THEN the system SHALL leverage shared types from the monorepo's shared libraries

### Requirement 4

**User Story:** As a user or coach, I want to access all training-related functionality through the new web interface, so that I can manage my training without needing admin privileges.

#### Acceptance Criteria

1. WHEN accessing the app THEN users SHALL be able to view and manage their training programs
2. WHEN coaches use the app THEN they SHALL be able to manage their clients' training programs
3. WHEN users interact with the app THEN they SHALL NOT have access to administrative functions
4. IF a user tries to access admin functions THEN the system SHALL redirect them appropriately or show access denied
5. WHEN using the app THEN all user-facing training features from the original app SHALL be available

### Requirement 5

**User Story:** As a developer, I want to maintain separation between user/coach functionality and admin functionality, so that the codebase remains organized and secure.

#### Acceptance Criteria

1. WHEN developing features THEN admin-specific functionality SHALL be excluded from `sos-web-training`
2. WHEN organizing code THEN user and coach features SHALL be clearly separated from admin features
3. WHEN implementing routing THEN admin routes SHALL not be accessible from the training app
4. IF admin functionality is needed THEN it SHALL be directed to the future `sos-web-admin` application
5. WHEN configuring permissions THEN the app SHALL enforce user/coach role restrictions

### Requirement 6

**User Story:** As a developer, I want to properly configure the build and deployment pipeline, so that the new app can be built, tested, and deployed consistently with other monorepo applications.

#### Acceptance Criteria

1. WHEN configuring Turbo THEN the new app SHALL be included in the monorepo's build pipeline
2. WHEN setting up scripts THEN the app SHALL support dev, build, start, lint, and test commands
3. WHEN configuring Docker THEN the app SHALL have appropriate Dockerfile and docker-compose configurations
4. IF the app is built THEN it SHALL produce optimized production bundles
5. WHEN deploying THEN the app SHALL support the same deployment patterns as other monorepo applications

### Requirement 7

**User Story:** As a developer, I want to create a shared-ui library, so that all applications in the monorepo can use consistent UI components and design patterns.

#### Acceptance Criteria

1. WHEN creating the shared-ui library THEN it SHALL be located at `libs/shared-ui`
2. WHEN developing components THEN they SHALL be framework-agnostic and reusable across different apps
3. WHEN exporting components THEN the library SHALL provide TypeScript definitions and proper exports
4. WHEN styling components THEN they SHALL use Tailwind CSS classes and support theming
5. IF components are used THEN they SHALL be importable by both `sos-web-training` and future `sos-web-admin` apps
6. WHEN building THEN the shared-ui library SHALL be included in the Turbo build pipeline

### Requirement 8

**User Story:** As a user, I want to be able to switch between English and Thai languages in the application, so that I can use the app in my preferred language with all text properly translated using the monorepo's shared internationalization system.

#### Acceptance Criteria

1. WHEN accessing the app THEN the system SHALL support both English and Thai language options using the `@strengthos/shared-i18n` library
2. WHEN a user selects a language THEN all UI text, labels, and messages SHALL be displayed in the selected language through the shared I18nService
3. WHEN translations are loaded THEN they SHALL be cached using the shared-i18n caching mechanism for optimal performance
4. WHEN a user changes language THEN the preference SHALL be saved and persist across sessions using the shared translation management system
5. IF translations are missing THEN the system SHALL fallback to English as the default language using the shared-i18n fallback mechanism
6. WHEN the app loads THEN it SHALL detect the user's preferred language from their profile or browser settings using the shared locale detection utilities
7. WHEN displaying content THEN dynamic content from the API SHALL also support multilingual responses coordinated through the shared-i18n service
8. WHEN formatting data THEN numbers, dates, currencies, and weights SHALL be formatted according to the selected locale using the shared formatting utilities
9. WHEN the app integrates with other monorepo applications THEN translation keys and locale preferences SHALL be consistent across all apps using the shared-i18n library

### Requirement 9

**User Story:** As a developer, I want to clean up the old frontend structure, so that the codebase doesn't contain duplicate or obsolete code.

#### Acceptance Criteria

1. WHEN migration is complete THEN the `human-lift-training-fe` directory SHALL be safely removed
2. WHEN cleaning up THEN any references to the old frontend SHALL be updated to point to the new app
3. WHEN removing old code THEN documentation SHALL be updated to reflect the new structure
4. IF there are any external references THEN they SHALL be identified and updated
5. WHEN cleanup is complete THEN the monorepo SHALL only contain the new `sos-web-training` app for user/coach functionality