import { IsUUID, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Base entity class with common fields
 */
export abstract class BaseEntity {
  @ApiProperty({
    description: 'Unique identifier',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Creation timestamp',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsDateString()
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsDateString()
  updated_at: Date;

  @ApiPropertyOptional({
    description: 'Soft deletion timestamp',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  deleted_at?: Date;
}

/**
 * Base entity with tenant isolation
 */
export abstract class TenantAwareEntity extends BaseEntity {
  @ApiProperty({
    description: 'Tenant identifier',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  tenant_id: string;
}

/**
 * Base entity with user tracking
 */
export abstract class UserTrackableEntity extends TenantAwareEntity {
  @ApiProperty({
    description: 'User who created the record',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  created_by: string;

  @ApiPropertyOptional({
    description: 'User who last updated the record',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  updated_by?: string;
}

/**
 * Interface for entities that support versioning
 */
export interface VersionedEntity {
  version: number;
}

/**
 * Interface for entities that support soft deletion
 */
export interface SoftDeletableEntity {
  deleted_at?: Date;
  deleted_by?: string;
}

/**
 * Interface for entities with metadata
 */
export interface MetadataEntity {
  metadata?: Record<string, any>;
}

/**
 * Type for entity timestamps
 */
export interface EntityTimestamps {
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

/**
 * Type for entity identification
 */
export interface EntityIdentification {
  id: string;
}

/**
 * Type for tenant context
 */
export interface TenantContext {
  tenant_id: string;
}

/**
 * Type for user context
 */
export interface UserContext {
  created_by: string;
  updated_by?: string;
  deleted_by?: string;
}

/**
 * Utility type for creating new entities (without timestamps and ID)
 */
export type CreateEntityData<T extends BaseEntity> = Omit<
  T,
  'id' | 'created_at' | 'updated_at' | 'deleted_at'
>;

/**
 * Utility type for updating entities (without timestamps and ID)
 */
export type UpdateEntityData<T extends BaseEntity> = Partial<
  Omit<T, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
>;

/**
 * Utility type for entity with all optional fields except ID
 */
export type PartialEntity<T extends BaseEntity> = Pick<T, 'id'> &
  Partial<Omit<T, 'id'>>;

/**
 * Utility type for database query results
 */
export type EntityQueryResult<T> = T | null;

/**
 * Utility type for database query array results
 */
export type EntityArrayQueryResult<T> = T[];

/**
 * Entity status enumeration
 */
export enum EntityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

/**
 * Base entity with status field
 */
export abstract class StatusEntity extends BaseEntity {
  @ApiProperty({
    description: 'Entity status',
    enum: EntityStatus,
    example: EntityStatus.ACTIVE,
  })
  status: EntityStatus;
}
