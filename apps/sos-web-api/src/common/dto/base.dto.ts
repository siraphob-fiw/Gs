import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Base DTO class with common properties for all entities
 */
export abstract class BaseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  updatedAt: Date;
}

/**
 * Base DTO for tenant-aware entities
 */
export abstract class BaseTenantDto extends BaseDto {
  @ApiProperty({
    description: 'Tenant identifier',
    example: 'tenant-123',
  })
  @IsString()
  tenantId: string;
}

/**
 * Base DTO for create operations
 */
export abstract class BaseCreateDto {
  @ApiPropertyOptional({
    description: 'Tenant identifier (optional for multi-tenant operations)',
    example: 'tenant-123',
  })
  @IsOptional()
  @IsString()
  tenantId?: string;
}

/**
 * Base DTO for update operations
 */
export abstract class BaseUpdateDto {
  @ApiPropertyOptional({
    description: 'Last update timestamp for optimistic locking',
    example: '2024-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  updatedAt?: Date;
}

/**
 * Pagination query DTO
 */
export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * Paginated response DTO
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Array of items',
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: 'object',
    additionalProperties: true,
  })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Standard API response DTO
 */
export class ApiResponseDto<T> {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Response data',
  })
  data?: T;

  @ApiPropertyOptional({
    description: 'Error details (only present when success is false)',
  })
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Error response DTO
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Validation failed',
  })
  message: string;

  @ApiProperty({
    description: 'Error type',
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    description: 'Request timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request path',
    example: '/api/v1/users',
  })
  path: string;

  @ApiPropertyOptional({
    description: 'Trace ID for debugging',
    example: 'trace-123',
  })
  traceId?: string;

  @ApiPropertyOptional({
    description: 'Validation error details',
    isArray: true,
  })
  details?: string[];
}
