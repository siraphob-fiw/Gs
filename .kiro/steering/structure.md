# Project Structure & Organization

## Monorepo Layout
```
humanStrengthOS/
├── apps/                    # Applications
│   ├── sos-web-api/        # NestJS REST API
│   └── sos-web-training/   # Next.js training app
├── libs/                   # Shared libraries
│   ├── shared-types/       # Core types and interfaces
│   ├── shared-utils/       # Common utilities (Results, Utils, Formatter)
│   ├── shared-database/    # Database connection and abstractions
│   ├── shared-logging/     # Logging infrastructure
│   ├── shared-security/    # Security utilities and middleware
│   ├── shared-validation/  # Validation schemas and utilities
│   ├── shared-cache/       # Redis caching abstractions
│   ├── shared-notifications/ # Notification system
│   ├── shared-middleware/  # Common middleware components
│   ├── shared-monitoring/  # Health checks and metrics
│   ├── shared-i18n/       # Internationalization
│   ├── shared-ui/         # Shared UI components
│   └── shared-testing/    # Testing utilities
├── docs/                  # Documentation
├── scripts/               # Build and deployment scripts
├── monitoring/            # Monitoring configurations
└── helm/                  # Kubernetes deployment charts
```

## Shared Libraries Architecture

### Core Principle
All business logic, types, and utilities live in `/libs` to ensure:
- **No code duplication** between applications
- **Consistent type safety** across the platform
- **Reusable components** and utilities
- **Centralized business rules**

### Library Organization
- **Domain-specific modules** in `shared-types` (health, payment, audit, etc.)
- **Functional utilities** in `shared-utils` (Results pattern, formatters)
- **Infrastructure concerns** in dedicated libs (database, logging, cache)
- **Cross-cutting concerns** in middleware and security libs

## Path Mapping & Imports
TypeScript path mapping is configured for clean imports:
```typescript
// Use specific imports for tree-shaking
import { User, UserRole } from '@strengthos/shared-types';
import { Results } from '@strengthos/shared-utils';
import { Logger } from '@strengthos/shared-logging';
```

## Naming Conventions

### Files & Directories
- **kebab-case** for file and directory names
- **PascalCase** for TypeScript interfaces and classes
- **camelCase** for variables and functions
- **UPPER_CASE** for constants and enum members

### Code Conventions
- **Interfaces**: No "I" prefix (e.g., `User` not `IUser`)
- **Private members**: Leading underscore required (`_privateMethod`)
- **Enums**: UPPER_CASE members
- **Results pattern**: Use `Results.ok()` and `Results.fail()` for consistent error handling

## Application Structure
Each app in `/apps` follows framework-specific conventions:
- **NestJS API**: Module-based architecture with controllers, services, and DTOs
- **Next.js Apps**: Pages/app router with components and utilities

## Configuration Management
- **Environment-based** configuration using NestJS Config
- **Docker Compose** for local development environment
- **Kubernetes Helm charts** for production deployment
- **Shared configuration** patterns across applications