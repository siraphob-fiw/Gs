import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database';
import { SystemConfigEntity } from '../entities/system-config.entity';
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
} from '../dto/admin-request.dto';

@Injectable()
export class SystemConfigRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(configDto: CreateSystemConfigDto): Promise<SystemConfigEntity> {
    const query = `
      INSERT INTO system_configs (key, value, description, category, is_public, validation_schema, default_value, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      configDto.key,
      configDto.value,
      configDto.description,
      configDto.category,
      configDto.isPublic,
      configDto.validationSchema,
      configDto.defaultValue,
    ];

    const result = await this.databaseService.query(query, values);
    return this.mapRowToSystemConfig(result.rows[0]);
  }

  async findAll(filters?: {
    category?: string;
    isPublic?: boolean;
  }): Promise<SystemConfigEntity[]> {
    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.category) {
      whereClause += ` AND category = $${paramIndex}`;
      values.push(filters.category);
      paramIndex++;
    }

    if (filters?.isPublic !== undefined) {
      whereClause += ` AND is_public = $${paramIndex}`;
      values.push(filters.isPublic);
      paramIndex++;
    }

    const query = `SELECT * FROM system_configs ${whereClause} ORDER BY category, key`;
    const result = await this.databaseService.query(query, values);

    return result.rows.map((row) => this.mapRowToSystemConfig(row));
  }

  async findByKey(key: string): Promise<SystemConfigEntity | null> {
    const query = 'SELECT * FROM system_configs WHERE key = $1';
    const result = await this.databaseService.query(query, [key]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSystemConfig(result.rows[0]);
  }

  async findById(id: string): Promise<SystemConfigEntity | null> {
    const query = 'SELECT * FROM system_configs WHERE id = $1';
    const result = await this.databaseService.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSystemConfig(result.rows[0]);
  }

  async update(
    id: string,
    updateDto: UpdateSystemConfigDto,
  ): Promise<SystemConfigEntity | null> {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateDto.value !== undefined) {
      setClause.push(`value = $${paramIndex}`);
      values.push(updateDto.value);
      paramIndex++;
    }

    if (updateDto.description !== undefined) {
      setClause.push(`description = $${paramIndex}`);
      values.push(updateDto.description);
      paramIndex++;
    }

    if (updateDto.isPublic !== undefined) {
      setClause.push(`is_public = $${paramIndex}`);
      values.push(updateDto.isPublic);
      paramIndex++;
    }

    if (updateDto.validationSchema !== undefined) {
      setClause.push(`validation_schema = $${paramIndex}`);
      values.push(updateDto.validationSchema);
      paramIndex++;
    }

    if (updateDto.defaultValue !== undefined) {
      setClause.push(`default_value = $${paramIndex}`);
      values.push(updateDto.defaultValue);
      paramIndex++;
    }

    if (setClause.length === 0) {
      return this.findById(id);
    }

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE system_configs 
      SET ${setClause.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.databaseService.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSystemConfig(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM system_configs WHERE id = $1';
    const result = await this.databaseService.query(query, [id]);

    return result.rowCount > 0;
  }

  async findByCategory(category: string): Promise<SystemConfigEntity[]> {
    const query =
      'SELECT * FROM system_configs WHERE category = $1 ORDER BY key';
    const result = await this.databaseService.query(query, [category]);

    return result.rows.map((row) => this.mapRowToSystemConfig(row));
  }

  async getCategories(): Promise<string[]> {
    const query =
      'SELECT DISTINCT category FROM system_configs ORDER BY category';
    const result = await this.databaseService.query(query);

    return result.rows.map((row) => row.category);
  }

  private mapRowToSystemConfig(row: any): SystemConfigEntity {
    return {
      id: row.id,
      key: row.key,
      value: row.value,
      description: row.description,
      category: row.category,
      isPublic: row.is_public,
      validationSchema: row.validation_schema,
      defaultValue: row.default_value,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
