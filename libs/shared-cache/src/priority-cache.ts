// Priority cache migrated from human-lift-training-api/src/Services/Caches/PriorityCache.ts
import NodeCache from "node-cache";
import { PriorityQueue, ICompare } from "@datastructures-js/priority-queue";
import { Results } from '@strengthos/shared-utils';

type PriorityKey = { key: string, priority: number }

export interface IPriorityCacheItem {
  /**
   * The most number that will be the highest priority
   */
  get priority(): number
}

export abstract class PriorityCache {
  private _cache: NodeCache;
  private _cacheMaxSize: number = 3000000000;
  private _priorityQueue: PriorityQueue<PriorityKey>;

  private _compare: ICompare<PriorityKey> = (a: PriorityKey, b: PriorityKey) => {
    return a.priority < b.priority ? -1 : 1;
  }

  constructor() {
    this._cache = new NodeCache();
    this._priorityQueue = new PriorityQueue<PriorityKey>(this._compare);
  
    this._cache.addListener('expired', (key: string) => {
      this._removePriorityKey(key);
    })
  }

  private _removePriorityKey(key: string) {
    this._priorityQueue.remove( x => x.key === key );
  }

  protected boostPriority(key: string, boostValue?: number) {
    const pKeys: Array<PriorityKey> = this._priorityQueue.remove( x => x.key === key );

    if (pKeys.length === 1) {
      const pKey: PriorityKey = pKeys[0];
      pKey.priority = (boostValue === undefined) ? 1 : boostValue;
      this._priorityQueue.enqueue(pKey);
    }
  }

  public get cacheMaxSize(): number {
    return this._cacheMaxSize;
  }

  public set cacheMaxSize(value: number) {
    this._cacheMaxSize = value;
  }

  public set<T extends IPriorityCacheItem>(key: string, value: T, ttl: number | string): Results<void> {
    try {
      if (! (this._priorityQueue.size() < this.cacheMaxSize)) {
        const itemToRemove = this._priorityQueue.dequeue();
        if (itemToRemove) {
          this._cache.del(itemToRemove.key);
        }
      }
    
      const pKey: PriorityKey = { key: key, priority: value.priority };
      this._priorityQueue.enqueue(pKey);
      this._cache.set(key, value, ttl);

      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Failed to set cache item: ${(error as Error).message}`);
    }
  }

  public get<T extends IPriorityCacheItem>(key: string): Results<T | null> {
    try {
      const value = this._cache.get<T>(key);
      return Results.ok(value || null);
    } catch (error) {
      return Results.fail<T | null>(null, `Failed to get cache item: ${(error as Error).message}`);
    }
  }

  public remove(key: string): Results<boolean> {
    try {
      this._cache.del(key);
      this._removePriorityKey(key);
      return Results.ok(true);
    } catch (error) {
      return Results.fail<boolean>(null, `Failed to remove cache item: ${(error as Error).message}`);
    }
  }

  public clearAll(): Results<void> {
    try {
      this._cache.flushAll();
      this._priorityQueue.clear();
      return Results.ok(undefined);
    } catch (error) {
      return Results.fail<void>(null, `Failed to clear cache: ${(error as Error).message}`);
    }
  }

  public getStats(): Results<{
    cacheSize: number;
    queueSize: number;
    maxSize: number;
    hits: number;
    misses: number;
  }> {
    try {
      const stats = this._cache.getStats();
      return Results.ok({
        cacheSize: this._cache.keys().length,
        queueSize: this._priorityQueue.size(),
        maxSize: this._cacheMaxSize,
        hits: stats.hits,
        misses: stats.misses
      });
    } catch (error) {
      return Results.fail<any>(null, `Failed to get cache stats: ${(error as Error).message}`);
    }
  }
}