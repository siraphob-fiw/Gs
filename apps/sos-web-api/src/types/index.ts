// Export types module
export { TypesModule } from './types.module';

// Export services
export { TypeTransformationService } from './services/type-transformation.service';
export { DataManipulationService } from './services/data-manipulation.service';
export { EntityMappingService } from './services/entity-mapping.service';

// Export base entities
export * from './entities/base.entity';
export * from './entities/user.entity';
export * from './entities/tenant.entity';

// Re-export shared types for convenience
export type {
  // Core types
  Results,
  User,
  Tenant,
  RequestContext,
  LogData,
  ILogger,
  AppError,

  // Interfaces
  TenantSettings,
  ComplianceSettings,
  SubscriptionInfo,
  BillingInfo,
  Address,

  // Database types
  DatabaseConfig,
  Database,
  IDb,
  PaginationResult,
} from '@strengthos/shared-types';

export {
  // Enums (these can be regular exports)
  UserRole,
  UserStatus,
  TenantStatus,
  WeightUnit,
  Gender,
  NotificationType,
  // Functions
  getErrorMessage,
} from '@strengthos/shared-types';

// Utility types for common patterns
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
};

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>;

export type ValidationResponse = ApiResponse<{
  isValid: boolean;
  errors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}>;

// Common query types
export type SortOrder = 'asc' | 'desc';

export type QueryFilter<T> = {
  [K in keyof T]?:
    | T[K]
    | T[K][]
    | {
        operator:
          | 'eq'
          | 'ne'
          | 'gt'
          | 'gte'
          | 'lt'
          | 'lte'
          | 'in'
          | 'nin'
          | 'like'
          | 'ilike';
        value: any;
      };
};

export type QueryOptions<T> = {
  select?: (keyof T)[];
  where?: QueryFilter<T>;
  orderBy?: {
    field: keyof T;
    direction: SortOrder;
  }[];
  limit?: number;
  offset?: number;
  include?: string[];
};

// Entity operation types
export type EntityOperation = 'create' | 'read' | 'update' | 'delete';

export type EntityPermission = {
  entity: string;
  operation: EntityOperation;
  resourceId?: string;
};

// Audit types
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'ACCESS'
  | 'EXPORT'
  | 'IMPORT';

export type AuditLog = {
  id: string;
  tenantId: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
};

// Cache types
export type CacheKey = string;
export type CacheTTL = number; // seconds

export type CacheOptions = {
  ttl?: CacheTTL;
  tags?: string[];
  namespace?: string;
};

// Event types
export type DomainEvent = {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  data: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: Date;
};

// Configuration types are now imported from shared-types
// Use DatabaseConfig, etc. from @strengthos/shared-types instead

// Health check types
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export type HealthCheck = {
  name: string;
  status: HealthStatus;
  message?: string;
  details?: Record<string, any>;
  timestamp: Date;
};

export type SystemHealth = {
  status: HealthStatus;
  checks: HealthCheck[];
  uptime: number;
  version: string;
  timestamp: Date;
};

// Notification types
export type NotificationChannel = 'email' | 'sms' | 'push' | 'webhook';

export type NotificationTemplate = {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
};

export type NotificationPayload = {
  templateId: string;
  recipient: string;
  variables: Record<string, any>;
  channel?: NotificationChannel;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
};

// File upload types
export type FileUpload = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export type UploadedFile = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
};

// Search types
export type SearchQuery = {
  query: string;
  filters?: Record<string, any>;
  facets?: string[];
  sort?: {
    field: string;
    direction: SortOrder;
  }[];
  page?: number;
  limit?: number;
};

export type SearchResult<T> = {
  items: T[];
  total: number;
  facets?: Record<string, Array<{ value: string; count: number }>>;
  suggestions?: string[];
  took: number;
};

// Integration types
export type WebhookPayload = {
  event: string;
  data: Record<string, any>;
  timestamp: Date;
  signature?: string;
};

export type ApiKey = {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  isActive: boolean;
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdBy: string;
  createdAt: Date;
};
