import 'reflect-metadata';
import Joi from 'joi';
import { z } from 'zod';
import { Results } from '@strengthos/shared-utils';
import { IValidationService, createValidationService } from './validation-service';

// Metadata keys for storing validation information
const VALIDATION_SCHEMA_KEY = Symbol('validation:schema');
const VALIDATION_RULES_KEY = Symbol('validation:rules');
const VALIDATION_OPTIONS_KEY = Symbol('validation:options');

export interface ValidationDecoratorOptions {
  skipValidation?: boolean;
  customErrorMessage?: string;
  validationService?: IValidationService;
}

export interface PropertyValidationRule {
  propertyKey: string;
  schema: Joi.Schema | z.ZodSchema<any>;
  options?: ValidationDecoratorOptions;
}

// Class decorator for validation
export function Validatable(options: ValidationDecoratorOptions = {}) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      public validationService: IValidationService;

      constructor(...args: any[]) {
        super(...args);
        this.validationService = options.validationService || createValidationService();
      }

      async validate(): Promise<Results<this>> {
        if (options.skipValidation) {
          return Results.ok(this);
        }

        const validationRules: PropertyValidationRule[] = Reflect.getMetadata(VALIDATION_RULES_KEY, this.constructor) || [];
        const classSchema: Joi.Schema | z.ZodSchema<any> = Reflect.getMetadata(VALIDATION_SCHEMA_KEY, this.constructor);

        // If class has a schema, validate the entire object
        if (classSchema) {
          if ('validate' in classSchema) {
            // Joi schema
            return await this.validationService.validateWithJoi<this>(classSchema as Joi.Schema, this);
          } else {
            // Zod schema
            return await this.validationService.validateWithZod<this>(classSchema as z.ZodSchema<this>, this);
          }
        }

        // Otherwise, validate individual properties
        const errors: string[] = [];
        for (const rule of validationRules) {
          const value = (this as any)[rule.propertyKey];
          let result: Results<any>;

          if ('validate' in rule.schema) {
            // Joi schema
            result = await this.validationService.validateWithJoi(rule.schema as Joi.Schema, value);
          } else {
            // Zod schema
            result = await this.validationService.validateWithZod(rule.schema as z.ZodSchema<any>, value);
          }

          if (!result.isOk) {
            errors.push(rule.options?.customErrorMessage || result.message || `Validation failed for ${rule.propertyKey}`);
          }
        }

        if (errors.length > 0) {
          return Results.validationError<this>(null, errors.join(', '));
        }

        return Results.ok(this);
      }
    };
  };
}

// Property decorator for individual field validation
export function ValidateProperty(schema: Joi.Schema | z.ZodSchema<any>, options: ValidationDecoratorOptions = {}) {
  return function (target: any, propertyKey: string) {
    const existingRules: PropertyValidationRule[] = Reflect.getMetadata(VALIDATION_RULES_KEY, target.constructor) || [];
    
    existingRules.push({
      propertyKey,
      schema,
      options
    });

    Reflect.defineMetadata(VALIDATION_RULES_KEY, existingRules, target.constructor);
  };
}

// Class schema decorator
export function ValidateWith(schema: Joi.Schema | z.ZodSchema<any>) {
  return function (target: any) {
    Reflect.defineMetadata(VALIDATION_SCHEMA_KEY, schema, target);
  };
}

// Method decorator for validating method parameters
export function ValidateParams(...schemas: (Joi.Schema | z.ZodSchema<any>)[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const validationService = createValidationService();

    descriptor.value = async function (...args: any[]) {
      // Validate each parameter against its corresponding schema
      for (let i = 0; i < schemas.length && i < args.length; i++) {
        const schema = schemas[i];
        const arg = args[i];

        let result: Results<any>;
        if ('validate' in schema) {
          // Joi schema
          result = await validationService.validateWithJoi(schema as Joi.Schema, arg);
        } else {
          // Zod schema
          result = await validationService.validateWithZod(schema as z.ZodSchema<any>, arg);
        }

        if (!result.isOk) {
          throw new Error(`Parameter validation failed for argument ${i}: ${result.message}`);
        }

        // Replace the argument with the validated/sanitized value
        if (result.returnValue !== undefined) {
          args[i] = result.returnValue;
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Method decorator for validating return values
export function ValidateReturn(schema: Joi.Schema | z.ZodSchema<any>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const validationService = createValidationService();

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      let validationResult: Results<any>;
      if ('validate' in schema) {
        // Joi schema
        validationResult = await validationService.validateWithJoi(schema as Joi.Schema, result);
      } else {
        // Zod schema
        validationResult = await validationService.validateWithZod(schema as z.ZodSchema<any>, result);
      }

      if (!validationResult.isOk) {
        throw new Error(`Return value validation failed: ${validationResult.message}`);
      }

      return validationResult.returnValue || result;
    };

    return descriptor;
  };
}

// Common validation decorators for specific field types
export const ValidateEmail = (options?: ValidationDecoratorOptions) => 
  ValidateProperty(Joi.string().email().required(), options);

export const ValidateUsername = (options?: ValidationDecoratorOptions) => 
  ValidateProperty(Joi.string().pattern(/^[a-zA-Z0-9_-]{3,30}$/).required(), options);

export const ValidatePassword = (options?: ValidationDecoratorOptions) => 
  ValidateProperty(Joi.string().pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required(), options);

export const ValidateUUID = (options?: ValidationDecoratorOptions) => 
  ValidateProperty(Joi.string().uuid().required(), options);

export const ValidatePhone = (options?: ValidationDecoratorOptions) => 
  ValidateProperty(Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(), options);

export const ValidateRequired = (options?: ValidationDecoratorOptions) => 
  ValidateProperty(Joi.any().required(), options);

export const ValidateOptional = (schema: Joi.Schema | z.ZodSchema<any>, options?: ValidationDecoratorOptions) => 
  ValidateProperty(schema, options);

// Example usage classes
@Validatable()
export class ValidatedUser {
  @ValidateEmail()
  email!: string;

  @ValidateUsername()
  username!: string;

  @ValidatePassword()
  password!: string;

  @ValidateUUID()
  tenantId!: string;

  @ValidateProperty(Joi.string().min(1).max(100).required())
  firstName!: string;

  @ValidateProperty(Joi.string().min(1).max(100).required())
  lastName!: string;

  @ValidatePhone()
  phone?: string;

  @ValidateProperty(Joi.date().max('now').optional())
  dateOfBirth?: Date;
}

@ValidateWith(Joi.object({
  name: Joi.string().min(1).max(200).required(),
  domain: Joi.string().domain().optional(),
  maxUsers: Joi.number().integer().min(1).optional(),
  subscriptionTier: Joi.string().valid('basic', 'premium', 'enterprise').optional()
}))
export class ValidatedTenant {
  name!: string;
  domain?: string;
  maxUsers?: number;
  subscriptionTier?: 'basic' | 'premium' | 'enterprise';
}

// Service class with method validation
export class ValidatedUserService {
  @ValidateParams(
    Joi.string().email().required(),
    Joi.string().uuid().required()
  )
  @ValidateReturn(Joi.object({
    id: Joi.string().uuid().required(),
    email: Joi.string().email().required(),
    tenantId: Joi.string().uuid().required()
  }))
  async createUser(email: string, tenantId: string): Promise<{ id: string; email: string; tenantId: string }> {
    // Implementation would go here
    return {
      id: 'generated-uuid',
      email,
      tenantId
    };
  }

  @ValidateParams(Joi.string().uuid().required())
  async deleteUser(userId: string): Promise<boolean> {
    // Implementation would go here
    return true;
  }
}