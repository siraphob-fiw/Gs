import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  CreateModifierDto,
  ModifierFiltersDto,
  ModifierListResponseDto,
  ModifierResponseDto,
  UpdateModifierDto,
} from '../dto/modifier.dto';
import { EntityStatus, RequestContext } from '@/types';

@Injectable()
export class ModifierRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(
    filters?: ModifierFiltersDto,
  ): Promise<ModifierListResponseDto> {
    let baseQuery = this.databaseService
      .knex('modifiers as m')
      .leftJoin('modifier_categories as mc', 'm.modifier_category_id', 'mc.id')
      .select('m.*', 'mc.name as modifier_category_name');

    // Apply filters if provided
    if (filters) {
      if (
        filters.name &&
        typeof filters.name === 'string' &&
        filters.name.trim().length > 0
      ) {
        baseQuery = baseQuery.whereILike('m.name', `%${filters.name.trim()}%`);
      }
      if (filters.status && typeof filters.status === 'string') {
        baseQuery = baseQuery.where('m.status', filters.status);
      }
    }

    // Clone for total count before pagination is applied
    const totalQuery = baseQuery.clone();
    const totalResult = await totalQuery
      .clearSelect()
      .count('* as count')
      .first();
    const total = totalResult ? parseInt(totalResult.count as string, 10) : 0;

    // Pagination
    const page = Number(filters?.page) > 0 ? Number(filters?.page) : 1;
    const limit = Number(filters?.limit) > 0 ? Number(filters?.limit) : 10;
    const offset = (page - 1) * limit;

    baseQuery = baseQuery
      .orderBy('m.created_at', 'desc')
      .offset(offset)
      .limit(limit);

    // Get modifiers
    const modifiers = await baseQuery;

    return {
      modifiers: modifiers ?? [],
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<any | undefined> {
    const result = await this.databaseService
      .knex('modifiers')
      .where({ id })
      .first();
    return result;
  }

  async findByName(name: string): Promise<any | undefined> {
    const result = await this.databaseService
      .knex('modifiers')
      .where({ name })
      .first();
    return result;
  }

  async create(
    createModifierDto: CreateModifierDto,
  ): Promise<ModifierResponseDto> {
    const [inserted] = await this.databaseService
      .knex('modifiers')
      .insert(createModifierDto)
      .returning('*');
    return inserted;
  }

  async update(id: string, updateModifierDto: any): Promise<any | undefined> {
    const query = this.databaseService.knex('modifiers').where({ id });

    const [updated] = await query.update(updateModifierDto).returning('*');
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    const query = this.databaseService.knex('modifiers').where({ id });

    const deleted = await query.del();
    return deleted > 0;
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
    let updated = 0;
    let created = 0;
    let failed = 0;
    const errors: string[] = [];
    try {
      for (const modifier of bulkUpdateModifierDto) {
        try {
          if (!modifier.name) {
            failed++;
            errors.push('Modifier missing name, cannot update or create.');
            continue;
          }

          // Try to find the modifier by name (global, no tenant filter)
          const currentModifier = await this.databaseService
            .knex('modifiers')
            .where({
              name: modifier.name,
            })
            .first();

          // Resolve modifier category
          let modifierCategoryId: string | undefined;

          if (modifier.modifier_category_id) {
            let cat;
            // Check if the modifier_category_id looks like a UUID (very naive check)
            const uuidRegex =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(modifier.modifier_category_id)) {
              cat = await this.databaseService
                .knex('modifier_categories')
                .where({
                  id: modifier.modifier_category_id,
                })
                .first();
            }

            if (!cat) {
              // If not found by id, or it didn't look like an id and might be "Range of Motion" (a name)
              cat = await this.databaseService
                .knex('modifier_categories')
                .where({
                  name: modifier.modifier_category_id,
                })
                .first();
            }

            if (cat) {
              modifierCategoryId = cat.id;
            } else {
              // If the provided category (as id or name) does not exist, create a new category using it as name
              const [newCategory] = await this.databaseService
                .knex('modifier_categories')
                .insert({
                  name: modifier.modifier_category_id,
                  status: EntityStatus.ACTIVE,
                })
                .returning('*');
              modifierCategoryId = newCategory.id;
            }
          }

          if (currentModifier) {
            const updatePayload: Record<string, any> = {};
            if (modifier.name !== undefined) updatePayload.name = modifier.name;
            if (modifier.central_stress_factor !== undefined)
              updatePayload.central_stress_factor =
                modifier.central_stress_factor;
            if (modifier.peripheral_stress_factor !== undefined)
              updatePayload.peripheral_stress_factor =
                modifier.peripheral_stress_factor;
            if (modifier.status !== undefined)
              updatePayload.status = modifier.status;
            if (modifierCategoryId)
              updatePayload.modifier_category_id = modifierCategoryId;

            if (Object.keys(updatePayload).length === 0) {
              failed++;
              errors.push(`No fields to update for modifier: ${modifier.name}`);
            } else {
              await this.databaseService
                .knex('modifiers')
                .where({ id: currentModifier.id })
                .update(updatePayload)
                .returning('*');
              updated++;
            }
          } else {
            // Create new modifier
            const payload: Record<string, any> = {
              name: modifier.name,
              status: modifier.status ?? EntityStatus.ACTIVE,
              modifier_category_id: modifierCategoryId,
              central_stress_factor: modifier.central_stress_factor ?? 0,
              peripheral_stress_factor: modifier.peripheral_stress_factor ?? 0,
            };

            const [createdRow] = await this.databaseService
              .knex('modifiers')
              .insert(payload)
              .returning('*');
            if (createdRow) {
              created++;
            } else {
              failed++;
              errors.push(
                `Failed to create modifier with name: ${modifier.name}`,
              );
            }
          }
        } catch (err: any) {
          failed++;
          try {
            await this.databaseService.knex('logs').insert({
              tenant_id: user.tenantId,
              user_id: user.userId,
              short_message: `Error processing modifier "${modifier.name}": ${err?.message ?? String(err)}`,
              full_message: JSON.stringify(err),
              log_level: 'ERROR',
            });
          } catch (loggingError) {
            await this.databaseService.knex('logs').insert({
              tenant_id: user.tenantId,
              user_id: user.userId,
              short_message: `Error logging error for modifier "${modifier.name}": ${loggingError?.message ?? String(loggingError)}`,
              full_message: JSON.stringify(loggingError),
              log_level: 'ERROR',
            });
          }
          errors.push(err?.message ?? String(err));
        }
      }
      return {
        updated,
        created,
        failed,
        errors,
      };
    } catch (error: any) {
      Logger.error('Failed to bulk update modifiers', error);
      return {
        updated: 0,
        created: 0,
        failed: bulkUpdateModifierDto.length,
        errors: [error?.message ?? String(error)],
      };
    }
  }
}
