// LRU cache manager migrated from human-lift-training-api/src/Services/Caches/LruCacheManager.ts
import { IPriorityCacheItem, PriorityCache } from './priority-cache';
import { Results } from '@strengthos/shared-utils';

export class LruCacheManager extends PriorityCache {
  constructor() {
    super();
  }

  public set<T extends IPriorityCacheItem>(key: string, value: T, ttl: number | string): Results<void> {
    try {
      // Boost priority with current timestamp for LRU behavior
      super.boostPriority(key, Date.now());
      return super.set<T>(key, value, ttl);
    } catch (error) {
      return Results.fail<void>(null, `Failed to set LRU cache item: ${(error as Error).message}`);
    }
  }

  public get<T extends IPriorityCacheItem>(key: string): Results<T | null> {
    try {
      // Boost priority on access for LRU behavior
      super.boostPriority(key, Date.now());
      return super.get<T>(key);
    } catch (error) {
      return Results.fail<T | null>(null, `Failed to get LRU cache item: ${(error as Error).message}`);
    }
  }
}

// Factory function
export function createLruCacheManager(): LruCacheManager {
  return new LruCacheManager();
}