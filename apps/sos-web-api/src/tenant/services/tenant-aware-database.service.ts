import { Injectable, Inject, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TenantContextService } from './tenant-context.service';
import { ILogger } from '@strengthos/shared-logging';
import { Knex } from 'knex';

@Injectable()
export class TenantAwareDatabaseService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly tenantContextService: TenantContextService,
    @Inject('ILogger') private readonly loggingService: ILogger,
  ) {}

  /**
   * Get a Knex query builder with tenant context applied
   */
  async getTenantAwareQuery(
    tableName: string,
    tenantId?: string,
  ): Promise<Knex.QueryBuilder> {
    const query = this.databaseService.knex(tableName);

    // If tenant ID is provided, apply tenant filtering
    if (tenantId) {
      // Set tenant context for row-level security
      await this.tenantContextService.setTenantContext('', tenantId);

      // Apply tenant filtering for tables that have tenant_id column
      if (await this.hasColumn(tableName, 'tenant_id')) {
        query.where('tenant_id', tenantId);
      }
    }

    return query;
  }

  /**
   * Execute a tenant-aware query with automatic tenant filtering
   */
  async executeTenantQuery<T = any>(
    tableName: string,
    queryBuilder: (query: Knex.QueryBuilder) => Knex.QueryBuilder,
    tenantId?: string,
  ): Promise<T[]> {
    try {
      const baseQuery = await this.getTenantAwareQuery(tableName, tenantId);
      const finalQuery = queryBuilder(baseQuery);

      const results = await finalQuery;

      await this.loggingService.debug({
        message: 'Tenant-aware query executed',
        tableName,
        tenantId,
        resultCount: results.length,
      });

      return results;
    } catch (error) {
      await this.loggingService.error({
        message: 'Tenant-aware query error',
        fullMessage: error instanceof Error ? error.message : String(error),
        tableName,
        tenantId,
      });
      throw error;
    }
  }

  /**
   * Insert data with automatic tenant ID injection
   */
  async insertWithTenant(
    tableName: string,
    data: any | any[],
    tenantId: string,
  ): Promise<any[]> {
    try {
      // Ensure tenant context is set
      await this.tenantContextService.setTenantContext('', tenantId);

      // Inject tenant_id into data if the table has tenant_id column
      if (await this.hasColumn(tableName, 'tenant_id')) {
        if (Array.isArray(data)) {
          data = data.map((item) => ({ ...item, tenant_id: tenantId }));
        } else {
          data = { ...data, tenant_id: tenantId };
        }
      }

      const result = await this.databaseService
        .knex(tableName)
        .insert(data)
        .returning('*');

      await this.loggingService.debug({
        message: 'Tenant-aware insert executed',
        tableName,
        tenantId,
        insertCount: Array.isArray(result) ? result.length : 1,
      });

      return result;
    } catch (error) {
      await this.loggingService.error({
        message: 'Tenant-aware insert error',
        fullMessage: error instanceof Error ? error.message : String(error),
        tableName,
        tenantId,
      });
      throw error;
    }
  }

  /**
   * Update data with tenant isolation
   */
  async updateWithTenant(
    tableName: string,
    whereClause: any,
    updateData: any,
    tenantId: string,
  ): Promise<number> {
    try {
      // Ensure tenant context is set
      await this.tenantContextService.setTenantContext('', tenantId);

      let query = this.databaseService.knex(tableName);

      // Apply tenant filtering if table has tenant_id column
      if (await this.hasColumn(tableName, 'tenant_id')) {
        query = query.where('tenant_id', tenantId);
      }

      // Apply where clause
      query = query.where(whereClause);

      const affectedRows = await query.update(updateData);

      await this.loggingService.debug({
        message: 'Tenant-aware update executed',
        tableName,
        tenantId,
        affectedRows,
      });

      return affectedRows;
    } catch (error) {
      await this.loggingService.error({
        message: 'Tenant-aware update error',
        fullMessage: error instanceof Error ? error.message : String(error),
        tableName,
        tenantId,
      });
      throw error;
    }
  }

  /**
   * Delete data with tenant isolation
   */
  async deleteWithTenant(
    tableName: string,
    whereClause: any,
    tenantId: string,
  ): Promise<number> {
    try {
      // Ensure tenant context is set
      await this.tenantContextService.setTenantContext('', tenantId);

      let query = this.databaseService.knex(tableName);

      // Apply tenant filtering if table has tenant_id column
      if (await this.hasColumn(tableName, 'tenant_id')) {
        query = query.where('tenant_id', tenantId);
      }

      // Apply where clause
      query = query.where(whereClause);

      const affectedRows = await query.del();

      await this.loggingService.debug({
        message: 'Tenant-aware delete executed',
        tableName,
        tenantId,
        affectedRows,
      });

      return affectedRows;
    } catch (error) {
      await this.loggingService.error({
        message: 'Tenant-aware delete error',
        fullMessage: error instanceof Error ? error.message : String(error),
        tableName,
        tenantId,
      });
      throw error;
    }
  }

  /**
   * Execute a transaction with tenant context
   */
  async executeInTenantTransaction<T>(
    tenantId: string,
    callback: (trx: Knex.Transaction) => Promise<T>,
  ): Promise<T> {
    const trx = await this.databaseService.knex.transaction();

    try {
      // Set tenant context for the transaction
      await trx.raw('SELECT set_tenant_context(?, ?)', ['', tenantId]);

      const result = await callback(trx);
      await trx.commit();

      await this.loggingService.debug({
        message: 'Tenant transaction completed successfully',
        tenantId,
      });

      return result;
    } catch (error) {
      await trx.rollback();

      await this.loggingService.error({
        message: 'Tenant transaction error',
        fullMessage: error instanceof Error ? error.message : String(error),
        tenantId,
      });

      throw error;
    }
  }

  /**
   * Check if a table has a specific column
   */
  private async hasColumn(
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
    try {
      const hasColumn = await this.databaseService.knex.schema.hasColumn(
        tableName,
        columnName,
      );
      return hasColumn;
    } catch (error) {
      Logger.error('Error checking if table has column:', error);
      // If we can't check the column, assume it doesn't exist
      return false;
    }
  }

  /**
   * Validate that a record belongs to the specified tenant
   */
  async validateRecordTenancy(
    tableName: string,
    recordId: string,
    tenantId: string,
    idColumn: string = 'id',
  ): Promise<boolean> {
    try {
      if (!(await this.hasColumn(tableName, 'tenant_id'))) {
        // If table doesn't have tenant_id column, assume it's valid
        return true;
      }

      const record = await this.databaseService
        .knex(tableName)
        .where(idColumn, recordId)
        .where('tenant_id', tenantId)
        .first();

      return !!record;
    } catch (error) {
      await this.loggingService.error({
        message: 'Record tenancy validation error',
        fullMessage: error instanceof Error ? error.message : String(error),
        tableName,
        recordId,
        tenantId,
      });
      return false;
    }
  }
}
