import { Results } from '@strengthos/shared-utils';

// Metric Types
export interface MetricValue {
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  startTime: Date;
  endTime: Date;
  metadata?: Record<string, any>;
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  timestamp: Date;
  responseTime?: number;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network?: {
    bytesIn: number;
    bytesOut: number;
  };
}

// Configuration Types
export interface MonitoringConfig {
  prometheus: {
    enabled: boolean;
    port: number;
    path: string;
    collectDefaultMetrics: boolean;
  };
  healthChecks: {
    enabled: boolean;
    interval: number;
    timeout: number;
  };
  performance: {
    enabled: boolean;
    sampleRate: number;
    slowThreshold: number;
  };
  alerts: {
    enabled: boolean;
    thresholds: {
      cpu: number;
      memory: number;
      disk: number;
      responseTime: number;
    };
  };
}

// Service Interfaces
export interface IPrometheusService {
  incrementCounter(name: string, labels?: Record<string, string>): Results<void>;
  setGauge(name: string, value: number, labels?: Record<string, string>): Results<void>;
  observeHistogram(name: string, value: number, labels?: Record<string, string>): Results<void>;
  recordSummary(name: string, value: number, labels?: Record<string, string>): Results<void>;
  getMetrics(): Promise<Results<string>>;
  registerCustomMetric(name: string, help: string, type: 'counter' | 'gauge' | 'histogram' | 'summary', labelNames?: string[]): Results<void>;
}

export interface IPerformanceMonitor {
  startTimer(name: string, metadata?: Record<string, any>): string;
  endTimer(timerId: string): Results<PerformanceMetric>;
  recordMetric(metric: PerformanceMetric): Results<void>;
  getMetrics(filter?: { name?: string; startTime?: Date; endTime?: Date }): Results<PerformanceMetric[]>;
  clearMetrics(): Results<void>;
}

export interface IHealthChecker {
  registerCheck(name: string, checkFunction: () => Promise<HealthCheckResult>): Results<void>;
  runCheck(name: string): Promise<Results<HealthCheckResult>>;
  runAllChecks(): Promise<Results<HealthCheckResult[]>>;
  getHealthStatus(): Promise<Results<{ status: 'healthy' | 'unhealthy' | 'degraded'; checks: HealthCheckResult[] }>>;
  removeCheck(name: string): Results<void>;
}

export interface IApplicationMetrics {
  recordRequest(method: string, path: string, statusCode: number, duration: number): Results<void>;
  recordError(error: Error, context?: Record<string, any>): Results<void>;
  recordUserAction(action: string, userId?: string, metadata?: Record<string, any>): Results<void>;
  recordDatabaseQuery(query: string, duration: number, success: boolean): Results<void>;
  recordCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, duration?: number): Results<void>;
  getSystemMetrics(): Promise<Results<SystemMetrics>>;
}

// Event Types
export interface MetricEvent {
  type: 'counter' | 'gauge' | 'histogram' | 'summary' | 'performance' | 'health' | 'error';
  name: string;
  value?: number;
  labels?: Record<string, string>;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface AlertEvent {
  type: 'cpu' | 'memory' | 'disk' | 'response_time' | 'error_rate' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}