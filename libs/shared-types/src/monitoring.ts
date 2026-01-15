// Health Check Types
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
}

export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  responseTime: number;
  details?: Record<string, any>;
  error?: string;
}

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: Date;
  responseTime: number;
  version: string;
  environment: string;
  services: ServiceHealth[];
  uptime: number;
  error?: string;
}

// Metrics Types
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

export interface MetricData {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp: Date;
}

export interface PerformanceMetrics {
  apiResponseTime: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  databaseResponseTime: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  cacheResponseTime: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  eventLoopLag: number;
}

export interface SystemMetrics {
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  uptime: number;
}

export interface BusinessMetrics {
  totalRequests: number;
  totalUserActions: number;
  totalDbQueries: number;
  activeConnections: number;
}

// Logging Types
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  tenantId?: string;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  requestId?: string;
  userId?: string;
  tenantId?: string;
  category?: string;
  metadata?: Record<string, any>;
}

export interface StructuredLog extends LogEntry {
  service?: string;
  operation?: string;
  duration?: number;
  statusCode?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}