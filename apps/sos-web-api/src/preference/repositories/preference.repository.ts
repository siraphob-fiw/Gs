import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BaseRepository } from '../../database/base.repository';
import {
  UserPreferenceEntity,
  PreferenceSchemaEntity,
  PreferenceCategoryEntity,
} from '../entities/preference.entity';
import {
  CreateUserPreferenceDto,
  UpdateUserPreferenceDto,
} from '../dto/preference-request.dto';

@Injectable()
export class PreferenceRepository extends BaseRepository<UserPreferenceEntity> {
  constructor(databaseService: DatabaseService) {
    super(databaseService, 'user_preferences');
  }

  // User Preferences

  async createUserPreference(
    userId: string,
    preferenceDto: CreateUserPreferenceDto,
  ): Promise<UserPreferenceEntity> {
    const query = `
      INSERT INTO user_preferences (user_id, key, value, category, is_private, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      userId,
      preferenceDto.key,
      preferenceDto.value,
      preferenceDto.category,
      preferenceDto.isPrivate || false,
      JSON.stringify(preferenceDto.metadata || {}),
    ];

    const result = await this.databaseService.query(query, values);
    return this.mapRowToUserPreference(result.rows[0]);
  }

  async findUserPreferences(
    userId: string,
    filters?: { category?: string; key?: string },
  ): Promise<UserPreferenceEntity[]> {
    let whereClause = 'WHERE user_id = $1';
    const values: any[] = [userId];
    let paramIndex = 2;

    if (filters?.category) {
      whereClause += ` AND category = $${paramIndex}`;
      values.push(filters.category);
      paramIndex++;
    }

    if (filters?.key) {
      whereClause += ` AND key = $${paramIndex}`;
      values.push(filters.key);
      paramIndex++;
    }

    const query = `SELECT * FROM user_preferences ${whereClause} ORDER BY category, key`;
    const result = await this.databaseService.query(query, values);

    return result.rows.map((row) => this.mapRowToUserPreference(row));
  }

  async findUserPreferenceByKey(
    userId: string,
    key: string,
  ): Promise<UserPreferenceEntity | null> {
    const query =
      'SELECT * FROM user_preferences WHERE user_id = $1 AND key = $2';
    const result = await this.databaseService.query(query, [userId, key]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUserPreference(result.rows[0]);
  }

  async updateUserPreference(
    userId: string,
    key: string,
    updateDto: UpdateUserPreferenceDto,
  ): Promise<UserPreferenceEntity | null> {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateDto.value !== undefined) {
      setClause.push(`value = $${paramIndex}`);
      values.push(updateDto.value);
      paramIndex++;
    }

    if (updateDto.isPrivate !== undefined) {
      setClause.push(`is_private = $${paramIndex}`);
      values.push(updateDto.isPrivate);
      paramIndex++;
    }

    if (updateDto.metadata !== undefined) {
      setClause.push(`metadata = $${paramIndex}`);
      values.push(JSON.stringify(updateDto.metadata));
      paramIndex++;
    }

    if (setClause.length === 0) {
      return this.findUserPreferenceByKey(userId, key);
    }

    setClause.push(`updated_at = NOW()`);
    values.push(userId, key);

    const query = `
      UPDATE user_preferences 
      SET ${setClause.join(', ')} 
      WHERE user_id = $${paramIndex} AND key = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await this.databaseService.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUserPreference(result.rows[0]);
  }

  async upsertUserPreference(
    userId: string,
    preferenceDto: CreateUserPreferenceDto,
  ): Promise<UserPreferenceEntity> {
    const query = `
      INSERT INTO user_preferences (user_id, key, value, category, is_private, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (user_id, key) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        category = EXCLUDED.category,
        is_private = EXCLUDED.is_private,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      userId,
      preferenceDto.key,
      preferenceDto.value,
      preferenceDto.category,
      preferenceDto.isPrivate || false,
      JSON.stringify(preferenceDto.metadata || {}),
    ];

    const result = await this.databaseService.query(query, values);
    return this.mapRowToUserPreference(result.rows[0]);
  }

  async deleteUserPreference(userId: string, key: string): Promise<boolean> {
    const query =
      'DELETE FROM user_preferences WHERE user_id = $1 AND key = $2';
    const result = await this.databaseService.query(query, [userId, key]);

    return result.rowCount > 0;
  }

  async deleteUserPreferencesByCategory(
    userId: string,
    category: string,
  ): Promise<number> {
    const query =
      'DELETE FROM user_preferences WHERE user_id = $1 AND category = $2';
    const result = await this.databaseService.query(query, [userId, category]);

    return result.rowCount;
  }

  // Preference Schemas

  async findPreferenceSchemas(filters?: {
    category?: string;
  }): Promise<PreferenceSchemaEntity[]> {
    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.category) {
      whereClause += ` AND category = $${paramIndex}`;
      values.push(filters.category);
      paramIndex++;
    }

    const query = `SELECT * FROM preference_schemas ${whereClause} ORDER BY category, sort_order, display_name`;
    const result = await this.databaseService.query(query, values);

    return result.rows.map((row) => this.mapRowToPreferenceSchema(row));
  }

  async findPreferenceSchemaByKey(
    key: string,
  ): Promise<PreferenceSchemaEntity | null> {
    const query = 'SELECT * FROM preference_schemas WHERE key = $1';
    const result = await this.databaseService.query(query, [key]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPreferenceSchema(result.rows[0]);
  }

  // Preference Categories

  async findPreferenceCategories(
    activeOnly: boolean = true,
  ): Promise<PreferenceCategoryEntity[]> {
    let whereClause = 'WHERE 1=1';
    const values: any[] = [];

    if (activeOnly) {
      whereClause += ' AND is_active = true';
    }

    const query = `SELECT * FROM preference_categories ${whereClause} ORDER BY sort_order, display_name`;
    const result = await this.databaseService.query(query, values);

    return result.rows.map((row) => this.mapRowToPreferenceCategory(row));
  }

  async findPreferenceCategoryByName(
    name: string,
  ): Promise<PreferenceCategoryEntity | null> {
    const query = 'SELECT * FROM preference_categories WHERE name = $1';
    const result = await this.databaseService.query(query, [name]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPreferenceCategory(result.rows[0]);
  }

  // Bulk Operations

  async bulkUpsertUserPreferences(
    userId: string,
    preferences: CreateUserPreferenceDto[],
  ): Promise<UserPreferenceEntity[]> {
    if (preferences.length === 0) {
      return [];
    }

    const values: any[] = [];
    const valueStrings: string[] = [];
    let paramIndex = 1;

    preferences.forEach((pref) => {
      valueStrings.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, NOW(), NOW())`,
      );
      values.push(
        userId,
        pref.key,
        pref.value,
        pref.category,
        pref.isPrivate || false,
        JSON.stringify(pref.metadata || {}),
      );
      paramIndex += 6;
    });

    const query = `
      INSERT INTO user_preferences (user_id, key, value, category, is_private, metadata, created_at, updated_at)
      VALUES ${valueStrings.join(', ')}
      ON CONFLICT (user_id, key) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        category = EXCLUDED.category,
        is_private = EXCLUDED.is_private,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await this.databaseService.query(query, values);
    return result.rows.map((row) => this.mapRowToUserPreference(row));
  }

  // Mapping functions

  private mapRowToUserPreference(row: any): UserPreferenceEntity {
    return {
      id: row.id,
      userId: row.user_id,
      key: row.key,
      value: row.value,
      category: row.category,
      isPrivate: row.is_private,
      metadata:
        typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapRowToPreferenceSchema(row: any): PreferenceSchemaEntity {
    return {
      id: row.id,
      key: row.key,
      category: row.category,
      displayName: row.display_name,
      description: row.description,
      dataType: row.data_type,
      defaultValue: row.default_value,
      validationRules:
        typeof row.validation_rules === 'string'
          ? JSON.parse(row.validation_rules)
          : row.validation_rules,
      isRequired: row.is_required,
      isUserEditable: row.is_user_editable,
      sortOrder: row.sort_order,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapRowToPreferenceCategory(row: any): PreferenceCategoryEntity {
    return {
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      description: row.description,
      icon: row.icon,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
