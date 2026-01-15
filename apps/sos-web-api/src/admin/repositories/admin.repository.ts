import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database';
import { AdminActionEntity } from '../entities/system-config.entity';
import { AdminActionDto } from '../dto/admin-request.dto';

@Injectable()
export class AdminRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createAdminAction(
    adminUserId: string,
    actionDto: AdminActionDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<AdminActionEntity> {
    const query = `
      INSERT INTO admin_actions (admin_user_id, action, target_type, target_id, details, ip_address, user_agent, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      adminUserId,
      actionDto.action,
      actionDto.targetType,
      actionDto.targetId,
      JSON.stringify(actionDto.details || {}),
      metadata?.ipAddress,
      metadata?.userAgent,
    ];

    const result = await this.databaseService.query(query, values);
    return this.mapRowToAdminAction(result.rows[0]);
  }

  async getAdminActions(
    filters?: {
      adminUserId?: string;
      action?: string;
      targetType?: string;
      startDate?: Date;
      endDate?: Date;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{ actions: AdminActionEntity[]; total: number }> {
    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.adminUserId) {
      whereClause += ` AND admin_user_id = $${paramIndex}`;
      values.push(filters.adminUserId);
      paramIndex++;
    }

    if (filters?.action) {
      whereClause += ` AND action = $${paramIndex}`;
      values.push(filters.action);
      paramIndex++;
    }

    if (filters?.targetType) {
      whereClause += ` AND target_type = $${paramIndex}`;
      values.push(filters.targetType);
      paramIndex++;
    }

    if (filters?.startDate) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      values.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      values.push(filters.endDate);
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM admin_actions ${whereClause}`;
    const countResult = await this.databaseService.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    let query = `
      SELECT * FROM admin_actions 
      ${whereClause} 
      ORDER BY created_at DESC
    `;

    if (pagination) {
      const offset = (pagination.page - 1) * pagination.limit;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      values.push(pagination.limit, offset);
    }

    const result = await this.databaseService.query(query, values);
    const actions = result.rows.map((row) => this.mapRowToAdminAction(row));

    return { actions, total };
  }

  async getAdminActionById(id: string): Promise<AdminActionEntity | null> {
    const query = 'SELECT * FROM admin_actions WHERE id = $1';
    const result = await this.databaseService.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToAdminAction(result.rows[0]);
  }

  private mapRowToAdminAction(row: any): AdminActionEntity {
    return {
      id: row.id,
      adminUserId: row.admin_user_id,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      details:
        typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
