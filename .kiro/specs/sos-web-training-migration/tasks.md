# Implementation Plan

- [x] 1. Set up shared-ui library infrastructure
  - Create `libs/shared-ui` directory structure with src, components, and configuration files
  - Configure package.json with proper dependencies and build scripts
  - Set up TypeScript configuration and build pipeline integration
  - _Requirements: 1.5, 7.1, 7.6_

- [x] 2. Create core shared UI components

- [x] 2.1 Implement basic UI components in shared-ui
  - Create Button, Input, Card, Modal components with TypeScript interfaces
  - Implement Tailwind CSS styling with tenant-specific theme support
  - Add theme provider and tenant theming configuration
  - Write unit tests for each component and theming functionality
  - _Requirements: 7.2, 7.3, 7.4_

- [x] 2.2 Implement navigation components in shared-ui
  - Create Navbar, Sidebar, and Breadcrumb components with tenant theming
  - Add proper TypeScript props and tenant-aware styling
  - Implement tenant logo and branding customization
  - Write unit tests for navigation components and theming
  - _Requirements: 7.2, 7.3, 7.4_

- [x] 2.3 Implement layout components in shared-ui
  - Create Container, Grid, Flex layout components with tenant theming
  - Add responsive design support with tenant-customizable Tailwind CSS
  - Implement tenant-specific color schemes and branding
  - Write unit tests for layout components and tenant theming
  - _Requirements: 7.2, 7.3, 7.4_

- [x] 3. Create specialized shared components

- [x] 3.1 Implement ExerciseList component with customization
  - Create ExerciseList component with selectable and customizable props
  - Add selection handlers and customization render props
  - Write unit tests for selection and customization functionality
  - _Requirements: 2.1, 7.2, 7.5_

- [x] 3.2 Implement EquipmentList component with customization
  - Create EquipmentList component with selectable and customizable props
  - Add selection handlers and customization capabilities
  - Write unit tests for equipment selection and customization
  - _Requirements: 2.1, 7.2, 7.5_

- [x] 3.3 Implement WorkoutSession component with customization
  - Create WorkoutSession component with customizable workout flow
  - Add customization props and render functions
  - Write unit tests for workout session customization
  - _Requirements: 2.1, 7.2, 7.5_

- [x] 4. Set up sos-web-training app infrastructure

- [x] 4.1 Create Next.js app structure
  - Create `apps/sos-web-training` directory with Next.js 15+ configuration
  - Set up package.json with dependencies including shared libraries
  - Configure TypeScript, ESLint, and Tailwind CSS
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 4.2 Configure monorepo integration
  - Update Turbo configuration to include new app in build pipeline
  - Configure workspace dependencies for shared libraries
  - Set up development and build scripts
  - _Requirements: 1.3, 1.4, 6.1, 6.2_

- [x] 4.3 Set up API integration infrastructure
  - Create API client configuration using shared-external library
  - Set up environment variable configuration for API endpoints
  - Implement base API error handling with shared-logging
  - _Requirements: 3.1, 3.3_

- [x] 4.4 Implement tenant theming infrastructure
  - Create tenant theme configuration and detection system
  - Implement dynamic theme loading from tenant API endpoints
  - Set up theme context provider for tenant-specific styling
  - Add tenant branding and logo management
  - _Requirements: 7.4, 3.1_

- [x] 5. Implement authentication and security

- [x] 5.1 Set up authentication integration
  - Integrate with sos-web-api authentication system using shared-security
  - Implement JWT token handling and session management
  - Create authentication context and hooks
  - _Requirements: 3.2, 5.5_

- [x] 5.2 Implement route protection middleware
  - Create Next.js middleware for route protection
  - Implement role-based access control for user/coach roles
  - Add redirect logic for unauthorized access attempts
  - _Requirements: 5.1, 5.3, 5.4_

- [x] 6. Migrate and implement core app components

- [x] 6.1 Create app-specific components
  - Implement WorkoutCalendar component for training app
  - Create app-specific layout and page components
  - Write unit tests for app-specific components
  - _Requirements: 2.2, 2.3_

- [x] 6.2 Implement API integration hooks
  - Create custom hooks for workout, exercise, and equipment data fetching
  - Implement React Query integration for caching and state management
  - Add proper TypeScript types using shared-types library
  - _Requirements: 3.1, 3.3, 3.5_

- [x] 6.3 Migrate pages and routing structure
  - Transfer all pages from human-lift-training-fe/src/app to new app structure
  - Update routing to use Next.js app router patterns
  - Implement proper page layouts and metadata
  - _Requirements: 2.2, 2.3_

- [x] 7. Implement user interface and functionality

- [x] 7.1 Create main application layout
  - Implement main layout using shared-ui navigation components
  - Add responsive design and mobile support
  - Integrate tenant-aware theme provider and styling system
  - Implement tenant detection and theme loading from API
  - _Requirements: 2.4, 4.1, 4.2_

- [x] 7.2 Implement training management features
  - Create workout management interface using shared ExerciseList and EquipmentList
  - Add workout customization capabilities for users and coaches
  - Implement workout session interface with customizable WorkoutSession component
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7.3 Implement user and coach specific features
  - Create user dashboard with personal training programs
  - Implement coach interface for managing client workouts
  - Add role-based feature visibility and access control
  - _Requirements: 4.1, 4.2, 5.1, 5.2_

- [x] 8. Add form handling and validation

- [x] 8.1 Implement form components and validation
  - Create form handling utilities using shared-validation library
  - Implement workout and exercise form components
  - Add client-side validation with proper error handling
  - _Requirements: 2.5, 3.4_

- [x] 8.2 Integrate server-side validation
  - Connect form submissions to sos-web-api with proper validation
  - Implement error handling for API validation responses
  - Add success and error feedback for user actions
  - _Requirements: 3.1, 3.4_

- [x] 9. Implement testing suite

- [x] 9.1 Set up testing infrastructure
  - Configure Jest and React Testing Library for the app
  - Set up test utilities and mock configurations
  - Create test setup files and helpers
  - _Requirements: 6.3_

- [x] 9.2 Write comprehensive unit tests




  - Write unit tests for all app-specific components
  - Test API integration hooks and error handling
  - Add tests for authentication and route protection
  - _Requirements: 6.3_

- [x] 9.3 Implement integration tests





  - Create integration tests for complete user workflows
  - Test API integration with mock backend responses
  - Add tests for form submission and validation flows
  - _Requirements: 6.3_

- [ ] 10. Configure build and deployment

- [ ] 10.1 Set up Docker configuration
  - Create Dockerfile for sos-web-training app
  - Configure docker-compose integration for development
  - Set up multi-stage build for production optimization
  - _Requirements: 6.3, 6.5_

- [x] 10.2 Configure production build pipeline
  - Optimize build configuration for production deployment
  - Set up environment-specific configurations
  - Configure static asset optimization and caching
  - _Requirements: 6.4, 6.5_

- [x] 11. Implement internationalization (i18n) support using shared-i18n library






- [x] 11.1 Set up shared-i18n integration infrastructure


  - Install and configure @strengthos/shared-i18n dependency in sos-web-training
  - Initialize I18nService with Next.js app configuration
  - Set up locale detection using shared-i18n utilities for browser and user preferences
  - Configure fallback language handling using shared-i18n default mechanisms
  - _Requirements: 8.1, 8.3, 8.5, 8.6_

- [x] 11.2 Create React integration for shared-i18n


  - Create React context provider wrapping the shared I18nService
  - Implement useTranslation hook for component-level translations
  - Create useLocale hook for locale management and switching
  - Set up translation context providers with shared-i18n caching
  - _Requirements: 8.2, 8.4, 8.6, 8.9_

- [x] 11.3 Implement translation keys and content


  - Define comprehensive English translation keys for all UI text using shared-i18n TranslationKey interface
  - Implement Thai translations using the shared translation management system
  - Create language switcher component using shared locale utilities
  - Test language switching functionality across all pages with shared-i18n service
  - _Requirements: 8.1, 8.2, 8.4, 8.9_

- [x] 11.4 Integrate formatting and API multilingual support


  - Implement number, date, currency, and weight formatting using shared-i18n formatters
  - Ensure API requests include locale headers using shared locale detection
  - Implement translation handling for dynamic content from backend using shared-i18n service
  - Test multilingual data flow and formatting consistency across the application
  - _Requirements: 8.7, 8.8, 3.1, 8.9_

- [x] 12. Perform final migration and cleanup

- [x] 12.1 Complete migration verification
  - Verify all functionality from human-lift-training-fe is working in new app
  - Test all user and coach workflows end-to-end
  - Validate API integration and authentication flows
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 12.2 Update documentation and references
  - Update README and setup documentation for new app structure
  - Update any external references to point to new app
  - Create migration guide and deployment instructions
  - _Requirements: 9.3, 9.4_

- [x] 12.3 Remove legacy frontend application
  - Safely remove human-lift-training-fe directory after verification
  - Clean up any remaining references in configuration files
  - Update monorepo scripts and documentation
  - _Requirements: 9.1, 9.2, 9.5_

- [ ] 13. Update API integration to use correct sos-web-api endpoints

- [x] 13.1 Audit and map current API endpoint usage


  - Identify all API calls in sos-web-training that use outdated endpoints (/plans, /workouts, /exercises)
  - Map these calls to the correct program-generation endpoints in sos-web-api
  - Document the endpoint mapping and required data transformations
  - _Requirements: 3.1, 3.3, 3.5_



- [ ] 13.2 Update API hooks to use program-generation endpoints
  - Modify useWorkouts hook to use /program-generation/training-blocks endpoints
  - Update useExercises hook to use appropriate program-generation endpoints
  - Replace Plan types with TrainingBlock and ProgramTemplate types from shared-types
  - Update API client calls to match the actual backend controller routes


  - _Requirements: 3.1, 3.3, 3.5_

- [ ] 13.3 Update frontend components to use correct data types
  - Replace Plan interface usage with TrainingBlock and ProgramTemplate types
  - Update WorkoutManagement component to work with training-block data structure


  - Modify Dashboard component to display training blocks instead of plans
  - Update all form components to submit data in the format expected by program-generation endpoints
  - _Requirements: 2.1, 2.2, 3.5_

- [ ] 13.4 Implement proper error handling for new API structure
  - Update error handling to work with program-generation API error responses
  - Modify API client error handling to match sos-web-api error format
  - Update user-facing error messages to reflect the new API structure
  - Test error scenarios with the updated endpoints
  - _Requirements: 3.4, 3.1_

- [x] 13.5 Update authentication and authorization for program-generation endpoints



  - Verify JWT token handling works with program-generation controllers
  - Update role-based access control to match program-generation endpoint permissions
  - Test user and coach access to training-block endpoints
  - Ensure tenant isolation works correctly with the new endpoints
  - _Requirements: 3.2, 5.1, 5.2, 5.5_

- [ ] 13.6 Test and validate updated API integration
  - Write integration tests for all updated API endpoints
  - Test CRUD operations for training blocks using the correct endpoints
  - Validate data flow from frontend to backend with new API structure
  - Perform end-to-end testing of user workflows with updated API calls
  - _Requirements: 3.1, 3.3, 3.4, 3.5_