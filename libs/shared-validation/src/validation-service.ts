import Joi from 'joi';
import { z } from 'zod';
import validator from 'validator';
import { Results } from '@strengthos/shared-utils';
import { ValidationResult, ValidationError, JoiSchemas, ZodSchemas } from './validation-schemas';

export interface IValidationService {
  // Joi validation methods
  validateWithJoi<T>(schema: Joi.Schema, data: any): Promise<Results<T>>;
  validateUserCreation(data: any): Promise<Results<any>>;
  validateUserUpdate(data: any): Promise<Results<any>>;
  validateLogin(data: any): Promise<Results<any>>;
  validateTenantCreation(data: any): Promise<Results<any>>;
  validatePagination(data: any): Promise<Results<any>>;

  // Zod validation methods
  validateWithZod<T>(schema: z.ZodSchema<T>, data: any): Promise<Results<T>>;
  
  // Individual field validation
  validateEmail(email: string): ValidationResult<string>;
  validateUsername(username: string): ValidationResult<string>;
  validatePassword(password: string): ValidationResult<string>;
  validatePhone(phone: string): ValidationResult<string>;
  validateUUID(uuid: string): ValidationResult<string>;
  
  // Sanitization methods
  sanitizeString(input: string, options?: SanitizeOptions): string;
  sanitizeEmail(email: string): string;
  sanitizeHtml(html: string): string;
  
  // Custom validation helpers
  isValidDateRange(startDate: Date, endDate: Date): boolean;
  isValidAge(dateOfBirth: Date, minAge?: number, maxAge?: number): boolean;
  isStrongPassword(password: string): boolean;
  
  // Batch validation
  validateBatch<T>(validations: BatchValidation<T>[]): Promise<Results<T[]>>;
}

export interface SanitizeOptions {
  trim?: boolean;
  toLowerCase?: boolean;
  removeSpecialChars?: boolean;
  maxLength?: number;
}

export interface BatchValidation<T> {
  schema: Joi.Schema | z.ZodSchema<T>;
  data: any;
  identifier?: string;
}

export class ValidationService implements IValidationService {
  
  // Joi validation methods
  async validateWithJoi<T>(schema: Joi.Schema, data: any): Promise<Results<T>> {
    try {
      const { error, value } = schema.validate(data, { 
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const validationErrors: ValidationError[] = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        return Results.validationError<T>(
          null, 
          `Validation failed: ${validationErrors.map(e => e.message).join(', ')}`
        );
      }

      return Results.ok<T>(value);
    } catch (error) {
      return Results.error<T>(null, `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateUserCreation(data: any): Promise<Results<any>> {
    return this.validateWithJoi(JoiSchemas.createUser, data);
  }

  async validateUserUpdate(data: any): Promise<Results<any>> {
    return this.validateWithJoi(JoiSchemas.updateUser, data);
  }

  async validateLogin(data: any): Promise<Results<any>> {
    return this.validateWithJoi(JoiSchemas.login, data);
  }

  async validateTenantCreation(data: any): Promise<Results<any>> {
    return this.validateWithJoi(JoiSchemas.createTenant, data);
  }

  async validatePagination(data: any): Promise<Results<any>> {
    return this.validateWithJoi(JoiSchemas.pagination, data);
  }

  // Zod validation methods
  async validateWithZod<T>(schema: z.ZodSchema<T>, data: any): Promise<Results<T>> {
    try {
      const result = schema.safeParse(data);
      
      if (!result.success) {
        const validationErrors: ValidationError[] = result.error.errors.map(error => ({
          field: error.path.join('.'),
          message: error.message,
          value: error.code
        }));

        return Results.validationError<T>(
          null,
          `Validation failed: ${validationErrors.map(e => e.message).join(', ')}`
        );
      }

      return Results.ok<T>(result.data);
    } catch (error) {
      return Results.error<T>(null, `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Individual field validation
  validateEmail(email: string): ValidationResult<string> {
    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        errors: [{ field: 'email', message: 'Email is required' }]
      };
    }

    if (!validator.isEmail(email)) {
      return {
        isValid: false,
        errors: [{ field: 'email', message: 'Email must be a valid email address', value: email }]
      };
    }

    return {
      isValid: true,
      data: email.toLowerCase().trim()
    };
  }

  validateUsername(username: string): ValidationResult<string> {
    if (!username || typeof username !== 'string') {
      return {
        isValid: false,
        errors: [{ field: 'username', message: 'Username is required' }]
      };
    }

    if (username.length < 3 || username.length > 30) {
      return {
        isValid: false,
        errors: [{ field: 'username', message: 'Username must be between 3 and 30 characters', value: username }]
      };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return {
        isValid: false,
        errors: [{ field: 'username', message: 'Username must contain only letters, numbers, underscores, and hyphens', value: username }]
      };
    }

    return {
      isValid: true,
      data: username.trim()
    };
  }

  validatePassword(password: string): ValidationResult<string> {
    if (!password || typeof password !== 'string') {
      return {
        isValid: false,
        errors: [{ field: 'password', message: 'Password is required' }]
      };
    }

    if (password.length < 8) {
      return {
        isValid: false,
        errors: [{ field: 'password', message: 'Password must be at least 8 characters long' }]
      };
    }

    if (!this.isStrongPassword(password)) {
      return {
        isValid: false,
        errors: [{ field: 'password', message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }]
      };
    }

    return {
      isValid: true,
      data: password
    };
  }

  validatePhone(phone: string): ValidationResult<string> {
    if (!phone) {
      return { isValid: true, data: '' }; // Phone is optional
    }

    if (!validator.isMobilePhone(phone, 'any', { strictMode: false })) {
      return {
        isValid: false,
        errors: [{ field: 'phone', message: 'Phone number must be in valid format', value: phone }]
      };
    }

    return {
      isValid: true,
      data: phone.trim()
    };
  }

  validateUUID(uuid: string): ValidationResult<string> {
    if (!uuid || typeof uuid !== 'string') {
      return {
        isValid: false,
        errors: [{ field: 'uuid', message: 'UUID is required' }]
      };
    }

    if (!validator.isUUID(uuid)) {
      return {
        isValid: false,
        errors: [{ field: 'uuid', message: 'Must be a valid UUID', value: uuid }]
      };
    }

    return {
      isValid: true,
      data: uuid.toLowerCase()
    };
  }

  // Sanitization methods
  sanitizeString(input: string, options: SanitizeOptions = {}): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    if (options.trim !== false) {
      sanitized = sanitized.trim();
    }

    if (options.toLowerCase) {
      sanitized = sanitized.toLowerCase();
    }

    if (options.removeSpecialChars) {
      sanitized = sanitized.replace(/[^\w\s-]/g, '');
    }

    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    return sanitized;
  }

  sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '';
    }

    return validator.normalizeEmail(email, {
      gmail_lowercase: true,
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_lowercase: true,
      outlookdotcom_remove_subaddress: false,
      yahoo_lowercase: true,
      yahoo_remove_subaddress: false,
      icloud_lowercase: true,
      icloud_remove_subaddress: false
    }) || '';
  }

  sanitizeHtml(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    // Basic HTML sanitization - remove script tags and dangerous attributes
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '');
  }

  // Custom validation helpers
  isValidDateRange(startDate: Date, endDate: Date): boolean {
    if (!startDate || !endDate) {
      return false;
    }

    return startDate <= endDate;
  }

  isValidAge(dateOfBirth: Date, minAge: number = 13, maxAge: number = 120): boolean {
    if (!dateOfBirth) {
      return false;
    }

    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      return age - 1 >= minAge && age - 1 <= maxAge;
    }

    return age >= minAge && age <= maxAge;
  }

  isStrongPassword(password: string): boolean {
    if (!password || password.length < 8) {
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }

  // Batch validation
  async validateBatch<T>(validations: BatchValidation<T>[]): Promise<Results<T[]>> {
    try {
      const results: T[] = [];
      const errors: ValidationError[] = [];

      for (const validation of validations) {
        let result: Results<T>;

        if ('validate' in validation.schema) {
          // Joi schema
          result = await this.validateWithJoi<T>(validation.schema as Joi.Schema, validation.data);
        } else {
          // Zod schema
          result = await this.validateWithZod<T>(validation.schema as z.ZodSchema<T>, validation.data);
        }

        if (result.isOk && result.returnValue !== undefined && result.returnValue !== null) {
          results.push(result.returnValue as T);
        } else {
          errors.push({
            field: validation.identifier || 'batch',
            message: result.message || 'Validation failed'
          });
        }
      }

      if (errors.length > 0) {
        return Results.validationError<T[]>(
          null,
          `Batch validation failed: ${errors.map(e => e.message).join(', ')}`
        );
      }

      return Results.ok<T[]>(results);
    } catch (error) {
      return Results.error<T[]>(null, `Batch validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Factory function for creating validation service
export function createValidationService(): IValidationService {
  return new ValidationService();
}