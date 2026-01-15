import { Injectable, Logger } from '@nestjs/common';
import { Knex } from 'knex';
import { DatabaseService } from './database.service';
import { TenantAwareDatabaseService } from '../tenant/services/tenant-aware-database.service';

export interface BaseEntity {
  id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  select?: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export abstract class BaseRepository<T extends BaseEntity> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly databaseService: DatabaseService,
    protected readonly tableName: string,
    protected readonly tenantAwareService?: TenantAwareDatabaseService,
  ) {}

  protected get knex(): Knex {
    return this.databaseService.knex;
  }

  protected get table(): Knex.QueryBuilder {
    return this.knex(this.tableName);
  }

  async findById(id: string, select?: string[]): Promise<T | null> {
    try {
      const query = this.table.where('id', id);

      if (select && select.length > 0) {
        query.select(select);
      }

      const result = await query.first();
      return result || null;
    } catch (error) {
      this.logger.error(`Failed to find ${this.tableName} by id ${id}:`, error);
      throw error;
    }
  }

  async findAll(options: QueryOptions = {}): Promise<T[]> {
    try {
      const query = this.table;

      if (options.select && options.select.length > 0) {
        query.select(options.select);
      }

      if (options.orderBy) {
        query.orderBy(options.orderBy, options.orderDirection || 'asc');
      }

      if (options.limit) {
        query.limit(options.limit);
      }

      if (options.offset) {
        query.offset(options.offset);
      }

      return await query;
    } catch (error) {
      this.logger.error(`Failed to find all ${this.tableName}:`, error);
      throw error;
    }
  }

  async findPaginated(
    page: number = 1,
    limit: number = 10,
    options: Omit<QueryOptions, 'limit' | 'offset'> = {},
  ): Promise<PaginatedResult<T>> {
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = this.table.count('* as count');
      const [{ count }] = await countQuery;
      const total = parseInt(count as string, 10);

      // Get data
      const data = await this.findAll({
        ...options,
        limit,
        offset,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to find paginated ${this.tableName}:`, error);
      throw error;
    }
  }

  async findWhere(
    conditions: Partial<T>,
    options: QueryOptions = {},
  ): Promise<T[]> {
    try {
      const query = this.table.where(conditions);

      if (options.select && options.select.length > 0) {
        query.select(options.select);
      }

      if (options.orderBy) {
        query.orderBy(options.orderBy, options.orderDirection || 'asc');
      }

      if (options.limit) {
        query.limit(options.limit);
      }

      if (options.offset) {
        query.offset(options.offset);
      }

      return await query;
    } catch (error) {
      this.logger.error(
        `Failed to find ${this.tableName} with conditions:`,
        error,
      );
      throw error;
    }
  }

  async findOneWhere(
    conditions: Partial<T>,
    select?: string[],
  ): Promise<T | null> {
    try {
      const query = this.table.where(conditions);

      if (select && select.length > 0) {
        query.select(select);
      }

      const result = await query.first();
      return result || null;
    } catch (error) {
      this.logger.error(
        `Failed to find one ${this.tableName} with conditions:`,
        error,
      );
      throw error;
    }
  }

  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    try {
      const now = new Date();
      const insertData = {
        ...data,
        created_at: now,
        updated_at: now,
      };

      const [result] = await this.table.insert(insertData).returning('*');
      this.logger.log(`Created ${this.tableName} with id: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create ${this.tableName}:`, error);
      throw error;
    }
  }

  async createMany(
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>[],
  ): Promise<T[]> {
    try {
      const now = new Date();
      const insertData = data.map((item) => ({
        ...item,
        created_at: now,
        updated_at: now,
      }));

      const results = await this.table.insert(insertData).returning('*');
      this.logger.log(`Created ${results.length} ${this.tableName} records`);
      return results;
    } catch (error) {
      this.logger.error(`Failed to create multiple ${this.tableName}:`, error);
      throw error;
    }
  }

  async update(
    id: string,
    data: Partial<Omit<T, 'id' | 'created_at'>>,
  ): Promise<T | null> {
    try {
      const updateData = {
        ...data,
        updated_at: new Date(),
      };

      const [result] = await this.table
        .where('id', id)
        .update(updateData)
        .returning('*');

      if (result) {
        this.logger.log(`Updated ${this.tableName} with id: ${id}`);
      }

      return result || null;
    } catch (error) {
      this.logger.error(
        `Failed to update ${this.tableName} with id ${id}:`,
        error,
      );
      throw error;
    }
  }

  async updateWhere(
    conditions: Partial<T>,
    data: Partial<Omit<T, 'id' | 'created_at'>>,
  ): Promise<number> {
    try {
      const updateData = {
        ...data,
        updated_at: new Date(),
      };

      const affectedRows = await this.table
        .where(conditions)
        .update(updateData);

      this.logger.log(`Updated ${affectedRows} ${this.tableName} records`);
      return affectedRows;
    } catch (error) {
      this.logger.error(
        `Failed to update ${this.tableName} with conditions:`,
        error,
      );
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const affectedRows = await this.table.where('id', id).del();
      const deleted = affectedRows > 0;

      if (deleted) {
        this.logger.log(`Deleted ${this.tableName} with id: ${id}`);
      }

      return deleted;
    } catch (error) {
      this.logger.error(
        `Failed to delete ${this.tableName} with id ${id}:`,
        error,
      );
      throw error;
    }
  }

  async deleteWhere(conditions: Partial<T>): Promise<number> {
    try {
      const affectedRows = await this.table.where(conditions).del();
      this.logger.log(`Deleted ${affectedRows} ${this.tableName} records`);
      return affectedRows;
    } catch (error) {
      this.logger.error(
        `Failed to delete ${this.tableName} with conditions:`,
        error,
      );
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const result = await this.table.where('id', id).select('id').first();
      return !!result;
    } catch (error) {
      this.logger.error(
        `Failed to check if ${this.tableName} exists with id ${id}:`,
        error,
      );
      throw error;
    }
  }

  async existsWhere(conditions: Partial<T>): Promise<boolean> {
    try {
      const result = await this.table.where(conditions).select('id').first();
      return !!result;
    } catch (error) {
      this.logger.error(
        `Failed to check if ${this.tableName} exists with conditions:`,
        error,
      );
      throw error;
    }
  }

  async count(conditions?: Partial<T>): Promise<number> {
    try {
      const query = this.table.count('* as count');

      if (conditions) {
        query.where(conditions);
      }

      const [{ count }] = await query;
      return parseInt(count as string, 10);
    } catch (error) {
      this.logger.error(`Failed to count ${this.tableName}:`, error);
      throw error;
    }
  }

  // Transaction support
  async transaction<R>(
    callback: (trx: Knex.Transaction) => Promise<R>,
  ): Promise<R> {
    try {
      return await this.knex.transaction(callback);
    } catch (error) {
      this.logger.error(`Transaction failed for ${this.tableName}:`, error);
      throw error;
    }
  }

  // Raw query support for complex operations
  async raw(query: string, bindings?: any[]): Promise<any> {
    try {
      return await this.knex.raw(query, bindings);
    } catch (error) {
      this.logger.error(`Raw query failed for ${this.tableName}:`, error);
      throw error;
    }
  }

  // Tenant-aware methods
  async createWithTenant(
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>,
    tenantId: string,
  ): Promise<T> {
    if (!this.tenantAwareService) {
      throw new Error('Tenant-aware service not available');
    }

    try {
      const now = new Date();
      const insertData = {
        ...data,
        created_at: now,
        updated_at: now,
      };

      const [result] = await this.tenantAwareService.insertWithTenant(
        this.tableName,
        insertData,
        tenantId,
      );

      this.logger.log(
        `Created ${this.tableName} with id: ${result.id} for tenant: ${tenantId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create ${this.tableName} with tenant ${tenantId}:`,
        error,
      );
      throw error;
    }
  }

  async updateWithTenant(
    id: string,
    tenantId: string,
    data: Partial<Omit<T, 'id' | 'created_at'>>,
  ): Promise<T | null> {
    if (!this.tenantAwareService) {
      throw new Error('Tenant-aware service not available');
    }

    try {
      const updateData = {
        ...data,
        updated_at: new Date(),
      };

      const affectedRows = await this.tenantAwareService.updateWithTenant(
        this.tableName,
        { id },
        updateData,
        tenantId,
      );

      if (affectedRows > 0) {
        this.logger.log(
          `Updated ${this.tableName} with id: ${id} for tenant: ${tenantId}`,
        );
        // Fetch and return the updated record
        return await this.findByIdWithTenant(id, tenantId);
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Failed to update ${this.tableName} with id ${id} for tenant ${tenantId}:`,
        error,
      );
      throw error;
    }
  }

  async findByIdWithTenant(
    id: string,
    tenantId: string,
    select?: string[],
  ): Promise<T | null> {
    if (!this.tenantAwareService) {
      throw new Error('Tenant-aware service not available');
    }

    try {
      const results = await this.tenantAwareService.executeTenantQuery<T>(
        this.tableName,
        (query) => {
          let q = query.where('id', id);
          if (select && select.length > 0) {
            q = q.select(select);
          }
          return q.first();
        },
        tenantId,
      );

      return (results as unknown as T) || null;
    } catch (error) {
      this.logger.error(
        `Failed to find ${this.tableName} by id ${id} for tenant ${tenantId}:`,
        error,
      );
      throw error;
    }
  }

  async findAllWithTenant(
    tenantId: string,
    options: QueryOptions = {},
  ): Promise<T[]> {
    if (!this.tenantAwareService) {
      throw new Error('Tenant-aware service not available');
    }

    try {
      return await this.tenantAwareService.executeTenantQuery<T>(
        this.tableName,
        (query) => {
          let q = query;

          if (options.select && options.select.length > 0) {
            q = q.select(options.select);
          }

          if (options.orderBy) {
            q = q.orderBy(options.orderBy, options.orderDirection || 'asc');
          }

          if (options.limit) {
            q = q.limit(options.limit);
          }

          if (options.offset) {
            q = q.offset(options.offset);
          }

          return q;
        },
        tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to find all ${this.tableName} for tenant ${tenantId}:`,
        error,
      );
      throw error;
    }
  }

  async findWhereWithTenant(
    conditions: Partial<T>,
    tenantId: string,
    options: QueryOptions = {},
  ): Promise<T[]> {
    if (!this.tenantAwareService) {
      throw new Error('Tenant-aware service not available');
    }

    try {
      return await this.tenantAwareService.executeTenantQuery<T>(
        this.tableName,
        (query) => {
          let q = query.where(conditions);

          if (options.select && options.select.length > 0) {
            q = q.select(options.select);
          }

          if (options.orderBy) {
            q = q.orderBy(options.orderBy, options.orderDirection || 'asc');
          }

          if (options.limit) {
            q = q.limit(options.limit);
          }

          if (options.offset) {
            q = q.offset(options.offset);
          }

          return q;
        },
        tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to find ${this.tableName} with conditions for tenant ${tenantId}:`,
        error,
      );
      throw error;
    }
  }

  async deleteWithTenant(id: string, tenantId: string): Promise<boolean> {
    if (!this.tenantAwareService) {
      throw new Error('Tenant-aware service not available');
    }

    try {
      const affectedRows = await this.tenantAwareService.deleteWithTenant(
        this.tableName,
        { id },
        tenantId,
      );

      const deleted = affectedRows > 0;
      if (deleted) {
        this.logger.log(
          `Deleted ${this.tableName} with id: ${id} for tenant: ${tenantId}`,
        );
      }

      return deleted;
    } catch (error) {
      this.logger.error(
        `Failed to delete ${this.tableName} with id ${id} for tenant ${tenantId}:`,
        error,
      );
      throw error;
    }
  }

  async validateRecordTenancy(
    recordId: string,
    tenantId: string,
  ): Promise<boolean> {
    if (!this.tenantAwareService) {
      throw new Error('Tenant-aware service not available');
    }

    try {
      return await this.tenantAwareService.validateRecordTenancy(
        this.tableName,
        recordId,
        tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to validate record tenancy for ${this.tableName} id ${recordId} and tenant ${tenantId}:`,
        error,
      );
      return false;
    }
  }

  async transactionWithTenant<R>(
    tenantId: string,
    callback: (trx: Knex.Transaction) => Promise<R>,
  ): Promise<R> {
    if (!this.tenantAwareService) {
      throw new Error('Tenant-aware service not available');
    }

    try {
      return await this.tenantAwareService.executeInTenantTransaction(
        tenantId,
        callback,
      );
    } catch (error) {
      this.logger.error(
        `Tenant transaction failed for ${this.tableName} and tenant ${tenantId}:`,
        error,
      );
      throw error;
    }
  }
}
