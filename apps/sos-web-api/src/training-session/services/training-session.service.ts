import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { TrainingSessionRepository } from '../repositories/training-session.repository';
import {
  CreateTrainingSessionDto,
  ProgressSessionExerciseDto,
  SessionStatus,
  SessionWarmupValues,
  UpdateTrainingSessionDto,
} from '../dto/training-session.dto';
import { DatabaseService } from '@/database/database.service';
import { RequestContext, UserRole } from '@strengthos/shared-types';
import { EmailService } from '@/email/services/email.service';
import { RpeCalculationService } from './rpe-calculation.service';
import { StressMetricsService } from './stress-metrics.service';
import { WeightCalculationService } from './weight-calculation.service';
import { JsonParserUtil } from '../utils/json-parser.util';
import { SessionStatusUtil } from '../utils/session-status.util';
import { EmailTemplateUtil } from '../utils/email-template.util';
import dayjs from 'dayjs';

export interface TrainingSession {
  id: string;
  sessionName: string;
  athleteId: string;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  sessionStatus: SessionStatus;
  exercises: TrainingSessionExercise[];
  session_metric: {
    totalCentralStress: number;
    totalPeripheralStress: number;
    totalStress: number;
    exerciseCount: number;
  } | null;
  createdAt?: Date;
  updatedAt?: Date;
  coachId?: string;
}

export interface TrainingSessionAthlete extends TrainingSession {
  athleteName: string;
}

export interface TrainingSessionExercise {
  id: string;
  trainingSessionId: string;
  exerciseId: string;
  exerciseName?: string;
  exerciseDate: Date;
  order: number;
  target: SessionExerciseValues[];
  warmup?: SessionWarmupValues[] | null;
  actual: SessionExerciseValues[];
  modifiers: string[];
  metrics: Record<string, any>;
  notes: string;
  exerciseStatus: ['IN_PROGRESS', 'COMPLETED', 'OVERDUE'];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SessionExerciseValues {
  sets: number;
  reps: number;
  weight: number;
  rpe: number;
}

export interface SessionExerciseActualValues {
  sets: number;
  reps: number;
  weight: number;
  rpe: number;
  central_stress?: number;
  peripheral_stress?: number;
  total_stress?: number;
}

@Injectable()
export class TrainingSessionService {
  constructor(
    private readonly trainingSessionRepository: TrainingSessionRepository,
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService,
    private readonly rpeCalculationService: RpeCalculationService,
    private readonly stressMetricsService: StressMetricsService,
    private readonly weightCalculationService: WeightCalculationService,
  ) {}

  /**
   * Helper to build athleteName
   */
  private async getAthleteName(athleteId: string): Promise<string> {
    const user = await this.databaseService
      .knex('users')
      .select('first_name', 'last_name')
      .where({ id: athleteId })
      .first();
    if (!user) return '';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName} ${lastName}`.trim();
  }

  private async getSessionExercises(trainingSessionId: string) {
    const exercises = await this.databaseService
      .knex('training_sessions_exercises')
      .join(
        'exercises',
        'training_sessions_exercises.exercise_id',
        'exercises.id',
      )
      .select(
        'training_sessions_exercises.*',
        'exercises.name as exercise_name',
      )
      .where({ training_session_id: trainingSessionId });

    return exercises.map((exercise) => ({
      id: exercise.id,
      trainingSessionId: exercise.training_session_id,
      exerciseId: exercise.exercise_id,
      exerciseName: exercise.exercise_name,
      exerciseDate: exercise.exercise_date,
      order: exercise.order,
      target: JsonParserUtil.parseArray(exercise.target),
      actual: JsonParserUtil.parseArray(exercise.actual),
      metrics: JsonParserUtil.parseObject(exercise.metrics),
      warmup: JsonParserUtil.parseNullable(exercise.warmup),
      modifiers: JsonParserUtil.parseArray(exercise.modifiers),
      notes: exercise.notes,
      exerciseStatus: exercise.exercise_status as [
        'IN_PROGRESS',
        'COMPLETED',
        'OVERDUE',
      ],
      createdAt: exercise.created_at,
      updatedAt: exercise.updated_at,
    }));
  }

  private async mapTrainingSessionRecordToInterface(
    record: any,
  ): Promise<TrainingSessionAthlete> {
    const [athleteName, exercises] = await Promise.all([
      this.getAthleteName(record.athlete_id),
      this.getSessionExercises(record.id),
    ]);

    const sessionMetric = JsonParserUtil.parseNullable(record.session_metric);

    return {
      id: record.id,
      sessionName: record.session_name,
      athleteId: record.athlete_id,
      athleteName,
      tenantId: record.tenant_id,
      startDate: record.start_date,
      endDate: record.end_date,
      sessionStatus: record.session_status as SessionStatus,
      exercises: exercises as TrainingSessionExercise[],
      session_metric: sessionMetric,
      coachId: record.coach_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  async createTrainingSession(
    createDto: CreateTrainingSessionDto,
    tenantId: string,
    userId: string,
  ): Promise<TrainingSessionAthlete> {
    try {
      // For SUPER_ADMIN, don't filter by tenant_id when looking up user
      let userQuery = this.databaseService.knex('users').where({ id: userId });
      const userCheck = await this.databaseService
        .knex('users')
        .where({ id: userId })
        .first();
      if (userCheck?.role !== UserRole.SUPER_ADMIN) {
        userQuery = userQuery.andWhere({ tenant_id: tenantId });
      }
      const userData = await userQuery.first();

      const payload = {
        sessionName: createDto.sessionName,
        athleteId: createDto.athleteId,
        coachId:
          (userData && userData.role === UserRole.TENANT_ADMIN) ||
          userData.role === UserRole.COACH_ADMIN ||
          userData.role === UserRole.SUPER_ADMIN
            ? (createDto.coachId ?? userData.id)
            : userId,
        startDate: createDto.startDate,
        endDate: createDto.endDate,
        exercises: createDto.exercises,
      };

      const sessionRecord =
        await this.trainingSessionRepository.createTrainingSession(
          payload,
          tenantId,
        );

      // const ex = await this.databaseService
      //   .knex('training_sessions_exercises')
      //   .join(
      //     'exercises',
      //     'training_sessions_exercises.exercise_id',
      //     'exercises.id',
      //   )
      //   .where('training_session_id', sessionRecord.id)
      //   .select(
      //     'training_sessions_exercises.*',
      //     'exercises.name as exercise_name',
      //   );

      // const exerciseHtml = EmailTemplateUtil.generateExerciseEmailHtml(ex);

      // await this.emailService.sendEmail('fiw@werehumans.com', {
      //   subject: 'Training Session deployed',
      //   text: `Training session ${payload.sessionName} has been deployed`,
      //   html: exerciseHtml,
      // });
      return await this.getHydratedSession(sessionRecord);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create training session: ${error}`,
      );
    }
  }

  async getTrainingSession(
    id: string,
    user: RequestContext,
  ): Promise<TrainingSessionAthlete | { statusCode: number; message: string }> {
    const checkuser = await this.databaseService
      .knex('users')
      .where('id', user.userId)
      .first();

    if (!checkuser) {
      return {
        statusCode: 404,
        message: `User with ID ${user.userId} not found`,
      };
    }

    const sessionRecord =
      await this.trainingSessionRepository.findTrainingSessionById(id);
    if (!sessionRecord) {
      return {
        statusCode: 404,
        message: `Training session with ID ${id} not found`,
      };
    }

    switch (checkuser.role) {
      case UserRole.ATHLETE:
      case UserRole.SELF_COACHED: {
        if (sessionRecord.athlete_id !== checkuser.id) {
          return {
            statusCode: 404,
            message: `Training session with ID ${id} not found`,
          };
        }
        break;
      }
      case UserRole.COACH: {
        const relationship = await this.databaseService
          .knex('coach_athlete_relationships')
          .where('coach_id', checkuser.id)
          .where('athlete_id', sessionRecord.athleteId)
          .where('status', 'ACTIVE')
          .first();

        if (!relationship) {
          return {
            statusCode: 404,
            message: `Training session with ID ${id} not found`,
          };
        }
        break;
      }
      case UserRole.SUPER_ADMIN:
        // No additional checks for SUPER_ADMIN
        break;

      case UserRole.TENANT_ADMIN: {
        if (sessionRecord.tenant_id !== checkuser.tenant_id) {
          return {
            statusCode: 404,
            message: `Training session with ID ${id} not found`,
          };
        }
        break;
      }
      default:
        return {
          statusCode: 404,
          message: `Training session with ID ${id} not found`,
        };
    }
    return await this.getHydratedSession(sessionRecord);
  }

  async getTrainingSessions(
    query: any,
    userId: string,
    tenantId: string | null | undefined,
  ): Promise<{
    sessions: TrainingSessionAthlete[];
    total: number;
    page: number;
    limit: number;
  }> {
    const sessionRecords =
      await this.trainingSessionRepository.findTrainingSessionsByAthlete(
        userId,
        tenantId,
        query,
      );

    const sessions = await Promise.all(
      sessionRecords.sessions.map((session) =>
        this.getHydratedSession(session),
      ),
    );

    return {
      sessions: sessions as TrainingSessionAthlete[],
      total: sessionRecords.total,
      page: sessionRecords.page,
      limit: sessionRecords.limit,
    };
  }

  async getTrainingSessionsCalendar(
    query: {
      day?: number;
      month?: number;
      year?: number;
      athleteId?: string;
    },
    userId: string,
    tenantId: string | null | undefined,
  ): Promise<{
    sessions: TrainingSessionAthlete[];
  }> {
    const sessionRecords =
      await this.trainingSessionRepository.findTrainingSessionsByAthleteCalendar(
        userId,
        tenantId,
        query,
      );
    const sessions = await Promise.all(
      sessionRecords.sessions.map((session) =>
        this.getHydratedSession(session),
      ),
    );
    return { sessions };
  }

  async updateTrainingSession(
    id: string,
    updateDto: UpdateTrainingSessionDto,
    tenantId: string | null | undefined,
    userId?: string,
  ): Promise<TrainingSessionAthlete> {
    // Check if user is SUPER_ADMIN
    let isSuperAdmin = false;
    if (userId) {
      const userData = await this.databaseService
        .knex('users')
        .where('id', userId)
        .first();
      isSuperAdmin = userData?.role === UserRole.SUPER_ADMIN;
    }

    const existingSession =
      await this.trainingSessionRepository.findTrainingSessionById(id);
    if (!existingSession) {
      throw new NotFoundException(`Training session with ID ${id} not found`);
    }

    const updatedRecord =
      await this.trainingSessionRepository.updateTrainingSession(
        id,
        tenantId,
        updateDto,
        isSuperAdmin,
      );

    if (!updatedRecord) {
      throw new NotFoundException(
        `Training session with ID ${id} not found after update`,
      );
    }

    return await this.getHydratedSession(updatedRecord);
  }

  async deleteTrainingSession(
    id: string,
    tenantId: string | null | undefined,
    userId?: string,
  ): Promise<void> {
    // Check if user is SUPER_ADMIN
    let isSuperAdmin = false;
    if (userId) {
      const userData = await this.databaseService
        .knex('users')
        .where('id', userId)
        .first();
      isSuperAdmin = userData?.role === UserRole.SUPER_ADMIN;
    }

    const existingSession =
      await this.trainingSessionRepository.findTrainingSessionById(id);
    if (!existingSession) {
      throw new NotFoundException(`Training session with ID ${id} not found`);
    }

    const deleted = await this.trainingSessionRepository.deleteTrainingSession(
      id,
      tenantId,
      isSuperAdmin,
    );
    if (!deleted) {
      throw new BadRequestException(
        `Failed to delete training session with ID ${id}`,
      );
    }
  }

  async progressTrainingSessionExercise(
    exerciseDate: string,
    id: string,
    data: ProgressSessionExerciseDto[],
    user: RequestContext,
  ): Promise<TrainingSessionAthlete> {
    try {
      // Check if user is SUPER_ADMIN
      const userData = await this.databaseService
        .knex('users')
        .where('id', user.userId)
        .first();

      const isSuperAdmin = userData?.role === UserRole.SUPER_ADMIN;

      let sessionQuery = this.databaseService
        .knex('training_sessions')
        .where({ id: id });

      if (userData?.role === UserRole.SUPER_ADMIN) {
        // No tenant filter needed for SUPER_ADMIN
      } else if (
        userData?.role === UserRole.ATHLETE ||
        userData?.role === UserRole.SELF_COACHED
      ) {
        sessionQuery = sessionQuery.where({
          athlete_id: userData?.id,
        });
      } else if (userData?.role === UserRole.COACH) {
        // Get all athlete IDs from coach's active relationships
        // Use pluck to get array of UUID values instead of array of objects
        const coachAthleteIds = await this.databaseService
          .knex('coach_athlete_relationships as car')
          .where('car.coach_id', userData?.id)
          .where('car.tenant_id', userData?.tenant_id)
          .where('car.status', 'ACTIVE')
          .pluck('car.athlete_id');

        if (coachAthleteIds.length > 0) {
          sessionQuery = sessionQuery.whereIn(
            'training_sessions.athlete_id',
            coachAthleteIds,
          );
        } else {
          // No athletes assigned to coach, return empty result
          sessionQuery = sessionQuery.whereRaw('1 = 0');
        }
      } else {
        sessionQuery = sessionQuery.where({
          'ts.tenant_id': userData?.tenant_id,
        });
      }

      const findSession = await sessionQuery.first();

      if (!findSession) {
        throw new NotFoundException(`Training session with ID ${id} not found`);
      }

      for (const exercise of data) {
        const checkActual = exercise.actual.every(
          (a) => a.reps > 0 && a.rpe > 0,
        );

        // Get the exercise record to fetch modifiers
        const exerciseRecord = await this.databaseService
          .knex('training_sessions_exercises')
          .where({
            training_session_id: findSession.id,
            exercise_id: exercise.exerciseId,
            order: exercise.order,
            exercise_date: dayjs(exerciseDate).format('YYYY-MM-DD'),
          })
          .first();

        const modifiers = exerciseRecord?.modifiers
          ? (JsonParserUtil.parseArray(exerciseRecord.modifiers) as string[])
          : [];

        const metrics =
          await this.stressMetricsService.calculateExerciseMetrics(
            exercise.actual,
            exercise.exerciseId,
            modifiers.length > 0 ? modifiers : undefined,
          );

        // Map metrics to sets correctly - only working sets (RPE >= 6) have metrics
        let workingSetIndex = 0;
        const actualWithMetrics = exercise.actual.map((set) => {
          const reps = Number(set.reps);
          const rpe = Number(set.rpe);

          if (
            Number.isFinite(reps) &&
            Number.isFinite(rpe) &&
            reps > 0 &&
            rpe <= 10 &&
            workingSetIndex < metrics.perSetBreakdown.length
          ) {
            const setMetrics = metrics.perSetBreakdown[workingSetIndex];
            workingSetIndex++;
            return {
              ...set,
              central_stress: setMetrics.centralStress,
              peripheral_stress: setMetrics.peripheralStress,
              total_stress: setMetrics.totalStress,
            };
          }
          // Return set without metrics (warmup sets or invalid sets)
          return set;
        });

        // Prepare metrics object with all levels
        const enhancedMetrics = {
          tonnage: metrics.tonnage,
          e1rm: metrics.e1rm,
          nl: metrics.nl,
          peripheral_stress: metrics.peripheral_stress,
          central_stress: metrics.central_stress,
          total_stress: metrics.total_stress,
        };

        let updateResult;

        try {
          updateResult = await this.databaseService
            .knex('training_sessions_exercises')
            .where({
              training_session_id: findSession.id,
              exercise_id: exercise.exerciseId,
              order: exercise.order,
              exercise_date: dayjs(exerciseDate).format('YYYY-MM-DD'),
            })
            .update({
              warmup: JSON.stringify(exercise.warmup ?? []),
              actual: JSON.stringify(actualWithMetrics),
              metrics: JSON.stringify(enhancedMetrics),
              notes: exercise.notes ?? '',
              updated_at: dayjs().toString(),
              exercise_status: checkActual ? 'COMPLETED' : 'IN_PROGRESS',
            });

          if (!updateResult || updateResult === 0) {
            // If the update didn't affect any rows, throw a descriptive error
            const errMsg = `Got error: No row found for exerciseId=${exercise.exerciseId}, order=${exercise.order}, exerciseDate=${dayjs(exerciseDate).format('YYYY-MM-DD')}`;
            Logger.warn(errMsg);
            throw new BadRequestException(errMsg);
          }
        } catch (err) {
          // Always show a "got error" prefix in the error log
          const errMsg = `Got error: exerciseId=${exercise.exerciseId}, order=${exercise.order} - ${err?.name ?? 'Error'}: ${err?.message ?? err}`;
          Logger.warn(errMsg);
          throw new BadRequestException(errMsg);
        }

        if (checkActual) {
          await this.updateNextExerciseWeight(
            findSession.id,
            exercise.exerciseId,
            modifiers,
            exerciseDate,
            user.userId,
            user.tenantId,
          );
        }
      }

      await this.calculateSessionMetrics(findSession.id, true);

      const exerciseStatuses: Array<string | null> = (
        await this.databaseService
          .knex('training_sessions_exercises')
          .where('training_session_id', findSession.id)
          .select('exercise_status')
      ).map((e) => e.exercise_status ?? 'PLANNED');

      const newSessionStatus =
        SessionStatusUtil.calculateSessionStatus(exerciseStatuses);

      await this.databaseService
        .knex('training_sessions')
        .where({ id: findSession.id })
        .update({
          session_status: newSessionStatus,
          updated_at: dayjs().toString(),
        });

      // Use the same SUPER_ADMIN check for fetching the updated session
      let returnSessionQuery = this.databaseService
        .knex('training_sessions')
        .where({ id: id });

      if (isSuperAdmin) {
        // No additional filters
      } else {
        sessionQuery = sessionQuery.andWhere({
          athlete_id: user.userId,
          tenant_id: user.tenantId,
        });
      }

      return await this.getHydratedSession(await returnSessionQuery.first());
    } catch (error) {
      throw new BadRequestException(
        `Failed to progress training session exercise: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async getHydratedSession(
    sessionRecord: any,
  ): Promise<TrainingSessionAthlete> {
    if ('athleteName' in sessionRecord && 'exercises' in sessionRecord) {
      const exercises = Array.isArray(sessionRecord.exercises)
        ? sessionRecord.exercises.map((exercise) => ({
            ...exercise,
            target: JsonParserUtil.parseArray(exercise.target),
            warmup: JsonParserUtil.parseNullable(exercise.warmup),
            actual: JsonParserUtil.parseArray(exercise.actual),
            modifiers: JsonParserUtil.parseArray(exercise.modifiers),
            metrics: JsonParserUtil.parseObject(exercise.metrics || {}),
            exerciseStatus: exercise.exercise_status as [
              'IN_PROGRESS',
              'COMPLETED',
              'OVERDUE',
            ],
          }))
        : [];

      return {
        ...sessionRecord,
        exercises,
      };
    }
    return this.mapTrainingSessionRecordToInterface(sessionRecord);
  }

  async calculateWeight(
    exerciseId: string,
    reps: number,
    rpe: number,
    athleteId: string,
    tenantId: string,
  ): Promise<{ e1rm: number; weight: number }> {
    return this.weightCalculationService.calculateWeight(
      exerciseId,
      reps,
      rpe,
      athleteId,
      tenantId,
    );
  }

  async bulkCalculateWeight(
    data: { exerciseId: string; reps: number; rpe: number }[],
    tenantId: string,
    athleteId: string,
  ): Promise<{ exerciseId: string; weight: number; e1rm: number }[]> {
    const weights: { exerciseId: string; weight: number; e1rm: number }[] =
      await Promise.all(
        data.map(async (item) => {
          const result = await this.calculateWeight(
            item.exerciseId,
            item.reps,
            item.rpe,
            athleteId,
            tenantId,
          );

          return {
            exerciseId: item.exerciseId,
            weight: result.weight,
            e1rm: result.e1rm,
          };
        }),
      );

    return weights.map((weight, index) => ({
      exerciseId: data[index].exerciseId,
      weight: weight.weight,
      e1rm: weight.e1rm,
    }));
  }

  private async updateNextExerciseWeight(
    sessionId: string,
    exerciseId: string,
    modifiers: string[],
    currentExerciseDate: string,
    athleteId: string,
    tenantId: string,
  ): Promise<void> {
    try {
      // Convert modifiers to sorted JSON string for comparison
      const modifiersJson = JSON.stringify(
        Array.isArray(modifiers) ? [...modifiers].sort() : [],
      );

      // First, look for the next instance of this exercise after the current date IN THIS SESSION
      let nextExercise = await this.databaseService
        .knex('training_sessions_exercises')
        .where({
          training_session_id: sessionId,
          exercise_id: exerciseId,
        })
        .where(
          'exercise_date',
          '>',
          dayjs(currentExerciseDate).format('YYYY-MM-DD 00:00:00'),
        )
        .whereNot('exercise_status', 'COMPLETED')
        // Match exercises with the same modifiers (sorted for consistent comparison)
        .whereRaw(
          `COALESCE(
            (SELECT jsonb_agg(elem ORDER BY elem) FROM jsonb_array_elements_text(COALESCE(modifiers, '[]'::jsonb)) AS elem),
            '[]'::jsonb
          ) = COALESCE(
            (SELECT jsonb_agg(elem ORDER BY elem) FROM jsonb_array_elements_text(?::jsonb) AS elem),
            '[]'::jsonb
          )`,
          [modifiersJson],
        )
        .orderBy('exercise_date', 'asc')
        .orderBy('order', 'asc')
        .first();

      // If not found in same session, look for next one in OTHER SESSIONS
      if (!nextExercise) {
        Logger.log(
          `No next exercise found in same session, searching other sessions for exercise ID ${exerciseId} with modifiers ${modifiersJson}`,
        );
        nextExercise = await this.databaseService
          .knex('training_sessions_exercises')
          .join(
            'training_sessions',
            'training_sessions_exercises.training_session_id',
            'training_sessions.id',
          )
          .where('training_sessions_exercises.exercise_id', exerciseId)
          .where('training_sessions.athlete_id', athleteId)
          .where('training_sessions.tenant_id', tenantId)
          .where(
            'training_sessions_exercises.exercise_date',
            '>',
            dayjs(currentExerciseDate).format('YYYY-MM-DD 00:00:00'),
          )
          .whereNot('training_sessions_exercises.exercise_status', 'COMPLETED')
          .whereNot(
            'training_sessions_exercises.training_session_id',
            sessionId,
          )
          // Match exercises with the same modifiers (sorted for consistent comparison)
          .whereRaw(
            `COALESCE(
              (SELECT jsonb_agg(elem ORDER BY elem) FROM jsonb_array_elements_text(COALESCE(training_sessions_exercises.modifiers, '[]'::jsonb)) AS elem),
              '[]'::jsonb
            ) = COALESCE(
              (SELECT jsonb_agg(elem ORDER BY elem) FROM jsonb_array_elements_text(?::jsonb) AS elem),
              '[]'::jsonb
            )`,
            [modifiersJson],
          )
          .orderBy('training_sessions_exercises.exercise_date', 'asc')
          .orderBy('training_sessions_exercises.order', 'asc')
          .select('training_sessions_exercises.*')
          .first();

        if (nextExercise) {
          Logger.log(
            `Found next exercise in another session: ID ${nextExercise.id}, Session ID ${nextExercise.training_session_id}, Date ${nextExercise.exercise_date}, Modifiers ${JSON.stringify(nextExercise.modifiers)}`,
          );
        }
      }

      if (!nextExercise) {
        Logger.log(
          `No next exercise found in any session for exercise ID ${exerciseId}`,
        );
        return;
      }

      // Get actual PREVIOUS performances for this exercise for this athlete, on or before the current exercise date
      const historicalExercises = await this.databaseService
        .knex('training_sessions_exercises')
        .join(
          'training_sessions',
          'training_sessions_exercises.training_session_id',
          'training_sessions.id',
        )
        .where('training_sessions_exercises.exercise_id', exerciseId)
        .where('training_sessions.athlete_id', athleteId)
        .where('training_sessions.tenant_id', tenantId)
        .whereNotNull('training_sessions_exercises.actual')
        .andWhereRaw(
          'jsonb_array_length(training_sessions_exercises.actual) > 0',
        )
        .where(
          'training_sessions_exercises.exercise_date',
          '<=',
          dayjs(currentExerciseDate).format('YYYY-MM-DD 00:00:00'),
        )
        .orderBy('training_sessions_exercises.exercise_date', 'desc')
        .select('training_sessions_exercises.*');

      // Parse exercises into strong typing for manipulation
      const parsedExercises: TrainingSessionExercise[] =
        historicalExercises.map((ex) => ({
          id: ex.id,
          trainingSessionId: ex.training_session_id,
          exerciseId: ex.exercise_id,
          exerciseDate: ex.exercise_date,
          order: ex.order,
          target: JsonParserUtil.parseArray(ex.target),
          actual: JsonParserUtil.parseArray(ex.actual),
          warmup: JsonParserUtil.parseNullable(ex.warmup),
          modifiers: JsonParserUtil.parseArray(ex.modifiers),
          metrics: JsonParserUtil.parseObject(ex.metrics || {}),
          notes: ex.notes || '',
          exerciseStatus: ex.exercise_status as [
            'IN_PROGRESS',
            'COMPLETED',
            'OVERDUE',
          ],
          createdAt: ex.created_at,
          updatedAt: ex.updated_at,
        }));

      // Use the "target" for the next one, which should be updated
      const nextTarget = JsonParserUtil.parseArray(nextExercise.target);

      if (!Array.isArray(nextTarget) || nextTarget.length === 0) {
        Logger.warn(
          `Next exercise target is not an array for id=${nextExercise.id}`,
        );
        return;
      }

      // Calculate e1RM for each set across all historical exercises and find the highest
      let highestE1RM = 0;

      for (const exercise of parsedExercises) {
        if (!Array.isArray(exercise.actual)) continue;

        for (const set of exercise.actual) {
          const weight = Number(set.weight);
          const reps = Number(set.reps);
          const rpe = Number(set.rpe);

          // Skip invalid sets
          if (
            !Number.isFinite(weight) ||
            weight <= 0 ||
            !Number.isFinite(reps) ||
            reps <= 0 ||
            !Number.isFinite(rpe) ||
            rpe <= 0 ||
            rpe > 10
          ) {
            continue;
          }

          // Calculate e1RM for this set
          const setE1RM = this.rpeCalculationService.calculate1RM(
            weight,
            reps,
            rpe,
          );

          if (Number.isFinite(setE1RM) && setE1RM > highestE1RM) {
            highestE1RM = setE1RM;
          }
        }
      }

      if (highestE1RM <= 0) {
        Logger.log(
          'No valid e1RM could be calculated from historical data for exercise id=' +
            exerciseId,
        );
        return;
      }

      Logger.log(
        `Highest e1RM calculated from historical data: ${highestE1RM.toFixed(1)} for exercise id=${exerciseId}`,
      );

      // For each target set, recalculate weight based on target reps and rpe and next 1RM
      const updatedTarget = nextTarget.map((set: SessionExerciseValues) => {
        // Use target reps from the set, or default to 5 if not specified
        const targetReps = Number(set.reps);
        const targetRPE = Number(set.rpe);

        let targetRPEPercentage = this.rpeCalculationService.getRPEPercentage(
          targetReps,
          targetRPE,
        );

        // Compute new recommended weight rounded to .5kg/.5lb
        let recommendedWeight =
          (Number(highestE1RM.toFixed(1)) / 100) * targetRPEPercentage;

        return {
          ...set,
          weight: Number(recommendedWeight.toFixed(1)),
        };
      });

      // Update the target field in the DB with new calculated weights
      await this.databaseService
        .knex('training_sessions_exercises')
        .where({ id: nextExercise.id })
        .update({
          target: JSON.stringify(updatedTarget),
          updated_at: dayjs().toString(),
        });
    } catch (error) {
      Logger.error(
        `Error updating next exercise weight for exercise ID ${exerciseId} in session ID ${sessionId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async calculateSessionMetrics(
    sessionId: string,
    storeInDatabase: boolean = true,
  ): Promise<{
    totalCentralStress: number;
    totalPeripheralStress: number;
    totalStress: number;
    exerciseCount: number;
  }> {
    const exercises = await this.databaseService
      .knex('training_sessions_exercises')
      .where({
        training_session_id: sessionId,
      })
      .select('metrics');

    const session_cs_mult = 1.0;
    const session_ps_mult = 1.0;

    let centralSessionRaw = 0;
    let peripheralSessionRaw = 0;
    let exerciseCount = 0;

    exercises.forEach((exercise) => {
      const metrics = JsonParserUtil.parseObject(exercise.metrics || {});
      const exerciseMetrics = metrics.exercise || metrics;

      const centralEx = Number(
        exerciseMetrics.totalCentralStress ||
          exerciseMetrics.central_stress ||
          0,
      );
      const peripheralEx = Number(
        exerciseMetrics.totalPeripheralStress ||
          exerciseMetrics.peripheral_stress ||
          0,
      );

      centralSessionRaw += centralEx;
      peripheralSessionRaw += peripheralEx;
      exerciseCount += 1;
    });

    const centralSession = centralSessionRaw * session_cs_mult;
    const peripheralSession = peripheralSessionRaw * session_ps_mult;
    const totalSession = (centralSession + peripheralSession) / 2;

    const sessionMetrics = {
      totalCentralStress: Number(centralSession.toFixed(2)),
      totalPeripheralStress: Number(peripheralSession.toFixed(2)),
      totalStress: Number(totalSession.toFixed(2)),
      exerciseCount,
    };

    if (storeInDatabase) {
      await this.databaseService
        .knex('training_sessions')
        .where({ id: sessionId })
        .update({
          session_metric: JSON.stringify(sessionMetrics),
          updated_at: dayjs().toString(),
        });
    }

    return sessionMetrics;
  }
}
