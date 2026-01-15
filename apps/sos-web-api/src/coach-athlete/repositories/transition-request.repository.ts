import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v4 as uuidv4 } from 'uuid';
import {
  TransitionRequest,
  CreateTransitionRequest,
  TransitionType,
  TransitionStatus,
  ApproveTransitionRequest,
  RejectTransitionRequest,
} from '../entities/transition-request.entity';

export interface TransitionRequestQueryOptions {
  athleteId?: string;
  transitionType?: TransitionType;
  status?: TransitionStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class TransitionRequestRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(request: CreateTransitionRequest): Promise<TransitionRequest> {
    const db = this.databaseService.knex;

    const transitionData = {
      id: uuidv4(),
      tenant_id: request.tenantId,
      athlete_id: request.athleteId,
      transition_type: request.transitionType,
      status: TransitionStatus.PENDING,
      from_coach_id: request.fromCoachId,
      to_coach_id: request.toCoachId,
      reason: request.reason,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const [result] = await db('transition_requests')
      .insert(transitionData)
      .returning('*');

    return this.mapToEntity(result);
  }

  async findById(id: string): Promise<TransitionRequest | null> {
    const db = this.databaseService.knex;

    const result = await db('transition_requests').where({ id }).first();

    return result ? this.mapToEntity(result) : null;
  }

  async findMany(options: TransitionRequestQueryOptions = {}): Promise<{
    requests: TransitionRequest[];
    total: number;
  }> {
    const db = this.databaseService.knex;
    const { page = 1, limit = 20, ...filters } = options;
    const offset = (page - 1) * limit;

    let query = db('transition_requests');

    // Apply filters
    if (filters.athleteId) {
      query = query.where({ athlete_id: filters.athleteId });
    }
    if (filters.transitionType) {
      query = query.where({ transition_type: filters.transitionType });
    }
    if (filters.status) {
      query = query.where({ status: filters.status });
    }

    // Get total count
    const totalQuery = query.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = parseInt(count as string, 10);

    // Get paginated results
    const results = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const requests = results.map((result) => this.mapToEntity(result));

    return { requests, total };
  }

  async findByAthleteId(athleteId: string): Promise<TransitionRequest[]> {
    const db = this.databaseService.knex;

    const results = await db('transition_requests')
      .where({ athlete_id: athleteId })
      .orderBy('created_at', 'desc');

    return results.map((result) => this.mapToEntity(result));
  }

  async findPendingRequests(): Promise<TransitionRequest[]> {
    const db = this.databaseService.knex;

    const results = await db('transition_requests')
      .where({ status: TransitionStatus.PENDING })
      .orderBy('created_at', 'asc');

    return results.map((result) => this.mapToEntity(result));
  }

  async approve(
    id: string,
    request: ApproveTransitionRequest,
  ): Promise<TransitionRequest | null> {
    const db = this.databaseService.knex;

    const updateData = {
      status: TransitionStatus.APPROVED,
      approved_by: request.approverId,
      approved_at: new Date(),
      metadata: request.metadata ? JSON.stringify(request.metadata) : null,
      updated_at: new Date(),
    };

    const [result] = await db('transition_requests')
      .where({ id })
      .update(updateData)
      .returning('*');

    return result ? this.mapToEntity(result) : null;
  }

  async reject(
    id: string,
    request: RejectTransitionRequest,
  ): Promise<TransitionRequest | null> {
    const db = this.databaseService.knex;

    const updateData = {
      status: TransitionStatus.REJECTED,
      rejected_by: request.rejectedBy,
      rejected_at: new Date(),
      rejection_reason: request.rejectionReason,
      updated_at: new Date(),
    };

    const [result] = await db('transition_requests')
      .where({ id })
      .update(updateData)
      .returning('*');

    return result ? this.mapToEntity(result) : null;
  }

  async complete(id: string): Promise<TransitionRequest | null> {
    const db = this.databaseService.knex;

    const updateData = {
      status: TransitionStatus.COMPLETED,
      completed_at: new Date(),
      updated_at: new Date(),
    };

    const [result] = await db('transition_requests')
      .where({ id })
      .update(updateData)
      .returning('*');

    return result ? this.mapToEntity(result) : null;
  }

  async cancel(id: string): Promise<TransitionRequest | null> {
    const db = this.databaseService.knex;

    const updateData = {
      status: TransitionStatus.CANCELLED,
      updated_at: new Date(),
    };

    const [result] = await db('transition_requests')
      .where({ id })
      .update(updateData)
      .returning('*');

    return result ? this.mapToEntity(result) : null;
  }

  private mapToEntity(row: any): TransitionRequest {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      athleteId: row.athlete_id,
      transitionType: row.transition_type,
      status: row.status,
      fromCoachId: row.from_coach_id,
      toCoachId: row.to_coach_id,
      reason: row.reason,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      rejectedBy: row.rejected_by,
      rejectedAt: row.rejected_at,
      rejectionReason: row.rejection_reason,
      completedAt: row.completed_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
