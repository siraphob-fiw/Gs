import { describe, it, expect } from 'vitest';
import { DEFAULT_MONITORING_CONFIG } from '../monitoring-config';

describe('MonitoringConfig', () => {
  describe('DEFAULT_MONITORING_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_MONITORING_CONFIG).toEqual({
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
      });
    });

    it('should have valid configuration structure', () => {
      expect(DEFAULT_MONITORING_CONFIG.prometheus.enabled).toBe(true);
      expect(DEFAULT_MONITORING_CONFIG.healthChecks.enabled).toBe(true);
      expect(DEFAULT_MONITORING_CONFIG.performance.enabled).toBe(true);
      expect(DEFAULT_MONITORING_CONFIG.alerts.enabled).toBe(true);
    });

    it('should have reasonable default values', () => {
      expect(DEFAULT_MONITORING_CONFIG.prometheus.port).toBe(9090);
      expect(DEFAULT_MONITORING_CONFIG.healthChecks.interval).toBe(30000);
      expect(DEFAULT_MONITORING_CONFIG.performance.sampleRate).toBe(1.0);
      expect(DEFAULT_MONITORING_CONFIG.alerts.thresholds.cpu).toBe(80);
    });
  });
});
