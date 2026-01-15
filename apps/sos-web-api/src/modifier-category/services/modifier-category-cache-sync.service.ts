import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Cron } from '@nestjs/schedule';
import { ModifierCategoryRepository } from '../repositories/modifier-category.repositiory';

// Cache key prefixes - using strengthos: prefix for organization in Redis
const CACHE_KEYS = {
  CATEGORY_BY_ID: 'strengthos:modifier-category:id:',
  ALL_CATEGORIES: 'strengthos:modifier-category:all',
  LAST_SYNC: 'strengthos:modifier-category:last_sync',
} as const;

// Cache TTL - 25 hours in milliseconds (cache-manager-redis-yet expects ms)
const CACHE_TTL = 90000 * 1000; // 25 hours in ms

@Injectable()
export class ModifierCategoryCacheSyncService implements OnModuleInit {
  private readonly logger = new Logger(ModifierCategoryCacheSyncService.name);
  private isSyncing = false;
  private allCacheKeys: Set<string> = new Set();

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly modifierCategoryRepository: ModifierCategoryRepository,
  ) {}

  async onModuleInit() {
    this.logger.log('Modifier Category Cache Sync Service initialized');

    const lastSync = await this.cacheManager.get<string>(CACHE_KEYS.LAST_SYNC);
    if (!lastSync) {
      this.logger.log('No previous sync found. Running initial cache sync...');
      await this.syncAllCategoriesToCache();
      return;
    }

    this.logger.log(`Last sync was at: ${lastSync}`);

    const cachedData = await this.cacheManager.get<any[]>(
      CACHE_KEYS.ALL_CATEGORIES,
    );
    if (!cachedData || cachedData.length === 0) {
      this.logger.warn(
        'Cache timestamp exists but no data found. Running sync...',
      );
      await this.syncAllCategoriesToCache();
      return;
    }

    this.logger.log(`Found ${cachedData.length} modifier categories in cache`);

    const lastSyncDate = new Date(lastSync);
    const hoursSinceSync =
      (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceSync > 24) {
      this.logger.log('Cache is stale (>24 hours). Running sync...');
      await this.syncAllCategoriesToCache();
    }
  }

  @Cron('0 0 * * *', {
    name: 'modifier-category-cache-daily-sync',
    timeZone: 'Asia/Bangkok',
  })
  async handleDailySync() {
    this.logger.log('Starting daily modifier category cache sync...');
    await this.syncAllCategoriesToCache();
  }

  async syncAllCategoriesToCache(): Promise<{
    success: boolean;
    categoryCount: number;
    duration: number;
  }> {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress, skipping...');
      return { success: false, categoryCount: 0, duration: 0 };
    }

    this.isSyncing = true;
    const startTime = Date.now();
    let categoryCount = 0;

    try {
      this.logger.log('Fetching all modifier categories from database...');

      const categories = await this.modifierCategoryRepository.findAll();
      categoryCount = categories.length;

      this.logger.log(
        `Found ${categoryCount} modifier categories. Syncing to cache...`,
      );

      await this.clearAllCategoryCaches();
      this.allCacheKeys.clear();

      await this.cacheManager.set(
        CACHE_KEYS.ALL_CATEGORIES,
        categories,
        CACHE_TTL,
      );
      this.allCacheKeys.add(CACHE_KEYS.ALL_CATEGORIES);

      for (const category of categories) {
        const key = `${CACHE_KEYS.CATEGORY_BY_ID}${category.id}`;
        await this.cacheManager.set(key, category, CACHE_TTL);
        this.allCacheKeys.add(key);
      }

      const syncTime = new Date().toISOString();
      await this.cacheManager.set(CACHE_KEYS.LAST_SYNC, syncTime, CACHE_TTL);
      this.allCacheKeys.add(CACHE_KEYS.LAST_SYNC);

      const duration = Date.now() - startTime;
      this.logger.log(
        `Cache sync completed! ${categoryCount} modifier categories synced in ${duration}ms`,
      );

      return { success: true, categoryCount, duration };
    } catch (error) {
      this.logger.error('Failed to sync modifier categories to cache', error);
      return {
        success: false,
        categoryCount: 0,
        duration: Date.now() - startTime,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  private async clearAllCategoryCaches(): Promise<void> {
    for (const key of this.allCacheKeys) {
      await this.cacheManager.del(key);
    }
    this.allCacheKeys.clear();
    this.logger.debug('Cleared all modifier category caches');
  }

  async getLastSyncTime(): Promise<string | null> {
    return (await this.cacheManager.get<string>(CACHE_KEYS.LAST_SYNC)) || null;
  }

  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  async forceSync(): Promise<{
    success: boolean;
    categoryCount: number;
    duration: number;
  }> {
    this.logger.log('Manual sync triggered');
    return await this.syncAllCategoriesToCache();
  }
}
