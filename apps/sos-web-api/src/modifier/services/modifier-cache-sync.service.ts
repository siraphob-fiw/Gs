import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Cron } from '@nestjs/schedule';
import { ModifierRepository } from '../repositories/modifier.repository';
import { ModifierResponseDto } from '../dto/modifier.dto';

// Cache key prefixes - using strengthos: prefix for organization in Redis
const CACHE_KEYS = {
  MODIFIER_BY_ID: 'strengthos:modifier:id:',
  ALL_MODIFIERS: 'strengthos:modifier:all',
  MODIFIERS_BY_CATEGORY: 'strengthos:modifier:category:',
  LAST_SYNC: 'strengthos:modifier:last_sync',
} as const;

// Cache TTL - 25 hours in milliseconds (cache-manager-redis-yet expects ms)
const CACHE_TTL = 90000 * 1000; // 25 hours in ms

@Injectable()
export class ModifierCacheSyncService implements OnModuleInit {
  private readonly logger = new Logger(ModifierCacheSyncService.name);
  private isSyncing = false;
  private allCacheKeys: Set<string> = new Set();

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly modifierRepository: ModifierRepository,
  ) {}

  async onModuleInit() {
    this.logger.log('Modifier Cache Sync Service initialized');

    const lastSync = await this.cacheManager.get<string>(CACHE_KEYS.LAST_SYNC);
    if (!lastSync) {
      this.logger.log('No previous sync found. Running initial cache sync...');
      await this.syncAllModifiersToCache();
      return;
    }

    this.logger.log(`Last sync was at: ${lastSync}`);

    const cachedData = await this.cacheManager.get<any[]>(
      CACHE_KEYS.ALL_MODIFIERS,
    );
    if (!cachedData || cachedData.length === 0) {
      this.logger.warn(
        'Cache timestamp exists but no data found. Running sync...',
      );
      await this.syncAllModifiersToCache();
      return;
    }

    this.logger.log(`Found ${cachedData.length} modifiers in cache`);

    const lastSyncDate = new Date(lastSync);
    const hoursSinceSync =
      (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceSync > 24) {
      this.logger.log('Cache is stale (>24 hours). Running sync...');
      await this.syncAllModifiersToCache();
    }
  }

  @Cron('0 0 * * *', {
    name: 'modifier-cache-daily-sync',
    timeZone: 'Asia/Bangkok',
  })
  async handleDailySync() {
    this.logger.log('Starting daily modifier cache sync...');
    await this.syncAllModifiersToCache();
  }

  async syncAllModifiersToCache(): Promise<{
    success: boolean;
    modifierCount: number;
    duration: number;
  }> {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress, skipping...');
      return { success: false, modifierCount: 0, duration: 0 };
    }

    this.isSyncing = true;
    const startTime = Date.now();
    let modifierCount = 0;

    try {
      this.logger.log('Fetching all modifiers from database...');

      const result = await this.modifierRepository.findAll({
        page: 1,
        limit: 10000,
      });
      const modifiers = result.modifiers;
      modifierCount = modifiers.length;

      this.logger.log(`Found ${modifierCount} modifiers. Syncing to cache...`);

      await this.clearAllModifierCaches();
      this.allCacheKeys.clear();

      await this.cacheManager.set(
        CACHE_KEYS.ALL_MODIFIERS,
        modifiers,
        CACHE_TTL,
      );
      this.allCacheKeys.add(CACHE_KEYS.ALL_MODIFIERS);

      for (const modifier of modifiers) {
        const key = `${CACHE_KEYS.MODIFIER_BY_ID}${modifier.id}`;
        await this.cacheManager.set(key, modifier, CACHE_TTL);
        this.allCacheKeys.add(key);
      }

      const byCategory = this.groupByCategory(modifiers);
      for (const [categoryId, categoryModifiers] of Object.entries(
        byCategory,
      )) {
        const key = `${CACHE_KEYS.MODIFIERS_BY_CATEGORY}${categoryId}`;
        await this.cacheManager.set(key, categoryModifiers, CACHE_TTL);
        this.allCacheKeys.add(key);
      }

      const syncTime = new Date().toISOString();
      await this.cacheManager.set(CACHE_KEYS.LAST_SYNC, syncTime, CACHE_TTL);
      this.allCacheKeys.add(CACHE_KEYS.LAST_SYNC);

      const duration = Date.now() - startTime;
      this.logger.log(
        `Cache sync completed! ${modifierCount} modifiers synced in ${duration}ms`,
      );

      return { success: true, modifierCount, duration };
    } catch (error) {
      this.logger.error('Failed to sync modifiers to cache', error);
      return {
        success: false,
        modifierCount: 0,
        duration: Date.now() - startTime,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  private async clearAllModifierCaches(): Promise<void> {
    for (const key of this.allCacheKeys) {
      await this.cacheManager.del(key);
    }
    this.allCacheKeys.clear();
    this.logger.debug('Cleared all modifier caches');
  }

  private groupByCategory(
    modifiers: ModifierResponseDto[],
  ): Record<string, ModifierResponseDto[]> {
    const result: Record<string, ModifierResponseDto[]> = {};

    for (const modifier of modifiers) {
      const categoryId = modifier.modifier_category_id;
      if (categoryId) {
        if (!result[categoryId]) {
          result[categoryId] = [];
        }
        result[categoryId].push(modifier);
      }
    }

    return result;
  }

  async getLastSyncTime(): Promise<string | null> {
    return (await this.cacheManager.get<string>(CACHE_KEYS.LAST_SYNC)) || null;
  }

  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  async forceSync(): Promise<{
    success: boolean;
    modifierCount: number;
    duration: number;
  }> {
    this.logger.log('Manual sync triggered');
    return await this.syncAllModifiersToCache();
  }
}
