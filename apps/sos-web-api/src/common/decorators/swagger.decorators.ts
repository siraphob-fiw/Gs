import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiConsumes,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto, PaginatedResponseDto } from '../dto/base.dto';

/**
 * Standard API operation decorator with common responses
 */
export function ApiStandardOperation(
  summary: string,
  description?: string,
  requiresAuth = true,
) {
  const decorators = [
    ApiOperation({ summary, description }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Validation failed',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
      type: ErrorResponseDto,
    }),
  ];

  if (requiresAuth) {
    decorators.push(
      ApiBearerAuth('JWT-auth'),
      ApiResponse({
        status: 401,
        description: 'Unauthorized - Authentication required',
        type: ErrorResponseDto,
      }),
      ApiResponse({
        status: 403,
        description: 'Forbidden - Insufficient permissions',
        type: ErrorResponseDto,
      }),
    );
  }

  decorators.push(
    ApiResponse({
      status: 429,
      description: 'Too Many Requests - Rate limit exceeded',
      type: ErrorResponseDto,
    }),
  );

  return applyDecorators(...decorators);
}

/**
 * API operation for GET endpoints that return a single item
 */
export function ApiGetOperation<T extends Type<any>>(
  summary: string,
  responseType: T,
  description?: string,
  requiresAuth = true,
) {
  return applyDecorators(
    ApiStandardOperation(summary, description, requiresAuth),
    ApiResponse({
      status: 200,
      description: 'Success',
      type: responseType,
    }),
    ApiResponse({
      status: 404,
      description: 'Resource not found',
      type: ErrorResponseDto,
    }),
  );
}

/**
 * API operation for GET endpoints that return paginated lists
 */
export function ApiGetPaginatedOperation<T extends Type<any>>(
  summary: string,
  itemType: T,
  description?: string,
  requiresAuth = true,
) {
  return applyDecorators(
    ApiStandardOperation(summary, description, requiresAuth),
    ApiResponse({
      status: 200,
      description: 'Success',
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(itemType) },
              },
            },
          },
        ],
      },
    }),
    ApiPaginationQueries(),
  );
}

/**
 * API operation for POST endpoints that create resources
 */
export function ApiPostOperation<T extends Type<any>>(
  summary: string,
  responseType: T,
  description?: string,
  requiresAuth = true,
) {
  return applyDecorators(
    ApiStandardOperation(summary, description, requiresAuth),
    ApiResponse({
      status: 201,
      description: 'Created successfully',
      type: responseType,
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - Resource already exists',
      type: ErrorResponseDto,
    }),
  );
}

/**
 * API operation for PUT endpoints that update resources
 */
export function ApiPutOperation<T extends Type<any>>(
  summary: string,
  responseType: T,
  description?: string,
  requiresAuth = true,
) {
  return applyDecorators(
    ApiStandardOperation(summary, description, requiresAuth),
    ApiResponse({
      status: 200,
      description: 'Updated successfully',
      type: responseType,
    }),
    ApiResponse({
      status: 404,
      description: 'Resource not found',
      type: ErrorResponseDto,
    }),
  );
}

/**
 * API operation for PATCH endpoints that partially update resources
 */
export function ApiPatchOperation<T extends Type<any>>(
  summary: string,
  responseType: T,
  description?: string,
  requiresAuth = true,
) {
  return applyDecorators(
    ApiStandardOperation(summary, description, requiresAuth),
    ApiResponse({
      status: 200,
      description: 'Updated successfully',
      type: responseType,
    }),
    ApiResponse({
      status: 404,
      description: 'Resource not found',
      type: ErrorResponseDto,
    }),
  );
}

/**
 * API operation for DELETE endpoints
 */
export function ApiDeleteOperation(
  summary: string,
  description?: string,
  requiresAuth = true,
) {
  return applyDecorators(
    ApiStandardOperation(summary, description, requiresAuth),
    ApiResponse({
      status: 200,
      description: 'Deleted successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Resource deleted successfully' },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Resource not found',
      type: ErrorResponseDto,
    }),
  );
}

/**
 * Standard pagination query parameters
 */
export function ApiPaginationQueries() {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (1-based)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of items per page (max 100)',
      example: 10,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      type: String,
      description: 'Field to sort by',
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['asc', 'desc'],
      description: 'Sort order',
      example: 'desc',
    }),
  );
}

/**
 * Standard search query parameters
 */
export function ApiSearchQueries() {
  return applyDecorators(
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search term for filtering results',
      example: 'john',
    }),
    ApiQuery({
      name: 'filter',
      required: false,
      type: String,
      description: 'Additional filters (JSON format)',
      example: '{"status":"active"}',
    }),
  );
}

/**
 * UUID parameter decorator
 */
export function ApiUuidParam(name: string, description?: string) {
  return ApiParam({
    name,
    type: String,
    format: 'uuid',
    description: description || `${name} UUID`,
    example: '123e4567-e89b-12d3-a456-426614174000',
  });
}

/**
 * Tenant context parameter decorator
 */
export function ApiTenantParam() {
  return ApiParam({
    name: 'tenantId',
    type: String,
    description: 'Tenant identifier',
    example: 'tenant-123',
  });
}

/**
 * File upload operation decorator
 */
export function ApiFileUploadOperation(
  summary: string,
  description?: string,
  requiresAuth = true,
) {
  return applyDecorators(
    ApiStandardOperation(summary, description, requiresAuth),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'File uploaded successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'File uploaded successfully' },
          fileId: { type: 'string', example: 'file-123' },
          url: { type: 'string', example: 'https://example.com/file.jpg' },
        },
      },
    }),
    ApiResponse({
      status: 413,
      description: 'File too large',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: 415,
      description: 'Unsupported media type',
      type: ErrorResponseDto,
    }),
  );
}

/**
 * Bulk operation decorator
 */
export function ApiBulkOperation<T extends Type<any>>(
  summary: string,
  itemType: T,
  description?: string,
  requiresAuth = true,
) {
  return applyDecorators(
    ApiStandardOperation(summary, description, requiresAuth),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: getSchemaPath(itemType) },
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Bulk operation completed',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          processed: { type: 'number', example: 10 },
          failed: { type: 'number', example: 0 },
          errors: {
            type: 'array',
            items: { type: 'string' },
            example: [],
          },
        },
      },
    }),
    ApiResponse({
      status: 207,
      description: 'Partial success - some items failed',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          processed: { type: 'number', example: 8 },
          failed: { type: 'number', example: 2 },
          errors: {
            type: 'array',
            items: { type: 'string' },
            example: ['Item 3: Validation failed', 'Item 7: Duplicate entry'],
          },
        },
      },
    }),
  );
}
