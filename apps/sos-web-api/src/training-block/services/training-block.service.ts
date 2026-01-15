import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { TrainingBlockRepository } from '../repositories/training-block.repository';
import { TrainingBlockRecord } from '@strengthos/shared-database';
import {
  CreateTrainingBlockDto,
  UpdateTrainingBlockDto,
  WorkoutStatus,
} from '../dto/training-block.dto';
import { DatabaseService } from '@/database/database.service';
import { WorkoutMethod, WorkoutType } from '../dto/training-block.dto';
import { ModifierInput } from '@/training-session/dto/training-session.dto';
import { UserRole } from '@strengthos/shared-types';
import { StressMetricsService } from '@/training-session/services/stress-metrics.service';

interface ParsedModifier {
  modifierId: string;
  clusters?: number;
}
export interface TrainingBlock {
  id: string;
  workoutName: string;
  workoutMethod: WorkoutMethod;
  workoutType: WorkoutType;
  workoutStatus: WorkoutStatus;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  isGlobal: boolean;
  is_free: boolean;
  createdBy: string;
  createdByName?: string;
  updatedBy: string;
  summary?: Record<string, any>;
}

export interface TrainingBlockWithExercises extends TrainingBlock {
  exercises: TrainingBlockExercise[];
  tenantName?: string | null;
}

export interface TrainingBlockSession {
  id: string;
  workoutId: string;
  dayOfWeek: number;
  scheduledDate: Date;
  tenantId: string;
  athleteId: string;
  sessionStatus: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingBlockExercise {
  id: string;
  trainingBlockId: string;
  exerciseId: string;
  exerciseName?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  day: number;
  sets: {
    reps: number;
    rpe: number;
  }[];
  modifiers: string[];
  summary: Record<string, any>;
}

@Injectable()
export class TrainingBlockService {
  private readonly logger = new Logger(TrainingBlockService.name);

  private PATTERN_TYPES = [
    'Horizontal push',
    'Vertical push',
    'Horizontal pull',
    'Vertical pull',
    'Knee dominant',
    'Hip dominant',
  ];

  constructor(
    private readonly trainingBlockRepository: TrainingBlockRepository,
    private readonly databaseService: DatabaseService,
    private readonly stressMetricsService: StressMetricsService,
  ) {}

  private async mapTrainingBlockRecordToInterface(
    record: TrainingBlockRecord,
  ): Promise<TrainingBlock> {
    return {
      id: record.id,
      workoutName: record.workout_name,
      workoutMethod: record.workout_method,
      workoutType: record.workout_type,
      workoutStatus: record.workout_status as WorkoutStatus,
      tenantId: record.tenant_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      isGlobal: record.is_global,
      is_free: record.is_free,
      createdBy: record.created_by,
      updatedBy: record.updated_by,
      summary: record.summary,
    };
  }

  async createTrainingBlock(
    createDto: CreateTrainingBlockDto,
    tenantId: string,
    userId: string,
  ): Promise<TrainingBlockWithExercises> {
    try {
      const blockRecord =
        await this.trainingBlockRepository.createTrainingBlock(
          createDto,
          tenantId,
          userId,
        );

      const block = await this.mapTrainingBlockRecordToInterface(blockRecord);

      return await this.mapBlockEntityToResponse(block);
    } catch (error) {
      this.logger.error(`Failed to create training block: ${error}`);
      throw new BadRequestException(
        `Failed to create training block: ${error}`,
      );
    }
  }

  async getTrainingBlock(
    id: string,
    tenantId: string | null | undefined,
  ): Promise<TrainingBlockWithExercises> {
    const blockRecord =
      await this.trainingBlockRepository.findTrainingBlockById(id);

    if (!blockRecord) {
      throw new NotFoundException(`Training block with ID ${id} not found`);
    }

    const block = await this.mapTrainingBlockRecordToInterface(blockRecord);

    // if (block.summary == null) {
    const summary = await this.calculateSummary(block);
    block.summary = {
      nl: summary.nl ?? 0,
      totalStress: summary.totalStress ?? 0,
      centralStress: summary.centralStress ?? 0,
      peripheralStress: summary.peripheralStress ?? 0,
      csBalance: summary.csBalance ?? 0,
      patterns: summary.patterns ?? [],
    };

    // First, update the block summary only (don't pass exercises to avoid deletion)
    try {
      const updatedBlock =
        await this.trainingBlockRepository.updateTrainingBlock(
          block.id,
          tenantId,
          {
            summary: block.summary,
          },
          block.createdBy,
        );

      if (!updatedBlock) {
        this.logger.warn(`Failed to update training block ${block.id} summary`);
      } else {
        this.logger.log(
          `Successfully updated training block ${block.id} summary`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error updating training block ${block.id} summary: ${error.message}`,
        error.stack,
      );
      // Continue execution - summary is already set in memory
    }

    // Then, update exercise summaries directly (without affecting other exercise data)
    if (
      summary?.exercises &&
      Array.isArray(summary.exercises) &&
      summary.exercises.length > 0
    ) {
      try {
        const updates = summary.exercises
          .filter(
            (exerciseSummary) =>
              exerciseSummary?.summary !== null &&
              exerciseSummary?.exerciseId !== undefined &&
              exerciseSummary?.day !== undefined &&
              exerciseSummary?.order !== undefined,
          )
          .map((exerciseSummary) => {
            return this.databaseService
              .knex('training_blocks_exercises')
              .where({
                training_block_id: block.id,
                exercise_id: exerciseSummary.exerciseId,
                day: exerciseSummary.day,
                order: exerciseSummary.order,
              })
              .update({
                summary: JSON.stringify(exerciseSummary.summary),
                updated_at: new Date(),
              });
          });

        // Await all updates in parallel
        const updateResults = await Promise.all(updates);
        const updatedCount = updateResults.reduce(
          (acc, cur) => acc + (cur > 0 ? 1 : 0),
          0,
        );

        if (updatedCount > 0) {
          Logger.log(
            `Successfully updated ${updatedCount} exercise summaries for training block ${block.id}`,
          );
        }
      } catch (error) {
        Logger.error(
          `Error updating exercise summaries for training block ${block.id}: ${error?.message ?? error}`,
          error?.stack,
        );
        // Continue execution - block summary is already updated
      }
    }
    // }

    // Always map entity to response (to get updated summary if calculated)
    return await this.mapBlockEntityToResponse(block);
  }

  async getTrainingBlocks(
    query: any,
    userId: string,
    tenantId: string | null | undefined,
  ): Promise<{
    blocks: TrainingBlockWithExercises[];
    total: number;
    page: number;
    limit: number;
  }> {
    const blockRecords = await this.trainingBlockRepository.findTrainingBlocks(
      userId,
      tenantId,
      query,
    );

    const blocks = await Promise.all(
      blockRecords.blocks.map(async (record) => {
        const block = await this.mapTrainingBlockRecordToInterface(record);
        return await this.mapBlockEntityToResponse(block);
      }),
    );
    return {
      blocks,
      total: blocks.length,
      page: query.page ? query.page : 1,
      limit: query.limit ? query.limit : 10,
    };
  }

  async updateTrainingBlock(
    id: string,
    updateDto: UpdateTrainingBlockDto,
    tenantId: string | null | undefined,
    userId: string,
  ): Promise<TrainingBlockWithExercises> {
    const updatedRecord =
      await this.trainingBlockRepository.updateTrainingBlock(
        id,
        tenantId,
        updateDto,
        userId,
      );
    if (!updatedRecord) {
      throw new NotFoundException(
        `Training block with ID ${id} not found after update`,
      );
    }

    const block = await this.mapTrainingBlockRecordToInterface(updatedRecord);
    return await this.mapBlockEntityToResponse(block);
  }

  async deleteTrainingBlock(
    id: string,
    tenantId: string | null | undefined,
    userId: string,
  ): Promise<void> {
    this.logger.log(`Deleting training block: ${id} for tenant: ${tenantId}`);

    const existingBlock =
      await this.trainingBlockRepository.findTrainingBlockById(id);

    // Check if user is SUPER_ADMIN
    let isSuperAdmin = false;
    if (userId) {
      const user = await this.databaseService
        .knex('users')
        .where('id', userId)
        .first();
      isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

      if (!isSuperAdmin) {
        throw new BadRequestException(
          `You are not permitted to delete training blocks`,
        );
      }
    }

    if (!existingBlock) {
      throw new NotFoundException(`Training block with ID ${id} not found`);
    }

    const deleted = await this.trainingBlockRepository.deleteTrainingBlock(
      id,
      tenantId,
    );
    if (!deleted) {
      throw new BadRequestException(
        `Failed to delete training block with ID ${id}`,
      );
    }

    this.logger.log(`Successfully deleted training block: ${id}`);
  }

  private async mapBlockEntityToResponse(
    block: TrainingBlock,
  ): Promise<TrainingBlockWithExercises> {
    const exercises = await this.databaseService
      .knex('training_blocks_exercises')
      .join(
        'exercises',
        'training_blocks_exercises.exercise_id',
        'exercises.id',
      )
      .select('training_blocks_exercises.*', 'exercises.name as exercise_name')
      .where({
        training_block_id: block.id,
      });

    // Map/normalize exercises to match expected response shape
    const mappedExercises = (exercises || []).map((exercise) => ({
      id: exercise.id,
      trainingBlockId: exercise.training_block_id,
      exerciseId: exercise.exercise_id,
      exerciseName: exercise.exercise_name,
      order: exercise.order,
      createdAt: exercise.created_at,
      updatedAt: exercise.updated_at,
      day: exercise.day,
      sets: exercise.sets,
      modifiers: exercise.modifiers ? exercise.modifiers : [],
      summary: exercise.summary ? exercise.summary : {},
    }));

    return {
      id: block.id,
      workoutName: block.workoutName,
      workoutMethod: block.workoutMethod,
      workoutType: block.workoutType,
      workoutStatus: block.workoutStatus as WorkoutStatus,
      tenantId: block.tenantId,
      tenantName:
        block.tenantId !== null
          ? ((
              await this.databaseService
                .knex('tenants')
                .where('id', block.tenantId)
                .first()
            )?.name ?? null)
          : null,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
      exercises: mappedExercises,
      isGlobal: block.isGlobal,
      is_free: block.is_free,
      createdBy: block.createdBy,
      createdByName: await this.databaseService
        .knex('users')
        .where('id', block.createdBy)
        .select('first_name', 'last_name')
        .first()
        .then((user) => `${user.first_name} ${user.last_name}`),
      updatedBy: block.updatedBy,
      summary: block.summary,
    };
  }

  private mapExerciseDbRow(row: any) {
    let sets = [];
    if (row.sets) {
      try {
        sets = typeof row.sets === 'string' ? JSON.parse(row.sets) : row.sets;
      } catch {
        sets = [];
      }
    }
    let modifiers = [];
    if (row.modifiers) {
      try {
        modifiers =
          typeof row.modifiers === 'string'
            ? JSON.parse(row.modifiers)
            : row.modifiers;
      } catch {
        modifiers = [];
      }
    }
    return {
      ...row,
      sets,
      modifiers,
    };
  }

  private async calculateSummary(
    block: TrainingBlock,
  ): Promise<Record<string, any>> {
    // 1. Fetch all exercises (block-exercises) for the block
    const exercisesRaw = await this.databaseService
      .knex('training_blocks_exercises')
      .join(
        'exercises',
        'training_blocks_exercises.exercise_id',
        'exercises.id',
      )
      .select(
        'training_blocks_exercises.*',
        'exercises.name as exercise_name',
        'exercises.central_stress_factor as central_stress_factor',
        'exercises.peripheral_stress_factor as peripheral_stress_factor',
        'exercises.exercise_type as exercise_type',
      )
      .where({
        training_block_id: block.id,
      });

    const patternMetrics = this.PATTERN_TYPES.map((type) => ({
      type,
      nl: 0,
      peripheralStress: 0,
      centralStress: 0,
      totalStress: 0,
      csBalance: 0,
    }));

    const exerciseMetrics: Array<any> = [];

    let totalMetrics = {
      nl: 0,
      peripheral: 0,
      central: 0,
      total: 0,
      csBalance: 0,
    };

    for (const exerciseRow of exercisesRaw) {
      const exercise = this.mapExerciseDbRow(exerciseRow);

      const exerciseType = exercise.exercise_type ?? exerciseRow.exercise_type;

      const pattern = patternMetrics.find(
        (p) => p.type === String(exerciseType),
      );

      let csFactor = Number(
        exercise.central_stress_factor ??
          exerciseRow.central_stress_factor ??
          0,
      );
      let psFactor = Number(
        exercise.peripheral_stress_factor ??
          exerciseRow.peripheral_stress_factor ??
          0,
      );

      // Apply modifier adjustments if modifiers exist
      if (Array.isArray(exercise.modifiers) && exercise.modifiers.length > 0) {
        const modifierAdjustments = await this.getModifierAdjustments(
          exercise.modifiers,
        );
        csFactor = csFactor * modifierAdjustments.centralAdjustment;
        psFactor = psFactor * modifierAdjustments.peripheralAdjustment;
      }

      let exerciseNL = 0;
      let exercisePeripheral = 0;
      let exerciseCentral = 0;

      if (Array.isArray(exercise.sets)) {
        for (const set of exercise.sets) {
          const reps =
            typeof set?.reps === 'number' ? set.reps : Number(set?.reps) || 0;
          const rpe =
            typeof set?.rpe === 'number' ? set.rpe : Number(set?.rpe) || 0;

          const hasValidReps = Number.isFinite(reps) && reps > 0;
          const hasValidRpe = Number.isFinite(rpe) && rpe > 0 && rpe <= 10;

          if (hasValidReps) {
            exerciseNL += reps;
          }

          if (hasValidReps && hasValidRpe) {
            const stress = await this.stressMetricsService.calculateSetStress(
              reps,
              rpe,
              csFactor,
              psFactor,
            );
            exercisePeripheral += stress.peripheralStress;
            exerciseCentral += stress.centralStress;
          }
        }
      }

      // Calculate exercise total stress: (central + peripheral) / 2
      const exerciseTotalStress = (exerciseCentral + exercisePeripheral) / 2;
      const exerciseCsBalance =
        exerciseTotalStress > 0
          ? (exerciseCentral / exerciseTotalStress) * 100
          : 0;

      // Accumulate totals
      totalMetrics.nl += exerciseNL;
      totalMetrics.peripheral += exercisePeripheral;
      totalMetrics.central += exerciseCentral;

      // Store exercise metrics
      exerciseMetrics.push({
        exerciseId: exercise.exercise_id,
        day: exercise.day,
        order: exercise.order,
        summary: {
          nl: exerciseNL,
          peripheralStress: parseFloat(exercisePeripheral.toFixed(2)),
          centralStress: parseFloat(exerciseCentral.toFixed(2)),
          totalStress: parseFloat(exerciseTotalStress.toFixed(2)),
          csBalance: parseFloat(exerciseCsBalance.toFixed(1)),
        },
      });

      // Accumulate pattern metrics
      if (pattern) {
        pattern.nl += exerciseNL;
        pattern.peripheralStress += exercisePeripheral;
        pattern.centralStress += exerciseCentral;
      }
    }

    totalMetrics.total = (totalMetrics.central + totalMetrics.peripheral) / 2;
    totalMetrics.csBalance =
      totalMetrics.total > 0
        ? (totalMetrics.central / totalMetrics.total) * 100
        : 0;

    // Calculate pattern totals and csBalance after aggregation
    for (const pattern of patternMetrics) {
      pattern.totalStress =
        (pattern.centralStress + pattern.peripheralStress) / 2;
      pattern.csBalance =
        pattern.totalStress > 0
          ? parseFloat(
              ((pattern.centralStress / pattern.totalStress) * 100).toFixed(1),
            )
          : 0;

      // Format pattern metrics consistently
      pattern.peripheralStress = parseFloat(
        pattern.peripheralStress.toFixed(2),
      );
      pattern.centralStress = parseFloat(pattern.centralStress.toFixed(2));
      pattern.totalStress = parseFloat(pattern.totalStress.toFixed(2));
    }

    return {
      nl: totalMetrics.nl,
      totalStress: parseFloat(totalMetrics.total.toFixed(2)),
      centralStress: parseFloat(totalMetrics.central.toFixed(2)),
      peripheralStress: parseFloat(totalMetrics.peripheral.toFixed(2)),
      csBalance: parseFloat(totalMetrics.csBalance.toFixed(1)),
      patterns: patternMetrics,
      exercises: exerciseMetrics,
    };
  }

  /**
   * Parse modifier inputs into a standardized format.
   * Handles both simple string IDs and objects with modifierId + clusters.
   */
  private parseModifierInputs(modifiers: ModifierInput[]): ParsedModifier[] {
    return modifiers.map((modifier) => {
      if (typeof modifier === 'string') {
        return { modifierId: modifier };
      }
      // It's a ModifierWithParams object
      return {
        modifierId: modifier.modifierId,
        clusters: modifier.clusters,
      };
    });
  }

  /**
   * Get modifier adjustments from database.
   * Supports both standard modifiers and cluster-based modifiers (Myo-reps).
   *
   * For standard modifiers: Uses central_stress_factor and peripheral_stress_factor directly as multipliers
   * For cluster-based modifiers (Myo-reps):
   *   CS_multiplier = cs_base_multiplier + (cs_cluster_increment × clusters)
   *   PS_multiplier = ps_base_multiplier + (ps_cluster_increment × clusters)
   *
   * @param modifierInputs - Array of modifier IDs or modifier objects with params
   * @returns Combined multipliers for central and peripheral stress
   */
  private async getModifierAdjustments(
    modifierInputs: ModifierInput[],
  ): Promise<{ centralAdjustment: number; peripheralAdjustment: number }> {
    if (!modifierInputs || modifierInputs.length === 0) {
      return { centralAdjustment: 1, peripheralAdjustment: 1 };
    }

    const parsedModifiers = this.parseModifierInputs(modifierInputs);

    try {
      const modifierIds = parsedModifiers.map((m) => m.modifierId);

      const modifiers = await this.databaseService
        .knex('modifiers')
        .select(
          'id',
          'central_stress_factor',
          'peripheral_stress_factor',
          'cs_base_multiplier',
          'cs_cluster_increment',
          'ps_base_multiplier',
          'ps_cluster_increment',
          'uses_cluster_calculation',
        )
        .whereIn('id', modifierIds);

      if (!modifiers || modifiers.length === 0) {
        return { centralAdjustment: 1, peripheralAdjustment: 1 };
      }

      // Create a map of modifier ID to cluster count from input
      const clusterMap = new Map<string, number | undefined>();
      for (const pm of parsedModifiers) {
        clusterMap.set(pm.modifierId, pm.clusters);
      }

      // Calculate combined multiplier (multiply all modifier adjustments together)
      let centralMultiplier = 1;
      let peripheralMultiplier = 1;

      for (const modifier of modifiers) {
        const usesClusterCalc = Boolean(modifier.uses_cluster_calculation);
        const clusters = clusterMap.get(modifier.id);

        if (usesClusterCalc) {
          // Myo-reps formula:
          // CS_Myo = Base_CS × (cs_base_multiplier + cs_cluster_increment × clusters)
          // PS_Myo = Base_PS × (ps_base_multiplier + ps_cluster_increment × clusters)
          const csBase = Number(modifier.cs_base_multiplier) || 1.1;
          const csIncrement = Number(modifier.cs_cluster_increment) || 0.02;
          const psBase = Number(modifier.ps_base_multiplier) || 1.25;
          const psIncrement = Number(modifier.ps_cluster_increment) || 0.05;

          // Default to 3 clusters if not specified (typical Myo-reps minimum)
          const clusterCount = clusters ?? 3;

          const csMultiplier = csBase + csIncrement * clusterCount;
          const psMultiplier = psBase + psIncrement * clusterCount;

          centralMultiplier *= csMultiplier;
          peripheralMultiplier *= psMultiplier;

          this.logger.debug(
            `Myo-reps modifier applied: clusters=${clusterCount}, CS_mult=${csMultiplier.toFixed(2)}, PS_mult=${psMultiplier.toFixed(2)}`,
          );
        } else {
          // Standard modifier: use the stress factors as multipliers
          const cs = Number(modifier.central_stress_factor);
          const ps = Number(modifier.peripheral_stress_factor);

          if (Number.isFinite(cs) && cs > 0) {
            centralMultiplier *= cs;
          }
          if (Number.isFinite(ps) && ps > 0) {
            peripheralMultiplier *= ps;
          }
        }
      }

      return {
        centralAdjustment: centralMultiplier,
        peripheralAdjustment: peripheralMultiplier,
      };
    } catch (error) {
      const ids = parsedModifiers.map((m) => m.modifierId).join(', ');
      this.logger.warn(
        `Failed to fetch modifier adjustments for ids ${ids}: ${error.message}`,
      );
      return { centralAdjustment: 1, peripheralAdjustment: 1 };
    }
  }
}
