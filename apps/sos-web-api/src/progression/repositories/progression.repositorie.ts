import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DatabaseService } from '@/database/database.service';
import { TrainingSession } from '@/training-session/services/training-session.service';

@Injectable()
export class ProgressionRepository extends BaseRepository<TrainingSession> {
  constructor(databaseService: DatabaseService) {
    super(databaseService, 'competitions');
  }

  async findProgressionsByAthlete(
    athleteId: string,
    tenantId: string,
    query?: {
      range?: '1M' | '3M' | '1Y';
      page?: number;
      limit?: number;
    },
  ): Promise<{
    progressions: TrainingSession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let interval = '1 month'; // default
    if (query?.range) {
      switch (query.range) {
        case '1M':
          interval = '1 month';
          break;
        case '3M':
          interval = '3 months';
          break;
        case '1Y':
          interval = '1 year';
          break;
      }
    }

    let queryBuilder = this.knex('training_sessions').where({
      athlete_id: athleteId,
      tenant_id: tenantId,
      session_status: 'COMPLETED',
    });

    if (interval) {
      queryBuilder = queryBuilder.andWhere(
        'start_date',
        '>=',
        this.knex.raw(`NOW() - INTERVAL '${interval}'`),
      );
    }

    const totalCountResult = await queryBuilder
      .clone()
      .count('* as count')
      .first();
    const totalCount = parseInt(totalCountResult?.count as string, 10) || 0;

    if (query?.page && query?.limit) {
      const offset = (query.page - 1) * query.limit;
      queryBuilder = queryBuilder.offset(offset).limit(query.limit);
    } else {
      queryBuilder = queryBuilder.limit(10);
    }

    const progressions = await queryBuilder.orderBy('start_date', 'desc');
    return {
      progressions,
      total: totalCount,
      page: query?.page || 1,
      limit: query?.limit || 10,
      totalPages: Math.ceil(totalCount / (query?.limit || 10)),
    };
  }

  async findProgressionSummaryByAthlete(
    athleteId: string,
    tenantId: string,
    query?: {
      range?: '1M' | '3M' | '1Y';
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{
    summaries: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let interval = '1 month'; // default
    if (query?.range) {
      switch (query.range) {
        case '1M':
          interval = '1 month';
          break;
        case '3M':
          interval = '3 months';
          break;
        case '1Y':
          interval = '1 year';
          break;
      }
    }

    let queryBuilder = this.knex('training_sessions_exercises')
      .join(
        'training_sessions',
        'training_sessions_exercises.training_session_id',
        'training_sessions.id',
      )
      .join(
        'exercises',
        'training_sessions_exercises.exercise_id',
        'exercises.id',
      )
      .where({
        'training_sessions.athlete_id': athleteId,
        'training_sessions.tenant_id': tenantId,
        'training_sessions_exercises.exercise_status': 'COMPLETED',
      })
      .select(
        'training_sessions.id as session_id',
        'training_sessions.session_name',
        'training_sessions.start_date',
        'training_sessions_exercises.exercise_date',
        'training_sessions_exercises.exercise_id',
        'exercises.name as exercise_name',
        'training_sessions_exercises.modifiers',
        'training_sessions_exercises.actual',
        'training_sessions_exercises.metrics',
      );

    // Use custom date range if provided, otherwise use interval
    if (query?.startDate && query?.endDate) {
      queryBuilder = queryBuilder
        .andWhere(
          'training_sessions_exercises.exercise_date',
          '>=',
          query.startDate,
        )
        .andWhere(
          'training_sessions_exercises.exercise_date',
          '<=',
          query.endDate,
        );
    } else if (interval) {
      queryBuilder = queryBuilder.andWhere(
        'training_sessions_exercises.exercise_date',
        '>=',
        this.knex.raw(`NOW() - INTERVAL '${interval}'`),
      );
    }

    const totalCountResult = await queryBuilder
      .clone()
      .clearSelect()
      .countDistinct('training_sessions_exercises.id as count')
      .first();
    const totalCount = parseInt(totalCountResult?.count as string, 10) || 0;

    if (query?.page && query?.limit) {
      const offset = (query.page - 1) * query.limit;
      queryBuilder = queryBuilder.offset(offset).limit(query.limit);
    } else {
      queryBuilder = queryBuilder.limit(20);
    }

    const exercises = await queryBuilder.orderBy(
      'training_sessions.start_date',
      'desc',
    );

    return {
      summaries: exercises,
      total: totalCount,
      page: query?.page || 1,
      limit: query?.limit || 10,
      totalPages: Math.ceil(totalCount / (query?.limit || 10)),
    };
  }

  async QueryStressSummaryByAthlete(
    athleteId: string,
    tenantId: string,
  ): Promise<{
    summaries: any[];
  }> {
    // Only select metrics and the session or date for ordering/context
    let queryBuilder = this.knex('training_sessions_exercises')
      .join(
        'training_sessions',
        'training_sessions_exercises.training_session_id',
        'training_sessions.id',
      )
      .join(
        'exercises',
        'training_sessions_exercises.exercise_id',
        'exercises.id',
      )
      .where({
        'training_sessions.athlete_id': athleteId,
        'training_sessions.tenant_id': tenantId,
        'training_sessions_exercises.exercise_status': 'COMPLETED',
      })
      .andWhere(
        'training_sessions_exercises.exercise_date',
        '>=',
        this.knex.raw(`NOW() - INTERVAL '30 days'`),
      )
      .select(
        'training_sessions_exercises.metrics',
        'exercises.name as exercise',
        'training_sessions_exercises.exercise_date',
      );

    const summaries = await queryBuilder.orderBy(
      'training_sessions_exercises.exercise_date',
      'desc',
    );

    return { summaries };
  }
}
