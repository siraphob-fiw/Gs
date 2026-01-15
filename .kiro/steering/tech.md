# Technology Stack & Build System

## Build System
- **Monorepo Management**: Turborepo for task orchestration and caching
- **Package Manager**: npm (v10.9.2+) with workspaces
- **Node.js**: v20.11.0+ required

## Core Technologies
- **Backend**: NestJS with Fastify adapter
- **Frontend**: Next.js for web applications
- **Database**: PostgreSQL with Knex.js query builder
- **Cache**: Redis for session and application caching
- **Language**: TypeScript throughout the stack

## Key Dependencies
- **Authentication**: Passport.js with JWT strategy
- **Validation**: class-validator and class-transformer
- **Security**: Helmet, bcrypt for password hashing
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest for unit, integration, and e2e tests

## Development Commands

### Root Level (Monorepo)
```bash
# Install all dependencies
npm run install:all

# Development (all apps)
npm run dev

# Build all applications
npm run build

# Run tests across all packages
npm run test

# Lint all code
npm run lint

# Type checking
npm run typecheck
```

### Application-Specific Commands
```bash
# API Development
npm run dev:api
npm run build:api
npm run start:api

# Training App Development  
npm run dev:training
npm run build:training
npm run start:training
```

### Database Operations
```bash
# Generate new migration
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed
```

## Docker & Deployment
- Multi-stage Docker builds for production optimization
- Docker Compose for local development with PostgreSQL and Redis
- Health checks configured for all services
- Environment-based configuration

## Code Quality Tools
- **ESLint**: TypeScript-aware linting with Prettier integration
- **Prettier**: Code formatting with consistent style
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Husky**: Git hooks for pre-commit validation (if configured)