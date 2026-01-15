# Database Connection Troubleshooting Guide

This guide provides solutions for common database and Redis connection issues in the StrengthOS platform.

## Table of Contents

- [Configuration Issues](#configuration-issues)
- [Connection Problems](#connection-problems)
- [Performance Issues](#performance-issues)
- [Redis-Specific Issues](#redis-specific-issues)
- [Monitoring and Diagnostics](#monitoring-and-diagnostics)
- [Environment-Specific Issues](#environment-specific-issues)

## Configuration Issues

### Missing Environment Variables

**Symptoms:**
- Application fails to start with configuration validation errors
- Error messages about missing required environment variables

**Common Errors:**
```
Configuration error for database_environment: Missing required database environment variables: DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD
```

**Solutions:**

1. **Check Required Variables:**
   ```bash
   # Database (PostgreSQL)
   DATABASE_URL=postgresql://user:password@host:port/database
   # OR individual variables:
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=your_database
   DATABASE_USER=your_username
   DATABASE_PASSWORD=your_password
   DATABASE_SSL=false

   # Redis (optional)
   REDIS_URL=redis://host:port
   # OR individual variables:
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your_password  # if required
   REDIS_DB=0
   ```

2. **Verify Environment File:**
   ```bash
   # Check if .env file exists and is readable
   ls -la .env*
   cat .env.example  # Review example configuration
   ```

3. **Docker Environment:**
   ```bash
   # Check Docker Compose environment variables
   docker-compose config  # Verify variable substitution
   ```

### Invalid Configuration Values

**Symptoms:**
- Configuration validation errors about invalid values
- Application starts but connections fail

**Common Errors:**
```
Invalid database configuration for port: must be a number between 1 and 65535
Invalid database configuration for pool.max: must be greater than pool.min
```

**Solutions:**

1. **Port Configuration:**
   ```bash
   DATABASE_PORT=5432  # Must be numeric
   REDIS_PORT=6379     # Must be numeric
   ```

2. **Pool Configuration:**
   ```bash
   DATABASE_POOL_MIN=2   # Minimum connections
   DATABASE_POOL_MAX=10  # Maximum connections (must be > min)
   ```

3. **Timeout Configuration:**
   ```bash
   DATABASE_TIMEOUT=30000  # 30 seconds in milliseconds
   REDIS_TIMEOUT=5000      # 5 seconds in milliseconds
   ```

### Connection URL Format Issues

**Symptoms:**
- Invalid connection URL format errors
- URL parsing failures

**Common Errors:**
```
Invalid PostgreSQL connection URL format. Expected: postgresql://user:password@host:port/database
```

**Solutions:**

1. **PostgreSQL URL Format:**
   ```bash
   # Correct format
   DATABASE_URL=postgresql://username:password@hostname:5432/database_name
   
   # With SSL
   DATABASE_URL=postgresql://username:password@hostname:5432/database_name?ssl=true
   
   # URL encoding for special characters
   DATABASE_URL=postgresql://user:p%40ssw0rd@host:5432/db  # @ encoded as %40
   ```

2. **Redis URL Format:**
   ```bash
   # Basic format
   REDIS_URL=redis://hostname:6379
   
   # With password
   REDIS_URL=redis://:password@hostname:6379
   
   # With database selection
   REDIS_URL=redis://hostname:6379/1
   ```

## Connection Problems

### Connection Refused

**Symptoms:**
- "Connection refused" errors
- Application cannot connect to database/Redis

**Diagnosis:**
```bash
# Test database connectivity
telnet database_host 5432
nc -zv database_host 5432

# Test Redis connectivity
telnet redis_host 6379
nc -zv redis_host 6379

# Check if services are running
docker ps  # For containerized services
systemctl status postgresql  # For system services
systemctl status redis
```

**Solutions:**

1. **Service Not Running:**
   ```bash
   # Start PostgreSQL
   sudo systemctl start postgresql
   docker-compose up -d postgres  # Docker

   # Start Redis
   sudo systemctl start redis
   docker-compose up -d redis  # Docker
   ```

2. **Firewall Issues:**
   ```bash
   # Check firewall rules
   sudo ufw status
   sudo iptables -L

   # Allow database ports
   sudo ufw allow 5432  # PostgreSQL
   sudo ufw allow 6379  # Redis
   ```

3. **Network Configuration:**
   ```bash
   # Check network connectivity
   ping database_host
   nslookup database_host

   # Check Docker network
   docker network ls
   docker network inspect your_network_name
   ```

### Authentication Failures

**Symptoms:**
- Authentication failed errors
- Password authentication errors

**Common Errors:**
```
Database authentication failed for user: your_username
Redis authentication failed - check password configuration
```

**Solutions:**

1. **PostgreSQL Authentication:**
   ```bash
   # Test connection manually
   psql -h hostname -p 5432 -U username -d database_name
   
   # Check pg_hba.conf configuration
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   
   # Ensure user exists and has proper permissions
   sudo -u postgres psql
   \du  # List users
   GRANT ALL PRIVILEGES ON DATABASE your_db TO your_user;
   ```

2. **Redis Authentication:**
   ```bash
   # Test Redis connection
   redis-cli -h hostname -p 6379 -a password ping
   
   # Check Redis configuration
   redis-cli CONFIG GET requirepass
   
   # Set Redis password if needed
   redis-cli CONFIG SET requirepass your_password
   ```

### Connection Timeouts

**Symptoms:**
- Connection timeout errors
- Slow connection establishment

**Solutions:**

1. **Increase Timeout Values:**
   ```bash
   DATABASE_TIMEOUT=60000  # 60 seconds
   REDIS_TIMEOUT=10000     # 10 seconds
   ```

2. **Network Optimization:**
   ```bash
   # Check network latency
   ping -c 10 database_host
   
   # Check for packet loss
   mtr database_host
   ```

3. **Connection Pool Tuning:**
   ```bash
   DATABASE_POOL_MIN=2
   DATABASE_POOL_MAX=20
   DATABASE_POOL_IDLE_TIMEOUT=30000
   ```

## Performance Issues

### Slow Query Performance

**Symptoms:**
- High response times in health checks
- Database operations taking too long

**Diagnosis:**
```sql
-- PostgreSQL: Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check active connections
SELECT * FROM pg_stat_activity;
```

**Solutions:**

1. **Query Optimization:**
   - Add appropriate indexes
   - Analyze query execution plans
   - Optimize WHERE clauses

2. **Connection Pool Optimization:**
   ```bash
   DATABASE_POOL_MIN=5
   DATABASE_POOL_MAX=25
   DATABASE_POOL_ACQUIRE_TIMEOUT=60000
   ```

### Connection Pool Exhaustion

**Symptoms:**
- "Pool exhausted" errors
- Long wait times for connections

**Common Errors:**
```
Database connection pool exhausted. Max: 10, Waiting: 15
```

**Solutions:**

1. **Increase Pool Size:**
   ```bash
   DATABASE_POOL_MAX=20  # Increase maximum connections
   ```

2. **Fix Connection Leaks:**
   - Ensure all connections are properly closed
   - Review application code for unclosed connections
   - Monitor connection usage patterns

3. **Optimize Connection Usage:**
   ```bash
   DATABASE_POOL_IDLE_TIMEOUT=30000  # Close idle connections
   DATABASE_POOL_REAP_INTERVAL=1000  # Check for idle connections
   ```

## Redis-Specific Issues

### Redis Memory Issues

**Symptoms:**
- Redis out of memory errors
- Performance degradation

**Diagnosis:**
```bash
# Check Redis memory usage
redis-cli INFO memory

# Check Redis configuration
redis-cli CONFIG GET maxmemory
redis-cli CONFIG GET maxmemory-policy
```

**Solutions:**

1. **Configure Memory Limits:**
   ```bash
   # Set maximum memory (e.g., 1GB)
   redis-cli CONFIG SET maxmemory 1073741824
   
   # Set eviction policy
   redis-cli CONFIG SET maxmemory-policy allkeys-lru
   ```

2. **Monitor Key Usage:**
   ```bash
   # Check key count
   redis-cli DBSIZE
   
   # Find large keys
   redis-cli --bigkeys
   ```

### Redis Persistence Issues

**Symptoms:**
- Data loss after Redis restart
- Performance issues during saves

**Solutions:**

1. **Configure Persistence:**
   ```bash
   # RDB snapshots
   redis-cli CONFIG SET save "900 1 300 10 60 10000"
   
   # AOF persistence
   redis-cli CONFIG SET appendonly yes
   redis-cli CONFIG SET appendfsync everysec
   ```

## Monitoring and Diagnostics

### Health Check Failures

**Symptoms:**
- Health check endpoints returning unhealthy status
- Monitoring alerts firing

**Diagnosis:**
```bash
# Check application health endpoint
curl http://localhost:3000/health

# Check logs for health check errors
docker logs your_app_container | grep "health"

# Manual connection test
npm run test:connections  # If available
```

**Solutions:**

1. **Review Health Check Configuration:**
   ```bash
   CONNECTION_MONITORING_ENABLED=true
   HEALTH_CHECK_TIMEOUT=10000
   HEALTH_CHECK_INTERVAL=30000
   ```

2. **Check Service Dependencies:**
   - Ensure database is accessible
   - Verify Redis connectivity
   - Check network connectivity

### Log Analysis

**Common Log Patterns:**

1. **Configuration Errors:**
   ```
   Configuration error for database: Missing required field
   Invalid database configuration for port: must be a number
   ```

2. **Connection Errors:**
   ```
   Failed to connect to database at localhost:5432
   Database connection timeout after 30000ms
   Redis connection failed: Connection refused
   ```

3. **Health Check Errors:**
   ```
   Database health check failed: Query timeout
   Redis health check failed: Operation timeout
   ```

**Log Analysis Commands:**
```bash
# Filter database-related logs
docker logs app_container 2>&1 | grep -i database

# Filter connection errors
docker logs app_container 2>&1 | grep -i "connection.*failed"

# Monitor real-time logs
docker logs -f app_container | grep -E "(error|warn|database|redis)"
```

## Environment-Specific Issues

### Development Environment

**Common Issues:**
- Docker containers not starting
- Port conflicts
- Volume mounting issues

**Solutions:**
```bash
# Restart Docker services
docker-compose down && docker-compose up -d

# Check port usage
netstat -tulpn | grep :5432
netstat -tulpn | grep :6379

# Reset Docker volumes
docker-compose down -v && docker-compose up -d
```

### Production Environment

**Common Issues:**
- SSL/TLS configuration
- Connection limits
- Performance under load

**Solutions:**

1. **SSL Configuration:**
   ```bash
   DATABASE_SSL=true
   DATABASE_SSL_REJECT_UNAUTHORIZED=false  # For self-signed certs
   ```

2. **Connection Limits:**
   ```bash
   # PostgreSQL: Check max_connections
   psql -c "SHOW max_connections;"
   
   # Adjust application pool accordingly
   DATABASE_POOL_MAX=50  # Should be less than max_connections
   ```

3. **Performance Monitoring:**
   ```bash
   # Enable detailed logging
   LOG_LEVEL=debug
   
   # Monitor connection metrics
   PROMETHEUS_ENABLED=true
   ```

### Staging Environment

**Common Issues:**
- Environment variable mismatches
- Database migration issues
- Cache inconsistencies

**Solutions:**
```bash
# Verify environment variables
env | grep -E "(DATABASE|REDIS)"

# Run database migrations
npm run migrate:latest

# Clear Redis cache
redis-cli FLUSHALL
```

## Quick Diagnostic Checklist

When experiencing connection issues, run through this checklist:

1. **Configuration:**
   - [ ] All required environment variables are set
   - [ ] Configuration values are valid (ports, timeouts, etc.)
   - [ ] Connection URLs are properly formatted

2. **Connectivity:**
   - [ ] Services are running and accessible
   - [ ] Network connectivity is working
   - [ ] Firewall rules allow connections

3. **Authentication:**
   - [ ] Credentials are correct
   - [ ] Users have proper permissions
   - [ ] Authentication methods are configured

4. **Performance:**
   - [ ] Connection pools are properly sized
   - [ ] Timeouts are appropriate
   - [ ] No connection leaks exist

5. **Monitoring:**
   - [ ] Health checks are passing
   - [ ] Logs show no errors
   - [ ] Metrics are within normal ranges

## Getting Help

If you're still experiencing issues after following this guide:

1. **Check Application Logs:**
   ```bash
   docker logs your_app_container --tail 100
   ```

2. **Run Diagnostic Commands:**
   ```bash
   # Test database connection
   npm run test:db-connection

   # Test Redis connection
   npm run test:redis-connection

   # Run full health check
   curl http://localhost:3000/health/detailed
   ```

3. **Collect System Information:**
   ```bash
   # System resources
   free -h
   df -h
   top

   # Network information
   netstat -tulpn
   ss -tulpn
   ```

4. **Contact Support:**
   - Include relevant log excerpts
   - Provide environment details
   - Describe steps to reproduce the issue