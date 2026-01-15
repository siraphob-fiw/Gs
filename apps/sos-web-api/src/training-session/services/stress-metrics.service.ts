import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import {
  SessionExerciseValues,
  ModifierInput,
} from '../dto/training-session.dto';
import { RpeCalculationService } from './rpe-calculation.service';

export interface SetStressResult {
  centralStress: number;
  peripheralStress: number;
  totalStress: number;
}

/**
 * Parsed modifier with extracted ID and optional cluster count
 */
interface ParsedModifier {
  modifierId: string;
  clusters?: number;
}

export interface ExerciseMetricsResult {
  perSetBreakdown: Array<{
    reps: number;
    rpe: number;
    centralStress: number;
    peripheralStress: number;
    totalStress: number;
  }>;
  exercise: {
    totalCentralStress: number;
    totalPeripheralStress: number;
    totalStress: number;
    tonnage: number;
    e1rm: number;
    nl: number;
  };
  tonnage: number;
  e1rm: number;
  nl: number;
  peripheral_stress: number;
  central_stress: number;
  total_stress: number;
}

/**
 * Service for calculating stress metrics (central, peripheral, total)
 * based on exercise performance data.
 */
@Injectable()
export class StressMetricsService {
  private readonly SCALING_FACTORS = {
    Kc: 100,
    Kp: 200,
  };

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly rpeCalculationService: RpeCalculationService,
  ) {}

  async calculateSetStress(
    reps: number,
    rpe: number,
    exerciseCs: number,
    exercisePs: number,
  ): Promise<SetStressResult> {
    const globalSettings = await this.databaseService
      .knex('global_settings')
      .where('config_key', 'scaling_factor')
      .first();

    const scalingFactors = JSON.parse(globalSettings?.data ?? '{}');
    const Kc = scalingFactors.Kc ?? this.SCALING_FACTORS.Kc;
    const Kp = scalingFactors.Kp ?? this.SCALING_FACTORS.Kp;

    // Validate inputs
    if (
      !Number.isFinite(reps) ||
      !Number.isFinite(rpe) ||
      !Number.isFinite(exerciseCs) ||
      !Number.isFinite(exercisePs) ||
      reps <= 0 ||
      rpe > 10 ||
      exerciseCs < 0 ||
      exercisePs < 0
    ) {
      return Promise.resolve({
        centralStress: 0,
        peripheralStress: 0,
        totalStress: 0,
      });
    }

    // 1. Normalize Exercise Scores (0-9 scale normalized to 0-1)
    const CS_factor = exerciseCs / 9;
    const PS_factor = exercisePs / 9;

    // 2. Base Stress (E=RPE, R=Reps)
    const baseCentralIntensity = rpe ** 2; // E²
    const basePeripheralVolume = (reps ** 2 * rpe ** 2) / 5; // (R² * E²)/5

    // 3. Central Stress: (Base_central_intensity * CS_factor) / Kc
    const centralStress = (baseCentralIntensity * CS_factor) / Kc;

    // 4. Peripheral Stress: (Base_peripheral_volume * PS_factor) / Kp
    const peripheralStress = (basePeripheralVolume * PS_factor) / Kp;

    // 5. Total Stress: (Central_set + Peripheral_set) / 2
    const totalStress = (centralStress + peripheralStress) / 2;

    return {
      centralStress: parseFloat(centralStress.toFixed(2)),
      peripheralStress: parseFloat(peripheralStress.toFixed(2)),
      totalStress: parseFloat(totalStress.toFixed(2)),
    };
  }

  /**
   * Calculate comprehensive metrics for an exercise
   * @param actual - Array of actual set values
   * @param exerciseId - Exercise ID
   * @param modifiers - Array of modifier IDs or modifier objects with params (e.g., { modifierId, clusters })
   */
  async calculateExerciseMetrics(
    actual: SessionExerciseValues[],
    exerciseId: string,
    modifiers?: ModifierInput[],
  ): Promise<ExerciseMetricsResult> {
    const result: ExerciseMetricsResult = {
      perSetBreakdown: [],
      exercise: {
        totalCentralStress: 0,
        totalPeripheralStress: 0,
        totalStress: 0,
        tonnage: 0,
        e1rm: 0,
        nl: 0,
      },
      tonnage: 0,
      e1rm: 0,
      nl: 0,
      peripheral_stress: 0,
      central_stress: 0,
      total_stress: 0,
    };

    if (!Array.isArray(actual) || !actual.length) {
      return result;
    }

    const exerciseData = await this.databaseService
      .knex('exercises')
      .where({ id: exerciseId })
      .select('central_stress_factor', 'peripheral_stress_factor')
      .first();

    if (!exerciseData) {
      return result;
    }

    let exerciseCs = Number(exerciseData.central_stress_factor);
    let exercisePs = Number(exerciseData.peripheral_stress_factor);

    // Validate exercise stress factors
    if (
      !Number.isFinite(exerciseCs) ||
      !Number.isFinite(exercisePs) ||
      exerciseCs < 0 ||
      exercisePs < 0
    ) {
      Logger.warn(
        `Invalid stress factors for exercise ${exerciseId}: CS=${exerciseCs}, PS=${exercisePs}`,
      );
      return result;
    }

    // Apply modifier adjustments if modifiers exist
    if (modifiers && modifiers.length > 0) {
      const parsedModifiers = this.parseModifierInputs(modifiers);
      const modifierAdjustments =
        await this.getModifierAdjustments(parsedModifiers);
      exerciseCs = exerciseCs * modifierAdjustments.centralAdjustment;
      exercisePs = exercisePs * modifierAdjustments.peripheralAdjustment;
    }

    // Filter working sets (RPE >= 6 for stress calculation)
    const workingSets = actual.filter(
      (set) =>
        Number.isFinite(set.reps) &&
        Number.isFinite(set.rpe) &&
        Number(set.reps) > 0 &&
        Number(set.rpe) > 0 &&
        Number(set.rpe) <= 10,
    );

    // Filter all valid sets for tonnage/nl/e1rm calculation
    const validSets = actual.filter(
      (set) => Number.isFinite(set.reps) && Number(set.reps) > 0,
    );

    let totalCentralStress = 0;
    let totalPeripheralStress = 0;
    let tonnage = 0;
    let nl = 0;
    let maxE1RM = 0;

    // Calculate stress for working sets only
    for (const set of workingSets) {
      const reps = Number(set.reps);
      const rpe = Number(set.rpe);

      const setStress = await this.calculateSetStress(
        reps,
        rpe,
        exerciseCs,
        exercisePs,
      );

      result.perSetBreakdown.push({
        reps,
        rpe,
        centralStress: Number(setStress.centralStress.toFixed(2)),
        peripheralStress: Number(setStress.peripheralStress.toFixed(2)),
        totalStress: Number(setStress.totalStress.toFixed(2)),
      });

      totalCentralStress += setStress.centralStress;
      totalPeripheralStress += setStress.peripheralStress;
    }

    // Calculate tonnage, nl, and e1rm for all valid sets
    validSets.forEach((set) => {
      const reps = Number(set.reps);
      const weight = Number(set.weight) || 0;

      if (weight > 0) {
        tonnage += weight * reps;
        nl += reps;
        const oneRM = this.rpeCalculationService.calculate1RM(
          weight,
          reps,
          Number(set.rpe),
        );
        if (oneRM > maxE1RM) {
          maxE1RM = oneRM;
        }
      }
    });

    // Exercise-level totals
    const exerciseTotalStress =
      (totalCentralStress + totalPeripheralStress) / 2;

    result.exercise = {
      totalCentralStress: Number(totalCentralStress.toFixed(2)),
      totalPeripheralStress: Number(totalPeripheralStress.toFixed(2)),
      totalStress: Number(exerciseTotalStress.toFixed(2)),
      tonnage: Number(tonnage.toFixed(2)),
      e1rm: Number(maxE1RM.toFixed(2)),
      nl: Number(nl.toFixed(2)),
    };

    // Session-level totals
    result.tonnage = tonnage;
    result.e1rm = Number(maxE1RM.toFixed(2));
    result.nl = nl;
    result.central_stress = Number(
      result.exercise.totalCentralStress.toFixed(2),
    );
    result.peripheral_stress = Number(
      result.exercise.totalPeripheralStress.toFixed(2),
    );
    result.total_stress = Number(result.exercise.totalStress.toFixed(2));

    return result;
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
   * @param parsedModifiers - Array of parsed modifiers with IDs and optional cluster counts
   * @returns Combined multipliers for central and peripheral stress
   */
  private async getModifierAdjustments(
    parsedModifiers: ParsedModifier[],
  ): Promise<{ centralAdjustment: number; peripheralAdjustment: number }> {
    if (!parsedModifiers || parsedModifiers.length === 0) {
      return { centralAdjustment: 1, peripheralAdjustment: 1 };
    }

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

          Logger.debug(
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
      Logger.warn(
        `Failed to fetch modifier adjustments for ids ${ids}: ${error.message}`,
      );
      return { centralAdjustment: 1, peripheralAdjustment: 1 };
    }
  }

  async getStressMetricsFormula(): Promise<{ formula: string }> {
    const globalSettings = await this.databaseService
      .knex('global_settings')
      .where('config_key', 'scaling_factor')
      .first();

    const scalingFactors = JSON.parse(globalSettings?.data ?? '{}');
    const Kc = scalingFactors.Kc ?? 100;
    const Kp = scalingFactors.Kp ?? 200;
    return {
      formula: JSON.stringify({
        central: `(((rpe ** 2) * (exerciseCs / 9)) / ${Kc})`,
        peripheral: `(((reps ** 2 * rpe ** 2) / 5) * (exercisePs / 9)) / ${Kp})`,
        total: `((central + peripheral) / 2)`,
        tonnage: `(weight * reps)`,
        nl: `reps`,
        e1rm: `(weight / (1.0278 - (0.0278 * reps)))`,
      }),
    };
  }
}
