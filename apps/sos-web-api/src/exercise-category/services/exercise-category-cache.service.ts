import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ExerciseCategoryRepository } from '../repositories/exercise-category.repository';
import { ExerciseCategoryCacheSyncService } from './exercise-category-cache-sync.service';
import {
  CreateExerciseCategoryDto,
  UpdateExerciseCategoryDto,
  ExerciseCategoryFiltersDto,
  ExerciseCategoryResponseDto,
  ExerciseCategoryListResponseDto,
} from '../dto/exercise-category.dto';

// Cache key prefixes - using strengthos: prefix for organization in Redis
const CACHE_KEYS = {
  CATEGORY_BY_ID: 'strengthos:exercise-category:id:',
  ALL_CATEGORIES: 'strengthos:exercise-category:all',
} as const;

// Cache TTL in milliseconds (cache-manager-redis-yet expects ms)
const CACHE_TTL = {
  SINGLE_CATEGORY: 90000 * 1000, // 25 hours in ms
  ALL_CATEGORIES: 90000 * 1000, // 25 hours in ms
} as const;

@Injectable()
export class ExerciseCategoryCacheService {
  private readonly logger = new Logger(ExerciseCategoryCacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly exerciseCategoryRepository: ExerciseCategoryRepository,
    @Inject(forwardRef(() => ExerciseCategoryCacheSyncService))
    private readonly syncService: ExerciseCategoryCacheSyncService,
  ) {}

  async findOne(id: string): Promise<ExerciseCategoryResponseDto | null> {
    const cacheKey = `${CACHE_KEYS.CATEGORY_BY_ID}${id}`;

    const cached =
      await this.cacheManager.get<ExerciseCategoryResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for exercise category: ${id}`);
      return cached;
    }

    this.logger.debug(`Cache MISS for exercise category: ${id}`);

    const category = await this.exerciseCategoryRepository.findOne(id);
    if (category) {
      await this.cacheManager.set(
        cacheKey,
        category,
        CACHE_TTL.SINGLE_CATEGORY,
      );
    }
    return category || null;
  }

  async findAll(): Promise<ExerciseCategoryResponseDto[]> {
    const cacheKey = CACHE_KEYS.ALL_CATEGORIES;

    const cached =
      await this.cacheManager.get<ExerciseCategoryResponseDto[]>(cacheKey);
    if (cached) {
      this.logger.debug('Cache HIT for all exercise categories');
      return cached;
    }

    this.logger.debug('Cache MISS for all exercise categories');

    const categories = await this.exerciseCategoryRepository.findAll();
    await this.cacheManager.set(cacheKey, categories, CACHE_TTL.ALL_CATEGORIES);
    return categories;
  }

  async findAllWithFilters(
    filters: ExerciseCategoryFiltersDto,
  ): Promise<ExerciseCategoryListResponseDto> {
    const allCategories = await this.findAll();

    if (!allCategories || allCategories.length === 0) {
      this.logger.warn('No exercise categories in cache for filtering');
      return {
        exercise_categories: [],
        total: 0,
        page: filters.page || 1,
        limit: filters.limit || 10,
      };
    }

    let filtered = [...allCategories];

    if (filters.name && filters.name.trim().length > 0) {
      const searchTerm = filters.name.trim().toLowerCase();
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(searchTerm),
      );
    }

    const sortBy = filters.sortBy || 'name';
    const sortOrder = filters.sortOrder || 'asc';
    filtered.sort((a, b) => {
      const aVal = (a as any)[sortBy] ?? '';
      const bVal = (b as any)[sortBy] ?? '';
      const comparison =
        typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
    const offset = (page - 1) * limit;
    const total = filtered.length;
    const paginatedCategories = filtered.slice(offset, offset + limit);

    return {
      exercise_categories: paginatedCategories,
      total,
      page,
      limit,
    };
  }

  async create(
    createDto: CreateExerciseCategoryDto,
  ): Promise<ExerciseCategoryResponseDto> {
    const category = await this.exerciseCategoryRepository.create(createDto);

    this.logger.log(
      `Exercise category created: ${category.id}. Triggering cache sync...`,
    );

    await this.syncService.syncAllCategoriesToCache();

    return category;
  }

  async update(
    id: string,
    updateDto: UpdateExerciseCategoryDto,
  ): Promise<ExerciseCategoryResponseDto | undefined> {
    const category = await this.exerciseCategoryRepository.update(
      id,
      updateDto,
    );

    if (category) {
      this.logger.log(
        `Exercise category updated: ${id}. Triggering cache sync...`,
      );
      await this.syncService.syncAllCategoriesToCache();
    }

    return category;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.exerciseCategoryRepository.remove(id);

    if (deleted) {
      this.logger.log(
        `Exercise category deleted: ${id}. Triggering cache sync...`,
      );
      await this.syncService.syncAllCategoriesToCache();
    }

    return deleted;
  }
}
