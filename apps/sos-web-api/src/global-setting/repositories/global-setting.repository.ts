import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BaseRepository } from '../../database/base.repository';
import {
  GlobalSettingEntity,
  GlobalSettingListResponseDto,
} from '../entities/global-setting.entity';

@Injectable()
export class GlobalSettingRepository extends BaseRepository<GlobalSettingEntity> {
  constructor(databaseService: DatabaseService) {
    super(databaseService, 'global_settings');
  }

  /**
   * Find global setting by key
   */
  async findByKey(configKey: string): Promise<GlobalSettingEntity | null> {
    const result = await this.databaseService
      .knex('global_settings')
      .where('config_key', configKey)
      .whereNull('deleted_at')
      .first();

    if (!result) {
      return null;
    }

    return this.mapRowToGlobalSetting(result);
  }

  /**
   * Find all global settings (excluding soft-deleted)
   */
  async findAllSettings(filters?: {
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }): Promise<GlobalSettingListResponseDto> {
    const result = await this.databaseService
      .knex('global_settings')
      .whereNull('deleted_at')
      .where(function (builder) {
        if (filters?.search) {
          builder.whereILike('config_key', `%${filters?.search || ''}%`);
        }
      })
      .orderBy(filters?.sortBy || 'created_at', filters?.sortOrder || 'DESC')
      .limit(filters?.limit || 10)
      .offset(filters?.page || 0);

    return {
      data: result.map((row) => this.mapRowToGlobalSetting(row)),
      total: result.length,
      page: filters?.page || 1,
      limit: filters?.limit || 10,
    };
  }

  /**
   * Create a new global setting
   */
  async createSetting(
    configKey: string,
    configValue: Record<string, any>,
  ): Promise<GlobalSettingEntity> {
    const result = await this.databaseService
      .knex('global_settings')
      .insert({
        config_key: configKey,
        config_value: JSON.stringify(configValue),
      })
      .returning('*');

    return this.mapRowToGlobalSetting(result[0]);
  }

  /**
   * Update global setting by key
   */
  async updateByKey(
    configKey: string,
    configValue: Record<string, any>,
  ): Promise<GlobalSettingEntity | null> {
    const result = await this.databaseService
      .knex('global_settings')
      .where('config_key', configKey)
      .whereNull('deleted_at')
      .update({
        config_value: JSON.stringify(configValue),
        updated_at: new Date(),
      })
      .returning('*');

    if (result.length === 0) {
      return null;
    }

    return this.mapRowToGlobalSetting(result[0]);
  }

  /**
   * Update global setting by id
   */
  async updateById(
    id: string,
    configKey: string,
    configValue: Record<string, any>,
  ): Promise<GlobalSettingEntity | null> {
    const result = await this.databaseService
      .knex('global_settings')
      .where('id', id)
      .whereNull('deleted_at')
      .update({
        config_key: configKey,
        config_value: JSON.stringify(configValue),
        updated_at: new Date(),
      })
      .returning('*');

    return this.mapRowToGlobalSetting(result[0]);
  }

  /**
   * Upsert global setting (create or update)
   */
  async upsertSetting(
    configKey: string,
    configValue: Record<string, any>,
  ): Promise<GlobalSettingEntity> {
    const result = await this.databaseService
      .knex('global_settings')
      .insert({
        config_key: configKey,
        config_value: JSON.stringify(configValue),
      })
      .returning('*');
    return this.mapRowToGlobalSetting(result[0]);
  }

  /**
   * Soft delete global setting by key
   */
  async softDeleteByKey(configKey: string): Promise<boolean> {
    const result = await this.databaseService
      .knex('global_settings')
      .where('config_key', configKey)
      .whereNull('deleted_at')
      .update({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    return result.length > 0;
  }

  /**
   * Hard delete global setting by key
   */
  async hardDeleteByKey(configKey: string): Promise<boolean> {
    const affectedRows = await this.databaseService
      .knex('global_settings')
      .where('config_key', configKey)
      .del();
    return affectedRows > 0;
  }

  /**
   * Check if global setting key exists
   */
  async existsByKey(configKey: string): Promise<boolean> {
    const result = await this.databaseService
      .knex('global_settings')
      .where('config_key', configKey)
      .whereNull('deleted_at')
      .first();
    return result ? true : false;
  }

  private mapRowToGlobalSetting(row: any): GlobalSettingEntity {
    return {
      id: row.id,
      config_key: row.config_key,
      config_value:
        typeof row.config_value === 'string'
          ? JSON.parse(row.config_value)
          : row.config_value,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
    };
  }
}
