import { Results } from '@strengthos/shared-utils';
import { MonitoringConfig } from '../types/monitoring-types';

export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  prometheus: {
    enabled: true,
    port: 9090,
    path: '/metrics',
    collectDefaultMetrics: true
  },
  healthChecks: {
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 5000    // 5 seconds
  },
  performance: {
    enabled: true,
    sampleRate: 1.0,     // 100% sampling
    slowThreshold: 1000   // 1 second
  },
  alerts: {
    enabled: true,
    thresholds: {
      cpu: 80,        // 80%
      memory: 85,     // 85%
      disk: 90,       // 90%
      responseTime: 5000 // 5 seconds
    }
  }
};

export const DEVELOPMENT_MONITORING_CONFIG: MonitoringConfig = {
  ...DEFAULT_MONITORING_CONFIG,
  prometheus: {
    ...DEFAULT_MONITORING_CONFIG.prometheus,
    port: 9091
  },
  performance: {
    ...DEFAULT_MONITORING_CONFIG.performance,
    sampleRate: 0.1 // 10% sampling in development
  },
  alerts: {
    ...DEFAULT_MONITORING_CONFIG.alerts,
    enabled: false // Disable alerts in development
  }
};

export const PRODUCTION_MONITORING_CONFIG: MonitoringConfig = {
  ...DEFAULT_MONITORING_CONFIG,
  performance: {
    ...DEFAULT_MONITORING_CONFIG.performance,
    sampleRate: 0.01 // 1% sampling in production
  },
  alerts: {
    ...DEFAULT_MONITORING_CONFIG.alerts,
    thresholds: {
      cpu: 70,        // More aggressive in production
      memory: 80,
      disk: 85,
      responseTime: 3000
    }
  }
};

export const TEST_MONITORING_CONFIG: MonitoringConfig = {
  ...DEFAULT_MONITORING_CONFIG,
  prometheus: {
    ...DEFAULT_MONITORING_CONFIG.prometheus,
    enabled: false // Disable Prometheus in tests
  },
  healthChecks: {
    ...DEFAULT_MONITORING_CONFIG.healthChecks,
    enabled: false // Disable health checks in tests
  },
  alerts: {
    ...DEFAULT_MONITORING_CONFIG.alerts,
    enabled: false // Disable alerts in tests
  }
};

export class MonitoringConfigManager {
  private config: MonitoringConfig;
  private listeners: Array<(config: MonitoringConfig) => void> = [];

  constructor(initialConfig?: MonitoringConfig) {
    this.config = initialConfig || this.getEnvironmentConfig();
  }

  private getEnvironmentConfig(): MonitoringConfig {
    const env = process.env.NODE_ENV || 'development';
    
    switch (env) {
      case 'production':
        return PRODUCTION_MONITORING_CONFIG;
      case 'test':
        return TEST_MONITORING_CONFIG;
      case 'development':
      default:
        return DEVELOPMENT_MONITORING_CONFIG;
    }
  }

  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<MonitoringConfig>): Results<void> {
    try {
      const newConfig = this.mergeConfig(this.config, updates);
      const validationResult = this.validateConfig(newConfig);
      
      if (!validationResult.isOk) {
        return validationResult;
      }

      this.config = newConfig;
      this.notifyListeners();
      
      return Results.ok();
    } catch (error) {
      return Results.fail(`Failed to update monitoring config: ${error}`) as Results<void>;
    }
  }

  private mergeConfig(base: MonitoringConfig, updates: Partial<MonitoringConfig>): MonitoringConfig {
    return {
      prometheus: { ...base.prometheus, ...updates.prometheus },
      healthChecks: { ...base.healthChecks, ...updates.healthChecks },
      performance: { ...base.performance, ...updates.performance },
      alerts: { 
        ...base.alerts, 
        ...updates.alerts,
        thresholds: { ...base.alerts.thresholds, ...updates.alerts?.thresholds }
      }
    };
  }

  private validateConfig(config: MonitoringConfig): Results<void> {
    try {
      // Validate Prometheus config
      if (config.prometheus.enabled) {
        if (config.prometheus.port < 1 || config.prometheus.port > 65535) {
          return Results.fail('Prometheus port must be between 1 and 65535') as Results<void>;
        }
        if (!config.prometheus.path.startsWith('/')) {
          return Results.fail('Prometheus path must start with /') as Results<void>;
        }
      }

      // Validate health check config
      if (config.healthChecks.enabled) {
        if (config.healthChecks.interval < 1000) {
          return Results.fail('Health check interval must be at least 1000ms') as Results<void>;
        }
        if (config.healthChecks.timeout < 100) {
          return Results.fail('Health check timeout must be at least 100ms') as Results<void>;
        }
        if (config.healthChecks.timeout >= config.healthChecks.interval) {
          return Results.fail('Health check timeout must be less than interval') as Results<void>;
        }
      }

      // Validate performance config
      if (config.performance.enabled) {
        if (config.performance.sampleRate < 0 || config.performance.sampleRate > 1) {
          return Results.fail('Performance sample rate must be between 0 and 1') as Results<void>;
        }
        if (config.performance.slowThreshold < 0) {
          return Results.fail('Performance slow threshold must be non-negative') as Results<void>;
        }
      }

      // Validate alert thresholds
      if (config.alerts.enabled) {
        const { thresholds } = config.alerts;
        if (thresholds.cpu < 0 || thresholds.cpu > 100) {
          return Results.fail('CPU threshold must be between 0 and 100') as Results<void>;
        }
        if (thresholds.memory < 0 || thresholds.memory > 100) {
          return Results.fail('Memory threshold must be between 0 and 100') as Results<void>;
        }
        if (thresholds.disk < 0 || thresholds.disk > 100) {
          return Results.fail('Disk threshold must be between 0 and 100') as Results<void>;
        }
        if (thresholds.responseTime < 0) {
          return Results.fail('Response time threshold must be non-negative') as Results<void>;
        }
      }

      return Results.ok();
    } catch (error) {
      return Results.fail(`Config validation failed: ${error}`) as Results<void>;
    }
  }

  onConfigChange(listener: (config: MonitoringConfig) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.getConfig());
      } catch (error) {
        console.error('Error in config change listener:', error);
      }
    }
  }

  loadFromEnvironment(): Results<void> {
    try {
      const updates: Partial<MonitoringConfig> = {};

      // Load Prometheus config from environment
      if (process.env.PROMETHEUS_ENABLED !== undefined) {
        updates.prometheus = {
          ...this.config.prometheus,
          enabled: process.env.PROMETHEUS_ENABLED === 'true'
        };
      }
      if (process.env.PROMETHEUS_PORT) {
        updates.prometheus = {
          ...updates.prometheus || this.config.prometheus,
          port: parseInt(process.env.PROMETHEUS_PORT, 10)
        };
      }
      if (process.env.PROMETHEUS_PATH) {
        updates.prometheus = {
          ...updates.prometheus || this.config.prometheus,
          path: process.env.PROMETHEUS_PATH
        };
      }

      // Load health check config from environment
      if (process.env.HEALTH_CHECKS_ENABLED !== undefined) {
        updates.healthChecks = {
          ...this.config.healthChecks,
          enabled: process.env.HEALTH_CHECKS_ENABLED === 'true'
        };
      }
      if (process.env.HEALTH_CHECK_INTERVAL) {
        updates.healthChecks = {
          ...updates.healthChecks || this.config.healthChecks,
          interval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10)
        };
      }

      // Load performance config from environment
      if (process.env.PERFORMANCE_ENABLED !== undefined) {
        updates.performance = {
          ...this.config.performance,
          enabled: process.env.PERFORMANCE_ENABLED === 'true'
        };
      }
      if (process.env.PERFORMANCE_SAMPLE_RATE) {
        updates.performance = {
          ...updates.performance || this.config.performance,
          sampleRate: parseFloat(process.env.PERFORMANCE_SAMPLE_RATE)
        };
      }

      // Load alert thresholds from environment
      if (process.env.ALERT_CPU_THRESHOLD) {
        updates.alerts = {
          ...this.config.alerts,
          thresholds: {
            ...this.config.alerts.thresholds,
            cpu: parseInt(process.env.ALERT_CPU_THRESHOLD, 10)
          }
        };
      }

      if (Object.keys(updates).length > 0) {
        return this.updateConfig(updates);
      }

      return Results.ok();
    } catch (error) {
      return Results.fail(`Failed to load config from environment: ${error}`) as Results<void>;
    }
  }

  exportConfig(): Results<string> {
    try {
      return Results.ok(JSON.stringify(this.config, null, 2));
    } catch (error) {
      return Results.fail(`Failed to export config: ${error}`);
    }
  }

  importConfig(configJson: string): Results<void> {
    try {
      const config = JSON.parse(configJson) as MonitoringConfig;
      return this.updateConfig(config);
    } catch (error) {
      return Results.fail(`Failed to import config: ${error}`) as Results<void>;
    }
  }

  reset(): Results<void> {
    try {
      this.config = this.getEnvironmentConfig();
      this.notifyListeners();
      return Results.ok();
    } catch (error) {
      return Results.fail(`Failed to reset config: ${error}`) as Results<void>;
    }
  }
}