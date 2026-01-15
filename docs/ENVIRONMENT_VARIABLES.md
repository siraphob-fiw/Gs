# Environment Variables Documentation

This document provides comprehensive documentation for all environment variables used in the StrengthOS platform, following the standardized database connection configuration approach.

## Database Configuration

All database connections use the standardized `DATABASE_*` environment variable naming convention.

### Required Variables

| Variable | Description | Example | Notes |
|----------|-------------|---------|-------|
| `DATABASE_NAME` | PostgreSQL database name | `strengthos_prod` | Required for connection |
| `DATABASE_USER` | PostgreSQL username | `postgres` | Required for authentication |
| `DATABASE_PASSWORD` | PostgreSQL password | `secure_password_123` | Required for authentication |

### Optional Variables (with defaults)

| Variable | Description | Default | Example | Notes |
|----------|-------------|---------|---------|-------|
| `DATABASE_URL` | Complete PostgreSQL connection string | - | `postgresql://user:pass@host:5432/db` | If provided, takes precedence over individual vars |
| `DATABASE_HOST` | PostgreSQL server hostname | `localhost` | `postgres` | Can be hostname or IP address |
| `DATABASE_PORT` | PostgreSQL server port | `5432` | `5432` | Must be between 1-65535 |
| `DATABASE_SSL` | Enable SSL/TLS connection | `false` | `true` | Set to `true` for production |
| `DATABASE_POOL_MIN` | Minimum connection pool size | `2` | `5` | Must be less than max |
| `DATABASE_POOL_MAX` | Maximum connection pool size | `10` | `30` | Adjust based on load |
| `DATABASE_TIMEOUT` | Connection timeout in milliseconds | `30000` | `60000` | 1000-300000ms range |

### Environment-Specific Examples

#### Development
```bash
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=strengthos_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_SSL=false
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_TIMEOUT=30000
```

#### Production
```bash
DATABASE_URL=postgresql://user:password@prod-db.example.com:5432/strengthos_prod
DATABASE_SSL=true
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=30
DATABASE_TIMEOUT=60000
```

## Redis Configuration

All Redis connections use the standardized `REDIS_*` environment variable naming convention.

### Optional Variables (all have defaults)

| Variable | Description | Default | Example | Notes |
|----------|-------------|---------|---------|-------|
| `REDIS_URL` | Complete Redis connection string | - | `redis://:password@host:6379/0` | If provided, takes precedence |
| `REDIS_HOST` | Redis server hostname | `localhost` | `redis` | Can be hostname or IP address |
| `REDIS_PORT` | Redis server port | `6379` | `6379` | Must be between 1-65535 |
| `REDIS_PASSWORD` | Redis authentication password | - | `redis_password_123` | Optional, leave empty if no auth |
| `REDIS_DB` | Redis database number | `0` | `1` | Must be between 0-15 |
| `REDIS_TIMEOUT` | Connection timeout in milliseconds | `5000` | `10000` | 1000-60000ms range |
| `REDIS_POOL_MIN` | Minimum connection pool size | `1` | `2` | Must be less than max |
| `REDIS_POOL_MAX` | Maximum connection pool size | `5` | `10` | Adjust based on load |

### Environment-Specific Examples

#### Development
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_TIMEOUT=5000
REDIS_POOL_MIN=1
REDIS_POOL_MAX=5
```

#### Production
```bash
REDIS_URL=redis://:secure_password@prod-redis.example.com:6379/0
REDIS_TIMEOUT=10000
REDIS_POOL_MIN=2
REDIS_POOL_MAX=10
```

## Application Configuration

### Core Application Settings

| Variable | Description | Default | Example | Notes |
|----------|-------------|---------|---------|-------|
| `NODE_ENV` | Application environment | `development` | `production` | Controls logging and optimizations |
| `PORT` | HTTP server port | `3000` | `3001` | Port for the API server |

### Security Configuration

| Variable | Description | Default | Example | Notes |
|----------|-------------|---------|---------|-------|
| `JWT_SECRET` | JWT signing secret | - | `your-super-secret-jwt-key` | **Required** - Change in production |
| `JWT_EXPIRES_IN` | JWT token expiration | `24h` | `1h` | Use short expiration for security |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | - | `your-refresh-secret` | **Required** - Different from JWT_SECRET |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` | `30d` | Longer than access token |
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` | `14` | Higher = more secure but slower |

### Rate Limiting

| Variable | Description | Default | Example | Notes |
|----------|-------------|---------|---------|-------|
| `RATE_LIMIT_TTL` | Rate limit window in ms | `60000` | `300000` | Time window for rate limiting |
| `RATE_LIMIT_MAX` | Max requests per window | `100` | `1000` | Adjust based on expected load |

### CORS Configuration

| Variable | Description | Default | Example | Notes |
|----------|-------------|---------|---------|-------|
| `CORS_ORIGINS` | Allowed CORS origins | - | `http://localhost:3000,https://app.example.com` | Comma-separated list |

### Logging Configuration

| Variable | Description | Default | Example | Notes |
|----------|-------------|---------|---------|-------|
| `LOG_LEVEL` | Application log level | `info` | `debug` | debug, info, warn, error |

### External Services

| Variable | Description | Default | Example | Notes |
|----------|-------------|---------|---------|-------|
| `SMTP_HOST` | SMTP server hostname | - | `smtp.gmail.com` | For email notifications |
| `SMTP_PORT` | SMTP server port | `587` | `465` | Usually 587 or 465 |
| `SMTP_USER` | SMTP username | - | `noreply@example.com` | SMTP authentication |
| `SMTP_PASSWORD` | SMTP password | - | `app_password_123` | SMTP authentication |

### Monitoring

| Variable | Description | Default | Example | Notes |
|----------|-------------|---------|---------|-------|
| `SENTRY_DSN` | Sentry error tracking DSN | - | `https://...@sentry.io/...` | Optional error tracking |
| `PROMETHEUS_ENABLED` | Enable Prometheus metrics | `false` | `true` | For production monitoring |

## Docker Compose Integration

### Development Environment

The `docker-compose.yml` and `docker-compose.dev.yml` files use the standardized environment variables:

```yaml
environment:
  # Database Configuration
  DATABASE_URL: postgresql://postgres:postgres@postgres:5432/gym_db
  DATABASE_HOST: postgres
  DATABASE_PORT: 5432
  DATABASE_NAME: gym_db
  DATABASE_USER: postgres
  DATABASE_PASSWORD: postgres
  DATABASE_SSL: false
  DATABASE_POOL_MIN: 2
  DATABASE_POOL_MAX: 10
  DATABASE_TIMEOUT: 30000
  
  # Redis Configuration
  REDIS_URL: redis://redis:6379
  REDIS_HOST: redis
  REDIS_PORT: 6379
  REDIS_PASSWORD: ""
  REDIS_DB: 0
  REDIS_TIMEOUT: 5000
  REDIS_POOL_MIN: 1
  REDIS_POOL_MAX: 5
```

### Production Environment

The production Docker Compose file uses environment variable substitution:

```yaml
environment:
  POSTGRES_DB: ${DATABASE_NAME:-strengthos_prod}
  POSTGRES_USER: ${DATABASE_USER:-postgres}
  POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
```

## Configuration Validation

The application validates all configuration at startup using the `ConnectionConfigFactory`:

### Validation Rules

1. **Required Fields**: Database name, user, and password are required (unless DATABASE_URL is provided)
2. **Port Ranges**: Ports must be between 1-65535
3. **Pool Sizes**: Pool minimum must be less than maximum
4. **Timeouts**: Must be between 1000ms and 300000ms (database) or 60000ms (Redis)
5. **SSL Settings**: Must be boolean values
6. **Database Numbers**: Redis DB must be between 0-15

### Error Handling

- **Missing Required Variables**: Application fails to start with descriptive error messages
- **Invalid Values**: Validation errors specify the field and constraint violation
- **Connection Failures**: Detailed error messages without exposing credentials

### Secure Logging

- Passwords and sensitive values are never logged
- Connection strings are masked in logs
- Configuration success messages show only non-sensitive information

## Migration from Legacy Configuration

If you're migrating from older configuration patterns:

### Old Pattern → New Pattern

```bash
# Old inconsistent naming
DB_HOST=localhost          → DATABASE_HOST=localhost
DB_PORT=5432              → DATABASE_PORT=5432
DB_NAME=gym_db            → DATABASE_NAME=gym_db
DB_USER=postgres          → DATABASE_USER=postgres
DB_PASSWORD=password      → DATABASE_PASSWORD=password

# Redis naming was already consistent
REDIS_HOST=localhost      → REDIS_HOST=localhost (no change)
REDIS_PORT=6379          → REDIS_PORT=6379 (no change)
```

### Migration Steps

1. Update your `.env` files to use the new variable names
2. Update any deployment scripts or CI/CD configurations
3. Verify that all services start successfully with the new configuration
4. Remove any old environment variables that are no longer used

## Troubleshooting

### Common Issues

1. **"Missing required database environment variables"**
   - Ensure `DATABASE_NAME`, `DATABASE_USER`, and `DATABASE_PASSWORD` are set
   - Or provide a complete `DATABASE_URL` instead

2. **"Pool minimum must be less than maximum"**
   - Check that `DATABASE_POOL_MIN` < `DATABASE_POOL_MAX`
   - Check that `REDIS_POOL_MIN` < `REDIS_POOL_MAX`

3. **"Invalid PostgreSQL connection URL format"**
   - Ensure `DATABASE_URL` follows the format: `postgresql://user:password@host:port/database`

4. **"Failed to connect to database/redis"**
   - Verify the host and port are correct and accessible
   - Check that the database/Redis service is running
   - Verify credentials are correct

### Debugging Configuration

Enable debug logging to see configuration details:

```bash
LOG_LEVEL=debug
```

This will show (masked) configuration values during startup to help identify issues.

## Best Practices

1. **Use Environment-Specific Files**: Create separate `.env.development`, `.env.staging`, `.env.production` files
2. **Secure Production Secrets**: Use secret management systems for production passwords
3. **Connection Pooling**: Adjust pool sizes based on your application's concurrent load
4. **SSL in Production**: Always enable `DATABASE_SSL=true` for production databases
5. **Monitoring**: Enable Prometheus metrics in production for connection monitoring
6. **Backup Configuration**: Document your production configuration (without secrets) for disaster recovery

## Security Considerations

1. **Never commit `.env` files** with real credentials to version control
2. **Use strong passwords** for database and Redis authentication
3. **Enable SSL/TLS** for all production database connections
4. **Rotate secrets regularly** in production environments
5. **Use least-privilege access** for database users
6. **Monitor connection attempts** and failed authentications
7. **Use connection timeouts** to prevent hanging connections
8. **Limit connection pool sizes** to prevent resource exhaustion