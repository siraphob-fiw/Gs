import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ModifierRepository } from '../repositories/modifier.repository';
import { ModifierCacheSyncService } from './modifier-cache-sync.service';
import {
  CreateModifierDto,
  ModifierFiltersDto,
  ModifierListResponseDto,
  ModifierResponseDto,
  UpdateModifierDto,
} from '../dto/modifier.dto';
import { RequestContext } from '@/types';

// Cache key prefixes - using strengthos: prefix for organization in Redis
const CACHE_KEYS = {
  MODIFIER_BY_ID: 'strengthos:modifier:id:',
  ALL_MODIFIERS: 'strengthos:modifier:all',
  MODIFIERS_BY_CATEGORY: 'strengthos:modifier:category:',
} as const;

// Cache TTL in milliseconds (cache-manager-redis-yet expects ms)
const CACHE_TTL = {
  SINGLE_MODIFIER: 90000 * 1000, // 25 hours in ms
  ALL_MODIFIERS: 90000 * 1000, // 25 hours in ms
} as const;

@Injectable()
export class ModifierCacheService {
  private readonly logger = new Logger(ModifierCacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly modifierRepository: ModifierRepository,
    @Inject(forwardRef(() => ModifierCacheSyncService))
    private readonly syncService: ModifierCacheSyncService,
  ) {}

  async findOne(id: string): Promise<ModifierResponseDto | null> {
    const cacheKey = `${CACHE_KEYS.MODIFIER_BY_ID}${id}`;

    const cached = await this.cacheManager.get<ModifierResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for modifier: ${id}`);
      return cached;
    }

    this.logger.debug(`Cache MISS for modifier: ${id}`);

    const modifier = await this.modifierRepository.findOne(id);
    if (modifier) {
      await this.cacheManager.set(
        cacheKey,
        modifier,
        CACHE_TTL.SINGLE_MODIFIER,
      );
    }
    return modifier;
  }

  async findAll(): Promise<ModifierResponseDto[]> {
    const cacheKey = CACHE_KEYS.ALL_MODIFIERS;

    const cached = await this.cacheManager.get<ModifierResponseDto[]>(cacheKey);
    if (cached) {
      this.logger.debug('Cache HIT for all modifiers');
      return cached;
    }

    this.logger.debug('Cache MISS for all modifiers');

    const result = await this.modifierRepository.findAll({
      page: 1,
      limit: 10000,
    });
    await this.cacheManager.set(
      cacheKey,
      result.modifiers,
      CACHE_TTL.ALL_MODIFIERS,
    );
    return result.modifiers;
  }

  async findAllWithFilters(
    filters: ModifierFiltersDto,
  ): Promise<ModifierListResponseDto> {
    const allModifiers = await this.findAll();

    if (!allModifiers || allModifiers.length === 0) {
      this.logger.warn('No modifiers in cache for filtering');
      return {
        modifiers: [],
        total: 0,
        page: filters.page || 1,
        limit: filters.limit || 10,
      };
    }

    let filtered = [...allModifiers];

    if (filters.name && filters.name.trim().length > 0) {
      const searchTerm = filters.name.trim().toLowerCase();
      filtered = filtered.filter((m) =>
        m.name.toLowerCase().includes(searchTerm),
      );
    }

    if (filters.status) {
      filtered = filtered.filter((m) => m.status === filters.status);
    }

    filtered.sort((a, b) => {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return bDate - aDate;
    });

    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
    const offset = (page - 1) * limit;
    const total = filtered.length;
    const paginatedModifiers = filtered.slice(offset, offset + limit);

    return {
      modifiers: paginatedModifiers,
      total,
      page,
      limit,
    };
  }

  async findByCategory(categoryId: string): Promise<ModifierResponseDto[]> {
    const cacheKey = `${CACHE_KEYS.MODIFIERS_BY_CATEGORY}${categoryId}`;

    const cached = await this.cacheManager.get<ModifierResponseDto[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for modifiers by category: ${categoryId}`);
      return cached;
    }

    this.logger.debug(`Cache MISS for modifiers by category: ${categoryId}`);

    const allModifiers = await this.findAll();
    return allModifiers.filter((m) => m.modifier_category_id === categoryId);
  }

  async create(
    createModifierDto: CreateModifierDto,
  ): Promise<ModifierResponseDto> {
    const modifier = await this.modifierRepository.create(createModifierDto);

    this.logger.log(
      `Modifier created: ${modifier.id}. Triggering cache sync...`,
    );

    await this.syncService.syncAllModifiersToCache();

    return modifier;
  }

  async update(
    id: string,
    updateModifierDto: UpdateModifierDto,
  ): Promise<ModifierResponseDto | undefined> {
    const modifier = await this.modifierRepository.update(
      id,
      updateModifierDto,
    );

    if (modifier) {
      this.logger.log(`Modifier updated: ${id}. Triggering cache sync...`);
      await this.syncService.syncAllModifiersToCache();
    }

    return modifier;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.modifierRepository.remove(id);

    if (deleted) {
      this.logger.log(`Modifier deleted: ${id}. Triggering cache sync...`);
      await this.syncService.syncAllModifiersToCache();
    }

    return deleted;
  }

  async bulkUpdate(
    bulkUpdateModifierDto: UpdateModifierDto[],
    user: RequestContext,
  ): Promise<{
    updated: number;
    created: number;
    failed: number;
    errors: string[];
  }> {
    const result = await this.modifierRepository.bulkUpdate(
      bulkUpdateModifierDto,
      user,
    );

    if (result.updated > 0 || result.created > 0) {
      this.logger.log(
        `Bulk update completed (${result.updated} updated, ${result.created} created). Triggering cache sync...`,
      );
      await this.syncService.syncAllModifiersToCache();
    }

    return result;
  }
}
