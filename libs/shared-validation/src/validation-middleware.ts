import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { z } from 'zod';
import { Results } from '@strengthos/shared-utils';
import { IValidationService, createValidationService } from './validation-service';
import { JoiSchemas, ZodSchemas } from './validation-schemas';

export interface ValidationMiddlewareOptions {
  validationService?: IValidationService;
  abortEarly?: boolean;
  stripUnknown?: boolean;
  allowUnknown?: boolean;
  skipOnError?: boolean;
}

export interface ValidatedRequest extends Request {
  validatedBody?: any;
  validatedQuery?: any;
  validatedParams?: any;
}

export class ValidationMiddleware {
  private validationService: IValidationService;
  private options: ValidationMiddlewareOptions;

  constructor(options: ValidationMiddlewareOptions = {}) {
    this.validationService = options.validationService || createValidationService();
    this.options = {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
      skipOnError: false,
      ...options
    };
  }

  // Joi validation middleware
  validateBody(schema: Joi.Schema) {
    return async (req: ValidatedRequest, res: Response, next: NextFunction) => {
      try {
        const result = await this.validationService.validateWithJoi(schema, req.body);
        
        if (!result.isOk) {
          return res.status(400).json({
            success: false,
            message: result.message,
            errors: result.message
          });
        }

        req.validatedBody = result.returnValue || req.body;
        next();
      } catch (error) {
        if (!this.options.skipOnError) {
          return res.status(500).json({
            success: false,
            message: 'Validation middleware error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        next();
      }
    };
  }

  validateQuery(schema: Joi.Schema) {
    return async (req: ValidatedRequest, res: Response, next: NextFunction) => {
      try {
        const result = await this.validationService.validateWithJoi(schema, req.query);
        
        if (!result.isOk) {
          return res.status(400).json({
            success: false,
            message: result.message,
            errors: result.message
          });
        }

        req.validatedQuery = result.returnValue || req.query;
        next();
      } catch (error) {
        if (!this.options.skipOnError) {
          return res.status(500).json({
            success: false,
            message: 'Query validation error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        next();
      }
    };
  }

  validateParams(schema: Joi.Schema) {
    return async (req: ValidatedRequest, res: Response, next: NextFunction) => {
      try {
        const result = await this.validationService.validateWithJoi(schema, req.params);
        
        if (!result.isOk) {
          return res.status(400).json({
            success: false,
            message: result.message,
            errors: result.message
          });
        }

        req.validatedParams = result.returnValue || req.params;
        next();
      } catch (error) {
        if (!this.options.skipOnError) {
          return res.status(500).json({
            success: false,
            message: 'Params validation error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        next();
      }
    };
  }

  // Zod validation middleware
  validateBodyWithZod<T>(schema: z.ZodSchema<T>) {
    return async (req: ValidatedRequest, res: Response, next: NextFunction) => {
      try {
        const result = await this.validationService.validateWithZod(schema, req.body);
        
        if (!result.isOk) {
          return res.status(400).json({
            success: false,
            message: result.message,
            errors: result.message
          });
        }

        req.validatedBody = result.returnValue || req.body;
        next();
      } catch (error) {
        if (!this.options.skipOnError) {
          return res.status(500).json({
            success: false,
            message: 'Zod validation middleware error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        next();
      }
    };
  }

  // Pre-built validation middleware for common use cases
  validateUserCreation() {
    return this.validateBody(JoiSchemas.createUser);
  }

  validateUserUpdate() {
    return this.validateBody(JoiSchemas.updateUser);
  }

  validateLogin() {
    return this.validateBody(JoiSchemas.login);
  }

  validateTenantCreation() {
    return this.validateBody(JoiSchemas.createTenant);
  }

  validatePagination() {
    return this.validateQuery(JoiSchemas.pagination);
  }

  validateUUIDParam(paramName: string = 'id') {
    const schema = Joi.object({
      [paramName]: JoiSchemas.uuid
    });
    return this.validateParams(schema);
  }

  // Sanitization middleware
  sanitizeBody(fields: string[] = []) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.body || typeof req.body !== 'object') {
        return next();
      }

      try {
        const fieldsToSanitize = fields.length > 0 ? fields : Object.keys(req.body);
        
        for (const field of fieldsToSanitize) {
          if (req.body[field] && typeof req.body[field] === 'string') {
            req.body[field] = this.validationService.sanitizeString(req.body[field], {
              trim: true,
              maxLength: 1000 // Default max length
            });
          }
        }

        // Special handling for email fields
        if (req.body.email) {
          req.body.email = this.validationService.sanitizeEmail(req.body.email);
        }

        next();
      } catch (error) {
        if (!this.options.skipOnError) {
          return res.status(500).json({
            success: false,
            message: 'Sanitization error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        next();
      }
    };
  }

  // Combined validation and sanitization
  validateAndSanitizeUserCreation() {
    return [
      this.sanitizeBody(['email', 'username', 'firstName', 'lastName', 'phone']),
      this.validateUserCreation()
    ];
  }

  validateAndSanitizeUserUpdate() {
    return [
      this.sanitizeBody(['email', 'firstName', 'lastName', 'phone']),
      this.validateUserUpdate()
    ];
  }

  validateAndSanitizeLogin() {
    return [
      this.sanitizeBody(['username', 'password']),
      this.validateLogin()
    ];
  }

  // Error handling middleware for validation errors
  static handleValidationErrors() {
    return (error: any, req: Request, res: Response, next: NextFunction) => {
      if (error.isJoi || error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details ? error.details.map((detail: any) => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
          })) : [{ message: error.message }]
        });
      }

      next(error);
    };
  }
}

// Factory functions for common middleware patterns
export function createValidationMiddleware(options?: ValidationMiddlewareOptions): ValidationMiddleware {
  return new ValidationMiddleware(options);
}

// Pre-configured middleware instances
export const validationMiddleware = new ValidationMiddleware();

// Convenience exports for common validations
export const validateUserCreation = () => validationMiddleware.validateUserCreation();
export const validateUserUpdate = () => validationMiddleware.validateUserUpdate();
export const validateLogin = () => validationMiddleware.validateLogin();
export const validateTenantCreation = () => validationMiddleware.validateTenantCreation();
export const validatePagination = () => validationMiddleware.validatePagination();
export const validateUUIDParam = (paramName?: string) => validationMiddleware.validateUUIDParam(paramName);

// Combined validation and sanitization exports
export const validateAndSanitizeUserCreation = () => validationMiddleware.validateAndSanitizeUserCreation();
export const validateAndSanitizeUserUpdate = () => validationMiddleware.validateAndSanitizeUserUpdate();
export const validateAndSanitizeLogin = () => validationMiddleware.validateAndSanitizeLogin();