import { describe, it, expect } from 'vitest';
import { 
  MetricValue,
  PerformanceMetric,
  HealthCheckResult,
  MonitoringConfig
} from '../monitoring-types';

describe('MonitoringTypes', () => {
  describe('Type Definitions', () => {
    it('should allow valid MetricValue objects', () => {
      const metric: MetricValue = {
        value: 42,
        timestamp: new Date(),
        labels: {
          method: 'GET',
          status: '200'
        }
      };

      expect(metric.value).toBe(42);
      expect(metric.timestamp).toBeInstanceOf(Date);
      expect(metric.labels?.method).toBe('GET');
    });

    it('should allow valid PerformanceMetric objects', () => {
      const startTime = new Date('2024-01-01T00:00:00Z');
      const endTime = new Date('2024-01-01T00:00:01Z');
      
      const metric: PerformanceMetric = {
        name: 'http_request_duration',
        duration: 1000,
        startTime,
        endTime,
        metadata: {
          method: 'GET',
          endpoint: '/api/users'
        }
      };

      expect(metric.name).toBe('http_request_duration');
      expect(metric.duration).toBe(1000);
      expect(metric.startTime).toBe(startTime);
      expect(metric.endTime).toBe(endTime);
      expect(metric.metadata?.method).toBe('GET');
    });

    it('should allow valid HealthCheckResult objects', () => {
      const healthCheck: HealthCheckResult = {
        service: 'database',
        status: 'healthy',
        message: 'Connection successful',
        timestamp: new Date(),
        responseTime: 45,
        metadata: {
          connection: 'active',
          poolSize: 10
        }
      };

      expect(healthCheck.service).toBe('database');
      expect(healthCheck.status).toBe('healthy');
      expect(healthCheck.message).toBe('Connection successful');
      expect(healthCheck.responseTime).toBe(45);
      expect(healthCheck.metadata?.connection).toBe('active');
    });

    it('should allow valid MonitoringConfig objects', () => {
      const config: MonitoringConfig = {
        prometheus: {
          enabled: true,
          port: 9090,
          path: '/metrics',
          collectDefaultMetrics: true
        },
        healthChecks: {
          enabled: true,
          interval: 30000,
          timeout: 5000
        },
        performance: {
          enabled: true,
          sampleRate: 1.0,
          slowThreshold: 1000
        },
        alerts: {
          enabled: true,
          thresholds: {
            cpu: 80,
            memory: 85,
            disk: 90,
            responseTime: 5000
          }
        }
      };

      expect(config.prometheus.enabled).toBe(true);
      expect(config.healthChecks.interval).toBe(30000);
      expect(config.performance.sampleRate).toBe(1.0);
      expect(config.alerts.thresholds.cpu).toBe(80);
    });
  });

  describe('Optional Properties', () => {
    it('should allow minimal MetricValue objects', () => {
      const metric: MetricValue = {
        value: 1,
        timestamp: new Date()
      };

      expect(metric.value).toBe(1);
      expect(metric.timestamp).toBeInstanceOf(Date);
      expect(metric.labels).toBeUndefined();
    });

    it('should allow PerformanceMetric without metadata', () => {
      const startTime = new Date();
      const endTime = new Date();
      
      const metric: PerformanceMetric = {
        name: 'simple_operation',
        duration: 100,
        startTime,
        endTime
      };

      expect(metric.name).toBe('simple_operation');
      expect(metric.duration).toBe(100);
      expect(metric.metadata).toBeUndefined();
    });

    it('should allow HealthCheckResult without optional fields', () => {
      const healthCheck: HealthCheckResult = {
        service: 'simple_check',
        status: 'healthy',
        timestamp: new Date()
      };

      expect(healthCheck.service).toBe('simple_check');
      expect(healthCheck.status).toBe('healthy');
      expect(healthCheck.message).toBeUndefined();
      expect(healthCheck.responseTime).toBeUndefined();
      expect(healthCheck.metadata).toBeUndefined();
    });
  });

  describe('Health Status Values', () => {
    it('should accept valid health status strings', () => {
      const validStatuses: Array<'healthy' | 'unhealthy' | 'degraded'> = [
        'healthy',
        'unhealthy', 
        'degraded'
      ];

      validStatuses.forEach(status => {
        const healthCheck: HealthCheckResult = {
          service: 'test',
          status,
          timestamp: new Date()
        };
        expect(healthCheck.status).toBe(status);
      });
    });
  });
});
