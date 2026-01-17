import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  ExerciseRepository,
  ExerciseFilters,
} from '../repositories/exercise.repository';
import { ExerciseWithUser, ExerciseEntity } from '../entities/exercise.entity';
import { ExerciseCacheSyncService } from './exercise-cache-sync.service';

// Local interface for exercise list response to avoid type conflicts
interface ExerciseListResponse {
  exercises: ExerciseWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Cache key prefixes - using strengthos: prefix for organization in Redis
const CACHE_KEYS = {
  EXERCISE_BY_ID: 'strengthos:exercise:id:',
  EXERCISE_LIST: 'strengthos:exercise:list:',
  EXERCISE_BY_DISCIPLINE: 'strengthos:exercise:discipline:',
  EXERCISE_BY_MOVEMENT: 'strengthos:exercise:movement:',
  EXERCISE_BY_BODY_PART: 'strengthos:exercise:bodypart:',
  ALL_EXERCISES: 'strengthos:exercise:all',
  LAST_SYNC: 'strengthos:exercise:last_sync',
} as const;

// Cache TTL - 25 hours in milliseconds (cache-manager-redis-yet expects ms)
const CACHE_TTL = {
  SINGLE_EXERCISE: 90000 * 1000, // 25 hours in ms
  EXERCISE_LIST: 90000 * 1000, // 25 hours in ms
  ALL_EXERCISES: 90000 * 1000, // 25 hours in ms
} as const;

@Injectable()
export class ExerciseCacheService {
  private readonly logger = new Logger(ExerciseCacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly exerciseRepository: ExerciseRepository,
    @Inject(forwardRef(() => ExerciseCacheSyncService))
    private readonly syncService: ExerciseCacheSyncService,
  ) { }

  // ============================================================================
  // CACHED READ OPERATIONS
  // ============================================================================

  /**
   * Get exercise by ID - CACHE ONLY MODE
   * Returns null if not in cache (no database fallback)
   */
  async findById(id: string): Promise<ExerciseWithUser | null> {
    const cacheKey = `${CACHE_KEYS.EXERCISE_BY_ID}${id}`;

    // Try cache
    const cached = await this.cacheManager.get<ExerciseWithUser>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for exercise: ${id}`);
      return new ExerciseWithUser(cached);
    }

    this.logger.debug(`Cache MISS for exercise: ${id}`);

    // Fallback to database
    const exercise = await this.exerciseRepository.findById(id);
    if (exercise) {
      await this.cacheManager.set(
        cacheKey,
        exercise.toJSON(),
        CACHE_TTL.SINGLE_EXERCISE,
      );
    }
    return exercise;
  }

  /**
   * Get multiple exercises by IDs - CACHE ONLY MODE
   */
  async findByIds(ids: string[]): Promise<ExerciseWithUser[]> {
    const results: ExerciseWithUser[] = [];

    // Get from cache only
    for (const id of ids) {
      const cached = await this.cacheManager.get<ExerciseWithUser>(
        `${CACHE_KEYS.EXERCISE_BY_ID}${id}`,
      );
      if (cached) {
        results.push(new ExerciseWithUser(cached));
      }
    }

    return results;
  }

  /**
   * Get all exercises - CACHE ONLY MODE
   */
  async findAll(): Promise<ExerciseWithUser[]> {
    const cacheKey = CACHE_KEYS.ALL_EXERCISES;

    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) {
      this.logger.debug('Cache HIT for all exercises');
      return cached.map((data) => new ExerciseWithUser(data));
    }

    // Fallback to database
    const exercises = await this.exerciseRepository.findAll();
    await this.cacheManager.set(
      cacheKey,
      exercises.map((e) => e.toJSON()),
      CACHE_TTL.ALL_EXERCISES,
    );
    return exercises;
  }

  /**
   * Get exercises with filters - CACHE ONLY MODE
   * Filters are applied in-memory from the cached ALL_EXERCISES
   */
  async findAllWithFilters(
    filters: ExerciseFilters,
    _userId?: string,
  ): Promise<ExerciseListResponse> {
    // Get all exercises and filter in memory
    const allExercises = await this.findAll();

    if (allExercises.length === 0) {
      this.logger.warn('No exercises in cache for filtering');
      return {
        exercises: [],
        total: 0,
        page: filters.page || 1,
        limit: filters.limit || 10,
        totalPages: 0,
      };
    }

    // Apply filters in memory
    let filtered = [...allExercises];

    // Filter by discipline
    if (filters.discipline) {
      filtered = filtered.filter(
        (e) => e.disciplineTags?.includes(filters.discipline as any) ?? false,
      );
    }

    // Filter by exercise type
    if (filters.exerciseType) {
      filtered = filtered.filter(
        (e) => e.exerciseType === filters.exerciseType,
      );
    }

    // Filter by experience level
    if (filters.experienceLevel) {
      filtered = filtered.filter(
        (e) => e.experienceLevel === filters.experienceLevel,
      );
    }

    // Filter by movement patterns
    if (filters.movementPatterns && filters.movementPatterns.length > 0) {
      filtered = filtered.filter((e) =>
        filters.movementPatterns?.some((pattern) =>
          e.movementPatterns?.includes(pattern as any),
        ),
      );
    }

    // Filter by body parts
    if (filters.bodyParts) {
      const bodyPartsArray = Array.isArray(filters.bodyParts)
        ? filters.bodyParts
        : [filters.bodyParts];
      filtered = filtered.filter((e) =>
        bodyPartsArray.some((bp) => e.bodyPartFocus?.includes(bp as any)),
      );
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((e) =>
        e.name?.toLowerCase().includes(searchLower),
      );
    }

    // Filter by status (is_approved)
    if (filters.status !== undefined) {
      const isApproved = filters.status === 'true';
      filtered = filtered.filter((e) => e.is_approved === isApproved);
    }

    // Sort
    const sortBy = filters.sortBy || 'name';
    const sortOrder = filters.sortOrder || 'asc';
    filtered.sort((a, b) => {
      const aVal = (a as any)[sortBy] ?? '';
      const bVal = (b as any)[sortBy] ?? '';
      const comparison =
        typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    const total = filtered.length;
    const paginatedExercises = filtered.slice(offset, offset + limit);

    return {
      exercises: paginatedExercises,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get exercises by discipline - CACHE ONLY MODE
   */
  async findByDiscipline(discipline: string): Promise<ExerciseWithUser[]> {
    const cacheKey = `${CACHE_KEYS.EXERCISE_BY_DISCIPLINE}${discipline}`;

    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for discipline: ${discipline}`);
      return cached.map((data) => new ExerciseWithUser(data));
    }

    this.logger.debug(`Cache MISS for discipline: ${discipline}`);

    // Filter from all exercises
    // Fallback to database
    const exercises = await this.exerciseRepository.findByDiscipline(
      discipline as any,
    );
    await this.cacheManager.set(
      cacheKey,
      exercises.map((e) => e.toJSON()),
      CACHE_TTL.EXERCISE_LIST,
    );
    return exercises;
  }

  /**
   * Get exercises by movement pattern - CACHE ONLY MODE
   */
  async findByMovementPattern(pattern: string): Promise<ExerciseWithUser[]> {
    const cacheKey = `${CACHE_KEYS.EXERCISE_BY_MOVEMENT}${pattern}`;

    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for movement pattern: ${pattern}`);
      return cached.map((data) => new ExerciseWithUser(data));
    }

    this.logger.debug(`Cache MISS for movement pattern: ${pattern}`);

    // Filter from all exercises
    // Fallback to database
    const exercises = await this.exerciseRepository.findByMovementPattern(
      pattern as any,
    );
    await this.cacheManager.set(
      cacheKey,
      exercises.map((e) => e.toJSON()),
      CACHE_TTL.EXERCISE_LIST,
    );
    return exercises;
  }

  /**
   * Get exercises by body part - CACHE ONLY MODE
   */
  async findByBodyPart(bodyPart: string): Promise<ExerciseWithUser[]> {
    const cacheKey = `${CACHE_KEYS.EXERCISE_BY_BODY_PART}${bodyPart}`;

    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for body part: ${bodyPart}`);
      return cached.map((data) => new ExerciseWithUser(data));
    }

    this.logger.debug(`Cache MISS for body part: ${bodyPart}`);

    // Filter from all exercises
    // Fallback to database
    const exercises = await this.exerciseRepository.findByBodyPart(
      bodyPart as any,
    );
    await this.cacheManager.set(
      cacheKey,
      exercises.map((e) => e.toJSON()),
      CACHE_TTL.EXERCISE_LIST,
    );
    return exercises;
  }

  // ============================================================================
  // CACHE INVALIDATION
  // ============================================================================

  /**
   * Invalidate cache for a specific exercise
   */
  async invalidateExercise(exerciseId: string): Promise<void> {
    this.logger.log(`Invalidating cache for exercise: ${exerciseId}`);

    // Delete the specific exercise cache
    await this.cacheManager.del(`${CACHE_KEYS.EXERCISE_BY_ID}${exerciseId}`);

    // Also invalidate list caches as they may contain this exercise
    await this.invalidateListCaches();
  }

  /**
   * Invalidate all exercise list caches
   * Note: Full cache sync is preferred over pattern-based deletion
   */
  async invalidateListCaches(): Promise<void> {
    this.logger.log('Invalidating exercise list caches');

    // Delete all exercises cache
    await this.cacheManager.del(CACHE_KEYS.ALL_EXERCISES);
    this.logger.log('Deleted all exercises cache');
  }

  /**
   * Invalidate all exercise caches (triggers full sync instead)
   */
  async invalidateAllExerciseCaches(): Promise<void> {
    this.logger.log('Invalidating all exercise caches - triggering full sync');

    // Trigger full sync which will clear and rebuild all caches
    await this.syncService.syncAllExercisesToCache();
  }

  // ============================================================================
  // WRITE-THROUGH CACHING (sync on write)
  // ============================================================================

  /**
   * Create exercise and sync cache
   */
  async create(exerciseData: Partial<ExerciseEntity>): Promise<ExerciseEntity> {
    const exercise = await this.exerciseRepository.create(exerciseData);

    this.logger.log(
      `Exercise created: ${exercise.id}. Triggering cache sync...`,
    );

    // Trigger full cache sync to ensure all data is consistent
    await this.syncService.syncAllExercisesToCache();

    return exercise;
  }

  /**
   * Update exercise and sync cache
   */
  async update(
    id: string,
    updates: Partial<ExerciseEntity>,
  ): Promise<ExerciseEntity | null> {
    const exercise = await this.exerciseRepository.update(id, updates);

    if (exercise) {
      this.logger.log(`Exercise updated: ${id}. Triggering cache sync...`);

      // Trigger full cache sync to ensure all data is consistent
      await this.syncService.syncAllExercisesToCache();
    }

    return exercise;
  }

  /**
   * Delete exercise and sync cache
   */
  async delete(id: string): Promise<boolean> {
    const deleted = await this.exerciseRepository.delete(id);

    if (deleted) {
      this.logger.log(`Exercise deleted: ${id}. Triggering cache sync...`);

      // Trigger full cache sync to ensure all data is consistent
      await this.syncService.syncAllExercisesToCache();
    }

    return deleted;
  }

  // ============================================================================
  // CACHE WARMING
  // ============================================================================

  /**
   * Pre-warm cache with commonly accessed exercises
   */
  async warmCache(): Promise<void> {
    this.logger.log('Warming exercise cache...');

    try {
      // Warm all exercises cache
      await this.findAll();

      this.logger.log('Exercise cache warmed successfully');
    } catch (error) {
      this.logger.error('Failed to warm exercise cache', error);
    }
  }

  /**
   * Get cache statistics for exercises
   */
  async getCacheStats(): Promise<{
    mode: string;
    lastSync: string | null;
  }> {
    const lastSync = await this.cacheManager.get<string>(CACHE_KEYS.LAST_SYNC);
    return {
      mode: 'cache-manager',
      lastSync: lastSync || null,
    };
  }
}
