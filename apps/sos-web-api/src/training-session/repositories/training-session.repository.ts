import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DatabaseService } from '@/database/database.service';
import {
  CreateTrainingSessionDto,
  SessionStatus,
  UpdateTrainingSessionDto,
} from '../dto/training-session.dto';
import {
  TrainingSession,
  TrainingSessionAthlete,
} from '../services/training-session.service';
import dayjs from 'dayjs';

@Injectable()
export class TrainingSessionRepository extends BaseRepository<any> {
  constructor(databaseService: DatabaseService) {
    super(databaseService, 'training_sessions');
  }

  async createTrainingSession(
    sessionData: CreateTrainingSessionDto,
    tenantId: string,
  ): Promise<TrainingSessionAthlete> {
    const now = dayjs().toString();

    // Format dates as UTC ISO strings to ensure consistent storage regardless of server timezone
    const sessionStartDate =
      sessionData.exercises.length > 0
        ? dayjs(sessionData.exercises[0].exerciseDate).toString()
        : dayjs(sessionData.startDate).toString();
    const sessionEndDate =
      sessionData.exercises.length > 0
        ? dayjs(
            sessionData.exercises[sessionData.exercises.length - 1]
              .exerciseDate,
          ).toString()
        : dayjs(sessionData.endDate).toString();

    const session = await this.knex.transaction(async (trx) => {
      const sessionPayload = {
        session_name: sessionData.sessionName,
        athlete_id: sessionData.athleteId,
        coach_id: sessionData.coachId,
        tenant_id: tenantId,
        start_date: sessionStartDate,
        end_date: sessionEndDate,
        session_status: SessionStatus.PLANNED,
        created_at: now,
        updated_at: now,
      };

      const [createdSession] = await trx(this.tableName)
        .insert(sessionPayload)
        .returning('*');

      if (
        createdSession.id &&
        Array.isArray(sessionData.exercises) &&
        sessionData.exercises.length > 0
      ) {
        const exerciseData = sessionData.exercises.map((exercise) => {
          // Ensure modifiers and metrics are always JSON objects/arrays, never stringified or fallback to empty array/object
          const serializedModifiers = Array.isArray(exercise.modifiers)
            ? JSON.stringify(exercise.modifiers)
            : '[]';
          const serializedMetrics = exercise.metrics
            ? JSON.stringify(exercise.metrics)
            : '{}';

          return {
            training_session_id: createdSession.id,
            exercise_id: exercise.exerciseId,
            // Format exercise date as UTC ISO string
            exercise_date: dayjs(exercise.exerciseDate).toString(),
            order: exercise.order,
            target: JSON.stringify(exercise.target ?? []),
            actual: JSON.stringify(exercise.actual ?? []),
            modifiers: serializedModifiers,
            metrics: serializedMetrics,
            notes: exercise.notes ?? '',
            exercise_status: 'IN_PROGRESS',
          };
        });

        await trx('training_sessions_exercises').insert(exerciseData);
      }

      return createdSession;
    });

    return session;
  }

  async findTrainingSessionById(id: string): Promise<any | null> {
    const session = await this.knex('training_sessions')
      .where('id', id)
      .first();

    return session || null;
  }

  async findTrainingSessionsByAthlete(
    userId: string,
    tenantId: string | null | undefined,
    query?: {
      coachId?: string;
      athleteId?: string;
      status?: SessionStatus[];
      page?: number;
      limit?: number;
    },
  ): Promise<{
    sessions: TrainingSession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let statusFilter: string[] | undefined = undefined;
    if (query?.status && typeof query.status === 'string') {
      statusFilter = (query.status as string)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean) as string[];
    } else if (Array.isArray(query?.status)) {
      statusFilter = query?.status;
    }

    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 10;

    const user = await this.knex('users')
      .where('id', userId)
      .where('status', '=', 'ACTIVE')
      .first();

    if (!user) {
      return {
        sessions: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    let queryBuilder = this.knex({ ts: this.tableName });

    // SUPER_ADMIN can see ALL sessions across all tenants
    if (user.role === 'SUPER_ADMIN') {
      // No tenant filter needed for SUPER_ADMIN
    }
    // Athlete/self-coached can only see their own sessions
    else if (user.role === 'ATHLETE' || user.role === 'SELF_COACHED') {
      queryBuilder = queryBuilder.where({
        'ts.athlete_id': userId,
      });
    }
    // Coach: all athletes in their coach-athlete relationships
    else if (user.role === 'COACH') {
      // Get all athlete IDs from coach's active relationships
      // Use pluck to get array of UUID values instead of array of objects
      const coachAthleteIds = await this.knex(
        'coach_athlete_relationships as car',
      )
        .where('car.coach_id', userId)
        .where('car.tenant_id', tenantId)
        .where('car.status', 'ACTIVE')
        .pluck('car.athlete_id');

      if (coachAthleteIds.length > 0) {
        queryBuilder = queryBuilder.whereIn('ts.athlete_id', coachAthleteIds);
      } else {
        // No athletes assigned to coach, return empty result
        queryBuilder = queryBuilder.whereRaw('1 = 0');
      }
    } else {
      queryBuilder = queryBuilder.where({
        'ts.tenant_id': tenantId,
      });
    }

    // Optional filter - enforce correct type
    if (query?.athleteId) {
      queryBuilder = queryBuilder.andWhere('ts.athlete_id', query.athleteId);
    }
    // Optional filter for coachId (useful for admin screens, not likely for others)
    if (query?.coachId) {
      queryBuilder = queryBuilder.andWhere('ts.coach_id', query.coachId);
    }
    // Optional filter for status
    if (statusFilter && statusFilter.length > 0) {
      queryBuilder = queryBuilder.whereIn('ts.session_status', statusFilter);
    }

    // Compute total count using clone, before pagination
    const totalQuery = queryBuilder.clone().count({ count: 'ts.id' }).first();
    const [totalRow] = await Promise.all([totalQuery]);
    const totalCount = parseInt((totalRow?.count as string) || '0', 10);

    // Apply pagination after total calculation
    queryBuilder = queryBuilder.select('ts.*').orderBy('ts.created_at', 'desc');
    if (limit > 0) {
      queryBuilder = queryBuilder.offset((page - 1) * limit).limit(limit);
    }

    const sessions = await queryBuilder;

    return {
      sessions,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async findTrainingSessionsByAthleteCalendar(
    userId: string,
    tenantId: string | null | undefined,
    query?: {
      day?: number;
      month?: number;
      year?: number;
      athleteId?: string;
    },
  ): Promise<any> {
    // Parse and validate input
    const day = query?.day !== undefined ? Number(query.day) : undefined;
    const month = query?.month !== undefined ? Number(query.month) : undefined;
    const year = query?.year !== undefined ? Number(query.year) : undefined;

    const user = await this.knex('users')
      .where('id', userId)
      .where('status', '=', 'ACTIVE')
      .first();

    if (!user) return { sessions: [] };

    let queryBuilder = this.knex(this.tableName);

    // SUPER_ADMIN can see ALL sessions across all tenants
    if (user.role === 'SUPER_ADMIN') {
      // No tenant filter needed for SUPER_ADMIN
    } else if (user.role === 'ATHLETE' || user.role === 'SELF_COACHED') {
      queryBuilder = queryBuilder.where({
        athlete_id: userId,
      });
    } else if (user.role === 'COACH') {
      // Get all athlete IDs from coach's active relationships
      // Use pluck to get array of UUID values instead of array of objects
      const coachAthleteIds = await this.knex(
        'coach_athlete_relationships as car',
      )
        .where('car.coach_id', userId)
        .where('car.tenant_id', tenantId)
        .where('car.status', 'ACTIVE')
        .pluck('car.athlete_id');

      if (coachAthleteIds.length > 0) {
        queryBuilder = queryBuilder.whereIn(
          'training_sessions.athlete_id',
          coachAthleteIds,
        );
      } else {
        // No athletes assigned to coach, return empty result
        queryBuilder = queryBuilder.whereRaw('1 = 0');
      }
    } else {
      queryBuilder = queryBuilder.where({
        'ts.tenant_id': tenantId,
      });
    }

    // If filtering by day, month, or year, join exercises table
    if (day !== undefined || month !== undefined || year !== undefined) {
      queryBuilder = queryBuilder.leftJoin(
        'training_sessions_exercises',
        'training_sessions.id',
        'training_sessions_exercises.training_session_id',
      );
    }

    // Filter by exercise_date if day, month, year provided
    if (day !== undefined && month !== undefined && year !== undefined) {
      // Filter exercises that match the exact date
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      queryBuilder = queryBuilder.whereBetween(
        'training_sessions_exercises.exercise_date',
        [startOfDay, endOfDay],
      );
    } else if (month !== undefined && year !== undefined) {
      // Filter exercises that are in the month
      const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      queryBuilder = queryBuilder.whereBetween(
        'training_sessions_exercises.exercise_date',
        [startOfMonth, endOfMonth],
      );
    } else if (year !== undefined) {
      // Filter exercises that are in the year
      const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
      queryBuilder = queryBuilder.whereBetween(
        'training_sessions_exercises.exercise_date',
        [startOfYear, endOfYear],
      );
    }

    if (query?.athleteId) {
      queryBuilder = queryBuilder.where(
        'training_sessions.athlete_id',
        query.athleteId,
      );
    }

    queryBuilder = queryBuilder.distinct('training_sessions.*');

    const sessions = await queryBuilder.orderBy(
      'training_sessions.start_date',
      'asc',
    );

    // Fetch exercises for each session to return complete data
    const sessionIds = sessions.map((session: any) => session.id);
    let exercisesBySession: Record<string, any[]> = {};

    if (sessionIds.length > 0) {
      const exercises = await this.knex('training_sessions_exercises')
        .whereIn('training_session_id', sessionIds)
        .orderBy('exercise_date', 'asc');

      exercisesBySession = exercises.reduce(
        (acc: Record<string, any[]>, exercise: any) => {
          if (!acc[exercise.training_session_id]) {
            acc[exercise.training_session_id] = [];
          }
          acc[exercise.training_session_id].push(exercise);
          return acc;
        },
        {},
      );
    }

    // Attach exercises to each session
    const sessionsWithExercises = sessions.map((session: any) => ({
      ...session,
      exercises: exercisesBySession[session.id] || [],
    }));

    return { sessions: sessionsWithExercises };
  }

  async updateTrainingSession(
    id: string,
    tenantId: string | null | undefined,
    updateData: UpdateTrainingSessionDto,
    isSuperAdmin: boolean = false,
  ): Promise<any | null> {
    const session = await this.findTrainingSessionById(id);

    if (!session) {
      return null;
    }

    // Update session-level fields (sessionName and sessionStatus)
    const sessionUpdateFields: Record<string, any> = {
      updated_at: dayjs().toString(),
    };

    if (updateData.sessionName) {
      sessionUpdateFields.session_name = updateData.sessionName;
    }

    if (updateData.sessionStatus) {
      sessionUpdateFields.session_status = updateData.sessionStatus;
    }

    if (Object.keys(sessionUpdateFields).length > 1) {
      let updateQuery = this.knex(this.tableName).where({ id });

      // SUPER_ADMIN can update any session regardless of tenant
      if (!isSuperAdmin && tenantId) {
        updateQuery = updateQuery.andWhere({ tenant_id: tenantId });
      }

      await updateQuery.update(sessionUpdateFields);
    }

    // If replaceAllExercises is true, delete all existing exercises and recreate from provided list
    // This is the safest approach for full edit operations (copy, move, add, delete)
    if (updateData.replaceAllExercises && Array.isArray(updateData.exercises)) {
      // Delete all existing exercises for this session
      await this.knex('training_sessions_exercises')
        .where({ training_session_id: id })
        .del();

      // Insert new exercises
      if (updateData.exercises.length > 0) {
        const now = dayjs().toString();
        const exercisesToInsert = updateData.exercises.map((exercise) => ({
          training_session_id: id,
          exercise_id: exercise.exerciseId,
          exercise_date: exercise.exerciseDate
            ? dayjs(exercise.exerciseDate).format('YYYY-MM-DD')
            : dayjs().format('YYYY-MM-DD'),
          order: exercise.order ?? 1,
          target: JSON.stringify(exercise.targets ?? []),
          actual: JSON.stringify(exercise.actual ?? []),
          warmup: JSON.stringify(exercise.warmup ?? []),
          modifiers: JSON.stringify(exercise.modifiers ?? []),
          metrics: JSON.stringify(exercise.metrics ?? {}),
          notes: exercise.notes ?? '',
          exercise_status: 'IN_PROGRESS',
          created_at: now,
          updated_at: now,
        }));

        await this.knex('training_sessions_exercises').insert(
          exercisesToInsert,
        );
      }

      return session;
    }

    // Handle deleted exercises (legacy mode)
    if (
      Array.isArray(updateData.deletedExercises) &&
      updateData.deletedExercises.length > 0
    ) {
      for (const deletedExerciseKey of updateData.deletedExercises) {
        // Parse the key format: exerciseId:order:exerciseDate
        const [exerciseId, orderStr, exerciseDate] =
          deletedExerciseKey.split(':');
        const order = parseInt(orderStr, 10);

        if (exerciseId && !isNaN(order) && exerciseDate) {
          await this.knex('training_sessions_exercises')
            .where({
              training_session_id: id,
              exercise_id: exerciseId,
              order: order,
              exercise_date: dayjs(exerciseDate).format('YYYY-MM-DD'),
            })
            .del();
        }
      }
    }

    // Handle partial updates (legacy mode)
    if (
      Array.isArray(updateData.exercises) &&
      updateData.exercises.length > 0
    ) {
      for (const exercise of updateData.exercises) {
        const updateFields: Record<string, any> = {
          updated_at: dayjs().toString(),
        };

        if (exercise.targets != undefined) {
          updateFields.target = JSON.stringify(exercise.targets ?? []);
        }
        if (exercise.actual != undefined) {
          updateFields.actual = JSON.stringify(exercise.actual ?? []);
        }
        if (exercise.metrics != undefined) {
          updateFields.metrics = JSON.stringify(exercise.metrics ?? {});
        }
        if (exercise.notes != undefined) {
          updateFields.notes = exercise.notes ?? '';
        }
        if (exercise.warmup != undefined) {
          updateFields.warmup = JSON.stringify(exercise.warmup ?? []);
        }
        if (exercise.modifiers != undefined) {
          updateFields.modifiers = JSON.stringify(exercise.modifiers ?? []);
        }

        // Only update if there are fields to update
        if (Object.keys(updateFields).length > 1) {
          // Build where clause - use order and exerciseDate if provided for precise matching
          const whereClause: Record<string, any> = {
            training_session_id: id,
            exercise_id: exercise.exerciseId,
          };

          if (exercise.order !== undefined) {
            whereClause.order = exercise.order;
          }
          if (exercise.exerciseDate) {
            whereClause.exercise_date = dayjs(exercise.exerciseDate).format(
              'YYYY-MM-DD',
            );
          }

          await this.knex('training_sessions_exercises')
            .where(whereClause)
            .update(updateFields);
        }
      }
    }

    return session;
  }

  async deleteTrainingSession(
    id: string,
    tenantId: string | null | undefined,
    isSuperAdmin: boolean = false,
  ): Promise<boolean> {
    let query = this.knex(this.tableName).where({ id });

    // SUPER_ADMIN can delete any session regardless of tenant
    if (!isSuperAdmin && tenantId) {
      query = query.andWhere({ tenant_id: tenantId });
    }

    const deletedCount = await query.del();

    return deletedCount > 0;
  }

  async FindEstimate1RMforUserExercise(
    userId: string,
    exerciseId: string,
    tenantId: string,
    modifiers?: string[],
  ): Promise<{
    e1rm: number;
    message: string;
  }> {
    const user = await this.knex('users')
      .where('id', userId)
      .where('status', '=', 'ACTIVE')
      .first();

    if (!user) return { e1rm: 0, message: 'User not found' };

    const exercise = await this.knex('exercises')
      .where('id', exerciseId)
      .where('tenant_id', tenantId)
      .first();

    if (!exercise) return { e1rm: 0, message: 'Exercise not found' };

    let query = this.knex('training_sessions_exercises')
      .leftJoin(
        'training_sessions',
        'training_sessions_exercises.training_session_id',
        'training_sessions.id',
      )
      .where('training_sessions.athlete_id', userId)
      .where('training_sessions_exercises.exercise_id', exerciseId)
      .where('training_sessions.tenant_id', tenantId)
      .where('training_sessions_exercises.exercise_status', 'COMPLETED')
      .whereNotNull('training_sessions_exercises.actual');

    if (modifiers && modifiers.length > 0) {
      query = query.whereRaw(
        'JSON_EXTRACT(training_sessions_exercises.modifiers, "$") = ?',
        [JSON.stringify(modifiers)],
      );
    }

    let sessionExercises = await query;

    if (!sessionExercises || sessionExercises.length === 0)
      return { e1rm: 0, message: 'No session exercises found' };

    let allActualSets: any[] = [];

    for (const ex of sessionExercises) {
      if (!ex || !ex.actual) continue;
      let sets = [];
      let actualData = ex.actual;

      if (typeof actualData === 'string') {
        try {
          actualData = JSON.parse(actualData);
        } catch {
          continue;
        }
      }

      if (Array.isArray(actualData)) {
        sets = actualData;
      } else if (typeof actualData === 'object' && actualData !== null) {
        sets = Object.values(actualData);
      }

      if (Array.isArray(sets) && sets.length > 0) {
        allActualSets.push(...sets);
      }
    }

    const validSets = allActualSets.filter(
      (set) =>
        set &&
        typeof set === 'object' &&
        Number(set.weight) > 0 &&
        Number(set.reps) > 0,
    );

    if (validSets.length === 0)
      return { e1rm: 0, message: 'No valid sets found' };

    let maxE1RM = 0;
    for (const set of validSets) {
      const weight = Number(set.weight);
      const reps = Number(set.reps);
      const e1RM = weight * (1 + reps / 30);
      if (e1RM > maxE1RM) maxE1RM = e1RM;
    }

    return {
      e1rm: Math.round(maxE1RM * 2) / 2,
      message: 'Estimate 1RM calculated successfully',
    };
  }
}
