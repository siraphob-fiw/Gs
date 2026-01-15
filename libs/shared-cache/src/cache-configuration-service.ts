// Cache configuration service migrated from human-lift-training-api/src/Services/Caches/CacheConfigurationService.ts

import { Results } from "@strengthos/shared-utils";

export interface ICacheConfiguration {
  redis: IRedisConfiguration;
  nodeCache: INodeCacheConfiguration;
  performance: IPerformanceConfiguration;
  monitoring: IMonitoringConfiguration;
  invalidation: IInvalidationConfiguration;
}

export interface IRedisConfiguration {
  enabled: boolean;
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  defaultTTL: number;
  maxRetries: number;
  retryDelayOnFailover: number;
  enableReadyCheck: boolean;
  lazyConnect: boolean;
  connectionTimeout: number;
  commandTimeout: number;
  maxRetriesPerRequest: number;
  cluster?: IRedisClusterConfiguration;
}

export interface IRedisClusterConfiguration {
  enabled: boolean;
  nodes: Array<{ host: string; port: number }>;
  options: {
    enableReadyCheck: boolean;
    redisOptions: {
      password?: string;
      db: number;
    };
  };
}

export interface INodeCacheConfiguration {
  enabled: boolean;
  sessionTTL: number;
  permissionTTL: number;
  tenantTTL: number;
  checkPeriod: number;
  useClones: boolean;
  maxKeys: number;
}

export interface IPerformanceConfiguration {
  enableMetrics: boolean;
  metricsRetentionCount: number;
  slowQueryThreshold: number;
  highMemoryThreshold: number;
  lowHitRateThreshold: number;
  enableQueryOptimization: boolean;
  enableIndexRecommendations: boolean;
}

export interface IMonitoringConfiguration {
  enabled: boolean;
  interval: number;
  alertThresholds: IAlertThresholds;
  retentionPeriod: number;
  enableReporting: boolean;
  reportInterval: number;
}

export interface IAlertThresholds {
  cacheHitRateMin: number;
  cacheMissRateMax: number;
  avgResponseTimeMax: number;
  errorRateMax: number;
  memoryUsageMax: number;
  cpuUsageMax: number;
  slowQueryTimeMin: number;
}

export interface IInvalidationConfiguration {
  enabled: boolean;
  batchSize: number;
  processingInterval: number;
  maxQueueSize: number;
  enableCascading: boolean;
  retryAttempts: number;
  retryDelay: number;
}

export class CacheConfigurationService {
  private configuration: ICacheConfiguration;
  private configurationListeners: Array<(config: ICacheConfiguration) => void> = [];

  constructor() {
    this.configuration = this.getDefaultConfiguration();
    this.loadConfiguration();
  }

  // ============================================================================
  // CONFIGURATION MANAGEMENT
  // ============================================================================

  getConfiguration(): ICacheConfiguration {
    try {
      return { ...this.configuration };
    } catch (error) {
      throw new Error(`Failed to get configuration: ${(error as Error).message}`);
    }
  }

  async updateConfiguration(updates: Partial<ICacheConfiguration>): Promise<Results<void>> {
    try {
      const newConfiguration = this.mergeConfiguration(this.configuration, updates);
      
      // Validate configuration
      const validationResult = this.validateConfiguration(newConfiguration);
      if (!validationResult.isOk) {
        return Results.fail<void>(null, validationResult.message || 'Configuration validation failed');
      }
      
      const oldConfiguration = this.configuration;
      this.configuration = newConfiguration;
      
      // Notify listeners of configuration changes
      this.notifyConfigurationChange(newConfiguration);
      
      return Results.ok(undefined);
    } catch (error) {
      throw new Error(`Failed to update cache configuration: ${(error as Error).message}`);
    }
  }

  async reloadConfiguration(): Promise<void> {
    try {
      const newConfiguration = this.loadConfigurationFromEnvironment();
      await this.updateConfiguration(newConfiguration);
    } catch (error) {
      throw new Error(`Failed to reload cache configuration: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // CONFIGURATION SECTIONS
  // ============================================================================

  getRedisConfiguration(): Results<IRedisConfiguration> {
    try {
      return Results.ok({ ...this.configuration.redis });
    } catch (error) {
      return Results.fail<IRedisConfiguration>(null, `Failed to get Redis configuration: ${(error as Error).message}`);
    }
  }

  getNodeCacheConfiguration(): Results<INodeCacheConfiguration> {
    try {
      return Results.ok({ ...this.configuration.nodeCache });
    } catch (error) {
      return Results.fail<INodeCacheConfiguration>(null, `Failed to get NodeCache configuration: ${(error as Error).message}`);
    }
  }

  getPerformanceConfiguration(): Results<IPerformanceConfiguration> {
    try {
      return Results.ok({ ...this.configuration.performance });
    } catch (error) {
      return Results.fail<IPerformanceConfiguration>(null, `Failed to get performance configuration: ${(error as Error).message}`);
    }
  }

  getMonitoringConfiguration(): Results<IMonitoringConfiguration> {
    try {
      return Results.ok({ ...this.configuration.monitoring });
    } catch (error) {
      return Results.fail<IMonitoringConfiguration>(null, `Failed to get monitoring configuration: ${(error as Error).message}`);
    }
  }

  getInvalidationConfiguration(): Results<IInvalidationConfiguration> {
    try {
      return Results.ok({ ...this.configuration.invalidation });
    } catch (error) {
      return Results.fail<IInvalidationConfiguration>(null, `Failed to get invalidation configuration: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // ENVIRONMENT-SPECIFIC CONFIGURATIONS
  // ============================================================================

  getProductionConfiguration(): Partial<ICacheConfiguration> {
    return {
      redis: {
        ...this.configuration.redis,
        maxRetries: 5,
        connectionTimeout: 10000,
        commandTimeout: 5000,
        enableReadyCheck: true,
        lazyConnect: false,
      },
      performance: {
        ...this.configuration.performance,
        enableMetrics: true,
        enableQueryOptimization: true,
        enableIndexRecommendations: true,
      },
      monitoring: {
        ...this.configuration.monitoring,
        enabled: true,
        interval: 30000, // 30 seconds
        enableReporting: true,
        reportInterval: 3600000, // 1 hour
      }
    };
  }

  getDevelopmentConfiguration(): Partial<ICacheConfiguration> {
    return {
      redis: {
        ...this.configuration.redis,
        maxRetries: 3,
        connectionTimeout: 5000,
        commandTimeout: 3000,
        enableReadyCheck: false,
        lazyConnect: true,
      },
      performance: {
        ...this.configuration.performance,
        enableMetrics: true,
        enableQueryOptimization: false,
        enableIndexRecommendations: false,
      },
      monitoring: {
        ...this.configuration.monitoring,
        enabled: false,
        interval: 60000, // 1 minute
        enableReporting: false,
      }
    };
  }

  getTestConfiguration(): Partial<ICacheConfiguration> {
    return {
      redis: {
        ...this.configuration.redis,
        enabled: false, // Use in-memory cache for tests
      },
      nodeCache: {
        ...this.configuration.nodeCache,
        enabled: true,
        sessionTTL: 300, // 5 minutes
        permissionTTL: 300,
        tenantTTL: 300,
      },
      performance: {
        ...this.configuration.performance,
        enableMetrics: false,
        enableQueryOptimization: false,
        enableIndexRecommendations: false,
      },
      monitoring: {
        ...this.configuration.monitoring,
        enabled: false,
      }
    };
  }

  // ============================================================================
  // CONFIGURATION LISTENERS
  // ============================================================================

  addConfigurationListener(listener: (config: ICacheConfiguration) => void): void {
    this.configurationListeners.push(listener);
  }

  removeConfigurationListener(listener: (config: ICacheConfiguration) => void): void {
    const index = this.configurationListeners.indexOf(listener);
    if (index > -1) {
      this.configurationListeners.splice(index, 1);
    }
  }

  private notifyConfigurationChange(config: ICacheConfiguration): void {
    this.configurationListeners.forEach(listener => {
      try {
        listener(config);
      } catch (error) {
        throw new Error(`Configuration listener error: ${(error as Error).message}`);
      }
    });
  }

  // ============================================================================
  // CONFIGURATION VALIDATION
  // ============================================================================

  private validateConfiguration(config: ICacheConfiguration): Results<void> {
    try {
      // Redis validation
      if (config.redis.enabled) {
        if (!config.redis.host) {
          return Results.fail<void>(null, 'Redis host is required when Redis is enabled');
        }
        if (config.redis.port <= 0 || config.redis.port > 65535) {
          return Results.fail<void>(null, 'Redis port must be between 1 and 65535');
        }
        if (config.redis.defaultTTL <= 0) {
          return Results.fail<void>(null, 'Redis default TTL must be positive');
        }
      }

      // NodeCache validation
      if (config.nodeCache.enabled) {
        if (config.nodeCache.sessionTTL <= 0) {
          return Results.fail<void>(null, 'NodeCache session TTL must be positive');
        }
        if (config.nodeCache.maxKeys <= 0) {
          return Results.fail<void>(null, 'NodeCache max keys must be positive');
        }
      }

      // Performance validation
      if (config.performance.slowQueryThreshold <= 0) {
        return Results.fail<void>(null, 'Slow query threshold must be positive');
      }
      if (config.performance.lowHitRateThreshold < 0 || config.performance.lowHitRateThreshold > 1) {
        return Results.fail<void>(null, 'Low hit rate threshold must be between 0 and 1');
      }

      // Monitoring validation
      if (config.monitoring.enabled) {
        if (config.monitoring.interval <= 0) {
          return Results.fail<void>(null, 'Monitoring interval must be positive');
        }
        
        const thresholds = config.monitoring.alertThresholds;
        if (thresholds.cacheHitRateMin < 0 || thresholds.cacheHitRateMin > 1) {
          return Results.fail<void>(null, 'Cache hit rate minimum must be between 0 and 1');
        }
        if (thresholds.errorRateMax < 0 || thresholds.errorRateMax > 1) {
          return Results.fail<void>(null, 'Error rate maximum must be between 0 and 1');
        }
      }

      // Invalidation validation
      if (config.invalidation.enabled) {
        if (config.invalidation.batchSize <= 0) {
          return Results.fail<void>(null, 'Invalidation batch size must be positive');
        }
        if (config.invalidation.maxQueueSize <= 0) {
          return Results.fail<void>(null, 'Invalidation max queue size must be positive');
        }
      }

      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Configuration validation failed: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // CONFIGURATION LOADING
  // ============================================================================

  private loadConfiguration(): void {
    try {
      const envConfig = this.loadConfigurationFromEnvironment();
      this.configuration = this.mergeConfiguration(this.configuration, envConfig);
      
      // Apply environment-specific overrides
      const environment = process.env.NODE_ENV || 'development';
      let envOverrides: Partial<ICacheConfiguration> = {};
      
      switch (environment) {
        case 'production':
          envOverrides = this.getProductionConfiguration();
          break;
        case 'development':
          envOverrides = this.getDevelopmentConfiguration();
          break;
        case 'test':
          envOverrides = this.getTestConfiguration();
          break;
      }
      
      this.configuration = this.mergeConfiguration(this.configuration, envOverrides);
    } catch (error) {
      throw new Error(`Failed to load cache configuration, using defaults: ${(error as Error).message}`);
    }
  }

  private loadConfigurationFromEnvironment(): Partial<ICacheConfiguration> {
    return {
      redis: {
        enabled: process.env.REDIS_ENABLED === 'true',
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'strengthos:',
        defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL || '600'),
        maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
        retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
        enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK !== 'false',
        lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true',
        connectionTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '5000'),
        commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '3000'),
        maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST || '3'),
      },
      performance: {
        enableMetrics: process.env.CACHE_ENABLE_METRICS !== 'false',
        metricsRetentionCount: parseInt(process.env.CACHE_METRICS_RETENTION || '1000'),
        slowQueryThreshold: parseInt(process.env.CACHE_SLOW_QUERY_THRESHOLD || '1000'),
        highMemoryThreshold: parseFloat(process.env.CACHE_HIGH_MEMORY_THRESHOLD || '0.85'),
        lowHitRateThreshold: parseFloat(process.env.CACHE_LOW_HIT_RATE_THRESHOLD || '0.7'),
        enableQueryOptimization: process.env.CACHE_ENABLE_QUERY_OPTIMIZATION === 'true',
        enableIndexRecommendations: process.env.CACHE_ENABLE_INDEX_RECOMMENDATIONS === 'true',
      },
      monitoring: {
        enabled: process.env.CACHE_MONITORING_ENABLED === 'true',
        interval: parseInt(process.env.CACHE_MONITORING_INTERVAL || '30000'),
        retentionPeriod: parseInt(process.env.CACHE_MONITORING_RETENTION || '86400000'),
        enableReporting: process.env.CACHE_ENABLE_REPORTING === 'true',
        reportInterval: parseInt(process.env.CACHE_REPORT_INTERVAL || '3600000'),
        alertThresholds: {
          cacheHitRateMin: parseFloat(process.env.CACHE_ALERT_HIT_RATE_MIN || '0.8'),
          cacheMissRateMax: parseFloat(process.env.CACHE_ALERT_MISS_RATE_MAX || '0.3'),
          avgResponseTimeMax: parseInt(process.env.CACHE_ALERT_RESPONSE_TIME_MAX || '1000'),
          errorRateMax: parseFloat(process.env.CACHE_ALERT_ERROR_RATE_MAX || '0.05'),
          memoryUsageMax: parseFloat(process.env.CACHE_ALERT_MEMORY_MAX || '0.85'),
          cpuUsageMax: parseFloat(process.env.CACHE_ALERT_CPU_MAX || '0.8'),
          slowQueryTimeMin: parseInt(process.env.CACHE_ALERT_SLOW_QUERY_MIN || '1000'),
        },
      },
    };
  }

  private getDefaultConfiguration(): ICacheConfiguration {
    return {
      redis: {
        enabled: true,
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'strengthos:',
        defaultTTL: 600,
        maxRetries: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        lazyConnect: false,
        connectionTimeout: 5000,
        commandTimeout: 3000,
        maxRetriesPerRequest: 3,
      },
      nodeCache: {
        enabled: true,
        sessionTTL: 1800,
        permissionTTL: 900,
        tenantTTL: 3600,
        checkPeriod: 120,
        useClones: false,
        maxKeys: 10000,
      },
      performance: {
        enableMetrics: true,
        metricsRetentionCount: 1000,
        slowQueryThreshold: 1000,
        highMemoryThreshold: 0.85,
        lowHitRateThreshold: 0.7,
        enableQueryOptimization: false,
        enableIndexRecommendations: false,
      },
      monitoring: {
        enabled: false,
        interval: 30000,
        retentionPeriod: 86400000,
        enableReporting: false,
        reportInterval: 3600000,
        alertThresholds: {
          cacheHitRateMin: 0.8,
          cacheMissRateMax: 0.3,
          avgResponseTimeMax: 1000,
          errorRateMax: 0.05,
          memoryUsageMax: 0.85,
          cpuUsageMax: 0.8,
          slowQueryTimeMin: 1000,
        },
      },
      invalidation: {
        enabled: true,
        batchSize: 10,
        processingInterval: 1000,
        maxQueueSize: 1000,
        enableCascading: true,
        retryAttempts: 3,
        retryDelay: 1000,
      },
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private mergeConfiguration(
    base: ICacheConfiguration, 
    updates: Partial<ICacheConfiguration>
  ): ICacheConfiguration {
    return {
      redis: { ...base.redis, ...updates.redis },
      nodeCache: { ...base.nodeCache, ...updates.nodeCache },
      performance: { ...base.performance, ...updates.performance },
      monitoring: {
        ...base.monitoring,
        ...updates.monitoring,
        alertThresholds: {
          ...base.monitoring.alertThresholds,
          ...updates.monitoring?.alertThresholds,
        },
      },
      invalidation: { ...base.invalidation, ...updates.invalidation },
    };
  }

  private getConfigurationDiff(
    oldConfig: ICacheConfiguration, 
    newConfig: ICacheConfiguration
  ): Record<string, any> {
    const diff: Record<string, any> = {};
    
    // Simple diff implementation - could be enhanced
    if (JSON.stringify(oldConfig.redis) !== JSON.stringify(newConfig.redis)) {
      diff.redis = newConfig.redis;
    }
    if (JSON.stringify(oldConfig.nodeCache) !== JSON.stringify(newConfig.nodeCache)) {
      diff.nodeCache = newConfig.nodeCache;
    }
    if (JSON.stringify(oldConfig.performance) !== JSON.stringify(newConfig.performance)) {
      diff.performance = newConfig.performance;
    }
    if (JSON.stringify(oldConfig.monitoring) !== JSON.stringify(newConfig.monitoring)) {
      diff.monitoring = newConfig.monitoring;
    }
    if (JSON.stringify(oldConfig.invalidation) !== JSON.stringify(newConfig.invalidation)) {
      diff.invalidation = newConfig.invalidation;
    }
    
    return diff;
  }

  // ============================================================================
  // CONFIGURATION EXPORT/IMPORT
  // ============================================================================

  exportConfiguration(): Results<string> {
    try {
      const configJson = JSON.stringify(this.configuration, null, 2);
      return Results.ok(configJson);
    } catch (error) {
      return Results.fail<string>(null, `Failed to export configuration: ${(error as Error).message}`);
    }
  }

  async importConfiguration(configJson: string): Promise<Results<void>> {
    try {
      const importedConfig = JSON.parse(configJson) as ICacheConfiguration;
      return await this.updateConfiguration(importedConfig);
    } catch (error) {
      return Results.fail<void>(null, 'Invalid configuration JSON');
    }
  }
}

// Factory function
export function createCacheConfigurationService(): CacheConfigurationService {
  return new CacheConfigurationService();
}