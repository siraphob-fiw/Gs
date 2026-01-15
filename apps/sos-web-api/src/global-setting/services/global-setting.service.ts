import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { GlobalSettingRepository } from '../repositories/global-setting.repository';
import {
  GlobalSettingEntity,
  GlobalSettingListResponseDto,
} from '../entities/global-setting.entity';
import {
  CreateGlobalSettingDto,
  UpdateGlobalSettingDto,
} from '../dto/global-setting-request.dto';

@Injectable()
export class GlobalSettingService {
  constructor(
    private readonly globalSettingRepository: GlobalSettingRepository,
  ) {}

  /**
   * Create a new global setting
   */
  async create(dto: CreateGlobalSettingDto): Promise<GlobalSettingEntity> {
    // Check if key already exists
    const exists = await this.globalSettingRepository.existsByKey(
      dto.config_key,
    );
    if (exists) {
      throw new ConflictException(
        `Global setting with key '${dto.config_key}' already exists`,
      );
    }

    const setting = await this.globalSettingRepository.createSetting(
      dto.config_key,
      dto.config_value,
    );

    return setting;
  }

  /**
   * Get all global settings
   */
  async findAll(filters?: {
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }): Promise<GlobalSettingListResponseDto> {
    return this.globalSettingRepository.findAllSettings(filters);
  }

  /**
   * Get global setting by key
   */
  async findByKey(configKey: string): Promise<GlobalSettingEntity> {
    const setting = await this.globalSettingRepository.findByKey(configKey);
    if (!setting) {
      throw new NotFoundException(
        `Global setting with key '${configKey}' not found`,
      );
    }
    return setting;
  }

  /**
   * Get global setting by ID
   */
  async findById(id: string): Promise<GlobalSettingEntity> {
    const setting = await this.globalSettingRepository.findById(id);
    if (!setting || setting.deleted_at) {
      throw new NotFoundException(`Global setting with id '${id}' not found`);
    }
    return setting;
  }

  /**
   * Update global setting by key
   */
  async updateById(
    id: string,
    dto: UpdateGlobalSettingDto,
  ): Promise<GlobalSettingEntity> {
    const setting = await this.globalSettingRepository.updateById(
      id,
      dto.key,
      dto.data,
    );

    if (!setting) {
      throw new NotFoundException(`Global setting with id '${id}' not found`);
    }

    return setting;
  }

  /**
   * Upsert global setting (create or update)
   */
  async upsert(dto: CreateGlobalSettingDto): Promise<GlobalSettingEntity> {
    const setting = await this.globalSettingRepository.upsertSetting(
      dto.config_key,
      dto.config_value,
    );

    return setting;
  }

  /**
   * Delete global setting by key (soft delete)
   */
  async deleteByKey(configKey: string): Promise<void> {
    const deleted =
      await this.globalSettingRepository.softDeleteByKey(configKey);

    if (!deleted) {
      throw new NotFoundException(
        `Global setting with key '${configKey}' not found`,
      );
    }
  }

  /**
   * Permanently delete global setting by key
   */
  async hardDeleteByKey(configKey: string): Promise<void> {
    const deleted =
      await this.globalSettingRepository.hardDeleteByKey(configKey);

    if (!deleted) {
      throw new NotFoundException(
        `Global setting with key '${configKey}' not found`,
      );
    }
  }

  /**
   * Check if global setting exists by key
   */
  async existsByKey(configKey: string): Promise<boolean> {
    return this.globalSettingRepository.existsByKey(configKey);
  }

  /**
   * Get global setting value by key, returns null if not found
   */
  async getValueByKey(configKey: string): Promise<Record<string, any> | null> {
    const setting = await this.globalSettingRepository.findByKey(configKey);
    return setting?.config_value || null;
  }
}
