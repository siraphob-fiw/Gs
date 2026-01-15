import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CoachRequest } from '../entities/coach-athlete-relationship.entity';

@Injectable()
export class CoachRequestRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private get knex() {
    return this.databaseService.knex;
  }

  async create(data: {
    tenantId: string;
    athleteId: string;
    coachId: string;
    status: string;
    message?: string;
    requestedAt: Date;
    expiresAt: Date;
  }): Promise<CoachRequest> {
    const [request] = await this.knex('coach_requests')
      .insert({
        id: this.knex.raw('gen_random_uuid()'),
        tenant_id: data.tenantId,
        athlete_id: data.athleteId,
        coach_id: data.coachId,
        status: data.status,
        message: data.message,
        requested_at: data.requestedAt,
        expires_at: data.expiresAt,
        created_at: this.knex.fn.now(),
        updated_at: this.knex.fn.now(),
      })
      .returning('*');

    return this.mapToEntity(request);
  }

  async findById(id: string): Promise<CoachRequest | null> {
    const request = await this.knex('coach_requests').where('id', id).first();

    return request ? this.mapToEntity(request) : null;
  }

  async findPendingRequest(
    athleteId: string,
    coachId: string,
  ): Promise<CoachRequest | null> {
    const request = await this.knex('coach_requests')
      .where('athlete_id', athleteId)
      .where('coach_id', coachId)
      .where('status', 'PENDING')
      .where('expires_at', '>', new Date())
      .first();

    return request ? this.mapToEntity(request) : null;
  }

  async findByCoachId(
    coachId: string,
    status?: string,
  ): Promise<CoachRequest[]> {
    let query = this.knex('coach_requests').where('coach_id', coachId);

    if (status) {
      query = query.where('status', status);
    }

    const requests = await query.orderBy('requested_at', 'desc');

    return requests.map((request) => this.mapToEntity(request));
  }

  async findByAthleteId(
    athleteId: string,
    status?: string,
  ): Promise<CoachRequest[]> {
    let query = this.knex('coach_requests').where('athlete_id', athleteId);

    if (status) {
      query = query.where('status', status);
    }

    const requests = await query.orderBy('requested_at', 'desc');

    return requests.map((request) => this.mapToEntity(request));
  }

  async respond(
    id: string,
    status: 'ACCEPTED' | 'REJECTED',
    responseMessage?: string,
  ): Promise<CoachRequest | null> {
    const [request] = await this.knex('coach_requests')
      .where('id', id)
      .update({
        status,
        response_message: responseMessage,
        responded_at: this.knex.fn.now(),
        updated_at: this.knex.fn.now(),
      })
      .returning('*');

    return request ? this.mapToEntity(request) : null;
  }

  async cancel(id: string): Promise<CoachRequest | null> {
    const [request] = await this.knex('coach_requests')
      .where('id', id)
      .update({
        status: 'CANCELLED',
        updated_at: this.knex.fn.now(),
      })
      .returning('*');

    return request ? this.mapToEntity(request) : null;
  }

  async cleanupExpiredRequests(): Promise<number> {
    const updatedCount = await this.knex('coach_requests')
      .where('status', 'PENDING')
      .where('expires_at', '<', new Date())
      .update({
        status: 'EXPIRED',
        updated_at: this.knex.fn.now(),
      });

    return updatedCount;
  }

  private mapToEntity(row: any): CoachRequest {
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      athlete_id: row.athlete_id,
      coach_id: row.coach_id,
      status: row.status,
      message: row.message,
      requested_at: row.requested_at,
      responded_at: row.responded_at,
      response_message: row.response_message,
      expires_at: row.expires_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
}
