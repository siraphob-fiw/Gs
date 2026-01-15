import { registerAs } from '@nestjs/config';

export interface MonitoringConfig {
  logging: {
    level: string;
    format: 'json' | 'pretty';
  };
  sentry: {
    dsn?: string;
    environment: string;
    tracesSampleRate: number;
  };
  newRelic: {
    licenseKey?: string;
    appName: string;
  };
  datadog: {
    apiKey?: string;
    service: string;
    env: string;
  };
  healthCheck: {
    timeout: number;
    interval: number;
  };
  metrics: {
    enabled: boolean;
    endpoint: string;
  };
  auditLogging: {
    enabled: boolean;
  };
  requestLogging: {
    enabled: boolean;
  };
  performanceMonitoring: {
    enabled: boolean;
  };
}

export default registerAs(
  'monitoring',
  (): MonitoringConfig => ({
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: (process.env.LOG_FORMAT as 'json' | 'pretty') || 'json',
    },
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    },
    newRelic: {
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
      appName: `StrengthOS API - ${process.env.NODE_ENV || 'development'}`,
    },
    datadog: {
      apiKey: process.env.DATADOG_API_KEY,
      service: 'strengthos-api',
      env: process.env.NODE_ENV || 'development',
    },
    healthCheck: {
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10),
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
    },
    metrics: {
      enabled: process.env.ENABLE_METRICS === 'true',
      endpoint: '/metrics',
    },
    auditLogging: {
      enabled: process.env.ENABLE_AUDIT_LOGGING === 'true',
    },
    requestLogging: {
      enabled: process.env.ENABLE_REQUEST_LOGGING === 'true',
    },
    performanceMonitoring: {
      enabled: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
    },
  }),
);
