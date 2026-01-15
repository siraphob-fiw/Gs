# StrengthOS Web API

A comprehensive, enterprise-grade NestJS REST API providing backend services for the StrengthOS platform - empowering strength athletes, coaches, and organizations with intelligent program generation, health integration, and performance analytics.

## 🚀 Features

### Core Functionality
- **🧠 Intelligent Program Generation**: AI-driven training program creation and adaptation
- **🏥 Health Integration**: Injury management, fatigue monitoring, and health data processing
- **📊 Performance Analytics**: Comprehensive tracking and analysis of athlete performance
- **👥 Multi-Tenant Architecture**: Secure tenant isolation with role-based access control
- **📱 Competition Planning**: Meet preparation, attempt recommendations, and result analysis
- **🔄 Real-time Adaptation**: Dynamic program adjustments based on performance feedback

### Technical Excellence
- **🏗️ NestJS Framework**: Modern, scalable Node.js framework with dependency injection
- **🔒 TypeScript**: Full type safety and modern JavaScript features
- **📚 OpenAPI/Swagger**: Comprehensive API documentation with interactive testing
- **🛡️ Enterprise Security**: JWT authentication, rate limiting, and security middleware
- **🏃‍♂️ High Performance**: Redis caching, database optimization, and monitoring
- **🔍 Observability**: Health checks, metrics, performance monitoring, and structured logging
- **🧪 Comprehensive Testing**: Unit, integration, and e2e tests with coverage reporting

## 🔐 Security & Governance

### Security Controls
- **🔑 JWT Authentication**: Secure token-based authentication with refresh tokens
- **🛡️ Role-Based Access Control (RBAC)**: Granular permissions and tenant isolation
- **🚦 Rate Limiting**: Configurable request throttling and DDoS protection
- **🔒 Data Encryption**: Encryption in transit (TLS) and at rest
- **🛠️ Input Validation**: Comprehensive request validation and sanitization
- **📝 Audit Logging**: Complete audit trail of all API operations
- **🚨 Security Headers**: CORS, CSRF, and other security middleware

### Compliance & Governance
- **🇪🇺 GDPR Compliance**: 
  - Data subject rights (access, rectification, erasure, portability)
  - Consent management and withdrawal mechanisms
  - Data minimization and purpose limitation
  - Privacy by design and default
  - Data breach notification procedures

- **📋 ISO 27001 Compatible**:
  - Information security management framework
  - Risk assessment and management procedures
  - Access control and privilege management
  - Incident response and business continuity
  - Regular security assessments and audits

- **📊 Data Governance**:
  - Data classification and handling procedures
  - Retention and deletion policies
  - Data lineage and provenance tracking
  - Cross-border data transfer controls

### Privacy Controls
- **🔐 Data Anonymization**: Automatic PII anonymization for analytics
- **🎭 Pseudonymization**: Reversible anonymization for data processing
- **📍 Data Residency**: Configurable data storage location controls
- **🔄 Data Portability**: Standard export formats for data transfer
- **🗑️ Right to Erasure**: Automated data deletion workflows

## 🛠️ Getting Started

### Prerequisites
- **Node.js** >= 20.11.0
- **npm** >= 10.9.2
- **PostgreSQL** >= 13
- **Redis** >= 6
- **Docker** (optional, for containerized services)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd humanStrengthOS

# Install dependencies
npm install

# Navigate to API directory
cd apps/sos-web-api

# Copy environment configuration
cp config/development.env.example config/development.env
```

### Environment Configuration

Configure your environment variables in `config/development.env`:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/strengthos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=strengthos_user
DB_PASSWORD=your_secure_password
DB_DATABASE=strengthos

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API Configuration
PORT=3000
NODE_ENV=development
API_PREFIX=api/v1

# Security Configuration
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# Monitoring & Logging
LOG_LEVEL=debug
ENABLE_METRICS=true
ENABLE_HEALTH_CHECKS=true
```

### Database Setup

```bash
# Run database migrations
npm run db:migrate

# Seed database with initial data (optional)
npm run db:seed

# Generate new migration (when needed)
npm run db:generate -- migration_name
```

### Docker Setup (Alternative)

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Or start all services
docker-compose up -d
```

## 🚀 Running the API

### Development Mode

```bash
# Start with hot reload
npm run start:dev

# Start with debug mode
npm run start:debug

# Start from monorepo root
npm run dev:api
```

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Health Check

```bash
# Check API health
curl http://localhost:3000/api/v1/health

# Detailed health check
curl http://localhost:3000/api/v1/health/detailed
```

## 📡 API Usage & Examples

### Authentication

```bash
# Login to get JWT token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'

# Use token in subsequent requests
curl -X GET http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Program Generation

```bash
# Generate a training program
curl -X POST http://localhost:3000/api/v1/program-generation/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: your-tenant-id" \
  -d '{
    "athleteId": "athlete-uuid",
    "discipline": "POWERLIFTING",
    "programType": "STRENGTH",
    "duration": 12,
    "trainingDays": 4,
    "experience": "INTERMEDIATE"
  }'

# Get training blocks
curl -X GET "http://localhost:3000/api/v1/program-generation/training-blocks?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: your-tenant-id"
```

### Health & Injury Management

```bash
# Create injury record
curl -X POST http://localhost:3000/api/v1/program-generation/injury-management \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: your-tenant-id" \
  -d '{
    "athleteId": "athlete-uuid",
    "name": "Lower Back Strain",
    "bodyPart": "LOWER_BACK",
    "severity": "MODERATE",
    "restrictions": [
      {
        "exerciseId": "deadlift",
        "restriction": "AVOID",
        "alternatives": ["trap_bar_deadlift"]
      }
    ]
  }'

# Get athlete health data
curl -X GET http://localhost:3000/api/v1/program-generation/health/fatigue/athlete-uuid/current \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: your-tenant-id"
```

### Competition Planning

```bash
# Create competition
curl -X POST http://localhost:3000/api/v1/program-generation/competition-planning/competitions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: your-tenant-id" \
  -d '{
    "name": "Regional Championships",
    "date": "2024-06-15",
    "type": "POWERLIFTING",
    "location": "City Arena"
  }'

# Generate attempt recommendations
curl -X POST http://localhost:3000/api/v1/program-generation/competition-planning/attempt-recommendations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: your-tenant-id" \
  -d '{
    "competitionPlanId": "plan-uuid",
    "athleteId": "athlete-uuid"
  }'
```

## 📚 API Documentation

### Interactive Documentation
- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI Spec**: http://localhost:3000/api/docs-json
- **Redoc**: http://localhost:3000/api/redoc

### API Endpoints Overview

| Module | Endpoint | Description |
|--------|----------|-------------|
| Authentication | `/api/v1/auth/*` | Login, logout, token refresh |
| Users | `/api/v1/users/*` | User management and profiles |
| Program Generation | `/api/v1/program-generation/*` | AI-driven program creation |
| Health Integration | `/api/v1/program-generation/health/*` | Health data and injury management |
| Training Blocks | `/api/v1/program-generation/training-blocks/*` | Training session management |
| Competition Planning | `/api/v1/program-generation/competition-planning/*` | Meet preparation and analysis |
| Exercise Selection | `/api/v1/program-generation/exercises/*` | Exercise database and selection |
| Templates | `/api/v1/program-generation/templates/*` | Program template management |
| Tenants | `/api/v1/tenants/*` | Multi-tenant organization management |
| Health Checks | `/api/v1/health/*` | System health and monitoring |

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch

# Specific test file
npm run test -- injury.service.spec.ts
```

### Load Testing

```bash
# Install k6 for load testing
npm install -g k6

# Run basic load test
k6 run scripts/load-test.js
```

## 📊 Monitoring & Observability

### Health Endpoints

```bash
# Basic health check
GET /api/v1/health

# Detailed health with dependencies
GET /api/v1/health/detailed

# Readiness probe
GET /api/v1/health/ready

# Liveness probe
GET /api/v1/health/live

# Performance metrics
GET /api/v1/health/performance

# Prometheus metrics
GET /api/v1/health/metrics/prometheus
```

### Logging

The API uses structured logging with different levels:

```bash
# Set log level via environment
LOG_LEVEL=debug|info|warn|error

# View logs in JSON format for parsing
npm run start:dev | npx pino-pretty
```

### Performance Monitoring

```bash
# Get performance metrics
curl http://localhost:3000/api/v1/performance/metrics

# Database performance
curl http://localhost:3000/api/v1/performance/database/pool

# Slow queries
curl http://localhost:3000/api/v1/performance/queries/slow
```

## 🏗️ Architecture

### Project Structure

```
src/
├── auth/                    # Authentication & authorization
├── users/                   # User management
├── tenants/                 # Multi-tenant architecture
├── program-generation/      # Core program generation logic
│   ├── controllers/         # API controllers
│   ├── services/           # Business logic
│   ├── repositories/       # Data access layer
│   ├── dto/                # Data transfer objects
│   ├── entities/           # Database entities
│   └── guards/             # Security guards
├── shared/                 # Shared modules and utilities
│   ├── database/           # Database configuration
│   ├── logging/            # Logging utilities
│   ├── validation/         # Input validation
│   └── security/           # Security middleware
├── health/                 # Health check endpoints
├── config/                 # Configuration management
└── main.ts                 # Application bootstrap
```

### Technology Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Knex.js
- **Caching**: Redis
- **Authentication**: JWT with refresh tokens
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest with supertest
- **Validation**: class-validator and class-transformer
- **Logging**: Structured logging with correlation IDs

## 🔧 Development

### Code Quality

```bash
# Linting
npm run lint
npm run lint:fix

# Code formatting
npm run format

# Type checking
npm run type-check

# Pre-commit hooks
npm run pre-commit
```

### Database Management

```bash
# Create new migration
npm run db:generate -- create_user_preferences_table

# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Reset database
npm run db:reset

# Seed development data
npm run db:seed
```

### Environment Management

```bash
# Development
NODE_ENV=development npm run start:dev

# Staging
NODE_ENV=staging npm run start

# Production
NODE_ENV=production npm run start:prod
```

## 🚀 Deployment

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start:prod

# Or using PM2
pm2 start ecosystem.config.js
```

### Docker Deployment

```bash
# Build Docker image
docker build -t strengthos-api .

# Run container
docker run -p 3000:3000 strengthos-api

# Docker Compose
docker-compose up -d
```

### Health Checks for Kubernetes

```yaml
livenessProbe:
  httpGet:
    path: /api/v1/health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/v1/health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## 📋 Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run build` | Build the application for production |
| `npm run start` | Start the application |
| `npm run start:dev` | Start in development mode with hot reload |
| `npm run start:debug` | Start in debug mode |
| `npm run start:prod` | Start in production mode |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run db:migrate` | Run database migrations |
| `npm run db:rollback` | Rollback last migration |
| `npm run db:seed` | Run database seeds |
| `npm run db:generate` | Generate new migration |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the coding standards
4. Add tests for new functionality
5. Ensure all tests pass: `npm run test`
6. Commit your changes: `git commit -m 'feat: add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: http://localhost:3000/api/docs
- **Health Status**: http://localhost:3000/api/v1/health
- **Issues**: Create an issue in the repository
- **Security**: Report security issues privately

---

**Built with ❤️ for the strength training community**