import { Injectable } from '@nestjs/common';
import { AdminService } from './admin.service';
import { DatabaseService } from '../../database';
import { SystemStatsEntity } from '../entities/system-config.entity';
import { ReportQueryDto } from '../dto/admin-request.dto';
import { ReportResponseDto } from '../dto/admin-response.dto';

@Injectable()
export class AdminReportingService {
  constructor(
    private readonly adminService: AdminService,
    private readonly databaseService: DatabaseService,
  ) {}

  async getSystemStats(adminUserId: string): Promise<SystemStatsEntity> {
    // Validate admin permissions
    await this.adminService.validateSuperAdmin(adminUserId);

    // Get user statistics
    const userStatsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
      FROM users
    `;
    const userStats = await this.databaseService.query(userStatsQuery);

    // Get tenant statistics
    const tenantStatsQuery = `
      SELECT 
        COUNT(*) as total_tenants,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tenants
      FROM tenants
    `;
    const tenantStats = await this.databaseService.query(tenantStatsQuery);

    // Get transaction statistics (assuming payments table exists)
    const transactionStatsQuery = `
      SELECT COUNT(*) as total_transactions
      FROM payments
      WHERE status = 'completed'
    `;
    const transactionStats = await this.databaseService.query(
      transactionStatsQuery,
    );

    // Determine system health (simplified logic)
    const systemHealth = this.calculateSystemHealth({
      totalUsers: parseInt(userStats.rows[0].total_users),
      activeUsers: parseInt(userStats.rows[0].active_users),
      totalTenants: parseInt(tenantStats.rows[0].total_tenants),
      activeTenants: parseInt(tenantStats.rows[0].active_tenants),
    });

    return {
      totalUsers: parseInt(userStats.rows[0].total_users),
      activeUsers: parseInt(userStats.rows[0].active_users),
      totalTenants: parseInt(tenantStats.rows[0].total_tenants),
      activeTenants: parseInt(tenantStats.rows[0].active_tenants),
      totalTransactions: parseInt(
        transactionStats.rows[0].total_transactions || '0',
      ),
      systemHealth,
      lastUpdated: new Date(),
    };
  }

  async generateUserReport(
    adminUserId: string,
    query: ReportQueryDto,
  ): Promise<ReportResponseDto> {
    // Validate admin permissions
    await this.adminService.validateSuperAdmin(adminUserId);

    const page = query.page || 1;
    const limit = query.limit || 50;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (query.startDate) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      values.push(new Date(query.startDate));
      paramIndex++;
    }

    if (query.endDate) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      values.push(new Date(query.endDate));
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countResult = await this.databaseService.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const dataQuery = `
      SELECT 
        id,
        email,
        first_name,
        last_name,
        status,
        created_at,
        updated_at,
        last_login_at
      FROM users 
      ${whereClause} 
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(limit, offset);

    const dataResult = await this.databaseService.query(dataQuery, values);

    return {
      data: dataResult.rows,
      total,
      page,
      limit,
      generatedAt: new Date(),
    };
  }

  async generateTenantReport(
    adminUserId: string,
    query: ReportQueryDto,
  ): Promise<ReportResponseDto> {
    // Validate admin permissions
    await this.adminService.validateSuperAdmin(adminUserId);

    const page = query.page || 1;
    const limit = query.limit || 50;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (query.startDate) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      values.push(new Date(query.startDate));
      paramIndex++;
    }

    if (query.endDate) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      values.push(new Date(query.endDate));
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM tenants ${whereClause}`;
    const countResult = await this.databaseService.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data with user counts
    const dataQuery = `
      SELECT 
        t.id,
        t.name,
        t.status,
        t.created_at,
        t.updated_at,
        COUNT(u.id) as user_count
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      ${whereClause.replace('WHERE', 'WHERE t.id IS NOT NULL AND')}
      GROUP BY t.id, t.name, t.status, t.created_at, t.updated_at
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(limit, offset);

    const dataResult = await this.databaseService.query(dataQuery, values);

    return {
      data: dataResult.rows,
      total,
      page,
      limit,
      generatedAt: new Date(),
    };
  }

  async generateTransactionReport(
    adminUserId: string,
    query: ReportQueryDto,
  ): Promise<ReportResponseDto> {
    // Validate admin permissions
    await this.adminService.validateSuperAdmin(adminUserId);

    const page = query.page || 1;
    const limit = query.limit || 50;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (query.startDate) {
      whereClause += ` AND p.created_at >= $${paramIndex}`;
      values.push(new Date(query.startDate));
      paramIndex++;
    }

    if (query.endDate) {
      whereClause += ` AND p.created_at <= $${paramIndex}`;
      values.push(new Date(query.endDate));
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM payments p ${whereClause}`;
    const countResult = await this.databaseService.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const dataQuery = `
      SELECT 
        p.id,
        p.amount,
        p.currency,
        p.status,
        p.payment_method,
        p.created_at,
        u.email as user_email,
        t.name as tenant_name
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN tenants t ON u.tenant_id = t.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(limit, offset);

    const dataResult = await this.databaseService.query(dataQuery, values);

    return {
      data: dataResult.rows,
      total,
      page,
      limit,
      generatedAt: new Date(),
    };
  }

  async generateSystemReport(
    adminUserId: string,
    query: ReportQueryDto,
  ): Promise<ReportResponseDto> {
    // Validate admin permissions
    await this.adminService.validateSuperAdmin(adminUserId);

    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Generate daily statistics for the date range
    const dailyStatsQuery = `
      WITH date_series AS (
        SELECT generate_series($1::date, $2::date, '1 day'::interval)::date as report_date
      ),
      daily_users AS (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_users
        FROM users 
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY DATE(created_at)
      ),
      daily_tenants AS (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_tenants
        FROM tenants 
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY DATE(created_at)
      ),
      daily_transactions AS (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as transactions,
          SUM(amount) as revenue
        FROM payments 
        WHERE created_at >= $1 AND created_at <= $2 AND status = 'completed'
        GROUP BY DATE(created_at)
      )
      SELECT 
        ds.report_date,
        COALESCE(du.new_users, 0) as new_users,
        COALESCE(dt.new_tenants, 0) as new_tenants,
        COALESCE(dtr.transactions, 0) as transactions,
        COALESCE(dtr.revenue, 0) as revenue
      FROM date_series ds
      LEFT JOIN daily_users du ON ds.report_date = du.date
      LEFT JOIN daily_tenants dt ON ds.report_date = dt.date
      LEFT JOIN daily_transactions dtr ON ds.report_date = dtr.date
      ORDER BY ds.report_date
    `;

    const result = await this.databaseService.query(dailyStatsQuery, [
      startDate,
      endDate,
    ]);

    return {
      data: result.rows,
      total: result.rows.length,
      page: 1,
      limit: result.rows.length,
      generatedAt: new Date(),
    };
  }

  private calculateSystemHealth(stats: {
    totalUsers: number;
    activeUsers: number;
    totalTenants: number;
    activeTenants: number;
  }): 'healthy' | 'warning' | 'critical' {
    const userActiveRatio =
      stats.totalUsers > 0 ? stats.activeUsers / stats.totalUsers : 0;
    const tenantActiveRatio =
      stats.totalTenants > 0 ? stats.activeTenants / stats.totalTenants : 0;

    // Simple health calculation based on active ratios
    if (userActiveRatio < 0.5 || tenantActiveRatio < 0.5) {
      return 'critical';
    }
    if (userActiveRatio < 0.8 || tenantActiveRatio < 0.8) {
      return 'warning';
    }
    return 'healthy';
  }
}
