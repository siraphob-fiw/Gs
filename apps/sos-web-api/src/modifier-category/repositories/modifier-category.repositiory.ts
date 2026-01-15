import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ModifierCategoryEntity } from '../entities/modifier-category.entity';
import { ModifierCategoryFiltersDto } from '../dto/modifier-category.dto';

@Injectable()
export class ModifierCategoryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(): Promise<any[]> {
    return await this.databaseService.knex('modifier_categories').select('*');
  }

  async findWithQuery(filter?: ModifierCategoryFiltersDto): Promise<{
    modifier_categories: ModifierCategoryEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Parse pagination early
    const page = Number(filter?.page) > 0 ? Number(filter.page) : 1;
    const limit = Number(filter?.limit) > 0 ? Number(filter.limit) : 10;
    const offset = (page - 1) * limit;

    // Build base query with filtering
    let baseQuery = this.databaseService.knex('modifier_categories');

    if (
      filter?.name &&
      typeof filter.name === 'string' &&
      filter.name.trim().length > 0
    ) {
      baseQuery = baseQuery.whereILike('name', `%${filter.name}%`);
    }

    if (filter?.status && typeof filter.status === 'string') {
      baseQuery = baseQuery.where('status', filter.status);
    }

    // Count query (only selects count)
    const totalResult = await baseQuery
      .clone()
      .clearSelect()
      .count<{ count: string }[]>('* as count')
      .first();
    const total =
      totalResult && typeof totalResult.count === 'string'
        ? parseInt(totalResult.count, 10)
        : 0;

    // Get paginated & sorted data
    const modifier_categories = await baseQuery
      .clone()
      .select('*')
      .orderBy('created_at', 'desc')
      .offset(offset)
      .limit(limit);

    return {
      modifier_categories,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<any | undefined> {
    const result = await this.databaseService
      .knex('modifier_categories')
      .where({ id })
      .first();
    return result;
  }

  async create(createModifierDto: any): Promise<any> {
    const [inserted] = await this.databaseService
      .knex('modifier_categories')
      .insert(createModifierDto)
      .returning('*');
    return inserted;
  }

  async update(id: string, updateModifierDto: any): Promise<any | undefined> {
    const query = this.databaseService
      .knex('modifier_categories')
      .where({ id });

    const [updated] = await query.update(updateModifierDto).returning('*');
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    const query = this.databaseService
      .knex('modifier_categories')
      .where({ id });

    const deleted = await query.del();
    return deleted > 0;
  }
}
