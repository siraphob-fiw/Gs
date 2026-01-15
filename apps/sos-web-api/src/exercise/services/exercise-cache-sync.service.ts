import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Cron } from '@nestjs/schedule';
import { ExerciseRepository } from '../repositories/exercise.repository';
import { ExerciseWithUser } from '../entities/exercise.entity';

// Cache key prefixes - using strengthos: prefix for organization in Redis
const CACHE_KEYS = {
  EXERCISE_BY_ID: 'strengthos:exercise:id:',
  ALL_EXERCISES: 'strengthos:exercise:all',
  EXERCISES_BY_DISCIPLINE: 'strengthos:exercise:discipline:',
  EXERCISES_BY_MOVEMENT: 'strengthos:exercise:movement:',
  EXERCISES_BY_BODY_PART: 'strengthos:exercise:bodypart:',
  LAST_SYNC: 'strengthos:exercise:last_sync',
} as const;

// Cache TTL - 25 hours to ensure cache doesn't expire between daily syncs (in milliseconds)
const CACHE_TTL = 90000 * 1000; // 25 hours in milliseconds (cache-manager-redis-yet expects ms)

@Injectable()
export class ExerciseCacheSyncService implements OnModuleInit {
  private readonly logger = new Logger(ExerciseCacheSyncService.name);
  private isSyncing = false;
  private allCacheKeys: Set<string> = new Set();

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly exerciseRepository: ExerciseRepository,
  ) {}

  /**
   * On application startup, sync cache if needed
   */
  async onModuleInit() {
    this.logger.log('Exercise Cache Sync Service initialized');

    // Check if cache needs initial sync
    const lastSync = await this.cacheManager.get<string>(CACHE_KEYS.LAST_SYNC);
    if (!lastSync) {
      this.logger.log('No previous sync found. Running initial cache sync...');
      await this.syncAllExercisesToCache();
      return;
    }

    this.logger.log(`Last sync was at: ${lastSync}`);

    // Verify that actual data exists in cache (not just the timestamp)
    const cachedData = await this.cacheManager.get<any[]>(
      CACHE_KEYS.ALL_EXERCISES,
    );
    if (!cachedData || cachedData.length === 0) {
      this.logger.warn(
        'Cache timestamp exists but no data found. Running sync...',
      );
      await this.syncAllExercisesToCache();
      return;
    }

    this.logger.log(`Found ${cachedData.length} exercises in cache`);

    // Check if sync is older than 24 hours
    const lastSyncDate = new Date(lastSync);
    const hoursSinceSync =
      (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceSync > 24) {
      this.logger.log('Cache is stale (>24 hours). Running sync...');
      await this.syncAllExercisesToCache();
    }
  }

  /**
   * Daily sync at midnight (00:00)
   * Adjust the time as needed for your timezone
   */
  @Cron('0 0 * * *', {
    name: 'exercise-cache-daily-sync',
    timeZone: 'Asia/Bangkok', // Change to your timezone
  })
  async handleDailySync() {
    this.logger.log('Starting daily exercise cache sync...');
    await this.syncAllExercisesToCache();
  }

  /**
   * Alternative: Run at specific time (e.g., 6:00 AM)
   * Uncomment this and comment out the midnight cron if preferred
   */
  // @Cron('0 6 * * *', {
  //   name: 'exercise-cache-morning-sync',
  //   timeZone: 'Asia/Bangkok',
  // })
  // async handleMorningSync() {
  //   this.logger.log('Starting morning exercise cache sync...');
  //   await this.syncAllExercisesToCache();
  // }

  /**
   * Sync all exercises from database to cache
   */
  async syncAllExercisesToCache(): Promise<{
    success: boolean;
    exerciseCount: number;
    duration: number;
  }> {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress, skipping...');
      return { success: false, exerciseCount: 0, duration: 0 };
    }

    this.isSyncing = true;
    const startTime = Date.now();
    let exerciseCount = 0;

    try {
      this.logger.log('Fetching all exercises from database...');

      // Fetch all exercises from database
      const exercises = await this.exerciseRepository.findAll();
      exerciseCount = exercises.length;

      this.logger.log(`Found ${exerciseCount} exercises. Syncing to cache...`);

      // Clear existing exercise caches first
      await this.clearAllExerciseCaches();

      // Reset tracked keys
      this.allCacheKeys.clear();

      // Cache all exercises as a list
      const serializedExercises = exercises.map((e) => e.toJSON());
      this.logger.log(
        `Setting cache key: ${CACHE_KEYS.ALL_EXERCISES} with ${serializedExercises.length} exercises, TTL: ${CACHE_TTL}s`,
      );
      await this.cacheManager.set(
        CACHE_KEYS.ALL_EXERCISES,
        serializedExercises,
        CACHE_TTL,
      );
      this.allCacheKeys.add(CACHE_KEYS.ALL_EXERCISES);

      // Verify the data was actually stored
      const verifyData = await this.cacheManager.get(CACHE_KEYS.ALL_EXERCISES);
      this.logger.log(
        `Verification: Retrieved ${Array.isArray(verifyData) ? verifyData.length : 0} exercises from cache after set`,
      );

      // Cache each exercise by ID for fast lookup
      for (const exercise of exercises) {
        const key = `${CACHE_KEYS.EXERCISE_BY_ID}${exercise.id}`;
        await this.cacheManager.set(key, exercise.toJSON(), CACHE_TTL);
        this.allCacheKeys.add(key);
      }

      // Group and cache by discipline
      const byDiscipline = this.groupByDiscipline(exercises);
      for (const [discipline, disciplineExercises] of Object.entries(
        byDiscipline,
      )) {
        const key = `${CACHE_KEYS.EXERCISES_BY_DISCIPLINE}${discipline}`;
        await this.cacheManager.set(
          key,
          disciplineExercises.map((e) => e.toJSON()),
          CACHE_TTL,
        );
        this.allCacheKeys.add(key);
      }

      // Group and cache by movement pattern
      const byMovement = this.groupByMovementPattern(exercises);
      for (const [pattern, patternExercises] of Object.entries(byMovement)) {
        const key = `${CACHE_KEYS.EXERCISES_BY_MOVEMENT}${pattern}`;
        await this.cacheManager.set(
          key,
          patternExercises.map((e) => e.toJSON()),
          CACHE_TTL,
        );
        this.allCacheKeys.add(key);
      }

      // Group and cache by body part
      const byBodyPart = this.groupByBodyPart(exercises);
      for (const [bodyPart, bodyPartExercises] of Object.entries(byBodyPart)) {
        const key = `${CACHE_KEYS.EXERCISES_BY_BODY_PART}${bodyPart}`;
        await this.cacheManager.set(
          key,
          bodyPartExercises.map((e) => e.toJSON()),
          CACHE_TTL,
        );
        this.allCacheKeys.add(key);
      }

      // Record last sync time
      const syncTime = new Date().toISOString();
      await this.cacheManager.set(CACHE_KEYS.LAST_SYNC, syncTime, CACHE_TTL);
      this.allCacheKeys.add(CACHE_KEYS.LAST_SYNC);

      const duration = Date.now() - startTime;
      this.logger.log(
        `Cache sync completed! ${exerciseCount} exercises synced in ${duration}ms`,
      );

      return { success: true, exerciseCount, duration };
    } catch (error) {
      this.logger.error('Failed to sync exercises to cache', error);
      return {
        success: false,
        exerciseCount: 0,
        duration: Date.now() - startTime,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Clear all exercise caches
   */
  private async clearAllExerciseCaches(): Promise<void> {
    // Delete all tracked keys
    for (const key of this.allCacheKeys) {
      await this.cacheManager.del(key);
    }
    this.allCacheKeys.clear();
    this.logger.debug('Cleared all exercise caches');
  }

  /**
   * Group exercises by discipline
   */
  private groupByDiscipline(
    exercises: ExerciseWithUser[],
  ): Record<string, ExerciseWithUser[]> {
    const result: Record<string, ExerciseWithUser[]> = {};

    for (const exercise of exercises) {
      for (const discipline of exercise.disciplineTags || []) {
        if (!result[discipline]) {
          result[discipline] = [];
        }
        result[discipline].push(exercise);
      }
    }

    return result;
  }

  /**
   * Group exercises by movement pattern
   */
  private groupByMovementPattern(
    exercises: ExerciseWithUser[],
  ): Record<string, ExerciseWithUser[]> {
    const result: Record<string, ExerciseWithUser[]> = {};

    for (const exercise of exercises) {
      for (const pattern of exercise.movementPatterns || []) {
        if (!result[pattern]) {
          result[pattern] = [];
        }
        result[pattern].push(exercise);
      }
    }

    return result;
  }

  /**
   * Group exercises by body part
   */
  private groupByBodyPart(
    exercises: ExerciseWithUser[],
  ): Record<string, ExerciseWithUser[]> {
    const result: Record<string, ExerciseWithUser[]> = {};

    for (const exercise of exercises) {
      for (const bodyPart of exercise.bodyPartFocus || []) {
        if (!result[bodyPart]) {
          result[bodyPart] = [];
        }
        result[bodyPart].push(exercise);
      }
    }

    return result;
  }

  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<string | null> {
    return (await this.cacheManager.get<string>(CACHE_KEYS.LAST_SYNC)) || null;
  }

  /**
   * Check if sync is currently running
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Force a manual sync (can be called from controller)
   */
  async forceSync(): Promise<{
    success: boolean;
    exerciseCount: number;
    duration: number;
  }> {
    this.logger.log('Manual sync triggered');
    return await this.syncAllExercisesToCache();
  }
}
