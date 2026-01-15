import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DatabaseService } from '@/database/database.service';
import {
  CreateTrainingBlockDto,
  WorkoutStatus,
} from '../dto/training-block.dto';
import { TrainingBlockRecord } from '@strengthos/shared-database/dist/models/training-block';
import { UserRole } from '@strengthos/shared-types';

@Injectable()
export class TrainingBlockRepository extends BaseRepository<any> {
  constructor(databaseService: DatabaseService) {
    super(databaseService, 'training_blocks');
  }

  async createTrainingBlock(
    blockData: CreateTrainingBlockDto,
    tenantId: string,
    userId: string,
  ): Promise<TrainingBlockRecord> {
    const now = new Date();

    const user = await this.knex('users')
      .where('id', userId)
      .where('status', '=', 'ACTIVE')
      .first();

    if (!user) throw new BadRequestException('User not found');

    if (user.role === UserRole.ATHLETE) {
      throw new BadRequestException('Athlete cannot create training block');
    }

    const block = await this.knex.transaction(async (trx) => {
      const trainingPayload: any = {
        workout_name: blockData.workoutName,
        workout_method: blockData.workoutMethod,
        workout_type: blockData.workoutType,
        workout_status: WorkoutStatus.ACTIVE,
        is_global:
          (blockData.isGlobal ?? user.role === UserRole.SUPER_ADMIN)
            ? true
            : false,
        is_free: blockData.is_free ?? false,
        summary: JSON.stringify(blockData.summary ?? {}),
        tenant_id: tenantId,
        created_by: userId,
        created_at: now,
        updated_at: now,
      };

      const [createdBlock] = await trx(this.tableName)
        .insert(trainingPayload)
        .returning('*');

      if (blockData.exercises && blockData.exercises.length > 0) {
        const exercisePayload = blockData.exercises.map((exercise) => {
          return {
            training_block_id: createdBlock.id,
            exercise_id: exercise.exerciseId,
            day: exercise.day,
            order: exercise.order,
            // Stringify sets and modifiers to ensure proper JSON type for PostgreSQL
            sets: JSON.stringify(exercise.sets ?? []),
            modifiers: JSON.stringify(exercise.modifiers ?? []),
            summary: JSON.stringify(exercise.summary ?? {}),
            created_at: now,
            updated_at: now,
          };
        });

        await trx('training_blocks_exercises').insert(exercisePayload);
      }

      return createdBlock;
    });

    return block;
  }

  async findTrainingBlockById(
    id: string,
  ): Promise<any | null> {
    let query = this.knex('training_blocks').where({ id });

    const block = await query.first();

    return block || null;
  }

  async findTrainingBlocks(
    userId: string,
    tenantId: string | null | undefined,
    query?: {
      type?: string;
      status?: string;
      page?: number;
      limit?: number;
      isGlobal?: boolean;
      is_free?: boolean;
    },
  ): Promise<{
    blocks: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const user = await this.knex('users')
      .where({ id: userId, status: 'ACTIVE' })
      .first();

    if (!user) {
      return {
        blocks: [],
        total: 0,
        page: query?.page || 1,
        limit: query?.limit || 10,
        totalPages: 0,
      };
    }

    const queryBuilder = this.knex('training_blocks').where((builder) => {
      if (user.role === UserRole.SUPER_ADMIN) return;

      builder.where((sub) => {
        if (user.role === UserRole.TENANT_ADMIN) {
          sub.where({ tenant_id: tenantId }).orWhere('is_global', true);
        } else if (user.role === UserRole.ATHLETE) {
          sub
            .where((inner) => {
              inner.where({ tenant_id: tenantId }).orWhere('is_global', true);
            })
            .andWhere('is_free', true);
        } else {
          sub.where('is_global', true).orWhere((inner) => {
            inner.where('created_by', user.id);
          });
        }
      });
    });

    if (query?.type) {
      queryBuilder.andWhere('workout_type', query.type);
    }

    if (query?.status) {
      queryBuilder.andWhere('workout_status', query.status);
    }

    if (query?.isGlobal !== undefined) {
      queryBuilder.andWhere('is_global', !!query.isGlobal);
    }

    if (query?.is_free !== undefined) {
      queryBuilder.andWhere('is_free', !!query.is_free);
    }

    const totalObj = await queryBuilder.clone().count('* as count').first();
    const totalCount = parseInt((totalObj?.count as string) || '0', 10);

    const page = Math.max(1, query?.page || 1);
    const limit = Math.max(1, query?.limit || 10);
    const offset = (page - 1) * limit;

    const blocks = await queryBuilder
      .clone()
      .orderBy('created_at', 'desc')
      .offset(offset)
      .limit(limit);

    return {
      blocks,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async updateTrainingBlock(
    id: string,
    tenantId: string | null | undefined,
    updateData: any,
    userId: string,
  ): Promise<any> {
    const user = await this._validateUserPermissions(userId);
    await this._getTrainingBlockWithPermissions(id, tenantId, user);

    try {
      return await this.knex.transaction(async (trx) => {
        const updatedBlock = await this._updateBlockRecord(trx, id, updateData);

        // Update exercises if provided
        if (Array.isArray(updateData.exercises)) {
          await this._updateBlockExercises(trx, id, updateData.exercises);
        }

        return updatedBlock;
      });
    } catch (error) {
      Logger.error(
        `Error updating training block with id ${id} for tenant ${tenantId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async _validateUserPermissions(userId: string): Promise<any> {
    const user = await this.knex('users')
      .where('id', userId)
      .where('status', '=', 'ACTIVE')
      .first();

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.role === UserRole.ATHLETE) {
      throw new BadRequestException('Athlete cannot update training block');
    }

    return user;
  }

  private async _getTrainingBlockWithPermissions(
    id: string,
    tenantId: string | null | undefined,
    user: any,
  ): Promise<any> {
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
    const isAdminRole = [UserRole.COACH_ADMIN, UserRole.TENANT_ADMIN].includes(
      user.role,
    );

    let query = this.knex(this.tableName).where({ id });

    if (!isSuperAdmin) {
      if (isAdminRole) {
        query = query.where({ tenant_id: tenantId });
      } else {
        query = query.where({ tenant_id: tenantId, created_by: user.id });
      }
    }

    const trainingBlock = await query.first();

    if (!trainingBlock) {
      throw new NotFoundException(`Training block with ID ${id} not found`);
    }

    return trainingBlock;
  }

  private async _updateBlockRecord(
    trx: any,
    id: string,
    updateData: any,
  ): Promise<any> {
    const blockPayload: any = { updated_at: new Date() };

    // Map update fields
    const fieldMappings = {
      workoutName: 'workout_name',
      workoutMethod: 'workout_method',
      workoutType: 'workout_type',
      workoutStatus: 'workout_status',
      is_free: 'is_free',
    };

    Object.entries(fieldMappings).forEach(([key, dbField]) => {
      if (updateData[key] !== undefined) {
        blockPayload[dbField] = updateData[key];
      }
    });

    if (updateData.summary !== undefined) {
      blockPayload.summary = JSON.stringify(updateData.summary);
    }

    const [updatedBlock] = await trx(this.tableName)
      .where({ id })
      .update(blockPayload)
      .returning('*');

    return updatedBlock;
  }

  private async _updateBlockExercises(
    trx: any,
    blockId: string,
    exercises: any[],
  ): Promise<void> {
    const now = new Date();

    // Get existing exercises
    const existingExercises = await trx('training_blocks_exercises').where({
      training_block_id: blockId,
    });

    const existingMap = new Map<string, any>();
    existingExercises.forEach((ex) => {
      const key = `${ex.exercise_id}:${ex.day}:${ex.order}`;
      existingMap.set(key, ex);
    });

    // Process updates and inserts
    const validExercises = exercises.filter(
      (ex) =>
        ex.exerciseId &&
        typeof ex.day !== 'undefined' &&
        typeof ex.order !== 'undefined',
    );

    const sentKeys = new Set<string>();
    const updates: Promise<any>[] = [];
    const inserts: any[] = [];

    validExercises.forEach((exercise) => {
      const key = `${exercise.exerciseId}:${exercise.day}:${exercise.order}`;
      sentKeys.add(key);

      const existing = existingMap.get(key);

      if (existing) {
        // Prepare update
        const updatePayload = this._buildExerciseUpdatePayload(
          exercise,
          existing,
          now,
        );

        updates.push(
          trx('training_blocks_exercises')
            .where({
              training_block_id: blockId,
              exercise_id: exercise.exerciseId,
              day: exercise.day,
              order: exercise.order,
            })
            .update(updatePayload),
        );
      } else {
        // Prepare insert
        inserts.push({
          training_block_id: blockId,
          exercise_id: exercise.exerciseId,
          day: exercise.day,
          order: exercise.order,
          sets: JSON.stringify(exercise.sets ?? []),
          modifiers: JSON.stringify(exercise.modifiers ?? []),
          summary: JSON.stringify(exercise.summary ?? {}),
          created_at: now,
          updated_at: now,
        });
      }
    });

    // Execute updates and inserts in parallel
    await Promise.all([
      ...updates,
      ...(inserts.length > 0
        ? [trx('training_blocks_exercises').insert(inserts)]
        : []),
    ]);

    // Delete stale exercises
    const staleExercises = existingExercises.filter((ex) => {
      const key = `${ex.exercise_id}:${ex.day}:${ex.order}`;
      return !sentKeys.has(key);
    });

    if (staleExercises.length > 0) {
      const deleteIds = staleExercises.map((ex) => ex.id);
      await trx('training_blocks_exercises').whereIn('id', deleteIds).del();
    }
  }

  private _buildExerciseUpdatePayload(
    exercise: any,
    existing: any,
    now: Date,
  ): any {
    const updatePayload: any = { updated_at: now };

    // Update basic fields
    if (exercise.day !== undefined) updatePayload.day = exercise.day;
    if (exercise.order !== undefined) updatePayload.order = exercise.order;

    // Handle JSON fields with fallback to existing values
    const jsonFields = ['sets', 'modifiers', 'summary'];
    jsonFields.forEach((field) => {
      if (exercise[field] !== undefined && exercise[field] !== null) {
        updatePayload[field] = JSON.stringify(exercise[field]);
      } else if (existing[field]) {
        updatePayload[field] = existing[field];
      }
    });

    return updatePayload;
  }

  async deleteTrainingBlock(
    id: string,
    tenantId: string | null | undefined,
    isSuperAdmin: boolean = false,
  ): Promise<boolean> {
    let query = this.knex(this.tableName).where({ id });

    // SUPER_ADMIN can delete any block regardless of tenant
    if (!isSuperAdmin && tenantId) {
      query = query.andWhere({ tenant_id: tenantId });
    }

    const deletedCount = await query.del();

    return deletedCount > 0;
  }

  //not used
  async createCompletedExerciseSet(completedSetData: {
    training_block_id: string;
    exercise_id: string;
    training_block_exercise_set_id: string;
    actual_reps: number;
    actual_weight: number;
    actual_rpe: number;
    notes?: string;
  }): Promise<any> {
    const [completedSet] = await this.knex(this.tableName)
      .insert({
        ...completedSetData,
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return completedSet;
  }

  async findCompletedExerciseSetsBySession(sessionId: string): Promise<any[]> {
    const completedSets = await this.knex(this.tableName)
      .where({ training_block_id: sessionId })
      .orderBy('created_at', 'asc');

    return completedSets;
  }

  async findCompletedExerciseSetById(id: string): Promise<any | null> {
    const completedSet = await this.knex(this.tableName).where({ id }).first();

    return completedSet || null;
  }

  async updateCompletedExerciseSet(id: string, updateData: any): Promise<any> {
    const [completedSet] = await this.knex(this.tableName)
      .where({ id })
      .update({
        ...updateData,
        updated_at: new Date(),
      })
      .returning('*');

    return completedSet;
  }

  async deleteCompletedExerciseSet(id: string): Promise<boolean> {
    const deletedCount = await this.knex('completed_sets').where({ id }).del();

    return deletedCount > 0;
  }

  async findTrainingBlockExerciseSetById(id: string): Promise<any | null> {
    const exerciseSet = await this.knex('training_blocks_exercises')
      .where({ id })
      .first();

    return exerciseSet || null;
  }
}
