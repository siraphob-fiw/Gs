import { Injectable, NotFoundException } from '@nestjs/common';
import { ProgressionRepository } from '../repositories/progression.repositorie';
import { DatabaseService } from '@/database/database.service';
import { RequestContext } from '@strengthos/shared-types';

@Injectable()
export class ProgressionService {
  constructor(
    private readonly progressionRepository: ProgressionRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  private async mapProgressionRecordToInterface(record: any): Promise<any> {
    // Fetch all exercises for this progression in a single query, and parse fields as needed
    const exercises = await this.databaseService
      .knex('training_sessions_exercises')
      .where('training_session_id', record.id)
      .join(
        'exercises',
        'training_sessions_exercises.exercise_id',
        'exercises.id',
      )
      .select(
        'training_sessions_exercises.*',
        'exercises.name as exercise_name',
      );

    // Optionally, parse JSON fields (actual, target, warmup, etc) for frontend compatibility
    const parsedExercises = exercises.map((exercise: any) => ({
      id: exercise.id,
      trainingSessionId: exercise.training_session_id,
      exerciseId: exercise.exercise_id,
      exerciseName: exercise.exercise_name,
      exerciseDate: exercise.exercise_date,
      order: exercise.order,
      // Parse JSON fields if they're stored as strings in DB, with fallback
      target:
        typeof exercise.target === 'string'
          ? JSON.parse(exercise.target)
          : exercise.target,
      actual:
        typeof exercise.actual === 'string'
          ? JSON.parse(exercise.actual ?? '[]')
          : exercise.actual,
      warmup:
        typeof exercise.warmup === 'string'
          ? JSON.parse(exercise.warmup ?? 'null')
          : exercise.warmup,
      modifiers:
        typeof exercise.modifiers === 'string'
          ? JSON.parse(exercise.modifiers ?? '[]')
          : exercise.modifiers,
      metrics:
        typeof exercise.metrics === 'string'
          ? JSON.parse(exercise.metrics ?? '{}')
          : exercise.metrics || {},
      notes: exercise.notes,
      exerciseStatus: exercise.exercise_status,
      createdAt: exercise.created_at,
      updatedAt: exercise.updated_at,
    }));

    return {
      id: record.id,
      athleteId: record.athlete_id,
      coachId: record.coach_id,
      tenantId: record.tenant_id,
      sessionName: record.session_name,
      startDate: record.start_date,
      endDate: record.end_date,
      sessionStatus: record.session_status,
      exercises: parsedExercises,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  async getProgressions(
    query: {
      range?: '1M' | '3M' | '1Y';
      page?: number;
      limit?: number;
    },
    user: RequestContext,
    tenantId: string,
  ): Promise<{
    progressions: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Fast user validation
    const userRecord = await this.databaseService
      .knex('users')
      .where({ id: user.userId, status: 'ACTIVE' })
      .first();

    if (!userRecord) {
      throw new NotFoundException('User not found');
    }

    // Assumption: For now, only show athlete's own competitions (logic can be expanded for other roles)
    const result = await this.progressionRepository.findProgressionsByAthlete(
      user.userId!,
      tenantId,
      query,
    );

    // Optimal batch mapping
    const progressions = await Promise.all(
      result.progressions.map(this.mapProgressionRecordToInterface.bind(this)),
    );

    return {
      progressions,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  private calculateExerciseMetrics(actual: any[]): {
    sets: number;
    totalReps: number;
    exerciseVolume: number;
    maxRPE: number;
    estimatedMax: number;
  } {
    if (!Array.isArray(actual) || actual.length === 0) {
      return {
        sets: 0,
        totalReps: 0,
        exerciseVolume: 0,
        maxRPE: 0,
        estimatedMax: 0,
      };
    }

    const validSets = actual.filter(
      (set) =>
        typeof set === 'object' &&
        set !== null &&
        Number.isFinite(set.weight) &&
        Number.isFinite(set.reps) &&
        Number(set.weight) > 0 &&
        Number(set.reps) > 0,
    );

    const sets = validSets.length;
    const totalReps = validSets.reduce((sum, set) => sum + Number(set.reps), 0);
    const exerciseVolume = validSets.reduce(
      (sum, set) => sum + Number(set.weight) * Number(set.reps),
      0,
    );
    const maxRPE = validSets.reduce((max, set) => {
      const rpe = Number.isFinite(set.rpe) ? Number(set.rpe) : 0;
      return Math.max(max, rpe);
    }, 0);

    let estimatedMax = 0;
    for (const set of validSets) {
      const weight = Number(set.weight);
      const reps = Number(set.reps);
      if (weight > 0 && reps > 0) {
        const oneRm = weight * (1 + reps / 30);
        if (oneRm > estimatedMax) estimatedMax = oneRm;
      }
    }

    return {
      sets,
      totalReps: Number(totalReps.toFixed(0)),
      exerciseVolume: Number(exerciseVolume.toFixed(2)),
      maxRPE: Number(maxRPE.toFixed(1)),
      estimatedMax: Number(estimatedMax.toFixed(2)),
    };
  }

  async getExerciseSummary(
    query: {
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
      athleteId?: string;
    },
    user: RequestContext,
    tenantId: string | null,
  ): Promise<{
    chart: any[];
    summaries: Array<{
      date: string;
      workout: string;
      exercise: string;
      modifiers: string[];
      sets: number;
      totalReps: number;
      exerciseVolume: number;
      maxRPE: number;
      estimatedMax: number;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const userRecord = await this.databaseService
      .knex('users')
      .where({ id: user.userId, status: 'ACTIVE' })
      .first();

    if (!userRecord) {
      throw new NotFoundException('User not found');
    }

    let result;

    if (userRecord.role === 'ATHLETE') {
      result = await this.progressionRepository.findProgressionSummaryByAthlete(
        userRecord.id!,
        tenantId,
        query,
      );
    } else if (userRecord.role === 'SUPER_ADMIN') {
      const athleteRecord = await this.databaseService
        .knex('users')
        .where({ id: query.athleteId })
        .first();

      result = await this.progressionRepository.findProgressionSummaryByAthlete(
        athleteRecord.id!,
        athleteRecord.tenant_id,
        query,
      );
    } else {
      result = await this.progressionRepository.findProgressionSummaryByAthlete(
        query.athleteId!,
        tenantId,
        query,
      );
    }

    const summaries = result.summaries.map((record: any) => {
      const actual =
        typeof record.actual === 'string'
          ? JSON.parse(record.actual ?? '[]')
          : record.actual || [];

      const metrics = this.calculateExerciseMetrics(actual);

      return {
        date: record.exercise_date,
        workout: record.session_name || 'Workout',
        exercise: record.exercise_name || 'Unknown Exercise',
        exerciseId: record.exercise_id,
        modifiers: record.modifiers || [],
        sets: metrics.sets,
        totalReps: metrics.totalReps,
        exerciseVolume: metrics.exerciseVolume,
        maxRPE: metrics.maxRPE,
        estimatedMax: metrics.estimatedMax,
      };
    });

    const competition = await this.databaseService
      .knex('competitions')
      .where({
        athlete_id: query.athleteId ? query.athleteId : userRecord.id!,
      })
      .first();

    let chartExercises = [];

    if (competition && competition.competition_data) {
      chartExercises = Object.entries(competition.competition_data).map(
        ([label, exerciseId]: [string, string]) => {
          return {
            label,
            data: summaries
              .filter((ex: any) => ex.exerciseId === exerciseId)
              .filter((ex: any) => ex.modifiers.length === 0)
              .map((ex: any) => ({
                date: ex.date,
                value: ex.estimatedMax,
              })),
            exerciseId,
          };
        },
      );
    }

    return {
      chart: chartExercises,
      summaries: summaries,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async createProgression(
    body: {
      squat: string;
      bench: string;
      deadlift: string;
    },
    userId: string,
    tenantId: string,
  ) {
    const userRecord = await this.databaseService
      .knex('users')
      .where({ id: userId, status: 'ACTIVE' })
      .first();

    if (!userRecord) {
      throw new NotFoundException('User not found');
    }

    let competition: any;

    const existingCompetition = await this.databaseService
      .knex('competitions')
      .where({
        athlete_id: userRecord.id!,
        tenant_id: tenantId,
      })
      .first();

    if (existingCompetition) {
      const newCompetitionData = {
        ...existingCompetition.competition_data,
        ...Object.entries(body).reduce(
          (acc, [key, value]) => {
            if (typeof value === 'string' && value.trim().length > 0) {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, string>,
        ),
      };

      competition = await this.databaseService
        .knex('competitions')
        .where({ id: existingCompetition.id })
        .update({
          competition_data: newCompetitionData,
          updated_at: this.databaseService.knex.fn.now(),
        })
        .returning('*')
        .then((rows: any[]) => rows[0]);
    } else {
      const filteredBody = Object.entries(body).reduce(
        (acc, [key, value]) => {
          if (typeof value === 'string' && value.trim().length > 0) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, string>,
      );

      competition = await this.databaseService
        .knex('competitions')
        .insert({
          athlete_id: userRecord.id!,
          tenant_id: tenantId,
          competition_data: filteredBody,
          created_at: this.databaseService.knex.fn.now(),
          updated_at: this.databaseService.knex.fn.now(),
        })
        .returning('*')
        .then((rows: any[]) => rows[0]);
    }

    return competition;
  }

  async getStressSummary(user: RequestContext) {
    const userRecord = await this.databaseService
      .knex('users')
      .where({ id: user.userId, status: 'ACTIVE' })
      .first();

    if (!userRecord) {
      throw new NotFoundException('User not found');
    }

    const result = await this.progressionRepository.QueryStressSummaryByAthlete(
      userRecord.id!,
      user.tenantId!,
    );

    return {
      summaries: result.summaries,
    };
  }
}
