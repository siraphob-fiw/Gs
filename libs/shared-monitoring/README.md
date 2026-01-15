# @strengthos/shared-monitoring

Comprehensive monitoring and metrics library for StrengthOS applications, providing Prometheus metrics, performance monitoring, health checks, and application metrics.

## Features

### 🎯 **Prometheus Integration**
- Counter, Gauge, Histogram, and Summary metrics
- Custom metric registration
- Default system metrics collection
- Prometheus-compatible metrics endpoint

### 📊 **Performance Monitoring**
- High-resolution timing measurements
- Async and sync function measurement utilities
- Performance statistics and analytics
- Configurable metric retention

### 🏥 **Health Checking**
- Flexible health check registration system
- Built-in checks for database, HTTP endpoints, memory
- Parallel health check execution
- Configurable timeouts and intervals

### 📈 **Application Metrics**
- HTTP request/response metrics
- Database query performance tracking
- Cache operation monitoring
- System resource utilization
- User action tracking
- Error rate monitoring

### ⚙️ **Configuration Management**
- Environment-specific configurations
- Runtime configuration updates
- Configuration validation
- Environment variable integration

## Installation

```bash
npm install @strengthos/shared-monitoring
```

## Quick Start

### Basic Setup

```typescript
import { createMonitoringServices } from '@strengthos/shared-monitoring';
import { logger } from '@strengthos/shared-logging';

// Create all monitoring services
const result = createMonitoringServices(logger);
if (result.isOk) {
  const { 
    prometheusService, 
    performanceMonitor, 
    healthChecker, 
    applicationMetrics 
  } = result.returnValue;
}
```

### Express.js Integration

```typescript
import express from 'express';
import { 
  createWebServerMonitoringSetup,
  createExpressMonitoringMiddleware,
  createExpressErrorMonitoringMiddleware
} from '@strengthos/shared-monitoring';

const app = express();
const monitoring = createWebServerMonitoringSetup(logger);

if (monitoring.isOk) {
  const { applicationMetrics, performanceMonitor } = monitoring.returnValue;
  
  // Add monitoring middleware
  app.use(createExpressMonitoringMiddleware(applicationMetrics, performanceMonitor));
  app.use(createExpressErrorMonitoringMiddleware(applicationMetrics));
  
  // Metrics endpoint
  app.get('/metrics', async (req, res) => {
    const metrics = await prometheusService.getMetrics();
    if (metrics.isOk) {
      res.set('Content-Type', 'text/plain');
      res.send(metrics.returnValue);
    }
  });
}
```

## Core Services

### PrometheusService

```typescript
import { createPrometheusService } from '@strengthos/shared-monitoring';

const prometheus = createPrometheusService(logger);

// Counter metrics
prometheus.incrementCounter('http_requests_total', { 
  method: 'GET', 
  status: '200' 
});

// Gauge metrics
prometheus.setGauge('active_connections', 42);

// Histogram metrics
prometheus.observeHistogram('request_duration_seconds', 0.123);

// Custom metrics
prometheus.registerCustomMetric(
  'custom_metric',
  'Description of custom metric',
  'counter',
  ['label1', 'label2']
);
```

### Performance Monitor

```typescript
import { createPerformanceMonitor } from '@strengthos/shared-monitoring';

const perfMonitor = createPerformanceMonitor(logger);

// Manual timing
const timerId = perfMonitor.startTimer('database_query');
// ... perform operation
const result = perfMonitor.endTimer(timerId);

// Async function measurement
const asyncResult = await perfMonitor.measureAsync(
  'api_call',
  async () => {
    return await fetch('/api/data');
  }
);

// Sync function measurement
const syncResult = perfMonitor.measureSync(
  'calculation',
  () => {
    return complexCalculation();
  }
);

// Get performance statistics
const stats = perfMonitor.getStatistics('database_query');
```

### Health Checker

```typescript
import { createHealthChecker, HealthChecker } from '@strengthos/shared-monitoring';

const healthChecker = createHealthChecker(logger);

// Register built-in checks
healthChecker.registerCheck('memory', HealthChecker.createMemoryCheck('memory'));
healthChecker.registerCheck('database', HealthChecker.createDatabaseCheck('db', testQuery));
healthChecker.registerCheck('api', HealthChecker.createHttpCheck('external-api', 'https://api.example.com/health'));

// Custom health check
healthChecker.registerCheck('custom', async () => {
  return {
    service: 'custom',
    status: 'healthy',
    message: 'All systems operational',
    timestamp: new Date()
  };
});

// Run health checks
const healthStatus = await healthChecker.getHealthStatus();
```

### Application Metrics

```typescript
import { createApplicationMetrics } from '@strengthos/shared-monitoring';

const appMetrics = createApplicationMetrics(logger, prometheusService);

// Record HTTP requests
appMetrics.recordRequest('GET', '/api/users', 200, 150);

// Record errors
appMetrics.recordError(new Error('Database connection failed'), {
  context: 'user_service',
  operation: 'fetch_users'
});

// Record user actions
appMetrics.recordUserAction('login', 'user123', { source: 'web' });

// Record database queries
appMetrics.recordDatabaseQuery('SELECT * FROM users', 45, true);

// Record cache operations
appMetrics.recordCacheOperation('hit', 'user:123');

// Get system metrics
const systemMetrics = await appMetrics.getSystemMetrics();
```

## Configuration

### Environment-Based Configuration

```typescript
import { 
  createMonitoringConfigManager,
  DEFAULT_MONITORING_CONFIG,
  PRODUCTION_MONITORING_CONFIG
} from '@strengthos/shared-monitoring';

const configManager = createMonitoringConfigManager();

// Load from environment variables
configManager.loadFromEnvironment();

// Update configuration
configManager.updateConfig({
  prometheus: {
    enabled: true,
    port: 9090
  },
  alerts: {
    thresholds: {
      cpu: 80,
      memory: 85
    }
  }
});

// Listen for config changes
const unsubscribe = configManager.onConfigChange((newConfig) => {
  console.log('Configuration updated:', newConfig);
});
```

### Environment Variables

```bash
# Prometheus configuration
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
PROMETHEUS_PATH=/metrics

# Health check configuration
HEALTH_CHECKS_ENABLED=true
HEALTH_CHECK_INTERVAL=30000

# Performance monitoring
PERFORMANCE_ENABLED=true
PERFORMANCE_SAMPLE_RATE=0.1

# Alert thresholds
ALERT_CPU_THRESHOLD=80
ALERT_MEMORY_THRESHOLD=85
```

## Utility Functions

### Metric Utilities

```typescript
import { MetricUtils } from '@strengthos/shared-monitoring';

// Calculate percentiles
const percentiles = MetricUtils.calculatePercentiles([1, 2, 3, 4, 5]);

// Detect anomalies
const { anomalies, indices } = MetricUtils.detectAnomalies(values, 2);

// Generate summary statistics
const summary = MetricUtils.generateSummary(values);

// Format durations and bytes
const formattedDuration = MetricUtils.formatDuration(1500); // "1.50s"
const formattedBytes = MetricUtils.formatBytes(1048576); // "1.00 MB"

// Aggregate metrics by time buckets
const aggregated = MetricUtils.aggregateByTimeBuckets(
  performanceMetrics,
  60000, // 1 minute buckets
  'avg'
);
```

## Pre-configured Setups

### Basic Monitoring

```typescript
import { createBasicMonitoringSetup } from '@strengthos/shared-monitoring';

const basic = createBasicMonitoringSetup(logger);
```

### Database Monitoring

```typescript
import { createDatabaseMonitoringSetup } from '@strengthos/shared-monitoring';

const dbMonitoring = createDatabaseMonitoringSetup(
  logger,
  () => db.query('SELECT 1'),
  'postgres'
);
```

### Microservice Monitoring

```typescript
import { createMicroserviceMonitoringSetup } from '@strengthos/shared-monitoring';

const microserviceMonitoring = createMicroserviceMonitoringSetup(
  logger,
  'user-service',
  [
    { name: 'auth-service', healthCheckUrl: 'http://auth-service/health' },
    { name: 'notification-service', healthCheckUrl: 'http://notification-service/health' }
  ]
);
```

## Integration Examples

### With Express.js

```typescript
import express from 'express';
import { createWebServerMonitoringSetup } from '@strengthos/shared-monitoring';

const app = express();
const monitoring = createWebServerMonitoringSetup(logger);

if (monitoring.isOk) {
  const { prometheusService, healthChecker } = monitoring.returnValue;
  
  // Health check endpoint
  app.get('/health', async (req, res) => {
    const health = await healthChecker.getHealthStatus();
    if (health.isOk) {
      const { status, checks } = health.returnValue;
      res.status(status === 'healthy' ? 200 : 503).json({ status, checks });
    }
  });
  
  // Metrics endpoint
  app.get('/metrics', async (req, res) => {
    const metrics = await prometheusService.getMetrics();
    if (metrics.isOk) {
      res.set('Content-Type', 'text/plain');
      res.send(metrics.returnValue);
    }
  });
}
```

### With Database Services

```typescript
import { createDatabaseMonitoringSetup } from '@strengthos/shared-monitoring';

class UserService {
  constructor(
    private db: Database,
    private monitoring: ReturnType<typeof createDatabaseMonitoringSetup>['returnValue']
  ) {}

  async getUser(id: string) {
    const { performanceMonitor, applicationMetrics } = this.monitoring;
    
    const result = await performanceMonitor.measureAsync(
      'get_user',
      async () => {
        const query = 'SELECT * FROM users WHERE id = $1';
        const startTime = Date.now();
        
        try {
          const result = await this.db.query(query, [id]);
          const duration = Date.now() - startTime;
          
          applicationMetrics.recordDatabaseQuery(query, duration, true);
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          applicationMetrics.recordDatabaseQuery(query, duration, false);
          throw error;
        }
      }
    );
    
    return result;
  }
}
```

## Best Practices

### 1. **Metric Naming**
- Use descriptive, consistent naming conventions
- Include units in metric names (e.g., `_seconds`, `_bytes`)
- Use labels for dimensions, not metric names

### 2. **Performance Monitoring**
- Sample high-frequency operations in production
- Set appropriate slow operation thresholds
- Clean up old metrics to prevent memory leaks

### 3. **Health Checks**
- Keep health checks lightweight and fast
- Test actual dependencies, not just connectivity
- Use appropriate timeouts for different check types

### 4. **Configuration**
- Use environment-specific configurations
- Validate configuration changes
- Monitor configuration changes in production

### 5. **Error Handling**
- Always use the Results pattern for error handling
- Log monitoring failures appropriately
- Provide fallback behavior when monitoring fails

## Dependencies

- `@strengthos/shared-types` - Shared type definitions
- `@strengthos/shared-utils` - Results pattern and utilities
- `@strengthos/shared-logging` - Logging infrastructure
- `prom-client` - Prometheus metrics client

## License

MIT - See LICENSE file for details.