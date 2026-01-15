// Core validation schemas and patterns
export * from './validation-schemas';

// Connection configuration schemas and factory
export * from './connection-config-schemas';
export * from './connection-config-factory';

// Program generation validation schemas
export * from './program-generation-schemas';

// Validation service
export * from './validation-service';

// Express middleware
export * from './validation-middleware';

// Decorators for class-based validation
export * from './validation-decorators';

// Utility functions
export * from './validation-utils';

// Re-export commonly used types and interfaces
export type {
  SanitizeOptions,
  BatchValidation,
  IValidationService
} from './validation-service';

export type {
  ValidationResult,
  ValidationError
} from './validation-schemas';

export type {
  DatabaseConnectionConfig,
  RedisConnectionConfig,
  ConnectionConfigValidationResult,
  ConnectionConfigValidationError
} from './connection-config-schemas';

export type {
  ValidationMiddlewareOptions,
  ValidatedRequest
} from './validation-middleware';

export type {
  ValidationDecoratorOptions,
  PropertyValidationRule
} from './validation-decorators';

// Default exports for convenience
export { createValidationService } from './validation-service';
export { createValidationMiddleware, validationMiddleware } from './validation-middleware';
export { ValidationUtils } from './validation-utils';
export { 
  ConnectionConfigFactory, 
  ConnectionConfigUtils,
  ConfigurationError,
  ConnectionError 
} from './connection-config-factory';