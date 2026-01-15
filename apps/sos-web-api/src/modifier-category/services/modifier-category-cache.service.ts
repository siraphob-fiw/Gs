import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ModifierCategoryRepository } from '../repositories/modifier-category.repositiory';
import { ModifierCategoryCacheSyncService } from './modifier-category-cache-sync.service';
import {
  CreateModifierCategoryDto,
  UpdateModifierCategoryDto,
  ModifierCategoryFiltersDto,
  ModifierCategoryDto,
} from '../dto/modifier-category.dto';

// Cache key prefixes - using strengthos: prefix for organization in Redis
const CACHE_KEYS = {
  CATEGORY_BY_ID: 'strengthos:modifier-category:id:',
  ALL_CATEGORIES: 'strengthos:modifier-category:all',
} as const;

// Cache TTL in milliseconds (cache-manager-redis-yet expects ms)
const CACHE_TTL = {
  SINGLE_CATEGORY: 90000 * 1000, // 25 hours in ms
  ALL_CATEGORIES: 90000 * 1000, // 25 hours in ms
} as const;

@Injectable()
export class ModifierCategoryCacheService {
  private readonly logger = new Logger(ModifierCategoryCacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly modifierCategoryRepository: ModifierCategoryRepository,
    @Inject(forwardRef(() => ModifierCategoryCacheSyncService))
    private readonly syncService: ModifierCategoryCacheSyncService,
  ) {}

  async findOne(id: string): Promise<ModifierCategoryDto | null> {
    const cacheKey = `${CACHE_KEYS.CATEGORY_BY_ID}${id}`;

    const cached = await this.cacheManager.get<ModifierCategoryDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for modifier category: ${id}`);
      return cached;
    }

    this.logger.debug(`Cache MISS for modifier category: ${id}`);

    const category = await this.modifierCategoryRepository.findOne(id);
    if (category) {
      await this.cacheManager.set(
        cacheKey,
        category,
        CACHE_TTL.SINGLE_CATEGORY,
      );
    }
    return category || null;
  }

  async findAll(): Promise<ModifierCategoryDto[]> {
    const cacheKey = CACHE_KEYS.ALL_CATEGORIES;

    const cached = await this.cacheManager.get<ModifierCategoryDto[]>(cacheKey);
    if (cached) {
      this.logger.debug('Cache HIT for all modifier categories');
      return cached;
    }

    this.logger.debug('Cache MISS for all modifier categories');

    const categories = await this.modifierCategoryRepository.findAll();
    await this.cacheManager.set(cacheKey, categories, CACHE_TTL.ALL_CATEGORIES);
    return categories;
  }

  async findAllWithFilters(filters: ModifierCategoryFiltersDto): Promise<{
    modifier_categories: ModifierCategoryDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const allCategories = await this.findAll();

    if (!allCategories || allCategories.length === 0) {
      this.logger.warn('No modifier categories in cache for filtering');
      return {
        modifier_categories: [],
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

    if (filters.status) {
      filtered = filtered.filter((c) => c.status === filters.status);
    }

    filtered.sort((a, b) => {
      const aDate = new Date((a as any).created_at).getTime();
      const bDate = new Date((b as any).created_at).getTime();
      return bDate - aDate;
    });

    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
    const offset = (page - 1) * limit;
    const total = filtered.length;
    const paginatedCategories = filtered.slice(offset, offset + limit);

    return {
      modifier_categories: paginatedCategories,
      total,
      page,
      limit,
    };
  }

  async create(createDto: CreateModifierCategoryDto): Promise<any> {
    const category = await this.modifierCategoryRepository.create(createDto);

    this.logger.log(
      `Modifier category created: ${category.id}. Triggering cache sync...`,
    );

    await this.syncService.syncAllCategoriesToCache();

    return category;
  }

  async update(id: string, updateDto: UpdateModifierCategoryDto): Promise<any> {
    const category = await this.modifierCategoryRepository.update(
      id,
      updateDto,
    );

    if (category) {
      this.logger.log(
        `Modifier category updated: ${id}. Triggering cache sync...`,
      );
      await this.syncService.syncAllCategoriesToCache();
    }

    return category;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.modifierCategoryRepository.remove(id);

    if (deleted) {
      this.logger.log(
        `Modifier category deleted: ${id}. Triggering cache sync...`,
      );
      await this.syncService.syncAllCategoriesToCache();
    }

    return deleted;
  }
}
