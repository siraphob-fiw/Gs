import {
  Module,
  Provider,
  OnModuleDestroy,
  Inject,
  Logger,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  CacheConfigurationService,
  createCacheConfigurationService,
  RedisCacheService,
  IRedisCacheService,
  ICacheConfig,
} from '@strengthos/shared-cache';
import { ILogger } from '@strengthos/shared-logging';
import { CacheService } from './cache.service';
import { CacheWarmingService } from './services/cache-warming.service';
import { CachePerformanceService } from './services/cache-performance.service';

const RedisCacheServiceProvider: Provider = {
  provide: 'IRedisCacheService',
  useFactory: async (
    configService: ConfigService,
    logger: ILogger,
  ): Promise<IRedisCacheService> => {
    const config: ICacheConfig = {
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
      password: configService.get<string>('REDIS_PASSWORD', ''),
      db: configService.get<number>('REDIS_DB', 0),
      timeout: configService.get<number>('REDIS_TIMEOUT', 5000),
      pool: {
        min: configService.get<number>('REDIS_POOL_MIN', 1),
        max: configService.get<number>('REDIS_POOL_MAX', 10),
      },
      keyPrefix: configService.get<string>('REDIS_KEY_PREFIX', 'strengthos:'),
      defaultTTL: configService.get<number>('REDIS_TTL', 600),
      maxRetries: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: false,
    };

    Logger.log(
      `Connecting to Redis at ${config.host}:${config.port}`,
      'SharedCacheModule',
    );
    const redisCacheService = new RedisCacheService(logger, config);

    // Validate connection
    const healthResult = await redisCacheService.healthCheck();
    if (healthResult.isOk && healthResult.returnValue) {
      Logger.log(
        'Redis connection established successfully',
        'SharedCacheModule',
      );
    } else {
      Logger.warn(
        'Redis health check failed, but service is initialized',
        'SharedCacheModule',
      );
    }

    return redisCacheService;
  },
  inject: [ConfigService, 'ILogger'],
};

const CacheConfigurationServiceProvider: Provider = {
  provide: 'CacheConfigurationService',
  useFactory: (): CacheConfigurationService => {
    return createCacheConfigurationService();
  },
};

const CacheInvalidationServiceProvider: Provider = {
  provide: 'CacheInvalidationService',
  useFactory: (_redisCache: IRedisCacheService, _logger: ILogger): any => {
    return {
      destroy: () => {},
      invalidateUserData: async () => ({ isOk: true }),
      invalidatePermissions: async () => ({ isOk: true }),
      invalidateTenantData: async () => ({ isOk: true }),
      queueInvalidation: async () => ({ isOk: true }),
      warmCache: async () => ({ isOk: true }),
      getQueueStatus: () => ({ pending: 0, processing: 0 }),
    };
  },
  inject: ['IRedisCacheService', 'ILogger'],
};

@Module({
  imports: [ConfigModule],
  providers: [
    RedisCacheServiceProvider,
    CacheConfigurationServiceProvider,
    CacheInvalidationServiceProvider,
    CacheService,
    CacheWarmingService,
    CachePerformanceService,
  ],
  exports: [
    'IRedisCacheService',
    'CacheConfigurationService',
    'CacheInvalidationService',
    CacheService,
    CacheWarmingService,
    CachePerformanceService,
  ],
})
export class SharedCacheModule implements OnModuleDestroy {
  constructor(
    @Inject('CacheInvalidationService')
    private readonly cacheInvalidationService: any,
    @Inject('IRedisCacheService')
    private readonly redisCacheService: IRedisCacheService,
    private readonly cacheWarmingService: CacheWarmingService,
    private readonly cachePerformanceService: CachePerformanceService,
  ) {}

  async onModuleDestroy() {
    if (this.cacheInvalidationService?.destroy) {
      this.cacheInvalidationService.destroy();
    }
    this.cacheWarmingService.destroy();
    this.cachePerformanceService.destroy();

    // Disconnect Redis
    Logger.log('Disconnecting from Redis...', 'SharedCacheModule');
    await this.redisCacheService.disconnect();
    Logger.log('Redis connection closed', 'SharedCacheModule');
  }
}
