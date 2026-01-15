# @strengthos/shared-cache

Comprehensive caching services for StrengthOS applications, providing Redis, in-memory, and priority-based caching solutions.

## Features

### Core Caching Services
- **Redis Cache Service**: Distributed caching with Redis/ioredis
- **Session Cache Service**: In-memory session management with NodeCache
- **Priority Cache**: Priority-based cache eviction system
- **LRU Cache Manager**: Least Recently Used cache implementation

### Advanced Features
- **Cache Configuration Service**: Environment-based configuration management
- **Cache Invalidation Service**: Event-driven cache invalidation
- **Performance Monitoring**: Built-in metrics and monitoring
- **Multi-tenant Support**: Tenant-aware caching strategies

## Installation

```bash
npm install @strengthos/shared-cache
```

## Quick Start

### Redis Cache Service

```typescript
import { createRedisCacheService, DEFAULT_REDIS_CONFIG } from '@strengthos/shared-cache';
import { createLogger } from '@strengthos/shared-logging';

const logger = createLogger(logService);
const config = {
  ...DEFAULT_REDIS_CONFIG,
  host: 'localhost',
  port: 6379,
  keyPrefix: 'myapp:'
};

const redisCache = createRedisCacheService(logger, config);

// Session management
const sessionResult = await redisCache.setSession('session123', userSession, 1800);
const session = await redisCache.getSession('session123');

// Tenant-aware caching
await redisCache.setTenantData('tenant1', 'user_profile', profileData, 3600);
const profile = await redisCache.getTenantData('tenant1', 'user_profile');
```

### Session Cache Service

```typescript
import { createSessionCacheService } from '@strengthos/shared-cache';

const sessionCache = createSessionCacheService(logger);

// Session operations
await sessionCache.setSession('session123', userSession);
const session = await sessionCache.getSession('session123');

// Permission caching
await sessionCache.setUserPermissions('user123', ['read', 'write']);
const permissions = await sessionCache.getUserPermissions('user123');
```

### Priority Cache

```typescript
import { createLruCacheManager } from '@strengthos/shared-cache';

const lruCache = createLruCacheManager();

// Cache items with priority
const cacheItem = { priority: 10, data: 'important data' };
lruCache.set('key1', cacheItem, 3600);

const result = lruCache.get('key1');
if (result.isOk) {
  console.log('Cached data:', result.returnValue);
}
```

## Configuration

### Redis Configuration

```typescript
import { ICacheConfiguration } from '@strengthos/shared-cache';

const config: ICacheConfiguration = {
  redis: {
    enabled: true,
    host: 'localhost',
    port: 6379,
    password: 'your-password',
    db: 0,
    keyPrefix: 'strengthos:',
    defaultTTL: 600,
    maxRetries: 3,
    connectionTimeout: 5000,
    commandTimeout: 3000
  },
  nodeCache: {
    enabled: true,
    sessionTTL: 1800,
    permissionTTL: 900,
    tenantTTL: 3600,
    maxKeys: 10000
  },
  performance: {
    enableMetrics: true,
    slowQueryThreshold: 1000,
    lowHitRateThreshold: 0.7
  },
  monitoring: {
    enabled: true,
    interval: 30000,
    enableReporting: true
  }
};
```

### Environment Variables

```bash
# Redis Configuration
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
REDIS_KEY_PREFIX=strengthos:
REDIS_DEFAULT_TTL=600

# Performance Settings
CACHE_ENABLE_METRICS=true
CACHE_SLOW_QUERY_THRESHOLD=1000
CACHE_LOW_HIT_RATE_THRESHOLD=0.7

# Monitoring
CACHE_MONITORING_ENABLED=true
CACHE_MONITORING_INTERVAL=30000
```

## Cache Invalidation

### Event-Driven Invalidation

```typescript
import { 
  createCacheInvalidationService, 
  InvalidationEventType 
} from '@strengthos/shared-cache';

const invalidationService = createCacheInvalidationService(
  redisCache, 
  sessionCache, 
  logger
);

// Queue invalidation events
await invalidationService.queueInvalidation({
  type: InvalidationEventType.USER_UPDATED,
  entityType: 'user',
  entityId: 'user123',
  tenantId: 'tenant1',
  timestamp: new Date()
});

// Direct invalidation
await invalidationService.invalidateUserData('user123');
await invalidationService.invalidateTenantData('tenant1');
```

### Invalidation Strategies

```typescript
// User data invalidation
await invalidationService.invalidateUserData('user123');

// Tenant-wide invalidation
await invalidationService.invalidateTenantData('tenant1');

// Permission invalidation
await invalidationService.invalidatePermissions('user123');

// Session invalidation
await invalidationService.invalidateSession('session123');
await invalidationService.invalidateUserSessions('user123');
```

## Performance Monitoring

### Cache Metrics

```typescript
// Redis cache metrics
const metricsResult = await redisCache.getMetrics();
if (metricsResult.isOk) {
  const metrics = metricsResult.returnValue;
  console.log('Cache hits:', metrics.hits);
  console.log('Cache misses:', metrics.misses);
  console.log('Memory usage:', metrics.memoryUsage);
  console.log('Average response time:', metrics.avgResponseTime);
}

// Session cache statistics
const statsResult = sessionCache.getCacheStats();
if (statsResult.isOk) {
  const stats = statsResult.returnValue;
  console.log('Session cache:', stats.sessions);
  console.log('Permission cache:', stats.permissions);
  console.log('Tenant cache:', stats.tenants);
}
```

### Performance Timers

```typescript
// Manual performance tracking
const timerId = redisCache.startPerformanceTimer('custom_operation');
// ... perform operation
const duration = redisCache.endPerformanceTimer(timerId);
console.log(`Operation took ${duration}ms`);
```

## Multi-Tenant Support

### Tenant-Aware Caching

```typescript
// Set tenant-specific data
await redisCache.setTenantData('tenant1', 'user_profiles', profilesData);
await redisCache.setTenantData('tenant1', 'settings', settingsData);

// Get tenant-specific data
const profiles = await redisCache.getTenantData('tenant1', 'user_profiles');
const settings = await redisCache.getTenantData('tenant1', 'settings');

// Invalidate all tenant data
const deletedCount = await redisCache.invalidateTenantCache('tenant1');
```

### Tenant Context Management

```typescript
// Set user's tenant context
await redisCache.setTenantContext('user123', 'tenant1', 3600);

// Get user's current tenant
const tenantResult = await redisCache.getTenantContext('user123');
if (tenantResult.isOk && tenantResult.returnValue) {
  console.log('User tenant:', tenantResult.returnValue);
}
```

## Error Handling

All cache operations return `Results<T>` objects for consistent error handling:

```typescript
const result = await redisCache.getSession('session123');

if (result.isOk) {
  const session = result.returnValue;
  // Handle successful result
} else {
  console.error('Cache operation failed:', result.message);
  // Handle error case
}
```

## Health Checks

```typescript
// Redis health check
const healthResult = await redisCache.healthCheck();
if (healthResult.isOk && healthResult.returnValue) {
  console.log('Redis is healthy');
} else {
  console.log('Redis health check failed');
}

// Invalidation service status
const queueStatus = invalidationService.getQueueStatus();
if (queueStatus.isOk) {
  console.log('Queue length:', queueStatus.returnValue.queueLength);
  console.log('Processing:', queueStatus.returnValue.isProcessing);
}
```

## Best Practices

### 1. TTL Management
```typescript
// Use appropriate TTLs for different data types
await redisCache.setSession(sessionId, session, 1800);      // 30 minutes
await redisCache.setUserPermissions(userId, permissions, 900); // 15 minutes
await redisCache.setTenantContext(userId, tenantId, 3600);     // 1 hour
```

### 2. Error Handling
```typescript
// Always check Results objects
const result = await cacheService.getData(key);
if (!result.isOk) {
  logger.error({ 
    message: 'Cache operation failed', 
    fullMessage: result.message 
  });
  // Fallback to database or default value
}
```

### 3. Cache Warming
```typescript
// Pre-populate frequently accessed data
await invalidationService.warmCache('tenant1', 'user123');
```

### 4. Monitoring
```typescript
// Regular metrics collection
setInterval(async () => {
  const metrics = await redisCache.getMetrics();
  if (metrics.isOk) {
    // Send metrics to monitoring system
    monitoringService.recordMetrics(metrics.returnValue);
  }
}, 60000); // Every minute
```

## Configuration Management

### Dynamic Configuration Updates

```typescript
import { createCacheConfigurationService } from '@strengthos/shared-cache';

const configService = createCacheConfigurationService(logger);

// Update configuration
await configService.updateConfiguration({
  redis: {
    maxRetries: 5,
    connectionTimeout: 10000
  }
});

// Environment-specific configurations
const prodConfig = configService.getProductionConfiguration();
const devConfig = configService.getDevelopmentConfiguration();
const testConfig = configService.getTestConfiguration();
```

### Configuration Listeners

```typescript
// Listen for configuration changes
configService.addConfigurationListener((newConfig) => {
  console.log('Configuration updated:', newConfig);
  // Reinitialize services with new config
});
```

## Testing

### Test Configuration

```typescript
// Use test-specific configuration
const testConfig = configService.getTestConfiguration();
// Redis disabled, uses in-memory cache for tests
```

### Mock Services

```typescript
// Create mock cache services for unit tests
const mockRedisCache = {
  getSession: jest.fn().mockResolvedValue(Results.ok(mockSession)),
  setSession: jest.fn().mockResolvedValue(Results.ok(true))
};
```

## Migration from Legacy Systems

### From Direct Redis Usage

```typescript
// Before (direct Redis)
await redis.setex(`session:${sessionId}`, 1800, JSON.stringify(session));
const sessionData = await redis.get(`session:${sessionId}`);

// After (shared-cache)
await redisCache.setSession(sessionId, session, 1800);
const sessionResult = await redisCache.getSession(sessionId);
```

### From NodeCache Usage

```typescript
// Before (direct NodeCache)
cache.set(key, value, ttl);
const value = cache.get(key);

// After (shared-cache)
const setResult = await sessionCache.setSession(key, value, ttl);
const getResult = await sessionCache.getSession(key);
```

## API Reference

### Redis Cache Service
- `setSession(sessionId, session, ttl?)`: Store user session
- `getSession(sessionId)`: Retrieve user session
- `deleteSession(sessionId)`: Remove user session
- `setUserPermissions(userId, permissions, ttl?)`: Cache user permissions
- `getUserPermissions(userId)`: Get cached permissions
- `setTenantData<T>(tenantId, key, data, ttl?)`: Store tenant-specific data
- `getTenantData<T>(tenantId, key)`: Retrieve tenant-specific data
- `invalidateTenantCache(tenantId)`: Clear all tenant data
- `getMetrics()`: Get cache performance metrics
- `healthCheck()`: Check Redis connectivity

### Session Cache Service
- `setSession(sessionId, session, ttl?)`: Store session in memory
- `getSession(sessionId)`: Retrieve session from memory
- `deleteUserSessions(userId)`: Remove all user sessions
- `setUserPermissions(userId, permissions, ttl?)`: Cache permissions
- `setTenantContext(userId, tenantId, ttl?)`: Set user's tenant context
- `getCacheStats()`: Get cache statistics
- `flushAllCaches()`: Clear all caches

### Cache Invalidation Service
- `invalidateUserData(userId)`: Invalidate all user-related cache
- `invalidateTenantData(tenantId)`: Invalidate tenant cache
- `invalidatePermissions(userId)`: Invalidate user permissions
- `queueInvalidation(event)`: Queue invalidation event
- `warmCache(tenantId, userId?)`: Pre-populate cache
- `getQueueStatus()`: Get invalidation queue status

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Review existing issues and discussions