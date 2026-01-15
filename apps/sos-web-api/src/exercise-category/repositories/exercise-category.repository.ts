import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { ExerciseCategoryEntity } from '../entities/exercise-category.entity';
import {
  ExerciseCategoryFiltersDto,
  ExerciseCategoryListResponseDto,
} from '../dto/exercise-category.dto';

@Injectable()
export class ExerciseCategoryRepository {
  private readonly tableName = 'exercise_categories';

  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(): Promise<ExerciseCategoryEntity[]> {
    return await this.databaseService.knex(this.tableName).select('*');
  }

  async findWithQuery(
    filter?: ExerciseCategoryFiltersDto,
  ): Promise<ExerciseCategoryListResponseDto> {
    const page = Number(filter?.page) > 0 ? Number(filter.page) : 1;
    const limit = Number(filter?.limit) > 0 ? Number(filter.limit) : 10;
    const offset = (page - 1) * limit;

    let baseQuery = this.databaseService.knex(this.tableName);

    // Apply name filter (case-insensitive partial match)
    if (
      filter?.name &&
      typeof filter.name === 'string' &&
      filter.name.trim().length > 0
    ) {
      baseQuery = baseQuery.whereILike('name', `%${filter.name}%`);
    }

    // Count query
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
    const exercise_categories = await baseQuery
      .clone()
      .select('*')
      .orderBy(filter.sortBy || 'name', filter.sortOrder || 'asc')
      .offset(offset)
      .limit(limit);

    return {
      exercise_categories,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<ExerciseCategoryEntity | undefined> {
    return await this.databaseService
      .knex(this.tableName)
      .where({ id })
      .first();
  }

  async findByName(name: string): Promise<ExerciseCategoryEntity | undefined> {
    return await this.databaseService
      .knex(this.tableName)
      .whereILike('name', name)
      .first();
  }

  async create(
    data: Partial<ExerciseCategoryEntity>,
  ): Promise<ExerciseCategoryEntity> {
    const [inserted] = await this.databaseService
      .knex(this.tableName)
      .insert(data)
      .returning('*');
    return inserted;
  }

  async update(
    id: string,
    data: Partial<ExerciseCategoryEntity>,
  ): Promise<ExerciseCategoryEntity | undefined> {
    const [updated] = await this.databaseService
      .knex(this.tableName)
      .where({ id })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    const deleted = await this.databaseService
      .knex(this.tableName)
      .where({ id })
      .del();
    return deleted > 0;
  }
}
