import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { RpeCalculationService } from './rpe-calculation.service';

/**
 * Service for calculating recommended weights based on historical exercise data
 */
@Injectable()
export class WeightCalculationService {
  private readonly DEFAULT_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25];
  private readonly DEFAULT_BAR_WEIGHT = 20;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly rpeCalculationService: RpeCalculationService,
  ) {}

  /**
   * Calculate recommended weight for an exercise based on historical data
   */
  async calculateWeight(
    exerciseId: string,
    reps: number,
    rpe: number,
    athleteId: string,
    tenantId: string,
  ): Promise<{ e1rm: number; weight: number }> {
    if (!exerciseId || !athleteId || !tenantId) {
      throw new BadRequestException(
        'Missing required parameters: exerciseId, athleteId, or tenantId',
      );
    }
    if (!Number.isFinite(reps) || reps <= 0 || reps > 100) {
      throw new BadRequestException('Invalid reps value');
    }
    if (!Number.isFinite(rpe) || rpe < 1 || rpe > 10) {
      throw new BadRequestException(
        'Invalid RPE value (must be between 1 and 10)',
      );
    }

    try {
      const findHighestWeightSet = await this.databaseService.knex
        .raw(
          `
          SELECT 
            tse.id AS training_session_exercise_id,
            max_weight_set.weight AS highest_weight,
            max_weight_set.rpe AS rpe_for_highest_weight,
            max_weight_set.reps AS reps_for_highest_weight
          FROM training_sessions_exercises tse
          INNER JOIN training_sessions ts ON tse.training_session_id = ts.id 
          CROSS JOIN LATERAL (
              SELECT
                  (set_data->>'weight')::NUMERIC AS weight,
                  (set_data->>'rpe')::NUMERIC AS rpe,
                  (set_data->>'reps')::numeric as reps
              FROM
                  jsonb_array_elements(tse.actual) AS set_data
              WHERE (set_data->>'weight') IS NOT NULL
              ORDER BY
                  (set_data->>'weight')::NUMERIC DESC
              LIMIT 1
          ) AS max_weight_set
          WHERE tse.exercise_id = ?
            AND ts.athlete_id = ?
            AND ts.tenant_id = ?
            AND tse.actual IS NOT NULL
            AND jsonb_typeof(tse.actual) = 'array'
            AND jsonb_array_length(tse.actual) > 0
          ORDER BY
            highest_weight DESC
          LIMIT 1
        `,
          [exerciseId, athleteId, tenantId],
        )
        .then((result) => result.rows ?? result);

      if (!findHighestWeightSet?.length) {
        Logger.warn(
          `No historical exercise data found for exerciseId=${exerciseId}, athleteId=${athleteId}, tenantId=${tenantId}. Returning 0.`,
        );
        return { e1rm: 0, weight: 0 };
      }

      let highestWeight = Number(findHighestWeightSet[0].highest_weight);
      let highestWeightRpe = Number(
        findHighestWeightSet[0].rpe_for_highest_weight,
      );
      let highestWeightReps = Number(
        findHighestWeightSet[0].reps_for_highest_weight,
      );

      const e1RM = this.rpeCalculationService.calculate1RM(
        highestWeight,
        highestWeightReps,
        highestWeightRpe,
      );

      let percentage = this.rpeCalculationService.getRPEPercentage(reps, rpe);

      if (percentage <= 0) {
        return { e1rm: 0, weight: 0 };
      }
      let weight = (Number(e1RM.toFixed(1)) / 100) * percentage;

      weight = this.adjustWeightForPlates(weight);

      return {
        e1rm: Number(this.roundToHalf(e1RM).toFixed(1)),
        weight: Number(this.roundToHalf(weight).toFixed(1)),
      };
    } catch (error) {
      Logger.error(
        `Error calculating weight for exerciseId=${exerciseId}, athleteId=${athleteId}, tenantId=${tenantId}: ${error instanceof Error ? error.message : error}`,
      );
      return { e1rm: 0, weight: 0 };
    }
  }

  /**
   * Round a number to the nearest 0.5
   */
  roundToHalf(value: number): number {
    return Math.round(value * 2) / 2;
  }

  /**
   * Adjusts the weight to the nearest possible value using available plates.
   * Returns the maximum weight that can be loaded with the default plates,
   * not exceeding the given target weight.
   */
  adjustWeightForPlates(weight: number): number {
    // Sort plates descending in case they're not
    const plates = [...this.DEFAULT_PLATES].sort((a, b) => b - a);
    let remaining = weight;
    let total = 0;
    for (const plate of plates) {
      while (remaining >= plate) {
        total += plate;
        remaining -= plate;
      }
    }
    return total;
  }
}
