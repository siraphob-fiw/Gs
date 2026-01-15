import { HttpStatus } from '@nestjs/common';
import { ErrorCategory, ErrorSeverity } from '@strengthos/shared-types';
import { BaseException, ErrorContext } from './base.exception';

export class BusinessLogicException extends BaseException {
  constructor(
    message: string,
    code: string = 'BUSINESS_LOGIC_ERROR',
    context?: ErrorContext,
    metadata?: Record<string, any>,
  ) {
    super(
      {
        code,
        message,
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        context,
        metadata,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvalidOperationException extends BusinessLogicException {
  constructor(operation: string, reason: string, context?: ErrorContext) {
    super(
      `Invalid operation '${operation}': ${reason}`,
      'INVALID_OPERATION',
      context,
      { operation, reason },
    );
  }
}

export class ResourceConflictException extends BusinessLogicException {
  constructor(
    resource: string,
    conflictReason: string,
    context?: ErrorContext,
  ) {
    super(
      `Resource conflict for '${resource}': ${conflictReason}`,
      'RESOURCE_CONFLICT',
      context,
      { resource, conflictReason },
    );

    this.getStatus = () => HttpStatus.CONFLICT;
  }
}

export class BusinessRuleViolationException extends BusinessLogicException {
  constructor(rule: string, violation: string, context?: ErrorContext) {
    super(
      `Business rule violation '${rule}': ${violation}`,
      'BUSINESS_RULE_VIOLATION',
      context,
      { rule, violation },
    );
  }
}

// InsufficientPermissionsException moved to authorization.exception.ts to avoid duplicate exports
