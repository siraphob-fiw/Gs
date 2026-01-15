# Shared Libraries Integration

This document describes the implementation of shared library integrations and dependency injection for the NestJS application.

## Overview

The shared library integration has been successfully configured to provide consistent access to database, caching, logging, and security services across the NestJS application.

## Architecture

### Module Structure

```
src/shared/
├── shared.module.ts          # Main shared module
├── database/
│   ├── database.module.ts    # Database integration
│   └── index.ts
├── cache/
│   ├── cache.module.ts       # Cache service integration
│   └── index.ts
├── logging/
│   ├── logging.module.ts     # Logging service integration
│   └── index.ts
├── security/
│   ├── security.module.ts    # Security services integration
│   └── index.ts
├── services/
│   ├── shared-services.service.ts  # Demo service
│   └── index.ts
├── controllers/
│   ├── shared-test.controller.ts   # Test endpoints
│   └── index.ts
└── index.ts
```

## Integrated Services

### 1. Database Module (`@strengthos/shared-database`)

**Provider**: `IDb`
**Implementation**: Knex-based database connection with PostgreSQL
**Configuration**: Environment-based configuration (DB_HOST, DB_PORT, DB_DB, DB_USER, DB_PWD)

```typescript
@Inject('IDb') private readonly database: IDb
```

### 2. Cache Module (`@strengthos/shared-cache`)

**Provider**: `IRedisCacheService`
**Implementation**: Redis-based caching with session management, tenant isolation, and performance monitoring
**Configuration**: Environment-based Redis configuration (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, etc.)

```typescript
@Inject('IRedisCacheService') private readonly cache: IRedisCacheService
```

### 3. Logging Module (`@strengthos/shared-logging`)

**Provider**: `ILogger`
**Implementation**: Structured logging with multiple levels (info, warning, error, debug)
**Current**: Console-based implementation (will be replaced with database-backed logging)

```typescript
@Inject('ILogger') private readonly logger: ILogger
```

### 4. Security Module (`@strengthos/shared-security`)

**Providers**: 
- `JwtService`: JWT token generation and validation
- `PasswordUtils`: Password hashing and validation
- `AuthenticationService`: User authentication and session management
- `AccessControlService`: Permission and role-based access control
- `SecurityMonitoringService`: Security event monitoring and audit logging

```typescript
@Inject('AuthenticationService') private readonly authService: AuthenticationService
@Inject('AccessControlService') private readonly accessControl: AccessControlService
@Inject('SecurityMonitoringService') private readonly securityMonitoring: SecurityMonitoringService
```

## Configuration

### Environment Variables

The shared libraries use the following environment variables:

#### Database Configuration
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `DB_DB`: Database name (default: strengthos)
- `DB_USER`: Database username (default: postgres)
- `DB_PWD`: Database password (default: password)

#### Redis Configuration
- `REDIS_HOST`: Redis host (default: localhost)
- `REDIS_PORT`: Redis port (default: 6379)
- `REDIS_PASSWORD`: Redis password (optional)
- `REDIS_DB`: Redis database number (default: 0)
- `REDIS_KEY_PREFIX`: Key prefix for Redis keys (default: strengthos:)
- `REDIS_DEFAULT_TTL`: Default TTL for cache entries (default: 600 seconds)

#### JWT Configuration
- `JWT_SECRET`: JWT signing secret (default: default-secret-change-in-production)
- `JWT_ALGORITHM`: JWT algorithm (default: HS256)
- `JWT_EXPIRES_IN`: JWT expiration time (default: 24h)
- `JWT_ISSUER`: JWT issuer (default: strengthos)
- `JWT_AUDIENCE`: JWT audience (default: strengthos-api)

## Usage Examples

### Using Database Service

```typescript
@Injectable()
export class UserService {
  constructor(@Inject('IDb') private readonly db: IDb) {}

  async findUser(id: string) {
    return await this.db.knex('users').where({ id }).first();
  }
}
```

### Using Cache Service

```typescript
@Injectable()
export class SessionService {
  constructor(@Inject('IRedisCacheService') private readonly cache: IRedisCacheService) {}

  async setUserSession(sessionId: string, session: UserSession) {
    return await this.cache.setSession(sessionId, session, 1800);
  }
}
```

### Using Logging Service

```typescript
@Injectable()
export class AnyService {
  constructor(@Inject('ILogger') private readonly logger: ILogger) {}

  async performOperation() {
    await this.logger.info({ message: 'Operation started' });
    // ... operation logic
    await this.logger.info({ message: 'Operation completed' });
  }
}
```

### Using Security Services

```typescript
@Injectable()
export class AuthController {
  constructor(
    @Inject('AuthenticationService') private readonly authService: AuthenticationService,
    @Inject('AccessControlService') private readonly accessControl: AccessControlService
  ) {}

  async login(loginRequest: LoginRequest) {
    return await this.authService.login(loginRequest);
  }

  async checkPermission(userId: string, resource: string, action: string) {
    return await this.accessControl.checkPermission(userId, resource, action);
  }
}
```

## Test Endpoints

The integration includes test endpoints to verify shared library functionality:

- `GET /shared-test/status` - Get status of all shared services
- `GET /shared-test/database-test` - Test database connection
- `GET /shared-test/cache-test` - Test cache connection
- `GET /shared-test/cache-metrics` - Get cache performance metrics
- `GET /shared-test/logging-test` - Test logging functionality

## Testing

The shared library integration includes comprehensive tests:

```bash
# Run shared module tests
npm test -- --testPathPattern=shared.module.spec.ts

# Run type checking
npm run typecheck

# Build the application
npm run build
```

## Benefits

1. **Consistency**: All services use the same shared libraries with consistent interfaces
2. **Maintainability**: Centralized configuration and dependency injection
3. **Testability**: Easy to mock shared services for unit testing
4. **Scalability**: Modular architecture allows for easy extension
5. **Type Safety**: Full TypeScript support with proper type definitions
6. **Performance**: Optimized caching and database connection pooling
7. **Security**: Integrated security services with audit logging

## Next Steps

1. Replace console-based logging with database-backed logging service
2. Add health checks for all shared services
3. Implement metrics collection and monitoring
4. Add circuit breaker patterns for external dependencies
5. Implement distributed tracing for request correlation