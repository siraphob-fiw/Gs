import { HttpStatus } from '@nestjs/common';
import {
  ErrorCategory,
  ErrorSeverity,
  ValidationError,
} from '@strengthos/shared-types';
import { BaseException, ErrorContext } from './base.exception';

export class ValidationException extends BaseException {
  public readonly validationErrors: ValidationError[];

  constructor(
    message: string,
    validationErrors: ValidationError[] = [],
    context?: ErrorContext,
  ) {
    super(
      {
        code: 'VALIDATION_ERROR',
        message,
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.LOW,
        context,
        metadata: { validationErrors },
      },
      HttpStatus.BAD_REQUEST,
    );

    this.validationErrors = validationErrors;
  }

  public getErrorResponse() {
    return {
      ...super.getErrorResponse(),
      validationErrors: this.validationErrors,
    };
  }
}

export class InvalidInputException extends ValidationException {
  constructor(
    field: string,
    value: any,
    expectedFormat: string,
    context?: ErrorContext,
  ) {
    const validationError: ValidationError = {
      field,
      message: `Invalid value '${value}' for field '${field}'. Expected: ${expectedFormat}`,
      code: 'INVALID_INPUT',
    };

    super(`Invalid input for field '${field}'`, [validationError], context);
  }
}

export class MissingRequiredFieldException extends ValidationException {
  constructor(field: string, context?: ErrorContext) {
    const validationError: ValidationError = {
      field,
      message: `Field '${field}' is required`,
      code: 'REQUIRED_FIELD_MISSING',
    };

    super(`Missing required field: ${field}`, [validationError], context);
  }
}

export class InvalidFormatException extends ValidationException {
  constructor(field: string, format: string, context?: ErrorContext) {
    const validationError: ValidationError = {
      field,
      message: `Field '${field}' must be in format: ${format}`,
      code: 'INVALID_FORMAT',
    };

    super(`Invalid format for field '${field}'`, [validationError], context);
  }
}

export class ValueOutOfRangeException extends ValidationException {
  constructor(
    field: string,
    value: any,
    min?: number,
    max?: number,
    context?: ErrorContext,
  ) {
    const range =
      min !== undefined && max !== undefined
        ? `between ${min} and ${max}`
        : min !== undefined
          ? `greater than or equal to ${min}`
          : `less than or equal to ${max}`;

    const validationError: ValidationError = {
      field,
      message: `Value '${value}' for field '${field}' must be ${range}`,
      code: 'VALUE_OUT_OF_RANGE',
    };

    super(
      `Value out of range for field '${field}'`,
      [validationError],
      context,
    );
  }
}
