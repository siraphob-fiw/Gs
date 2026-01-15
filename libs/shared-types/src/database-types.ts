// Database Types and Interfaces
// Moved from human-lift-training-api/src/Types/SharedTypes.ts

// Database Interfaces (already defined in shared-types.ts, but keeping here for organization)
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  timezone?: string | false;
  ssl: boolean | { rejectUnauthorized: boolean };
}

export interface Database {
  // Knex database interface placeholder
  [key: string]: any;
}

export interface IDb {
  knex: any;
  [key: string]: any;
}

// Additional database-related types can be added here
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}