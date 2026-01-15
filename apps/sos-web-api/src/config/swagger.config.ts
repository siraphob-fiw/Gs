import { DocumentBuilder, SwaggerDocumentOptions } from '@nestjs/swagger';

/**
 * Swagger/OpenAPI configuration
 */
export const swaggerConfig = new DocumentBuilder()
  .setTitle('StrengthOS API')
  .setDescription(
    `
    Comprehensive REST API for the StrengthOS platform.
    
    ## Authentication
    This API uses JWT Bearer tokens for authentication. Include the token in the Authorization header:
    \`Authorization: Bearer <your-jwt-token>\`
    
    ## Multi-tenancy
    Most endpoints require a tenant context. The tenant ID is typically included in the JWT token
    or can be specified in request headers where applicable.
    
    ## Rate Limiting
    API requests are rate-limited to prevent abuse. Check response headers for rate limit information.
    
    ## Error Handling
    All errors follow a consistent format with appropriate HTTP status codes and descriptive messages.
    
    ## Pagination
    List endpoints support pagination with \`page\` and \`limit\` query parameters.
    Default page size is 10 items, maximum is 100.
    
    ## Filtering and Sorting
    Many list endpoints support filtering and sorting via query parameters.
    Use \`sortBy\` and \`sortOrder\` for sorting, and specific field names for filtering.
  `,
  )
  .setVersion('1.0.0')
  .setContact(
    'StrengthOS Support',
    'https://strengthos.com/support',
    'support@strengthos.com',
  )
  .setLicense('MIT', 'https://opensource.org/licenses/MIT')
  .addServer('http://localhost:3001', 'Development server')
  .addServer('https://api-staging.humanlifting.com', 'Staging server')
  .addServer('https://api.humanlifting.com', 'Production server')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter JWT token in the format: Bearer <token>',
      in: 'header',
      name: 'Authorization',
    },
    'JWT-auth',
  )
  // Core API sections
  .addTag('authentication', 'User authentication and session management')
  .addTag('users', 'User account management and profiles')
  .addTag('tenants', 'Multi-tenant organization management')
  .addTag('health', 'System health checks and monitoring')

  // Feature-specific sections
  .addTag('coach-athlete', 'Coach-athlete relationship management')
  .addTag('notifications', 'Notification system and templates')
  .addTag('payments', 'Payment processing and billing')
  .addTag('subscriptions', 'Subscription lifecycle management')
  .addTag('preferences', 'User and system preferences')
  .addTag('admin', 'Administrative functions and system management')

  // System sections
  .addTag('cache', 'Caching operations and management')
  .addTag('monitoring', 'System monitoring and metrics')
  .addTag('security', 'Security auditing and access control')
  .build();

/**
 * Swagger document options
 */
export const swaggerDocumentOptions: SwaggerDocumentOptions = {
  operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  deepScanRoutes: true,
  ignoreGlobalPrefix: false,
};

/**
 * Swagger UI setup options
 */
export const swaggerSetupOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    requestInterceptor: (req: any) => {
      // Add correlation ID to requests
      req.headers['X-Correlation-ID'] =
        `swagger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return req;
    },
  },
  customSiteTitle: 'StrengthOS API Documentation',
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #2c3e50; font-size: 36px; }
    .swagger-ui .info .description { font-size: 14px; line-height: 1.6; }
    .swagger-ui .scheme-container { 
      background: #f8f9fa; 
      padding: 15px; 
      border-radius: 8px; 
      margin: 20px 0; 
      border: 1px solid #e9ecef;
    }
    .swagger-ui .auth-wrapper { 
      margin: 20px 0; 
      padding: 15px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
    }
    .swagger-ui .btn.authorize { 
      background-color: #007bff; 
      border-color: #007bff; 
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 6px;
    }
    .swagger-ui .btn.authorize:hover { 
      background-color: #0056b3; 
      border-color: #0056b3; 
    }
    .swagger-ui .opblock.opblock-post { 
      border-color: #28a745; 
      background: rgba(40, 167, 69, 0.05);
    }
    .swagger-ui .opblock.opblock-get { 
      border-color: #007bff; 
      background: rgba(0, 123, 255, 0.05);
    }
    .swagger-ui .opblock.opblock-put { 
      border-color: #ffc107; 
      background: rgba(255, 193, 7, 0.05);
    }
    .swagger-ui .opblock.opblock-delete { 
      border-color: #dc3545; 
      background: rgba(220, 53, 69, 0.05);
    }
    .swagger-ui .opblock.opblock-patch { 
      border-color: #6c757d; 
      background: rgba(108, 117, 125, 0.05);
    }
    .swagger-ui .opblock-tag { 
      font-size: 20px; 
      font-weight: 700; 
      margin: 30px 0 15px 0; 
      color: #2c3e50;
      border-bottom: 2px solid #e9ecef;
      padding-bottom: 10px;
    }
    .swagger-ui .opblock-summary { font-weight: 600; }
    .swagger-ui .parameter__name { font-weight: 600; }
    .swagger-ui .response-col_status { font-weight: 600; }
    .swagger-ui .model-title { font-weight: 600; color: #2c3e50; }
    .swagger-ui .prop-type { font-weight: 600; }
    .swagger-ui .servers select { 
      padding: 8px 12px; 
      border-radius: 6px; 
      border: 1px solid #ced4da;
    }
    .swagger-ui .download-url-wrapper { margin-top: 20px; }
    .swagger-ui .info .base-url { 
      font-weight: 600; 
      color: #007bff; 
      background: #f8f9fa; 
      padding: 4px 8px; 
      border-radius: 4px; 
    }
  `,
};

/**
 * API response examples for common scenarios
 */
export const apiResponseExamples = {
  success: {
    description: 'Successful operation',
    content: {
      'application/json': {
        example: {
          success: true,
          message: 'Operation completed successfully',
          data: {},
        },
      },
    },
  },
  created: {
    description: 'Resource created successfully',
    content: {
      'application/json': {
        example: {
          success: true,
          message: 'Resource created successfully',
          data: {
            id: 'resource-123',
            createdAt: '2024-01-01T12:00:00.000Z',
          },
        },
      },
    },
  },
  updated: {
    description: 'Resource updated successfully',
    content: {
      'application/json': {
        example: {
          success: true,
          message: 'Resource updated successfully',
          data: {
            id: 'resource-123',
            updatedAt: '2024-01-01T12:00:00.000Z',
          },
        },
      },
    },
  },
  deleted: {
    description: 'Resource deleted successfully',
    content: {
      'application/json': {
        example: {
          success: true,
          message: 'Resource deleted successfully',
        },
      },
    },
  },
  paginatedList: {
    description: 'Paginated list of resources',
    content: {
      'application/json': {
        example: {
          success: true,
          data: {
            items: [
              {
                id: 'resource-1',
                name: 'Example Resource 1',
                createdAt: '2024-01-01T12:00:00.000Z',
              },
              {
                id: 'resource-2',
                name: 'Example Resource 2',
                createdAt: '2024-01-01T12:30:00.000Z',
              },
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 25,
              totalPages: 3,
              hasNext: true,
              hasPrevious: false,
            },
          },
        },
      },
    },
  },
  badRequest: {
    description: 'Bad request - validation failed',
    content: {
      'application/json': {
        examples: {
          validationError: {
            summary: 'Validation Error',
            value: {
              statusCode: 400,
              message: 'Validation failed',
              error: 'Bad Request',
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/endpoint',
              details: [
                'email must be a valid email address',
                'password must be at least 8 characters long',
                'firstName should not be empty',
              ],
            },
          },
          invalidInput: {
            summary: 'Invalid Input Format',
            value: {
              statusCode: 400,
              message: 'Invalid input format',
              error: 'Bad Request',
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/endpoint',
            },
          },
        },
      },
    },
  },
  unauthorized: {
    description: 'Unauthorized - authentication required',
    content: {
      'application/json': {
        examples: {
          missingToken: {
            summary: 'Missing Authentication Token',
            value: {
              statusCode: 401,
              message: 'Authentication token is required',
              error: 'Unauthorized',
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/endpoint',
            },
          },
          invalidToken: {
            summary: 'Invalid Authentication Token',
            value: {
              statusCode: 401,
              message: 'Invalid or expired authentication token',
              error: 'Unauthorized',
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/endpoint',
            },
          },
          expiredToken: {
            summary: 'Expired Authentication Token',
            value: {
              statusCode: 401,
              message: 'Authentication token has expired',
              error: 'Unauthorized',
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/endpoint',
            },
          },
        },
      },
    },
  },
  forbidden: {
    description: 'Forbidden - insufficient permissions',
    content: {
      'application/json': {
        examples: {
          insufficientPermissions: {
            summary: 'Insufficient Permissions',
            value: {
              statusCode: 403,
              message: 'Insufficient permissions to access this resource',
              error: 'Forbidden',
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/endpoint',
              requiredPermissions: ['manage:users'],
              userPermissions: ['read:users'],
            },
          },
          tenantAccess: {
            summary: 'Tenant Access Denied',
            value: {
              statusCode: 403,
              message: 'Access denied for this tenant',
              error: 'Forbidden',
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/endpoint',
            },
          },
        },
      },
    },
  },
  notFound: {
    description: 'Resource not found',
    content: {
      'application/json': {
        examples: {
          resourceNotFound: {
            summary: 'Resource Not Found',
            value: {
              statusCode: 404,
              message: 'The requested resource was not found',
              error: 'Not Found',
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/endpoint',
            },
          },
          userNotFound: {
            summary: 'User Not Found',
            value: {
              statusCode: 404,
              message: 'User with ID user-123 not found',
              error: 'Not Found',
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/users/user-123',
            },
          },
        },
      },
    },
  },
  conflict: {
    description: 'Conflict - resource already exists',
    content: {
      'application/json': {
        examples: {
          duplicateEmail: {
            summary: 'Duplicate Email',
            value: {
              statusCode: 409,
              message: 'User with this email already exists',
              error: 'Conflict',
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/users',
            },
          },
          resourceExists: {
            summary: 'Resource Already Exists',
            value: {
              statusCode: 409,
              message: 'Resource with this identifier already exists',
              error: 'Conflict',
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/endpoint',
            },
          },
        },
      },
    },
  },
  unprocessableEntity: {
    description: 'Unprocessable Entity - business logic error',
    content: {
      'application/json': {
        example: {
          statusCode: 422,
          message:
            'Business rule violation: Cannot assign coach to athlete in different tenant',
          error: 'Unprocessable Entity',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/api/v1/coach-athlete/relationships',
        },
      },
    },
  },
  tooManyRequests: {
    description: 'Too many requests - rate limit exceeded',
    content: {
      'application/json': {
        examples: {
          rateLimitExceeded: {
            summary: 'Rate Limit Exceeded',
            value: {
              statusCode: 429,
              message: 'Too many requests. Please try again later.',
              error: 'Too Many Requests',
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/endpoint',
              retryAfter: 60,
            },
          },
          loginAttempts: {
            summary: 'Too Many Login Attempts',
            value: {
              statusCode: 429,
              message: 'Too many login attempts. Account temporarily locked.',
              error: 'Too Many Requests',
              timestamp: '2024-01-01T00:00:00.000Z',
              path: '/api/v1/auth/login',
              retryAfter: 900,
            },
          },
        },
      },
    },
  },
  internalServerError: {
    description: 'Internal server error',
    content: {
      'application/json': {
        example: {
          statusCode: 500,
          message: 'An unexpected error occurred. Please try again later.',
          error: 'Internal Server Error',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/api/v1/endpoint',
          traceId: 'trace-123456789',
        },
      },
    },
  },
};

/**
 * Common Swagger decorators and schemas
 */
export const commonSwaggerDecorators = {
  // Authentication decorators
  bearerAuth: () => ({
    security: [{ 'JWT-auth': [] }],
  }),

  // Common parameter decorators
  paginationParams: {
    page: {
      name: 'page',
      in: 'query',
      description: 'Page number (default: 1)',
      required: false,
      schema: { type: 'integer', minimum: 1, default: 1 },
      example: 1,
    },
    limit: {
      name: 'limit',
      in: 'query',
      description: 'Number of items per page (default: 10, max: 100)',
      required: false,
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
      example: 10,
    },
    sortBy: {
      name: 'sortBy',
      in: 'query',
      description: 'Field to sort by',
      required: false,
      schema: { type: 'string' },
      example: 'createdAt',
    },
    sortOrder: {
      name: 'sortOrder',
      in: 'query',
      description: 'Sort order (asc or desc)',
      required: false,
      schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
      example: 'desc',
    },
  },

  // Common header parameters
  correlationId: {
    name: 'X-Correlation-ID',
    in: 'header',
    description: 'Optional correlation ID for request tracking',
    required: false,
    schema: { type: 'string' },
    example: 'req-123456789',
  },

  tenantId: {
    name: 'x-tenant-id',
    in: 'header',
    description: 'Override tenant context (if permitted)',
    required: false,
    schema: { type: 'string', format: 'uuid' },
    example: '550e8400-e29b-41d4-a716-446655440000',
  },
};

/**
 * Common response schemas
 */
export const commonResponseSchemas = {
  ApiResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Indicates if the operation was successful',
        example: true,
      },
      message: {
        type: 'string',
        description: 'Human-readable message describing the result',
        example: 'Operation completed successfully',
      },
      data: {
        type: 'object',
        description: 'Response data (varies by endpoint)',
      },
    },
    required: ['success'],
  },

  ErrorResponse: {
    type: 'object',
    properties: {
      statusCode: {
        type: 'integer',
        description: 'HTTP status code',
        example: 400,
      },
      message: {
        type: 'string',
        description: 'Error message',
        example: 'Validation failed',
      },
      error: {
        type: 'string',
        description: 'Error type',
        example: 'Bad Request',
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        description: 'Error timestamp in ISO 8601 format',
        example: '2024-01-01T12:00:00.000Z',
      },
      path: {
        type: 'string',
        description: 'API endpoint path',
        example: '/api/v1/users',
      },
      traceId: {
        type: 'string',
        description: 'Trace ID for debugging (optional)',
        example: 'trace-123456789',
      },
      details: {
        type: 'array',
        items: { type: 'string' },
        description: 'Additional error details (optional)',
        example: ['Field is required', 'Invalid format'],
      },
    },
    required: ['statusCode', 'message', 'error', 'timestamp', 'path'],
  },

  PaginationMeta: {
    type: 'object',
    properties: {
      page: {
        type: 'integer',
        description: 'Current page number',
        example: 1,
      },
      limit: {
        type: 'integer',
        description: 'Items per page',
        example: 10,
      },
      total: {
        type: 'integer',
        description: 'Total number of items',
        example: 100,
      },
      totalPages: {
        type: 'integer',
        description: 'Total number of pages',
        example: 10,
      },
      hasNext: {
        type: 'boolean',
        description: 'Whether there is a next page',
        example: true,
      },
      hasPrevious: {
        type: 'boolean',
        description: 'Whether there is a previous page',
        example: false,
      },
    },
    required: [
      'page',
      'limit',
      'total',
      'totalPages',
      'hasNext',
      'hasPrevious',
    ],
  },

  PaginatedResponse: {
    allOf: [
      { $ref: '#/components/schemas/ApiResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { type: 'object' },
                description: 'Array of items',
              },
              pagination: {
                $ref: '#/components/schemas/PaginationMeta',
              },
            },
            required: ['items', 'pagination'],
          },
        },
      },
    ],
  },
};
