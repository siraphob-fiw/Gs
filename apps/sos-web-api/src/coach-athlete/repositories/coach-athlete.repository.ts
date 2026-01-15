import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v4 as uuidv4 } from 'uuid';
import {
  CoachAthleteRelationship,
  CreateCoachAthleteRelationshipRequest,
  RelationshipStatus,
  RelationshipTransition,
} from '../entities/coach-athlete-relationship.entity';

export interface CoachAthleteQueryOptions {
  coach_id?: string;
  athlete_id?: string;
  status?: RelationshipStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class CoachAthleteRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    request: CreateCoachAthleteRelationshipRequest,
    userId: string,
    tenantId: string,
  ): Promise<CoachAthleteRelationship> {
    const db = this.databaseService.knex;

    const relationshipData = {
      id: uuidv4(),
      tenant_id: tenantId,
      coach_id: request.coach_id,
      athlete_id: request.athlete_id,
      notes: request.notes ?? null,
      status: RelationshipStatus.ACTIVE,
      start_date: new Date(),
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Remove unnecessary try/catch, return transaction result directly
    let resultRow;
    await db.transaction(async (trx) => {
      // If athlete doesn't have a tenant_id, update it before creating the relationship
      const athlete = await trx('users')
        .where({ id: request.athlete_id })
        .first();

      if (athlete && !athlete.tenant_id) {
        await trx('users').where({ id: request.athlete_id }).update({
          tenant_id: tenantId,
          updated_at: new Date(),
        });
      }

      const [inserted] = await trx('coach_athlete_relationships')
        .insert(relationshipData)
        .returning('*');
      resultRow = inserted;
    });

    return this.mapToEntity(resultRow);
  }

  async findById(id: string): Promise<CoachAthleteRelationship | null> {
    const db = this.databaseService.knex;

    const result = await db('coach_athlete_relationships')
      .where({ id: id })
      .first();

    return result ? this.mapToEntity(result) : null;
  }

  async findByCoachAndAthlete(
    coachId: string,
    athleteId: string,
    status?: RelationshipStatus,
  ): Promise<CoachAthleteRelationship | null> {
    const db = this.databaseService.knex;

    let query = db('coach_athlete_relationships').where({
      coach_id: coachId,
      athlete_id: athleteId,
    });

    if (status) {
      query = query.where({ status });
    }

    const result = await query.first();
    return result ? this.mapToEntity(result) : null;
  }

  async findMany(options: CoachAthleteQueryOptions = {}): Promise<{
    relationships: CoachAthleteRelationship[];
    total: number;
  }> {
    const db = this.databaseService.knex;
    const { page = 1, limit = 20, ...filters } = options;
    const offset = (page - 1) * limit;

    let query = db('coach_athlete_relationships')
      .leftJoin('users', 'coach_athlete_relationships.athlete_id', 'users.id')
      .leftJoin(
        'users as coaches',
        'coach_athlete_relationships.coach_id',
        'coaches.id',
      )
      .select(
        'coach_athlete_relationships.*',
        'users.first_name as athlete_firstName',
        'users.last_name as athlete_lastName',
        'users.role as athlete_role',
        'users.email as athlete_email',
        'coaches.email as coach_email',
        'coaches.first_name as coach_firstName',
        'coaches.last_name as coach_lastName',
      );

    // Apply filters
    if (filters.coach_id) {
      query = query.where(
        'coach_athlete_relationships.coach_id',
        filters.coach_id,
      );
    }
    if (filters.athlete_id) {
      query = query.where(
        'coach_athlete_relationships.athlete_id',
        filters.athlete_id,
      );
    }
    if (filters.status) {
      query = query.where('coach_athlete_relationships.status', filters.status);
    }

    // Get total count - create a separate query without joins for counting
    const countQuery = db('coach_athlete_relationships');

    // Apply the same filters to count query
    if (filters.coach_id) {
      countQuery.where('coach_id', filters.coach_id);
    }
    if (filters.athlete_id) {
      countQuery.where('athlete_id', filters.athlete_id);
    }
    if (filters.status) {
      countQuery.where('status', filters.status);
    }

    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count as string, 10);

    // Get paginated results
    const results = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const relationships = await Promise.all(
      results.map(async (result) => ({
        ...(await this.mapToEntity(result)),
        athlete_firstName: result.athlete_firstName,
        athlete_lastName: result.athlete_lastName,
        athlete_role: result.athlete_role,
        athlete_email: result.athlete_email,
        coach_email: result.coach_email,
        coach_firstName: result.coach_firstName,
        coach_lastName: result.coach_lastName,
      })),
    );

    return { relationships, total };
  }

  async update(
    id: string,
    status: RelationshipStatus,
    updatedBy: string,
  ): Promise<CoachAthleteRelationship | null> {
    const db = this.databaseService.knex;

    const record = await db('coach_athlete_relationships')
      .where({ id: id })
      .first();

    if (!record) {
      throw new NotFoundException('Coach-athlete relationship not found');
    }

    // Only allow update if the user is the coach or belongs to the same tenant as the coach
    let authorized = false;
    if (record.coach_id === updatedBy) {
      authorized = true;
    } else {
      const checkPermission = await this.databaseService
        .knex('users')
        .where({ id: updatedBy })
        .first();

      if (!checkPermission) {
        throw new UnauthorizedException(
          'You are not authorized to update this coach-athlete relationship',
        );
      }
      if (record.tenant_id === checkPermission.tenant_id) {
        authorized = true;
      }
    }

    if (!authorized) {
      throw new UnauthorizedException(
        'You are not authorized to update this coach-athlete relationship',
      );
    }

    const updateData: Partial<CoachAthleteRelationship> = {
      updated_at: new Date(),
    };

    if (status !== undefined) {
      updateData.status = status;
    }

    // Update and return the updated relationship
    const [result] = await db('coach_athlete_relationships')
      .where({ id: id })
      .update(updateData)
      .returning('*');

    return result ? this.mapToEntity(result) : null;
  }

  async delete(id: string): Promise<boolean> {
    const db = this.databaseService.knex;

    const deletedCount = await db('coach_athlete_relationships')
      .where({ id: id })
      .del();

    return deletedCount > 0;
  }

  async findActiveRelationshipsByCoach(
    coachId: string,
  ): Promise<CoachAthleteRelationship[]> {
    const db = this.databaseService.knex;

    const results = await db('coach_athlete_relationships')
      .where({
        coach_id: coachId,
        status: RelationshipStatus.ACTIVE,
      })
      .orderBy('created_at', 'desc');

    return await Promise.all(results.map((result) => this.mapToEntity(result)));
  }

  async findActiveRelationshipsByAthlete(
    athleteId: string,
  ): Promise<CoachAthleteRelationship[]> {
    const db = this.databaseService.knex;

    const results = await db('coach_athlete_relationships')
      .where({
        athlete_id: athleteId,
        status: RelationshipStatus.ACTIVE,
      })
      .orderBy('created_at', 'desc');

    return await Promise.all(results.map((result) => this.mapToEntity(result)));
  }

  async findAllRelationshipsByAthlete(
    athleteId: string,
  ): Promise<CoachAthleteRelationship[]> {
    const db = this.databaseService.knex;

    const results = await db('coach_athlete_relationships')
      .where({ athlete_id: athleteId })
      .orderBy('created_at', 'desc');

    return await Promise.all(results.map((result) => this.mapToEntity(result)));
  }

  async findAllRelationshipsByCoach(
    coachId: string,
  ): Promise<CoachAthleteRelationship[]> {
    const db = this.databaseService.knex;

    const results = await db('coach_athlete_relationships')
      .where({ coach_id: coachId })
      .orderBy('created_at', 'desc');

    return await Promise.all(results.map((result) => this.mapToEntity(result)));
  }

  async getTransitionHistory(
    relationshipId: string,
  ): Promise<RelationshipTransition[]> {
    const db = this.databaseService.knex;

    const result = await db('coach_athlete_relationships')
      .select('transition_history')
      .where({ id: relationshipId })
      .first();

    if (!result || !result.transition_history) {
      return [];
    }

    return JSON.parse(result.transition_history);
  }

  async addTransitionToHistory(
    relationshipId: string,
    transition: RelationshipTransition,
  ): Promise<void> {
    const db = this.databaseService.knex;

    // Get current history
    const current = await db('coach_athlete_relationships')
      .select('transition_history')
      .where({ id: relationshipId })
      .first();

    const currentHistory = current?.transition_history
      ? JSON.parse(current.transition_history)
      : [];

    // Add new transition
    currentHistory.push(transition);

    // Update the relationship
    await db('coach_athlete_relationships')
      .where({ id: relationshipId })
      .update({
        transition_history: JSON.stringify(currentHistory),
        updated_at: new Date(),
      });
  }

  private async mapToEntity(row: any): Promise<CoachAthleteRelationship> {
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      coach_id: row.coach_id,
      athlete_id: row.athlete_id,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      athlete_firstName: (
        await this.databaseService
          .knex('users')
          .where('id', row.athlete_id)
          .first()
      )?.first_name,
      athlete_lastName: (
        await this.databaseService
          .knex('users')
          .where('id', row.athlete_id)
          .first()
      )?.last_name,
      athlete_role: (
        await this.databaseService
          .knex('users')
          .where('id', row.athlete_id)
          .first()
      )?.role,
      athlete_email: (
        await this.databaseService
          .knex('users')
          .where('id', row.athlete_id)
          .first()
      )?.email,
      coach_email: (
        await this.databaseService
          .knex('users')
          .where('id', row.coach_id)
          .first()
      )?.email,
      coach_firstName: (
        await this.databaseService
          .knex('users')
          .where('id', row.coach_id)
          .first()
      )?.first_name,
      coach_lastName: (
        await this.databaseService
          .knex('users')
          .where('id', row.coach_id)
          .first()
      )?.last_name,
    };
  }
}
