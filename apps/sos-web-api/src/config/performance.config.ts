import { registerAs } from '@nestjs/config';

export interface PerformanceConfig {
  compression: {
    level: number;
    threshold: number;
  };
  cache: {
    ttl: number;
  };
  session: {
    timeout: number;
  };
  clustering: {
    enabled: boolean;
    workers: number;
  };
  gracefulShutdown: {
    timeout: number;
    keepAliveTimeout: number;
  };
}

export default registerAs(
  'performance',
  (): PerformanceConfig => ({
    compression: {
      level: parseInt(process.env.COMPRESSION_LEVEL || '6', 10),
      threshold: parseInt(process.env.COMPRESSION_THRESHOLD || '1024', 10),
    },
    cache: {
      ttl: parseInt(process.env.CACHE_TTL || '300000', 10),
    },
    session: {
      timeout: parseInt(process.env.SESSION_TIMEOUT || '3600000', 10),
    },
    clustering: {
      enabled: process.env.CLUSTER_ENABLED === 'true',
      workers: parseInt(process.env.CLUSTER_WORKERS || '0', 10),
    },
    gracefulShutdown: {
      timeout: parseInt(process.env.SHUTDOWN_TIMEOUT || '30000', 10),
      keepAliveTimeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT || '65000', 10),
    },
  }),
);
