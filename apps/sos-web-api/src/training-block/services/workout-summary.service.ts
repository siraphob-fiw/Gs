import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { StressMetricsService } from '@/training-session/services/stress-metrics.service';
import { ModifierInput } from '@/training-session/dto/training-session.dto';

interface ExerciseInput {
  exerciseId: string;
  order: number;
  day: number;
  sets: { reps: number; rpe: number }[];
  modifiers: ModifierInput[];
}

interface CalculateSummaryInput {
  exercises: ExerciseInput[];
}

interface PatternSummary {
  type: string;
  nl: number;
  peripheralStress: number;
  centralStress: number;
  totalStress: number;
  csBalance: number;
}

interface ExerciseMetric {
  exerciseId: string;
  day: number;
  order: number;
  summary: {
    nl: number;
    totalStress: number;
    centralStress: number;
    peripheralStress: number;
    csBalance: number;
  };
}

export interface WorkoutSummaryResult {
  exercises: ExerciseMetric[];
  patterns: PatternSummary[];
  total: {
    nl: number;
    peripheral: number;
    central: number;
    total: number;
    csBalance: number;
  };
}

interface ParsedModifier {
  modifierId: string;
  clusters?: number;
}

@Injectable()
export class WorkoutSummaryService {
  private readonly logger = new Logger(WorkoutSummaryService.name);

  private readonly PATTERN_TYPES = [
    'Horizontal push',
    'Vertical push',
    'Horizontal pull',
    'Vertical pull',
    'Knee dominant',
    'Hip dominant',
  ];

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly stressMetricsService: StressMetricsService,
  ) {}

  /**
   * Calculate workout summary from provided exercises data.
   * This is used for real-time calculation in the frontend when building/editing workouts.
   */
  async calculateSummary(
    input: CalculateSummaryInput,
  ): Promise<WorkoutSummaryResult> {
    const { exercises } = input;

    if (!exercises || exercises.length === 0) {
      return this.getEmptySummary();
    }

    // Fetch exercise data for all exercise IDs
    const exerciseIds = [...new Set(exercises.map((e) => e.exerciseId))];
    const exercisesData = await this.databaseService
      .knex('exercises')
      .select(
        'id',
        'name',
        'exercise_type',
        'central_stress_factor',
        'peripheral_stress_factor',
      )
      .whereIn('id', exerciseIds);

    const exerciseMap = new Map<
      string,
      {
        id: string;
        name: string;
        exerciseType: string;
        centralStressFactor: number;
        peripheralStressFactor: number;
      }
    >();
    exercisesData.forEach((ex) => {
      exerciseMap.set(ex.id, {
        id: ex.id,
        name: ex.name,
        exerciseType: ex.exercise_type,
        centralStressFactor: Number(ex.central_stress_factor) || 0,
        peripheralStressFactor: Number(ex.peripheral_stress_factor) || 0,
      });
    });

    const patternMetrics: PatternSummary[] = this.PATTERN_TYPES.map((type) => ({
      type,
      nl: 0,
      peripheralStress: 0,
      centralStress: 0,
      totalStress: 0,
      csBalance: 0,
    }));

    const exerciseMetrics: ExerciseMetric[] = [];

    const totalMetrics = {
      nl: 0,
      peripheral: 0,
      central: 0,
      total: 0,
      csBalance: 0,
    };

    for (const exercise of exercises) {
      const exerciseData = exerciseMap.get(exercise.exerciseId);
      if (!exerciseData) {
        continue;
      }

      const exerciseType = exerciseData.exerciseType;
      const pattern = patternMetrics.find(
        (p) => p.type === String(exerciseType),
      );

      let csFactor = exerciseData.centralStressFactor;
      let psFactor = exerciseData.peripheralStressFactor;

      // Apply modifier adjustments if modifiers exist
      if (exercise.modifiers && exercise.modifiers.length > 0) {
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

          // Count NL for all sets with valid reps
          if (hasValidReps) {
            exerciseNL += reps;
          }

          // Calculate stress only for working sets with both valid reps AND valid RPE
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
        exerciseId: exercise.exerciseId,
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
      exercises: exerciseMetrics,
      patterns: patternMetrics,
      total: {
        nl: totalMetrics.nl,
        peripheral: parseFloat(totalMetrics.peripheral.toFixed(2)),
        central: parseFloat(totalMetrics.central.toFixed(2)),
        total: parseFloat(totalMetrics.total.toFixed(2)),
        csBalance: parseFloat(totalMetrics.csBalance.toFixed(1)),
      },
    };
  }

  private getEmptySummary(): WorkoutSummaryResult {
    return {
      exercises: [],
      patterns: this.PATTERN_TYPES.map((type) => ({
        type,
        nl: 0,
        peripheralStress: 0,
        centralStress: 0,
        totalStress: 0,
        csBalance: 0,
      })),
      total: {
        nl: 0,
        peripheral: 0,
        central: 0,
        total: 0,
        csBalance: 0,
      },
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
      return {
        modifierId: modifier.modifierId,
        clusters: modifier.clusters,
      };
    });
  }

  /**
   * Get modifier adjustments from database.
   * Supports both standard modifiers and cluster-based modifiers (Myo-reps).
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

      // Calculate combined multiplier
      let centralMultiplier = 1;
      let peripheralMultiplier = 1;

      for (const modifier of modifiers) {
        const usesClusterCalc = Boolean(modifier.uses_cluster_calculation);
        const clusters = clusterMap.get(modifier.id);

        if (usesClusterCalc) {
          const csBase = Number(modifier.cs_base_multiplier) || 1.1;
          const csIncrement = Number(modifier.cs_cluster_increment) || 0.02;
          const psBase = Number(modifier.ps_base_multiplier) || 1.25;
          const psIncrement = Number(modifier.ps_cluster_increment) || 0.05;

          const clusterCount = clusters ?? 3;

          const csMultiplier = csBase + csIncrement * clusterCount;
          const psMultiplier = psBase + psIncrement * clusterCount;

          centralMultiplier *= csMultiplier;
          peripheralMultiplier *= psMultiplier;
        } else {
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
