import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsUUID,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsDateString,
  Matches,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Decorator for UUID fields with Swagger documentation
 */
export function ApiUuid(options?: any) {
  return applyDecorators(
    ApiProperty({
      type: String,
      description: 'UUID identifier',
      example: '123e4567-e89b-12d3-a456-426614174000',
      format: 'uuid',
      ...options,
    }),
    IsUUID(),
  );
}

/**
 * Decorator for optional UUID fields with Swagger documentation
 */
export function ApiOptionalUuid(options?: any) {
  return applyDecorators(
    ApiPropertyOptional({
      type: String,
      description: 'UUID identifier',
      example: '123e4567-e89b-12d3-a456-426614174000',
      format: 'uuid',
      ...options,
    }),
    IsOptional(),
    IsUUID(),
  );
}

/**
 * Decorator for email fields with Swagger documentation
 */
export function ApiEmail(options?: any) {
  return applyDecorators(
    ApiProperty({
      type: String,
      description: 'Email address',
      example: 'user@example.com',
      format: 'email',
      ...options,
    }),
    IsEmail(),
  );
}

/**
 * Decorator for optional email fields with Swagger documentation
 */
export function ApiOptionalEmail(options?: any) {
  return applyDecorators(
    ApiPropertyOptional({
      type: String,
      description: 'Email address',
      example: 'user@example.com',
      format: 'email',
      ...options,
    }),
    IsOptional(),
    IsEmail(),
  );
}

/**
 * Decorator for string fields with length validation and Swagger documentation
 */
export function ApiString(
  minLength?: number,
  maxLength?: number,
  options?: any,
) {
  const decorators = [
    ApiProperty({
      type: String,
      description: 'Text string',
      minLength,
      maxLength,
      ...options,
    }),
    IsString(),
  ];

  if (minLength !== undefined) {
    decorators.push(MinLength(minLength));
  }
  if (maxLength !== undefined) {
    decorators.push(MaxLength(maxLength));
  }

  return applyDecorators(...decorators);
}

/**
 * Decorator for optional string fields with length validation and Swagger documentation
 */
export function ApiOptionalString(
  minLength?: number,
  maxLength?: number,
  options?: any,
) {
  const decorators = [
    ApiPropertyOptional({
      type: String,
      description: 'Text string',
      minLength,
      maxLength,
      ...options,
    }),
    IsOptional(),
    IsString(),
  ];

  if (minLength !== undefined) {
    decorators.push(MinLength(minLength));
  }
  if (maxLength !== undefined) {
    decorators.push(MaxLength(maxLength));
  }

  return applyDecorators(...decorators);
}

/**
 * Decorator for password fields with Swagger documentation
 */
export function ApiPassword(minLength = 6, options?: any) {
  return applyDecorators(
    ApiProperty({
      type: String,
      description: 'Password',
      example: 'SecurePassword123!',
      minLength,
      format: 'password',
      ...options,
    }),
    IsString(),
    MinLength(minLength),
    Matches(
      new RegExp(
        `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#\\-_$%^&+=§!?])[A-Za-z\\d@#\\-_$%^&+=§!?]{${minLength},20}$`,
      ),
      {
        message: [
          'Password must meet the following requirements:',
          `- At least ${minLength} characters in length`,
          '- At least one uppercase letter',
          '- At least one lowercase letter',
          '- At least one number',
          '- At least one special character (@#-_$%^&+=§!?)',
        ].join('\n'),
      },
    ),
  );
}

/**
 * Decorator for enum fields with Swagger documentation
 */
export function ApiEnum<T extends Record<string, any>>(
  enumObject: T,
  options?: any,
) {
  return applyDecorators(
    ApiProperty({
      description: 'Enumerated value',
      enum: enumObject,
      ...options,
    }),
    IsEnum(enumObject),
  );
}

/**
 * Decorator for optional enum fields with Swagger documentation
 */
export function ApiOptionalEnum<T extends Record<string, any>>(
  enumObject: T,
  options?: any,
) {
  return applyDecorators(
    ApiPropertyOptional({
      description: 'Enumerated value',
      enum: enumObject,
      ...options,
    }),
    IsOptional(),
    IsEnum(enumObject),
  );
}

/**
 * Decorator for boolean fields with Swagger documentation
 */
export function ApiBoolean(options?: any) {
  return applyDecorators(
    ApiProperty({
      type: Boolean,
      description: 'Boolean value',
      example: true,
      ...options,
    }),
    IsBoolean(),
  );
}

/**
 * Decorator for optional boolean fields with Swagger documentation
 */
export function ApiOptionalBoolean(options?: any) {
  return applyDecorators(
    ApiPropertyOptional({
      type: Boolean,
      description: 'Boolean value',
      example: false,
      ...options,
    }),
    IsOptional(),
    IsBoolean(),
  );
}

/**
 * Decorator for number fields with range validation and Swagger documentation
 */
export function ApiNumber(min?: number, max?: number, options?: any) {
  const decorators = [
    ApiProperty({
      type: Number,
      description: 'Numeric value',
      minimum: min,
      maximum: max,
      ...options,
    }),
    IsNumber(),
  ];

  if (min !== undefined) {
    decorators.push(Min(min));
  }
  if (max !== undefined) {
    decorators.push(Max(max));
  }

  return applyDecorators(...decorators);
}

/**
 * Decorator for optional number fields with range validation and Swagger documentation
 */
export function ApiOptionalNumber(min?: number, max?: number, options?: any) {
  const decorators = [
    ApiPropertyOptional({
      type: Number,
      description: 'Numeric value',
      minimum: min,
      maximum: max,
      ...options,
    }),
    IsOptional(),
    IsNumber(),
  ];

  if (min !== undefined) {
    decorators.push(Min(min));
  }
  if (max !== undefined) {
    decorators.push(Max(max));
  }

  return applyDecorators(...decorators);
}

/**
 * Decorator for date string fields with Swagger documentation
 */
export function ApiDateString(options?: any) {
  return applyDecorators(
    ApiProperty({
      type: String,
      description: 'Date string in ISO format',
      example: '2024-01-01T00:00:00.000Z',
      format: 'date-time',
      ...options,
    }),
    IsDateString(),
  );
}

/**
 * Decorator for optional date string fields with Swagger documentation
 */
export function ApiOptionalDateString(options?: any) {
  return applyDecorators(
    ApiPropertyOptional({
      type: String,
      description: 'Date string in ISO format',
      example: '2024-01-01T00:00:00.000Z',
      format: 'date-time',
      ...options,
    }),
    IsOptional(),
    IsDateString(),
  );
}

/**
 * Decorator for array fields with Swagger documentation
 */
export function ApiArray<T>(itemType: new () => T, options?: any) {
  return applyDecorators(
    ApiProperty({
      description: 'Array of items',
      type: [itemType],
      isArray: true,
      ...options,
    }),
    IsArray(),
    ValidateNested({ each: true }),
    Type(() => itemType),
  );
}

/**
 * Decorator for optional array fields with Swagger documentation
 */
export function ApiOptionalArray<T>(itemType: new () => T, options?: any) {
  return applyDecorators(
    ApiPropertyOptional({
      description: 'Array of items',
      type: [itemType],
      isArray: true,
      ...options,
    }),
    IsOptional(),
    IsArray(),
    ValidateNested({ each: true }),
    Type(() => itemType),
  );
}

/**
 * Decorator for nested object fields with Swagger documentation
 */
export function ApiObject<T>(objectType: new () => T, options?: any) {
  return applyDecorators(
    ApiProperty({
      description: 'Nested object',
      type: objectType,
      ...options,
    }),
    ValidateNested(),
    Type(() => objectType),
  );
}

/**
 * Decorator for optional nested object fields with Swagger documentation
 */
export function ApiOptionalObject<T>(objectType: new () => T, options?: any) {
  return applyDecorators(
    ApiPropertyOptional({
      description: 'Nested object',
      type: objectType,
      ...options,
    }),
    IsOptional(),
    ValidateNested(),
    Type(() => objectType),
  );
}
